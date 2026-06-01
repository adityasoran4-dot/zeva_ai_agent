import dbConnect from '../../../lib/database';
import Lead from '../../../models/Lead';
import Clinic from '../../../models/Clinic';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';
import { isNewClinicInMockPeriod, generateMockLeadStats } from '../../../lib/mockDataGenerator';

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

      const leadCount = await Lead.countDocuments({
        clinicId: clinic._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      hasRealData = leadCount > 0;
    }
    
    // If in mock period AND no real data, return mock data
    if (isInMockPeriod && !hasRealData) {
      console.log('📊 Returning mock lead stats for new clinic:', clinic._id);
      const mockData = generateMockLeadStats();
      
      return res.status(200).json({
        success: true,
        sourceData: mockData.sourceData,
        statusData: mockData.statusData,
        isMockData: true,
        message: 'Showing sample lead data for new clinic!',
      });
    }

    // Get filter type and date range from query
    const { filter, startDate, endDate, date } = req.query;
    
    let startOfDay, endOfDay;
    const now = new Date();

    console.log('Lead Stats Request - Filter:', filter, 'Date:', date, 'StartDate:', startDate, 'EndDate:', endDate);

    if (filter === 'today') {
      // Use provided date or default to today
      const queryDate = date ? new Date(date) : now;
      startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);
      console.log('Today Filter - Start:', startOfDay, 'End:', endOfDay);
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
      console.log('Month Filter - Start:', startOfDay, 'End:', endOfDay);
    } else if (filter === 'overall') {
      // For overall, show all data from beginning until now
      startOfDay = new Date(0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      console.log('Overall Filter - Start:', startOfDay, 'End:', endOfDay);
    } else {
      // Default to today if no filter specified
      startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
    }

    console.log('Final Date Range - Start:', startOfDay.toISOString(), 'End:', endOfDay.toISOString());

    // Aggregate leads by source
    const sourceStats = await Lead.aggregate([
      {
        $match: {
          clinicId: clinic._id,
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);

    // Aggregate leads by status
    const statusStats = await Lead.aggregate([
      {
        $match: {
          clinicId: clinic._id,
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Color palettes
    const sourceColors = {
      'Instagram': '#E4405F',
      'Facebook': '#1877F2',
      'Google': '#4285F4',
      'WhatsApp': '#25D366',
      'Walk-in': '#FFA500',
      'Website': '#4CAF50',
      'Other': '#9E9E9E'
    };

    const statusColors = {
      'New': '#4CAF50',
      'Contacted': '#2196F3',
      'Booked': '#FF9800',
      'Visited': '#9C27B0',
      'Follow-up': '#FFC107',
      'Not Interested': '#F44336',
      'Other': '#9E9E9E'
    };

    // Transform source data for pie chart
    const sourceData = [
      { name: 'Instagram', value: 0, fill: '#E4405F' },
      { name: 'Facebook', value: 0, fill: '#1877F2' },
      { name: 'Google', value: 0, fill: '#4285F4' },
      { name: 'WhatsApp', value: 0, fill: '#25D366' },
      { name: 'Walk-in', value: 0, fill: '#FFA500' },
      { name: 'Website', value: 0, fill: '#4CAF50' },
      { name: 'Other', value: 0, fill: '#9E9E9E' },
    ];

    sourceStats.forEach(stat => {
      const dataIndex = sourceData.findIndex(item => item.name === stat._id);
      if (dataIndex !== -1) {
        sourceData[dataIndex].value = stat.count;
      }
    });

    // Transform status data for pie chart
    const statusData = [
      { name: 'New', value: 0, fill: '#4CAF50' },
      { name: 'Contacted', value: 0, fill: '#2196F3' },
      { name: 'Booked', value: 0, fill: '#FF9800' },
      { name: 'Visited', value: 0, fill: '#9C27B0' },
      { name: 'Follow-up', value: 0, fill: '#FFC107' },
      { name: 'Not Interested', value: 0, fill: '#F44336' },
      { name: 'Other', value: 0, fill: '#9E9E9E' },
    ];

    statusStats.forEach(stat => {
      const dataIndex = statusData.findIndex(item => item.name === stat._id);
      if (dataIndex !== -1) {
        statusData[dataIndex].value = stat.count;
      }
    });

    res.status(200).json({ 
      success: true, 
      sourceData: sourceData.filter(item => item.value > 0),
      statusData: statusData.filter(item => item.value > 0),
      message: 'Lead stats fetched successfully',
      filter: filter || 'today'
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching lead stats' 
    });
  }
}
