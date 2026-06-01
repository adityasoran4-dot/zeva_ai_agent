import dbConnect from "../../../../lib/database";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import Billing from "../../../../models/Billing";
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

  const { startDate, endDate, limit = "10" } = req.query;
  const lim = Math.max(1, Math.min(25, parseInt(limit, 10) || 10));

  try {
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

    const rows = await Billing.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$package",
          totalRevenue: { $sum: { $ifNull: ["$paid", 0] } },
          totalBookings: { $sum: 1 },
          totalAppointments: { $sum: { $cond: [{ $ifNull: ["$appointmentId", false] }, 1, 0] } },
          averagePrice: { $avg: { $ifNull: ["$amount", 0] } },
        },
      },
      {
        $project: {
          packageName: "$_id",
          totalRevenue: 1,
          totalBookings: 1,
          totalAppointments: 1,
          averagePrice: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: lim },
    ]);

    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    console.error("package-performance error:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch package performance" });
  }
}
