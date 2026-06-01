import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Workflow from "../../../models/workflows/Workflow";
import WorkflowAction from "../../../models/workflows/WorkflowAction";
import WorkflowCondition from "../../../models/workflows/WorkflowCondition";
import WorkflowHistory from "../../../models/workflows/WorkflowHistory";
import WorkflowTrigger from "../../../models/workflows/WorkflowTrigger";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  const { workflowId } = req.query;

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);

  if (req.method !== "GET" && req.method !== "PUT" && req.method !== "DELETE") {
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
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
      clinicId = clinic._id.toString();
    } else if (["agent", "doctor", "doctorStaff"].includes(me.role)) {
      if (!me.clinicId) {
        return res
          .status(400)
          .json({ success: false, message: `${me.role} not tied to a clinic` });
      }
      clinicId = me.clinicId.toString();
    }

    const workflow = await Workflow.findById(workflowId);

    if (!workflow || (clinicId && workflow.clinicId.toString() !== clinicId)) {
      if (me.role !== "admin") {
        return res.status(404).json({
          success: false,
          message: "Workflow not found or access denied",
        });
      }
    }

    if (req.method === "GET") {
      return res.status(200).json({ success: true, data: workflow });
    }

    if (req.method === "PUT") {
      const { nodes, edges, viewport, name, description, status } = req.body;

      const updateData = {};
      if (nodes !== undefined) updateData.nodes = nodes;
      if (edges !== undefined) updateData.edges = edges;
      if (viewport !== undefined) updateData.viewport = viewport;
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;

      const updatedWorkflow = await Workflow.findByIdAndUpdate(
        workflowId,
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!updatedWorkflow) {
        return res
          .status(404)
          .json({ success: false, message: "Workflow not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Workflow updated successfully",
        data: updatedWorkflow,
      });
    }

    if (req.method === "DELETE") {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const deletedWorkflow = await Workflow.findByIdAndDelete(workflowId, {
            session,
          });

          if (!deletedWorkflow) {
            // This will abort the transaction
            throw new Error("Workflow not found");
          }

          // Delete all related documents
          await WorkflowAction.deleteMany({ workflowId }, { session });
          await WorkflowTrigger.deleteMany({ workflowId }, { session });
          await WorkflowCondition.deleteMany({ workflowId }, { session });
          await WorkflowHistory.deleteMany({ workflowId }, { session });
        });

        return res.status(200).json({
          success: true,
          message: "Workflow deleted successfully",
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          message: err.message || "Transaction failed",
        });
      } finally {
        session.endSession();
      }
    }
  } catch (err) {
    console.error(`Error in /api/workflows/${workflowId}:`, err);
    if (err.name === "CastError") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid workflow ID" });
    }
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}

// ---------------------------------Execute workflow function
/*
async function executeWorkflow(workflowData) {
  const { nodes, edges } = workflowData;

  // 1. Find the Trigger
  let currentNode = nodes.find(n => n.type === 'trigger');
  
  while (currentNode) {
    console.log(`Executing: ${currentNode.data.label}`);

    // Perform the actual action logic here (e.g., Send Message, Wait, etc.)
    const result = await performNodeAction(currentNode);

    // 2. Find the Next Node
    let nextEdge;
    
    if (currentNode.type === 'condition') {
      // Branching logic: result of performNodeAction determines 'true' or 'false'
      const handleToFollow = result ? 'true' : 'false';
      nextEdge = edges.find(e => e.source === currentNode.id && e.sourceHandle === handleToFollow);
    } else {
      // Sequential logic: just find the next connected node
      nextEdge = edges.find(e => e.source === currentNode.id);
    }

    // 3. Move to the next node or stop if no more edges
    if (nextEdge) {
      currentNode = nodes.find(n => n.id === nextEdge.target);
    } else {
      currentNode = null; // Workflow finished
    }
  }
}
*/
