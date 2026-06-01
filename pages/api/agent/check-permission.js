// pages/api/agent/check-permission.js
// API endpoint to check if an agent has permission for a specific module/submodule and action
import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission, getAgentModulePermissions } from "./permissions-helper";

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

    const { moduleKey, action, subModuleName } = req.query;

    if (!moduleKey || !action) {
      return res.status(400).json({ 
        success: false, 
        message: 'moduleKey and action are required' 
      });
    }

    // Check permission
    const { hasPermission, error } = await checkAgentPermission(
      me._id,
      moduleKey,
      action,
      subModuleName || null
    );

    return res.status(200).json({
      success: true,
      hasPermission,
      error: error || null,
      agentId: me._id.toString(),
      moduleKey,
      action,
      subModuleName: subModuleName || null
    });

  } catch (error) {
    // console.error('Error checking agent permission:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

