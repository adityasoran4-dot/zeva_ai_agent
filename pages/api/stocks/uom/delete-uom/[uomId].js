import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import UOM from "../../../../../models/stocks/UOM"; // Changed from StockLocation to UOM
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["DELETE"]);

  if (req.method !== "DELETE") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
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
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Agent not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "doctor" || me.role === "doctorStaff") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Doctor not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      // For admin, check both query and body for clinicId
      clinicId = req.query.clinicId || req.body?.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { uomId } = req.query;

    // Validate uomId
    if (!uomId) {
      return res.status(400).json({
        success: false,
        message: "uomId is required in query parameters",
      });
    }

    // Find the UOM and verify it belongs to the clinic
    const existingUOM = await UOM.findOne({
      _id: uomId,
      clinicId,
    });

    if (!existingUOM) {
      return res.status(404).json({
        success: false,
        message: "UOM not found or you do not have access to do this action",
      });
    }

    // Optional: Check if UOM is in use before deletion
    // This prevents orphaned references in other collections
    // Example: Check if any product/item is using this UOM
    /*
    const isUOMInUse = await Product.countDocuments({ 
      uomId: uomId,
      clinicId: clinicId 
    });
    
    if (isUOMInUse > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete UOM that is in use by products/items",
        data: {
          usageCount: isUOMInUse,
          suggestion: "Consider marking as Inactive instead"
        }
      });
    }
    */

    // Optional: Soft delete instead of hard delete
    // Recommended approach for data integrity
    /*
    const deletedUOM = await UOM.findByIdAndUpdate(
      uomId,
      {
        status: "Inactive",
        deletedAt: new Date(),
        deletedBy: me._id
      },
      { new: true }
    );
    */

    // Hard delete (permanent removal)
    await UOM.findByIdAndDelete(uomId);

    // Log the deletion (optional for audit trail)
    /*
    await AuditLog.create({
      action: "DELETE_UOM",
      userId: me._id,
      clinicId: clinicId,
      targetId: uomId,
      details: {
        deletedUOM: existingUOM.name,
        category: existingUOM.category,
        status: existingUOM.status
      },
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });
    */

    return res.status(200).json({
      success: true,
      message: "UOM deleted successfully",
      data: {
        deletedId: uomId,
        deletedName: existingUOM.name,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in delete UOM:", err);

    // Handle specific error types
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid UOM ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
