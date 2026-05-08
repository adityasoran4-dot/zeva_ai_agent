import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import Billing from "../../../models/Billing";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import dayjs from"dayjs";
import mongoose from "mongoose";
import { isNewClinicInMockPeriod, generateMockDoctorPerformance } from "../../../lib/mockDataGenerator";

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

  // GET: Fetch doctor performance data
  if (req.method === "GET") {
    try {
      // Get clinic to check registeredAt
      const clinic = await Clinic.findById(clinicId);
      
      // Check if clinic is within 2-day mock data period
      const isInMockPeriod = isNewClinicInMockPeriod(clinic?.registeredAt);
      
      // If in mock period, check if they have any real appointment data
      let hasRealData = false;
      if (isInMockPeriod && clinic) {
        const { filter, date, startDate, endDate } = req.query;
        let queryStartDate = null;
        let queryEndDate = null;

        if (filter === 'today') {
          const baseDate = date ? dayjs(date) : dayjs();
          queryStartDate = baseDate.startOf('day').toDate();
          queryEndDate = baseDate.endOf('day').toDate();
        } else if (filter === 'week') {
          const end = date ? dayjs(date) : dayjs();
          const start = end.subtract(6, 'day');
          queryStartDate = start.startOf('day').toDate();
          queryEndDate = end.endOf('day').toDate();
        } else if (filter === 'month') {
          const end = date ? dayjs(date) : dayjs();
          const start = end.subtract(30, 'day');
          queryStartDate = start.startOf('day').toDate();
          queryEndDate = end.endOf('day').toDate();
        } else {
          const baseDate = dayjs();
          queryStartDate = baseDate.startOf('month').toDate();
          queryEndDate = baseDate.endOf('month').toDate();
        }

        if (startDate && endDate) {
          queryStartDate = dayjs(startDate).startOf('day').toDate();
          queryEndDate = dayjs(endDate).endOf('day').toDate();
        }

        const appointmentCount = await Appointment.countDocuments({
          clinicId,
          ...(queryStartDate && queryEndDate ? {
            startDate: { $gte: queryStartDate, $lte: queryEndDate }
          } : {})
        });
        
        hasRealData = appointmentCount > 0;
      }
      
      // If in mock period AND no real data, return mock data
      if (isInMockPeriod && !hasRealData) {
        console.log('📊 Returning mock doctor performance for new clinic:', clinicId);
        const mockData = generateMockDoctorPerformance();
        
        return res.status(200).json({
          success: true,
          data: mockData,
          isMockData: true,
          message: 'Showing sample doctor performance data for new clinic!',
        });
      }

      const { hasPermission, error: permError } = await checkClinicPermission(
    clinicId,
       "clinic_Appointment",  // Changed to match your clinic's module name
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
     let queryStartDate = null;
     let queryEndDate = null;

  if (filter === 'today') {
      const baseDate = date ? dayjs(date) : dayjs();
      queryStartDate = baseDate.startOf('day').toDate();
      queryEndDate = baseDate.endOf('day').toDate();
    } else if (filter === 'week') {
      // Last 7 days (including today)
      const end = date ? dayjs(date) : dayjs();
      const start = end.subtract(6, 'day');
      queryStartDate = start.startOf('day').toDate();
      queryEndDate = end.endOf('day').toDate();
    } else if (filter === 'month') {
      // Last 30 days
      const end = date ? dayjs(date) : dayjs();
      const start = end.subtract(30, 'day');
      queryStartDate = start.startOf('day').toDate();
      queryEndDate = end.endOf('day').toDate();
    } else if (filter === 'overall') {
      // Year-to-date to align with dashboard
      const end = date ? dayjs(date) : dayjs();
      const start = end.startOf('year');
      queryStartDate = start.startOf('day').toDate();
      queryEndDate = end.endOf('day').toDate();
    } else if (filter === 'all' || filter === 'lifetime') {
       // Lifetime: no date restrictions (all-time)
       queryStartDate = null;
       queryEndDate = null;
      } else {
       // Default to current month
    const baseDate = dayjs();
       queryStartDate = baseDate.startOf('month').toDate();
       queryEndDate = baseDate.endOf('month').toDate();
      }

    if (startDate && endDate) {
        queryStartDate = dayjs(startDate).startOf('day').toDate();
        queryEndDate = dayjs(endDate).endOf('day').toDate();
      }

    console.log('📅 Date Range:', { filter, queryStartDate, queryEndDate });

      // Fetch all appointments with doctor details
      const apptQuery = { clinicId, status: { $nin: ['Cancelled', 'Rejected'] } };
      if (queryStartDate && queryEndDate) {
        apptQuery.startDate = { $gte: queryStartDate, $lte: queryEndDate };
      }
  const appointments = await Appointment.find(apptQuery).lean();

  console.log('✅ Found', appointments.length, 'appointments');
     
  // Fetch ALL staff doctors for this clinic (baseline for zero revenue/appointments too)
 const staffDocs = await User.find({ 
      clinicId,
      role: 'doctorStaff'
    }).select('_id name email').lean();
 console.log('👨‍⚕️ Staff doctors in clinic:', staffDocs.length);
 
 // Create a map and a set for quick lookup of staff doctors
 const doctorMap = {};
 const staffDoctorIds = new Set();
 staffDocs.forEach(doc => {
   const key = doc._id.toString();
   staffDoctorIds.add(key);
   doctorMap[key] = {
     name: doc.name,
     email: doc.email
   };
 });
   
  if (appointments.length > 0) {
 console.log('🎯 Sample appointment doctorId:', appointments[0].doctorId.toString());
 console.log('🎯 Sample doctor from map:', doctorMap[appointments[0].doctorId.toString()]);
  }

      // 1. Appointments per Doctor (only staff doctors)
   const doctorAppointmentMap = {};
      
      appointments.forEach(apt => {
     if (!apt.doctorId) return;
        
    const doctorKey = apt.doctorId._id ? apt.doctorId._id.toString() : apt.doctorId.toString();
      // Skip non-staff doctors
      if (!staffDoctorIds.has(doctorKey)) return;
      
      // Get doctor info from our manual map
   const doctorInfo = doctorMap[doctorKey] || {};
        
     if (!doctorAppointmentMap[doctorKey]) {
         doctorAppointmentMap[doctorKey] = {
           doctorId: doctorKey,
           doctorName: doctorInfo.name || 'Unknown Doctor',
            doctorEmail: doctorInfo.email || '',
         appointmentCount: 0,
        completedAppointments: 0,
            pendingAppointments: 0
          };
        }
        
       doctorAppointmentMap[doctorKey].appointmentCount += 1;
        
     if (['Completed', 'Discharge', 'invoice'].includes(apt.status)) {
         doctorAppointmentMap[doctorKey].completedAppointments += 1;
        } else {
         doctorAppointmentMap[doctorKey].pendingAppointments += 1;
        }
      });

    // Ensure every staff doctor is present (for zero-appointment doctors)
    staffDocs.forEach(doc => {
      const id = doc._id.toString();
      if (!doctorAppointmentMap[id]) {
        doctorAppointmentMap[id] = {
          doctorId: id,
          doctorName: doctorMap[id]?.name || 'Unknown Doctor',
          doctorEmail: doctorMap[id]?.email || '',
          appointmentCount: 0,
          completedAppointments: 0,
          pendingAppointments: 0
        };
      }
    });

    const appointmentsPerDoctor = Object.values(doctorAppointmentMap)
        .sort((a, b) => b.appointmentCount - a.appointmentCount);

      // 2. Revenue per Doctor (REAL from Billing model)
      // Sum Billing.amount for invoices in range, joined to appointments to get doctorId
      let revenuePerDoctor = [];
      try {
        const billingMatch = { clinicId };
        if (queryStartDate && queryEndDate) {
          billingMatch.$or = [
            { invoicedDate: { $gte: queryStartDate, $lte: queryEndDate } },
            { createdAt: { $gte: queryStartDate, $lte: queryEndDate } },
          ];
        }
        const revenueAgg = await Billing.aggregate([
          { $match: billingMatch },
          // Exclude advance-only records
          { $match: { invoiceNumber: { $not: /^(PAST-ADV|ADV-)/ } } },
          // Join by appointmentId if present
          {
            $lookup: {
              from: "appointments",
              localField: "appointmentId",
              foreignField: "_id",
              as: "aptById",
            },
          },
          // Also join by patientId as a fallback for historical invoices without appointmentId
          {
            $lookup: {
              from: "appointments",
              localField: "patientId",
              foreignField: "patientId",
              as: "aptByPatient",
            },
          },
          {
            $addFields: {
              refApt: {
                $cond: [
                  { $gt: [{ $size: "$aptById" }, 0] },
                  { $arrayElemAt: ["$aptById", 0] },
                  { $arrayElemAt: ["$aptByPatient", 0] },
                ],
              },
            },
          },
          // Ensure appointment also belongs to same clinic (data hygiene)
          { $match: { "refApt.clinicId": clinicId } },
          {
            $group: {
              _id: "$refApt.doctorId",
              totalAmount: { $sum: { $ifNull: ["$paid", 0] } },
            },
          },
        ]);
        const revMap = new Map(
          revenueAgg
            .filter((r) => r._id && staffDoctorIds.has(String(r._id)))
            .map((r) => [String(r._id), Number(r.totalAmount || 0)])
        );
        // Build revenuePerDoctor array for ALL staff doctors (include zeros)
        revenuePerDoctor = staffDocs.map(doc => {
          const id = doc._id.toString();
          const appt = doctorAppointmentMap[id];
          return {
            ...appt,
            estimatedRevenue: revMap.get(id) || 0,
          };
        }).sort((a, b) => (b.estimatedRevenue || 0) - (a.estimatedRevenue || 0));
      } catch (e) {
        // If billing join fails, keep previous structure with zeros
        revenuePerDoctor = appointmentsPerDoctor.map((doctor) => ({
          ...doctor,
          estimatedRevenue: 0,
        }));
      }

      // 3. Doctor Performance Leaderboard (most booked doctors) - use REAL revenue
      const revenueMap = new Map(
        revenuePerDoctor.map((d) => [String(d.doctorId), Number(d.estimatedRevenue || 0)])
      );
      const leaderboardData = [...appointmentsPerDoctor]
        .map((doctor) => {
          const realRevenue = revenueMap.get(String(doctor.doctorId)) || 0;
          return {
            rank: 0, // Will be assigned after sorting
            doctorId: doctor.doctorId,
            doctorName: doctor.doctorName ? `Dr. ${doctor.doctorName}` : 'Unknown Doctor',
            appointmentCount: doctor.appointmentCount,
            completionRate:
              Math.round((doctor.completedAppointments / doctor.appointmentCount) * 100) || 0,
            // Performance Score = Completion Rate (0-100 scale)
            performanceScore:
              Math.round((doctor.completedAppointments / doctor.appointmentCount) * 100) || 0,
            estimatedRevenue: realRevenue,
          };
        })
        // Sort by performance score first, then by appointment count for tie-breaking
        .sort((a, b) => {
          if (b.performanceScore !== a.performanceScore) {
            return b.performanceScore - a.performanceScore; // Higher score first
          }
          return b.appointmentCount - a.appointmentCount; // More appointments first if same score
        })
        .slice(0, 10) // Top 10 doctors
        .map((doctor, index) => ({
          ...doctor,
          rank: index + 1 // Assign rank after sorting
        }));

      // 4. Revenue Trend (revenue vs target) for staff doctors within filter range
      const billingDateMatch = {};
      if (queryStartDate && queryEndDate) {
        billingDateMatch.$or = [
          { invoicedDate: { $gte: queryStartDate, $lte: queryEndDate } },
          { createdAt: { $gte: queryStartDate, $lte: queryEndDate } },
        ];
      }
      const groupByFormat =
        filter === 'overall' || filter === 'all' || filter === 'lifetime'
          ? '%Y-%m-01'
          : '%Y-%m-%d';
      const revenueTrendAgg = await Billing.aggregate([
        {
          $match: {
            clinicId,
            ...(Object.keys(billingDateMatch).length ? billingDateMatch : {}),
          },
        },
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'aptById',
          },
        },
        {
          $lookup: {
            from: 'appointments',
            localField: 'patientId',
            foreignField: 'patientId',
            as: 'aptByPatient',
          },
        },
        {
          $addFields: {
            refApt: {
              $cond: [
                { $gt: [{ $size: '$aptById' }, 0] },
                { $arrayElemAt: ['$aptById', 0] },
                { $arrayElemAt: ['$aptByPatient', 0] },
              ],
            },
            billDate: { $ifNull: ['$invoicedDate', '$createdAt'] },
          },
        },
        { $match: { 'refApt.clinicId': clinicId } },
        {
          $match: {
            'refApt.doctorId': { $in: Array.from(staffDoctorIds).map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: '$billDate' },
            },
            revenue: { $sum: { $ifNull: ['$paid', 0] } },
            target: { $sum: { $ifNull: ['$amount', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const revenueTrend = revenueTrendAgg.map((r) => ({
        name: r._id,
        revenue: r.revenue || 0,
        target: r.target || 0,
      }));

    return res.status(200).json({
        success: true,
        data: {
          appointmentsPerDoctor,
         revenuePerDoctor,
          leaderboardData,
          revenueTrend,
          summary: {
            totalAppointments: appointments.length,
            totalDoctors: appointmentsPerDoctor.length,
            averageAppointmentsPerDoctor: appointmentsPerDoctor.length > 0
              ? Math.round(appointments.length /appointmentsPerDoctor.length)
              : 0
          }
        }
      });

    } catch (error) {
    console.error("❌ Error fetching doctor performance data:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch doctor performance data",
        error: error.message
      });
    }
  }

 res.setHeader("Allow", ["GET"]);
 return res.status(405).json({ success: false, message: "Method not allowed" });
}
