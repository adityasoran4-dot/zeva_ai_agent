import dbConnect from "../../../../lib/database";
import mongoose from "mongoose";
import Clinic from "../../../../models/Clinic";
import AllocatedStockItem from "../../../../models/stocks/AllocatedStockItem";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
/**
 * GET /api/stocks/allocated-stock-items/analytics
 * Returns global analytics across ALL allocated stock items for the current clinic
 * Metrics:
 * - total: total items (excluding Cancelled/Deleted)
 * - inUseNow: items currently in use (status In_Use or Issued)
 * - expired: items with status Expired OR expiryDate < today
 * - usedToday: items marked Used with updatedAt on current day
 * - expiringSoon: items with expiryDate between today and +N days (default 30)
 *
 * Optional query:
 * - days: number window for expiringSoon (default 30)
 */
export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id.toString();
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      clinicId = me.clinicId?.toString();
      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      }
    } else if (me.role === "admin") {
      clinicId = req.query?.clinicId;
      if (!clinicId || !mongoose.Types.ObjectId.isValid(clinicId)) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
      }
    }

    const daysParam = Number(req.query?.days || 30);
    const daysWindow =
      Number.isFinite(daysParam) && daysParam > 0 ? daysParam : 30;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );
    const soonDate = new Date(now.getTime() + daysWindow * 24 * 60 * 60 * 1000);

    let baseScope = { clinicId };

    if (["doctor", "doctorStaff", "agent"].includes(me.role)) {
      baseScope.user = me._id;
    }

    const total = await AllocatedStockItem.countDocuments({
      ...baseScope,
      status: { $nin: ["Cancelled", "Deleted"] },
    });

    const inUseNow = await AllocatedStockItem.countDocuments({
      ...baseScope,
      status: { $in: ["In_Use", "Issued"] },
    });

    const expired = await AllocatedStockItem.countDocuments({
      ...baseScope,
      $or: [{ status: "Expired" }, { expiryDate: { $lt: startOfToday } }],
    });

    const usedToday = await AllocatedStockItem.countDocuments({
      ...baseScope,
      status: "Used",
      updatedAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const expiringSoon = await AllocatedStockItem.countDocuments({
      ...baseScope,
      expiryDate: { $gte: startOfToday, $lte: soonDate },
      status: { $nin: ["Cancelled", "Deleted"] },
    });

    return res.status(200).json({
      success: true,
      analytics: {
        total,
        inUseNow,
        expired,
        usedToday,
        expiringSoon,
        params: { daysWindow },
      },
    });
  } catch (err) {
    console.error("Allocated items analytics error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Internal server error",
    });
  }
}
