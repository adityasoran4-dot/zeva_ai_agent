import dbConnect from '../../../lib/database';
import Billing from '../../../models/Billing';
import PatientRegistration from '../../../models/PatientRegistration';
import MembershipPlan from '../../../models/MembershipPlan';
import Clinic from '../../../models/Clinic';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';

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

    if (!clinic && !isAdmin) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    // Get filter type from query
    const { filter, startDate, endDate } = req.query;
    
    let startOfDay, endOfDay;
    const now = new Date();

    if (filter === 'today') {
      startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(now);
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
    } else {
      // overall or default
      startOfDay = new Date(0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
    }

    console.log('Fetching membership stats from Billing for clinic:', clinic?._id || 'Admin', 'Filter:', filter);

    // Step 1: Get all active patients with memberships (ignore date for patient registration)
    const patientQuery = {
      clinicId: clinic._id,
      membership: "Yes",
      membershipId: { $exists: true }
    };

    const patientsWithMembership = await PatientRegistration.find(patientQuery)
      .populate('membershipId')
      .lean();

    console.log('Found patients with membership:', patientsWithMembership.length);

    if (patientsWithMembership.length === 0) {
      return res.status(200).json({ 
        success: true, 
        membershipData: [],
        message: 'No memberships found',
        filter: filter || 'overall'
      });
    }

    // Step 2: Get all billings for these patients in the selected date range
    const patientIds = patientsWithMembership.map(p => p._id);
    
    const billingStats = await Billing.aggregate([
      {
        $match: {
          clinicId: clinic._id,
          patientId: { $in: patientIds },
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $lookup: {
          from: 'patientregistrations',
          localField: 'patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $unwind: '$patient'
      },
      {
        $group: {
          _id: '$patient.membershipId', // Group by membership ID
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ]);

    console.log('Billing stats found:', billingStats.length);

    // Step 3: Populate membership names
    const membershipIds = billingStats.map(stat => stat._id).filter(id => id);
    
    let membershipMap = {};
    if (membershipIds.length > 0) {
      const memberships = await MembershipPlan.find({ 
        _id: { $in: membershipIds } 
      }).lean();
      
      memberships.forEach(m => {
        membershipMap[m._id.toString()] = m.name;
      });
    }

    // Step 4: Transform and sort data
    let membershipBillingStats;
    
    if (billingStats.length === 0) {
      // No billings in this period - return empty array
      membershipBillingStats = [];
      console.log('No billing data found for this period');
    } else {
      membershipBillingStats = billingStats
        .map(stat => ({
          _id: membershipMap[stat._id?.toString()] || 'Unknown Membership',
          totalAmount: stat.totalAmount,
          count: stat.count,
          averageAmount: stat.averageAmount || 0
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by highest billing
        .slice(0, 5); // Top 5
    }

    console.log('Membership billing stats:', membershipBillingStats);
    console.log('Final membership data count:', membershipBillingStats.length);

    // Transform data for chart
    const colors = [
      '#f59e0b', // amber-500 - Gold
      '#6b7280', // gray-500 - Silver
      '#b45309', // amber-700 - Bronze
      '#0d9488', // teal-600
      '#7c3aed', // violet-600
    ];

    const membershipData = membershipBillingStats.map((stat, index) => ({
      name: stat._id,
      count: stat.count,
      totalRevenue: stat.totalAmount,
      averageAmount: stat.averageAmount,
      fill: colors[index % colors.length]
    }));

    res.status(200).json({ 
      success: true, 
      membershipData,
      message: 'Membership stats fetched successfully from Billing',
      filter: filter || 'overall'
    });
  } catch (error) {
    console.error('Error fetching membership stats:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching membership stats',
      error: error.toString()
    });
  }
}
