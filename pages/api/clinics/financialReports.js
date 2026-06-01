import dbConnect from '../../../lib/database';
import mongoose from 'mongoose';
import Billing from '../../../models/Billing';
import Clinic from '../../../models/Clinic';
import Appointment from '../../../models/Appointment';
import DoctorProfile from '../../../models/DoctorProfile';
import Service from '../../../models/Service';
import { getUserFromReq } from '../lead-ms/auth';
import { getClinicIdFromUser } from '../lead-ms/permissions-helper';
import { isNewClinicInMockPeriod } from '../../../lib/mockDataGenerator';

// Helper function for random integers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

    // Get date range from query params or default to current year
    const { startDate, endDate, filter } = req.query;
    
    let startOfYear, endOfYear;
    
    // Simple date handling - always use current year to avoid errors
    const currentYear = new Date().getFullYear();
    startOfYear = new Date(currentYear, 0, 1);
    endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    // Check if clinic is within 2-day mock data period
    const isInMockPeriod = isNewClinicInMockPeriod(clinic.registeredAt);
    
    // If in mock period, check if they have any real billing data
    let hasRealData = false;
    if (isInMockPeriod) {
      const billingCount = await Billing.countDocuments({
        clinicId: clinic._id,
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      });
      
      hasRealData = billingCount > 0;
    }
    
    // If in mock period AND no real data, return mock data
    if (isInMockPeriod && !hasRealData) {
      console.log('📊 Returning mock financial reports for new clinic:', clinic._id);
      
      // Mock Revenue Trend (12 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const revenueTrendData = months.map(month => ({
        name: month,
        revenue: randomInt(5000, 20000),
        target: randomInt(15000, 30000)
      }));
      
      // Mock Payment Methods
      const paymentMethodsData = [
        { name: 'Card Payment', value: randomInt(25, 45) },
        { name: 'Cash', value: randomInt(20, 40) },
        { name: 'Online Transfer', value: randomInt(15, 35) },
        { name: 'Insurance', value: randomInt(10, 25) },
      ];
      
      // Mock Doctor Revenue
      const doctors = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];
      const doctorRevenueData = doctors.slice(0, randomInt(3, 5)).map(doctor => ({
        name: doctor,
        revenue: randomInt(5000, 25000),
        sessions: randomInt(15, 60)
      })).sort((a, b) => b.revenue - a.revenue);
      
      // Mock Top Services
      const services = ['General Consultation', 'Dental Checkup', 'Eye Examination', 'Physical Therapy', 'Lab Tests', 'X-Ray', 'Blood Test'];
      const topServicesData = services.slice(0, 5).map(service => ({
        name: service,
        sessions: randomInt(10, 50),
        revenue: randomInt(3000, 15000)
      }));
      
      return res.status(200).json({ 
        success: true, 
        revenueTrendData,
        paymentMethodsData,
        doctorRevenueData,
        topServicesData,
        isMockData: true,
        message: 'Showing sample financial data for new clinic!'
      });
    }

    try {
      // Only use custom dates if both are provided and valid
      if (startDate && endDate) {
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);
        
        if (!isNaN(customStart.getTime()) && !isNaN(customEnd.getTime())) {
          startOfYear = customStart;
          endOfYear = customEnd;
          
          // Calculate days difference for debugging
          const daysDiff = Math.round((endOfYear - startOfYear) / (1000 * 60 * 60 * 24));
          console.log(`✅ Using custom date range for filter: ${filter}`);
          console.log(`📅 Date range: ${startOfYear.toISOString()} to ${endOfYear.toISOString()} (${daysDiff} days)`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Date error, using default year range');
    }

    // 1. Monthly Revenue Trend (Revenue vs Target)
    let monthlyRevenueStats = [];
    try {
      monthlyRevenueStats = await Billing.aggregate([
        {
          $match: {
            clinicId: clinic._id,
            createdAt: {
              $gte: startOfYear,
              $lte: endOfYear
            }
          }
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            revenue: { $sum: "$paid" },
            target: { $sum: "$amount" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      console.log('✅ Revenue trend fetched successfully');
    } catch (err) {
      console.error('❌ Error in revenue aggregation:', err);
    }

    // Format monthly data with month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueTrendData = monthNames.map((name, index) => {
      const monthData = monthlyRevenueStats.find(stat => stat._id === index + 1);
      return {
        name,
        revenue: monthData ? monthData.revenue : 0,
        target: monthData ? monthData.target : 0
      };
    });

    // 2. Payment Methods Distribution - Count by payment method
    let paymentMethodsStats = [];
    try {
      paymentMethodsStats = await Billing.aggregate([
        {
          $match: {
            clinicId: clinic._id,
            createdAt: {
              $gte: startOfYear,
              $lte: endOfYear
            }
          }
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$paid" }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      console.log('💳 Payment Methods Stats:', paymentMethodsStats);
    } catch (err) {
      console.error('❌ Error in payment methods aggregation:', err);
    }

    // Format for Pie Chart with proper labels and colors
    const paymentMethodColors = {
      'Cash': '#10b981',
      'Card': '#3b82f6',
      'BT': '#f59e0b',
      'Tabby': '#8b5cf6',
      'Tamara': '#ec4899'
    };

    const paymentMethodsData = paymentMethodsStats.length > 0 
      ? (() => {
          // Calculate total count for percentage calculation
          const totalCount = paymentMethodsStats.reduce((sum, stat) => sum + stat.count, 0);
          
          return paymentMethodsStats.map(stat => ({
            name: stat._id === 'BT' ? 'Bank Transfer' : stat._id,
            value: totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0, // Calculate percentage
            count: stat.count,
            totalAmount: stat.totalAmount,
            color: paymentMethodColors[stat._id] || '#6b7280'
          }));
        })()
      : [
          { name: 'Card Payment', value: 35, color: '#3b82f6' },
          { name: 'Cash', value: 25, color: '#10b981' },
          { name: 'Online Transfer', value: 30, color: '#f59e0b' },
          { name: 'Tabby', value: 10, color: '#8b5cf6' }
        ];

    // 3. Doctor Revenue - Fetch from Billing model for staff doctors of this clinic
    let doctorRevenueStats = [];
    let clinicDoctors = [];
    let doctorNameMap = {};
    try {
      console.log('💰 Calculating Doctor Revenue from Billing model...');
      console.log('📅 Billing date range:', {
        start: startOfYear.toISOString(),
        end: endOfYear.toISOString(),
        filter: filter
      });
      
      // First, get all staff doctors for this clinic
      clinicDoctors = await mongoose.model('User').find({
        clinicId: clinic._id,
        role: 'doctorStaff'
      }).select('_id name email');
      
      console.log(`👨‍⚕️ Found ${clinicDoctors.length} staff doctors for this clinic`);
      
      if (clinicDoctors.length > 0) {
        const doctorIds = clinicDoctors.map(d => d._id);
        doctorNameMap = {};
        clinicDoctors.forEach(d => {
          doctorNameMap[d._id.toString()] = d.name;
        });
        
        // Aggregate billings where doctorId matches staff doctors, with robust ref to appointment
        doctorRevenueStats = await Billing.aggregate([
          {
            $match: {
              clinicId: clinic._id,
              $or: [
                { createdAt: { $gte: startOfYear, $lte: endOfYear } },
                { invoicedDate: { $gte: startOfYear, $lte: endOfYear } }
              ]
            }
          },
          // Link by appointmentId if present
          {
            $lookup: {
              from: 'appointments',
              localField: 'appointmentId',
              foreignField: '_id',
              as: 'aptById'
            }
          },
          // Fallback: link by patientId to any appointment in range
          {
            $lookup: {
              from: 'appointments',
              localField: 'patientId',
              foreignField: 'patientId',
              as: 'aptByPatient'
            }
          },
          {
            $addFields: {
              refApt: {
                $cond: [
                  { $gt: [{ $size: "$aptById" }, 0] },
                  { $arrayElemAt: ["$aptById", 0] },
                  { $arrayElemAt: ["$aptByPatient", 0] }
                ]
              }
            }
          },
          {
            $match: {
              'refApt.clinicId': clinic._id,
              'refApt.doctorId': { $in: doctorIds }
            }
          },
          {
            $group: {
              _id: '$refApt.doctorId',
              totalRevenue: { $sum: { $ifNull: ['$paid', 0] } },
              totalSessions: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'doctorUser'
            }
          },
          {
            $unwind: {
              path: '$doctorUser',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              _id: 1,
              totalRevenue: 1,
              totalSessions: 1,
              doctorName: {
                $ifNull: ['$doctorUser.name', 'Unknown Doctor']
              }
            }
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 10 }
        ]);
        
        console.log('👨‍⚕️ Doctor Revenue Stats:', doctorRevenueStats.length, 'doctors with revenue');
        if (doctorRevenueStats.length > 0) {
          console.log('💉 Sample doctor revenue data:', JSON.stringify(doctorRevenueStats[0], null, 2));
        } else {
          console.log('⚠️ No doctor revenue found in date range! Check if billings exist with doctor appointments.');
        }
      } else {
        console.log('⚠️ No staff doctors found for this clinic');
      }
    } catch (err) {
      console.error('❌ Error in doctor revenue aggregation:', err);
    }

    // Build doctorRevenueData including zero-revenue doctors
    const revenueMap = new Map(
      doctorRevenueStats.map((stat) => [
        stat._id?.toString(),
        { revenue: Number(stat.totalRevenue || 0), sessions: Number(stat.totalSessions || 0) }
      ])
    );
    let doctorRevenueData = (clinicDoctors || []).map((doc) => {
      const key = doc._id.toString();
      const totals = revenueMap.get(key) || { revenue: 0, sessions: 0 };
      return {
        name: doctorNameMap[key] || doc.name || 'Unknown Doctor',
        revenue: totals.revenue,
        sessions: totals.sessions
      };
    });
    // Sort by revenue desc for chart readability
    doctorRevenueData.sort((a, b) => b.revenue - a.revenue);
    
    console.log('📋 Final Doctor Revenue Data:', doctorRevenueData);

    // No dummy fallback; zero-revenue doctors are included above

    // 4. Top Services Revenue - EXACT same basis as Doctor Revenue
    // Use Billing joined to Appointments, filter to staff doctors (clinicDoctors)
    let topServicesStats = [];
    try {
      const doctorIds = (clinicDoctors || []).map(d => d._id);
      const matchStage = {
        clinicId: clinic._id,
        $or: [
          { createdAt: { $gte: startOfYear, $lte: endOfYear } },
          { invoicedDate: { $gte: startOfYear, $lte: endOfYear } }
        ],
        // Exclude advance/past-advance
        invoiceNumber: { $not: /^(PAST-ADV|ADV-)/ }
      };
      const pipeline = [
        { $match: matchStage },
        // Join by appointmentId if present
        {
          $lookup: {
            from: 'appointments',
            localField: 'appointmentId',
            foreignField: '_id',
            as: 'aptById'
          }
        },
        // Fallback by patientId
        {
          $lookup: {
            from: 'appointments',
            localField: 'patientId',
            foreignField: 'patientId',
            as: 'aptByPatient'
          }
        },
        {
          $addFields: {
            refApt: {
              $cond: [
                { $gt: [{ $size: "$aptById" }, 0] },
                { $arrayElemAt: ["$aptById", 0] },
                { $arrayElemAt: ["$aptByPatient", 0] }
              ]
            }
          }
        },
        { $match: { "refApt.clinicId": clinic._id } },
      ];
      // Filter to staff doctors if we have any
      if (doctorIds.length > 0) {
        pipeline.push({ $match: { "refApt.doctorId": { $in: doctorIds } } });
      }
      pipeline.push(
        {
          $project: {
            serviceName: {
              $trim: {
                input: {
                  $ifNull: [
                    {
                      $cond: [
                        { $ifNull: ["$treatment", false] },
                        "$treatment",
                        {
                          $cond: [
                            { $ifNull: ["$package", false] },
                            "$package",
                            "$service"
                          ]
                        }
                      ]
                    },
                    "Unknown Service"
                  ]
                }
              }
            },
            paid: { $ifNull: ["$paid", 0] }
          }
        },
        {
          $group: {
            _id: "$serviceName",
            sessions: { $sum: 1 },
            revenue: { $sum: "$paid" }
          }
        },
        { $sort: { revenue: -1 } }
      );
      const agg = await Billing.aggregate(pipeline);
      topServicesStats = agg.map(row => ({
        _id: row._id || 'Unknown Service',
        sessions: Number(row.sessions || 0),
        revenue: Number(row.revenue || 0),
        count: Number(row.sessions || 0)
      }));
    } catch (err) {
      console.error('❌ Error computing top services from doctor-revenue basis:', err);
    }

    // Calculate top services (without growth)
    let topServicesData = [];
    try {
      topServicesData = topServicesStats.map((stat) => ({
        name: stat._id || 'Unknown Service',
        sessions: stat.sessions || stat.count,
        revenue: stat.revenue
      }));
    } catch (err) {
      console.error('❌ Error processing top services:', err);
      topServicesData = topServicesStats.map(stat => ({
        name: stat._id || 'Unknown Service',
        sessions: stat.sessions || stat.count,
        revenue: stat.revenue
      }));
    }

    // Sort and cap for UX; no dummy fallback
    topServicesData.sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0));
    console.log('✅ Top Services Data (merged):', topServicesData.slice(0, 5));

    console.log('📤 Sending response with filter:', filter);
    res.status(200).json({ 
      success: true, 
      revenueTrendData,
      paymentMethodsData,
      doctorRevenueData,
      topServicesData,
      message: 'Financial reports data fetched successfully',
      debug: {
        filter,
        startDate: startOfYear.toISOString(),
        endDate: endOfYear.toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error fetching financial reports:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error fetching financial reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
