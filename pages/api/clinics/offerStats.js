import dbConnect from '../../../lib/database';
import Offer from '../../../models/CreateOffer';
import Clinic from '../../../models/Clinic';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';
import { isNewClinicInMockPeriod, generateMockOfferStats } from '../../../lib/mockDataGenerator';

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
    
    // If in mock period, check if they have any real offer data
    let hasRealData = false;
    if (isInMockPeriod) {
      const offerCount = await Offer.countDocuments({
        clinicId: clinic._id
      });
      
      hasRealData = offerCount > 0;
    }
    
    // If in mock period AND no real data, return mock data
    if (isInMockPeriod && !hasRealData) {
      console.log('📊 Returning mock offer stats for new clinic:', clinic._id);
      const mockData = generateMockOfferStats();
      
      return res.status(200).json({
        success: true,
        offerStatusBreakdown: mockData.statusData.reduce((acc, item) => {
          acc[item.name] = item.value;
          return acc;
        }, {}),
        isMockData: true,
        message: 'Showing sample offer data for new clinic!',
      });
    }

    // Get filter type and date range from query
    const { filter, startDate, endDate, date } = req.query;
    
    let startOfDay, endOfDay;
    const now = new Date();

    if (filter === 'today') {
      const queryDate = date ? new Date(date) : now;
      startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);
    } else if (filter === 'week') {
      // Get the start of the week (Sunday) and end of the week (Saturday)
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      const diff = now.getDate() - currentDay; // Calculate days to subtract to get to Sunday
      
      startOfDay = new Date(now.setDate(diff));
      startOfDay.setHours(0, 0, 0, 0);
      
      endOfDay = new Date(now);
      endOfDay.setDate(diff + 6); // Add 6 days to get to Saturday
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

    // Aggregate offers by status based on filter
    const offerStats = await Offer.aggregate([
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
          _id: { $toLower: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Transform aggregation result into object format
    const offerStatusBreakdown = {};
    offerStats.forEach((stat) => {
      // Capitalize first letter for consistency
      const status = stat._id.charAt(0).toUpperCase() + stat._id.slice(1);
      offerStatusBreakdown[status] = stat.count;
    });

    res.status(200).json({ 
      success: true, 
      offerStatusBreakdown,
      message: 'Offer stats fetched successfully',
      filter: filter || 'today'
    });
  } catch (error) {
    console.error('Error fetching offer stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching offer stats' 
    });
  }
}
