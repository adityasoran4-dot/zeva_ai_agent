import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import DirectStockTransfer from "../../../../models/stocks/DirectStockTransfer";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
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

    // Resolve clinicId based on user role
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
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required for admin" });
    }

    const { fromBranch, toBranch, date, notes, items } = req.body;

    if (!fromBranch || !toBranch || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: fromBranch, toBranch, date",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one item is required" });
    }

    for (const item of items) {
      if (!item.name || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have name and quantity",
        });
      }
    }

    const newTransfer = new DirectStockTransfer({
      clinicId,
      fromBranch,
      toBranch,
      date: new Date(date),
      notes: notes || "",
      items,
      createdBy: me._id,
      status: "New",
    });

    await newTransfer.save();

    const saved = await DirectStockTransfer.findById(newTransfer._id)
      .populate("fromBranch", "name")
      .populate("toBranch", "name")
      .populate("createdBy", "name email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Direct stock transfer created",
      data: saved,
    });
  } catch (error) {
    console.error("Error creating direct stock transfer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create direct stock transfer",
      error: error.message,
    });
  }
}
