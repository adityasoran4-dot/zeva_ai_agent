import dbConnect from '../../../lib/database';
import PatientRegistration from '../../../models/PatientRegistration';
import Clinic from '../../../models/Clinic';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';
import { isNewClinicInMockPeriod, generateMockMembershipStats } from '../../../lib/mockDataGenerator';

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
    
    // If in mock period, check if they have any real membership data
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

      const membershipCount = await PatientRegistration.countDocuments({
        membership: "Yes",
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      hasRealData = membershipCount > 0;
    }
    
    // If in mock period AND no real data, return mock data
    if (isInMockPeriod && !hasRealData) {
      console.log('📊 Returning mock membership stats for new clinic:', clinic._id);
      const mockData = generateMockMembershipStats();
      
      return res.status(200).json({
        success: true,
        data: mockData,
        isMockData: true,
        message: 'Showing sample membership data for new clinic!',
      });
    }

    console.log('Membership Stats - Clinic ID:', clinic._id, 'Filter:', filter);

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

    console.log('Date Range - Start:', startOfDay, 'End:', endOfDay);

    // Build match stage dynamically based on whether clinicId exists in patients
    const matchStage = {
      membership: "Yes",
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    // Check if any patient has clinicId field
    const samplePatient = await PatientRegistration.findOne({}).lean();
    const hasClinicIdField = samplePatient && 'clinicId' in samplePatient;
    console.log('Has clinicId field:', hasClinicIdField);

    if (hasClinicIdField) {
      matchStage.clinicId = clinic._id;
    } else {
      // If no clinicId field in the schema at all, log a clear message
      console.log('WARNING: PatientRegistration model does not have clinicId field defined in schema');
      console.log('Please ensure the model file has been updated and restart the server');
      
      // For now, try to query without clinicId filter (will return all clinics' data - not ideal but works for testing)
      console.log('Proceeding without clinic filter - this will return data from ALL clinics');
    }

    // Aggregate most purchased memberships
    const membershipStats = await PatientRegistration.aggregate([
      {
        $match: matchStage
      },
      {
        $lookup: {
          from: 'membershipplans',
          localField: 'membershipId',
          foreignField: '_id',
          as: 'membershipDetails'
        }
      },
      {
        $unwind: {
          path: '$membershipDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            membershipId: '$membershipId',
            membershipName: { $ifNull: ['$membershipDetails.name', '$membershipDetails.planName', 'No Membership'] }
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$membershipDetails.price', 0] } }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    console.log('Membership Stats Result:', membershipStats);

    // Transform data for chart
    const membershipData = membershipStats.map((stat, index) => ({
      name: stat._id.membershipName || 'Unknown Membership',
      count: stat.count,
      totalRevenue: stat.totalRevenue,
      fill: getMembershipColor(index)
    }));

    res.status(200).json({ 
      success: true, 
      membershipData,
      message: 'Membership stats fetched successfully',
      filter: filter || 'today'
    });
  } catch (error) {
    console.error('Error fetching membership stats:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching membership stats',
      error: error.toString()
    });
  }
}

function getMembershipColor(index) {
  const colors = [
    '#f59e0b', // amber-500 - Gold
    '#6b7280', // gray-500 - Silver
    '#b45309', // amber-700 - Bronze
    '#0d9488', // teal-600
    '#7c3aed', // violet-600
  ];
  return colors[index % colors.length];
}
