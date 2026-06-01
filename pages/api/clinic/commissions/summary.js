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
          return res.status(403).json({ success: false, message: error || "No permission to view commissions" });
        }
      } else if (["agent", "doctorStaff"].includes(me.role)) {
        const { hasPermission, error } = await checkAgentPermission(me._id, "clinic_commission", "read");
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: error || "No permission to view commissions" });
        }
      }
    }

    // Build date filter for match stage
    const dateMatch = {};
    if (req.query.date) {
      const date = new Date(req.query.date);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (req.query.startDate && req.query.endDate) {
      const startDate = new Date(req.query.startDate);
      const endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
      dateMatch.createdAt = { $gte: startDate, $lte: endDate };
    }

    let grouped = [];
    if (source === "referral") {
      const matchStage = { clinicId, $or: [{ source: "referral" }, { referralId: { $ne: null } }], referralId: { $ne: null } };
      if (Object.keys(dateMatch).length > 0) {
        Object.assign(matchStage, dateMatch);
      }
      grouped = await Commission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$referralId",
            totalCommissionAmount: { $sum: { $cond: [{ $gt: ["$finalCommissionAmount", 0] }, "$finalCommissionAmount", "$commissionAmount"] } },
            totalAmountPaid: { $sum: "$amountPaid" },
            count: { $sum: 1 },
            lastCommissionPercent: { $last: "$commissionPercent" },
            lastReferralName: { $last: "$referralName" },
            submittedCount: { $sum: { $cond: [{ $eq: ["$isSubmitted", true] }, 1, 0] } },
            pendingApprovalCount: { $sum: { $cond: [{ $and: [{ $eq: ["$isSubmitted", true] }, { $eq: ["$isApproved", false] }] }, 1, 0] } },
          },
        },
        { $sort: { totalCommissionAmount: -1 } },
      ]);
    } else if (source === "staff") {
      const matchStage = { clinicId, $or: [{ source: "staff" }, { staffId: { $ne: null } }], staffId: { $ne: null } };
      if (Object.keys(dateMatch).length > 0) {
        Object.assign(matchStage, dateMatch);
      }
      grouped = await Commission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$staffId",
            totalCommissionAmount: { $sum: { $cond: [{ $gt: ["$finalCommissionAmount", 0] }, "$finalCommissionAmount", "$commissionAmount"] } },
            totalAmountPaid: { $sum: "$amountPaid" },
            count: { $sum: 1 },
            lastCommissionPercent: { $last: "$commissionPercent" },
            submittedCount: { $sum: { $cond: [{ $eq: ["$isSubmitted", true] }, 1, 0] } },
            pendingApprovalCount: { $sum: { $cond: [{ $and: [{ $eq: ["$isSubmitted", true] }, { $eq: ["$isApproved", false] }] }, 1, 0] } },
          },
        },
        { $sort: { totalCommissionAmount: -1 } },
      ]);
    } else {
      const matchStage = { clinicId };
      if (Object.keys(dateMatch).length > 0) {
        Object.assign(matchStage, dateMatch);
      }
      grouped = await Commission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$staffId",
            totalCommissionAmount: { $sum: { $cond: [{ $gt: ["$finalCommissionAmount", 0] }, "$finalCommissionAmount", "$commissionAmount"] } },
            totalAmountPaid: { $sum: "$amountPaid" },
            count: { $sum: 1 },
            lastCommissionPercent: { $last: "$commissionPercent" },
          },
        },
        { $sort: { totalCommissionAmount: -1 } },
      ]);
    }

    const results = [];
    for (const g of grouped) {
      if (source === "referral") {
        const referralId = g._id;
        let name = g.lastReferralName || "";
        let percent = g.lastCommissionPercent || 0;
        if (referralId) {
          const ref = await Referral.findById(referralId).lean();
          if (ref) {
            name = `${(ref.firstName || "").trim()} ${(ref.lastName || "").trim()}`.trim() || name;
            percent = Number(ref.referralPercent ?? percent);
          }
        }
        results.push({
          source: "referral",
          personId: referralId?.toString() || null,
          name,
          percent,
          totalEarned: Number(g.totalCommissionAmount.toFixed(2)),
          totalPaid: Number(g.totalAmountPaid.toFixed(2)),
          count: g.count,
          submittedCount: g.submittedCount || 0,
          pendingApprovalCount: g.pendingApprovalCount || 0,
        });
      } else {
        const staffId = g._id;
        let name = "";
        let percent = g.lastCommissionPercent || 0;
        let commissionType = "flat";
        let targetAmount = 0;
        let targetProgress = 0;
        let isAboveTarget = false;
        
        if (staffId) {
          const user = await User.findById(staffId).select("name role").lean();
          if (user) {
            name = user.name || "";
          }
          const profile = await AgentProfile.findOne({ userId: staffId }).lean();
          if (profile) {
            if (profile.commissionPercentage != null) {
              percent = Number(profile.commissionPercentage);
            }
            commissionType = profile.commissionType || "flat";
            
            // For target-based commission, calculate progress
            if (commissionType === "target_based" && profile.targetAmount) {
              targetAmount = Number(profile.targetAmount);
              // Get the latest commission record to get cumulative achieved
              const latestCommission = await Commission.findOne({
                clinicId,
                staffId,
                source: "staff",
                commissionType: "target_based",
              }).sort({ createdAt: -1 }).lean();
              
              if (latestCommission && latestCommission.cumulativeAchieved) {
                const currentAchieved = latestCommission.cumulativeAchieved;
                targetProgress = targetAmount > 0 ? (currentAchieved / targetAmount) * 100 : 0;
                isAboveTarget = currentAchieved >= targetAmount;
              } else {
                // Fallback: use total paid amount
                targetProgress = targetAmount > 0 ? (g.totalAmountPaid / targetAmount) * 100 : 0;
                isAboveTarget = g.totalAmountPaid >= targetAmount;
              }
            }
          }
        }
        
        const result = {
          source: "staff",
          personId: staffId?.toString() || null,
          name,
          percent,
          commissionType,
          totalEarned: Number(g.totalCommissionAmount.toFixed(2)),
          totalPaid: Number(g.totalAmountPaid.toFixed(2)),
          count: g.count,
          submittedCount: g.submittedCount || 0,
          pendingApprovalCount: g.pendingApprovalCount || 0,
        };
        
        // Add target-specific fields if applicable
        if (commissionType === "target_based") {
          result.targetAmount = targetAmount;
          result.targetProgress = Number(targetProgress.toFixed(2));
          result.isAboveTarget = isAboveTarget;
        }
        
        results.push(result);
      }
    }

    return res.status(200).json({ success: true, items: results });
  } catch (err) {
    console.error("Error in commissions summary:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
}
