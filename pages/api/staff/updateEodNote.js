import dbConnect from "../../../lib/database";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
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
        "update",
        "Add EOD Task"
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: permError || "You do not have permission to update EOD notes"
        });
      }
    } catch (permErr) {
      console.error("Permission check error:", permErr);
      return res.status(500).json({ message: "Error checking permissions" });
    }
  }

  try {
    const { noteId, note } = req.body;
    
    if (!noteId) {
      return res.status(400).json({ message: "Note ID is required" });
    }
    
    if (!note || note.trim() === "") {
      return res.status(400).json({ message: "Note cannot be empty" });
    }

    // Find the note in the user's eodNotes array
    const noteIndex = user.eodNotes.findIndex(
      (n) => n._id.toString() === noteId.toString()
    );

    if (noteIndex === -1) {
      return res.status(404).json({ message: "EOD note not found" });
    }

    // Update the note
    user.eodNotes[noteIndex].note = note.trim();
    await user.save();

    return res.status(200).json({
      message: "EOD note updated successfully",
      eodNotes: user.eodNotes,
    });
  } catch (error) {
    console.error("Update EOD Note Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

