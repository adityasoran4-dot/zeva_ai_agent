import dbConnect from "../../../../lib/database";
import mongoose from "mongoose";
import Clinic from "../../../../models/Clinic";
import StockLocation from "../../../../models/stocks/StockLocation";
import StockItem from "../../../../models/stocks/StockItem";
import User from "../../../../models/Users";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import AllocatedStockItem, {
  AllocatedStockItemDetails,
} from "../../../../models/stocks/AllocatedStockItem";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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

    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id.toString();
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      }
      clinicId = me.clinicId.toString();
    } else if (me.role === "admin") {
      clinicId = req.body?.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in request body",
        });
      }
    }

    const {
      allocatedStockItems,
      purchaseRecord,
      allocatedBy,
      notes = "",
    } = req.body || {};

    if (!allocatedStockItems || !Array.isArray(allocatedStockItems)) {
      return res.status(400).json({
        success: false,
        message: "Valid allocatedStockItems is required",
      });
    }
    if (!purchaseRecord || !mongoose.Types.ObjectId.isValid(purchaseRecord)) {
      return res.status(400).json({
        success: false,
        message: "Valid purchaseRecord is required",
      });
    }
    if (!allocatedBy || !mongoose.Types.ObjectId.isValid(allocatedBy)) {
      return res.status(400).json({
        success: false,
        message: "Valid allocatedBy is required",
      });
    }

    // Validate input entries
    let allocatedItemIds = [];
    for (let itemData of allocatedStockItems) {
      const { item, quantity, user, location, expiryDate } = itemData || {};

      const itemId =
        item && item.itemId && mongoose.Types.ObjectId.isValid(item.itemId)
          ? item.itemId
          : null;

      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: "Valid itemId is required",
        });
      }
      if (
        !quantity ||
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required",
        });
      }
      if (!user || !mongoose.Types.ObjectId.isValid(user)) {
        return res.status(400).json({
          success: false,
          message: "Valid user is required",
        });
      }
    }

    const pr = await PurchaseRecord.findOne({
      _id: purchaseRecord,
      clinicId,
    }).lean();
    if (!pr) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase record not found" });
    }

    const prQtyMap = new Map();
    (pr.items || []).forEach((it) => {
      const key = (it.itemId || it._id || "").toString();
      if (key)
        prQtyMap.set(key, Number(it.quantity || 0) + (it?.freeQuantity || 0));
    });

    const newTotals = new Map();
    for (const entry of allocatedStockItems) {
      const itemId =
        (entry.item?.itemId &&
          mongoose.Types.ObjectId.isValid(entry.item.itemId) &&
          entry.item.itemId.toString()) ||
        (entry.stockItem &&
          mongoose.Types.ObjectId.isValid(entry.stockItem) &&
          entry.stockItem.toString());
      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: "Valid itemId/stockItem is required in entries",
        });
      }
      const key = itemId.toString();
      const prev = newTotals.get(key) || 0;
      newTotals.set(key, prev + Number(entry.quantity || 0));
    }

    for (const [itemId, newTotal] of newTotals.entries()) {
      const allowed = prQtyMap.get(itemId);
      if (typeof allowed !== "number") {
        return res.status(400).json({
          success: false,
          message: "Stock item not present in purchase record",
        });
      }
      const existing = await AllocatedStockItem.find({
        clinicId,
        purchaseRecord,
        $or: [{ stockItem: itemId }, { "item.itemId": itemId }],
        status: { $nin: ["Cancelled", "Deleted"] },
      })
        .select("quantity")
        .lean();
      const existingSum = existing.reduce(
        (sum, doc) => sum + Number(doc.quantity || 0),
        0,
      );
      console.log({
        itemId,
        allowed,
        existingSum,
        newTotal,
      });
      if (existingSum + newTotal > allowed) {
        return res.status(400).json({
          success: false,
          message:
            "Allocated quantity exceeds available quantity in purchase order",
        });
      }
    }

    // Create allocated records from entries, building item subdoc from PurchaseRecord
    for (let itemData of allocatedStockItems) {
      const { item, stockItem, quantity, user, location, expiryDate } =
        itemData || {};
      const itemId =
        (item && item.itemId && mongoose.Types.ObjectId.isValid(item.itemId)
          ? item.itemId
          : null) ||
        (stockItem && mongoose.Types.ObjectId.isValid(stockItem)
          ? stockItem
          : null);
      const prItem =
        (pr.items || []).find(
          (it) =>
            it.itemId?.toString() === itemId?.toString() ||
            it._id?.toString() === itemId?.toString(),
        ) || null;
      if (!prItem) {
        return res.status(400).json({
          success: false,
          message: "Stock item not present in purchase record",
        });
      }
      const qty = Number(quantity || 0);
      const unit = Number(prItem.unitPrice || 0);
      const total = Number((qty * unit).toFixed(2));
      const discountType =
        prItem.discountType === "Percentage" ? "Percentage" : "Fixed";
      const discount = Number(prItem.discount || 0);
      const discountAmount =
        prItem.discountAmount !== undefined
          ? Number(prItem.discountAmount || 0)
          : discountType === "Percentage"
            ? Number(((total * discount) / 100).toFixed(2))
            : Number(discount);
      const netPrice =
        prItem.netPrice !== undefined
          ? Number(prItem.netPrice || 0)
          : Number((total - discountAmount).toFixed(2));
      const vatType =
        prItem.vatType === "Inclusive" ? "Inclusive" : "Exclusive";
      const vatPercentage = Number(prItem.vatPercentage || 0);
      const vatAmount =
        prItem.vatAmount !== undefined
          ? Number(prItem.vatAmount || 0)
          : vatType === "Exclusive"
            ? Number(((netPrice * vatPercentage) / 100).toFixed(2))
            : Number(0);
      const netPlusVat =
        prItem.netPlusVat !== undefined
          ? Number(prItem.netPlusVat || 0)
          : Number((netPrice + vatAmount).toFixed(2));

      // Add quantitiesByUom to itemSubdoc

      const itemSubdoc = {
        itemId,
        code: prItem.code || "",
        name: prItem.name || "",
        description: prItem.description || "",
        quantity: qty,
        uom: prItem.uom || "",
        unitPrice: unit,
        totalPrice: total,
        discount,
        discountType,
        discountAmount,
        netPrice,
        vatAmount,
        vatType,
        vatPercentage,
        netPlusVat,
        freeQuantity: Number(prItem.freeQuantity || 0),
        freeQuantityExpiryDate: prItem.freeQuantityExpiryDate || null,
        level0: prItem.level0,
        packagingStructure: prItem.packagingStructure,
      };

      console.log({ itemSubdoc });

      // Add quantitiesByUom to itemSubdoc
      let quantitiesByUom = [];
      if (prItem?.uom) {
        quantitiesByUom.push({
          uom: prItem.uom || "",
          quantity: quantity,
        });
      }

      // add on level1
      if (
        prItem &&
        prItem?.packagingStructure?.level1?.uom &&
        prItem?.packagingStructure?.level1?.quantity &&
        prItem?.packagingStructure?.level1?.price > 0
      ) {
        quantitiesByUom.push({
          uom: prItem?.packagingStructure?.level1?.uom || "",
          quantity: Number(
            (prItem?.packagingStructure?.level1?.quantity || 0) * quantity,
          ),
        });
      }

      // add on level2
      if (
        prItem &&
        prItem?.packagingStructure?.level2?.uom &&
        prItem?.packagingStructure?.level2?.quantity &&
        prItem?.packagingStructure?.level2?.price > 0
      ) {
        quantitiesByUom.push({
          uom: prItem?.packagingStructure?.level2?.uom || "",
          quantity: Number(
            (prItem?.packagingStructure?.level2?.quantity || 0) *
              quantitiesByUom[quantitiesByUom?.length - 1]?.quantity,
          ),
        });
      }

      const newAllocatedItem = new AllocatedStockItem({
        clinicId,
        item: itemSubdoc,
        quantity,
        user,
        purchaseRecord,
        allocatedBy: me._id, // Use the current user as allocatedBy
        location,
        expiryDate,
        quantitiesByUom,
      });

      await newAllocatedItem.save();
      allocatedItemIds.push(newAllocatedItem._id);
    }

    const allocatedItemDetails = new AllocatedStockItemDetails({
      allocatedStockItems: allocatedItemIds,
      purchaseRecord,
      allocatedBy: me._id, // Use the current user as allocatedBy
      notes,
    });
    await allocatedItemDetails.save();

    // update the status of purchase record to "Allocated"
    await PurchaseRecord.findByIdAndUpdate(purchaseRecord, {
      status: "Allocated",
    });

    // Populate references
    const allocatedItems = await AllocatedStockItem.find({
      _id: { $in: allocatedItemIds },
    })
      .populate("user") // Just the field name as string
      .populate("location") // Just the field name as string
      .populate("allocatedBy") // Also populate the allocatedBy field
      .lean(); // Optional: Use .lean() for better performance if you don't need Mongoose documents

    return res.status(201).json({
      success: true,
      message: "Allocated item created",
      allocatedItems,
      allocatedItemDetails,
    });
  } catch (err) {
    console.error("Error in add allocated stock item: ", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
