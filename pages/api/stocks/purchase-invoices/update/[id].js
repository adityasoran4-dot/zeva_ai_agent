import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import GRN from "../../../../../models/stocks/GRN";
import PurchaseInvoice from "../../../../../models/stocks/PurchaseInvoice";
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
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required for admin" });
    }

    const { id } = req.query;
    const {
      branch,
      supplier,
      grn,
      grns,
      supplierInvoiceNo,
      date,
      notes,
      status,
      attachmentUrl,
      paymentMethod,
      paidAmount,
      remainingAmount,
    } = req.body;
    const invoice = await PurchaseInvoice.findOne({ _id: id, clinicId });
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase invoice not found" });
    }

    if (branch !== undefined) invoice.branch = branch;
    if (supplier !== undefined) invoice.supplier = supplier;
    if (grn !== undefined) invoice.grn = grn;
    if (grns !== undefined) invoice.grns = Array.isArray(grns) ? grns : [];
    if (supplierInvoiceNo !== undefined)
      invoice.supplierInvoiceNo = supplierInvoiceNo;
    if (date !== undefined) invoice.date = new Date(date);
    if (notes !== undefined) invoice.notes = notes;
    if (status !== undefined && invoice.status !== "Deleted")
      invoice.status = status;
    if (attachmentUrl !== undefined) invoice.attachmentUrl = attachmentUrl;
    if (paymentMethod !== undefined) invoice.paymentMethod = paymentMethod || "";
    if (paidAmount !== undefined) invoice.paidAmount = Number(paidAmount) || 0;
    if (remainingAmount !== undefined)
      invoice.remainingAmount = Number(remainingAmount) || 0;

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

    res.status(200).json({
      success: true,
      message: "Purchase invoice updated successfully",
      data: saved,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update purchase invoice",
      error: error.message,
    });
  }
}
