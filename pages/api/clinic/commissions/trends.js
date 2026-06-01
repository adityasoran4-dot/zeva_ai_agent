import dbConnect from "../../../../lib/database";
import Commission from "../../../../models/Commission";
import Referral from "../../../../models/Referral";
import User from "../../../../models/Users";
import AgentProfile from "../../../../models/AgentProfile";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq } from "../../lead-ms/auth";
import { checkClinicPermission } from "../../lead-ms/permissions-helper";
import { checkAgentPermission } from "../../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const source = req.query.source ? String(req.query.source) : null; // "referral" | "staff" | null
    const period = req.query.period ? String(req.query.period) : "daily"; // "daily" | "monthly"
    const limit = parseInt(req.query.limit) || 30; // Number of periods to return
    const topRecords = req.query.topRecords === 'true'; // Flag to get top records
    const commissionRecords = req.query.commissionRecords === 'true'; // Flag to get commission records instead of trends

    let clinicId = null;
    let clinic = null;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
      if (!me.clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      const qClinicId = req.query.clinicId;
      if (!qClinicId) {
        return res.status(400).json({ success: false, message: "Admin must provide clinicId" });
      }
      clinicId = qClinicId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (me.role !== "admin") {
      if (me.role === "clinic") {
        const { hasPermission, error } = await checkClinicPermission(clinicId, "clinic_commission", "read");
        if (!hasPermission) {
          return res.status(200).json({ success: true, items: [], message: "Permission not granted - showing empty data" });
        }
      } else if (["agent", "doctorStaff"].includes(me.role)) {
        const { hasPermission, error } = await checkAgentPermission(me._id, "clinic_commission", "read");
        if (!hasPermission) {
          return res.status(200).json({ success: true, items: [], message: "Permission not granted - showing empty data" });
        }
      }
    }

    // Build match condition based on source
    let matchCondition = { clinicId };
    if (source === "referral") {
      matchCondition.source = "referral";
    } else if (source === "staff") {
      matchCondition.source = "staff";
    }

    if (commissionRecords) {
      // Get commission records directly from the Commission model
      let sortField = "createdAt";
      if (period === "daily") {
        sortField = "invoicedDate";
      } else if (period === "monthly") {
        sortField = "invoicedDate";
      }

      let pipeline = [
        { $match: matchCondition },
        {
          $addFields: {
            period: {
              $cond: {
                if: { $eq: [period, "daily"] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: { $ifNull: ["$invoicedDate", "$createdAt"] }
                  }
                },
                else: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: { $ifNull: ["$invoicedDate", "$createdAt"] }
                  }
                }
              }
            }
          }
        },
        { $sort: { [sortField]: -1 } },
        { $limit: limit }
      ];

      const commissionDocs = await Commission.aggregate(pipeline);

      // Transform to include only the fields we need for the table
      const items = commissionDocs.map(doc => ({
        period: doc.period,
        name: doc.name || 'N/A',
        source: doc.source || 'N/A',
        commissionType: doc.commissionType || 'N/A',
        commissionPercent: doc.commissionPercent || 0,
        commissionAmount: doc.commissionAmount || 0,
        amountPaid: doc.amountPaid || 0,
        createdAt: doc.createdAt,
        invoicedDate: doc.invoicedDate
      }));

      return res.status(200).json({ 
        success: true, 
        items,
        periodType: period,
        source: source || "all",
        commissionRecords: true
      });
    } else if (topRecords) {
      // Get top 5 records per day or month
      let pipeline = [];
      
      if (period === "daily") {
        pipeline = [
          { $match: matchCondition },
          {
            $addFields: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: { $ifNull: ["$invoicedDate", "$createdAt"] }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                date: "$date",
                name: "$name",
                source: "$source",
                commissionType: "$commissionType",
                commissionAmount: "$commissionAmount",
                amountPaid: "$amountPaid"
              },
              totalCommission: { $sum: "$commissionAmount" },
              totalPaid: { $sum: "$amountPaid" }
            }
          },
          {
            $group: {
              _id: "$_id.date",
              records: {
                $push: {
                  name: "$_id.name",
                  source: "$_id.source",
                  commissionType: "$_id.commissionType",
                  totalCommission: "$totalCommission",
                  totalPaid: "$totalPaid"
                }
              }
            }
          },
          { $sort: { _id: -1 } }, // Sort by date descending
          { $limit: limit }
        ];
      } else if (period === "monthly") {
        pipeline = [
          { $match: matchCondition },
          {
            $addFields: {
              month: {
                $dateToString: {
                  format: "%Y-%m",
                  date: { $ifNull: ["$invoicedDate", "$createdAt"] }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                month: "$month",
                name: "$name",
                source: "$source",
                commissionType: "$commissionType",
                commissionAmount: "$commissionAmount",
                amountPaid: "$amountPaid"
              },
              totalCommission: { $sum: "$commissionAmount" },
              totalPaid: { $sum: "$amountPaid" }
            }
          },
          {
            $group: {
              _id: "$_id.month",
              records: {
                $push: {
                  name: "$_id.name",
                  source: "$_id.source",
                  commissionType: "$_id.commissionType",
                  totalCommission: "$totalCommission",
                  totalPaid: "$totalPaid"
                }
              }
            }
          },
          { $sort: { _id: -1 } }, // Sort by month descending
          { $limit: limit }
        ];
      }

      const groupedResults = await Commission.aggregate(pipeline);

      // Process to get top 5 records per period
      const processedItems = groupedResults.map(result => {
        // Sort records by total commission and take top 5
        const sortedRecords = result.records.sort((a, b) => b.totalCommission - a.totalCommission).slice(0, 5);
        
        return {
          period: result._id,
          records: sortedRecords
        };
      });

      return res.status(200).json({ 
        success: true, 
        items: processedItems,
        periodType: period,
        source: source || "all",
        topRecords: true
      });
    } else {
      // Original behavior - aggregate data
      let pipeline = [];
      
      if (period === "daily") {
        // Group by date (YYYY-MM-DD format)
        pipeline = [
          { $match: matchCondition },
          {
            $addFields: {
              date: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: { $ifNull: ["$invoicedDate", "$createdAt"] }
                }
              }
            }
          },
          {
            $group: {
              _id: "$date",
              totalCommissionAmount: { $sum: "$commissionAmount" },
              totalAmountPaid: { $sum: "$amountPaid" },
              count: { $sum: 1 },
              commissionTypes: { $addToSet: "$commissionType" },
              sources: { $addToSet: "$source" }
            }
          },
          { $sort: { _id: -1 } }, // Sort by date descending
          { $limit: limit }
        ];
      } else if (period === "monthly") {
        // Group by month (YYYY-MM format)
        pipeline = [
          { $match: matchCondition },
          {
            $addFields: {
              month: {
                $dateToString: {
                  format: "%Y-%m",
                  date: { $ifNull: ["$invoicedDate", "$createdAt"] }
                }
              }
            }
          },
          {
            $group: {
              _id: "$month",
              totalCommissionAmount: { $sum: "$commissionAmount" },
              totalAmountPaid: { $sum: "$amountPaid" },
              count: { $sum: 1 },
              commissionTypes: { $addToSet: "$commissionType" },
              sources: { $addToSet: "$source" }
            }
          },
          { $sort: { _id: -1 } }, // Sort by month descending
          { $limit: limit }
        ];
      }

      const groupedResults = await Commission.aggregate(pipeline);

      // Transform results to proper format
      const items = groupedResults.map(result => ({
        period: result._id, // Date or month
        totalCommission: Number(result.totalCommissionAmount.toFixed(2)),
        totalPaid: Number(result.totalAmountPaid.toFixed(2)),
        totalRecords: result.count,
        commissionTypes: result.commissionTypes,
        sources: result.sources
      }));

      return res.status(200).json({ 
        success: true, 
        items,
        periodType: period,
        source: source || "all",
        topRecords: false
      });
    }
  } catch (err) {
    console.error("Error in commissions trends:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
}