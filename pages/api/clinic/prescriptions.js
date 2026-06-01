import dbConnect from "../../../lib/database";
import Prescription from "../../../models/Prescription";
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
    const { appointmentId, patientId } = req.query;
    try {
      const query = { clinicId };
      if (appointmentId) query.appointmentId = appointmentId;
      if (patientId) query.patientId = patientId;

      const prescriptions = await Prescription.find(query)
        .populate("doctorId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ success: true, prescriptions });
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch prescriptions" });
    }
  }

  // ── POST (create or upsert per appointment) ───────────────────────────────────
  if (req.method === "POST") {
    const { appointmentId, patientId, medicines, aftercareInstructions, includeInPdf, pdfUrl } = req.body || {};

    if (!appointmentId || !patientId) {
      return res.status(400).json({ success: false, message: "appointmentId and patientId are required" });
    }
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ success: false, message: "At least one medicine is required" });
    }
    // Validate each medicine has a name
    for (const m of medicines) {
      if (!m.medicineName || !m.medicineName.trim()) {
        return res.status(400).json({ success: false, message: "Each medicine must have a name" });
      }
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

      // Upsert: one prescription per appointment
      const prescription = await Prescription.findOneAndUpdate(
        { clinicId, appointmentId },
        {
          $set: {
            patientId,
            doctorId,
            medicines: medicines.map((m) => ({
              medicineName: m.medicineName.trim(),
              dosage: m.dosage?.trim() || "",
              duration: m.duration?.trim() || "",
              notes: m.notes?.trim() || "",
            })),
            aftercareInstructions: aftercareInstructions?.trim() || "",
            includeInPdf: includeInPdf !== undefined ? !!includeInPdf : true,
            pdfUrl: pdfUrl || null,
          },
        },
        { new: true, upsert: true },
      ).populate("doctorId", "name email");

      return res.status(200).json({
        success: true,
        message: "Prescription saved successfully",
        prescription,
      });
    } catch (error) {
      console.error("Error saving prescription:", error);
      return res.status(500).json({ success: false, message: "Failed to save prescription" });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const { prescriptionId } = req.query || {};
    if (!prescriptionId) {
      return res.status(400).json({ success: false, message: "prescriptionId is required" });
    }
    try {
      const deleted = await Prescription.findOneAndDelete({ _id: prescriptionId, clinicId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Prescription not found" });
      }
      return res.status(200).json({ success: true, message: "Prescription deleted successfully" });
    } catch (error) {
      console.error("Error deleting prescription:", error);
      return res.status(500).json({ success: false, message: "Failed to delete prescription" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
