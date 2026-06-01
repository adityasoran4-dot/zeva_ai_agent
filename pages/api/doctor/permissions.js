// pages/api/doctor/permissions.js
// Returns permissions for doctor role
// Doctors use clinic permissions (same as clinic role)
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import ClinicPermission from "../../../models/ClinicPermission";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in doctor user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Verify user is a doctor
    if (me.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor role required' });
    }

    // Doctors use clinic permissions - get the clinic they're associated with
    if (!me.clinicId) {
      // If doctor has no clinic, return empty permissions (no access)
      return res.status(200).json({ 
        success: true, 
        data: {
          doctorId: me._id,
          permissions: [],
          isActive: true
        }
      });
    }

    // Get clinic permissions for the doctor's clinic
    const clinicPermission = await ClinicPermission.findOne({
      clinicId: me.clinicId,
      role: 'doctor', // Try doctor role first
      isActive: true
    }).lean();

    // If no doctor-specific permissions, try clinic role permissions
    const finalPermission = clinicPermission || await ClinicPermission.findOne({
      clinicId: me.clinicId,
      role: 'clinic',
      isActive: true
    }).lean();

    if (!finalPermission) {
      // No permissions found - return empty (frontend will handle this)
      return res.status(200).json({ 
        success: true, 
        data: {
          doctorId: me._id,
          permissions: [],
          isActive: true
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      data: {
        doctorId: me._id,
        permissions: finalPermission.permissions || [],
        isActive: finalPermission.isActive !== false
      }
    });
  } catch (error) {
    // console.error('Error fetching doctor permissions:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}

