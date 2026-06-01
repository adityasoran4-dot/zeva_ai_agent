// Helper function to check clinic permissions
import dbConnect from "../../../lib/database";
import ClinicPermission from "../../../models/ClinicPermission";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

/**
 * Get clinic ID from user (clinic or agent)
 * @param {Object} user - User object
 * @returns {Object} { clinicId, error }
 */
export async function getClinicIdFromUser(user) {
  await dbConnect();
  
  if (!user) {
    return { clinicId: null, error: "User not found" };
  }

  if (user.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: user._id }).select("_id");
    if (!clinic) {
      return { clinicId: null, error: "Clinic not found for this user" };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "agent") {
    if (!user.clinicId) {
      return { clinicId: null, error: "Agent is not assigned to any clinic" };
    }
    const clinic = await Clinic.findById(user.clinicId).select("_id");
    if (!clinic) {
      return { clinicId: null, error: "Clinic not found for this agent" };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "doctor") {
    if (!user.clinicId) {
      return { clinicId: null, error: "Doctor is not assigned to any clinic" };
    }
    const clinic = await Clinic.findById(user.clinicId).select("_id");
    if (!clinic) {
      return { clinicId: null, error: "Clinic not found for this doctor" };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "doctorStaff" || user.role === "staff") {
    if (!user.clinicId) {
      return { clinicId: null, error: `${user.role === "doctorStaff" ? "Doctor staff" : "Staff"} is not assigned to any clinic` };
    }
    const clinic = await Clinic.findById(user.clinicId).select("_id");
    if (!clinic) {
      return { clinicId: null, error: `Clinic not found for this ${user.role === "doctorStaff" ? "doctor staff" : "staff"}` };
    }
    return { clinicId: clinic._id, error: null };
  } else if (user.role === "admin") {
    // Admin has all permissions, return null to skip permission checks
    return { clinicId: null, error: null, isAdmin: true };
  }

  return { clinicId: null, error: "Invalid user role" };
}

/**
 * Check if clinic has permission for a specific module and action
 * @param {Object} clinicId - Clinic ID (ObjectId)
 * @param {String} moduleKey - Module key (e.g., "create_offers", "lead")
 * @param {String} action - Action (e.g., "create", "read", "update", "delete")
 * @param {String} subModuleName - Optional submodule name (e.g., "Create Lead", "Assign Lead")
 * @param {String} role - Optional role to check permissions for (e.g., "doctor", "clinic")
 * @returns {Object} { hasPermission: boolean, error: string | null }
 */
export async function checkClinicPermission(clinicId, moduleKey, action, subModuleName = null, role = null) {
  try {
    await dbConnect();

    // If clinicId is null and isAdmin is true, grant permission
    if (!clinicId) {
      return { hasPermission: true, error: null };
    }

    // Ensure clinicId is a valid ObjectId or string
    const clinicIdStr = clinicId?.toString?.() || clinicId;
    if (!clinicIdStr) {
      return { hasPermission: false, error: "Invalid clinic ID" };
    }
    // Build query - try role-specific permissions first if role is provided
    let clinicPermission = null;
    
    if (role) {
      // Try role-specific permissions first (e.g., role: 'doctor')
      clinicPermission = await ClinicPermission.findOne({
        clinicId: clinicIdStr,
        role: role,
        isActive: true
      }).lean();
      
      // If no role-specific permissions found, fall back to 'clinic' role permissions
      if (!clinicPermission && role !== 'clinic') {
        clinicPermission = await ClinicPermission.findOne({
          clinicId: clinicIdStr,
          role: 'clinic',
          isActive: true
        }).lean();
      }
    } else {
      // If no role specified, try 'clinic' role first (default)
      clinicPermission = await ClinicPermission.findOne({
        clinicId: clinicIdStr,
        role: 'clinic',
        isActive: true
      }).lean();
    }

    // If no permissions found, check if ANY permissions exist for this clinic (for backward compatibility)
    if (!clinicPermission) {
      // console.warn(
      //   '[permissions-helper] No ClinicPermission found for role',
      //   { clinicId: clinicId?.toString?.() || clinicId, moduleKey, action, requestedRole: role }
      // );
      
      // Check if ANY permission document exists for this clinic (for backward compatibility)
      const anyPermission = await ClinicPermission.findOne({
        clinicId: clinicIdStr,
        isActive: true
      }).lean();
      
      if (!anyPermission) {
        // No permissions set up at all - allow access (backward compatibility)
        // console.log('[permissions-helper] No permissions set up for clinic, allowing access (backward compatibility)');
        return { hasPermission: true, error: null };
      } else {
        // Permissions ARE set up, but not for this role/module - deny access
        // console.warn(
        //   '[permissions-helper] Permissions exist but not for requested role/module, denying access',
        //   { 
        //     clinicId: clinicId?.toString?.() || clinicId, 
        //     moduleKey, 
        //     action, 
        //     requestedRole: role,
        //     foundRole: anyPermission.role
        //   }
        // );
        return { hasPermission: false, error: `No permissions found for ${role || 'clinic'} role` };
      }
    }

    // Candidate module keys to support legacy prefixes (e.g. "clinic_health_center", "doctor_lead", "agent_lead")
    const moduleCandidates = Array.from(
      new Set([
        moduleKey,
        moduleKey?.startsWith('clinic_') ? moduleKey.slice('clinic_'.length) : null,
        moduleKey?.startsWith('doctor_') ? moduleKey.slice('doctor_'.length) : null,
        moduleKey?.startsWith('agent_') ? moduleKey.slice('agent_'.length) : null,
        moduleKey?.startsWith('admin_') ? moduleKey.slice('admin_'.length) : null,
        moduleKey ? `clinic_${moduleKey}` : null,
        moduleKey ? `doctor_${moduleKey}` : null,
        moduleKey ? `agent_${moduleKey}` : null,
        moduleKey ? `admin_${moduleKey}` : null,
        // Also try removing any prefix
        moduleKey ? moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '') : null,
      ].filter(Boolean))
    );

    // Find the module permission using any of the candidate keys
    const modulePermission = clinicPermission.permissions.find(
      (p) => {
        const pModule = p.module || '';
        // Try exact match first
        if (moduleCandidates.includes(pModule)) {
          return true;
        }
        // Try removing prefixes from stored module
        const pModuleWithoutPrefix = pModule.replace(/^(admin|clinic|doctor|agent)_/, '');
        const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '');
        return pModuleWithoutPrefix === moduleKeyWithoutPrefix;
      }
    );

    if (!modulePermission) {
      // console.warn(
      //   '[permissions-helper] Module not present in clinic permissions',
      //   {
      //     clinicId: clinicId?.toString?.() || clinicId,
      //     moduleKey,
      //     action,
      //     availableModules: clinicPermission.permissions.map((p) => p.module)
      //   }
      // );
      return { hasPermission: true, error: null };
    }

    // console.log('[permissions-helper] Evaluating permission', {
    //   clinicId: clinicId?.toString?.() || clinicId,
    //   requestedModule: moduleKey,
    //   resolvedModule: modulePermission.module,
    //   candidates: moduleCandidates,
    //   action,
    //   moduleActions: modulePermission.actions,
    //   subModules: modulePermission.subModules?.map((sub) => ({
    //     name: sub.name,
    //     actions: sub.actions,
    //   })),
    // });

    // Check module-level permission first (before submodule checks)
    // If "all" action is enabled, grant all permissions
    // Handle both boolean true and string "true" cases
    const hasAllPermission = modulePermission.actions?.all === true || 
                             modulePermission.actions?.all === "true" ||
                             String(modulePermission.actions?.all).toLowerCase() === "true";
    
    if (hasAllPermission) {
      // console.log('[permissions-helper] Module has "all" permission, granting access');
      return { hasPermission: true, error: null };
    }

    // If checking submodule permission
    if (subModuleName) {
      // ✅ PRIORITY 1: Check module-level "all" first - this grants all permissions including submodules
      // When admin clicks "all" at module level, it should enable all submodule actions
      // (This is already checked above, but keeping for clarity)
      const hasAllPermissionForSub = modulePermission.actions?.all === true || 
                                      modulePermission.actions?.all === "true" ||
                                      String(modulePermission.actions?.all).toLowerCase() === "true";
      
      if (hasAllPermissionForSub) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 2: Check if submodule exists (case-insensitive matching)
      const subModule = modulePermission.subModules.find(
        (sm) => sm.name === subModuleName || sm.name?.toLowerCase() === subModuleName?.toLowerCase()
      );

      // If submodule doesn't exist, check module-level permissions
      if (!subModule) {
        // Check module-level specific action as fallback
        if (Boolean(modulePermission.actions?.[action])) {
          return { hasPermission: true, error: null };
        }
        return { hasPermission: false, error: `Submodule ${subModuleName} not found in permissions` };
      }

      // ✅ PRIORITY 3: Check if submodule explicitly denies the action (respect false values)
      // If submodule has the action property explicitly set to false, deny immediately
      if (subModule.actions && subModule.actions.hasOwnProperty(action)) {
        const actionValue = subModule.actions[action];
        // Explicitly false (boolean false or string "false") = deny
        if (actionValue === false || actionValue === "false" || String(actionValue).toLowerCase() === "false") {
          return { hasPermission: false, error: `Permission denied: ${action} action is explicitly denied for submodule ${subModuleName}` };
        }
        // Explicitly true (boolean true or string "true") = allow
        if (actionValue === true || actionValue === "true" || String(actionValue).toLowerCase() === "true") {
          return { hasPermission: true, error: null };
        }
      }

      // ✅ PRIORITY 4: Check submodule-level "all"
      if (Boolean(subModule.actions?.all)) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 5: Check module-level specific action as fallback
      // Only if submodule doesn't explicitly set the permission
      if (Boolean(modulePermission.actions?.[action])) {
        return { hasPermission: true, error: null };
      }

      // ✅ PRIORITY 6: If submodule has no explicit permission and module-level doesn't grant it, deny
      return { hasPermission: false, error: `Permission denied: ${action} action not allowed for submodule ${subModuleName}` };
    }

    // Check module-level permission
    // If "all" action is enabled, grant all permissions (already checked above, but keeping for safety)
    const hasAllPermissionFinal = modulePermission.actions?.all === true || 
                                   modulePermission.actions?.all === "true" ||
                                   String(modulePermission.actions?.all).toLowerCase() === "true";
    
    if (hasAllPermissionFinal) {
      return { hasPermission: true, error: null };
    }

    // Check specific action - handle both boolean and string cases
    const hasSpecificAction = modulePermission.actions?.[action] === true || 
                               modulePermission.actions?.[action] === "true" ||
                               String(modulePermission.actions?.[action]).toLowerCase() === "true";
    
    if (hasSpecificAction) {
      return { hasPermission: true, error: null };
    }

    // If module-level permission is false, check if ANY submodule has the required permission
    // This allows access if user has permission for any submodule within the module
    if (modulePermission.subModules && modulePermission.subModules.length > 0) {
      const hasSubModulePermission = modulePermission.subModules.some((subModule) => {
        if (!subModule || !subModule.actions) return false;
        
        // Check submodule "all" permission
        const subModuleAll = subModule.actions.all === true || 
                            subModule.actions.all === "true" ||
                            String(subModule.actions.all).toLowerCase() === "true";
        if (subModuleAll) return true;
        
        // Check submodule specific action
        const subModuleAction = subModule.actions[action] === true || 
                               subModule.actions[action] === "true" ||
                               String(subModule.actions[action]).toLowerCase() === "true";
        return subModuleAction;
      });
      
      if (hasSubModulePermission) {
        // console.log('[permissions-helper] Submodule has permission, granting access');
        return { hasPermission: true, error: null };
      }
    }

    return { hasPermission: false, error: `Permission denied: ${action} action not allowed for module ${moduleKey}` };
  } catch (error) {
    // console.error("Error checking clinic permission:", error);
    // console.error("Error stack:", error.stack);
    // console.error("Error details:", {
    //   clinicId: clinicId?.toString?.() || clinicId,
    //   moduleKey,
    //   action,
    //   role,
    //   errorMessage: error.message
    // });
    return { hasPermission: false, error: `Error checking permissions: ${error.message}` };
  }
}

/**
 * Get clinic permissions for a specific module
 * @param {Object} clinicId - Clinic ID (ObjectId)
 * @param {String} moduleKey - Module key (e.g., "create_offers")
 * @returns {Object} { permissions: Object | null, error: string | null }
 */
export async function getModulePermissions(clinicId, moduleKey) {
  await dbConnect();

  if (!clinicId) {
    return { permissions: null, error: "Clinic ID is required" };
  }

  try {
    const clinicPermission = await ClinicPermission.findOne({
      clinicId,
      isActive: true
    });

    if (!clinicPermission) {
      return { permissions: null, error: "No permissions found for this clinic" };
    }

    const modulePermission = clinicPermission.permissions.find(
      (p) => p.module === moduleKey
    );

    if (!modulePermission) {
      return { permissions: null, error: `No permissions found for module: ${moduleKey}` };
    }

    return { permissions: modulePermission, error: null };
  } catch (error) {
    // console.error("Error getting module permissions:", error);
    return { permissions: null, error: "Error getting permissions" };
  }
}
