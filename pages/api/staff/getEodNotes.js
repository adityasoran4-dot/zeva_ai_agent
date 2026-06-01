import dbConnect from "../../../lib/database";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent"],
    });

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
          "read",
          "Add EOD Task"
        );

        if (!hasPermission) {
          return res.status(403).json({
            message: permError || "You do not have permission to view EOD notes"
          });
        }
      } catch (permErr) {
        console.error("Permission check error:", permErr);
        return res.status(500).json({ message: "Error checking permissions" });
      }
    }

    // ✅ Date filter (optional)
    const { date } = req.query;

    let filteredNotes = user.eodNotes || [];

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filteredNotes = filteredNotes.filter((n) => {
        const noteDate = new Date(n.createdAt);
        return noteDate >= startOfDay && noteDate <= endOfDay;
      });
    }

    // Sort newest first
    filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      message: "EOD notes fetched successfully",
      eodNotes: filteredNotes,
    });
  } catch (error) {
    console.error("Get EOD Notes Error:", error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
