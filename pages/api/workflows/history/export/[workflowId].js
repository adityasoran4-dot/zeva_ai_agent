import dbConnect from "../../../../../lib/database";
import WorkflowHistory from "../../../../../models/workflows/WorkflowHistory";
import Workflow from "../../../../../models/workflows/Workflow";
import Clinic from "../../../../../models/Clinic";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

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

    const history = await WorkflowHistory.find({ workflowId })
      .populate("triggerId")
      .populate("actionId")
      .populate("conditionId")
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    // Define CSV headers
    const headers = [
      "Type",
      "Status",
      "Name",
      "Condition Result",
      "Executed At",
      "Error",
      "Details",
      "Response",
    ];

    const getActionName = (type) => {
      switch (type) {
        case "send_email":
          return "Send Email";
        case "send_sms":
          return "Send SMS";
        case "send_whatsapp":
          return "Send WhatsApp";
        case "update_lead_status":
          return "Update Lead Status";
        case "add_tag":
          return "Add Tag";
        case "assign_owner":
          return "Assign Owner";
        case "rest_api":
          return "REST API Call";
        case "add_to_segment":
          return "Add to Segment";
        case "ai_composer":
          return "AI Composer";
        case "delay":
          return "Delay";
        case "router":
          return "Router";
        case "book_appointment":
          return "Book Appointment";
        default:
          return type || "Unknown Action";
      }
    };

    const getConditionName = (type) => {
      switch (type) {
        case "if_else":
          return "If-Else";
        case "filter":
          return "Filter";
        default:
          return type || "Unknown Condition";
      }
    };

    // Convert data to CSV rows
    const rows = history.map((item) => {
      let name = "";
      if (item.type === "trigger") {
        name = item.triggerId?.name || "Manual Trigger";
      } else if (item.type === "condition") {
        name = getConditionName(item.conditionId?.type);
      } else if (item.type === "action") {
        name = getActionName(item.actionId?.type);
        if (item.actionId?.type === "delay") {
          name += ` (${item.actionId?.delayTime} ${item.actionId?.delayFormat})`;
        }
      }

      const conditionResult =
        item.conditionResult === true
          ? "Passed"
          : item.conditionResult === false
            ? "Failed"
            : "N/A";

      const details = item.details
        ? JSON.stringify(item.details).replace(/"/g, '""')
        : "";

      const responseData = item.response
        ? JSON.stringify(item.response).replace(/"/g, '""')
        : "";

      return [
        `"${item.type || ""}"`,
        `"${item.status || ""}"`,
        `"${(name || "").replace(/"/g, '""')}"`,
        `"${conditionResult}"`,
        `"${new Date(item.executedAt || item.createdAt).toLocaleString()}"`,
        `"${(item.error || "").replace(/"/g, '""')}"`,
        `"${details}"`,
        `"${responseData}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=workflow-history-${workflowId}-${new Date().toISOString().split("T")[0]}.csv`,
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error fetching workflow history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch workflow history",
    });
  }
}
