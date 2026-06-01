// pages/api/navigation/update-clinic-icons.js
// Update all clinic navigation item icons from emojis to professional icon keys
import dbConnect from "../../../lib/database";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { clinicNavigationItems } from "../../../data/clinicNavigationItems";

// Icon mapping from old emojis to new professional icon keys
const iconMapping = {
  '🏠': 'dashboard',
  '📅': 'calendar',
  '👤': 'user-circle',
  '👨‍⚕️': 'stethoscope',
  '📋': 'clipboard-list',
  '👨‍💼': 'users',
  '🤑': 'gift',
  '📊': 'bar-chart',
  '📢': 'briefcase',
  '📝': 'file-text',
  '💰': 'dollar-sign',
  '💼': 'briefcase',
  '💳': 'credit-card',
  '📄': 'file',
  '📩': 'mail',
  '💬': 'message-circle',
  '✉️': 'mail',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Allow admin, clinic, and doctor roles
  if (!requireRole(me, ['admin', 'clinic', 'doctor'])) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    // Get all clinic navigation items
    const allClinicItems = await ClinicNavigationItem.find({ role: 'clinic', isActive: true });
    
    // console.log(`Found ${allClinicItems.length} clinic navigation items to check`);
    
    let updatedCount = 0;
    let subModuleUpdatedCount = 0;
    const updateLog = [];

    // Create maps from clinicNavigationItems for quick lookup
    // Note: Database stores moduleKey with "clinic_" prefix, but data file doesn't have it
    const iconMapByModuleKey = new Map();
    const iconMapByModuleKeyWithPrefix = new Map();
    const iconMapByLabel = new Map();
    const subModuleIconMap = new Map();
    
    clinicNavigationItems.forEach(item => {
      const baseModuleKey = item.moduleKey;
      const prefixedModuleKey = `clinic_${baseModuleKey}`;
      
      iconMapByModuleKey.set(baseModuleKey, item.icon);
      iconMapByModuleKeyWithPrefix.set(prefixedModuleKey, item.icon);
      iconMapByLabel.set(item.label, item.icon);
      
      if (item.children) {
        item.children.forEach(child => {
          subModuleIconMap.set(`${baseModuleKey}_${child.label}`, child.icon);
          subModuleIconMap.set(`${prefixedModuleKey}_${child.label}`, child.icon);
          subModuleIconMap.set(`${item.label}_${child.label}`, child.icon);
        });
      }
    });

    // Update each navigation item
    for (const item of allClinicItems) {
      let updated = false;

      // Try to find icon by moduleKey (with and without prefix), then by label
      let expectedIcon = iconMapByModuleKeyWithPrefix.get(item.moduleKey) || 
                        iconMapByModuleKey.get(item.moduleKey) ||
                        iconMapByModuleKey.get(item.moduleKey.replace('clinic_', '')) ||
                        iconMapByLabel.get(item.label);
      
      // If still not found and icon is an emoji, use mapping
      if (!expectedIcon && iconMapping[item.icon]) {
        expectedIcon = iconMapping[item.icon];
      }
      
      if (expectedIcon && item.icon !== expectedIcon) {
        updateLog.push(`${item.label}: "${item.icon}" → "${expectedIcon}"`);
        item.icon = expectedIcon;
        updated = true;
      }

      // Update subModules
      if (item.subModules && item.subModules.length > 0) {
        item.subModules = item.subModules.map(subModule => {
          // Try multiple lookup strategies
          const baseModuleKey = item.moduleKey.replace('clinic_', '');
          let expectedSubIcon = subModuleIconMap.get(`${item.moduleKey}_${subModule.name}`) ||
                               subModuleIconMap.get(`${baseModuleKey}_${subModule.name}`) ||
                               subModuleIconMap.get(`${item.label}_${subModule.name}`);
          
          // If still not found and icon is an emoji, use mapping
          if (!expectedSubIcon && iconMapping[subModule.icon]) {
            expectedSubIcon = iconMapping[subModule.icon];
          }
          
          if (expectedSubIcon && subModule.icon !== expectedSubIcon) {
            subModuleUpdatedCount++;
            return { ...subModule, icon: expectedSubIcon };
          }
          return subModule;
        });
        updated = true;
      }

      if (updated) {
        await item.save();
        updatedCount++;
      }
    }


    // console.log(`Updated ${updatedCount} items and ${subModuleUpdatedCount} sub-modules`);
    // console.log('Update log:', updateLog);

    return res.status(200).json({
      success: true,
      message: `Clinic navigation icons updated successfully! Updated ${updatedCount} items and ${subModuleUpdatedCount} sub-modules.`,
      updated: {
        items: updatedCount,
        subModules: subModuleUpdatedCount
      },
      log: updateLog.slice(0, 10) // Return first 10 updates for debugging
    });
  } catch (error) {
    // console.error('Error updating clinic navigation icons:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

