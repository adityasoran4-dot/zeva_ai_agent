// pages/api/lead-ms/lead-delete-agent.js
// Example API endpoint that uses agent permissions
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
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

    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, message: "Lead ID is required" });
    }

    // ✅ CHECK PERMISSION: Verify agent has delete permission for lead module
    // First check if clinic has delete permission
    if (me.clinicId) {
      const clinic = await Clinic.findById(me.clinicId);
      if (clinic) {
        const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
          clinic._id,
          "lead",
          "delete"
        );

        if (!clinicHasPermission) {
          return res.status(403).json({
            success: false,
            message: clinicError || "You do not have permission to delete leads"
          });
        }
      }
    }

    // Then check agent-specific permissions
    const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
      me._id,
      "lead", // moduleKey
      "delete", // action
      null // subModuleName (optional)
    );

    if (!agentHasPermission) {
      return res.status(403).json({
        success: false,
        message: agentError || "You do not have permission to delete leads"
      });
    }

    // Find the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Additional check: Ensure agent can only delete leads assigned to them (optional security)
    // Uncomment if you want this restriction:
    // const isAssignedToAgent = lead.assignedTo?.some(
    //   assignment => assignment.user?.toString() === me._id.toString()
    // );
    // if (!isAssignedToAgent) {
    //   return res.status(403).json({ success: false, message: "You can only delete leads assigned to you" });
    // }

    // Delete the lead
    await Lead.findByIdAndDelete(leadId);

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully"
    });

  } catch (error) {
    // console.error("Error deleting lead:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}

