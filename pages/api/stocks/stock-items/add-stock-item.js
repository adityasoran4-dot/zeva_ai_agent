import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import StockItem from "../../../../models/stocks/StockItem";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["POST"]);

  if (req.method !== "POST") {
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
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: `${me.role} not tied to a clinic`,
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.body.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in request body",
        });
      }
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "location",
      "type",
      "vatPercentage",
      "minQuantity",
      "maxQuantity",
    ];

    for (const field of requiredFields) {
      if (!req.body[field] && req.body[field] !== 0) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Validate type
    const validTypes = ["Stock", "Service", "Fixed_Asset"];
    if (!validTypes.includes(req.body.type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${validTypes.join(", ")}`,
      });
    }

    // Validate status
    const validStatus = ["Active", "Inactive"];
    if (req.body.status && !validStatus.includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${validStatus.join(", ")}`,
      });
    }

    // Validate numeric fields
    const numericFields = [
      "vatPercentage",
      "minQuantity",
      "maxQuantity",
      "level0.costPrice",
      "level0.salePrice",
      "packagingStructure.level1.multiplier",
      "packagingStructure.level1.costPrice",
      "packagingStructure.level1.salePrice",
      "packagingStructure.level2.multiplier",
      "packagingStructure.level2.costPrice",
      "packagingStructure.level2.salePrice",
    ];

    for (const field of numericFields) {
      const value = getNestedValue(req.body, field);
      if (value !== undefined && typeof value !== "number") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a number`,
        });
      }
      if (value !== undefined && value < 0) {
        return res.status(400).json({
          success: false,
          message: `${field} cannot be negative`,
        });
      }
    }

    // Check if minQuantity is less than maxQuantity
    if (req.body.minQuantity > req.body.maxQuantity) {
      return res.status(400).json({
        success: false,
        message: "minQuantity cannot be greater than maxQuantity",
      });
    }

    // Check for duplicate code within clinic
    if (req.body.code) {
      const existingItem = await StockItem.findOne({
        clinicId,
        code: req.body.code,
      });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: "An item with this code already exists in this clinic",
        });
      }
    }

    // Prepare stock item data
    const stockItemData = {
      clinicId,
      name: req.body.name.trim(),
      description: req.body.description?.trim() || "",
      code: req.body.code?.trim() || "",
      type: req.body.type,
      location: req.body.location,
      brand: req.body.brand?.trim() || "",
      dosage: req.body.dosage?.trim() || "",
      strength: req.body.strength?.trim() || "",
      status: req.body.status || "Active",
      vatPercentage: req.body.vatPercentage,
      minQuantity: req.body.minQuantity,
      maxQuantity: req.body.maxQuantity,
      level0: {
        costPrice: req.body.level0?.costPrice || 0,
        uom: req.body.level0?.uom?.trim() || "",
        salePrice: req.body.level0?.salePrice || 0,
      },
      packagingStructure: {
        level1: {
          multiplier: req.body.packagingStructure?.level1?.multiplier || 1,
          costPrice: req.body.packagingStructure?.level1?.costPrice || 0,
          uom: req.body.packagingStructure?.level1?.uom?.trim() || "",
          salePrice: req.body.packagingStructure?.level1?.salePrice || 0,
        },
        level2: {
          multiplier: req.body.packagingStructure?.level2?.multiplier || 1,
          costPrice: req.body.packagingStructure?.level2?.costPrice || 0,
          uom: req.body.packagingStructure?.level2?.uom?.trim() || "",
          salePrice: req.body.packagingStructure?.level2?.salePrice || 0,
        },
      },
      imageUrl: req.body.imageUrl?.trim() || "",
      createdBy: me._id,
    };

    // Create new stock item
    const newStockItem = await StockItem.create(stockItemData);

    // Populate references
    await newStockItem.populate("location", "name");
    await newStockItem.populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Stock item created successfully",
      data: newStockItem,
    });
  } catch (error) {
    console.error("Error creating stock item: ", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate key error - Code must be unique within clinic",
      });
    }

    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
}

// Helper function to get nested values
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}
