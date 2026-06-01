import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import GRN from "../../../../models/stocks/GRN";
import PurchaseInvoice from "../../../../models/stocks/PurchaseInvoice";
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

    const {
      branch,
      supplier,
      grn,
      grns,
      supplierInvoiceNo,
      date,
      notes,
      status,
      paymentMethod,
      paidAmount,
      remainingAmount,
    } = req.body;

    if (!branch || !supplier || !grn || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: branch, supplier, grn, date",
      });
    }

    const invoice = new PurchaseInvoice({
      clinicId,
      branch,
      supplier,
      grn,
      grns: Array.isArray(grns) ? grns : [],
      supplierInvoiceNo: supplierInvoiceNo || "",
      date: new Date(date),
      notes: notes || "",
      status,
      paymentMethod: paymentMethod || "",
      createdBy: me._id,
      paidAmount,
      remainingAmount,
    });

    await invoice.save();

    // update status of grns to invoiced
    await GRN.updateMany(
      { _id: { $in: grns } },
      { $set: { status: "Invoiced" } },
    );

    const saved = await PurchaseInvoice.findById(invoice._id)
      .populate("branch", "name")
      .populate("supplier", "name")
      .populate("grn", "grnNo")
      .populate("grns", "grnNo")
      .populate("createdBy", "name email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Purchase invoice created successfully",
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create purchase invoice",
      error: error.message,
    });
  }
}
