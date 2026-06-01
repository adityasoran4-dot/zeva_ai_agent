// pages/api/agent/sidebar-permissions.js
// Returns navigation items for agent sidebar based on permissions granted by admin/clinic/doctor
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
import User from "../../../models/Users";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq } from "../lead-ms/auth";

const formatSlugSegment = (segment = "") =>
  segment
    .split("/")
    .filter(Boolean)
    .join("-")
    .replace(/--+/g, "-");

const convertPathToStaff = (path = "", navigationRole = "clinic") => {
  if (!path) return path;
  const trimmed = path.replace(/^\/+/, "");

  if (trimmed.startsWith("staff/")) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith("clinic/")) {
    const relative = trimmed.slice("clinic/".length);
    return `/staff/clinic-${formatSlugSegment(relative)}`;
  }

  if (trimmed.startsWith("doctor/")) {
    const relative = trimmed.slice("doctor/".length);
    return `/staff/doctor-${formatSlugSegment(relative)}`;
  }

  if (trimmed.startsWith("agent/")) {
    const relative = trimmed.slice("agent/".length);
    return `/staff/${formatSlugSegment(relative)}`;
  }

  if (trimmed.startsWith("admin/")) {
    const relative = trimmed.slice("admin/".length);
    return `/staff/${formatSlugSegment(relative)}`;
  }

  return `/staff/${formatSlugSegment(trimmed)}`;
};

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

    // Handle different user roles accessing the agent portal
    // If user is clinic/doctor/admin, return their navigation items directly
    if (['clinic', 'doctor', 'admin'].includes(me.role)) {
      const navigationRole = me.role;
      
      // Get navigation items for the user's role
      const navigationItems = await ClinicNavigationItem.find({ 
        role: navigationRole, 
        isActive: true 
      }).sort({ order: 1 });

      // Convert paths to staff routes
      const convertedItems = navigationItems.map(item => ({
        _id: item._id,
        label: item.label,
        path: item.path ? convertPathToStaff(item.path, navigationRole) : null,
        icon: item.icon,
        description: item.description,
        order: item.order,
        moduleKey: item.moduleKey,
        subModules: (item.subModules || []).map(subModule => ({
          name: subModule.name,
          path: subModule.path ? convertPathToStaff(subModule.path, navigationRole) : '',
          icon: subModule.icon,
          order: subModule.order
        }))
      }));

      return res.status(200).json({
        success: true,
        permissions: null, // Clinic/doctor/admin users don't need agent permissions
        navigationItems: convertedItems,
        navigationRole,
        agentId: me._id.toString()
      });
    }

    // Verify user is an agent or doctorStaff for agent permission logic
    if (!['agent', 'doctorStaff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Agent role required' });
    }

    // Get agent permissions
    const agentPermission = await AgentPermission.findOne({ agentId: me._id });
    
    // Determine which role's navigation items to show based on who created the agent
    // Priority: 1. Check who created the agent, 2. Default to 'clinic'
    let navigationRole = 'clinic'; // default
    
    if (me.createdBy) {
      const creator = await User.findById(me.createdBy).select('role');
      if (creator) {
        if (creator.role === 'admin') {
          navigationRole = 'admin';
        } else if (creator.role === 'clinic') {
          navigationRole = 'clinic';
        } else if (creator.role === 'doctor') {
          navigationRole = 'doctor';
        }
      }
    }

    // Get navigation items for the determined role (these are the modules from creator's dashboard)
    const navigationItems = await ClinicNavigationItem.find({ 
      role: navigationRole, 
      isActive: true 
    }).sort({ order: 1 });

    // If no permissions exist, return empty array (agent sees nothing until permissions are granted)
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return res.status(200).json({
        success: true,
        permissions: null,
        navigationItems: [], // No permissions = no sidebar items
        navigationRole
      });
    }

    // Build permission map for quick lookup
    // Handle both with and without role prefix in moduleKey
    const permissionMap = {};
    agentPermission.permissions.forEach(perm => {
      const moduleKey = perm.module;
      // Remove role prefix if present (e.g., "admin_dashboard" -> "dashboard")
      const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor)_/, '');
      const moduleKeyWithPrefix = `${navigationRole}_${moduleKeyWithoutPrefix}`;
      
      const permissionData = {
        moduleActions: perm.actions,
        subModules: {}
      };
      
      // Store with both keys for flexible lookup
      permissionMap[moduleKey] = permissionData;
      permissionMap[moduleKeyWithoutPrefix] = permissionData;
      permissionMap[moduleKeyWithPrefix] = permissionData;
      
      if (perm.subModules && perm.subModules.length > 0) {
        perm.subModules.forEach(subModule => {
          permissionData.subModules[subModule.name] = subModule.actions;
        });
      }
    });

    // Filter navigation items based on permissions
    // Show module if agent has ANY permission at module level OR any submodule has permissions
    // Only hide module if NO permissions are granted at module level AND no submodules have permissions
    const filteredNavigationItems = navigationItems
      .map(item => {
        // Try multiple lookup strategies for moduleKey matching
        // item.moduleKey from DB is like "clinic_marketing", permission might be stored as "marketing" or "clinic_marketing"
        const moduleKeyWithoutRole = item.moduleKey.replace(/^(admin|clinic|doctor)_/, '');
        const moduleKeyWithRole = `${navigationRole}_${moduleKeyWithoutRole}`;
        
        const modulePerm = permissionMap[item.moduleKey] || 
                          permissionMap[moduleKeyWithoutRole] ||
                          permissionMap[moduleKeyWithRole] ||
                          permissionMap[item.moduleKey.replace(`${navigationRole}_`, '')];
        
        // Check if module has ANY permission at module level
        const hasModulePermission = modulePerm && (
          modulePerm.moduleActions.all === true ||
          modulePerm.moduleActions.create === true ||
          modulePerm.moduleActions.read === true ||
          modulePerm.moduleActions.update === true ||
          modulePerm.moduleActions.delete === true ||
          modulePerm.moduleActions.approve === true ||
          modulePerm.moduleActions.print === true ||
          modulePerm.moduleActions.export === true
        );

        // Check if module-level "all" is enabled
        const moduleAllEnabled = modulePerm && modulePerm.moduleActions.all === true;

        // Filter submodules based on permissions
        // Only show submodules that the agent has explicit permission for
        let filteredSubModules = [];
        if (item.subModules && item.subModules.length > 0) {
          filteredSubModules = item.subModules
            .map(subModule => {
              // Handle Mongoose documents - convert to plain object if needed
              const subModuleObj = subModule.toObject ? subModule.toObject() : subModule;
              return subModuleObj;
            })
            .filter(subModule => {
              // Get submodule name (handle both plain objects and Mongoose documents)
              const subModuleName = subModule.name || subModule._doc?.name;
              if (!subModuleName) return false;
              
              // ✅ CRITICAL FIX: If module-level "all" is true, show ALL submodules
              if (moduleAllEnabled) {
                return true; // Show all submodules when module-level "all" is enabled
              }
              
              // Otherwise, check if submodule has ANY permission
              const subModulePerm = modulePerm?.subModules[subModuleName];
              return subModulePerm && (
                subModulePerm.all === true ||
                subModulePerm.create === true ||
                subModulePerm.read === true ||
                subModulePerm.update === true ||
                subModulePerm.delete === true ||
                subModulePerm.approve === true ||
                subModulePerm.print === true ||
                subModulePerm.export === true
              );
            });
        }

        // ✅ CRITICAL FIX: Show module if EITHER:
        // 1. Module has any permission, OR
        // 2. Any submodule has permissions (even if module doesn't)
        const hasAnySubModulePermission = filteredSubModules.length > 0;
        const shouldShowModule = hasModulePermission || hasAnySubModulePermission;

        if (!shouldShowModule) {
          return null; // Don't show this module if no permissions are granted at module or submodule level
        }

        // Convert path from admin/clinic/doctor/staff routes to staff routes
        const staffPath = item.path ? convertPathToStaff(item.path, navigationRole) : null;

        // Convert submodule paths as well
        const convertedSubModules = filteredSubModules.map(subModule => {
          // Handle Mongoose documents - get path from _doc if needed
          const subModulePath = subModule.path || subModule._doc?.path || '';
          const subModuleName = subModule.name || subModule._doc?.name || '';
          const subModuleIcon = subModule.icon || subModule._doc?.icon || '';
          const subModuleOrder = subModule.order || subModule._doc?.order || 0;
          
          return {
            name: subModuleName,
            path: subModulePath ? convertPathToStaff(subModulePath, navigationRole) : '',
            icon: subModuleIcon,
            order: subModuleOrder
          };
        });

        // modulePerm is already defined above (line 96), reuse it here
        return {
          _id: item._id,
          label: item.label,
          path: staffPath, // Converted to staff route
          icon: item.icon,
          description: item.description,
          order: item.order,
          moduleKey: item.moduleKey,
          subModules: convertedSubModules.map(subModule => {
            // Add permission details to each submodule
            const subModulePerm = modulePerm?.subModules[subModule.name];
            return {
              ...subModule,
              permissions: subModulePerm || null
            };
          }),
          // Add module-level permissions
          permissions: modulePerm?.moduleActions || null
        };
      })
      .filter(item => item !== null); // Remove null items

    return res.status(200).json({
      success: true,
      permissions: agentPermission.permissions,
      navigationItems: filteredNavigationItems,
      navigationRole,
      agentId: me._id.toString()
    });

  } catch (error) {
    // console.error('Error fetching agent sidebar permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}