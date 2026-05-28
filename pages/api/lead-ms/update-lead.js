import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const me = await getUserFromReq(req);
  if (!me || !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { leadId, name, phone, email } = req.body;

  if (!leadId) {
    return res.status(400).json({ success: false, message: "Lead ID is required" });
  }

  // ✅ Resolve clinicId correctly
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({ success: false, message: "Clinic not found for this user" });
    }
    clinicId = clinic._id;
  } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
    if (!me.clinicId) {
      return res.status(400).json({ success: false, message: "User not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId; // Admin can specify clinicId
  }

  try {
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Verify the lead belongs to the clinic (unless admin)
    if (me.role !== "admin" && lead.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied: Lead belongs to another clinic" });
    }

    // ✅ CHECK PERMISSION
    if (me.role !== "admin") {
      // First check if clinic has the required permission
      const { checkClinicPermission } = await import("./permissions-helper");
      const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
        clinicId,
        "lead",
        "update"
      );

      if (!clinicHasPermission) {
        return res.status(403).json({
          success: false,
          message: clinicError || "You do not have permission to update leads"
        });
      }

      // Then check agent-specific permissions if user is an agent
      if (me.role === "agent") {
        const { checkAgentPermission } = await import("../agent/permissions-helper");
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          me._id,
          "lead",
          "update"
        );

        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || "You do not have permission to update leads"
          });
        }
      }
    }

    // Update fields if provided
    if (name !== undefined) lead.name = name;
    if (phone !== undefined) lead.phone = phone;
    if (email !== undefined) lead.email = email;

    await lead.save();

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}
