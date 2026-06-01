import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import DirectStockTransfer from "../../../../models/stocks/DirectStockTransfer";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  res.setHeader("Allow", "GET");
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

    const search = req.query.search ? req.query.search.trim() : null;
    const branch = req.query.branch; // can be fromBranch or toBranch
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const directNo = req.query.directStockTransferNo;

    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const allowedSortFields = [
      "directStockTransferNo",
      "date",
      "status",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";

    let query = { clinicId };

    if (search) {
      query.$or = [
        { directStockTransferNo: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
      ];
    }

    if (branch) {
      query.$or = query.$or || [];
      query.$or.push({ fromBranch: branch }, { toBranch: branch });
    }
    if (status) query.status = status;
    if (directNo)
      query.directStockTransferNo = { $regex: directNo, $options: "i" };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [totalRecords, records] = await Promise.all([
      DirectStockTransfer.countDocuments(query),
      DirectStockTransfer.find(query)
        .populate("fromBranch", "name")
        .populate("toBranch", "name")
        .populate("createdBy", "name email")
        .sort({ [finalSortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const stats = await DirectStockTransfer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalItems: { $sum: { $size: "$items" } },
          byStatus: { $push: "$status" },
        },
      },
      {
        $project: {
          totalRecords: 1,
          totalItems: 1,
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

    const distinctStatuses = await DirectStockTransfer.distinct("status", {
      clinicId,
    });

    const totalPages = Math.ceil(totalRecords / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "Direct stock transfers fetched successfully",
      data: {
        records,
        statistics: stats[0] || {
          totalRecords: 0,
          totalItems: 0,
          statusCounts: { New: 0, Transfered: 0, Cancelled: 0, Deleted: 0 },
        },
        filters: {
          statuses: distinctStatuses.filter((s) => s),
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
          directStockTransferNo: directNo,
          startDate,
          endDate,
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching direct stock transfers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch direct stock transfers",
      error: error.message,
    });
  }
}
