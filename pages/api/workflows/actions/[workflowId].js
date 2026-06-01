import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import WorkflowAction from "../../../../models/workflows/WorkflowAction";
import Workflow from "../../../../models/workflows/Workflow";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { workflowId } = req.query;

  if (!workflowId) {
    return res.status(400).json({
      success: false,
      message: "workflowId is required in query",
    });
  }

  res.setHeader("Allow", ["POST"]);

  if (req.method !== "POST") {
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

  try {
    let clinicId;
    if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res
          .status(404)
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
      clinicId = req.body.clinicId;
      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required for admin" });
      }
    }

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }

    if (clinicId && workflow.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { name, type, parameters } = req.body;

    if (!name || !type) {
      return res
        .status(400)
        .json({ success: false, message: "name and type are required" });
    }

    const newAction = new WorkflowAction({
      clinicId: workflow.clinicId,
      workflowId,
      name,
      type,
      parameters,
    });

    await newAction.save();

    return res.status(201).json({
      success: true,
      message: "Action created successfully",
      data: newAction,
    });
  } catch (err) {
    console.error("Error creating action:", err);
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
}
