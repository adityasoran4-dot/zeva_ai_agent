// pages/api/lead-ms/lead-delete.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import { getUserFromReq, requireRole } from "./auth";
import Clinic from "../../../models/Clinic";
import { checkAgentPermission } from "../agent/permissions-helper";
import Segment from "../../../models/Segment";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { leadId } = req.body;
    if (!leadId) {
      return res
        .status(400)
        .json({ success: false, message: "leadId is required" });
    }

    // ✅ First, get the lead to determine which clinic it belongs to
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Determine the clinic for the user
    let clinic;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id });
      // Ensure the lead belongs to this clinic
      if (lead.clinicId.toString() !== clinic._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Agent not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
      // Ensure the lead belongs to this clinic
      if (lead.clinicId.toString() !== clinic._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "doctor") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Doctor not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
      // Ensure the lead belongs to this clinic
      if (lead.clinicId.toString() !== clinic._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed to access this lead" });
      }
    } else if (me.role === "admin") {
      // Admin can delete any lead
      clinic = await Clinic.findById(lead.clinicId);
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
    }

    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found for this user" });
    }

    // ✅ Check permission for deleting leads (only for clinic, agent, and doctor; admin bypasses)
    if (me.role !== "admin") {
      // First check if clinic has delete permission for "create_lead" module
      const { checkClinicPermission } = await import("./permissions-helper");
      const { hasPermission: clinicHasPermission, error: clinicError } =
        await checkClinicPermission(
          clinic._id,
          "create_lead", // Check "create_lead" module permission
          "delete",
          null, // No submodule - this is a module-level check
          me.role === "doctor"
            ? "doctor"
            : me.role === "clinic"
            ? "clinic"
            : null
        );

      if (!clinicHasPermission) {
        return res.status(403).json({
          success: false,
          message: clinicError || "You do not have permission to delete leads",
        });
      }

      // If user is an agent, also check agent-specific permissions
      if (me.role === "agent") {
        const { hasPermission: agentHasPermission, error: agentError } =
          await checkAgentPermission(
            me._id,
            "create_lead", // Check "create_lead" module permission
            "delete",
            null // No submodule
          );

        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || "You do not have permission to delete leads",
          });
        }
      }
    }

    // ✅ Remove lead from all segments before deleting
    // This is important to maintain data integrity
    const segmentsUpdateResult = await Segment.updateMany(
      {
        clinicId: clinic._id,
        leads: leadId,
      },
      {
        $pull: { leads: leadId },
      }
    );

    // Delete the lead only if it belongs to the user's clinic
    const deletedLead = await Lead.findOneAndDelete({
      _id: leadId,
      clinicId: clinic._id,
    });

    if (!deletedLead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found or not authorized" });
    }

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
      lead: deletedLead,
      segmentsUpdated: segmentsUpdateResult.modifiedCount,
    });
  } catch (err) {
    // console.error("Error deleting Lead:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
