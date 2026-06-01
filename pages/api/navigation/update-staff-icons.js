// pages/api/navigation/update-staff-icons.js
// Quick endpoint to update Staff Management icons
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
    // Update Staff Management parent icon for clinic role
    const staffManagementClinic = await ClinicNavigationItem.findOne({
      role: 'clinic',
      moduleKey: 'clinic_staff_management'
    });

    if (staffManagementClinic) {
      staffManagementClinic.icon = '👨‍💼';
      await staffManagementClinic.save();
    }

    // Update subModules icons for clinic role
    const updatedSubModules = [
      { name: 'Patient Registration', icon: '👤' },
      { name: 'Patient Information', icon: '📋' },
      { name: 'Add EOD Task', icon: '📝' },
      { name: 'Add Expense', icon: '💰' },
      { name: 'Add Vendor', icon: '💼' },
      { name: 'Membership', icon: '💳' },
      { name: 'All Contracts', icon: '📄' }
    ];

    if (staffManagementClinic && staffManagementClinic.subModules) {
      staffManagementClinic.subModules = staffManagementClinic.subModules.map(subModule => {
        const update = updatedSubModules.find(u => u.name === subModule.name);
        if (update) {
          return { ...subModule, icon: update.icon };
        }
        return subModule;
      });
      await staffManagementClinic.save();
    }

    // Also update for doctor role if exists
    const staffManagementDoctor = await ClinicNavigationItem.findOne({
      role: 'doctor',
      moduleKey: 'doctor_staff_management'
    });

    if (staffManagementDoctor) {
      staffManagementDoctor.icon = '👨‍💼';
      if (staffManagementDoctor.subModules) {
        staffManagementDoctor.subModules = staffManagementDoctor.subModules.map(subModule => {
          const update = updatedSubModules.find(u => u.name === subModule.name);
          if (update) {
            return { ...subModule, icon: update.icon };
          }
          return subModule;
        });
      }
      await staffManagementDoctor.save();
    }

    // Also update for agent role (if it exists as clinic role)
    // Agents use clinic navigation items, so clinic update should cover it

    return res.status(200).json({
      success: true,
      message: 'Staff Management icons updated successfully',
      updated: {
        clinic: !!staffManagementClinic,
        doctor: !!staffManagementDoctor
      }
    });
  } catch (error) {
    // console.error('Error updating Staff Management icons:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

