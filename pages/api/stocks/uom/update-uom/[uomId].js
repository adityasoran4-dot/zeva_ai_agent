import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import UOM from "../../../../../models/stocks/UOM"; // Changed from StockLocation to UOM
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["PUT"]);

  if (req.method !== "PUT") {
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
      clinicId = req.body.clinicId;
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
    const { name, category, status } = req.body;

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
        message: "UOM not found or you do not have access to it",
      });
    }

    // Prepare update data with validation
    const updateData = {};
    let hasUpdates = false;

    // Update name if provided and different
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Name must be a non-empty string",
        });
      }

      const trimmedName = name.trim();

      // Check for duplicate name (case-insensitive, excluding current UOM)
      if (trimmedName.toLowerCase() !== existingUOM.name.toLowerCase()) {
        const duplicateUOM = await UOM.findOne({
          clinicId,
          name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
          _id: { $ne: uomId },
        });

        if (duplicateUOM) {
          return res.status(409).json({
            success: false,
            message: "Another UOM with this name already exists",
          });
        }

        updateData.name = trimmedName;
        hasUpdates = true;
      }
    }

    // Update category if provided and valid
    if (category !== undefined) {
      if (!["Main", "Sub"].includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Category must be either 'Main' or 'Sub'",
        });
      }

      if (category !== existingUOM.category) {
        updateData.category = category;
        hasUpdates = true;
      }
    }

    // Update status if provided and valid
    if (status !== undefined) {
      if (!["Active", "Inactive", "Allocated"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be one of: Active, Inactive, Allocated",
        });
      }

      if (status !== existingUOM.status) {
        updateData.status = status;
        hasUpdates = true;
      }
    }

    // Check if there are any updates
    if (!hasUpdates) {
      return res.status(400).json({
        success: false,
        message: "No changes provided for update",
      });
    }

    // Perform the update
    const updatedUOM = await UOM.findByIdAndUpdate(uomId, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
    }).lean();

    return res.status(200).json({
      success: true,
      message: "UOM updated successfully",
      data: updatedUOM,
    });
  } catch (err) {
    console.error("Error in update UOM:", err);

    // Handle specific error types
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

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
