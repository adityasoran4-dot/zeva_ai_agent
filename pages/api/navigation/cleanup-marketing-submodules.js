import dbConnect from "../../../lib/database";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

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
    const { role = 'clinic' } = req.body;

    // Validate role
    if (!['admin', 'clinic', 'doctor'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be admin, clinic, or doctor' 
      });
    }

    // Sub-modules we want to REMOVE from Marketing
    const removeSubModuleNames = [
      "Create Agent", 
      "Create Offers", 
      "Job", 
      "Blogs"
    ];

    const results = [];

    // Get all Marketing modules for the role
    const marketingModules = await ClinicNavigationItem.find({
      role: role,
      moduleKey: { $regex: /_marketing$/i }
    });

    for (const marketingModule of marketingModules) {
      if (marketingModule.subModules && marketingModule.subModules.length > 0) {
        // Filter out the sub-modules we want to remove
        const filteredSubModules = marketingModule.subModules.filter(sub => 
          !removeSubModuleNames.some(removeName => 
            sub.name.toLowerCase().includes(removeName.toLowerCase())
          )
        );

        const removedCount = marketingModule.subModules.length - filteredSubModules.length;

        if (removedCount > 0) {
          marketingModule.subModules = filteredSubModules;
          await marketingModule.save();
          results.push({
            moduleKey: marketingModule.moduleKey,
            removedCount: removedCount,
            keptCount: filteredSubModules.length
          });
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Marketing sub-modules cleaned up successfully`,
      results: results
    });
  } catch (error) {
    console.error('Error cleaning up marketing sub-modules:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
