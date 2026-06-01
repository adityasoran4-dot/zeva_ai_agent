import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
import Supplier from "../../../../models/stocks/Supplier";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { purchaseRecordId } = req.query;

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);

  if (req.method === "GET") {
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

      // Validate purchaseRecordId is provided
      if (!purchaseRecordId) {
        return res.status(400).json({
          success: false,
          message: "purchaseRecordId is required in query parameters",
        });
      }

      // Check if purchase record exists and belongs to clinic
      const purchaseRecord = await PurchaseRecord.findOne({
        _id: purchaseRecordId,
        clinicId,
      })
        .populate("branch", "name")
        .populate("supplier", "name vatRegNo telephone mobile email")
        .populate("createdBy", "name email");

      if (!purchaseRecord) {
        return res.status(404).json({
          success: false,
          message: "Purchase record not found or you do not have access to it",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Purchase record fetched successfully",
        data: purchaseRecord,
      });
    } catch (err) {
      console.error("Error in fetch purchase record:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else if (req.method === "PUT") {
    // Handle update purchase record
    try {
      const me = await getUserFromReq(req);
      if (!me) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
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
      } else if (me.role === "doctor") {
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

      // Validate purchaseRecordId is provided
      if (!purchaseRecordId) {
        return res.status(400).json({
          success: false,
          message: "purchaseRecordId is required in query parameters",
        });
      }

      // Check if purchase record exists and belongs to clinic
      const existingRecord = await PurchaseRecord.findOne({
        _id: purchaseRecordId,
        clinicId,
      });

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          message: "Purchase record not found or you do not have access to it",
        });
      }

      const {
        orderNo,
        branch,
        date,
        enqNo,
        supplier,
        type,
        supplierInvoiceNo,
        notes,
        status,
        shipTo,
        billTo,
        contactInfoOfBuyer,
        items,
      } = req.body;

      // Validation for fields that shouldn't be empty if provided
      if (orderNo !== undefined && !orderNo) {
        return res.status(400).json({
          success: false,
          message: "Order number cannot be empty",
        });
      }

      if (branch && !(await Clinic.findById(branch))) {
        return res.status(404).json({
          success: false,
          message: "Branch not found",
        });
      }

      if (supplier) {
        // Validate supplier exists and belongs to clinic
        const findSupplier = await Supplier.findOne({
          _id: supplier,
          clinicId: clinicId,
        });
        if (!findSupplier) {
          return res.status(404).json({
            success: false,
            message: "Supplier not found or does not belong to this clinic",
          });
        }
      }

      // Validate type if provided
      if (type) {
        const validTypes = [
          "Purchase_Order",
          "Purchase_Request",
          "Purchase_Invoice",
          "GRN_Regular",
        ];
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid type. Valid types are: ${validTypes.join(", ")}`,
          });
        }
      }

      // Validate supplierInvoiceNo is provided when required
      if (
        type &&
        (type === "Purchase_Invoice" || type === "GRN_Regular") &&
        supplierInvoiceNo === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Supplier invoice number is required for this type",
        });
      }

      // Validate items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (!item.name) {
            return res.status(400).json({
              success: false,
              message: `Item ${i + 1}: Name is required`,
            });
          }

          if (typeof item.quantity !== "number" || item.quantity <= 0) {
            return res.status(400).json({
              success: false,
              message: `Item ${i + 1}: Quantity must be a positive number`,
            });
          }

          if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
            return res.status(400).json({
              success: false,
              message: `Item ${i + 1}: Unit price must be a non-negative number`,
            });
          }

          if (typeof item.totalPrice !== "number" || item.totalPrice < 0) {
            return res.status(400).json({
              success: false,
              message: `Item ${i + 1}: Total price must be a non-negative number`,
            });
          }
        }
      }

      // Prepare update object with only provided fields
      const updateData = {};

      if (orderNo !== undefined) updateData.orderNo = orderNo;
      if (branch) updateData.branch = branch;
      if (date) updateData.date = new Date(date);
      if (enqNo !== undefined) updateData.enqNo = enqNo;
      if (supplier) updateData.supplier = supplier;
      if (type) updateData.type = type;
      if (supplierInvoiceNo !== undefined)
        updateData.supplierInvoiceNo = supplierInvoiceNo;
      if (notes !== undefined) updateData.notes = notes;
      if (status) updateData.status = status;
      if (shipTo) updateData.shipTo = shipTo;
      if (billTo) updateData.billTo = billTo;
      if (contactInfoOfBuyer)
        updateData.contactInfoOfBuyer = contactInfoOfBuyer;
      if (items && Array.isArray(items) && items.length > 0)
        updateData.items = items;

      // Update the record
      const updatedRecord = await PurchaseRecord.findOneAndUpdate(
        { _id: purchaseRecordId, clinicId },
        { ...updateData },
        { new: true, runValidators: true },
      )
        .populate("branch", "name")
        .populate("supplier", "name vatRegNo telephone mobile email")
        .populate("createdBy", "name email");

      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message: "Purchase record not found after update",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Purchase record updated successfully",
        data: updatedRecord,
      });
    } catch (err) {
      console.error("Error in update purchase record:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else if (req.method === "DELETE") {
    // Handle delete purchase record
    try {
      const me = await getUserFromReq(req);
      if (!me) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
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

      // Validate purchaseRecordId is provided
      if (!purchaseRecordId) {
        return res.status(400).json({
          success: false,
          message: "purchaseRecordId is required in query parameters",
        });
      }

      // Check if purchase record exists and belongs to clinic
      const purchaseRecord = await PurchaseRecord.findOne({
        _id: purchaseRecordId,
        clinicId,
      });

      if (!purchaseRecord) {
        return res.status(404).json({
          success: false,
          message: "Purchase record not found or you do not have access to it",
        });
      }

      // Perform the deletion
      await PurchaseRecord.deleteOne({ _id: purchaseRecordId, clinicId });

      return res.status(200).json({
        success: true,
        message: "Purchase record deleted successfully",
      });
    } catch (err) {
      console.error("Error in delete purchase record:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }
}
