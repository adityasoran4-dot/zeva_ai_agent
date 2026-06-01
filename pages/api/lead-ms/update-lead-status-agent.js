// pages/api/lead-ms/update-lead-status-agent.js
// Example API endpoint that uses agent permissions for approve action
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // Check if user is an agent
    if (!['agent', 'doctorStaff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Agent role required" });
    }

    const { leadId, status } = req.body;
    if (!leadId || !status) {
      return res.status(400).json({ success: false, message: "Lead ID and status are required" });
    }

    // ✅ CHECK PERMISSION: For approve/decline actions, check "approve" permission
    // For other status updates, check "update" permission
    const action = ['Approved', 'Declined'].includes(status) ? 'approve' : 'update';
    
    // First check if clinic has the required permission
    if (me.clinicId) {
      const clinic = await Clinic.findById(me.clinicId);
      if (clinic) {
        const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
          clinic._id,
          "lead",
          action
        );

        if (!clinicHasPermission) {
          return res.status(403).json({
            success: false,
            message: clinicError || `You do not have permission to ${action} leads`
          });
        }
      }
    }

    // Then check agent-specific permissions
    const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
      me._id,
      "lead", // moduleKey
      action, // action: "approve" or "update"
      null // subModuleName (optional)
    );

    if (!agentHasPermission) {
      return res.status(403).json({
        success: false,
        message: agentError || `You do not have permission to ${action} leads`
      });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Update the lead status
    lead.status = status;
    await lead.save();

    return res.status(200).json({
      success: true,
      message: `Lead ${status.toLowerCase()} successfully`,
      lead: {
        _id: lead._id,
        status: lead.status
      }
    });

  } catch (error) {
    // console.error("Error updating lead status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

