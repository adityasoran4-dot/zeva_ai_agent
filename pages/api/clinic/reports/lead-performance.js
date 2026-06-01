import dbConnect from "../../../../lib/database";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";
import Lead from "../../../../models/Lead";
import Treatment from "../../../../models/Treatment";
import User from "../../../../models/Users";

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
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });
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
  const startAt = new Date(start); startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(end); endAt.setHours(23, 59, 59, 999);

  try {
    // Build initial scoped match
    const baseMatch = {
      ...(clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {}),
      createdAt: { $gte: startAt, $lte: endAt },
    };
    // Backward compatibility: if no leads match clinic scoping (or clinicId missing in data),
    // fall back to date-only filter to avoid empty reports.
    let effectiveMatch = baseMatch;
    try {
      const scopedCount = await Lead.countDocuments(baseMatch);
      if (scopedCount === 0) {
        effectiveMatch = { createdAt: { $gte: startAt, $lte: endAt } };
      }
    } catch {
      // If count fails for any reason, keep base match
    }

    // Conversion by owner (latest assignee)
    const conversionByOwner = await Lead.aggregate([
      { $match: effectiveMatch },
      {
        $addFields: {
          assignedCount: { $size: { $ifNull: ["$assignedTo", []] } },
        },
      },
      {
        $addFields: {
          lastAssigned: {
            $cond: [
              { $gt: ["$assignedCount", 0] },
              { $arrayElemAt: ["$assignedTo", { $subtract: ["$assignedCount", 1] }] },
              null,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$lastAssigned.user",
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $ifNull: ["$patientId", false] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          ownerId: { $ifNull: ["$_id", null] },
          ownerName: { $ifNull: ["$owner.name", "Unassigned"] },
          total: 1,
          converted: 1,
          conversionRatio: {
            $cond: [
              { $gt: ["$total", 0] },
              { $divide: ["$converted", "$total"] },
              0,
            ],
          },
        },
      },
      { $sort: { conversionRatio: -1, converted: -1 } },
    ]);

    // Gender ratio
    const genderStats = await Lead.aggregate([
      { $match: effectiveMatch },
      {
        $group: {
          _id: { $ifNull: ["$gender", "Unknown"] },
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $ifNull: ["$patientId", false] }, 1, 0] } },
        },
      },
      {
        $project: {
          gender: "$_id",
          _id: 0,
          total: 1,
          converted: 1,
          conversionRatio: {
            $cond: [{ $gt: ["$total", 0] }, { $divide: ["$converted", "$total"] }, 0],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Top 5 converting treatments
    const convertingTreatments = await Lead.aggregate([
      { $match: { ...effectiveMatch, patientId: { $ne: null } } },
      { $unwind: "$treatments" },
      {
        $group: {
          _id: "$treatments.treatment",
          converted: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "treatments",
          localField: "_id",
          foreignField: "_id",
          as: "t",
        },
      },
      { $unwind: { path: "$t", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          treatmentId: "$_id",
          name: { $ifNull: ["$t.name", "Unknown"] },
          converted: 1,
        },
      },
      { $sort: { converted: -1 } },
      { $limit: 5 },
    ]);

    // Top 5 converting sources with ratio
    const sourceStats = await Lead.aggregate([
      { $match: effectiveMatch },
      {
        $project: {
          sourceName: {
            $cond: [
              { $and: [{ $eq: ["$source", "Other"] }, { $ifNull: ["$customSource", false] }] },
              "$customSource",
              "$source",
            ],
          },
          patientId: 1,
        },
      },
      {
        $group: {
          _id: "$sourceName",
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $ifNull: ["$patientId", false] }, 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          source: "$_id",
          total: 1,
          converted: 1,
          conversionRatio: {
            $cond: [{ $gt: ["$total", 0] }, { $divide: ["$converted", "$total"] }, 0],
          },
        },
      },
      { $sort: { conversionRatio: -1, converted: -1 } },
      { $limit: 5 },
    ]);

    // Status distribution
    const statusDistribution = await Lead.aggregate([
      { $match: effectiveMatch },
      {
        $project: {
          statusName: {
            $ifNull: ["$status", { $ifNull: ["$customStatus", "Unknown"] }],
          },
        },
      },
      {
        $group: {
          _id: "$statusName",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        conversionByOwner: conversionByOwner.map((r) => ({
          ownerId: r.ownerId ? String(r.ownerId) : "",
          ownerName: r.ownerName || "Unassigned",
          total: r.total || 0,
          converted: r.converted || 0,
          conversionRatio: Number((r.conversionRatio || 0).toFixed(4)),
        })),
        genderStats: genderStats.map((g) => ({
          gender: g.gender || "Unknown",
          total: g.total || 0,
          converted: g.converted || 0,
          conversionRatio: Number((g.conversionRatio || 0).toFixed(4)),
        })),
        topTreatments: convertingTreatments.map((t) => ({
          treatmentId: t.treatmentId ? String(t.treatmentId) : "",
          name: t.name || "Unknown",
          converted: t.converted || 0,
        })),
        topSources: sourceStats.map((s) => ({
          source: s.source || "Unknown",
          total: s.total || 0,
          converted: s.converted || 0,
          conversionRatio: Number((s.conversionRatio || 0).toFixed(4)),
        })),
        statusDistribution,
      },
    });
  } catch (e) {
    console.error("lead-performance error", e);
    return res.status(500).json({ success: false, message: "Failed to load lead report" });
  }
}
