import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import GRN from "../../../../../models/stocks/GRN";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { grnId } = req.query;

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get clinicId based on user role
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res.status(400).json({
          success: false,
          message: "Clinic not found for this user",
        });
      }
      clinicId = clinic._id;
    } else if (me.role === "agent" || me.role === "doctorStaff") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Agent not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "doctor") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Doctor not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.query.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate grnId is provided
    if (!grnId) {
      return res.status(400).json({
        success: false,
        message: "grnId is required in query parameters",
      });
    }

    // Check if GRN exists and belongs to clinic
    const grn = await GRN.findOne({
      _id: grnId,
      clinicId,
    });

    if (!grn) {
      return res.status(404).json({
        success: false,
        message: "GRN not found or you do not have access to it",
      });
    }

    // Check user permissions for deletion
    if (me.role !== "admin" && me.role !== "clinic") {
      return res.status(403).json({
        success: false,
        message: "Only admin or clinic owner can delete GRN",
      });
    }

    // Optional: Check if GRN can be deleted based on status
    // Uncomment if you want to prevent deletion of certain statuses
    /*
    const nonDeletableStatuses = ["Invoiced", "Partly_Paid", "Paid"];
    if (nonDeletableStatuses.includes(grn.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete GRN with status "${grn.status}". Please cancel or revert the status first.`,
      });
    }
    */

    // Get the GRN details before deletion for logging/response
    const grnDetails = await GRN.findById(grnId)
      .populate("branch", "name")
      .populate("purchasedOrder", "orderNo")
      .select("grnNo supplierInvoiceNo status");

    // Perform hard delete
    const deleteResult = await GRN.deleteOne({ _id: grnId, clinicId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "GRN not found during deletion",
      });
    }

    return res.status(200).json({
      success: true,
      message: "GRN deleted successfully",
      data: {
        deletedId: grnId,
        grnNo: grnDetails?.grnNo || null,
        supplierInvoiceNo: grnDetails?.supplierInvoiceNo || null,
        status: grnDetails?.status || null,
        purchaseOrder: grnDetails?.purchasedOrder?.orderNo || null,
        branch: grnDetails?.branch?.name || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in delete GRN:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
