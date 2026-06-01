import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import StockItem from "../../../../models/stocks/StockItem";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);

  if (!["GET", "PUT", "DELETE"].includes(req.method)) {
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
      // For admin, get clinicId from query params for GET, from body for PUT/DELETE
      clinicId = req.method === "GET" ? req.query.clinicId : req.body.clinicId;

      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: `clinicId is required for admin in ${req.method === "GET" ? "query parameters" : "request body"}`,
        });
      }
    }

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required",
      });
    }

    switch (req.method) {
      case "GET":
        try {
          const stockItem = await StockItem.findOne({ _id: id, clinicId })
            .populate("location", "name code")
            .populate("createdBy", "name email");

          if (!stockItem) {
            return res.status(404).json({
              success: false,
              message: "Stock item not found",
            });
          }

          res.status(200).json({
            success: true,
            data: stockItem,
          });
        } catch (error) {
          console.error("Error fetching stock item:", error);
          res.status(500).json({
            success: false,
            message: "Error fetching stock item",
            error: error?.message || "Internal Server Error",
          });
        }
        break;

      case "PUT":
        try {
          const updateData = req.body;

          // Remove fields that shouldn't be updated
          delete updateData._id;
          delete updateData.clinicId;
          delete updateData.createdBy;
          delete updateData.createdAt;
          delete updateData.updatedAt;

          // Validate VAT percentage if provided
          if (
            updateData.vatPercentage !== undefined &&
            (isNaN(updateData.vatPercentage) ||
              updateData.vatPercentage < 0 ||
              updateData.vatPercentage > 100)
          ) {
            return res.status(400).json({
              success: false,
              message: "VAT percentage must be between 0 and 100",
              field: "vatPercentage",
            });
          }

          // Validate quantities if provided
          if (
            updateData.minQuantity !== undefined &&
            (isNaN(updateData.minQuantity) || updateData.minQuantity < 0)
          ) {
            return res.status(400).json({
              success: false,
              message: "Minimum quantity cannot be negative",
              field: "minQuantity",
            });
          }

          if (
            updateData.maxQuantity !== undefined &&
            (isNaN(updateData.maxQuantity) || updateData.maxQuantity < 0)
          ) {
            return res.status(400).json({
              success: false,
              message: "Maximum quantity cannot be negative",
              field: "maxQuantity",
            });
          }

          if (
            updateData.minQuantity !== undefined &&
            updateData.maxQuantity !== undefined &&
            updateData.minQuantity > updateData.maxQuantity
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Minimum quantity cannot be greater than maximum quantity",
              field: "minQuantity",
            });
          }

          // Validate numeric fields in level0
          if (updateData.level0) {
            const numericFields = ["costPrice", "salePrice"];
            for (const field of numericFields) {
              if (updateData.level0[field] !== undefined) {
                const value = updateData.level0[field];
                if (isNaN(value) || value < 0) {
                  return res.status(400).json({
                    success: false,
                    message: `Level 0 ${field} cannot be negative`,
                    field: `level0.${field}`,
                  });
                }
              }
            }
          }

          // Validate packagingStructure numeric fields
          const validatePackagingLevel = (levelData, levelName) => {
            if (!levelData) return;

            const numericFields = ["multiplier", "costPrice", "salePrice"];
            for (const field of numericFields) {
              if (levelData[field] !== undefined) {
                const value = levelData[field];
                if (isNaN(value) || value < 0) {
                  return {
                    success: false,
                    message: `${levelName} ${field} cannot be negative`,
                    field: `packagingStructure.${levelName}.${field}`,
                  };
                }
              }
            }
            return null;
          };

          if (updateData.packagingStructure) {
            if (updateData.packagingStructure.level1) {
              const level1Error = validatePackagingLevel(
                updateData.packagingStructure.level1,
                "level1",
              );
              if (level1Error) return res.status(400).json(level1Error);
            }

            if (updateData.packagingStructure.level2) {
              const level2Error = validatePackagingLevel(
                updateData.packagingStructure.level2,
                "level2",
              );
              if (level2Error) return res.status(400).json(level2Error);
            }
          }

          // Check if updating name and it already exists
          if (updateData.name) {
            const existingItem = await StockItem.findOne({
              clinicId,
              name: updateData.name.trim(),
              _id: { $ne: id },
            });
            if (existingItem) {
              return res.status(400).json({
                success: false,
                message: "Item with this name already exists",
                field: "name",
              });
            }
          }

          // Check if updating code and it already exists
          if (updateData.code) {
            const existingItem = await StockItem.findOne({
              clinicId,
              code: updateData.code.trim(),
              _id: { $ne: id },
            });
            if (existingItem) {
              return res.status(400).json({
                success: false,
                message: "Item with this code already exists",
                field: "code",
              });
            }
          }

          // Clean up string fields by trimming
          if (updateData.name) updateData.name = updateData.name.trim();
          if (updateData.description)
            updateData.description = updateData.description.trim();
          if (updateData.code) updateData.code = updateData.code.trim();
          if (updateData.brand) updateData.brand = updateData.brand.trim();
          if (updateData.dosage) updateData.dosage = updateData.dosage.trim();
          if (updateData.strength)
            updateData.strength = updateData.strength.trim();
          if (updateData.imageUrl)
            updateData.imageUrl = updateData.imageUrl.trim();

          const updatedItem = await StockItem.findOneAndUpdate(
            { _id: id, clinicId },
            { ...updateData, updatedAt: new Date() },
            { new: true, runValidators: true },
          )
            .populate("location", "name code")
            .populate("createdBy", "name email");

          if (!updatedItem) {
            return res.status(404).json({
              success: false,
              message: "Stock item not found",
            });
          }

          res.status(200).json({
            success: true,
            message: "Stock item updated successfully",
            data: updatedItem,
          });
        } catch (error) {
          console.error("Error updating stock item:", error);

          if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            res.status(400).json({
              success: false,
              message: `Item with this ${field} already exists`,
              field: field,
            });
          } else if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(
              (err) => err.message,
            );
            res.status(400).json({
              success: false,
              message: "Validation failed",
              errors,
            });
          } else {
            res.status(500).json({
              success: false,
              message: "Error updating stock item",
              error: error?.message || "Internal Server Error",
            });
          }
        }
        break;

      case "DELETE":
        try {
          const deletedItem = await StockItem.findOneAndDelete({
            _id: id,
            clinicId,
          });

          if (!deletedItem) {
            return res.status(404).json({
              success: false,
              message: "Stock item not found",
            });
          }

          res.status(200).json({
            success: true,
            message: "Stock item deleted successfully",
            data: deletedItem,
          });
        } catch (error) {
          console.error("Error deleting stock item:", error);
          res.status(500).json({
            success: false,
            message: "Error deleting stock item",
            error: error?.message || "Internal Server Error",
          });
        }
        break;

      default:
        res.status(405).json({
          success: false,
          message: `Method ${req.method} Not Allowed`,
        });
        break;
    }
  } catch (error) {
    console.error("Error in stock item handler: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
}
