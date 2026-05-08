import dbConnect from '../../../lib/database';
import Appointment from '../../../models/Appointment';
import Clinic from '../../../models/Clinic';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';
import { isNewClinicInMockPeriod, generateMockAppointmentStats } from '../../../lib/mockDataGenerator';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authUser = await getUserFromReq(req);
    
    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { clinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    let clinic = null;
    if (authUser.role === "clinic") {
      clinic = await Clinic.findOne({ owner: authUser._id });
    } else if (clinicId) {
      clinic = await Clinic.findById(clinicId);
    }

    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    // Check if clinic is within 2-day mock data period
    const isInMockPeriod = isNewClinicInMockPeriod(clinic.registeredAt);
    
    // If in mock period, check if they have any real activity
    let hasRealData = false;
    if (isInMockPeriod) {
      const { filter, startDate, endDate, date } = req.query;
      let startOfDay, endOfDay;
      const now = new Date();

      if (filter === 'today') {
        const queryDate = date ? new Date(date) : now;
        startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);
      } else if (filter === 'month') {
        if (startDate && endDate) {
          startOfDay = new Date(startDate);
          startOfDay.setHours(0, 0, 0, 0);
          endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
        } else {
          startOfDay = new Date(now.getFullYear(), now.getMonth(), 1);
          endOfDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
      } else if (filter === 'overall') {
        startOfDay = new Date(0);
        endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
      } else {
        startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
      }

      const appointmentCount = await Appointment.countDocuments({
        clinicId: clinic._id,
        startDate: { $gte: startOfDay, $lte: endOfDay }
      });
      
      hasRealData = appointmentCount > 0;
    }
    
    // If in mock period AND no real data, return mock data
    if (isInMockPeriod && !hasRealData) {
      const { filter } = req.query;
      console.log('📊 Returning mock appointment stats for new clinic:', clinic._id);
      const mockData = generateMockAppointmentStats(filter || 'today');
      
      return res.status(200).json({
        success: true,
        data: mockData,
        isMockData: true,
        message: 'Showing sample appointment data for new clinic!',
      });
    }

    // Get filter type and date range from query
    const { filter, startDate, endDate, date } = req.query;
    
    let startOfDay, endOfDay;
    const now = new Date();

    if (filter === 'today') {
      // Use provided date or default to today
      const queryDate = date ? new Date(date) : now;
      startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);
    } else if (filter === 'month') {
      // Use provided date range or default to current month
      if (startDate && endDate) {
        startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
      } else {
        startOfDay = new Date(now.getFullYear(), now.getMonth(), 1);
        endOfDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    } else if (filter === 'overall') {
      // For overall, show all data from beginning until now (no date restriction)
      startOfDay = new Date(0); // Unix epoch - represents beginning of time
      endOfDay = new Date(); // Current date/time
      endOfDay.setHours(23, 59, 59, 999); // End of today
    } else {
      // Default to today if no filter specified
      startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
    }

    // Aggregate appointments by status based on filter type
    let matchStage = {
      clinicId: clinic._id,
      startDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    const appointmentStats = await Appointment.aggregate([
      {
        $match: matchStage
      },
      {
        $group: {
          _id: { $toLower: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Transform aggregation result into chart format
    const chartData = [
      { name: 'Booked', value: 0, fill: '#3b82f6' },
      { name: 'Enquiry', value: 0, fill: '#06b6d4' },
      { name: 'Approved', value: 0, fill: '#22c55e' },
      { name: 'Arrived', value: 0, fill: '#84cc16' },
      { name: 'Consultation', value: 0, fill: '#eab308' },
      { name: 'Waiting', value: 0, fill: '#f97316' },
      { name: 'Rescheduled', value: 0, fill: '#a855f7' },
      { name: 'Discharge', value: 0, fill: '#ec4899' },
      { name: 'Completed', value: 0, fill: '#14b8a6' },
      { name: 'Rejected', value: 0, fill: '#64748b' },
      { name: 'Cancelled', value: 0, fill: '#ef4444' },
    ];

    // Fill in actual counts from aggregation (case-insensitive)
    appointmentStats.forEach(stat => {
      const statusLower = stat._id.toLowerCase();
      
      // Map lowercase status to proper case for display
      const statusMap = {
        'booked': 'Booked',
        'enquiry': 'Enquiry', 
        'approved': 'Approved',
        'arrived': 'Arrived',
        'consultation': 'Consultation',
        'waiting': 'Waiting',
        'rescheduled': 'Rescheduled',
        'discharge': 'Discharge',
        'completed': 'Completed',
        'rejected': 'Rejected',
        'cancelled': 'Cancelled'
      };
      
      const displayName = statusMap[statusLower];
      if (displayName) {
        const dataIndex = chartData.findIndex(item => item.name === displayName);
        if (dataIndex !== -1) {
          chartData[dataIndex].value = stat.count;
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      data: chartData,
      message: 'Appointment stats fetched successfully',
      filter: filter || 'today'
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching appointment stats' 
    });
  }
}
