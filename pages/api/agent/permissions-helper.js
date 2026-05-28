// Helper function to check agent permissions
import dbConnect from "../../../lib/database";
import AgentPermission from "../../../models/AgentPermission";
import User from "../../../models/Users";

/**
 * Check if agent has permission for a specific module and action
 * @param {Object} agentId - Agent ID (ObjectId)
 * @param {String} moduleKey - Module key (e.g., "lead", "create_offers")
 * @param {String} action - Action (e.g., "create", "read", "update", "delete", "approve")
 * @param {String} subModuleName - Optional submodule name (e.g., "Create Lead", "Assign Lead")
 * @returns {Object} { hasPermission: boolean, error: string | null }
 */
export async function checkAgentPermission(agentId, moduleKey, action, subModuleName = null) {
  await dbConnect();

  if (!agentId) {
    return { hasPermission: false, error: "Agent ID is required" };
  }

  try {
    // Find agent permissions
    const agentPermission = await AgentPermission.findOne({
      agentId,
      isActive: true
    }).lean();

    // If no permissions found, deny access
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return { hasPermission: false, error: "No permissions found for this agent" };
    }

    // Handle module key matching (with or without role prefix)
    const moduleCandidates = Array.from(
      new Set([
        moduleKey,
        moduleKey?.replace(/^(admin|clinic|doctor)_/, ''), // Remove role prefix
        moduleKey ? `admin_${moduleKey}` : null,
        moduleKey ? `clinic_${moduleKey}` : null,
        moduleKey ? `doctor_${moduleKey}` : null,
      ].filter(Boolean))
    );

    // Find the module permission using any of the candidate keys
    let modulePermission = null;

    // Check subModules of all modules FIRST! (since clinic_review is a submodule of clinic_marketing)
    for (const permission of agentPermission.permissions) {
      if (Array.isArray(permission.subModules) && permission.subModules.length > 0) {
        const subModule = permission.subModules.find((sm) => 
          sm.moduleKey && moduleCandidates.some(candidate => 
            sm.moduleKey === candidate || 
            sm.moduleKey.replace(/^(admin|clinic|doctor)_/, '') === candidate.replace(/^(admin|clinic|doctor)_/, '')
          ) ||
          // Also check by name (e.g., "Enquiry", "Review")
          sm.name && moduleCandidates.some(candidate => {
            const candidateName = candidate.replace(/^(admin|clinic|doctor)_/, '').replace(/_/g, ' ').toLowerCase();
            const subModuleName = sm.name.toLowerCase();
            return subModuleName.includes(candidateName);
          })
        );
        if (subModule) {
          modulePermission = subModule;
          break;
        }
      }
    }

    // If NOT found in submodules, THEN check direct modules
    if (!modulePermission) {
      modulePermission = agentPermission.permissions.find(
        (p) => {
          const permModule = p.module || '';
          return moduleCandidates.some(candidate => 
            permModule === candidate || 
            permModule.replace(/^(admin|clinic|doctor)_/, '') === candidate.replace(/^(admin|clinic|doctor)_/, '')
          );
        }
      );
    }

    if (!modulePermission) {
      return { hasPermission: false, error: `Module ${moduleKey} not found in agent permissions` };
    }

    // Check module-level "all" permission first (before submodule checks)
    // Handle both boolean true and string "true" cases
    const hasAllPermission = modulePermission.actions?.all === true || 
                             modulePermission.actions?.all === "true" ||
                             String(modulePermission.actions?.all).toLowerCase() === "true";
    
    if (hasAllPermission) {
      // console.log('[agent-permissions-helper] Module has "all" permission, granting access');
      return { hasPermission: true, error: null };
    }

    // If checking submodule permission
    if (subModuleName) {
      // PRIORITY 1: Check module-level "all" first - this grants all permissions including submodules
      // (Already checked above, but keeping for clarity)
      if (hasAllPermission) {
        return { hasPermission: true, error: null };
      }

      // PRIORITY 2: Check module-level specific action - this also grants permission for submodules
      if (Boolean(modulePermission.actions?.[action])) {
        return { hasPermission: true, error: null };
      }

      // PRIORITY 3: Check if submodule exists
      const subModule = modulePermission.subModules?.find(
        (sm) => sm.name === subModuleName
      );

      // If submodule doesn't exist, deny (module-level permissions already checked above)
      if (!subModule) {
        return { hasPermission: false, error: `Submodule ${subModuleName} not found in permissions` };
      }

      // PRIORITY 4: Check submodule-level "all"
      if (Boolean(subModule.actions?.all)) {
        return { hasPermission: true, error: null };
      }

      // PRIORITY 5: Check submodule-level specific action
      if (Boolean(subModule.actions?.[action])) {
        return { hasPermission: true, error: null };
      }

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

    return { hasPermission: false, error: `Permission denied: ${action} action not allowed for module ${moduleKey}` };
  } catch (error) {
    // console.error("Error checking agent permission:", error);
    return { hasPermission: false, error: "Error checking permissions" };
  }
}

