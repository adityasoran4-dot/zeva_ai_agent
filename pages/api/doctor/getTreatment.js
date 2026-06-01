import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // Get the logged-in user (authentication is optional for public access)
      const me = await getUserFromReq(req);
      
      // If no user is authenticated, allow public access (return all treatments)
      if (!me) {
        // console.log("getTreatment - Public access: No authentication, returning all treatments");
        const treatments = await Treatment.find({}).lean();
        return res.status(200).json({ treatments });
      }

      // console.log("getTreatment - User role:", me.role, "User ID:", me._id);

      // Allow clinic, doctor, admin roles without permission checks
      if (['clinic', 'doctor', 'admin'].includes(me.role)) {
        // These roles can access treatments without permission checks
        // console.log("getTreatment - Allowing access for role:", me.role);
      } else if (['agent', 'staff', 'doctorStaff'].includes(me.role)) {
        // For agent, staff, and doctorStaff, check clinic permissions
        try {
          // console.log("getTreatment - Checking permission for role:", me.role);
          
          // Get clinic ID for the user
          const { clinicId, error: clinicError, isAdmin } = await getClinicIdFromUser(me);
          if (clinicError && !isAdmin) {
            return res.status(403).json({
              success: false,
              message: clinicError || "User not linked to any clinic",
              role: me.role
            });
          }

          if (clinicId) {
            // Determine which role to check permissions for
            let roleForPermission = null;
            if (me.role === "doctor") {
              roleForPermission = "doctor";
            } else if (me.role === "clinic") {
              roleForPermission = "clinic";
            } else if (me.role === "staff" || me.role === "agent" || me.role === "doctorStaff") {
              // Staff, agent, and doctorStaff should check clinic-level permissions
              roleForPermission = "clinic";
            }

            // Check clinic permission for add_treatment module (read access)
            const { hasPermission, error: permissionError } = await checkClinicPermission(
              clinicId,
              "add_treatment", // moduleKey
              "read", // action
              null, // subModuleName
              roleForPermission
            );

            // console.log("getTreatment - Permission result (clinic):", { hasPermission, error: permissionError });

            // If read is not granted, allow access when create OR delete is granted
            let canAccess = hasPermission;
            if (!canAccess) {
              const { hasPermission: hasCreate } = await checkClinicPermission(
                clinicId,
                "add_treatment",
                "create",
                null,
                roleForPermission
              );
              canAccess = hasCreate;
            }
            if (!canAccess) {
              const { hasPermission: hasDelete } = await checkClinicPermission(
                clinicId,
                "add_treatment",
                "delete",
                null,
                roleForPermission
              );
              canAccess = hasDelete;
            }

            if (!canAccess) {
              return res.status(403).json({
                success: false,
                message: permissionError || "You do not have permission to view treatments",
                role: me.role
              });
            }
          } else {
            // For agent role, fall back to agent permissions if no clinicId
            if (me.role === "agent") {
              const { hasPermission, error: permissionError } = await checkAgentPermission(
                me._id,
                "add_treatment", // moduleKey
                "read", // action
                null // subModuleName
              );

              // If read is not granted, allow access when create OR delete is granted
              let canAccess = hasPermission;
              if (!canAccess) {
                const { hasPermission: hasCreate } = await checkAgentPermission(
                  me._id,
                  "add_treatment",
                  "create",
                  null
                );
                canAccess = hasCreate;
              }
              if (!canAccess) {
                const { hasPermission: hasDelete } = await checkAgentPermission(
                  me._id,
                  "add_treatment",
                  "delete",
                  null
                );
                canAccess = hasDelete;
              }

              if (!canAccess) {
                return res.status(403).json({
                  success: false,
                  message: permissionError || "You do not have permission to view treatments",
                  role: me.role
                });
              }
            } else {
              return res.status(403).json({
                success: false,
                message: "User not linked to any clinic",
                role: me.role
              });
            }
          }
        } catch (permissionError) {
          // console.error("Permission check error:", permissionError);
          // If permission check fails, deny access
          return res.status(403).json({
            success: false,
            message: "Permission check failed. You may not have access to view treatments.",
            error: permissionError.message,
            role: me.role
          });
        }
      } else {
        // Unknown role, deny access
        // console.log("getTreatment - Unknown role:", me.role);
        return res.status(403).json({
          success: false,
          message: "Access denied. Your role does not have access to treatments.",
          role: me.role
        });
      }
      
      const treatments = await Treatment.find({}).lean();
      return res.status(200).json({ treatments });
    } catch (error) {
      // console.error("Error fetching treatments:", error);
      return res.status(500).json({ message: "Error fetching treatments" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
