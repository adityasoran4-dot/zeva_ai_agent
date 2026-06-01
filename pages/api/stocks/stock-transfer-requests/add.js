import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import StockTransferRequest from "../../../../models/stocks/StockTransferRequest";
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
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
    }

    const {
      transferType,
      requestingBranch,
      fromBranch,
      requestingEmployee,
      date,
      notes,
      items,
    } = req.body;

    // Validation
    if (
      (!requestingBranch && transferType === "External") ||
      !fromBranch ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: requestingBranch, fromBranch, date",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "Each item must have name and quantity",
        });
      }
    }

    // Create new stock transfer request
    const newRequest = new StockTransferRequest({
      clinicId,
      transferType: transferType || "Internal",
      ...(requestingBranch && { requestingBranch }),
      fromBranch,
      requestingEmployee: requestingEmployee || null,
      date: new Date(date),
      notes: notes || "",
      items,
      createdBy: me._id,
      status: "New",
    });

    // Save (pre-save hook will generate stockTransferRequestNo)
    await newRequest.save();

    // Populate and return
    const savedRequest = await StockTransferRequest.findById(newRequest._id)
      .populate("requestingBranch", "name")
      .populate("fromBranch", "name")
      .populate("requestingEmployee", "name email")
      .populate("createdBy", "name email")
      .lean();

    res.status(201).json({
      success: true,
      message: "Stock transfer request created successfully",
      data: savedRequest,
    });
  } catch (error) {
    console.error("Error creating stock transfer request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create stock transfer request",
      error: error.message,
    });
  }
}
