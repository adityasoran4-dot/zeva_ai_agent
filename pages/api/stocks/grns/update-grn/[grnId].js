import dbConnect from "../../../../../lib/database";
import Clinic from "../../../../../models/Clinic";
import GRN from "../../../../../models/stocks/GRN";
import PurchaseRecord from "../../../../../models/stocks/PurchaseRecord";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { grnId } = req.query;

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
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

    // Validate grnId is provided
    if (!grnId) {
      return res.status(400).json({
        success: false,
        message: "grnId is required in query parameters",
      });
    }

    // Check if GRN exists and belongs to clinic
    const existingGRN = await GRN.findOne({
      _id: grnId,
      clinicId,
    });

    if (!existingGRN) {
      return res.status(404).json({
        success: false,
        message: "GRN not found or you do not have access to it",
      });
    }

    const {
      grnNo,
      branch,
      purchasedOrder,
      grnDate,
      supplierInvoiceNo,
      supplierGrnDate,
      notes,
      status,
      orderCreditDays,
      items,
    } = req.body;

    // Validation for required fields
    if (grnNo !== undefined && !grnNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "GRN number cannot be empty",
      });
    }

    // Check for duplicate GRN number if being changed
    if (grnNo && grnNo !== existingGRN.grnNo) {
      const duplicateGRN = await GRN.findOne({
        clinicId,
        grnNo: grnNo.trim(),
        _id: { $ne: grnId },
      });

      if (duplicateGRN) {
        return res.status(400).json({
          success: false,
          message: "GRN number already exists for this clinic",
        });
      }
    }

    // Validate branch if provided
    if (branch) {
      const branchExists = await Clinic.findOne({
        _id: branch,
        $or: [
          { _id: clinicId }, // Main clinic
          { parentClinic: clinicId }, // Sub-branch
        ],
      });

      if (!branchExists) {
        return res.status(404).json({
          success: false,
          message: "Branch not found or does not belong to this clinic",
        });
      }
    }

    // Validate purchase order if provided
    if (purchasedOrder) {
      const purchaseOrderExists = await PurchaseRecord.findOne({
        _id: purchasedOrder,
        clinicId,
      });

      if (!purchaseOrderExists) {
        return res.status(404).json({
          success: false,
          message: "Purchase order not found or does not belong to this clinic",
        });
      }
    }

    // Validate supplierInvoiceNo is provided when required
    if (supplierInvoiceNo !== undefined && !supplierInvoiceNo.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier invoice number cannot be empty",
      });
    }

    // Validate dates
    if (grnDate && isNaN(new Date(grnDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid GRN date format",
      });
    }

    if (supplierGrnDate && isNaN(new Date(supplierGrnDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier GRN date format",
      });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = [
        "New",
        "Partly_Invoiced",
        "Invoiced",
        "Partly_Paid",
        "Paid",
        "Deleted",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid statuses are: ${validStatuses.join(
            ", ",
          )}`,
        });
      }

      // Prevent status changes to "Deleted" for non-admin/clinic users
      if (status === "Deleted" && me.role !== "admin" && me.role !== "clinic") {
        return res.status(403).json({
          success: false,
          message: "Only admin or clinic owner can delete GRN",
        });
      }
    }

    // Check if GRN is deletable (prevent updates on Deleted status)
    if (
      existingGRN.status === "Deleted" &&
      me.role !== "admin" &&
      me.role !== "clinic"
    ) {
      return res.status(403).json({
        success: false,
        message: "Cannot update a deleted GRN",
      });
    }

    // Prepare update object with only provided fields
    const updateData = {};

    if (grnNo !== undefined) updateData.grnNo = grnNo.trim();
    if (branch) updateData.branch = branch;
    if (purchasedOrder) updateData.purchasedOrder = purchasedOrder;
    if (grnDate) updateData.grnDate = new Date(grnDate);
    if (supplierInvoiceNo !== undefined)
      updateData.supplierInvoiceNo = supplierInvoiceNo.trim();
    if (supplierGrnDate) updateData.supplierGrnDate = new Date(supplierGrnDate);
    if (notes !== undefined) updateData.notes = notes.trim();
    if (status) updateData.status = status;
    updateData.orderCreditDays = orderCreditDays || 0;
    const normalized = [];
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i] || {};
        if (!it.itemId) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: itemId is required`,
          });
        }
        if (typeof it.name !== "string" || !it.name.trim()) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: name is required`,
          });
        }
        const qty = Number(it.quantity || 0);
        const unit = Number(it.unitPrice || 0);
        if (qty <= 0) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: quantity must be greater than 0`,
          });
        }
        if (unit < 0) {
          return res.status(400).json({
            success: false,
            message: `Item ${i + 1}: unitPrice must be a non-negative number`,
          });
        }
        const total = Number(
          (it.totalPrice !== undefined ? it.totalPrice : qty * unit).toFixed
            ? (qty * unit).toFixed(2)
            : qty * unit,
        );
        const discountType =
          it.discountType === "Percentage" ? "Percentage" : "Fixed";
        const discount = Number(it.discount || 0);
        const discountAmount =
          it.discountAmount !== undefined
            ? Number(it.discountAmount || 0)
            : discountType === "Percentage"
              ? Number(((qty * unit * discount) / 100).toFixed(2))
              : Number(discount);
        const netPrice =
          it.netPrice !== undefined
            ? Number(it.netPrice || 0)
            : Number((total - discountAmount).toFixed(2));
        const vatType = it.vatType === "Inclusive" ? "Inclusive" : "Exclusive";
        const vatPercentage = Number(it.vatPercentage || 0);
        const vatAmount =
          it.vatAmount !== undefined
            ? Number(it.vatAmount || 0)
            : vatType === "Exclusive"
              ? Number(((netPrice * vatPercentage) / 100).toFixed(2))
              : Number(0);
        const netPlusVat =
          it.netPlusVat !== undefined
            ? Number(it.netPlusVat || 0)
            : Number((netPrice + vatAmount).toFixed(2));
        // Packaging structure acceptance
        const level0 = {
          price: Number(it.level0?.price ?? unit),
          uom: String(it.level0?.uom ?? it.uom ?? ""),
        };
        const l1Qty = Number(it.packagingStructure?.level1?.quantity || 0);
        const l1Uom = String(it.packagingStructure?.level1?.uom || "");
        let l1Price = Number(it.packagingStructure?.level1?.price || 0);
        // base box price derived from netPlusVat/qty
        const baseBoxPrice =
          qty > 0 ? Number((netPlusVat / qty).toFixed(4)) : Number(0);
        if (l1Qty > 0 && baseBoxPrice > 0) {
          l1Price = Number((baseBoxPrice / l1Qty).toFixed(4));
        }
        const l2Qty = Number(it.packagingStructure?.level2?.quantity || 0);
        const l2Uom = String(it.packagingStructure?.level2?.uom || "");
        let l2Price = Number(it.packagingStructure?.level2?.price || 0);
        if (l2Qty > 0 && l1Qty > 0 && l1Price > 0) {
          l2Price = Number((l1Price / l2Qty).toFixed(4));
        }

        normalized.push({
          itemId: it.itemId,
          code: it.code || "",
          name: it.name.trim(),
          description: it.description || "",
          expiryDate: it.expiryDate ? new Date(it.expiryDate) : null,
          quantity: qty,
          uom: it.uom || "",
          unitPrice: unit,
          totalPrice: total,
          discount: discount,
          discountType,
          discountAmount,
          netPrice,
          vatAmount,
          vatType,
          vatPercentage,
          netPlusVat,
          freeQuantity: Number(it.freeQuantity || 0),
          freeQuantityExpiryDate: it.freeQuantityExpiryDate
            ? new Date(it.freeQuantityExpiryDate)
            : null,
          level0,
          packagingStructure: {
            level1: {
              quantity: l1Qty,
              price: l1Price,
              uom: l1Uom,
            },
            level2: {
              quantity: l2Qty,
              price: l2Price,
              uom: l2Uom,
            },
          },
        });
      }
      updateData.items = normalized;
    }

    // update expiry date and free quantity expiry date
    // Validate that the purchase order exists and belongs to the same clinic
    const purchaseRecordObj =
      await PurchaseRecord.findById(purchasedOrder).lean();
    let updatedPurchasedOrderItems = [];
    for (let i = 0; i < normalized.length; i++) {
      const item = purchaseRecordObj.items[i];
      const grnItem = normalized[i];
      // updatedPurchasedOrderItems.push({
      //   ...item,
      //   level0: grnItem.level0,
      //   packagingStructure: grnItem.packagingStructure,
      //   expiryDate: grnItem.expiryDate,
      //   freeQuantityExpiryDate: grnItem.freeQuantityExpiryDate,
      // });
      updatedPurchasedOrderItems.push(grnItem);
    }
    await PurchaseRecord.findByIdAndUpdate(purchasedOrder, {
      items: updatedPurchasedOrderItems,
    });

    // Update the GRN
    const updatedGRN = await GRN.findOneAndUpdate(
      { _id: grnId, clinicId },
      { ...updateData },
      { new: true, runValidators: true },
    )
      .populate("branch", "name")
      .populate("purchasedOrder", "orderNo date supplier")
      .populate("purchasedOrder.supplier", "name")
      .populate("createdBy", "name email");

    if (!updatedGRN) {
      return res.status(404).json({
        success: false,
        message: "GRN not found after update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "GRN updated successfully",
      data: updatedGRN,
    });
  } catch (err) {
    console.error("Error in update GRN:", err);

    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "GRN number already exists for this clinic",
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((error) => error.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
