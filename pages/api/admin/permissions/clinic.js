// pages/api/admin/permissions/clinic.js
import dbConnect from "../../../../lib/database";
import ClinicPermission from "../../../../models/ClinicPermission";
import Clinic from "../../../../models/Clinic";
import User from "../../../../models/Users";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { getUserFromReq } from "../../lead-ms/auth";
import { checkAgentPermission } from "../../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  const allowedRoles = ['admin', 'clinic', 'doctor'];

  // Get the logged-in user
  const me = await getUserFromReq(req);
  if (!me) {
    return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
  }

  // Verify admin token (for backward compatibility)
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  let adminPayload;

  try {
    adminPayload = jwt.verify(token, process.env.JWT_SECRET);
    if (adminPayload.role !== 'admin' && me.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
  } catch (error) {
    // console.error('Invalid admin token for clinic permissions:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const resolveAdminIdCandidates = (payload) => {
    if (!payload) {
      return { ids: [], emails: [] };
    }

    const ids = [
      payload?.userId,
      payload?._id,
      payload?.id,
      payload?.user?._id,
      payload?.user?.id,
      payload?.user?.userId,
      payload?.data?.userId,
      payload?.data?.id,
      payload?.data?._id,
      payload?.data?.user?._id,
      payload?.data?.user?.id,
      payload?.sub,
    ].filter(Boolean);

    const emails = [
      payload?.email,
      payload?.user?.email,
      payload?.data?.email,
      payload?.data?.user?.email,
    ].filter(Boolean);

    return { ids, emails };
  };

  const resolveAdminObjectId = async (payload) => {
    const { ids, emails } = resolveAdminIdCandidates(payload);

    for (const candidateId of ids) {
      if (!candidateId) continue;
      if (!mongoose.Types.ObjectId.isValid(candidateId)) {
        continue;
      }

      const adminUser = await User.findOne(
        { _id: candidateId, role: 'admin' },
        { _id: 1 }
      );

      if (adminUser?._id) {
        return adminUser._id;
      }
    }

    for (const candidateEmail of emails) {
      const adminUser = await User.findOne(
        { email: candidateEmail, role: 'admin' },
        { _id: 1 }
      );

      if (adminUser?._id) {
        return adminUser._id;
      }
    }

    return null;
  };

  if (req.method === 'GET') {
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_staff_management", "read", "Manage Clinic Permissions");
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: "Permission denied: You do not have read permission for Manage Clinic Permissions submodule" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin or agent role required" });
    }

    try {
      const { clinicId, role, includeAdmin } = req.query;

      // Build base filter with isActive and optional clinicId
      const baseConditions = { isActive: true };
      if (clinicId) {
        baseConditions.clinicId = clinicId;
      }

      let combinedFilter = { ...baseConditions };

      if (role) {
        const normalizedRole = String(role).toLowerCase();
        if (!allowedRoles.includes(normalizedRole)) {
          return res.status(400).json({ success: false, message: 'Invalid role parameter' });
        }
        
        // For clinic role, also include legacy documents without role field
        if (normalizedRole === 'clinic') {
          // Build $or condition that includes role='clinic' OR legacy documents (no role field)
          // Each condition must also match baseConditions (isActive and clinicId if provided)
          const clinicRoleCondition = { ...baseConditions, role: normalizedRole };
          const legacyCondition1 = { ...baseConditions, role: { $exists: false } };
          const legacyCondition2 = { ...baseConditions, role: null };
          
          combinedFilter = {
            $or: [clinicRoleCondition, legacyCondition1, legacyCondition2]
          };
        } else {
          // For doctor or admin role, simple filter
          combinedFilter = { ...baseConditions, role: normalizedRole };
        }
      } else if (includeAdmin !== 'true') {
        // Exclude admin role, include clinic and doctor
        combinedFilter = { ...baseConditions, role: { $ne: 'admin' } };
      }

      if (clinicId) {
        // Get specific clinic permissions
        const permissions = await ClinicPermission.findOne(combinedFilter).populate('clinicId', 'name');
        return res.status(200).json({ success: true, data: permissions });
      } else {
        // Get all clinic permissions
        const permissions = await ClinicPermission.find(combinedFilter)
          .populate('clinicId', 'name')
          .populate('grantedBy', 'name email');
        return res.status(200).json({ success: true, data: permissions });
      }
    } catch (error) {
      // console.error('Error fetching clinic permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_staff_management", "update", "Manage Clinic Permissions");
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false,
          message: "Permission denied: You do not have update permission for Manage Clinic Permissions submodule" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin or agent role required" });
    }

    try {
      const { clinicId, permissions, role = 'clinic' } = req.body;

      const normalizedRole = String(role).toLowerCase();
      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role provided' });
      }

      // Note: Clinic role permissions can now be managed. 
      // If you want clinic to have full access by default, ensure permissions are set accordingly.

      // console.log('Received clinic permission request:', { clinicId, role: normalizedRole, permissions });

      if (!clinicId || !permissions) {
        return res.status(400).json({ success: false, message: 'Clinic ID and permissions are required' });
      }

      // Validate permissions structure
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions must be an array' });
      }

      // Validate each permission object
      for (const permission of permissions) {
        if (!permission.module || typeof permission.module !== 'string') {
          return res.status(400).json({ success: false, message: 'Each permission must have a valid module' });
        }
        
        if (!permission.actions || typeof permission.actions !== 'object') {
          return res.status(400).json({ success: false, message: 'Each permission must have actions object' });
        }

        // Validate actions structure
        const requiredActions = ['all', 'create', 'read', 'update', 'delete'];
        for (const action of requiredActions) {
          if (typeof permission.actions[action] !== 'boolean') {
            return res.status(400).json({ success: false, message: `Action '${action}' must be a boolean` });
          }
        }

        // Validate sub-modules if present
        if (permission.subModules && Array.isArray(permission.subModules)) {
          for (const subModule of permission.subModules) {
            if (!subModule.name || typeof subModule.name !== 'string') {
              return res.status(400).json({ success: false, message: 'Sub-module must have a valid name' });
            }
            if (!subModule.actions || typeof subModule.actions !== 'object') {
              return res.status(400).json({ success: false, message: 'Sub-module must have actions object' });
            }

            for (const action of requiredActions) {
              if (typeof subModule.actions[action] !== 'boolean') {
                return res.status(400).json({ success: false, message: `Sub-module action '${action}' must be a boolean` });
              }
            }
          }
        }
      }

      // Verify clinic exists
      const clinic = await Clinic.findById(clinicId);
      if (!clinic) {
        return res.status(404).json({ success: false, message: 'Clinic not found' });
      }

      // Get admin user ID from verified token payload
      const adminObjectId = await resolveAdminObjectId(adminPayload);

      if (!adminObjectId) {
        // console.error('Unable to resolve admin id from token payload:', adminPayload);
        return res.status(401).json({ success: false, message: 'Invalid admin token payload' });
      }

      // Backfill legacy documents without role or grantedBy to prevent duplicate key violations
      await ClinicPermission.updateMany(
        { clinicId, $or: [{ role: { $exists: false } }, { role: null }] },
        {
          $set: {
            role: normalizedRole,
            grantedBy: adminObjectId,
            isActive: true,
            lastModified: new Date(),
          },
        },
        { runValidators: false }
      );

      // console.log('Creating/updating clinic permissions for clinic:', clinicId);
      
      // Create or update clinic permissions
      const clinicPermission = await ClinicPermission.findOneAndUpdate(
        { clinicId, role: normalizedRole },
        {
          clinicId,
          role: normalizedRole,
          permissions,
          grantedBy: adminObjectId,
          lastModified: new Date(),
          isActive: true,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true,
          context: 'query',
        }
      );

      // console.log('Clinic permission saved successfully:', clinicPermission._id);

      return res.status(200).json({ 
        success: true, 
        message: 'Clinic permissions updated successfully',
        data: clinicPermission 
      });
    } catch (error) {
      // console.error('Error updating clinic permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { clinicId, role } = req.body;

      if (!clinicId || !role) {
        return res.status(400).json({ success: false, message: 'Clinic ID and role are required' });
      }

      const normalizedRole = String(role).toLowerCase();
      if (!allowedRoles.includes(normalizedRole)) {
        return res.status(400).json({ success: false, message: 'Invalid role provided' });
      }

      await ClinicPermission.findOneAndUpdate(
        { clinicId, role: normalizedRole },
        { isActive: false }
      );

      return res.status(200).json({ 
        success: true, 
        message: 'Clinic permissions deactivated successfully' 
      });
    } catch (error) {
      // console.error('Error deactivating clinic permissions:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
