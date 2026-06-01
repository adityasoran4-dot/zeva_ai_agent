import dbConnect from "../../../../lib/database";
import Appointment from "../../../../models/Appointment";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Verify clinic authentication
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "agent", "doctor", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Clinic role required." });
    }

    let clinicId = null;
    if (clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (clinicUser.clinicId) {
      clinicId = clinicUser.clinicId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied. User not linked to a clinic." });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: "Appointment ID is required" });
    }

    // Find the appointment and verify it belongs to the clinic
    const appointment = await Appointment.findOne({
      _id: id,
      clinicId: clinicId,
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found or access denied" });
    }

    // Delete the appointment
    await Appointment.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
}

