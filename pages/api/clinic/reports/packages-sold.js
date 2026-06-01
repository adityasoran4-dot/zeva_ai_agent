import dbConnect from "../../../../lib/database";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";
import Billing from "../../../../models/Billing";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
  } catch {
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }

  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "agent", "doctor", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
  if (clinicError && user.role !== "admin") {
    return res.status(403).json({ success: false, message: clinicError });
  }

  const moduleKey = "clinic_reporting";
  const { hasPermission } = await checkClinicPermission(clinicId, moduleKey, "read");
  if (!hasPermission) {
    return res.status(403).json({ success: false, message: "You do not have permission to view reports" });
  }

  try {
    const { startDate, endDate, page = "1", limit = "20" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * pageSize;

    const match = { service: "Package" };
    if (user.role !== "admin") {
      match.clinicId = new mongoose.Types.ObjectId(String(clinicId));
    } else if (req.query.clinicId) {
      match.clinicId = new mongoose.Types.ObjectId(String(req.query.clinicId));
    }
    if (startDate || endDate) {
      match.invoicedDate = {};
      if (startDate) match.invoicedDate.$gte = new Date(startDate);
      if (endDate) match.invoicedDate.$lte = new Date(endDate);
      if (Object.keys(match.invoicedDate).length === 0) delete match.invoicedDate;
    }

    const pipeline = [
      { $match: match },
      // Join appointments to capture doctorId
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "apt",
        },
      },
      { $unwind: { path: "$apt", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          __usedSessions: {
            $sum: {
              $map: {
                input: { $ifNull: ["$selectedPackageTreatments", []] },
                as: "t",
                in: { $ifNull: ["$$t.sessions", 0] },
              },
            },
          },
          __doctorId: "$apt.doctorId",
        },
      },
      {
        $group: {
          _id: { patientId: "$patientId", package: "$package" },
          patientId: { $first: "$patientId" },
          packageName: { $first: "$package" },
          totalPaid: { $sum: { $ifNull: ["$paid", 0] } },
          totalPending: { $sum: { $ifNull: ["$pending", 0] } },
          sessionsUsed: { $sum: "$__usedSessions" },
          firstPurchaseDate: { $min: "$createdAt" },
          lastActivityDate: { $max: "$createdAt" },
          doctorIds: { $addToSet: "$__doctorId" },
        },
      },
      // Resolve doctor names
      {
        $lookup: {
          from: "users",
          let: { dids: "$doctorIds" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", { $ifNull: ["$$dids", []] }] },
              },
            },
            { $project: { _id: 1, name: 1, firstName: 1, lastName: 1 } },
          ],
          as: "doctors",
        },
      },
      {
        $lookup: {
          from: "patientregistrations",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $lookup: {
          from: "packages",
          localField: "packageName",
          foreignField: "name",
          as: "pkg",
        },
      },
      {
        $project: {
          patientId: 1,
          packageName: 1,
          patientName: {
            $concat: [
              { $ifNull: [{ $arrayElemAt: ["$patient.firstName", 0] }, ""] },
              " ",
              { $ifNull: [{ $arrayElemAt: ["$patient.lastName", 0] }, ""] },
            ],
          },
          totalSessions: { $ifNull: [{ $arrayElemAt: ["$pkg.totalSessions", 0] }, 0] },
          sessionsUsed: 1,
          remainingSessions: {
            $max: [{ $subtract: [{ $ifNull: [{ $arrayElemAt: ["$pkg.totalSessions", 0] }, 0] }, "$sessionsUsed"] }, 0],
          },
          doctorNames: {
            $map: {
              input: "$doctors",
              as: "d",
              in: {
                $cond: [
                  { $ifNull: ["$$d.name", false] },
                  "$$d.name",
                  {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ["$$d.firstName", ""] },
                          " ",
                          { $ifNull: ["$$d.lastName", ""] },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
          paymentStatus: {
            $cond: [{ $gt: ["$totalPending", 0] }, "Partly Paid", "Paid"],
          },
          totalPaid: 1,
          totalPending: 1,
          firstPurchaseDate: 1,
          lastActivityDate: 1,
        },
      },
      {
        $addFields: {
          doctorName: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$doctorNames", []] } }, 0] },
              { $reduce: { input: "$doctorNames", initialValue: "", in: { $cond: [{ $eq: ["$$value", ""] }, "$$this", { $concat: ["$$value", ", ", "$$this"] }] } } },
              "Unknown",
            ],
          },
        },
      },
      { $sort: { totalPaid: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    const rows = await Billing.aggregate(pipeline);
    const countAgg = await Billing.aggregate([
      { $match: match },
      {
        $group: {
          _id: { patientId: "$patientId", package: "$package" },
        },
      },
      { $count: "count" },
    ]);

    const total = countAgg?.[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { page: pageNum, pageSize, total, hasNext: skip + rows.length < total },
    });
  } catch (e) {
    console.error("packages-sold error:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch packages sold" });
  }
}
