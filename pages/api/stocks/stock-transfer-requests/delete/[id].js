import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import StockTransferRequest from "../../../../../models/stocks/StockTransferRequest";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
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
      clinicId = req.query.clinicId;
      if (!clinicId)
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
    }

    const { id } = req.query;

    // Find request (must belong to clinic)
    const request = await StockTransferRequest.findOne({
      _id: id,
      clinicId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer request not found",
      });
    }

    // Soft delete: set status to "Deleted"
    request.status = "Deleted";
    await request.save();

    res.status(200).json({
      success: true,
      message: "Stock transfer request deleted successfully",
      data: { _id: request._id },
    });
  } catch (error) {
    console.error("Error deleting stock transfer request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete stock transfer request",
      error: error.message,
    });
  }
}
