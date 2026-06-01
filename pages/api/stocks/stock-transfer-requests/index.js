import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import StockTransferRequest from "../../../../models/stocks/StockTransferRequest";
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
    const transferType = req.query.transferType;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const stockTransferRequestNo = req.query.stockTransferRequestNo;

    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const allowedSortFields = [
      "stockTransferRequestNo",
      "date",
      "status",
      "transferType",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";

    let query = { clinicId };

    if (search) {
      query.$or = [
        { stockTransferRequestNo: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
      ];
    }

    if (branch) query.requestingBranch = branch;
    if (status) query.status = status;
    if (transferType) query.transferType = transferType;
    if (stockTransferRequestNo)
      query.stockTransferRequestNo = {
        $regex: stockTransferRequestNo,
        $options: "i",
      };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [totalRecords, records] = await Promise.all([
      StockTransferRequest.countDocuments(query),
      StockTransferRequest.find(query)
        .populate("requestingBranch", "name")
        .populate("fromBranch", "name")
        .populate("requestingEmployee", "name email")
        .populate("createdBy", "name email")
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const stats = await StockTransferRequest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalItems: { $sum: { $size: "$items" } },
          uniqueBranches: { $addToSet: "$requestingBranch" },
          uniqueEmployees: { $addToSet: "$requestingEmployee" },
          byStatus: { $push: "$status" },
        },
      },
      {
        $project: {
          totalRecords: 1,
          totalItems: 1,
          uniqueBranchesCount: {
            $size: {
              $filter: {
                input: "$uniqueBranches",
                as: "b",
                cond: { $ne: ["$$b", null] },
              },
            },
          },
          uniqueEmployeesCount: {
            $size: {
              $filter: {
                input: "$uniqueEmployees",
                as: "e",
                cond: { $ne: ["$$e", null] },
              },
            },
          },
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
            Transfered: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Transfered"] },
                },
              },
            },
            Cancelled: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Cancelled"] },
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

    const [distinctBranches, distinctStatuses, distinctTransferTypes] =
      await Promise.all([
        StockTransferRequest.distinct("requestingBranch", { clinicId }),
        StockTransferRequest.distinct("status", { clinicId }),
        StockTransferRequest.distinct("transferType", { clinicId }),
      ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "Stock transfer requests fetched successfully",
      data: {
        records,
        statistics: stats[0] || {
          totalRecords: 0,
          totalItems: 0,
          uniqueBranchesCount: 0,
          uniqueEmployeesCount: 0,
          statusCounts: { New: 0, Transfered: 0, Cancelled: 0, Deleted: 0 },
        },
        filters: {
          branches: distinctBranches.filter((b) => b),
          statuses: distinctStatuses.filter((s) => s),
          transferTypes: distinctTransferTypes.filter((t) => t),
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
          transferType,
          stockTransferRequestNo,
          startDate,
          endDate,
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching stock transfer requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stock transfer requests",
      error: error.message,
    });
  }
}
