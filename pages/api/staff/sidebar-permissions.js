// pages/api/staff/sidebar-permissions.js
// Returns navigation items for staff sidebar based on who created the staff member
// Similar to agent sidebar permissions, but for staff roles (staff, doctorStaff)
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import AgentPermission from "../../../models/AgentPermission";
import { getUserFromReq } from "../lead-ms/auth";

// Helper function to format slug segment (same as agent sidebar)
const formatSlugSegment = (segment = "") =>
  segment
    .split("/")
    .filter(Boolean)
    .join("-")
    .replace(/--+/g, "-");

// Helper function to convert path to agent format (same as agent sidebar)
const convertPathToAgent = (path = "", navigationRole = "clinic") => {
  if (!path) return path;
  const trimmed = path.replace(/^\/+/, "");

  if (trimmed.startsWith("agent/")) {
    return `/${trimmed}`;
  }

  if (trimmed.startsWith("clinic/")) {
    const relative = trimmed.slice("clinic/".length);
    return `/agent/clinic-${formatSlugSegment(relative)}`;
  }

  if (trimmed.startsWith("doctor/")) {
    const relative = trimmed.slice("doctor/".length);
    return `/agent/doctor-${formatSlugSegment(relative)}`;
  }

  if (trimmed.startsWith("staff/")) {
    const relative = trimmed.slice("staff/".length);
    const prefix = navigationRole === "doctor" ? "doctor-staff" : "clinic-staff";
    return `/agent/${prefix}-${formatSlugSegment(relative)}`;
  }

  if (trimmed.startsWith("admin/")) {
    const relative = trimmed.slice("admin/".length);
    return `/agent/${formatSlugSegment(relative)}`;
  }

  return `/agent/${formatSlugSegment(trimmed)}`;
};

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

    // Determine which role's navigation items to show based on who created the staff member
    // Priority: 1. Check who created the staff, 2. Default to 'clinic'
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

    // Get staff permissions (stored in AgentPermission model, same as agent)
    const staffPermission = await AgentPermission.findOne({ agentId: me._id });

    // For doctorStaff role, use same path conversion as agent sidebar (convert to /agent/clinic-* format)
    // For staff role, keep existing behavior
    if (me.role === 'doctorStaff') {
      // If no permissions exist, return empty array (doctorStaff sees nothing until permissions are granted)
      if (!staffPermission || !staffPermission.permissions || staffPermission.permissions.length === 0) {
        return res.status(200).json({
          success: true,
          permissions: null,
          navigationItems: [], // No permissions = no sidebar items
          navigationRole,
          staffId: me._id.toString()
        });
      }

      // Build permission map for quick lookup (same logic as agent sidebar)
      const permissionMap = {};
      staffPermission.permissions.forEach(perm => {
        const moduleKey = perm.module;
        const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor)_/, '');
        const moduleKeyWithPrefix = `${navigationRole}_${moduleKeyWithoutPrefix}`;
        
        const permissionData = {
          moduleActions: perm.actions,
          subModules: {}
        };
        
        permissionMap[moduleKey] = permissionData;
        permissionMap[moduleKeyWithoutPrefix] = permissionData;
        permissionMap[moduleKeyWithPrefix] = permissionData;
        
        if (perm.subModules && perm.subModules.length > 0) {
          perm.subModules.forEach(subModule => {
            permissionData.subModules[subModule.name] = subModule.actions;
          });
        }
      });

      // Filter navigation items based on permissions (same logic as agent sidebar)
      const filteredNavigationItems = navigationItems
        .map(item => {
          const moduleKeyWithoutRole = item.moduleKey.replace(/^(admin|clinic|doctor)_/, '');
          const moduleKeyWithRole = `${navigationRole}_${moduleKeyWithoutRole}`;
          
          const modulePerm = permissionMap[item.moduleKey] || 
                            permissionMap[moduleKeyWithoutRole] ||
                            permissionMap[moduleKeyWithRole] ||
                            permissionMap[item.moduleKey.replace(`${navigationRole}_`, '')];
          
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

          const moduleAllEnabled = modulePerm && modulePerm.moduleActions.all === true;

          let filteredSubModules = [];
          if (item.subModules && item.subModules.length > 0) {
            filteredSubModules = item.subModules
              .map(subModule => {
                const subModuleObj = subModule.toObject ? subModule.toObject() : subModule;
                return subModuleObj;
              })
              .filter(subModule => {
                const subModuleName = subModule.name || subModule._doc?.name;
                if (!subModuleName) return false;
                
                if (moduleAllEnabled) {
                  return true;
                }
                
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

          const hasAnySubModulePermission = filteredSubModules.length > 0;
          const shouldShowModule = hasModulePermission || hasAnySubModulePermission;

          if (!shouldShowModule) {
            return null;
          }

          // Convert path to agent format (same as agent sidebar)
          const agentPath = item.path ? convertPathToAgent(item.path, navigationRole) : null;

          const convertedSubModules = filteredSubModules.map(subModule => {
            const subModulePath = subModule.path || subModule._doc?.path || '';
            const subModuleName = subModule.name || subModule._doc?.name || '';
            const subModuleIcon = subModule.icon || subModule._doc?.icon || '';
            const subModuleOrder = subModule.order || subModule._doc?.order || 0;
            
            return {
              name: subModuleName,
              path: subModulePath ? convertPathToAgent(subModulePath, navigationRole) : '',
              icon: subModuleIcon,
              order: subModuleOrder
            };
          });

          return {
            _id: item._id,
            label: item.label,
            path: agentPath, // Converted to agent route format
            icon: item.icon,
            description: item.description,
            order: item.order,
            moduleKey: item.moduleKey,
            subModules: convertedSubModules.map(subModule => {
              const subModulePerm = modulePerm?.subModules[subModule.name];
              return {
                ...subModule,
                permissions: subModulePerm || null
              };
            }),
            permissions: modulePerm?.moduleActions || null
          };
        })
        .filter(item => item !== null);

      return res.status(200).json({
        success: true,
        permissions: staffPermission.permissions,
        navigationItems: filteredNavigationItems,
        navigationRole,
        staffId: me._id.toString()
      });
    }

    // For regular staff role, keep existing behavior
    const transformPath = (path) => {
      if (!path) return path;
      
      // For clinic staff, convert /staff/* to /clinic/staff/*
      if (navigationRole === 'clinic') {
        if (path.startsWith('/staff/')) {
          return path.replace('/staff/', '/clinic/staff/');
        }
        if (path === '/staff') {
          return '/clinic/staff';
        }
      }
      
      // For doctor staff, convert /staff/* to /doctor/staff/*
      if (navigationRole === 'doctor') {
        if (path.startsWith('/staff/')) {
          return path.replace('/staff/', '/doctor/staff/');
        }
        if (path === '/staff') {
          return '/doctor/staff';
        }
      }
      
      return path;
    };

    return res.status(200).json({
      success: true,
      permissions: null,
      navigationItems: navigationItems.map(item => ({
        _id: item._id,
        label: item.label,
        path: transformPath(item.path),
        icon: item.icon,
        description: item.description,
        order: item.order,
        moduleKey: item.moduleKey,
        subModules: (item.subModules || []).map(subModule => ({
          name: subModule.name,
          path: transformPath(subModule.path || ''),
          icon: subModule.icon || '',
          order: subModule.order || 0
        }))
      })),
      navigationRole,
      staffId: me._id.toString()
    });

  } catch (error) {
    console.error('Error fetching staff sidebar permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

