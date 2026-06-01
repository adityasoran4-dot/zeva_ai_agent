import dbConnect from "../../../../lib/database";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import Billing from "../../../../models/Billing";
import mongoose from "mongoose";
import Department from "../../../../models/Department";
import Appointment from "../../../../models/Appointment";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
  } catch (e) {
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
    const { startDate, endDate, top = "3" } = req.query;
    const topN = Math.max(1, Math.min(10, parseInt(top, 10) || 3));

    const match = {
      service: "Treatment",
    };
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
      {
        $group: {
          _id: "$treatment",
          clinicId: { $first: "$clinicId" },
          totalRevenue: { $sum: { $ifNull: ["$paid", 0] } },
          totalBookings: { $sum: 1 },
          avgPrice: { $avg: { $ifNull: ["$amount", 0] } },
        },
      },
      {
        $lookup: {
          from: "services",
          let: { cId: "$clinicId", sName: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$clinicId", "$$cId"] },
                    { $eq: ["$name", "$$sName"] },
                  ],
                },
              },
            },
            { $project: { departmentId: 1, name: 1, _id: 0 } },
          ],
          as: "serviceDoc",
        },
      },
      {
        $project: {
          treatment: "$_id",
          clinicId: 1,
          totalRevenue: 1,
          totalBookings: 1,
          avgPrice: 1,
          departmentId: { $ifNull: [{ $arrayElemAt: ["$serviceDoc.departmentId", 0] }, null] },
        },
      },
      {
        $group: {
          _id: "$departmentId",
          clinicId: { $first: "$clinicId" },
          totalRevenue: { $sum: "$totalRevenue" },
          totalBookings: { $sum: "$totalBookings" },
          avgPrice: { $avg: "$avgPrice" },
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
          departmentName: {
            $ifNull: [{ $arrayElemAt: ["$dept.name", 0] }, "Unassigned"],
          },
          totalRevenue: 1,
          totalBookings: 1,
          avgPrice: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ];

    const departments = await Billing.aggregate(pipeline);

    // Identify top departments
    const topDepartments = departments.slice(0, topN);
    const topDepartmentIds = topDepartments
      .map((d) => d.departmentId)
      .filter((id) => id);

    // Fetch top departments' service performance
    let servicesByDepartment = {};
    if (topDepartmentIds.length) {
      const serviceAgg = await Billing.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$treatment",
            clinicId: { $first: "$clinicId" },
            totalRevenue: { $sum: { $ifNull: ["$paid", 0] } },
            totalBookings: { $sum: 1 },
            avgPrice: { $avg: { $ifNull: ["$amount", 0] } },
          },
        },
        {
          $lookup: {
            from: "services",
            let: { cId: "$clinicId", sName: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$clinicId", "$$cId"] },
                      { $eq: ["$name", "$$sName"] },
                    ],
                  },
                },
              },
              { $project: { departmentId: 1, name: 1 } },
            ],
            as: "serviceDoc",
          },
        },
        {
          $project: {
            serviceName: "$_id",
            clinicId: 1,
            totalRevenue: 1,
            totalBookings: 1,
            avgPrice: 1,
            departmentId: { $ifNull: [{ $arrayElemAt: ["$serviceDoc.departmentId", 0] }, null] },
          },
        },
        { $match: { departmentId: { $in: topDepartmentIds } } },
        {
          $group: {
            _id: "$departmentId",
            services: {
              $push: {
                serviceName: "$serviceName",
                totalRevenue: "$totalRevenue",
                totalBookings: "$totalBookings",
                avgPrice: "$avgPrice",
              },
            },
          },
        },
      ]);

      serviceAgg.forEach((d) => {
        servicesByDepartment[String(d._id)] = d.services.sort(
          (a, b) => b.totalRevenue - a.totalRevenue
        );
      });
    }

    // Aggregation for appointments by department
    const appointmentMatch = {};
    if (user.role !== "admin") {
      appointmentMatch.clinicId = new mongoose.Types.ObjectId(String(clinicId));
    } else if (req.query.clinicId) {
      appointmentMatch.clinicId = new mongoose.Types.ObjectId(String(req.query.clinicId));
    }
    if (startDate || endDate) {
      appointmentMatch.startDate = {};
      if (startDate) appointmentMatch.startDate.$gte = new Date(startDate);
      if (endDate) appointmentMatch.startDate.$lte = new Date(endDate);
      if (Object.keys(appointmentMatch.startDate).length === 0) delete appointmentMatch.startDate;
    }

    const appointmentPipeline = [
      { $match: appointmentMatch },
      {
        $lookup: {
          from: "services",
          localField: "serviceId",
          foreignField: "_id",
          as: "serviceInfo",
        },
      },
      {
        $unwind: { path: "$serviceInfo", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: "$serviceInfo.departmentId",
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "deptInfo",
        },
      },
      {
        $project: {
          departmentId: "$_id",
          departmentName: { $ifNull: [{ $arrayElemAt: ["$deptInfo.name", 0] }, "Unassigned"] },
          totalAppointments: 1,
        },
      },
      { $sort: { totalAppointments: -1 } },
    ];

    const appointmentsByDept = await Appointment.aggregate(appointmentPipeline);

    return res.status(200).json({
      success: true,
      data: {
        departments,
        topDepartments,
        servicesByDepartment,
        appointmentsByDept,
      },
    });
  } catch (error) {
    console.error("department-performance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate department performance",
    });
  }
}
