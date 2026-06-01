import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import GRN from "../../../../models/stocks/GRN";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
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
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res.status(400).json({
          success: false,
          message: "Agent not tied to a clinic",
        });
      }
      clinicId = me.clinicId;
    } else if (me.role === "doctor" || me.role === "doctorStaff") {
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

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const search = req.query.search
      ? req.query.search.trim().toLowerCase()
      : null;
    const branch = req.query.branch;
    const status = req.query.status;
    const statusNot = req.query.statusNot;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const grnNo = req.query.grnNo;
    const supplierInvoiceNo = req.query.supplierInvoiceNo;
    const purchasedOrder = req.query.purchasedOrder;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    // Sort parameters
    const sortBy = req.query.sortBy || "grnDate";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Validate sort field
    const allowedSortFields = [
      "grnNo",
      "grnDate",
      "supplierInvoiceNo",
      "supplierGrnDate",
      "status",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "grnDate";

    // Build query
    let query = { clinicId };

    // Search functionality
    if (search) {
      query.$or = [
        { grnNo: { $regex: search, $options: "i" } },
        { supplierInvoiceNo: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by branch
    if (branch) {
      query.branch = branch;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Exclude specific status
    if (statusNot) {
      query.status = { $ne: statusNot };
    }

    // Filter by GRN number
    if (grnNo) {
      query.grnNo = { $regex: grnNo, $options: "i" };
    }

    // Filter by supplier invoice number
    if (supplierInvoiceNo) {
      query.supplierInvoiceNo = { $regex: supplierInvoiceNo, $options: "i" };
    }

    // Filter by purchase order
    if (purchasedOrder) {
      query.purchasedOrder = purchasedOrder;
    }

    // Filter by GRN date range
    if (startDate || endDate) {
      query.grnDate = {};
      if (startDate) {
        query.grnDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.grnDate.$lte = new Date(endDate);
      }
    }

    // Filter by supplier GRN date range
    if (fromDate || toDate) {
      query.supplierGrnDate = query.supplierGrnDate || {};
      if (fromDate) {
        query.supplierGrnDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.supplierGrnDate.$lte = new Date(toDate);
      }
    }

    // Execute parallel queries for better performance
    const [totalRecords, records] = await Promise.all([
      GRN.countDocuments(query),
      GRN.find(query)
        .populate("branch", "name")
        .populate({
          path: "purchasedOrder",
          // select: "orderNo date supplier",
          populate: {
            path: "supplier",
            select: "name",
          },
        })
        .populate("createdBy", "name email")
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Get statistics
    const stats = await GRN.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          uniqueBranches: { $addToSet: "$branch" },
          uniquePurchaseOrders: { $addToSet: "$purchasedOrder" },
          byStatus: {
            $push: "$status",
          },
        },
      },
      {
        $project: {
          totalRecords: 1,
          uniqueBranchesCount: { $size: "$uniqueBranches" },
          uniquePurchaseOrdersCount: { $size: "$uniquePurchaseOrders" },
          statusCounts: {
            New: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "New"] },
                },
              },
            },
            Partly_Invoiced: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Partly_Invoiced"] },
                },
              },
            },
            Invoiced: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Invoiced"] },
                },
              },
            },
            Partly_Paid: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Partly_Paid"] },
                },
              },
            },
            Paid: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Paid"] },
                },
              },
            },
            Deleted: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Deleted"] },
                },
              },
            },
          },
        },
      },
    ]);

    // Get distinct values for filter dropdowns
    const [distinctBranches, distinctStatuses, recentPurchaseOrders] =
      await Promise.all([
        GRN.distinct("branch", { clinicId }),
        GRN.distinct("status", { clinicId }),
        PurchaseRecord.find({ clinicId, status: { $ne: "Cancelled" } })
          .select("_id orderNo date")
          .sort({ date: -1 })
          .limit(50)
          .lean(),
      ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "GRN records fetched successfully",
      data: {
        records,
        statistics: stats[0] || {
          totalRecords: 0,
          uniqueBranchesCount: 0,
          uniquePurchaseOrdersCount: 0,
          statusCounts: {
            New: 0,
            Partly_Invoiced: 0,
            Invoiced: 0,
            Partly_Paid: 0,
            Paid: 0,
            Deleted: 0,
          },
        },
        filters: {
          branches: distinctBranches.filter((b) => b),
          statuses: distinctStatuses.filter((s) => s),
          purchaseOrders: recentPurchaseOrders,
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
          status,
          statusNot,
          grnNo,
          supplierInvoiceNo,
          purchasedOrder,
          startDate,
          endDate,
          fromDate,
          toDate,
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (err) {
    console.error("Error in fetch GRN records:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
