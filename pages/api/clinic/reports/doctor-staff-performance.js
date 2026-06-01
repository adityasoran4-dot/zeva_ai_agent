import dbConnect from "../../../../lib/database";
import Appointment from "../../../../models/Appointment";
import Billing from "../../../../models/Billing";
import User from "../../../../models/Users";
import Commission from "../../../../models/Commission";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
  } catch {
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }

  let me;
  try {
    me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
  if (clinicError && me.role !== "admin") {
    return res.status(403).json({ success: false, message: clinicError });
  }

  const { hasPermission } = await checkClinicPermission(clinicId, "clinic_reporting", "read");
  if (!hasPermission) {
    return res.status(403).json({ success: false, message: "You do not have permission to view reports" });
  }

  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date();
  const startAt = new Date(start);
  startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(end);
  endAt.setHours(23, 59, 59, 999);

  try {
    console.log("doctor-staff-performance", {
      clinicId: clinicId ? String(clinicId) : null,
      role: me.role,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    });
    let staffFilter = { role: "doctorStaff", ...(clinicId ? { clinicId: clinicId } : {}) };
    let staffList = await User.find(staffFilter).select("_id name email").lean();
    // Fallback: if no doctorStaff found with clinic scoping, use all doctorStaff (legacy data)
    if (!staffList.length) {
      staffFilter = { role: "doctorStaff" };
      staffList = await User.find(staffFilter).select("_id name email").lean();
    }
    const staffIds = staffList.map((s) => s._id);
    const staffMap = new Map(staffList.map((s) => [String(s._id), { name: s.name || "Unknown", email: s.email || "" }]));
    console.log("staffListCount", staffList.length);

    const baseAppointmentFilter = {
      ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
      doctorId: { $in: staffIds },
      startDate: { $gte: startAt, $lte: endAt },
    };

    const bookingsAgg = await Appointment.aggregate([
      { $match: baseAppointmentFilter },
      {
        $addFields: {
          isBooked: { $cond: [{ $eq: [{ $toLower: "$status" }, "booked"] }, 1, 0] },
          isCancelled: { $cond: [{ $in: [{ $toLower: "$status" }, ["cancelled", "canceled"]] }, 1, 0] },
          isCompleted: { $cond: [{ $eq: [{ $toLower: "$status" }, "completed"] }, 1, 0] },
          isInvoiced: { $cond: [{ $in: [{ $toLower: "$status" }, ["invoice", "invoiced"]] }, 1, 0] },
          isRescheduled: { $cond: [{ $eq: [{ $toLower: "$status" }, "rescheduled"] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: "$doctorId",
          totalAppointments: { $sum: 1 },
          bookedCount: { $sum: "$isBooked" },
          cancelledCount: { $sum: "$isCancelled" },
          completedCount: { $sum: "$isCompleted" },
          invoicedCount: { $sum: "$isInvoiced" },
          rescheduledCount: { $sum: "$isRescheduled" },
          uniquePatients: { $addToSet: "$patientId" },
        },
      },
      {
        $project: {
          _id: 1,
          totalAppointments: 1,
          bookedCount: 1,
          cancelledCount: 1,
          completedCount: 1,
          invoicedCount: 1,
          rescheduledCount: 1,
          totalPatients: { $size: "$uniquePatients" },
        },
      },
      { $sort: { totalAppointments: -1 } },
    ]);

    const leaderboard = bookingsAgg.map((row) => ({
      staffId: String(row._id),
      staffName: staffMap.get(String(row._id))?.name || "Unknown",
      totalAppointments: row.totalAppointments || 0,
    }));

    const revenueAgg = await Billing.aggregate([
      {
        $match: {
          ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
          invoicedDate: { $gte: startAt, $lte: endAt },
          doctorId: { $in: staffIds },
          doctorId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$doctorId",
          revenue: { $sum: { $ifNull: ["$paid", 0] } },
          invoices: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const revenueByStaff = revenueAgg.map((r) => ({
      staffId: String(r._id),
      staffName: staffMap.get(String(r._id))?.name || "Unknown",
      revenue: Math.round(Number(r.revenue || 0)),
      invoices: r.invoices || 0,
    }));
    console.log("bookingsAggCount", bookingsAgg.length);
    console.log("revenueByStaffCount", revenueByStaff.length);

    const detailsTop5 = bookingsAgg.slice(0, 5).map((row) => ({
      staffId: String(row._id),
      staffName: staffMap.get(String(row._id))?.name || "Unknown",
      totalAppointments: row.totalAppointments || 0,
      booked: row.bookedCount || 0,
      cancelled: row.cancelledCount || 0,
      completed: row.completedCount || 0,
      invoiced: row.invoicedCount || 0,
      rescheduled: row.rescheduledCount || 0,
      totalPatients: row.totalPatients || 0,
    }));

    // Top commissions (doctorStaff and agents)
    const clinicMatch = clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {};
    const dateMatch = {
      $or: [
        { invoicedDate: { $gte: startAt, $lte: endAt } },
        { invoicedDate: null, createdAt: { $gte: startAt, $lte: endAt } },
      ],
    };
    const commissionAmountExpr = {
      $cond: [
        { $gt: ["$finalCommissionAmount", 0] },
        "$finalCommissionAmount",
        "$commissionAmount",
      ],
    };
    console.log("commissionQueryFilters", {
      clinicMatch,
      dateMatch,
    });

    const topDoctorStaffCommissionAgg = await Commission.aggregate([
      { $match: { ...clinicMatch, source: "staff", ...dateMatch } },
      { $lookup: { from: "users", localField: "staffId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $match: { "user.role": "doctorStaff" } },
      {
        $group: {
          _id: "$staffId",
          totalCommission: { $sum: commissionAmountExpr },
          entries: { $sum: 1 },
          name: { $first: "$user.name" },
        },
      },
      { $sort: { totalCommission: -1 } },
      { $limit: 5 },
    ]);
    console.log("topDoctorStaffCommissionAggCount", topDoctorStaffCommissionAgg.length);

    const topAgentCommissionAggStaff = await Commission.aggregate([
      { $match: { ...clinicMatch, source: "staff", ...dateMatch, staffId: { $ne: null } } },
      { $lookup: { from: "users", localField: "staffId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $match: { "user.role": "agent" } },
      {
        $group: {
          _id: "$staffId",
          totalCommission: { $sum: commissionAmountExpr },
          entries: { $sum: 1 },
          name: { $first: "$user.name" },
        },
      },
      { $sort: { totalCommission: -1 } },
    ]);
    console.log("topAgentCommissionAggStaffCount", topAgentCommissionAggStaff.length);

    const topAgentCommissionAggReferral = await Commission.aggregate([
      { $match: { ...clinicMatch, source: "referral", ...dateMatch } },
      { $lookup: { from: "referrals", localField: "referralId", foreignField: "_id", as: "ref" } },
      { $unwind: { path: "$ref", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "users",
          let: { email: "$ref.email", phone: "$ref.phone", clinic: "$clinicId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$clinicId", "$$clinic"] },
                    {
                      $or: [
                        {
                          $and: [
                            { $ne: ["$$email", null] },
                            { $eq: ["$email", { $toLower: "$$email" }] },
                          ],
                        },
                        {
                          $and: [
                            { $ne: ["$$phone", null] },
                            { $eq: ["$phone", "$$phone"] },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            { $match: { role: "agent" } },
          ],
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$user._id",
          totalCommission: { $sum: commissionAmountExpr },
          entries: { $sum: 1 },
          name: { $first: "$user.name" },
        },
      },
      { $sort: { totalCommission: -1 } },
    ]);
    console.log("topAgentCommissionAggReferralCount", topAgentCommissionAggReferral.length);
    const referralTotal = await Commission.countDocuments({ ...clinicMatch, source: "referral", ...dateMatch });
    const referralWithStaffId = await Commission.countDocuments({ ...clinicMatch, source: "referral", ...dateMatch, staffId: { $ne: null } });
    console.log("referralCommissionStats", { referralTotal, referralWithStaffId });
    const sampleRefComms = await Commission.find({ ...clinicMatch, source: "referral", ...dateMatch }).limit(3).select("referralId staffId").lean();
    for (const c of sampleRefComms) {
      const ReferralModel = (await import("../../../../models/Referral")).default;
      const ref = c.referralId ? await ReferralModel.findById(c.referralId).lean() : null;
      console.log("sampleReferralCommission", {
        staffId: c.staffId ? String(c.staffId) : null,
        referralId: c.referralId ? String(c.referralId) : null,
        email: ref?.email || null,
        phone: ref?.phone || null,
      });
    }

    const topDoctorStaffCommission = topDoctorStaffCommissionAgg.map((r) => ({
      staffId: String(r._id || ""),
      name: r.name || "Unknown",
      totalCommission: Math.round(Number(r.totalCommission || 0)),
      entries: r.entries || 0,
    }));

    const combinedAgentMap = new Map();
    [...topAgentCommissionAggStaff, ...topAgentCommissionAggReferral].forEach((r) => {
      const key = String(r._id || "");
      if (!key) return;
      const existing = combinedAgentMap.get(key);
      const total = Math.round(Number(r.totalCommission || 0));
      const entries = r.entries || 0;
      if (!existing) {
        combinedAgentMap.set(key, { staffId: key, name: r.name || "Unknown", totalCommission: total, entries });
      } else {
        combinedAgentMap.set(key, {
          staffId: key,
          name: existing.name || r.name || "Unknown",
          totalCommission: existing.totalCommission + total,
          entries: (existing.entries || 0) + entries,
        });
      }
    });
    const topAgentCommission = Array.from(combinedAgentMap.values())
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 5);
    console.log("topAgentCommissionResultCount", topAgentCommission.length, "ids", topAgentCommission.map((x) => x.staffId));

    // New: Highest billing in memberships and packages per doctor staff
    const packageBillingAgg = await Billing.aggregate([
      {
        $match: {
          ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
          invoicedDate: { $gte: startAt, $lte: endAt },
          service: "Package",
          doctorId: { $ne: null },
        }
      },
      {
        $group: {
          _id: "$doctorId",
          amount: { $sum: { $ifNull: ["$paid", 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]);

    const topPackageBilling = packageBillingAgg.map(r => ({
      staffId: String(r._id || ""),
      name: staffMap.get(String(r._id))?.name || "Unknown",
      amount: Math.round(Number(r.amount || 0)),
      count: r.count
    }));

    const membershipBillingAgg = await Billing.aggregate([
      {
        $match: {
          ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
          invoicedDate: { $gte: startAt, $lte: endAt },
          $or: [
            { membershipDiscountApplied: { $gt: 0 } },
            { isFreeConsultation: true }
          ],
          doctorId: { $ne: null },
        }
      },
      {
        $group: {
          _id: "$doctorId",
          amount: { $sum: { $ifNull: ["$paid", 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 5 }
    ]);

    const topMembershipBilling = membershipBillingAgg.map(r => ({
      staffId: String(r._id || ""),
      name: staffMap.get(String(r._id))?.name || "Unknown",
      amount: Math.round(Number(r.amount || 0)),
      count: r.count
    }));

    return res.status(200).json({
      success: true,
      data: {
        leaderboard,
        top5Revenue: revenueByStaff,
        top5Details: detailsTop5,
        topDoctorStaffCommission,
        topAgentCommission,
        topPackageBilling,
        topMembershipBilling
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load doctor staff performance" });
  }
}
