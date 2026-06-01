// pages/api/agents/getA.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";  
import { getUserFromReq, requireRole } from "./auth";
import { checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  // ✅ Allow admin, clinic, agent, doctor, or doctorStaff
  if (!requireRole(user, ["admin", "clinic", "agent", "doctor", "doctorStaff", "staff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ✅ Check permissions for reading agents (admin bypasses all checks)
  if (user.role !== 'admin') {
    // For clinic role: Check clinic permissions
    if (user.role === 'clinic') {
      const clinic = await Clinic.findOne({ owner: user._id });
      if (clinic) {
        const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
          clinic._id,
          "create_agent",
          "read"
        );
        if (!clinicHasPermission) {
          return res.status(403).json({
            success: false,
            message: clinicError || "You do not have permission to view agents"
          });
        }
      }
    }
    // For agent role (agentToken): Check agent permissions
    else if (user.role === 'agent') {
      const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
        user._id,
        "create_agent",
        "read"
      );
      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to view agents"
        });
      }
    }
    // For doctorStaff role (userToken): Check agent permissions
    else if (user.role === 'doctorStaff') {
      const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
        user._id,
        "create_agent",
        "read"
      );
      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to view agents"
        });
      }
    }
  }

  if (req.method === "GET") {
    try {
      let query = { role: "agent", isApproved: true };

      if (user.role === "clinic") {
        // Fetch agents only from this clinic
        const clinic = await Clinic.findOne({ owner: user._id }).select("_id");
        if (!clinic) {
          return res.status(400).json({ success: false, message: "Clinic not found for this user" });
        }
        query.clinicId = clinic._id;
      } else if (user.role === "agent") {
        // Agents can see other agents in their clinic
        if (!user.clinicId) {
          return res.status(403).json({ success: false, message: "Agent not linked to any clinic" });
        }
        query.clinicId = user.clinicId;
        // Optionally exclude self from results if needed:
        // query._id = { $ne: user._id };
      } else if (user.role === "doctor") {
        // Doctors can see agents from their clinic or all agents if no clinic linked
        if (user.clinicId) {
          query.clinicId = user.clinicId;
        }
        // If no clinicId, doctor can see all agents (admin-like access)
      } else if (user.role === "doctorStaff" || user.role === "staff") {
        // DoctorStaff/Staff can see agents from their clinic
        if (!user.clinicId) {
          return res.status(403).json({ success: false, message: "Staff not linked to any clinic" });
        }
        query.clinicId = user.clinicId;
      }

      const agents = await User.find(query).select("_id name email clinicId");

      return res.status(200).json({ success: true, agents });
    } catch (err) {
      // console.error("Error fetching agents:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch agents" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
