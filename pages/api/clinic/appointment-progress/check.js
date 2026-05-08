import dbConnect from "../../../../lib/database";
import ProgressNote from "../../../../models/ProgressNote";
import Appointment from "../../../../models/Appointment";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // GET: Check if progress notes exist for a patient (across all appointments)
  if (req.method === "GET") {
    try {
      const { appointmentId, patientId } = req.query;

      if (!appointmentId && !patientId) {
        return res.status(400).json({
          success: false,
          message: "Either appointmentId or patientId is required",
        });
      }

      // Get clinicId for access control
      const { clinicId: userClinicId, isAdmin } = await getClinicIdFromUser(user);

      // Resolve patientId - if only appointmentId provided, look up its patientId
      let resolvedPatientId = patientId;
      let resolvedAppointmentId = appointmentId || null;

      if (appointmentId && !patientId) {
        const appt = await Appointment.findById(appointmentId).select("patientId").lean();
        if (appt) {
          resolvedPatientId = appt.patientId;
          console.log("Resolved patientId from appointmentId:", resolvedPatientId);
        }
      }

      if (!resolvedPatientId) {
        return res.status(200).json({
          success: true,
          data: { hasProgress: false, count: 0, notes: [], resolvedAppointmentId },
        });
      }

      // Always query by patientId to get ALL progress notes for this patient
      // regardless of which specific appointment they belong to
      const progressQuery = { patientId: resolvedPatientId };
      if (!isAdmin && userClinicId) {
        progressQuery.clinicId = userClinicId;
      }

      console.log("Progress check query (by patientId):", progressQuery);

      const progressNotes = await ProgressNote.find(progressQuery)
        .select("_id note noteDate doctorId patientId appointmentId")
        .populate("doctorId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      console.log("Progress notes found:", progressNotes.length, "for patientId:", resolvedPatientId);

      const hasProgress = progressNotes.length > 0;

      return res.status(200).json({
        success: true,
        data: {
          hasProgress,
          count: progressNotes.length,
          notes: progressNotes,
          resolvedAppointmentId,
          resolvedPatientId,
        },
      });
    } catch (error) {
      console.error("Error checking progress notes:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to check progress notes",
      });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}
