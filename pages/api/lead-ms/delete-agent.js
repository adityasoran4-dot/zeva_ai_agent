import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    const { agentId } = req.body || {};
    if (!agentId) {
      return res.status(400).json({ success: false, message: "agentId is required" });
    }

    const targetUser = await User.findById(agentId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Agent not found" });
    }

    if (!["agent", "doctorStaff"].includes(targetUser.role)) {
      return res.status(400).json({ success: false, message: "Only agents or doctor staff can be deleted via this endpoint" });
    }

    let clinicContextId = null;

    if (me.role === "admin") {
      clinicContextId = null;
    } else if (me.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res.status(400).json({ success: false, message: "Clinic not found for this user" });
      }
      clinicContextId = clinic._id;

      const { hasPermission, error } = await checkClinicPermission(clinic._id, "create_agent", "delete");
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: error || "You do not have permission to delete agents" });
      }
    } else if (me.role === "doctor") {
      clinicContextId = me.clinicId || null;
      if (!clinicContextId) {
        return res.status(403).json({ success: false, message: "You are not associated with any clinic" });
      }
      // Doctors share clinic-level permissions
      const { hasPermission, error } = await checkClinicPermission(clinicContextId, "create_agent", "delete", null, "doctor");
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: error || "You do not have permission to delete agents" });
      }
    } else if (me.role === "agent") {
      // For agent role (agentToken): Check agent permissions
      clinicContextId = me.clinicId || null;
      if (!clinicContextId) {
        return res.status(403).json({ success: false, message: "You are not associated with any clinic" });
      }
      const { hasPermission, error } = await checkAgentPermission(me._id, "create_agent", "delete");
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: error || "You do not have permission to delete agents" });
      }
    } else if (me.role === "doctorStaff") {
      // For doctorStaff role (userToken): Check agent permissions
      clinicContextId = me.clinicId || null;
      if (!clinicContextId) {
        return res.status(403).json({ success: false, message: "You are not associated with any clinic" });
      }
      const { hasPermission, error } = await checkAgentPermission(me._id, "create_agent", "delete");
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: error || "You do not have permission to delete agents" });
      }
    } else {
      return res.status(403).json({ success: false, message: "You do not have permission to delete agents" });
    }

    if (clinicContextId && targetUser.clinicId && targetUser.clinicId.toString() !== clinicContextId.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete agents associated with your clinic" });
    }

    await targetUser.deleteOne();

    return res.status(200).json({
      success: true,
      message: `${targetUser.role === "doctorStaff" ? "Doctor staff" : "Agent"} deleted successfully`,
      deletedUser: {
        _id: targetUser._id,
        role: targetUser.role,
        clinicId: targetUser.clinicId || null,
        email: targetUser.email,
        name: targetUser.name,
      },
    });
  } catch (error) {
    // console.error("Error deleting agent:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

