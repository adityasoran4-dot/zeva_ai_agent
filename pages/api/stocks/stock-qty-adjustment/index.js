import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import StockQtyAdjustment from "../../../../models/stocks/StockQtyAdjustment";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  res.status(405).json({ success: false, message: "Method not allowed" });
}

async function handleGet(req, res) {
  await dbConnect();

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
      clinicId = req.query.clinicId;
      if (!clinicId)
        return res.status(400).json({
          success: false,
          message: "clinicId is required for admin in query parameters",
        });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const search = req.query.search
      ? req.query.search.trim().toLowerCase()
      : null;
    const branch = req.query.branch;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const allowedSortFields = [
      "date",
      "status",
      "postAc",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";

    let query = { clinicId };

    if (search) {
      query.$or = [
        { postAc: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
        { "items.code": { $regex: search, $options: "i" } },
      ];
    }

    if (branch) query.branch = branch;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const total = await StockQtyAdjustment.countDocuments(query);
    const data = await StockQtyAdjustment.find(query)
      .populate("branch", "name")
      .populate("createdBy", "name email")
      .sort({ [finalSortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const branches = await StockQtyAdjustment.distinct("branch", { clinicId });
    const statuses = await StockQtyAdjustment.distinct("status", { clinicId });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        branches,
        statuses,
      },
    });
  } catch (error) {
    console.error("Error fetching stock quantity adjustments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock quantity adjustments",
      error: error.message,
    });
  }
}
