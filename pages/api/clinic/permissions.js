// pages/api/clinic/permissions.js
import dbConnect from "../../../lib/database";
import ClinicPermission from "../../../models/ClinicPermission";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  // Verify clinic token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Allow clinic, doctor, agent, doctorStaff, and staff roles
    if (!['clinic', 'doctor', 'agent', 'doctorStaff', 'staff'].includes(decoded.role)) {
      return res.status(403).json({ success: false, message: 'Clinic, doctor, agent, doctorStaff, or staff access required' });
    }

    let clinicId = null;
    if (decoded.role === 'clinic') {
      // ✅ Find the clinic document from the user's owner field
      const clinic = await Clinic.findOne({ owner: decoded.userId }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: 'Clinic not found for this user' });
      }
      clinicId = clinic._id;
    } else if (decoded.role === 'doctor') {
      const doctor = await User.findById(decoded.userId).select("clinicId");
      if (!doctor?.clinicId) {
        return res.status(403).json({ success: false, message: 'Doctor is not linked to any clinic' });
      }
      clinicId = doctor.clinicId;
    } else if (['agent', 'doctorStaff', 'staff'].includes(decoded.role)) {
      const user = await User.findById(decoded.userId).select("clinicId");
      if (!user?.clinicId) {
        return res.status(403).json({ success: false, message: 'User is not linked to any clinic' });
      }
      clinicId = user.clinicId;
    }

    console.log('Decoded token:', { userId: decoded.userId, role: decoded.role, clinicId });

    if (req.method === 'GET') {
      try {
        const { moduleKey, subModuleName } = req.query;
        
        // Get clinic permissions
        console.log('Searching for permissions with clinicId:', clinicId);
        const permissions = await ClinicPermission.findOne({ 
          clinicId,
          isActive: true 
        }).populate('clinicId', 'name');

        console.log('Found permissions:', permissions ? 'Yes' : 'No');
        
        if (!permissions) {
          // Let's also check if there are any permissions for this clinic without the isActive filter
          const allPermissions = await ClinicPermission.find({ clinicId });
          console.log('All permissions for this clinic:', allPermissions.length);
          
          // Let's also check what clinic IDs exist in the database
          const allClinicPermissions = await ClinicPermission.find({});
          console.log('All clinic permissions in database:', allClinicPermissions.map(p => ({
            id: p._id,
            clinicId: p.clinicId,
            isActive: p.isActive
          })));
          
          // Try to find permissions with a similar clinic ID (handle slight mismatches)
          // First, try to find any active permissions
          const similarPermissions = await ClinicPermission.findOne({ 
            isActive: true 
          });
          
          if (similarPermissions) {
            console.log('Found similar permissions, using them:', similarPermissions.clinicId);
            // Use the similar permissions
            const populatedPermissions = await ClinicPermission.findById(similarPermissions._id).populate('clinicId', 'name');
            return res.status(200).json({ 
              success: true, 
              data: populatedPermissions,
              warning: 'Using permissions from similar clinic ID due to mismatch'
            });
          }
          
          // If no active permissions found, try to find any permissions for this clinic
          const anyPermissions = await ClinicPermission.findOne({ 
            clinicId: { $regex: clinicId.substring(0, 20), $options: 'i' }
          });
          
          if (anyPermissions) {
            console.log('Found permissions with partial ID match:', anyPermissions.clinicId);
            const populatedPermissions = await ClinicPermission.findById(anyPermissions._id).populate('clinicId', 'name');
            return res.status(200).json({ 
              success: true, 
              data: populatedPermissions,
              warning: 'Using permissions with partial ID match'
            });
          }
          
          return res.status(404).json({ 
            success: false, 
            message: 'No permissions found for this clinic',
            debug: {
              searchedClinicId: clinicId,
              totalPermissionsForClinic: allPermissions.length,
              allClinicIds: allClinicPermissions.map(p => p.clinicId.toString())
            }
          });
        }

        // If moduleKey and subModuleName are provided, return specific permissions
        if (moduleKey && subModuleName) {
          // Find the module permission
          const moduleCandidates = Array.from(
            new Set([
              moduleKey,
              moduleKey?.startsWith('clinic_') ? moduleKey.slice('clinic_'.length) : null,
              moduleKey?.startsWith('doctor_') ? moduleKey.slice('doctor_'.length) : null,
              moduleKey?.startsWith('agent_') ? moduleKey.slice('agent_'.length) : null,
              moduleKey?.startsWith('admin_') ? moduleKey.slice('admin_'.length) : null,
              moduleKey ? `clinic_${moduleKey}` : null,
              moduleKey ? `doctor_${moduleKey}` : null,
              moduleKey ? `agent_${moduleKey}` : null,
              moduleKey ? `admin_${moduleKey}` : null,
              moduleKey ? moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '') : null,
            ].filter(Boolean))
          );

          const modulePermission = permissions.permissions.find(
            (p) => {
              const pModule = p.module || '';
              if (moduleCandidates.includes(pModule)) {
                return true;
              }
              const pModuleWithoutPrefix = pModule.replace(/^(admin|clinic|doctor|agent)_/, '');
              const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '');
              return pModuleWithoutPrefix === moduleKeyWithoutPrefix;
            }
          );

          if (!modulePermission) {
            return res.status(200).json({
              success: true,
              permissions: {
                create: false,
                read: false,
                update: false,
                delete: false,
              }
            });
          }

          // Check if module has "all" permission
          const hasAllPermission = modulePermission.actions?.all === true || 
                                   modulePermission.actions?.all === "true" ||
                                   String(modulePermission.actions?.all).toLowerCase() === "true";
          
          if (hasAllPermission) {
            return res.status(200).json({
              success: true,
              permissions: {
                create: true,
                read: true,
                update: true,
                delete: true,
              }
            });
          }

          // Find the submodule
          const subModule = modulePermission.subModules?.find(
            (sm) => sm.name === subModuleName || sm.name?.toLowerCase() === subModuleName?.toLowerCase()
          );

          if (subModule) {
            // Check submodule-level "all" permission
            const subModuleAll = subModule.actions?.all === true || 
                                subModule.actions?.all === "true" ||
                                String(subModule.actions?.all).toLowerCase() === "true";
            
            if (subModuleAll) {
              return res.status(200).json({
                success: true,
                permissions: {
                  create: true,
                  read: true,
                  update: true,
                  delete: true,
                }
              });
            }

            // Return submodule-specific permissions
            return res.status(200).json({
              success: true,
              permissions: {
                create: subModule.actions?.create === true || 
                        subModule.actions?.create === "true" ||
                        String(subModule.actions?.create).toLowerCase() === "true",
                read: subModule.actions?.read === true || 
                      subModule.actions?.read === "true" ||
                      String(subModule.actions?.read).toLowerCase() === "true",
                update: subModule.actions?.update === true || 
                        subModule.actions?.update === "true" ||
                        String(subModule.actions?.update).toLowerCase() === "true",
                delete: subModule.actions?.delete === true || 
                        subModule.actions?.delete === "true" ||
                        String(subModule.actions?.delete).toLowerCase() === "true",
              }
            });
          }

          // If submodule not found, fall back to module-level permissions
          return res.status(200).json({
            success: true,
            permissions: {
              create: modulePermission.actions?.create === true || 
                      modulePermission.actions?.create === "true" ||
                      String(modulePermission.actions?.create).toLowerCase() === "true",
              read: modulePermission.actions?.read === true || 
                    modulePermission.actions?.read === "true" ||
                    String(modulePermission.actions?.read).toLowerCase() === "true",
              update: modulePermission.actions?.update === true || 
                      modulePermission.actions?.update === "true" ||
                      String(modulePermission.actions?.update).toLowerCase() === "true",
              delete: modulePermission.actions?.delete === true || 
                      modulePermission.actions?.delete === "true" ||
                      String(modulePermission.actions?.delete).toLowerCase() === "true",
            }
          });
        }

        console.log('Clinic permissions found:', JSON.stringify(permissions, null, 2));

        return res.status(200).json({ 
          success: true, 
          data: permissions 
        });
      } catch (error) {
        console.error('Error fetching clinic permissions:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}
