
import dbConnect from "../../../../lib/database";
import Supplier from "../../../../models/stocks/Supplier";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }

  let me;
  try {
    me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } catch (error) {
    console.error("Authorization error:", error);
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

  const clinicMatch = clinicId ? { clinicId: new mongoose.Types.ObjectId(String(clinicId)) } : {};

  try {
    const totalSuppliers = await Supplier.countDocuments(clinicMatch);

    const statusStats = await Supplier.aggregate([
      { $match: clinicMatch },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);

    const overallStats = await Supplier.aggregate([
        { $match: clinicMatch },
        {
          $group: {
            _id: null,
            totalInvoice: { $sum: "$invoiceTotal" },
            totalPaid: { $sum: "$totalPaid" },
            totalBalance: { $sum: "$totalBalance" },
            totalOpeningBalance: { $sum: "$openingBalance" },
          },
        },
      ]);
  
      const openingBalanceByType = await Supplier.aggregate([
        { $match: clinicMatch },
        {
          $group: {
            _id: "$openingBalanceType",
            total: { $sum: "$openingBalance" },
          },
        },
        { $project: { name: "$_id", total: 1, _id: 0 } },
      ]);

    const topSuppliers = await Supplier.find(clinicMatch)
      .sort({ invoiceTotal: -1 })
      .limit(5)
      .select("name invoiceTotal")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        statusStats,
        overallStats: overallStats[0] || {},
        openingBalanceByType,
        topSuppliers,
      },
    });
  } catch (error) {
    console.error("Error fetching supplier report data:", error);
    res.status(500).json({ success: false, message: "An error occurred while fetching the report data" });
  }
}
