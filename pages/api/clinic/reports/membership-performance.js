import dbConnect from "../../../../lib/database";
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

  // Sanitize query params (treat "undefined"/"null"/invalid as missing)
  const parseDate = (v) => {
    const val = Array.isArray(v) ? v[0] : v;
    if (!val) return null;
    if (val === "undefined" || val === "null") return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const qStart = parseDate(req.query.startDate);
  const qEnd = parseDate(req.query.endDate);
  const { page = "1", limit = "20" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * pageSize;

  try {
    // PatientRegistration does not have clinicId; filter by plan.clinicId instead
    const targetClinicId =
      user.role !== "admin"
        ? new mongoose.Types.ObjectId(String(clinicId))
        : req.query.clinicId
        ? new mongoose.Types.ObjectId(String(req.query.clinicId))
        : null;

    const overlapConditions = [];
    if (qEnd) overlapConditions.push({ "memberships.startDate": { $lte: qEnd } });
    if (qStart) overlapConditions.push({ $or: [{ "memberships.endDate": null }, { "memberships.endDate": { $gte: qStart } }] });
    const applyOverlap = overlapConditions.length > 0;

    const billingDateFilter = {};
    if (qStart) billingDateFilter.$gte = qStart;
    if (qEnd) billingDateFilter.$lte = qEnd;
    const applyBillingDate = Object.keys(billingDateFilter).length > 0;

    const topPipeline = [
      { $unwind: "$memberships" },
      ...(applyOverlap ? [{ $match: { $and: overlapConditions } }] : []),
      {
        $lookup: {
          from: "membershipplans",
          localField: "memberships.membershipId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      ...(targetClinicId ? [{ $match: { "plan.clinicId": targetClinicId } }] : []),
      {
        $lookup: {
          from: "appointments",
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$patientId", "$$pid"] },
                ...(targetClinicId ? { clinicId: targetClinicId } : {}),
                ...(applyBillingDate ? { startDate: billingDateFilter } : {}),
              },
            },
            { $project: { _id: 1 } },
          ],
          as: "apts",
        },
      },
      {
        $group: {
          _id: "$plan.name",
          totalRevenue: { $sum: { $ifNull: ["$plan.price", 0] } },
          count: { $sum: 1 },
          totalAppointments: { $sum: { $size: { $ifNull: ["$apts", []] } } },
        },
      },
      {
        $project: {
          membershipName: "$_id",
          totalRevenue: 1,
          count: 1,
          totalAppointments: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ];

    const rowsPipeline = [
      { $unwind: "$memberships" },
      ...(applyOverlap ? [{ $match: { $and: overlapConditions } }] : []),
      {
        $lookup: {
          from: "membershipplans",
          localField: "memberships.membershipId",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      ...(targetClinicId ? [{ $match: { "plan.clinicId": targetClinicId } }] : []),
      {
        $lookup: {
          from: "billings",
          let: { pid: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$patientId", "$$pid"] },
                ...(targetClinicId ? { clinicId: targetClinicId } : {}),
                ...(applyBillingDate ? { invoicedDate: billingDateFilter } : {}),
              },
            },
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
              $project: {
                paid: 1,
                doctorId: "$apt.doctorId",
              },
            },
          ],
          as: "billings",
        },
      },
      {
        $addFields: {
          totalPaid: {
            $sum: {
              $map: { input: "$billings", as: "b", in: { $ifNull: ["$$b.paid", 0] } },
            },
          },
          doctorIds: {
            $setUnion: [
              [],
              {
                $map: {
                  input: "$billings",
                  as: "b",
                  in: "$$b.doctorId",
                },
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { dids: "$doctorIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", { $ifNull: ["$$dids", []] }] } } },
            { $project: { _id: 1, name: 1, firstName: 1, lastName: 1 } },
          ],
          as: "doctors",
        },
      },
      {
        $project: {
          patientId: "$_id",
          membershipId: "$memberships.membershipId",
          patientName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$firstName", ""] },
                  " ",
                  { $ifNull: ["$lastName", ""] },
                ],
              },
            },
          },
          membershipName: "$plan.name",
          startDate: "$memberships.startDate",
          endDate: "$memberships.endDate",
          status: {
            $cond: [
              {
                $and: [
                  { $ne: ["$memberships.endDate", null] },
                  { $lte: ["$memberships.endDate", new Date()] },
                ],
              },
              "Expired",
              "Active",
            ],
          },
          totalRevenue: { $ifNull: ["$plan.price", 0] },
          totalPaid: 1,
          doctorNames: [],
        },
      },
      // Also collect doctorIds from appointments (fallback if no billings in window)
      {
        $lookup: {
          from: "appointments",
          let: { pidLocal: "$patientId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$patientId", "$$pidLocal"] },
                ...(targetClinicId ? { clinicId: targetClinicId } : {}),
                ...(applyBillingDate ? { startDate: billingDateFilter } : {}),
              },
            },
            { $project: { doctorId: 1 } },
          ],
          as: "apts",
        },
      },
      {
        $addFields: {
          doctorIdsFromApts: {
            $setUnion: [
              [],
              {
                $map: {
                  input: "$apts",
                  as: "a",
                  in: "$$a.doctorId",
                },
              },
            ],
          },
        },
      },
      {
        $addFields: {
          allDoctorIds: { $setUnion: ["$doctorIds", "$doctorIdsFromApts"] },
        },
      },
      {
        $lookup: {
          from: "users",
          let: { dids: "$allDoctorIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", { $ifNull: ["$$dids", []] }] } } },
            { $project: { _id: 1, name: 1, firstName: 1, lastName: 1 } },
          ],
          as: "doctorsResolved",
        },
      },
      {
        $addFields: {
          doctorNames: {
            $map: {
              input: "$doctorsResolved",
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
        },
      },
      {
        $addFields: {
          doctorName: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$doctorNames", []] } }, 0] },
              {
                $reduce: {
                  input: "$doctorNames",
                  initialValue: "",
                  in: {
                    $cond: [
                      { $eq: ["$$value", ""] },
                      "$$this",
                      { $concat: ["$$value", ", ", "$$this"] },
                    ],
                  },
                },
              },
              "Unknown",
            ],
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    const [top, rows, countAgg] = await Promise.all([
      runAgg("patientregistrations", topPipeline),
      runAgg("patientregistrations", rowsPipeline),
      runAgg("patientregistrations", [
        { $unwind: "$memberships" },
        ...(applyOverlap ? [{ $match: { $and: overlapConditions } }] : []),
        {
          $lookup: {
            from: "membershipplans",
            localField: "memberships.membershipId",
            foreignField: "_id",
            as: "plan",
          },
        },
        { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
        ...(targetClinicId ? [{ $match: { "plan.clinicId": targetClinicId } }] : []),
        { $count: "count" },
      ]),
    ]);

    const total = countAgg?.[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        top,
        rows,
        pagination: { page: pageNum, pageSize, total, hasNext: skip + rows.length < total },
      },
    });
  } catch (e) {
    console.error("membership-performance error:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch membership performance" });
  }
}

async function runAgg(collectionName, pipeline) {
  const mongooseConn = mongoose.connection;
  const coll = mongooseConn.collection(collectionName);
  return await coll.aggregate(pipeline).toArray();
}
