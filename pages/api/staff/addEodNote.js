import dbConnect from "../../../lib/database";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  let user;
  try {
    user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent"],
    });
  } catch (error) {
    return res.status(error.status || 401).json({ message: error.message });
  }

  // Check permissions for clinic/agent/doctor roles
  if (["clinic", "agent", "doctor", "doctorStaff"].includes(user.role)) {
    try {
      const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
      if (clinicError || !clinicId) {
        return res.status(403).json({ 
          message: clinicError || "Unable to determine clinic access" 
        });
      }

      const { hasPermission, error: permError } = await checkClinicPermission(
        clinicId,
        "clinic_staff_management",
        "create",
        "Add EOD Task"
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: permError || "You do not have permission to create EOD notes"
        });
      }
    } catch (permErr) {
      console.error("Permission check error:", permErr);
      return res.status(500).json({ message: "Error checking permissions" });
    }
  }

  try {
    const { note } = req.body;
    if (!note || note.trim() === "") {
      return res.status(400).json({ message: "Note cannot be empty" });
    }

    user.eodNotes.push({ note });
    await user.save();

    return res.status(200).json({
      message: "EOD note added successfully",
      eodNotes: user.eodNotes,
    });
  } catch (error) {
    console.error("EOD Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
