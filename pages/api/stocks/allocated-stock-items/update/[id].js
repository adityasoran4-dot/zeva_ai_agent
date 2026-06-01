import dbConnect from "../../../../../lib/database";
import mongoose from "mongoose";
import Clinic from "../../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";
import AllocatedStockItem from "../../../../../models/stocks/AllocatedStockItem";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
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
      clinicId = req.body?.clinicId || req.query?.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in request",
        });
      }
    }

    const { id } = req.query;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid id is required" });
    }

    const { quantity, status, location, expiryDate, stockItem, stockItems } =
      req.body || {};

    const update = {};

    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty < 0) {
        return res.status(400).json({
          success: false,
          message: "quantity must be a non-negative number",
        });
      }
      update.quantity = qty;
    }

    if (status !== undefined) {
      update.status = status;
    }

    if (location !== undefined) {
      if (location && !mongoose.Types.ObjectId.isValid(location)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid location" });
      }
      update.location = location || undefined;
    }

    if (expiryDate !== undefined) {
      if (expiryDate) {
        const d = new Date(expiryDate);
        if (isNaN(d.getTime())) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid expiryDate" });
        }
        update.expiryDate = d;
      } else {
        update.expiryDate = undefined;
      }
    }

    if (stockItem !== undefined || stockItems !== undefined) {
      let stockItemIds = [];
      if (stockItems) {
        stockItemIds = Array.isArray(stockItems) ? stockItems : [];
        if (!Array.isArray(stockItems)) {
          try {
            const parsed = JSON.parse(stockItems);
            if (Array.isArray(parsed)) stockItemIds = parsed;
          } catch {
            // ignore
          }
        }
      }
      if (stockItem) {
        stockItemIds.push(stockItem);
      }
      stockItemIds = stockItemIds.filter((sid) =>
        mongoose.Types.ObjectId.isValid(sid)
      );
      if (!stockItemIds.length) {
        return res.status(400).json({
          success: false,
          message: "At least one valid stockItem is required",
        });
      }
      update.stockItems = stockItemIds;
    }

    const updated = await AllocatedStockItem.findOneAndUpdate(
      { _id: id, clinicId },
      update,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("user", "name role")
      .populate("location")
      .populate("allocatedBy")
      .lean();

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Allocated stock item not found" });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Allocated item updated",
    });
  } catch (err) {
    console.error(
      "PUT /api/stocks/allocated-stock-items/update/[id] error:",
      err
    );
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
