import dbConnect from "../../../../lib/database";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import Billing from "../../../../models/Billing";
import Service from "../../../../models/Service";
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

  const { departmentId, sortBy = "revenue", startDate, endDate } = req.query;
  if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
    return res.status(400).json({ success: false, message: "Valid departmentId is required" });
  }

  try {
    // Find all services of this department for this clinic
    const svcQuery = { departmentId: new mongoose.Types.ObjectId(departmentId) };
    if (user.role !== "admin") {
      svcQuery.clinicId = new mongoose.Types.ObjectId(String(clinicId));
    } else if (req.query.clinicId) {
      svcQuery.clinicId = new mongoose.Types.ObjectId(String(req.query.clinicId));
    }
    const services = await Service.find(svcQuery).select("name clinicId").lean();
    const serviceNames = services.map((s) => s.name);
    const clinicObjectId =
      user.role === "admin" && req.query.clinicId
        ? new mongoose.Types.ObjectId(String(req.query.clinicId))
        : new mongoose.Types.ObjectId(String(clinicId));

    // Aggregate billing only for treatments that belong to this department
    const match = {
      service: "Treatment",
      clinicId: clinicObjectId,
      treatment: { $in: serviceNames.length ? serviceNames : ["__none__"] },
    };
    if (startDate || endDate) {
      match.invoicedDate = {};
      if (startDate) match.invoicedDate.$gte = new Date(startDate);
      if (endDate) match.invoicedDate.$lte = new Date(endDate);
      if (Object.keys(match.invoicedDate).length === 0) delete match.invoicedDate;
    }

    const data = await Billing.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$treatment",
          totalRevenue: { $sum: { $ifNull: ["$paid", 0] } },
          totalBookings: { $sum: 1 },
          averagePrice: { $avg: { $ifNull: ["$amount", 0] } },
        },
      },
      {
        $project: {
          serviceName: "$_id",
          totalRevenue: 1,
          totalBookings: 1,
          averagePrice: 1,
        },
      },
    ]);

    let sortFn;
    if (sortBy === "bookings") {
      sortFn = (a, b) => b.totalBookings - a.totalBookings;
    } else {
      sortFn = (a, b) => b.totalRevenue - a.totalRevenue;
    }

    const sorted = data.sort(sortFn);

    return res.status(200).json({
      success: true,
      data: sorted,
    });
  } catch (error) {
    console.error("service-performance error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch service performance" });
  }
}
