import dbConnect from "../../../../lib/database";
import Billing from "../../../../models/Billing";
import Appointment from "../../../../models/Appointment";
import Service from "../../../../models/Service";
import Department from "../../../../models/Department";
import User from "../../../../models/Users";
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

  const {
    startDate,
    endDate,
    doctorId,
    departmentId,
    serviceId,
    view,
    paymentsPage,
    paymentsPageSize,
    pendingType,
    pendingPage,
    pendingPageSize,
  } = req.query;

  const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = endDate ? new Date(endDate) : new Date();
  const startAt = new Date(start);
  startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(end);
  endAt.setHours(23, 59, 59, 999);

  const clinicMatch = clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {};
  const dateMatch = { invoicedDate: { $gte: startAt, $lte: endAt } };
  const pageNum = Math.max(1, parseInt(paymentsPage || "1", 10));
  const pageSizeNum = Math.max(1, parseInt(paymentsPageSize || "10", 10));
  const skipNum = (pageNum - 1) * pageSizeNum;

  try {
    const basePipeline = [
      { $match: { ...clinicMatch, ...dateMatch } },
      {
        $lookup: {
          from: "appointments",
          localField: "appointmentId",
          foreignField: "_id",
          as: "appointment",
        },
      },
      { $unwind: "$appointment" },
    ];

    if (doctorId) {
      basePipeline.push({
        $match: { "appointment.doctorId": new mongoose.Types.ObjectId(String(doctorId)) },
      });
    }
    if (serviceId) {
      basePipeline.push({
        $match: { "appointment.serviceId": new mongoose.Types.ObjectId(String(serviceId)) },
      });
    }

    // total revenue
    const totalRevenueAgg = await Billing.aggregate([
      ...basePipeline,
      { $group: { _id: null, total: { $sum: { $ifNull: ["$paid", 0] } } } },
    ]);
    const totalRevenue = Math.round(Number(totalRevenueAgg[0]?.total || 0));

    // revenue by doctor
    const byDoctorAgg = await Billing.aggregate([
      ...basePipeline,
      { $group: { _id: "$appointment.doctorId", amount: { $sum: { $ifNull: ["$paid", 0] } } } },
      { $sort: { amount: -1 } },
    ]);
    const doctorIds = byDoctorAgg.map((d) => d._id).filter(Boolean);
    const doctorMap = doctorIds.length
      ? new Map(
          (await User.find({ _id: { $in: doctorIds } }).select("_id name").lean()).map((u) => [
            String(u._id),
            u.name || "Unknown",
          ])
        )
      : new Map();
    const revenueByDoctor = byDoctorAgg.map((d) => ({
      doctorId: String(d._id || ""),
      name: doctorMap.get(String(d._id)) || "Unknown",
      amount: Math.round(Number(d.amount || 0)),
    }));

    // revenue by service
    const byServiceAgg = await Billing.aggregate([
      ...basePipeline,
      { $group: { _id: "$appointment.serviceId", amount: { $sum: { $ifNull: ["$paid", 0] } } } },
      { $sort: { amount: -1 } },
    ]);
    const serviceIds = byServiceAgg.map((s) => s._id).filter(Boolean);
    const serviceMap = serviceIds.length
      ? new Map(
          (await Service.find({ _id: { $in: serviceIds } }).select("_id name departmentId").lean()).map((s) => [
            String(s._id),
            { name: s.name || "Unknown", departmentId: s.departmentId ? String(s.departmentId) : null },
          ])
        )
      : new Map();
    const revenueByService = byServiceAgg.map((s) => ({
      serviceId: String(s._id || ""),
      name: serviceMap.get(String(s._id))?.name || "Unknown",
      amount: Math.round(Number(s.amount || 0)),
    }));

    // department filter applied after service lookup
    let departmentFilteredPipeline = [...basePipeline];
    if (departmentId) {
      departmentFilteredPipeline = [
        ...basePipeline,
        {
          $lookup: {
            from: "services",
            localField: "appointment.serviceId",
            foreignField: "_id",
            as: "service",
          },
        },
        { $unwind: "$service" },
        { $match: { "service.departmentId": new mongoose.Types.ObjectId(String(departmentId)) } },
      ];
    }

    // revenue by department
    const byDepartmentAgg = await Billing.aggregate([
      ...departmentFilteredPipeline,
      {
        $lookup: {
          from: "services",
          localField: "appointment.serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      { $group: { _id: "$service.departmentId", amount: { $sum: { $ifNull: ["$paid", 0] } } } },
      { $sort: { amount: -1 } },
    ]);
    const departmentIds = byDepartmentAgg.map((d) => d._id).filter(Boolean);
    const departmentMap = departmentIds.length
      ? new Map(
          (await Department.find({ _id: { $in: departmentIds } }).select("_id name").lean()).map((d) => [
            String(d._id),
            d.name || "Unknown",
          ])
        )
      : new Map();
    const revenueByDepartment = byDepartmentAgg.map((d) => ({
      departmentId: String(d._id || ""),
      name: departmentMap.get(String(d._id)) || "Unknown",
      amount: Math.round(Number(d.amount || 0)),
    }));

    // revenue by payment method (respect multiplePayments)
    const paymentsAgg = await Billing.aggregate([
      ...basePipeline,
      {
        $project: {
          payments: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$multiplePayments", []] } }, 0] },
              "$multiplePayments",
              [{ paymentMethod: "$paymentMethod", amount: "$paid" }],
            ],
          },
        },
      },
      { $unwind: "$payments" },
      {
        $group: {
          _id: "$payments.paymentMethod",
          amount: { $sum: { $ifNull: ["$payments.amount", 0] } },
        },
      },
      { $sort: { amount: -1 } },
    ]);
    const revenueByPaymentMethod = paymentsAgg.map((p) => ({
      method: p._id || "Unknown",
      amount: Math.round(Number(p.amount || 0)),
    }));

    // pending payments list (pending > 0)
    const pPageNum = Math.max(1, parseInt(pendingPage || "1", 10));
    const pPageSizeNum = Math.max(1, parseInt(pendingPageSize || "10", 10));
    const pSkipNum = (pPageNum - 1) * pPageSizeNum;
    const pendingPipelineBase = [
      ...basePipeline,
      { $match: pendingType === "advance" ? { advance: { $gt: 0 } } : { pending: { $gt: 0 } } },
      {
        $lookup: {
          from: "patientregistrations",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "services",
          localField: "appointment.serviceId",
          foreignField: "_id",
          as: "svc",
        },
      },
      { $unwind: { path: "$svc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceNumber: "$invoiceNumber",
          dueDate: "$invoicedDate",
          totalAmount: { $ifNull: ["$amount", 0] },
          paidAmount: { $ifNull: ["$paid", 0] },
          pendingAmount: { $ifNull: ["$pending", 0] },
          advanceAmount: { $ifNull: ["$advance", 0] },
          serviceName: {
            $cond: [
              { $eq: ["$service", "Package"] },
              { $ifNull: ["$package", "$svc.name"] },
              {
                $cond: [
                  { $eq: ["$service", "Treatment"] },
                  { $ifNull: ["$treatment", "$svc.name"] },
                  "$svc.name",
                ],
              },
            ],
          },
          patientName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$patient.firstName", ""] },
                  " ",
                  { $ifNull: ["$patient.lastName", ""] },
                ],
              },
            },
          },
        },
      },
    ];
    const pendingCountAgg = await Billing.aggregate([...pendingPipelineBase, { $count: "total" }]);
    const pendingTotal = Number(pendingCountAgg[0]?.total || 0);
    const pendingPageAgg = await Billing.aggregate([
      ...pendingPipelineBase,
      { $sort: { dueDate: -1 } },
      { $skip: pSkipNum },
      { $limit: pPageSizeNum },
    ]);
    const pendingPayments = pendingPageAgg.map((p) => ({
      invoiceNumber: p.invoiceNumber || "",
      patientName: p.patientName || "",
      serviceName: p.serviceName || "Unknown",
      totalAmount: Math.round(Number(p.totalAmount || 0)),
      paidAmount: Math.round(Number(p.paidAmount || 0)),
      pendingAmount: Math.round(Number(p.pendingAmount || 0)),
      advanceAmount: Math.round(Number(p.advanceAmount || 0)),
      dueDate: p.dueDate || null,
    }));

    const topPendingAgg = await Billing.aggregate([
      { $match: { ...clinicMatch, ...dateMatch, pending: { $gt: 0 } } },
      {
        $group: {
          _id: "$patientId",
          amount: { $sum: { $ifNull: ["$pending", 0] } },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "patientregistrations",
          localField: "_id",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          patientId: { $toString: "$_id" },
          name: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$patient.firstName", ""] },
                  " ",
                  { $ifNull: ["$patient.lastName", ""] },
                ],
              },
            },
          },
          amount: { $round: ["$amount", 0] },
        },
      },
    ]);
    const topPendingPatients = topPendingAgg.map((r) => ({
      patientId: r.patientId || "",
      name: r.name || "Unknown",
      amount: Math.round(Number(r.amount || 0)),
    }));

    const topAdvanceAgg = await Billing.aggregate([
      { $match: { ...clinicMatch, ...dateMatch, advance: { $gt: 0 } } },
      {
        $group: {
          _id: "$patientId",
          amount: { $sum: { $ifNull: ["$advance", 0] } },
        },
      },
      { $sort: { amount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "patientregistrations",
          localField: "_id",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          patientId: { $toString: "$_id" },
          name: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$patient.firstName", ""] },
                  " ",
                  { $ifNull: ["$patient.lastName", ""] },
                ],
              },
            },
          },
          amount: { $round: ["$amount", 0] },
        },
      },
    ]);
    const topAdvancePatients = topAdvanceAgg.map((r) => ({
      patientId: r.patientId || "",
      name: r.name || "Unknown",
      amount: Math.round(Number(r.amount || 0)),
    }));

    // payment reports list
    const paymentsPipelineBase = [
      ...basePipeline,
      {
        $project: {
          invoiceNumber: "$invoiceNumber",
          invoicedDate: "$invoicedDate",
          paid: { $ifNull: ["$paid", 0] },
          pending: { $ifNull: ["$pending", 0] },
          patientId: "$patientId",
          appointment: "$appointment",
          payments: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$multiplePayments", []] } }, 0] },
              "$multiplePayments",
              [{ paymentMethod: "$paymentMethod", amount: "$paid" }],
            ],
          },
        },
      },
      { $unwind: "$payments" },
      {
        $lookup: {
          from: "patientregistrations",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "services",
          localField: "appointment.serviceId",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: { path: "$service", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invoiceNumber: 1,
          paymentDate: "$invoicedDate",
          amount: { $ifNull: ["$payments.amount", 0] },
          method: "$payments.paymentMethod",
          serviceName: "$service.name",
          patientName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$patient.firstName", ""] },
                  " ",
                  { $ifNull: ["$patient.lastName", ""] },
                ],
              },
            },
          },
          paid: 1,
          pending: 1,
        },
      },
    ];
    const paymentsCountAgg = await Billing.aggregate([...paymentsPipelineBase, { $count: "total" }]);
    const paymentsTotal = Number(paymentsCountAgg[0]?.total || 0);
    const paymentsPageAgg = await Billing.aggregate([
      ...paymentsPipelineBase,
      { $sort: { paymentDate: -1 } },
      { $skip: skipNum },
      { $limit: pageSizeNum },
    ]);
    const payments = paymentsPageAgg.map((p) => {
      let status = "Pending";
      const paid = Math.round(Number(p.paid || 0));
      const pending = Math.round(Number(p.pending || 0));
      if (pending === 0 && paid > 0) status = "Paid";
      else if (pending > 0 && paid > 0) status = "Partially Paid";
      else status = "Pending";
      // normalize method labels
      const method =
        p.method === "BT" ? "Bank Transfer" :
        p.method === "Tabby" ? "Tabby" :
        p.method === "Tamara" ? "Online Payment" :
        p.method || "Unknown";
      return {
        invoiceNumber: p.invoiceNumber || "",
        patientName: p.patientName || "",
        service: p.serviceName || "Unknown",
        amount: Math.round(Number(p.amount || 0)),
        paymentMethod: method,
        paymentStatus: status,
        paymentDate: p.paymentDate || null,
      };
    });

    // views: daily/weekly/monthly/yearly
    const views = {};
    const dailyAgg = await Billing.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoicedDate" } },
          amount: { $sum: { $ifNull: ["$paid", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    views.daily = dailyAgg.map((d) => ({ label: d._id, amount: Math.round(Number(d.amount || 0)) }));

    const weeklyAgg = await Billing.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$invoicedDate" },
            week: { $isoWeek: "$invoicedDate" },
          },
          amount: { $sum: { $ifNull: ["$paid", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);
    views.weekly = weeklyAgg.map((w) => ({
      label: `W${w._id.week}-${w._id.year}`,
      amount: Math.round(Number(w.amount || 0)),
    }));

    const monthlyAgg = await Billing.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$invoicedDate" } },
          amount: { $sum: { $ifNull: ["$paid", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    views.monthly = monthlyAgg.map((m) => ({ label: m._id, amount: Math.round(Number(m.amount || 0)) }));

    const yearlyAgg = await Billing.aggregate([
      ...basePipeline,
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$invoicedDate" } },
          amount: { $sum: { $ifNull: ["$paid", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    views.yearly = yearlyAgg.map((y) => ({ label: y._id, amount: Math.round(Number(y.amount || 0)) }));

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        revenueByDoctor,
        revenueByService,
        revenueByDepartment,
        revenueByPaymentMethod,
        payments,
        pendingPayments,
        pendingTotal,
        paymentsTotal,
        topPendingPatients,
        topAdvancePatients,
        views,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Failed to load revenue report" });
  }
}
