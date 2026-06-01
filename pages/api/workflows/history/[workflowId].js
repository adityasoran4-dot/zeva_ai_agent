import dbConnect from "../../../../lib/database";
import WorkflowHistory from "../../../../models/workflows/WorkflowHistory";
import Workflow from "../../../../models/workflows/Workflow";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import WorkflowAction from "../../../../models/workflows/WorkflowAction";
import WorkflowCondition from "../../../../models/workflows/WorkflowCondition";
import WorkflowTrigger from "../../../../models/workflows/WorkflowTrigger";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id }).exec();
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
      clinicId = req.query.clinicId;
      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required for admin" });
      }
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { workflowId } = req.query;
    if (!workflowId) {
      return res
        .status(400)
        .json({ success: false, message: "Workflow ID is required" });
    }

    const workflow = await Workflow.findOne({
      _id: workflowId,
      clinicId,
    }).exec();
    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found in this clinic" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const status = req.query.status || "";

    let query = {};
    if (status) {
      query.status = status;
    }

    const [total, totalCompleted, totalFailed, totalInProgress, history] =
      await Promise.all([
        WorkflowHistory.countDocuments({ workflowId }).exec(),
        WorkflowHistory.countDocuments({
          workflowId,
          status: "completed",
        }).exec(),
        WorkflowHistory.countDocuments({ workflowId, status: "failed" }).exec(),
        WorkflowHistory.countDocuments({
          workflowId,
          status: "in-progress",
        }).exec(),
        WorkflowHistory.find({ workflowId, ...query })
          .populate("workflowId", "name")
          .populate("triggerId")
          .populate("actionId")
          .populate("conditionId")
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
      ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      data: history,
      pagination: {
        totalResults: total,
        totalCompleted,
        totalFailed,
        totalInProgress,
        totalPages,
        currentPage: page,
        limit,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching workflow history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch workflow history",
    });
  }
}
