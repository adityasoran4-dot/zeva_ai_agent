import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import {checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  if (!me) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  // ✅ Check permissions for creating agents (admin bypasses all checks)
  if (me.role !== 'admin') {
    // For clinic role: Check clinic permissions
    if (me.role === 'clinic') {
      const clinic = await Clinic.findOne({ owner: me._id });
      if (clinic) {
        const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
          clinic._id,
          "create_agent",
          "create"
        );
        if (!clinicHasPermission) {
          return res.status(403).json({
            success: false,
            message: clinicError || "You do not have permission to create agents"
          });
        }
      }
    }
    // For agent role (agentToken): Check agent permissions
    else if (me.role === 'agent') {
      const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
        me._id,
        "create_agent",
        "create"
      );
      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to create agents"
        });
      }
    }
    // For doctorStaff role (userToken): Check agent permissions
    else if (me.role === 'doctorStaff') {
      const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
        me._id,
        "create_agent",
        "create"
      );
      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to create agents"
        });
      }
    }
  }

  // Debug: Log who is creating
  // console.log('CREATE Agent - Current User:', { 
  //   role: me.role, 
  //   _id: me._id.toString(),
  //   email: me.email 
  // });

  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields: name, email, password, and role are required" });
  }

  // Validate role
  if (!["agent", "doctorStaff"].includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid role. Allowed roles: agent, doctorStaff" 
    });
  }

  try {
    // For agent creation: Allow admin, clinic, doctor, and agent roles
    // For doctorStaff creation: Allow admin, clinic, doctor, agent, and doctorStaff roles (permission checks already done above)
    // console.log('CREATE Agent - Role Check:', { 
    //   creatingRole: role, 
    //   currentUserRole: me.role,
    //   currentUserId: me._id.toString()
    // });
    
    if (role === "agent") {
      if (!requireRole(me, ["admin", "clinic", "doctor", "agent"])) {
        // console.log('CREATE Agent - Access denied for agent creation:', me.role);
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    } else if (role === "doctorStaff") {
      // Allow admin, clinic, doctor, agent, and doctorStaff roles
      // Permission checks for agent and doctorStaff are already done above (lines 43-69)
      const allowedRoles = ["admin", "clinic", "doctor", "agent", "doctorStaff"];
      const hasRole = requireRole(me, allowedRoles);
      // console.log('CREATE Agent - doctorStaff creation check:', { 
      //   currentUserRole: me.role, 
      //   allowedRoles, 
      //   hasRole 
      // });
      
      if (!hasRole) {
        // console.log('CREATE Agent - Access denied for doctorStaff creation:', { 
        //   currentUserRole: me.role, 
        //   allowedRoles 
        // });
        return res.status(403).json({ 
          success: false, 
          message: "Access denied. Admin, clinic, doctor, agent, or doctorStaff only for doctorStaff creation" 
        });
      }
    }

    let clinicId = null;
    
    // Find clinic based on role - IMPORTANT: Set clinicId for clinic/doctor/agent roles
    if (me.role === "clinic") {
      // Clinic creating agent or doctorStaff - find their clinic
      const clinic = await Clinic.findOne({ owner: me._id });
      if (!clinic) {
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
      // For agents created by clinic, set clinicId. For doctorStaff, we can optionally set it too
      if (role === "agent") {
        // Agent must have clinicId
      } else if (role === "doctorStaff") {
        // doctorStaff can optionally have clinicId (to track which clinic they belong to)
        // Setting it helps with filtering
      }
    } else if (me.role === "agent") {
      // Agent creating another agent or doctorStaff - use their clinicId
      clinicId = me.clinicId;
      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this agent" });
      }
      // Agents can create both agents and doctorStaff (permission checks already done above)
    } else if (me.role === "doctorStaff") {
      // doctorStaff creating another doctorStaff or agent - use their clinicId
      clinicId = me.clinicId;
      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "Clinic not found for this doctorStaff" });
      }
      // doctorStaff can create both agents and doctorStaff (permission checks already done above)
    } else if (me.role === "doctor") {
      // Doctor creating agent or doctorStaff - use their clinicId if they have one
      clinicId = me.clinicId || null;
      // If doctor has clinicId, use it. Otherwise, clinicId remains null
    } else if (me.role === "admin") {
      // Admin creating agent or doctorStaff - clinicId is null (not tied to any clinic)
      clinicId = null;
    }

    // Check if user already exists with this email and role
    const existingQuery = { email, role };
    if (role === "agent" && clinicId) {
      existingQuery.clinicId = clinicId;
    } else if (role === "agent" && !clinicId) {
      // For admin-created agents (no clinicId), check for agents with null/undefined clinicId
      existingQuery.$or = [
        { clinicId: null },
        { clinicId: { $exists: false } }
      ];
    }
    
    const existing = await User.findOne(existingQuery);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${role} with this email already exists${role === "agent" && clinicId ? " for this clinic" : ""}`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (agent or doctorStaff)
    const userData = {
      name,
      email,
      phone: phone || undefined,
      password: hashedPassword,
      role,
      createdBy: me._id, // ✅ Store who created this user
      isApproved: true,
      declined: false,
    };
    
    // Set clinicId based on role and creator
    if (role === "agent") {
      // Agents should have clinicId if created by clinic, doctor, or agent
      // Admin-created agents have clinicId as null
      if (clinicId) {
        userData.clinicId = clinicId;
      }
    } else if (role === "doctorStaff") {
      // doctorStaff can optionally have clinicId to track which clinic they belong to
      // This helps with filtering in dashboards
      if (clinicId) {
        userData.clinicId = clinicId;
      }
      // If clinicId is null (admin-created), that's fine too
    }

    // Debug: Log what we're creating
    // console.log('CREATE Agent - User Data:', {
    //   role: userData.role,
    //   clinicId: userData.clinicId?.toString() || null,
    //   createdBy: userData.createdBy.toString()
    // });

    const user = await User.create(userData);

    // Debug: Log what was actually created
    // console.log('CREATE Agent - Created User:', {
    //   _id: user._id.toString(),
    //   role: user.role,
    //   clinicId: user.clinicId?.toString() || null,
    //   createdBy: user.createdBy?.toString() || null
    // });

    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        clinicId: user.clinicId || null,
        createdBy: user.createdBy || null, // Add createdBy to response for debugging
      },
    });
  } catch (err) {
    // console.error("Error creating user:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
