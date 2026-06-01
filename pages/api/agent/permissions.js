// pages/api/agent/permissions.js
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
import User from "../../../models/Users";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Allow admin, clinic, doctor, staff, doctorStaff, and agent roles
  if (!requireRole(me, ['admin', 'clinic', 'doctor', 'staff', 'doctorStaff', 'agent'])) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (req.method === 'GET') {
    try {
      const { agentId } = req.query;
      
      if (!agentId) {
        return res.status(400).json({ success: false, message: 'Agent ID is required' });
      }

      // Verify agent exists and user has permission to view it
      const agent = await User.findById(agentId);
      if (!agent || !['agent', 'doctorStaff'].includes(agent.role)) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }

      // Check if user has permission to view this agent's permissions
      if (me.role === 'admin') {
        // Admin can only view agents they created
        if (agent.createdBy?.toString() !== me._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      } else if (me.role === 'clinic') {
        // Clinic can view agents from their clinic or agents they created
        const Clinic = (await import("../../../models/Clinic")).default;
        const clinic = await Clinic.findOne({ owner: me._id });
        if (clinic) {
          if (agent.clinicId?.toString() !== clinic._id.toString() && 
              agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        } else {
          if (agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (me.role === 'doctor') {
        // Doctor can view agents from their clinic or agents they created
        if (me.clinicId) {
          if (agent.clinicId?.toString() !== me.clinicId.toString() && 
              agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        } else {
          if (agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (me.role === 'staff' || me.role === 'doctorStaff') {
        // Staff and doctorStaff can view agents from their clinic or agents they created
        if (me.clinicId) {
          if (agent.clinicId?.toString() !== me.clinicId.toString() && 
              agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        } else {
          if (agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (me.role === 'agent') {
        // Agents can view only their own permissions
        if (agent._id.toString() !== me._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      }

      // Get agent permissions
      const permissions = await AgentPermission.findOne({ agentId }).populate('grantedBy', 'name email');
      
      return res.status(200).json({ 
        success: true, 
        data: permissions || null 
      });
    } catch (error) {
      // console.error('Error fetching agent permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { agentId, permissions } = req.body;

      if (!agentId) {
        return res.status(400).json({ success: false, message: 'Agent ID is required' });
      }

      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions array is required' });
      }

      // Verify agent exists and user has permission to modify it
      const agent = await User.findById(agentId);
      if (!agent || !['agent', 'doctorStaff'].includes(agent.role)) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }

      // Check if user has permission to modify this agent's permissions
      if (me.role === 'admin') {
        // Admin can only modify agents they created
        if (agent.createdBy?.toString() !== me._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      } else if (me.role === 'clinic') {
        // Clinic can modify agents from their clinic or agents they created
        const Clinic = (await import("../../../models/Clinic")).default;
        const clinic = await Clinic.findOne({ owner: me._id });
        if (clinic) {
          if (agent.clinicId?.toString() !== clinic._id.toString() && 
              agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        } else {
          if (agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (me.role === 'doctor') {
        // Doctor can modify agents from their clinic or agents they created
        if (me.clinicId) {
          if (agent.clinicId?.toString() !== me.clinicId.toString() && 
              agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        } else {
          if (agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (me.role === 'staff' || me.role === 'doctorStaff') {
        // Staff and doctorStaff can modify agents from their clinic or agents they created
        if (me.clinicId) {
          if (agent.clinicId?.toString() !== me.clinicId.toString() && 
              agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        } else {
          if (agent.createdBy?.toString() !== me._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (me.role === 'agent') {
        // Agents cannot modify other agents; allow only self-update
        if (agent._id.toString() !== me._id.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      }

      // Validate permissions structure
      for (const perm of permissions) {
        if (!perm.module) {
          return res.status(400).json({ success: false, message: 'Each permission must have a module' });
        }
        if (!perm.actions || typeof perm.actions !== 'object') {
          return res.status(400).json({ success: false, message: 'Each permission must have actions object' });
        }
        if (perm.subModules && !Array.isArray(perm.subModules)) {
          return res.status(400).json({ success: false, message: 'subModules must be an array' });
        }
      }

      // Create or update agent permissions
      const agentPermission = await AgentPermission.findOneAndUpdate(
        { agentId },
        {
          agentId,
          permissions,
          grantedBy: me._id,
          lastModified: new Date(),
          isActive: true
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Agent permissions updated successfully',
        data: agentPermission 
      });
    } catch (error) {
      // console.error('Error updating agent permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}


