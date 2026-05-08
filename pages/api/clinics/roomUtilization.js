import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import Room from "../../../models/Room";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import dayjs from"dayjs";
import { isNewClinicInMockPeriod, generateMockRoomUtilization } from "../../../lib/mockDataGenerator";

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  let user;
  try {
    user= await getUserFromReq(req);
   if (!user) {
     return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Allow clinic, doctor, agent, doctorStaff, and staff roles
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

  // GET: Fetch room utilization data
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

        const appointmentCount = await Appointment.countDocuments({
          clinicId,
          startDate: { $gte: queryStartDate, $lte: queryEndDate }
        });
        
        hasRealData = appointmentCount > 0;
      }
      
      // If in mock period AND no real data, return mock data
      if (isInMockPeriod && !hasRealData) {
        console.log('📊 Returning mock room utilization for new clinic:', clinicId);
        const mockData = generateMockRoomUtilization();
        
        return res.status(200).json({
          success: true,
          utilizationData: mockData.utilizationData,
          averageUtilization: mockData.averageUtilization,
          totalRooms: mockData.totalRooms,
          isMockData: true,
          message: 'Showing sample room utilization data for new clinic!',
        });
      }

      // Check read permission
     const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_addRoom",
        "read"
      );

     if (!hasPermission) {
       return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view room utilization",
        });
      }

     const { filter= 'month', date, startDate, endDate } = req.query;

      // Calculate date range based on filter
      let queryStartDate;
      let queryEndDate;

      if (filter === 'today') {
        // Single day - today or selected date
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
        // For overall, get all time data (last 1 year)
        queryStartDate = dayjs().subtract(1, 'year').startOf('day').toDate();
        queryEndDate = dayjs().endOf('day').toDate();
      } else {
        // Default to month
        queryStartDate = dayjs().subtract(1, 'month').startOf('day').toDate();
        queryEndDate = dayjs().endOf('day').toDate();
      }

      // If specific dates are provided, use them
    if (startDate && endDate) {
        queryStartDate = dayjs(startDate).startOf('day').toDate();
        queryEndDate = dayjs(endDate).endOf('day').toDate();
      }

      // Fetch all rooms for this clinic
     const rooms = await Room.find({ clinicId }).lean();
      
     if (!rooms || rooms.length === 0) {
       return res.status(200).json({
          success: true,
          utilizationData: [],
          message: "No rooms found"
        });
      }

      // Fetch appointments within the date range
     const appointments = await Appointment.find({
        clinicId,
        roomId: { $in: rooms.map(r => r._id) },
        startDate: {
          $gte: queryStartDate,
          $lte: queryEndDate
        },
        status: { $nin: ['Cancelled', 'Rejected'] } // Exclude cancelled appointments
      }).lean();

      // Calculate total available hours per room (assuming 8-hour workday)
     const WORK_HOURS_PER_DAY = 8;
     const totalDays = Math.ceil((queryEndDate - queryStartDate) / (1000 * 60 * 60 * 24)) + 1;
     const totalAvailableHoursPerRoom = totalDays * WORK_HOURS_PER_DAY;

      // Calculate utilization for each room
     const roomUsageMap = {};
      
      rooms.forEach(room => {
        roomUsageMap[room._id.toString()] = {
          roomId: room._id,
          roomName: room.name,
          bookedHours: 0,
          appointmentCount: 0
        };
      });

      // Sum up the booked hours for each room
      appointments.forEach(appointment => {
       const roomIdStr = appointment.roomId.toString();
       if (roomUsageMap[roomIdStr]) {
          // Calculate duration in hours
         const fromTime = appointment.fromTime || "00:00";
         const toTime = appointment.toTime || "00:00";
          
         const [fromHour, fromMinute] = fromTime.split(':').map(Number);
         const [toHour, toMinute] = toTime.split(':').map(Number);
          
         const durationInHours = (toHour + toMinute / 60) - (fromHour + fromMinute / 60);
          
         if (durationInHours > 0) {
            roomUsageMap[roomIdStr].bookedHours += durationInHours;
            roomUsageMap[roomIdStr].appointmentCount += 1;
          }
        }
      });

      // Convert to utilization percentage
     const utilizationData = Object.values(roomUsageMap).map(room => {
       const utilizationPercentage = totalAvailableHoursPerRoom > 0
          ? Math.min((room.bookedHours / totalAvailableHoursPerRoom) * 100, 100)
          : 0;

       return {
          roomId: room.roomId,
          roomName: room.roomName,
          bookedHours: Math.round(room.bookedHours * 10) / 10,
          appointmentCount: room.appointmentCount,
          utilization: Math.round(utilizationPercentage),
          totalAvailableHours: totalAvailableHoursPerRoom
        };
      });

      // Sort by room name
      utilizationData.sort((a, b) => a.roomName.localeCompare(b.roomName));

     return res.status(200).json({
        success: true,
        utilizationData,
        dateRange: {
          startDate: queryStartDate,
          endDate: queryEndDate,
          totalDays
        },
        summary: {
          totalRooms: rooms.length,
          averageUtilization: utilizationData.length > 0
            ? Math.round(utilizationData.reduce((sum, r) => sum + r.utilization, 0) / utilizationData.length)
            : 0
        }
      });

    } catch (error) {
     console.error("Error fetching room utilization:", error);
     return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch room utilization data" 
      });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}
