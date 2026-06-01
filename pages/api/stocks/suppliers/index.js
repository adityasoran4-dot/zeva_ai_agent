import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
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
    const status = req.query.status; // If you have status field in Supplier model

    // Sort parameters
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Validate sort field (only allow certain fields for security)
    const allowedSortFields = [
      "name",
      "branch",
      "creditDays",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Build query
    let query = { clinicId };

    // Search functionality (search in multiple fields)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { telephone: { $regex: search, $options: "i" } },
        { vatRegNo: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by branch
    if (branch) {
      query.branch = branch;
    }

    // Filter by status (if your Supplier model has status field)
    if (status) {
      query.status = status;
    }

    // Execute parallel queries for better performance
    const totalSuppliers = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get statistics (optional)
    const stats = await Supplier.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          avgCreditDays: { $avg: "$creditDays" },
          uniqueBranches: { $addToSet: "$branch" },
        },
      },
      {
        $project: {
          totalSuppliers: 1,
          avgCreditDays: { $round: ["$avgCreditDays", 2] },
          uniqueBranchesCount: { $size: "$uniqueBranches" },
        },
      },
    ]);

    const totalPages = Math.ceil(totalSuppliers / limit);
    const hasMore = page < totalPages;

    // Get distinct branches for filter dropdowns (optional)
    const distinctBranches = await Supplier.distinct("branch", { clinicId });

    return res.status(200).json({
      success: true,
      message: "Suppliers fetched successfully",
      data: {
        suppliers,
        statistics: stats[0] || {
          totalSuppliers: 0,
          avgCreditDays: 0,
          uniqueBranchesCount: 0,
        },
        filters: {
          branches: distinctBranches.filter((b) => b), // Remove null/undefined
        },
        pagination: {
          totalResults: totalSuppliers,
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
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (err) {
    console.error("Error in fetch suppliers:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