/**
 * Get agent permissions for a specific module
 * @param {Object} agentId - Agent ID (ObjectId)
 * @param {String} moduleKey - Module key (e.g., "lead")
 * @returns {Object} { permissions: Object | null, error: string | null }
 */
export async function getAgentModulePermissions(agentId, moduleKey) {
  await dbConnect();

  if (!agentId) {
    return { permissions: null, error: "Agent ID is required" };
  }

  try {
    console.log("[getAgentModulePermissions] Looking up permissions for agentId:", agentId, "moduleKey:", moduleKey);
    
    const agentPermission = await AgentPermission.findOne({
      agentId,
      isActive: true
    });

    console.log("[getAgentModulePermissions] Full agentPermission from DB:", JSON.stringify(agentPermission, null, 2));
    console.log("[getAgentModulePermissions] agentPermission.permissions:", JSON.stringify(agentPermission?.permissions, null, 2));

    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      console.log("[getAgentModulePermissions] No permissions found for this agent");
      return { permissions: null, error: "No permissions found for this agent" };
    }

    // Handle module key matching (with or without role prefix)
    const moduleCandidates = Array.from(
      new Set([
        moduleKey,
        moduleKey?.replace(/^(admin|clinic|doctor)_/, ''),
        moduleKey ? `admin_${moduleKey}` : null,
        moduleKey ? `clinic_${moduleKey}` : null,
        moduleKey ? `doctor_${moduleKey}` : null,
      ].filter(Boolean))
    );
    
    console.log("[getAgentModulePermissions] Module candidates:", moduleCandidates);

    // Check subModules of all modules FIRST! (since clinic_review is a submodule of clinic_marketing)
    let modulePermission = null;
    console.log("[getAgentModulePermissions] Checking subModules of all modules first");
    
    for (const permission of agentPermission.permissions) {
      console.log("[getAgentModulePermissions] Checking parent module:", permission.module);
      if (Array.isArray(permission.subModules) && permission.subModules.length > 0) {
        console.log("[getAgentModulePermissions] Parent module has subModules:", JSON.stringify(permission.subModules, null, 2));
        const subModule = permission.subModules.find((sm) => {
          console.log("[getAgentModulePermissions] Checking subModule:", JSON.stringify(sm, null, 2));
          const found = sm.moduleKey && moduleCandidates.some(candidate => 
            sm.moduleKey === candidate || 
            sm.moduleKey.replace(/^(admin|clinic|doctor)_/, '') === candidate.replace(/^(admin|clinic|doctor)_/, '')
          ) ||
          // Also check by name (e.g., "Enquiry", "Review")
          sm.name && moduleCandidates.some(candidate => {
            const candidateName = candidate.replace(/^(admin|clinic|doctor)_/, '').replace(/_/g, ' ').toLowerCase();
            const subModuleName = sm.name.toLowerCase();
            return subModuleName.includes(candidateName);
          });
          console.log("[getAgentModulePermissions] subModule found:", found);
          return found;
        });
        if (subModule) {
          console.log("[getAgentModulePermissions] Found matching subModule in parent:", permission.module, "subModule:", JSON.stringify(subModule, null, 2));
          modulePermission = subModule;
          break;
        }
      }
    }

    // If NOT found in submodules, THEN check direct modules
    if (!modulePermission) {
      console.log("[getAgentModulePermissions] Not found in subModules, checking direct modules");
      modulePermission = agentPermission.permissions.find(
        (p) => {
          const permModule = p.module || '';
          const found = moduleCandidates.some(candidate => 
            permModule === candidate || 
            permModule.replace(/^(admin|clinic|doctor)_/, '') === candidate.replace(/^(admin|clinic|doctor)_/, '')
          );
          console.log("[getAgentModulePermissions] Checking direct module:", permModule, "found:", found);
          return found;
        }
      );
    }

    if (!modulePermission) {
      console.log("[getAgentModulePermissions] No matching module found at all");
      return { permissions: null, error: `No permissions found for module: ${moduleKey}` };
    }

    console.log("[getAgentModulePermissions] Found modulePermission:", JSON.stringify(modulePermission, null, 2));
    console.log("[getAgentModulePermissions] modulePermission.actions:", modulePermission.actions);
    return { permissions: modulePermission, error: null };
  } catch (error) {
    console.error("[getAgentModulePermissions] Error:", error);
    return { permissions: null, error: "Error getting permissions" };
  }
}

