// /pages/api/lead/reassign-lead.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../bullmq/workflow";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!requireRole(user, ["clinic", "agent", "admin"])) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (req.method === "POST") {
    try {
      const { leadId, agentIds, followUpDate } = req.body;

      if (
        !leadId ||
        !agentIds ||
        (Array.isArray(agentIds) && agentIds.length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "leadId and agentIds are required" });
      }

      const agentsArray = Array.isArray(agentIds) ? agentIds : [agentIds];

      // ✅ First, get the lead to determine which clinic it belongs to
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      // ✅ Determine clinic
      let clinic;
      if (user.role === "clinic") {
        clinic = await Clinic.findOne({ owner: user._id }).select("_id");
        // Ensure the lead belongs to this clinic
        if (lead.clinicId.toString() !== clinic._id.toString()) {
          return res
            .status(403)
            .json({ message: "Not allowed to access this lead" });
        }
      } else if (user.role === "agent") {
        if (!user.clinicId) {
          return res
            .status(403)
            .json({ message: "Agent not linked to any clinic" });
        }
        clinic = await Clinic.findById(user.clinicId).select("_id");
        // Ensure the lead belongs to this clinic
        if (lead.clinicId.toString() !== clinic._id.toString()) {
          return res
            .status(403)
            .json({ message: "Not allowed to access this lead" });
        }
      } else if (user.role === "admin") {
        // Admin can access any lead
        clinic = await Clinic.findById(lead.clinicId).select("_id");
        if (!clinic) {
          return res.status(404).json({ message: "Clinic not found" });
        }
      }

      if (!clinic) {
        return res
          .status(404)
          .json({ message: "Clinic not found for this user" });
      }

      // ✅ Check permission for assigning leads (only for clinic and agent, admin bypasses)
      if (user.role !== "admin") {
        const { checkClinicPermission } = await import("./permissions-helper");
        const { hasPermission, error } = await checkClinicPermission(
          clinic._id,
          "create_lead", // Check "create_lead" module permission
          "update", // Assigning is an update operation
          null, // No submodule - this is a module-level check
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: error || "You do not have permission to assign leads",
          });
        }
      }

      // ✅ Ensure agent (if role=agent) is assigned to this lead OR belongs to same clinic
      if (user.role === "agent") {
        const isAssigned = lead.assignedTo.some(
          (a) => a.user.toString() === user._id.toString(),
        );
        if (!isAssigned) {
          return res
            .status(403)
            .json({ message: "Agent not assigned to this lead" });
        }
      }

      // Build update object
      const updateData = {
        $push: {
          assignedTo: {
            $each: agentsArray.map((id) => ({
              user: id,
              assignedAt: new Date(),
            })),
          },
        },
      };

      if (followUpDate) {
        updateData.$push.followUps = {
          $each: [{ date: new Date(followUpDate) }],
        };
      }

      const updatedLead = await Lead.findOneAndUpdate(
        { _id: leadId, clinicId: clinic._id },
        updateData,
        { new: true },
      )
        .populate("assignedTo.user", "name email")
        .populate("treatments.treatment", "name")
        .lean();

      // Note: Execute workflow for the updated lead
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.LEAD,
        trigger: WORKFLOW_TRIGGER_TYPE.UPDATE_LEAD,
        leadId: lead._id?.toString(),
        clinicId: clinic._id?.toString(),
      });

      // Execute workflow for create_or_update_lead trigger
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.LEAD,
        trigger: WORKFLOW_TRIGGER_TYPE.CREATE_OR_UPDATE_LEAD,
        leadId: lead._id?.toString(),
        clinicId: clinic._id?.toString(),
      });

      return res.status(200).json({
        success: true,
        message: "Lead updated successfully",
        lead: updatedLead,
      });
    } catch (err) {
      // console.error("Error updating lead:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update lead" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
