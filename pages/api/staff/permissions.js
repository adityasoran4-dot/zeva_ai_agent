// pages/api/staff/permissions.js
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in staff member
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Verify user is a staff member
    if (!['staff', 'doctorStaff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Staff role required' });
    }

    // Get staff permissions (staff permissions are stored in AgentPermission model)
    const permissions = await AgentPermission.findOne({ 
      agentId: me._id,
      isActive: true 
    }).populate('grantedBy', 'name email');
    
    return res.status(200).json({ 
      success: true, 
      data: permissions || null 
    });
  } catch (error) {
    console.error('Error fetching staff permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

