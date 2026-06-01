import dbConnect from "../../../lib/database";
import ProgressNote from "../../../models/ProgressNote";
import Appointment from "../../../models/Appointment";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  let clinicUser;
  try {
    clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  let clinicId = null;
  if (clinicUser.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }
    clinicId = clinic._id;
  } else if (["agent", "doctor", "doctorStaff"].includes(clinicUser.role)) {
    clinicId = clinicUser.clinicId;
    if (!clinicId) {
      return res.status(403).json({ success: false, message: "Access denied. User not linked to a clinic." });
    }
  } else {
    return res.status(403).json({ success: false, message: "Access denied." });
  }

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { patientId, appointmentId } = req.query;

    try {
      const query = { clinicId };
      if (patientId) query.patientId = patientId;
      if (appointmentId) query.appointmentId = appointmentId;

      const notes = await ProgressNote.find(query)
        .populate("doctorId", "name email")
        .sort({ noteDate: -1, createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        notes: notes.map((n) => ({
          _id: n._id,
          note: n.note,
          noteDate: n.noteDate,
          doctorId: n.doctorId,
          patientId: n.patientId,
          appointmentId: n.appointmentId,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching progress notes:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch progress notes" });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { appointmentId, patientId, note, noteDate } = req.body || {};

    if (!appointmentId || !patientId || !note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: "appointmentId, patientId, and note are required",
      });
    }

    try {
      const appointment = await Appointment.findOne({ _id: appointmentId, clinicId }).lean();
      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
      }

      const doctorId = appointment.doctorId;
      if (!doctorId) {
        return res.status(400).json({ success: false, message: "Appointment has no assigned doctor" });
      }

      const progressNote = await ProgressNote.create({
        clinicId,
        patientId,
        doctorId,
        appointmentId,
        note: note.trim(),
        noteDate: noteDate ? new Date(noteDate) : new Date(),
      });

      const populated = await ProgressNote.findById(progressNote._id)
        .populate("doctorId", "name email")
        .lean();

      return res.status(200).json({
        success: true,
        message: "Progress note saved successfully",
        note: {
          _id: populated._id,
          note: populated.note,
          noteDate: populated.noteDate,
          doctorId: populated.doctorId,
          patientId: populated.patientId,
          appointmentId: populated.appointmentId,
          createdAt: populated.createdAt,
          updatedAt: populated.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error saving progress note:", error);
      return res.status(500).json({ success: false, message: "Failed to save progress note" });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { noteId } = req.query || {};
    if (!noteId) {
      return res.status(400).json({ success: false, message: "noteId is required" });
    }
    try {
      const deleted = await ProgressNote.findOneAndDelete({ _id: noteId, clinicId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Progress note not found" });
      }
      return res.status(200).json({ success: true, message: "Progress note deleted successfully" });
    } catch (error) {
      console.error("Error deleting progress note:", error);
      return res.status(500).json({ success: false, message: "Failed to delete progress note" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
