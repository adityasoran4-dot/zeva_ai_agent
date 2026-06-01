import dbConnect from "../../../../lib/database";
import mongoose from "mongoose";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import AllocatedStockItem from "../../../../models/stocks/AllocatedStockItem";
import User from "../../../../models/Users";
import StockLocation from "../../../../models/stocks/StockLocation";
import StockItem from "../../../../models/stocks/StockItem";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
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
      clinicId = req.query.clinicId;
      if (!clinicId) {
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
      }
    }

    const {
      user,
      search,
      status,
      location,
      stockItem,
      stockItems,
      expiryBefore,
      expiryAfter,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    query.clinicId = clinicId;

    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user" });
      }
      query.user = user;
    }

    if (["doctor", "doctorStaff", "agent"].includes(me.role)) {
      query.user = me._id;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { "item.name": { $regex: search, $options: "i" } },
        { "item.code": { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      if (!mongoose.Types.ObjectId.isValid(location)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid location" });
      }
      query.location = location;
    }

    // Fix: Use 'stockItem' field name from schema, not 'stockItems'
    const stockItemIds = [];
    if (stockItem) stockItemIds.push(stockItem);
    if (stockItems) {
      try {
        const parsed = Array.isArray(stockItems)
          ? stockItems
          : JSON.parse(stockItems);
        if (Array.isArray(parsed)) stockItemIds.push(...parsed);
      } catch {
        stockItemIds.push(stockItems);
      }
    }
    if (stockItemIds.length) {
      const validIds = stockItemIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      if (!validIds.length) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid stock item IDs" });
      }
      // Fix: Use 'stockItem' field name from schema
      query.stockItem = { $in: validIds };
    }

    if (expiryBefore || expiryAfter) {
      query.expiryDate = {};
      if (expiryBefore) query.expiryDate.$lte = new Date(expiryBefore);
      if (expiryAfter) query.expiryDate.$gte = new Date(expiryAfter);
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Correct populate usage: pass path/select via objects and rely on schema refs
    await AllocatedStockItem.updateMany(
      { clinicId, expiryDate: { $lt: new Date() }, status: { $ne: "Expired" } },
      { $set: { status: "Expired" } },
    );
    const [items, total] = await Promise.all([
      AllocatedStockItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({ path: "user", select: "name email role", User })
        .populate({ path: "location", StockLocation })
        .populate({ path: "item.itemId", StockItem })
        .populate({ path: "allocatedBy", select: "name email role", User })
        .lean(),
      AllocatedStockItem.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    return res.status(200).json({
      success: true,
      records: items,
      currentPage: Number(page),
      limit: Number(limit),
      totalRecords: total,
      totalPages,
    });
  } catch (err) {
    console.error("GET /api/stocks/allocated-stock-items error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}
