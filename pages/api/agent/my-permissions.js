// pages/api/agent/my-permissions.js
// Returns permissions for the logged-in agent
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in agent
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Verify user is an agent
    if (!['agent', 'doctorStaff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Agent role required' });
    }

    // Get agent permissions
    const agentPermission = await AgentPermission.findOne({ agentId: me._id });
    
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: {
          permissions: [],
          hasPermissions: false
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        permissions: agentPermission.permissions,
        hasPermissions: true
      }
    });

  } catch (error) {
    // console.error('Error fetching agent permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

