import dbConnect from '../../../lib/database';
import Billing from '../../../models/Billing';
import Clinic from '../../../models/Clinic';
import Service from '../../../models/Service';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';
import { isNewClinicInMockPeriod, generateMockBillingStats } from '../../../lib/mockDataGenerator';

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
    
    // If in mock period, check if they have any real billing data
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

      const billingCount = await Billing.countDocuments({
        clinicId: clinic._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      hasRealData = billingCount > 0;
    }
    
    // If in mock period AND no real data, return mock data
    if (isInMockPeriod && !hasRealData) {
      console.log('📊 Returning mock billing stats for new clinic:', clinic._id);
      const mockData = generateMockBillingStats();
      
      return res.status(200).json({
        success: true,
        topPackages: mockData.topPackages,
        topServices: mockData.topServices,
        isMockData: true,
        message: 'Showing sample billing data for new clinic!',
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

    // Get all services for this clinic to identify which treatments are actually services
    const clinicServices = await Service.find({ clinicId: clinic._id }).lean();
    const serviceNames = new Set(clinicServices.map(s => s.name));
    const serviceSlugs = new Set(clinicServices.map(s => s.serviceSlug));

    // Aggregate top 5 packages (based on billing count)
    const topPackagesStats = await Billing.aggregate([
      {
        $match: {
          clinicId: clinic._id,
          service: "Package",
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: "$package",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Aggregate all treatments (service: "Treatment")
    const allTreatmentsStats = await Billing.aggregate([
      {
        $match: {
          clinicId: clinic._id,
          service: "Treatment",
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: "$treatment",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Separate treatments into actual treatments and services based on Service model
    const servicesAsTreatments = allTreatmentsStats.filter(stat => {
      // Treatment names can be comma-separated if multiple were selected
      const treatmentNames = stat._id.split(',').map(name => name.trim());
      // Check if any of the treatment names match any service name or slug
      return treatmentNames.some(name => 
        serviceNames.has(name) || serviceSlugs.has(name)
      );
    });

    // Sort and limit to top 5 services (based on billing count)
    const topServicesStats = servicesAsTreatments
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Transform data for charts
    const topPackagesData = topPackagesStats.map((stat, index) => ({
      name: stat._id || 'Unknown',
      totalAmount: stat.totalAmount,
      count: stat.count,
      fill: getColorByIndex(index)
    }));

    const topServicesData = topServicesStats.map((stat, index) => ({
      name: stat._id || 'Unknown',
      totalAmount: stat.totalAmount,
      count: stat.count,
      fill: getColorByIndex(index)
    }));

    res.status(200).json({ 
      success: true, 
      topPackagesData,
      topServicesData,
      message: 'Billing stats fetched successfully',
      filter: filter || 'today'
    });
  } catch (error) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching billing stats' 
    });
  }
}

function getColorByIndex(index) {
  const colors = [
    '#0d9488', // teal-600
    '#dc2626', // red-600
    '#2563eb', // blue-600
    '#f59e0b', // amber-500
    '#7c3aed', // violet-600
    '#059669', // emerald-600
    '#db2777', // pink-600
    '#ea580c', // orange-600
    '#0891b2', // cyan-600
    '#4f46e5', // indigo-600
  ];
  return colors[index % colors.length];
}
