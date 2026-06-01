import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import PurchaseReturn from "../../../../models/stocks/PurchaseReturn";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["POST"]);

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
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
      clinicId = req.body.clinicId || req.query.clinicId;
      if (!clinicId)
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required for admin" });
    }

    const { branch, supplier, purchasedOrder, date, notes, status, items } =
      req.body;

    if (
      !branch ||
      !supplier ||
      !purchasedOrder ||
      !date ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "branch, supplier, purchasedOrder, date and items are required",
      });
    }

    // Optionally validate purchasedOrder exists
    const pr = await PurchaseRecord.findOne({ _id: purchasedOrder, clinicId });
    if (!pr)
      return res
        .status(400)
        .json({ success: false, message: "Purchase order not found" });

    const newPReturn = new PurchaseReturn({
      clinicId,
      branch,
      supplier,
      purchasedOrder,
      date: new Date(date),
      notes: notes || "",
      status: status || undefined,
      items,
      createdBy: me._id,
    });

    await newPReturn.save();

    const populated = await PurchaseReturn.findById(newPReturn._id)
      .populate("branch", "name")
      .populate({
        path: "purchasedOrder",
        select: "orderNo date supplier",
        populate: { path: "supplier", select: "name" },
      })
      .populate("createdBy", "name email")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Purchase return added",
      data: populated,
    });
  } catch (err) {
    console.error("Error creating purchase return:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
