import dbConnect from "../../../../lib/database";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";
import Clinic from "../../../../models/Clinic";
import { isNewClinicInMockPeriod } from "../../../../lib/mockDataGenerator";

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
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

  // Get clinic to check registeredAt
  let clinic = null;
  if (user.role === "clinic") {
    clinic = await Clinic.findOne({ owner: user._id });
  } else if (clinicId) {
    clinic = await Clinic.findById(clinicId);
  }

  // Check if clinic is within 2-day mock data period and has no real data
  if (clinic && isNewClinicInMockPeriod(clinic.registeredAt)) {
    const appointmentCount = await mongoose.connection.collection("appointments").countDocuments({
      clinicId: targetClinicId,
      ...(qStart || qEnd ? {
        startDate: {
          ...(qStart ? { $gte: qStart } : {}),
          ...(qEnd ? { $lte: qEnd } : {})
        }
      } : {})
    });

    if (appointmentCount === 0) {
      console.log('📊 Returning mock appointment stats for new clinic:', clinic._id);
      
      return res.status(200).json({
        success: true,
        data: {
          statusCounts: {
            completed: randomInt(20, 60),
            booked: randomInt(10, 30),
            cancelled: randomInt(3, 10),
            noShow: randomInt(2, 8),
            pending: randomInt(5, 15),
          },
          dailyTrend: [
            { date: 'Mon', appointments: randomInt(10, 30) },
            { date: 'Tue', appointments: randomInt(10, 30) },
            { date: 'Wed', appointments: randomInt(10, 30) },
            { date: 'Thu', appointments: randomInt(10, 30) },
            { date: 'Fri', appointments: randomInt(10, 30) },
            { date: 'Sat', appointments: randomInt(5, 20) },
            { date: 'Sun', appointments: randomInt(2, 10) },
          ],
          doctorPerformance: [
            { doctorId: new mongoose.Types.ObjectId(), doctorName: 'Dr. Smith', totalAppointments: randomInt(15, 50), revenue: randomInt(5000, 20000) },
            { doctorId: new mongoose.Types.ObjectId(), doctorName: 'Dr. Johnson', totalAppointments: randomInt(12, 45), revenue: randomInt(4000, 18000) },
            { doctorId: new mongoose.Types.ObjectId(), doctorName: 'Dr. Williams', totalAppointments: randomInt(10, 40), revenue: randomInt(3500, 15000) },
          ],
          summary: {
            totalAppointments: randomInt(50, 150),
            completionRate: randomInt(60, 85),
            cancellationRate: randomInt(5, 15),
            noShowRate: randomInt(3, 10),
          },
        },
        isMockData: true,
        message: 'Showing sample appointment data for new clinic!',
      });
    }
  }

  const parseId = (v) => {
    const val = Array.isArray(v) ? v[0] : v;
    if (!val) return null;
    if (!mongoose.Types.ObjectId.isValid(val)) return null;
    return new mongoose.Types.ObjectId(val);
  };
  const parseDate = (v) => {
    const val = Array.isArray(v) ? v[0] : v;
    if (!val || val === "undefined" || val === "null") return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const qStart = parseDate(req.query.startDate);
  const qEnd = parseDate(req.query.endDate);
  const doctorId = parseId(req.query.doctorId);
  const departmentId = parseId(req.query.departmentId);

  const targetClinicId =
    user.role !== "admin"
      ? new mongoose.Types.ObjectId(String(clinicId))
      : req.query.clinicId
      ? new mongoose.Types.ObjectId(String(req.query.clinicId))
      : null;

  try {
    const matchApt = {};
    if (targetClinicId) matchApt.clinicId = targetClinicId;
    if (qStart || qEnd) {
      matchApt.startDate = {};
      if (qStart) matchApt.startDate.$gte = qStart;
      if (qEnd) matchApt.startDate.$lte = qEnd;
      if (!Object.keys(matchApt.startDate).length) delete matchApt.startDate;
    }
    if (doctorId) matchApt.doctorId = doctorId;

    const pipelineBase = [
      { $match: matchApt },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "svc",
        },
      },
      { $unwind: { path: "$svc", preserveNullAndEmptyArrays: true } },
    ];
    if (departmentId) {
      pipelineBase.push({ $match: { "svc.departmentId": departmentId } });
    }

    const statusCompleted = ["Completed", "invoice", "Consultation"];
    const statusCancelled = ["Cancelled"];
    const statusNoShow = ["Rejected"];

    const dateFilterForBilling = {};
    if (qStart) dateFilterForBilling.$gte = qStart;
    if (qEnd) dateFilterForBilling.$lte = qEnd;
    const applyBillingDate = Object.keys(dateFilterForBilling).length > 0;

    const result = await mongoose.connection.collection("appointments").aggregate([
      ...pipelineBase,
      {
        $facet: {
          leaderboard: [
            { $group: { _id: "$doctorId", totalAppointments: { $sum: 1 } } },
            { $sort: { totalAppointments: -1 } },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "doc",
              },
            },
            {
              $project: {
                doctorId: "$_id",
                totalAppointments: 1,
                doctorName: {
                  $let: {
                    vars: { d: { $arrayElemAt: ["$doc", 0] } },
                    in: {
                      $cond: [
                        { $ifNull: ["$$d.name", false] },
                        "$$d.name",
                        { $trim: { input: { $concat: [{ $ifNull: ["$$d.firstName", ""] }, " ", { $ifNull: ["$$d.lastName", ""] }] } } },
                      ],
                    },
                  },
                },
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalAppointments: { $sum: 1 },
                completedAppointments: { $sum: { $cond: [{ $in: ["$status", statusCompleted] }, 1, 0] } },
                cancelledAppointments: { $sum: { $cond: [{ $in: ["$status", statusCancelled] }, 1, 0] } },
                noShowAppointments: { $sum: { $cond: [{ $in: ["$status", statusNoShow] }, 1, 0] } },
              },
            },
          ],
          filters: [
            {
              $group: {
                _id: null,
                doctorIds: { $addToSet: "$doctorId" },
                departmentIds: { $addToSet: "$svc.departmentId" },
              },
            },
            {
              $project: {
                doctorIds: {
                  $filter: {
                    input: "$doctorIds",
                    as: "x",
                    cond: { $ne: ["$$x", null] },
                  },
                },
                departmentIds: {
                  $filter: {
                    input: "$departmentIds",
                    as: "y",
                    cond: { $ne: ["$$y", null] },
                  },
                },
              },
            },
          ],
          doctorReport: [
            {
              $group: {
                _id: "$doctorId",
                appointmentIds: { $addToSet: "$_id" },
                totalAppointments: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: "billings",
                let: { aptIds: "$appointmentIds" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $in: ["$appointmentId", { $ifNull: ["$$aptIds", []] }] },
                      ...(targetClinicId ? { clinicId: targetClinicId } : {}),
                      ...(applyBillingDate ? { invoicedDate: dateFilterForBilling } : {}),
                    },
                  },
                  { $group: { _id: null, revenue: { $sum: { $ifNull: ["$paid", 0] } } } },
                ],
                as: "rev",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "doc",
              },
            },
            {
              $project: {
                doctorId: "$_id",
                totalAppointments: 1,
                revenue: { $ifNull: [{ $arrayElemAt: ["$rev.revenue", 0] }, 0] },
                doctorName: {
                  $let: {
                    vars: { d: { $arrayElemAt: ["$doc", 0] } },
                    in: {
                      $cond: [
                        { $ifNull: ["$$d.name", false] },
                        "$$d.name",
                        { $trim: { input: { $concat: [{ $ifNull: ["$$d.firstName", ""] }, " ", { $ifNull: ["$$d.lastName", ""] }] } } },
                      ],
                    },
                  },
                },
              },
            },
            { $sort: { revenue: -1 } },
          ],
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1 } },
            { $sort: { count: -1 } },
          ],
          appointmentsByDept: [
            {
              $group: {
                _id: "$svc.departmentId",
                count: { $sum: 1 },
              },
            },
            {
              $lookup: {
                from: "departments",
                localField: "_id",
                foreignField: "_id",
                as: "dept",
              },
            },
            {
              $project: {
                departmentId: "$_id",
                count: 1,
                departmentName: { $ifNull: [{ $arrayElemAt: ["$dept.name", 0] }, "Unassigned"] },
              },
            },
            { $sort: { count: -1 } },
          ],
          cancelledAppointments: [
            { $match: { status: { $in: statusCancelled } } },
            { $lookup: { from: "patients", localField: "patientId", foreignField: "_id", as: "patient" } },
            { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
            { 
              $project: { 
                patientName: { 
                  $let: { 
                    vars: { 
                      joinedName: { $ifNull: ["$patient.name", { $concat: ["$patient.firstName", " ", "$patient.lastName"] }] },
                      denormalizedName: "$patientName"
                    },
                    in: { 
                      $ifNull: [ 
                        "$$joinedName", 
                        { 
                          $cond: { 
                            if: { $and: [ { $ne: ["$$denormalizedName", null] }, { $ne: ["$$denormalizedName", ""] } ] }, 
                            then: "$$denormalizedName", 
                            else: "Patient Name Missing" 
                          } 
                        }
                      ]
                    }
                  }
                },
                serviceName: "$svc.name", 
                treatment: "$treatment", 
                notes: "$notes" 
              }
            }
          ],
          noShowAppointments: [
            { $match: { status: { $in: statusNoShow } } },
            { $lookup: { from: "patients", localField: "patientId", foreignField: "_id", as: "patient" } },
            { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
            { 
              $project: { 
                patientName: { 
                  $let: { 
                    vars: { 
                      joinedName: { $ifNull: ["$patient.name", { $concat: ["$patient.firstName", " ", "$patient.lastName"] }] },
                      denormalizedName: "$patientName"
                    },
                    in: { 
                      $ifNull: [ 
                        "$$joinedName", 
                        { 
                          $cond: { 
                            if: { $and: [ { $ne: ["$$denormalizedName", null] }, { $ne: ["$$denormalizedName", ""] } ] }, 
                            then: "$$denormalizedName", 
                            else: "Patient Name Missing" 
                          } 
                        }
                      ]
                    }
                  }
                },
                serviceName: "$svc.name", 
                treatment: "$treatment", 
                notes: "$notes" 
              }
            }
          ]
        },
      },
    ]).toArray();

    const out = result[0] || {};

    let doctors = [];
    let departments = [];
    if (out.filters && out.filters.length > 0) {
      const f = out.filters[0];
      const [docRows, depRows] = await Promise.all([
        f.doctorIds?.length
          ? mongoose.connection.collection("users").aggregate([
              { $match: { _id: { $in: f.doctorIds } } },
              {
                $project: {
                  _id: 1,
                  name: {
                    $cond: [
                      { $ifNull: ["$name", false] },
                      "$name",
                      { $trim: { input: { $concat: [{ $ifNull: ["$firstName", ""] }, " ", { $ifNull: ["$lastName", ""] }] } } },
                    ],
                  },
                },
              },
            ]).toArray()
          : [],
        f.departmentIds?.length
          ? mongoose.connection.collection("departments").aggregate([
              { $match: { _id: { $in: f.departmentIds } } },
              { $project: { _id: 1, name: 1 } },
            ]).toArray()
          : [],
      ]);
      doctors = docRows.map((d) => ({ id: d._id, name: d.name }));
      departments = depRows.map((d) => ({ id: d._id, name: d.name }));
    }

    // Ensure all known statuses appear with zero if missing
    const ALL_STATUSES = [
      "booked",
      "enquiry",
      "Discharge",
      "Arrived",
      "Consultation",
      "Cancelled",
      "Approved",
      "Rescheduled",
      "Waiting",
      "Rejected",
      "Completed",
      "invoice",
    ];
    const rawStatusCounts = Array.isArray(out.statusCounts) ? out.statusCounts : [];
    const statusMap = new Map(rawStatusCounts.map((s) => [s.status, s.count]));
    const statusCountsAll = ALL_STATUSES.map((s) => ({ status: s, count: statusMap.get(s) || 0 }));

    return res.status(200).json({
      success: true,
      data: {
        leaderboard: out.leaderboard || [],
        summary: (out.summary && out.summary[0]) || { totalAppointments: 0, completedAppointments: 0, cancelledAppointments: 0, noShowAppointments: 0 },
        doctorReport: out.doctorReport || [],
        statusCounts: statusCountsAll,
        appointmentsByDept: out.appointmentsByDept || [],
        cancelledAppointments: out.cancelledAppointments || [],
        noShowAppointments: out.noShowAppointments || [],
        filters: { doctors, departments },
      },
    });
  } catch (e) {
    console.error("appointment-stats error:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch appointment stats" });
  }
}
