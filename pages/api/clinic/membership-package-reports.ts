import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import MembershipPlan from "../../../models/MembershipPlan";
import Package from "../../../models/Package";
import Clinic from "../../../models/Clinic";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import { NextApiRequest, NextApiResponse } from 'next';
import { isNewClinicInMockPeriod, generateMockMembershipPackageReports } from '../../../lib/mockDataGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  let user;
  try {
    user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
    });
  } catch (err: any) {
    return res.status(err.status || 401).json({ 
      success: false, 
      message: err.message || "Authentication error" 
    });
  }

  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  
  if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { clinicId, error: clinicError }: any = await getClinicIdFromUser(user);
  if (clinicError || (!clinicId && user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: clinicError || "Unable to determine clinic access",
    });
  }

  // Get clinic to check registeredAt
  let clinic = null;
  if (user.role === "clinic") {
    clinic = await Clinic.findOne({ owner: user._id });
  } else if (clinicId) {
    clinic = await Clinic.findById(clinicId);
  }

  // Check if clinic is within 2-day mock data period
  if (clinic && isNewClinicInMockPeriod(clinic.registeredAt)) {
    // Check if they have any real patient/package data
    const patientCount = await PatientRegistration.countDocuments({ clinicId });
    
    if (patientCount === 0) {
      console.log('📊 Returning mock membership/package reports for new clinic:', clinic._id);
      const mockData = generateMockMembershipPackageReports();
      
      return res.status(200).json({
        success: true,
        data: mockData,
        isMockData: true,
        message: 'Showing sample membership & package data for new clinic!',
      });
    }
  }

  const moduleKey = "Clinic_services_setup";

  if (req.method === "GET") {
    try {
      const { hasPermission, error: permError }: any = await checkClinicPermission(clinicId, moduleKey, "read");
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permError || "You do not have permission to view membership and package reports",
        });
      }

      // Get time range filter from query params (week, month, overall, select-calendar)
      const timeRange = req.query.timeRange as string || 'month';
      
      // Calculate date ranges based on filter
      const now = new Date();
      let startOfCurrentPeriod = new Date();
      let startOfLastPeriod = new Date();
      
      if (timeRange === 'week') {
        // Last 7 days
        startOfCurrentPeriod.setDate(now.getDate() - 7);
        startOfLastPeriod.setDate(now.getDate() - 14);
      } else if (timeRange === 'month') {
        // Current month vs last month
        startOfCurrentPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfLastPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      } else if (timeRange === 'select-calendar') {
        // Same as month for select-calendar option
        startOfCurrentPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfLastPeriod = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      }
      // For 'overall', we'll use all-time data (startOfCurrentPeriod remains today)

      const query = { clinicId };
      
      // ACTIVE MEMBERSHIPS: From MembershipPlan model (active plans)
      const activeMembershipsQuery = {
        ...query,
        isActive: true
      };
      const activeMembershipsCount = await MembershipPlan.countDocuments(activeMembershipsQuery);

      // EXPIRED MEMBERSHIPS: Inactive plans
      const expiredMembershipsQuery = {
        ...query,
        isActive: false
      };
      const expiredMembershipsCount = await MembershipPlan.countDocuments(expiredMembershipsQuery);

      // ACTIVE PACKAGES: All packages in system
      const activePackagesCount = await Package.countDocuments(query);

      // Calculate last period's data for comparison
      const lastMonthActiveMemberships = await MembershipPlan.countDocuments({
        ...query,
        createdAt: { $lt: startOfCurrentPeriod, $gte: startOfLastPeriod }
      });

      const lastMonthExpiredMemberships = await MembershipPlan.countDocuments({
        ...query,
        isActive: false,
        updatedAt: { $lt: startOfCurrentPeriod, $gte: startOfLastPeriod }
      });

      const lastMonthActivePackages = await Package.countDocuments({
        ...query,
        createdAt: { $lt: startOfCurrentPeriod, $gte: startOfLastPeriod }
      });

      // Calculate percentage changes
      const calculatePercentChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const activeMembershipsChange = calculatePercentChange(activeMembershipsCount, lastMonthActiveMemberships);
      const expiredMembershipsChange = calculatePercentChange(expiredMembershipsCount, lastMonthExpiredMemberships);
      const activePackagesChange = calculatePercentChange(activePackagesCount, lastMonthActivePackages);

      // MEMBERSHIP REVENUE - Last 6 periods based on timeRange
      const membershipRevenueData = [];
      
      if (timeRange === 'week') {
        // Show last 7 days
        for (let i = 6; i >= 0; i--) {
          const dayDate = new Date(now);
          dayDate.setDate(now.getDate() - i);
          dayDate.setHours(0, 0, 0, 0);
          const nextDayDate = new Date(dayDate);
          nextDayDate.setDate(dayDate.getDate() + 1);
          
          const patientsWithMembership = await PatientRegistration.find({
            clinicId,
            membership: "Yes",
            membershipStartDate: { $gte: dayDate, $lt: nextDayDate }
          }).populate('membershipId');
          
          const totalRevenue = patientsWithMembership.reduce((sum, patient: any) => {
            return sum + (patient.membershipId?.price || 0);
          }, 0);
          
          const dayName = dayDate.toLocaleString('default', { weekday: 'short' });
          membershipRevenueData.push({
            day: dayName,
            date: dayDate.toLocaleDateString(),
            revenue: totalRevenue
          });
        }
      } else {
        // Month and Overall - Show last 6 months
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          
          const patientsWithMembership = await PatientRegistration.find({
            clinicId,
            membership: "Yes",
            membershipStartDate: { $gte: monthDate, $lt: nextMonthDate }
          }).populate('membershipId');
          
          const totalRevenue = patientsWithMembership.reduce((sum, patient: any) => {
            return sum + (patient.membershipId?.price || 0);
          }, 0);
          
          const monthName = monthDate.toLocaleString('default', { month: 'short' });
          membershipRevenueData.push({
            month: monthName,
            revenue: totalRevenue
          });
        }
      }

      // PACKAGE USAGE ANALYTICS - From Package model with patient usage filtered by timeRange
      let packageUsageData;
      
      if (timeRange === 'overall') {
        // For overall, show all-time package usage
        packageUsageData = await Package.aggregate([
          {
            $match: query
          },
          {
            $lookup: {
              from: "patientregistrations",
              localField: "_id",
              foreignField: "packageId",
              as: "patients"
            }
          },
          {
            $project: {
              packageName: "$name",
              totalPrice: "$totalPrice",
              totalSessions: "$totalSessions",
              patientCount: { $size: "$patients" },
              revenue: "$totalPrice"
            }
          },
          {
            $addFields: {
              usagePercentage: {
                $min: [{ $multiply: [{ $divide: ["$patientCount", 10] }, 100] }, 100]
              }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 }
        ]);
      } else {
        // For week/month/select-calendar, calculate based on purchases in that period
        packageUsageData = await PatientRegistration.aggregate([
          {
            $match: {
              clinicId,
              package: "Yes",
              createdAt: { $gte: startOfCurrentPeriod }
            }
          },
          {
            $lookup: {
              from: "packages",
              localField: "packageId",
              foreignField: "_id",
              as: "packageDetails"
            }
          },
          { $unwind: { path: "$packageDetails", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: "$packageId",
              packageName: { $first: "$packageDetails.name" },
              totalPrice: { $first: "$packageDetails.totalPrice" },
              totalSessions: { $first: "$packageDetails.totalSessions" },
              patientCount: { $sum: 1 },
              revenue: { $sum: "$packageDetails.totalPrice" }
            }
          },
          {
            $addFields: {
              usagePercentage: {
                $min: [{ $multiply: [{ $divide: ["$patientCount", 10] }, 100] }, 100]
              }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 }
        ]);
      }

      // SESSIONS REMAINING TRACKER - From PatientRegistration with package data
      // Track patients who have purchased packages and show their remaining sessions
      const sessionsRemainingMatchQuery: any = {
        clinicId,
        package: "Yes",
        packageId: { $exists: true, $ne: null }
      };
      
      // For week/month filters, only show recent purchases
      if (timeRange === 'week' || timeRange === 'month') {
        sessionsRemainingMatchQuery.createdAt = { $gte: startOfCurrentPeriod };
      }
      
      console.log('🔍 Sessions Remaining Query:', JSON.stringify(sessionsRemainingMatchQuery));
      
      // First, try to count how many patients have package="Yes" in this clinic
      const totalPackagePatients = await PatientRegistration.countDocuments({ 
        clinicId, 
        package: "Yes" 
      });
      console.log(`📋 Total patients with package="Yes" in clinic: ${totalPackagePatients}`);
      
      const sessionsRemainingData = await PatientRegistration.aggregate([
        {
          $match: sessionsRemainingMatchQuery
        },
        {
          $lookup: {
            from: "packages",
            localField: "packageId",
            foreignField: "_id",
            as: "packageDetails"
          }
        },
        { $unwind: { path: "$packageDetails", preserveNullAndEmptyArrays: false } },
        {
          $project: {
            patientName: { 
              $concat: [
                { $ifNull: ["$firstName", ""] },
                " ",
                { $ifNull: ["$lastName", ""] }
              ]
            },
            packageName: "$packageDetails.name",
            totalSessions: "$packageDetails.totalSessions",
            packagePrice: "$packageDetails.totalPrice",
            purchaseDate: "$createdAt",
            // Calculate sessions used based on payment history or appointments
            // Each payment can represent a session visit
            sessionsUsed: { $size: { $ifNull: ["$paymentHistory", []] } },
            color: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$packageDetails.name", regex: /Gold/i } }, then: "#FFD700" },
                  { case: { $regexMatch: { input: "$packageDetails.name", regex: /Silver/i } }, then: "#C0C0C0" },
                  { case: { $regexMatch: { input: "$packageDetails.name", regex: /Bronze/i } }, then: "#CD7F32" },
                  { case: { $regexMatch: { input: "$packageDetails.name", regex: /Premium/i } }, then: "#9370DB" },
                  { case: { $regexMatch: { input: "$packageDetails.name", regex: /Starter/i } }, then: "#3B82F6" },
                ],
                default: "#10B981"
              }
            }
          }
        },
        {
          $addFields: {
            remainingSessions: {
              $max: [{ $subtract: ["$totalSessions", "$sessionsUsed"] }, 0]
            },
            progressPercentage: {
              $cond: {
                if: { $eq: ["$totalSessions", 0] },
                then: 0,
                else: {
                  $multiply: [{ $divide: ["$sessionsUsed", "$totalSessions"] }, 100]
                }
              }
            },
            usagePercent: {
              $round: [{
                $multiply: [{ $divide: ["$sessionsUsed", "$totalSessions"] }, 100]
              }, 1]
            }
          }
        },
        // Filter out patients who have completed all sessions or have no sessions left
        {
          $match: {
            remainingSessions: { $gt: 0 }
          }
        },
        // Sort by remaining sessions (ascending) to show patients with fewer sessions first
        { $sort: { remainingSessions: 1 } },
        { $limit: 20 }
      ]);
      
      console.log('📊 Sessions Remaining Data:', sessionsRemainingData.length, 'records found');

      return res.status(200).json({
        success: true,
        data: {
          summaryStats: {
            activeMemberships: {
              count: activeMembershipsCount,
              change: activeMembershipsChange
            },
            expiredMemberships: {
              count: expiredMembershipsCount,
              change: expiredMembershipsChange
            },
            activePackages: {
              count: activePackagesCount,
              change: activePackagesChange
            }
          },
          membershipRevenue: membershipRevenueData,
          packageUsage: packageUsageData,
          sessionsRemaining: sessionsRemainingData
        }
      });
    } catch (error: any) {
      console.error("Error fetching membership and package reports:", error);
      return res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch membership and package reports" 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    message: "Method not allowed" 
  });
}
