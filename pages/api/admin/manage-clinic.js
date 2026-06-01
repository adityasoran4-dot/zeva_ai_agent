// pages/api/admin/manage-clinic.ts
import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import ClinicPermission from "../../../models/ClinicPermission";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId, action } = req.body;
  if (!["approve", "decline", "delete"].includes(action)) {
    return res.status(400).json({ message: "Invalid action" });
  }

  try {
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    if (action === "approve") {
      clinic.isApproved = true;
      clinic.declined = false;
      await clinic.save();

      // Create default permissions with all actions enabled for the clinic
      try {
        // Fetch all navigation items for clinic role to build default permissions
        const navigationItems = await ClinicNavigationItem.find({
          role: 'clinic',
          isActive: true
        }).lean();

        // If no navigation items exist, create a minimal set of default permissions
        if (!navigationItems || navigationItems.length === 0) {
          console.log('⚠️ No navigation items found, creating minimal default permissions for clinic:', clinic._id);
          
          // Create minimal default permissions
          const minimalPermissions = [
            {
              module: 'clinic_dashboard',
              subModules: [],
              actions: {
                all: true,
                create: true,
                read: true,
                update: true,
                delete: true
              }
            },
            {
              module: 'clinic_health_center',
              subModules: [],
              actions: {
                all: true,
                create: true,
                read: true,
                update: true,
                delete: true
              }
            },
            {
              module: 'clinic_staff_management',
              subModules: [],
              actions: {
                all: true,
                create: true,
                read: true,
                update: true,
                delete: true
              }
            }
          ];

          await ClinicPermission.create({
            clinicId: clinic._id,
            role: 'clinic',
            permissions: minimalPermissions,
            grantedBy: adminUser?._id || clinic.owner,
            isActive: true,
            lastModified: new Date()
          });

          console.log('✅ Minimal default permissions created for approved clinic:', clinic._id);
        } else {
          // Build default permissions with all actions set to true
          const defaultPermissions = navigationItems.map(navItem => ({
            module: navItem.moduleKey,
            subModules: (navItem.subModules || []).map(subModule => ({
              name: subModule.name,
              path: subModule.path || '',
              icon: subModule.icon || '📄',
              order: subModule.order || 0,
              actions: {
                all: true,
                create: true,
                read: true,
                update: true,
                delete: true
              }
            })),
            actions: {
              all: true,
              create: true,
              read: true,
              update: true,
              delete: true
            }
          }));

          // Create ClinicPermission document with all permissions enabled
          await ClinicPermission.create({
            clinicId: clinic._id,
            role: 'clinic',
            permissions: defaultPermissions,
            grantedBy: adminUser?._id || clinic.owner,
            isActive: true,
            lastModified: new Date()
          });

          console.log('✅ Default permissions created for approved clinic:', clinic._id, 'with', defaultPermissions.length, 'modules');
        }
      } catch (permError) {
        console.error('⚠️ Error creating default permissions (non-fatal):', permError.message);
        // Continue even if permission creation fails - clinic is still approved
      }

      return res.status(200).json({ message: "Clinic approved" });
    }

    if (action === "decline") {
      clinic.isApproved = false;
      clinic.declined = true;
      await clinic.save();
      return res.status(200).json({ message: "Clinic declined" });
    }

    if (action === "delete") {
      await clinic.deleteOne();
      return res.status(200).json({ message: "Clinic deleted" });
    }

  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
