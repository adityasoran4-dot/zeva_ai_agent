// pages/api/clinic/sidebar-permissions.js
// Returns navigation items for clinic sidebar based on permissions granted by admin
import dbConnect from "../../../lib/database";
import ClinicPermission from "../../../models/ClinicPermission";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in clinic user
    const me = await getUserFromReq(req);
    console.log('[sidebar-permissions API] me:', me);
    console.log('[sidebar-permissions API] me.role:', me.role);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Only clinic, agent, doctor, doctorStaff can fetch clinic navigation
    if (!['clinic', 'agent', 'doctor', 'doctorStaff'].includes(me.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Clinic role or agent with clinic permissions required' });
    }

    let clinic = null;
    if (me.role === 'clinic') {
      clinic = await Clinic.findOne({ owner: me._id });
    } else if (me.clinicId) {
      clinic = await Clinic.findById(me.clinicId);
    }

    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found for this user' });
    }

    // Check if clinic is approved
    if (!clinic.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Clinic account not approved. Please wait for admin approval.' 
      });
    }

    // Check if clinic is declined
    if (clinic.declined) {
      return res.status(403).json({ 
        success: false, 
        message: 'Clinic account has been declined' 
      });
    }

    // Get clinic permissions
    const clinicPermission = await ClinicPermission.findOne({ clinicId: clinic._id });
    console.log('[sidebar-permissions API] clinicPermission:', clinicPermission);
    console.log('[sidebar-permissions API] clinicPermission.permissions:', clinicPermission?.permissions);

    // Get navigation items for clinic role
    const navigationItems = await ClinicNavigationItem.find({ 
      role: 'clinic', 
      isActive: true 
    }).sort({ order: 1 });

    // Helper function to transform /staff paths to /clinic/staff paths
    const transformPath = (path) => {
      if (!path) return path;
      // Transform /staff/* to /clinic/staff/*
      if (path.startsWith('/staff/')) {
        return path.replace('/staff/', '/clinic/staff/');
      }
      // Transform /staff to /clinic/staff
      if (path === '/staff') {
        return '/clinic/staff';
      }
      // Keep other paths as-is (clinic paths, etc.)
      return path;
    };

    // If no permissions exist, return all navigation items (clinic sees everything until admin restricts)
    if (!clinicPermission || !clinicPermission.permissions || clinicPermission.permissions.length === 0) {
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
            ...subModule,
            path: transformPath(subModule.path)
          }))
        })),
        clinicId: clinic._id.toString()
      });
    }

    // Build permission map for quick lookup
    const permissionMap = {};
    clinicPermission.permissions.forEach(perm => {
      const moduleKey = perm.module;
      const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor)_/, '');
      const moduleKeyWithPrefix = `clinic_${moduleKeyWithoutPrefix}`;
      
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

    // Filter navigation items based on permissions
    // Show module if ANY action is true (all, create, read, update, delete, print, export, approve)
    // Only hide module if ALL actions are false
    // Show submodule only if clinic has "read" or "all" permission at submodule level
    const filteredNavigationItems = navigationItems
      .map(item => {
        // Try multiple lookup strategies for moduleKey matching
        const modulePerm = permissionMap[item.moduleKey] || 
                          permissionMap[item.moduleKey.replace('clinic_', '')] ||
                          permissionMap[item.moduleKey.replace(/^(admin|clinic|doctor)_/, '')];
        
        // Check if module has ANY permission at module level
        // Show module if any of these actions is true: all, create, read, update, delete, print, export, approve
        const hasModulePermission = modulePerm && (
          modulePerm.moduleActions.all === true ||
          modulePerm.moduleActions.create === true ||
          modulePerm.moduleActions.read === true ||
          modulePerm.moduleActions.update === true ||
          modulePerm.moduleActions.delete === true ||
          modulePerm.moduleActions.print === true ||
          modulePerm.moduleActions.export === true ||
          modulePerm.moduleActions.approve === true
        );

        // Only hide module if ALL actions are false (or no permission exists)
        if (!hasModulePermission) {
          return null; // Don't show this module at all
        }

        // Filter submodules based on permissions
        // Only show submodules that have explicit read or all permission
        let filteredSubModules = [];
        if (item.subModules && item.subModules.length > 0) {
          filteredSubModules = item.subModules
            .map(subModule => {
              const subModulePerm = modulePerm?.subModules[subModule.name];
              const hasSubModuleRead = subModulePerm && (
                subModulePerm.read === true || 
                subModulePerm.all === true
              );
              
              // Only include submodule if it has read permission
              if (hasSubModuleRead) {
                return {
                  name: subModule.name,
                  path: transformPath(subModule.path || ''),
                  icon: subModule.icon || '',
                  order: subModule.order || 0
                };
              }
              return null;
            })
            .filter(subModule => subModule !== null);
        }

        return {
          _id: item._id,
          label: item.label,
          path: transformPath(item.path),
          icon: item.icon,
          description: item.description,
          order: item.order,
          moduleKey: item.moduleKey,
          subModules: filteredSubModules
        };
      })
      .filter(item => item !== null); // Remove null items

    const response = {
      success: true,
      permissions: clinicPermission.permissions,
      navigationItems: filteredNavigationItems,
      clinicId: clinic._id.toString()
    };
    console.log('[sidebar-permissions API] Returning response:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching clinic sidebar permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}


