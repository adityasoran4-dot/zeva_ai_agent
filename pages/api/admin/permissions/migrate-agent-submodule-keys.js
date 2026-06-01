// pages/api/admin/permissions/migrate-agent-submodule-keys.js
// Migration API to add moduleKey to subModules in AgentPermission documents
import dbConnect from '../../../../lib/database';
import AgentPermission from '../../../../models/AgentPermission';
import ClinicNavigationItem from '../../../../models/ClinicNavigationItem';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('[Agent Submodule Key Migration] Starting migration...');

    // Step 1: Fetch all navigation items to create a map
    const navigationItems = await ClinicNavigationItem.find({}).lean();
    console.log('[Agent Submodule Key Migration] Found', navigationItems.length, 'clinic navigation items');

    // Create a map: parentModuleKey -> subModuleName -> subModuleKey
    const subModuleKeyMap = {};

    for (const navItem of navigationItems) {
      console.log('[Agent Submodule Key Migration] Processing nav item:', navItem.moduleKey, navItem.label);
      const parentModuleKey = navItem.moduleKey;

      if (navItem.subModules && navItem.subModules.length > 0) {
        console.log('[Agent Submodule Key Migration] Nav item has subModules:', navItem.subModules.length);
        for (const subModule of navItem.subModules) {
          console.log('[Agent Submodule Key Migration] Submodule:', subModule.name, 'moduleKey:', subModule.moduleKey);
          const subModuleKey = subModule.moduleKey;
          
          if (!subModuleKeyMap[parentModuleKey]) {
            subModuleKeyMap[parentModuleKey] = {};
          }
          
          subModuleKeyMap[parentModuleKey][subModule.name] = subModuleKey;
        }
      }
    }

    console.log('[Agent Submodule Key Migration] Submodule key map:', JSON.stringify(subModuleKeyMap, null, 2));

    // Step 2: Fetch all AgentPermission documents
    const agentPermissions = await AgentPermission.find({});
    console.log('[Agent Submodule Key Migration] Found', agentPermissions.length, 'agent permission documents');

    // Step 3: Update each document
    let updatedCount = 0;

    for (const agentPerm of agentPermissions) {
      console.log('[Agent Submodule Key Migration] Processing agent permission:', agentPerm._id);
      let needsUpdate = false;

      for (let i = 0; i < agentPerm.permissions.length; i++) {
        const modulePerm = agentPerm.permissions[i];
        const parentModuleKey = modulePerm.module;
        console.log('[Agent Submodule Key Migration] Processing module:', parentModuleKey);

        if (modulePerm.subModules && modulePerm.subModules.length > 0) {
          for (let j = 0; j < modulePerm.subModules.length; j++) {
            const subModule = modulePerm.subModules[j];
            console.log('[Agent Submodule Key Migration] Processing submodule:', subModule.name, 'existing moduleKey:', subModule.moduleKey);

            // Only add moduleKey if it doesn't already exist
            if (!subModule.moduleKey) {
              // Look up the moduleKey from our map
              const subModuleKey = subModuleKeyMap[parentModuleKey]?.[subModule.name];
              console.log('[Agent Submodule Key Migration] Looked up subModuleKey:', subModuleKey, 'for submodule:', subModule.name, 'parent:', parentModuleKey);

              if (subModuleKey) {
                console.log('[Agent Submodule Key Migration] Adding moduleKey:', subModuleKey, 'to submodule:', subModule.name);
                modulePerm.subModules[j].moduleKey = subModuleKey;
                needsUpdate = true;
              }
            }
          }
        }
      }

      if (needsUpdate) {
        await agentPerm.save();
        updatedCount++;
        console.log('[Agent Submodule Key Migration] Updated agent permission:', agentPerm._id);
      }
    }

    console.log('[Agent Submodule Key Migration] Migration complete! Updated', updatedCount, 'documents');

    return res.status(200).json({
      success: true,
      message: `Migration complete! Updated ${updatedCount} agent permission documents`,
      updatedCount
    });
  } catch (error) {
    console.error('[Agent Submodule Key Migration] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
}
