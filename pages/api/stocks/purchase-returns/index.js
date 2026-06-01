import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import PurchaseReturn from "../../../../models/stocks/PurchaseReturn";
import PurchaseRecord from "../../../../models/stocks/PurchaseRecord";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["GET"]);

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
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

    // Resolve clinicId
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
    const purchaseReturnNo = req.query.purchaseReturnNo;
    const purchasedOrder = req.query.purchasedOrder;

    const sortBy = req.query.sortBy || "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const allowedSortFields = [
      "purchaseReturnNo",
      "date",
      "status",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date";

    let query = { clinicId };

    if (search) {
      query.$or = [
        { purchaseReturnNo: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    if (branch) query.branch = branch;
    if (status) query.status = status;
    if (purchaseReturnNo)
      query.purchaseReturnNo = { $regex: purchaseReturnNo, $options: "i" };
    if (purchasedOrder) query.purchasedOrder = purchasedOrder;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [totalRecords, records] = await Promise.all([
      PurchaseReturn.countDocuments(query),
      PurchaseReturn.find(query)
        .populate("branch", "name")
        .populate({
          path: "purchasedOrder",
          select: "orderNo date supplier items",
          populate: { path: "supplier", select: "name" },
        })
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const stats = await PurchaseReturn.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          uniqueBranches: { $addToSet: "$branch" },
          uniqueSuppliers: { $addToSet: "$supplier" },
          totalItems: { $sum: { $size: { $ifNull: ["$items", []] } } },
          byStatus: { $push: "$status" },
        },
      },
      {
        $project: {
          totalRecords: 1,
          uniqueBranchesCount: { $size: "$uniqueBranches" },
          uniqueSuppliersCount: { $size: "$uniqueSuppliers" },
          totalItems: 1,
          statusCounts: {
            Returned: {
              $size: {
                $filter: {
                  input: "$byStatus",
                  as: "s",
                  cond: { $eq: ["$$s", "Returned"] },
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

    const [distinctBranches, distinctStatuses, recentPurchaseOrders] =
      await Promise.all([
        PurchaseReturn.distinct("branch", { clinicId }),
        PurchaseReturn.distinct("status", { clinicId }),
        PurchaseRecord.find({ clinicId })
          .select("_id orderNo date")
          .sort({ date: -1 })
          .limit(50)
          .lean(),
      ]);

    const totalPages = Math.ceil(totalRecords / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      success: true,
      message: "Purchase returns fetched successfully",
      data: {
        records,
        statistics: stats[0] || {
          totalRecords: 0,
          uniqueBranchesCount: 0,
          uniqueSuppliersCount: 0,
          totalItems: 0,
          statusCounts: { Returned: 0, Deleted: 0 },
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
          purchaseReturnNo,
          purchasedOrder,
          startDate,
          endDate,
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (err) {
    console.error("Error fetching purchase returns:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
