import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }
    
    // Check permissions for clinic/agent/doctor roles
    if (["clinic", "agent", "doctor", "doctorStaff"].includes(me.role)) {
      try {
        const { clinicId, error: clinicError } = await getClinicIdFromUser(me);
        if (clinicError || !clinicId) {
          // For agents, fall back to agent permission check
          if (me.role === 'agent' || me.role === 'doctorStaff') {
            const { hasPermission } = await checkAgentPermission(me._id, "admin_staff_management", "delete", "Create Vendor");
            if (!hasPermission) {
              return res.status(403).json({ 
                success: false,
                message: "Permission denied: You do not have delete permission for Create Vendor submodule" 
              });
            }
          } else {
            return res.status(403).json({ 
              success: false,
              message: clinicError || "Unable to determine clinic access" 
            });
          }
        } else {
          const { hasPermission, error: permError } = await checkClinicPermission(
            clinicId,
            "clinic_staff_management",
            "delete",
            "Add Vendor"
          );

          if (!hasPermission) {
            return res.status(403).json({
              success: false,
              message: permError || "You do not have permission to delete vendors"
            });
          }
        }
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
        return res.status(500).json({ success: false, message: "Error checking permissions" });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Access denied. Admin or agent role required" });
    }
    
    const deleted = await Vendor.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }
    res.status(200).json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
