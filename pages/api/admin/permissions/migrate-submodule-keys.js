// pages/api/admin/permissions/migrate-submodule-keys.js
import dbConnect from "../../../../lib/database";
import ClinicPermission from "../../../../models/ClinicPermission";
import ClinicNavigationItem from "../../../../models/ClinicNavigationItem";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  if (!me || me.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Unauthorized: Admin access required' });
  }

  try {
    // Fetch all navigation items to get submodule keys
    const navigationItems = await ClinicNavigationItem.find({ isActive: true });

    // Create a map of moduleKey -> submodules (with name -> moduleKey)
    const navMap = new Map();
    for (const navItem of navigationItems) {
      const subMap = new Map();
      if (navItem.subModules && navItem.subModules.length > 0) {
        for (const sub of navItem.subModules) {
          subMap.set(sub.name, sub.moduleKey);
        }
      }
      navMap.set(navItem.moduleKey, subMap);
    }

    // Fetch all clinic permissions
    const permissions = await ClinicPermission.find({ isActive: true });
    let updatedCount = 0;

    for (const permission of permissions) {
      let hasChanges = false;

      for (const modulePerm of permission.permissions) {
        const subMap = navMap.get(modulePerm.module);
        if (subMap) {
          for (const subModule of modulePerm.subModules) {
            if (!subModule.moduleKey) {
              const moduleKey = subMap.get(subModule.name);
              if (moduleKey) {
                subModule.moduleKey = moduleKey;
                hasChanges = true;
              }
            }
          }
        }
      }

      if (hasChanges) {
        permission.lastModified = new Date();
        await permission.save();
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Migration completed successfully',
      updated: updatedCount,
      total: permissions.length
    });
  } catch (error) {
    console.error('Error migrating submodule keys:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
