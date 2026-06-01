// lib/checkAgentPermission.js
// Utility function to check if an agent has permission for a specific module and action
import AgentPermission from "../models/AgentPermission";

export async function checkAgentPermission(agentId, moduleKey, action, subModuleName = null) {
  try {
    const agentPermission = await AgentPermission.findOne({ agentId });
    
    if (!agentPermission || !agentPermission.permissions || agentPermission.permissions.length === 0) {
      return false;
    }

    // Find the module permission
    const modulePerm = agentPermission.permissions.find(p => {
      const permModuleKey = p.module || '';
      const permName = String(p.name || '').trim().toLowerCase();
      const moduleKeyLower = String(moduleKey || '').trim().toLowerCase();
      const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '').toLowerCase();
      const permModuleKeyWithoutPrefix = permModuleKey.replace(/^(admin|clinic|doctor|agent)_/, '').toLowerCase();
      
      // Check name field first (case-insensitive) - most common for membership
      if (permName && permName === moduleKeyLower) {
        console.log(`✅ Permission matched by name: "${p.name}" === "${moduleKey}"`);
        return true;
      }
      if (permName && permName === moduleKeyWithoutPrefix) {
        console.log(`✅ Permission matched by name (without prefix): "${p.name}" === "${moduleKeyWithoutPrefix}"`);
        return true;
      }
      
      // Check module field
      if (permModuleKey && (
          permModuleKey.toLowerCase() === moduleKeyLower || 
          permModuleKeyWithoutPrefix === moduleKeyWithoutPrefix ||
          permModuleKey.toLowerCase() === moduleKeyWithoutPrefix ||
          permModuleKeyWithoutPrefix === moduleKeyLower
        )) {
        console.log(`✅ Permission matched by module: "${p.module}" === "${moduleKey}"`);
        return true;
      }
      
      return false;
    });

    if (!modulePerm) {
      console.log(`❌ Permission not found for moduleKey: "${moduleKey}". Available permissions:`, 
        agentPermission.permissions.map(p => ({ module: p.module, name: p.name }))
      );
      return false;
    }
    
    console.log(`✅ Found permission for "${moduleKey}":`, {
      module: modulePerm.module,
      name: modulePerm.name,
      actions: modulePerm.actions
    });

    // If checking submodule permission
    if (subModuleName) {
      const subModuleNameLower = String(subModuleName || '').trim().toLowerCase();
      const subModulePerm = modulePerm.subModules?.find(sm => {
        const smName = String(sm.name || '').trim().toLowerCase();
        return smName === subModuleNameLower;
      });
      
      if (!subModulePerm) {
        console.log(`❌ Submodule "${subModuleName}" not found in module "${moduleKey}". Available submodules:`, 
          modulePerm.subModules?.map(sm => sm.name) || []);
        return false;
      }
      
      console.log(`✅ Found submodule "${subModuleName}" with actions:`, subModulePerm.actions);
      
      // Check if submodule has the action permission
      const hasPermission = subModulePerm.actions?.[action] === true || 
                           subModulePerm.actions?.all === true;
      console.log(`Permission check result for ${moduleKey}.${subModuleName}.${action}:`, hasPermission, {
        actionValue: subModulePerm.actions?.[action],
        allValue: subModulePerm.actions?.all
      });
      return hasPermission;
    }

    // Check module-level permission
    const hasAction = modulePerm.actions?.[action] === true || 
                      modulePerm.actions?.all === true;
    console.log(`Permission check result for ${moduleKey}.${action}:`, hasAction, {
      actionValue: modulePerm.actions?.[action],
      allValue: modulePerm.actions?.all
    });
    return hasAction;
  } catch (error) {
    console.error('Error checking agent permission:', error);
    return false;
  }
}

