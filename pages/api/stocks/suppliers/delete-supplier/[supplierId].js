import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import Supplier from "../../../../../models/stocks/Supplier";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
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
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
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

  try {
    const { supplierId } = req.query;

    // Validate supplierId is provided
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        message: "supplierId is required in query parameters",
      });
    }

    // Check if supplier exists and belongs to clinic
    const supplier = await Supplier.findOne({
      _id: supplierId,
      clinicId,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found or you do not have access to it",
      });
    }

    // Optional: Check if supplier is in use before deletion
    // This prevents orphaned references in other collections
    /*
    const isSupplierInUse = await PurchaseOrder.countDocuments({ 
      supplierId: supplierId,
      clinicId: clinicId 
    });
    
    if (isSupplierInUse > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete supplier with existing purchase orders",
        data: {
          purchaseOrderCount: isSupplierInUse,
          suggestion: "Consider marking as inactive instead"
        }
      });
    }
    */

    // Optional: Soft delete instead of hard delete
    // Recommended approach for data integrity
    /*
    const deletedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      {
        status: "Inactive",
        deletedAt: new Date(),
        deletedBy: me._id
      },
      { new: true }
    );
    */

    // Hard delete (permanent removal)
    await Supplier.findByIdAndDelete(supplierId);

    return res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
      data: {
        deletedId: supplierId,
        deletedName: supplier.name,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Error in delete supplier:", err);

    // Handle invalid ObjectId error
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
