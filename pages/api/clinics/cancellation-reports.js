import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import PatientRegistration from "../../../models/PatientRegistration";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import dayjs from"dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import { isNewClinicInMockPeriod, generateMockCancellationReports } from "../../../lib/mockDataGenerator";

dayjs.extend(isBetween);

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
   if (!user) {
     return res.status(401).json({ success: false, message: "Unauthorized" });
    }
   if (!["clinic", "doctor", "agent", "doctorStaff", "staff"].includes(user.role)) {
     return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch(error) {
   return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Get clinic ID from user
  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError || !clinicId) {
   return res.status(403).json({ 
      success: false,
      message: clinicError || "Unable to determine clinic access" 
    });
  }

  // GET: Fetch cancellation and no-show data
  if (req.method === "GET") {
  console.log('📡 Cancellation Reports API called with params:', req.query);
    try {
      // Get clinic to check registeredAt
      const clinic = await Clinic.findById(clinicId);
      
      // Check if clinic is within 2-day mock data period
      const isInMockPeriod = isNewClinicInMockPeriod(clinic?.registeredAt);
      
      // If in mock period, check if they have any real cancellation data
      let hasRealData = false;
      if (isInMockPeriod && clinic) {
        const { filter, date, startDate, endDate } = req.query;
        let queryStartDate;
        let queryEndDate;

        if (filter === 'today') {
          const baseDate = date ? dayjs(date) : dayjs();
          queryStartDate = baseDate.startOf('day').toDate();
          queryEndDate = baseDate.endOf('day').toDate();
        } else if (filter === 'week') {
          const baseDate = date ? dayjs(date) : dayjs();
          queryStartDate = baseDate.subtract(1, 'week').startOf('day').toDate();
          queryEndDate = baseDate.endOf('day').toDate();
        } else if (filter === 'month') {
          const baseDate = date ? dayjs(date) : dayjs();
          queryStartDate = baseDate.subtract(1, 'month').startOf('day').toDate();
          queryEndDate = baseDate.endOf('day').toDate();
        } else {
          queryStartDate = dayjs().subtract(1, 'month').startOf('day').toDate();
          queryEndDate = dayjs().endOf('day').toDate();
        }

        if (startDate && endDate) {
          queryStartDate = dayjs(startDate).startOf('day').toDate();
          queryEndDate = dayjs(endDate).endOf('day').toDate();
        }

        const cancellationCount = await Appointment.countDocuments({
          clinicId,
          status: { $in: ['Cancelled', 'No Show'] },
          startDate: { $gte: queryStartDate, $lte: queryEndDate }
        });
        
        hasRealData = cancellationCount > 0;
      }
      
      // If in mock period AND no real data, return mock data
      if (isInMockPeriod && !hasRealData) {
        console.log('📊 Returning mock cancellation reports for new clinic:', clinicId);
        const mockData = generateMockCancellationReports();
        
        return res.status(200).json({
          success: true,
          data: {
            cancellationTrend: mockData.cancellationTrend,
            cancellationReasons: mockData.cancellationReasons || [],
            noShowPatientList: mockData.noShowAppointments,
            cancelledAppointments: mockData.cancelledAppointments,
            noShowAppointments: mockData.noShowAppointments,
            summary: {
              totalCancellations: mockData.totalCancelled,
              totalNoShows: mockData.totalNoShow
            }
          },
          totalCancelled: mockData.totalCancelled,
          totalNoShow: mockData.totalNoShow,
          cancellationRate: mockData.cancellationRate,
          noShowRate: mockData.noShowRate,
          isMockData: true,
          message: 'Showing sample cancellation data for new clinic!',
        });
      }

     const { hasPermission, error: permError } = await checkClinicPermission(
       clinicId,
        "clinic_appointments",
        "read"
      );

     if (!hasPermission) {
       return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view this data",
        });
      }

     const { filter= 'month', date, startDate, endDate } = req.query;

      // Calculate date range based on filter
      let queryStartDate;
      let queryEndDate;

      if (filter === 'today') {
        const baseDate = date ? dayjs(date) : dayjs();
        queryStartDate = baseDate.startOf('day').toDate();
        queryEndDate = baseDate.endOf('day').toDate();
      } else if (filter === 'week') {
       const baseDate = date ? dayjs(date) : dayjs();
        queryStartDate = baseDate.subtract(1, 'week').startOf('day').toDate();
        queryEndDate = baseDate.endOf('day').toDate();
      } else if (filter === 'month') {
       const baseDate = date ? dayjs(date) : dayjs();
        queryStartDate = baseDate.subtract(1, 'month').startOf('day').toDate();
        queryEndDate = baseDate.endOf('day').toDate();
      } else if (filter === 'overall') {
        queryStartDate = dayjs().subtract(1, 'year').startOf('day').toDate();
        queryEndDate = dayjs().endOf('day').toDate();
      } else {
        queryStartDate = dayjs().subtract(1, 'month').startOf('day').toDate();
        queryEndDate = dayjs().endOf('day').toDate();
      }

     if (startDate && endDate) {
        queryStartDate = dayjs(startDate).startOf('day').toDate();
        queryEndDate = dayjs(endDate).endOf('day').toDate();
      }

      // Fetch appointments with Cancelled status
     const cancelledAppointments = await Appointment.find({
       clinicId,
        status: 'Cancelled',
        startDate: {
          $gte: queryStartDate,
          $lte: queryEndDate
        }
      }).populate('patientId', 'firstName lastName mobileNumber').lean();

      // Fetch appointments with No Show status
     const noShowAppointments = await Appointment.find({
       clinicId,
        status: 'No Show',
        startDate: {
          $gte: queryStartDate,
          $lte: queryEndDate
        }
      }).populate('patientId', 'firstName lastName mobileNumber').lean();

      // 1. Cancellation Trend Data (monthly breakdown)
     const cancellationTrend = [];
      const monthsToAnalyze = filter === 'today' ? 1 : filter === 'week' ? 1 : filter === 'month' ? 6 : 12;
      
      if (filter === 'today') {
        // Show only today's data as a single point
        const today = dayjs(queryStartDate);
        cancellationTrend.push({
          month: today.format('MMM DD'),
          cancellations: cancelledAppointments.length,
          noShows: noShowAppointments.length
        });
      } else {
        // Show monthly trend for other filters
        for(let i = monthsToAnalyze - 1; i >= 0; i--) {
         const monthStart = dayjs(queryEndDate).subtract(i, 'month').startOf('month');
         const monthEnd = monthStart.endOf('month');
          
         const monthCancellations = cancelledAppointments.filter(apt => 
            dayjs(apt.startDate).isBetween(monthStart, monthEnd, null, '[]')
          ).length;

         const monthNoShows = noShowAppointments.filter(apt => 
            dayjs(apt.startDate).isBetween(monthStart, monthEnd, null, '[]')
          ).length;

          cancellationTrend.push({
            month: monthStart.format('MMM'),
            cancellations: monthCancellations,
            noShows: monthNoShows
          });
        }
      }

      // 2. Cancellation Reasons Data - handle missing field gracefully
     const reasonCounts = {};
     const reasonLabels = [
        "Personal Emergency",
        "Schedule Conflict", 
        "Found Another Clinic",
        "Too Expensive",
        "Other"
      ];

      // Initialize all reasons with 0
     reasonLabels.forEach(reason => {
       reasonCounts[reason] = 0;
      });

      // Count reasons if field exists
      cancelledAppointments.forEach(apt => {
        try {
         const reason = apt.cancellationReason || "Other";
         if (reasonCounts.hasOwnProperty(reason)) {
           reasonCounts[reason]++;
          } else {
           reasonCounts["Other"]++;
          }
        } catch (e) {
          // If field doesn't exist, count as Other
         reasonCounts["Other"]++;
        }
      });

     const cancellationReasons = Object.entries(reasonCounts)
        .filter(([_, count]) => count > 0)
        .map(([reason, count]) => ({
         reason,
         count,
          percentage: Math.round((count / (cancelledAppointments.length || 1)) * 100) || 0
        }));

      // 3. No-Show Patient List (frequent no-shows)
     const patientNoShowMap = {};
      
      noShowAppointments.forEach(apt => {
       if (!apt.patientId) return;
        
       const patientKey = apt.patientId._id.toString();
        
       if (!patientNoShowMap[patientKey]) {
         patientNoShowMap[patientKey] = {
           patientId: patientKey,
           patientName: `${apt.patientId.firstName || ''} ${apt.patientId.lastName || ''}`.trim(),
            mobileNumber: apt.patientId.mobileNumber || '',
            noShowCount: 0,
            lastAppointment: apt.startDate
          };
        }
        
       patientNoShowMap[patientKey].noShowCount += 1;
        
       if (dayjs(apt.startDate).isAfter(dayjs(patientNoShowMap[patientKey].lastAppointment))) {
         patientNoShowMap[patientKey].lastAppointment = apt.startDate;
        }
      });

     const noShowPatientList = Object.values(patientNoShowMap)
        .filter(patient => patient.noShowCount >= 1)
        .sort((a, b) => b.noShowCount- a.noShowCount)
        .slice(0, 20)
        .map(patient => ({
          ...patient,
          lastAppointment: dayjs(patient.lastAppointment).format('MMM DD, YYYY')
        }));

     return res.status(200).json({
        success: true,
        data: {
          cancellationTrend,
          cancellationReasons,
          noShowPatientList,
          summary: {
            totalCancellations: cancelledAppointments.length,
            totalNoShows: noShowAppointments.length
          }
        }
      });

    } catch (error) {
     console.error("❌ Error fetching cancellation data:", error);
     console.error("Error stack:", error.stack);
     return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch cancellation data",
        error: error.message
      });
    }
  }

 res.setHeader("Allow", ["GET"]);
 return res.status(405).json({ success: false, message: "Method not allowed" });
}
