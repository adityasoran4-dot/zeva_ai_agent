// pages/api/agent/get-module-permissions.js
// API endpoint to get full permission details for a specific module
import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { getAgentModulePermissions } from "./permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    const { moduleKey } = req.query;

    if (!moduleKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'moduleKey is required' 
      });
    }

    // If user is clinic/doctor/admin, return full permissions (they own the modules)
    if (['clinic', 'doctor', 'admin'].includes(me.role)) {
      return res.status(200).json({
        success: true,
        permissions: {
          module: moduleKey,
          actions: {
            all: true,
            create: true,
            read: true,
            update: true,
            delete: true,
            approve: true,
            print: true,
            export: true
          },
          subModules: []
        },
        error: null,
        agentId: me._id.toString(),
        moduleKey
      });
    }

    // Verify user is an agent, doctorStaff, or staff for agent permission logic
    if (!['agent', 'doctorStaff', 'staff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Agent/Staff role required' });
    }

    // Get module permissions for agents
    const { permissions, error } = await getAgentModulePermissions(
      me._id,
      moduleKey
    );

    if (error) {
      return res.status(200).json({
        success: true,
        permissions: null,
        error,
        agentId: me._id.toString(),
        moduleKey
      });
    }

    // Normalize actions to ensure booleans for all flags
    const actions = permissions.actions || {};
    const toBool = (value) => {
      if (value === true || value === false) return value;
      if (typeof value === "string") {
        const lowered = value.toLowerCase();
        return lowered === "true" || lowered === "1" || lowered === "yes";
      }
      return Boolean(value);
    };

    const normalizedActions = {
      all: toBool(actions.all),
      create: toBool(actions.create),
      read: toBool(actions.read),
      update: toBool(actions.update),
      delete: toBool(actions.delete),
      print: toBool(actions.print),
      export: toBool(actions.export),
      approve: toBool(actions.approve),
    };

    return res.status(200).json({
      success: true,
      permissions: {
        module: permissions.module,
        actions: normalizedActions,
        subModules: permissions.subModules || []
      },
      error: null,
      agentId: me._id.toString(),
      moduleKey
    });

  } catch (error) {
    // console.error('Error getting agent module permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

