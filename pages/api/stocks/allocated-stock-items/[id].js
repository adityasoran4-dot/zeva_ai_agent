import dbConnect from "../../../../lib/database";
import mongoose from "mongoose";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import AllocatedStockItem from "../../../../models/stocks/AllocatedStockItem";
import StockItem from "../../../../models/stocks/StockItem";
import StockLocation from "../../../../models/stocks/StockLocation";
import User from "../../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (!me)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
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
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      }
      clinicId = me.clinicId.toString();
    } else if (me.role === "admin") {
      clinicId = req.query.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
      }
    }

    const { id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid id is required" });
    }

    const item = await AllocatedStockItem.findOne({ _id: id, clinicId })
      .populate({ path: "item.itemId" })
      .populate({ path: "user", select: "name role" })
      .populate({ path: "allocatedBy", select: "name role" })
      .populate({ path: "location" })
      .lean();

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Allocated stock item not found" });
    }

    const stockItem = item?.item?.itemId || item?.item || null;
    const data = { ...item, stockItem };
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("GET /api/stocks/allocated-stock-items/[id] error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
