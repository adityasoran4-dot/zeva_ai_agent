import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Workflow from "../../../models/workflows/Workflow";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["POST", "GET"]);

  if (!["POST", "GET"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res
        .status(400)
        .json({ success: false, message: "Clinic not found" });
    }
    clinicId = clinic._id;
  } else if (["agent", "doctor", "doctorStaff"].includes(me.role)) {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: `${me.role} not tied to a clinic` });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId || req.query.clinicId;
    if (!clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "clinicId is required for admin" });
    }
  } else {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  if (req.method === "POST") {
    try {
      const { name, description, entity } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Valid name is required" });
      }
      if (
        !entity ||
        !["Lead", "Patient", "Appointment", "Webhook", "Message"].includes(
          entity,
        )
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Valid entity is required" });
      }

      const newWorkflow = new Workflow({
        clinicId,
        name: name.trim(),
        description: description?.trim() || "",
        entity,
        ownerId: me._id,
      });

      await newWorkflow.save();
      return res.status(201).json({
        success: true,
        message: "Workflow created successfully",
        data: newWorkflow,
      });
    } catch (err) {
      console.error("Error creating workflow:", err);
      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
        });
      }
      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else if (req.method === "GET") {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim();
      const status = req.query.status;

      let query = { clinicId };

      if (["agent", "doctor", "doctorStaff"].includes(me.role)) {
        query.ownerId = me._id;
      }

      if (search) {
        query.$or = [{ name: { $regex: search, $options: "i" } }];
      }

      if (status && ["Active", "Inactive"].includes(status)) {
        query.status = status;
      }

      const [totalWorkflows, workflows, activeCount, totalRuns] =
        await Promise.all([
          Workflow.countDocuments(query),
          Workflow.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "workflowhistories",
                localField: "_id",
                foreignField: "workflowId",
                as: "history",
              },
            },
            {
              $addFields: {
                totalRuns: { $size: "$history" },
                completedRuns: {
                  $size: {
                    $filter: {
                      input: "$history",
                      as: "h",
                      cond: { $eq: ["$$h.status", "completed"] },
                    },
                  },
                },
              },
            },
            {
              $addFields: {
                successRate: {
                  $cond: {
                    if: { $gt: ["$totalRuns", 0] },
                    then: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$completedRuns", "$totalRuns"] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                    else: 0,
                  },
                },
              },
            },
            {
              $project: {
                history: 0,
                totalRuns: 0,
                completedRuns: 0,
              },
            },
          ]),
          Workflow.countDocuments({ ...query, status: "Active" }),
          Workflow.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: "$runs" } } },
          ]),
        ]);

      const totalPages = Math.ceil(totalWorkflows / limit);

      return res.status(200).json({
        success: true,
        message: "Workflows fetched successfully",
        data: {
          workflows,
          stats: {
            totalWorkflows,
            activeWorkflows: activeCount,
            totalExecutions: totalRuns[0]?.total || 0,
          },
          pagination: {
            totalResults: totalWorkflows,
            totalPages,
            currentPage: page,
            limit,
            hasMore: page < totalPages,
          },
        },
      });
    } catch (err) {
      console.error("Error fetching workflows:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
