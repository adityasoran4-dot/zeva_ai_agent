// pages/api/navigation/get-by-role.js
import dbConnect from "../../../lib/database";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import User from "../../../models/Users";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Allow admin, clinic, doctor, agent, and doctorStaff roles
  if (!requireRole(me, ['admin', 'clinic', 'doctor', 'agent', 'doctorStaff'])) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const { role } = req.query;

    // Validate desired navigation role (only admin/clinic/doctor supported)
    if (!role || !['admin', 'clinic', 'doctor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin, clinic, or doctor'
      });
    }

    // Verify user has permission to view this role's navigation
    // Admin can view any role, clinic can only view clinic, doctor only doctor, agent/doctorStaff only clinic (if linked)
    if (me.role === 'clinic' && role !== 'clinic') {
      return res.status(403).json({
        success: false,
        message: 'Clinic users can only view clinic navigation items'
      });
    }
    if (me.role === 'doctor' && role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Doctor users can only view doctor navigation items'
      });
    }
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      if (role !== 'clinic') {
        return res.status(403).json({
          success: false,
          message: 'Agent/doctorStaff users can only view clinic navigation items'
        });
      }
      // Check if agent/doctorStaff is linked to a clinic
      const agentUser = await User.findById(me._id).select('clinicId createdBy');
      if (!agentUser?.clinicId && !agentUser?.createdBy) {
        return res.status(403).json({
          success: false,
          message: 'Agent/doctorStaff is not linked to any clinic'
        });
      }
      // If createdBy exists, check if creator is clinic/doctor/admin
      if (agentUser.createdBy && !agentUser.clinicId) {
        const creator = await User.findById(agentUser.createdBy).select('role');
        if (creator && ['clinic', 'doctor', 'admin'].includes(creator.role)) {
          // Allow access - agent was created by clinic/doctor/admin
        } else {
          return res.status(403).json({
            success: false,
            message: 'Agent/doctorStaff is not properly linked'
          });
        }
      }
    }

    // Fetch navigation items for this role
    const items = await ClinicNavigationItem.find({ 
      role: role, 
      isActive: true 
    }).sort({ order: 1 });

    return res.status(200).json({ 
      success: true, 
      data: items,
      count: items.length
    });
  } catch (error) {
    // console.error('Error fetching navigation items:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

