import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import User from "../../../../models/Users";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
import Supplier from "../../../../models/stocks/Supplier";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["GET"]);

  if (req.method !== "GET") {
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
      clinicId = req.query.clinicId; // For GET, clinicId comes from query params
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

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const search = req.query.search
      ? req.query.search.trim().toLowerCase()
      : null;
    const branch = req.query.branch; // Optional filter by branch
    const type = req.query.type; // Filter by type
    const status = req.query.status; // Filter by status
    const statusNot = req.query.statusNot; // Exclude specific status
    const startDate = req.query.startDate; // Filter by date range
    const endDate = req.query.endDate;
    const supplierId = req.query.supplier; // Filter by supplier (changed from supplierId)
    const orderNo = req.query.orderNo; // Filter by order number
    const fromDate = req.query.fromDate; // Filter by from date
    const toDate = req.query.toDate; // Filter by to date

    // Sort parameters
    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Validate sort field (only allow certain fields for security)
    const allowedSortFields = [
      "orderNo",
      "date",
      "type",
      "status",
      "supplierInvoiceNo",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";

    // Build query
    let query = { clinicId };

    // Search functionality (search in multiple fields)
    if (search) {
      query.$or = [
        { orderNo: { $regex: search, $options: "i" } },
        { supplierInvoiceNo: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { enqNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by branch
    if (branch) {
      query.branch = branch;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Exclude specific status
    if (statusNot) {
      query.status = { $ne: statusNot };
    }

    // Filter by supplier
    if (supplierId) {
      query.supplier = supplierId; // Note: field name is 'supplier' in the model
    }

    // Filter by order number
    if (orderNo) {
      query.orderNo = { $regex: orderNo, $options: "i" };
    }

    // Filter by date range (using date field)
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Filter by from/to dates (alternative date filtering)
    if (fromDate || toDate) {
      query.date = query.date || {};
      if (fromDate) {
        query.date.$gte = query.date.$gte
          ? new Date(
              Math.max(query.date.$gte.getTime(), new Date(fromDate).getTime()),
            )
          : new Date(fromDate);
      }
      if (toDate) {
        query.date.$lte = query.date.$lte
          ? new Date(
              Math.min(query.date.$lte.getTime(), new Date(toDate).getTime()),
            )
          : new Date(toDate);
      }
    }

    // Execute parallel queries for better performance
    const totalRecords = await PurchaseRecord.countDocuments(query);
    const records = await PurchaseRecord.find(query)
      .populate("branch", "name", Clinic)
      .populate("supplier", "name", Supplier)
      .populate("createdBy", "name email", User)
      // .sort({ [finalSortBy]: sortOrder })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get statistics with proper item aggregation
    const stats = await PurchaseRecord.aggregate([
      { $match: query },
      { $unwind: "$items" }, // Deconstruct items array
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalValue: { $sum: "$items.totalPrice" },
          uniqueSuppliers: { $addToSet: "$supplier" },
          uniqueBranches: { $addToSet: "$branch" },
          totalItems: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          totalRecords: 1,
          totalValue: { $round: ["$totalValue", 2] },
          avgValuePerRecord: {
            $round: [
              {
                $cond: [
                  { $eq: ["$totalRecords", 0] },
                  0,
                  { $divide: ["$totalValue", "$totalRecords"] },
                ],
              },
              2,
            ],
          },
          uniqueSuppliersCount: { $size: "$uniqueSuppliers" },
          uniqueBranchesCount: { $size: "$uniqueBranches" },
          totalItems: 1,
        },
      },
    ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const hasMore = page < totalPages;

    // Get distinct branches and suppliers for filter dropdowns (optional)
    const distinctBranches = await PurchaseRecord.distinct("branch", {
      clinicId,
    });
    const distinctSuppliers = await PurchaseRecord.distinct("supplier", {
      clinicId,
    });

    return res.status(200).json({
      success: true,
      message: "Purchase records fetched successfully",
      data: {
        records,
        statistics: stats[0] || {
          totalRecords: 0,
          totalValue: 0,
          avgValuePerRecord: 0,
          uniqueSuppliersCount: 0,
          uniqueBranchesCount: 0,
        },
        filters: {
          branches: distinctBranches.filter((b) => b), // Remove null/undefined
          suppliers: distinctSuppliers.filter((s) => s),
        },
        pagination: {
          totalResults: totalRecords,
          totalPages,
          currentPage: page,
          limit,
          hasMore,
          nextPage: hasMore ? page + 1 : null,
          prevPage: page > 1 ? page - 1 : null,
        },
        queryInfo: {
          search,
          branch,
          type,
          status,
          statusNot,
          supplierId,
          orderNo,
          fromDate,
          toDate,
          startDate,
          endDate,
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (err) {
    console.error("Error in fetch purchase records:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
