// pages/api/admin/navigation/add-stock-purchase-return-submodule.js
import dbConnect from "../../../../lib/database";
import ClinicNavigationItem from "../../../../models/ClinicNavigationItem";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await dbConnect();
  const me = await getUserFromReq(req);

  if (!me) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  // Only allow admin role
  if (!requireRole(me, ['admin'])) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }

  try {
    // Find the clinic_stock module
    const clinicStockModule = await ClinicNavigationItem.findOne({
      moduleKey: 'clinic_stock',
      role: 'clinic',
      isActive: true
    });

    if (!clinicStockModule) {
      return res.status(404).json({ 
        success: false, 
        message: 'Clinic Stock module not found' 
      });
    }

    // Check if submodule already exists
    const existingSubmodule = clinicStockModule.subModules.find(
      sub => sub.moduleKey === 'clinic_stock_purchase_return'
    );

    if (existingSubmodule) {
      return res.status(200).json({ 
        success: true, 
        message: 'Submodule already exists',
        data: existingSubmodule
      });
    }

    // Add the new submodule
    const newSubmodule = {
      name: 'Purchase Returns',
      path: '/clinic/stocks/purchase-returns',
      icon: '↩️',
      order: 13, // Next order number (after the existing 12 items)
      moduleKey: 'clinic_stock_purchase_return'
    };

    clinicStockModule.subModules.push(newSubmodule);
    await clinicStockModule.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Purchase Returns submodule added successfully',
      data: newSubmodule,
      totalSubModules: clinicStockModule.subModules.length
    });
  } catch (error) {
    console.error('Error adding purchase return submodule:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
