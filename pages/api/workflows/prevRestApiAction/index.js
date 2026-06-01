import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import Workflow from "../../../../models/workflows/Workflow";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import WorkflowAction from "../../../../models/workflows/WorkflowAction";

export default async function handler(req, res) {
  await dbConnect();

  const { workflowId, nodeId } = req.body;

  if (!workflowId || !nodeId) {
    return res.status(400).json({
      success: false,
      message: "workflowId and nodeId is required in body",
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
    }

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res
        .status(404)
        .json({ success: false, message: "Workflow not found" });
    }
    const workflowNodes = workflow.nodes || [];
    const workflowEdges = workflow.edges || [];

    const startNode = workflowNodes.find((n) => n.data.id === nodeId);
    if (!startNode) {
      return res
        .status(404)
        .json({ success: false, message: "Node not found" });
    }

    // Traverse backwards through edges to find the previous rest_api node
    let prevRestApiNode = null;
    const visited = new Set();
    const queue = [startNode.id]; // Use ReactFlow internal ID for traversal

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Find edges where the current node is the target (incoming edges)
      const incomingEdges = workflowEdges.filter((e) => e.target === currentId);

      for (const edge of incomingEdges) {
        const parentId = edge.source;
        const parentNode = workflowNodes.find((n) => n.id === parentId);

        if (parentNode) {
          if (
            parentNode.type === "action" &&
            parentNode.data.subType === "rest_api"
          ) {
            prevRestApiNode = parentNode;
            break;
          }
          queue.push(parentId);
        }
      }

      if (prevRestApiNode) break;
    }

    console.log({ startNode, prevRestApiNode });
    if (!prevRestApiNode) {
      return res.status(200).json({
        success: false,
        message: "Prev rest api action node not found",
        data: {},
      });
    }

    let prevRestApiAction = await WorkflowAction.findById(
      prevRestApiNode.data.id,
    );
    if (!prevRestApiAction) {
      return res.status(200).json({
        success: false,
        message: "Prev rest api action not found",
        data: {},
      });
    }

    if (req.method === "POST") {
      return res.status(200).json({
        success: true,
        data: prevRestApiAction,
        message: "Prev rest api action found",
      });
    } else {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (err) {
    console.error("Error fetching trigger:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
