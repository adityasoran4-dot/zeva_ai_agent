import dbConnect from "../../../../lib/database";
import GRN from "../../../../models/stocks/GRN";
import Clinic from "../../../../models/Clinic";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
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

    // Only clinic, agent, admin, and doctor can add GRN
    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only clinic, agent, admin, or doctor can add GRN.",
      });
    }

    // Get clinicId based on user role
    let clinicId;
    let branchId;

    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res.status(400).json({
          success: false,
          message: "Clinic not found for this user",
        });
      }
      clinicId = clinic._id;
      // For clinic owner, use the clinic as the default branch
      branchId = req.body.branch || clinic._id;
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "User not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
      branchId = req.body.branch || me.clinicId;
    } else if (me.role === "admin") {
      // Admin must specify clinicId and branch in request body
      clinicId = req.body.clinicId;
      branchId = req.body.branch;

      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required in request body for admin",
        });
      }
      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "branch is required in request body for admin",
        });
      }
    }

    // Validate required fields
    const {
      purchasedOrder,
      grnDate,
      supplierInvoiceNo,
      supplierGrnDate,
      notes = "",
      status = "New",
      orderCreditDays,
      items,
    } = req.body;

    if (!purchasedOrder) {
      return res.status(400).json({
        success: false,
        message: "Purchase Order reference is required",
      });
    }

    if (!grnDate) {
      return res.status(400).json({
        success: false,
        message: "GRN date is required",
      });
    }

    if (!supplierInvoiceNo) {
      return res.status(400).json({
        success: false,
        message: "Supplier invoice number is required",
      });
    }

    if (!supplierGrnDate) {
      return res.status(400).json({
        success: false,
        message: "Supplier GRN date is required",
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Validate status
    const validStatuses = [
      "New",
      "Partly_Invoiced",
      "Invoiced",
      "Partly_Paid",
      "Paid",
      "Deleted",
    ];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Validate that the purchase order exists and belongs to the same clinic
    const purchaseOrder = await PurchaseRecord.findOne({
      _id: purchasedOrder,
      clinicId,
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found or doesn't belong to this clinic",
      });
    }

    // Validate that the branch exists and belongs to the clinic
    const branch = await Clinic.findOne({
      _id: branchId,
      $or: [
        { _id: clinicId }, // Main clinic can be used as branch
        { parentClinic: clinicId }, // Or a sub-branch of the clinic
      ],
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or doesn't belong to this clinic",
      });
    }

    // Validate and normalize items
    const normalizedItems = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};

      // Required fields validation
      if (!it.itemId) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: itemId is required`,
        });
      }

      if (!it.name || !it.name.trim()) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: name is required`,
        });
      }

      // Quantity validation
      const qty = Number(it.quantity || 0);
      if (qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: quantity must be greater than 0`,
        });
      }

      // Unit price validation
      const unit = Number(it.unitPrice || 0);
      if (unit < 0) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: unitPrice must be a non-negative number`,
        });
      }

      // Calculate values if not provided
      const total =
        it.totalPrice !== undefined
          ? Number(it.totalPrice)
          : parseFloat((qty * unit).toFixed(2));

      const discountType =
        it.discountType === "Percentage" ? "Percentage" : "Fixed";
      const discount = Number(it.discount || 0);

      const discountAmount =
        it.discountAmount !== undefined
          ? Number(it.discountAmount)
          : discountType === "Percentage"
            ? parseFloat(((qty * unit * discount) / 100).toFixed(2))
            : discount;

      const netPrice =
        it.netPrice !== undefined
          ? Number(it.netPrice)
          : parseFloat((total - discountAmount).toFixed(2));

      const vatType = it.vatType === "Inclusive" ? "Inclusive" : "Exclusive";
      const vatPercentage = Number(it.vatPercentage || 0);

      const vatAmount =
        it.vatAmount !== undefined
          ? Number(it.vatAmount)
          : vatType === "Exclusive"
            ? parseFloat(((netPrice * vatPercentage) / 100).toFixed(2))
            : 0;

      const netPlusVat =
        it.netPlusVat !== undefined
          ? Number(it.netPlusVat)
          : parseFloat((netPrice + vatAmount).toFixed(2));

      // Packaging structure normalization and price derivation
      const level0 = {
        price: Number(it.level0?.price ?? unit),
        uom: String(it.level0?.uom ?? it.uom ?? ""),
      };
      const l1Qty = Number(it.packagingStructure?.level1?.quantity || 0);
      const l1Uom = String(it.packagingStructure?.level1?.uom || "");
      let l1Price = Number(it.packagingStructure?.level1?.price || 0);
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

      normalizedItems.push({
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
          level1: { quantity: l1Qty, price: l1Price, uom: l1Uom },
          level2: { quantity: l2Qty, price: l2Price, uom: l2Uom },
        },
      });
    }

    // Create GRN document
    const grnData = {
      clinicId,
      branch: branchId,
      purchasedOrder,
      grnDate: new Date(grnDate),
      supplierInvoiceNo: supplierInvoiceNo.trim(),
      supplierGrnDate: new Date(supplierGrnDate),
      notes: notes.trim(),
      status,
      createdBy: me._id,
      orderCreditDays: orderCreditDays || 0,
      items: normalizedItems,
    };

    // update expiry date and free quantity expiry date
    const purchaseRecordObj = await PurchaseRecord.findById(
      purchaseOrder._id,
    ).lean();
    let updatedPurchasedOrderItems = [];
    for (let i = 0; i < normalizedItems.length; i++) {
      const item = purchaseRecordObj.items[i];
      const grnItem = normalizedItems[i];
      // updatedPurchasedOrderItems.push({
      //   ...item,
      //   expiryDate: grnItem.expiryDate,
      //   freeQuantityExpiryDate: grnItem.freeQuantityExpiryDate,
      // });
      updatedPurchasedOrderItems.push(grnItem);
    }

    const newGRN = new GRN(grnData);
    const savedGRN = await newGRN.save();
    purchaseOrder.status = "Delivered";
    purchaseOrder.items = updatedPurchasedOrderItems;
    await purchaseOrder.save();

    // Populate references for the response
    const populatedGRN = await GRN.findById(savedGRN._id)
      .populate("branch", "name")
      .populate("purchasedOrder", "orderNo date supplier")
      .populate({
        path: "purchasedOrder",
        populate: {
          path: "supplier",
          select: "name",
        },
      })
      .populate("createdBy", "name email")
      .lean();

    return res.status(201).json({
      success: true,
      message: "GRN created successfully",
      data: populatedGRN,
    });
  } catch (err) {
    console.error("Error in add GRN:", err);

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
