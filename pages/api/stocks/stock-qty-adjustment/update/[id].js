import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import StockQtyAdjustment from "../../../../../models/stocks/StockQtyAdjustment";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
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
      if (!clinic)
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      clinicId = clinic._id;
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId)
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.body.clinicId;
      if (!clinicId)
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
    }

    const { id } = req.query;
    const { branch, postAc, date, notes, items, status } = req.body;

    const adjustment = await StockQtyAdjustment.findOne({
      _id: id,
      clinicId,
    });

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: "Stock quantity adjustment not found",
      });
    }

    if (branch !== undefined) adjustment.branch = branch;
    if (postAc !== undefined) adjustment.postAc = postAc;
    if (date !== undefined) adjustment.date = new Date(date);
    if (notes !== undefined) adjustment.notes = notes;
    if (status !== undefined && adjustment.status !== "Deleted") {
      adjustment.status = status;
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one item is required",
        });
      }
      for (const item of items) {
        if (
          !item.name ||
          typeof item.quantity !== "number" ||
          typeof item.costPrice !== "number" ||
          typeof item.totalPrice !== "number"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each item must have name, quantity, costPrice and totalPrice",
          });
        }
      }
      adjustment.items = items;
    }

    await adjustment.save();

    const saved = await StockQtyAdjustment.findById(adjustment._id)
      .populate("branch", "name")
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Stock quantity adjustment updated successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error updating stock quantity adjustment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock quantity adjustment",
      error: error.message,
    });
  }
}
