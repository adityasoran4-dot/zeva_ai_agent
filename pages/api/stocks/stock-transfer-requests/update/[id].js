import dbConnect from "../../../../../lib/database";
import { reduceQuantity } from "../../../../../lib/stockUtils";
import Clinic from "../../../../../models/Clinic";
import AllocatedStockItem from "../../../../../models/stocks/AllocatedStockItem";
import StockTransferRequest from "../../../../../models/stocks/StockTransferRequest";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
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

    // Resolve clinicId based on user role
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic)
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      clinicId = clinic._id;
    } else if (
      me.role === "agent" ||
      me.role === "doctor" ||
      me.role === "doctorStaff"
    ) {
      if (!me.clinicId)
        return res
          .status(400)
          .json({ success: false, message: "User not tied to a clinic" });
      clinicId = me.clinicId;
    } else if (me.role === "admin") {
      clinicId = req.body.clinicId;
      if (!clinicId)
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin",
        });
    }

    const { id } = req.query;
    const {
      transferType,
      requestingBranch,
      fromBranch,
      requestingEmployee,
      date,
      notes,
      items,
      status,
    } = req.body;

    // Find request (must belong to clinic)
    const request = await StockTransferRequest.findOne({
      _id: id,
      clinicId,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Stock transfer request not found",
      });
    }

    const prevStatus = request.status;
    const currentStatus = status || "";

    // Update fields
    if (transferType !== undefined) request.transferType = transferType;
    if (requestingBranch !== undefined) {
      request.requestingBranch = requestingBranch || null;
    }
    if (fromBranch !== undefined) {
      request.fromBranch = fromBranch;
    }
    if (requestingEmployee) {
      request.requestingEmployee = requestingEmployee || null;
    }
    if (date !== undefined) request.date = new Date(date);
    if (notes !== undefined) request.notes = notes;
    if (status !== undefined && request.status !== "Deleted") {
      request.status = status;
    }

    // Update items if provided
    if (items !== undefined && Array.isArray(items) && items.length > 0) {
      // Validate items
      for (const item of items) {
        if (!item.name || !item.quantity) {
          return res.status(400).json({
            success: false,
            message: "Each item must have name and quantity",
          });
        }
      }
      request.items = items;
    }

    // Save
    await request.save();

    // handle stock deduction and addition
    if (prevStatus !== "Transferred" && currentStatus === "Transferred") {
      // deduct stock from fromBranch
      for (const item of request.items) {
        const { itemId, allocatedStockItemId, quantity, uom } = item;

        if (!allocatedStockItemId) {
          return res.status(400).json({
            success: false,
            message: "Each item must have allocatedStockItemId",
          });
        }

        const allocatedItem =
          await AllocatedStockItem.findById(allocatedStockItemId);
        if (!allocatedItem) {
          return res.status(404).json({
            success: false,
            message: `Allocated stock item not found for itemId: ${itemId}`,
          });
        }

        // reduce quantity from allocated item
        const remainedQtyByUom = await reduceQuantity(
          allocatedItem.quantitiesByUom,
          item.uom,
          item.quantity,
          allocatedItem?.item?.level0,
          allocatedItem?.item?.packagingStructure,
        );
        let reducedQtyByUom = [];
        for (let i = 0; i < remainedQtyByUom.length; i++) {
          reducedQtyByUom.push({
            uom: remainedQtyByUom[i].uom,
            quantity:
              (allocatedItem.quantitiesByUom[i]?.quantity || 0) -
              (remainedQtyByUom[i]?.quantity || 0),
          });
        }
        console.log({
          tq: allocatedItem.quantitiesByUom,
          remainedQtyByUom,
          reducedQtyByUom,
        });

        // update allocated item quantitiesByUom
        allocatedItem.quantitiesByUom = remainedQtyByUom;
        allocatedItem.status = "Partially_Used";

        const checkFullyUsed = remainedQtyByUom.every(
          (qty) => qty.quantity === 0,
        );
        if (checkFullyUsed) {
          allocatedItem.status = "Used";
        }
        await allocatedItem.save();
        console.log({ allocatedItem });

        // create transfered allocated item
        const newAllocatedItem = new AllocatedStockItem({
          clinicId,
          quantity: item.quantity,
          status: "Allocated",
          expiryDate: allocatedItem?.expiryDate,
          quantitiesByUom: reducedQtyByUom,
          location: allocatedItem?.location,
          user: me?._id,
          item: allocatedItem?.item,
          quantitiesByUom: reducedQtyByUom,
          allocatedBy: request?.requestingEmployee,
        });
        await newAllocatedItem.save();
        console.log({ newAllocatedItem });
      }
    }

    // Populate and return
    const updatedRequest = await StockTransferRequest.findById(request._id)
      .populate("requestingBranch", "name")
      .populate("fromBranch", "name")
      .populate("requestingEmployee", "name email")
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      success: true,
      message: "Stock transfer request updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Error updating stock transfer request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock transfer request",
      error: error.message,
    });
  }
}
