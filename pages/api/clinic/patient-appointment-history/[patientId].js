import dbConnect from "../../../../lib/database";
import Appointment from "../../../../models/Appointment";
import Clinic from "../../../../models/Clinic";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Verify clinic authentication
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    
    // Allow clinic, agent, doctor, and doctorStaff roles
    if (!["clinic", "agent", "doctor", "doctorStaff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Clinic, agent, doctor, or doctorStaff role required." });
    }

    // Find the clinic associated with this user
    let clinicId = null;
    if (clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).lean();
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (["agent", "doctor", "doctorStaff"].includes(clinicUser.role)) {
      // For agent, doctor, and doctorStaff, get clinicId from user's clinicId field
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res.status(403).json({ success: false, message: "Access denied. User not linked to a clinic." });
      }
    }

    // ✅ Check permission for reading appointments (only for agent, doctorStaff roles)
    // Clinic and doctor roles have full access by default
    if (clinicId && ["agent", "doctorStaff"].includes(clinicUser.role)) {
      const { checkAgentPermission } = await import("../../agent/permissions-helper");
      const result = await checkAgentPermission(
        clinicUser._id,
        "clinic_Appointment",
        "read"
      );

      if (!result.hasPermission && result.error && result.error.includes("not found in agent permissions")) {
        console.log(`[patient-appointment-history] Module clinic_Appointment not found in permissions for user ${clinicUser._id}, allowing access by default`);
      } else if (!result.hasPermission) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to view appointment history"
        });
      }
    }

    const patientId = req.query.patientId;

    // Validate patient ID
    if (!patientId || !patientId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid patient ID" });
    }

    // Fetch all appointments for this patient in this clinic
    const appointments = await Appointment.find({
      clinicId,
      patientId,
    })
      .populate("doctorId", "name email")
      .populate("roomId", "name")
      .populate("patientId", "firstName lastName mobileNumber email emrNumber")
      .sort({ startDate: -1, fromTime: -1 }) // Most recent first
      .lean();

    // Format appointments for response
    const formattedAppointments = appointments.map((apt) => ({
      _id: apt._id.toString(),
      visitId: apt.visitId || `VISIT-${apt._id.toString().slice(-6).toUpperCase()}`,
      patientId: apt.patientId?._id?.toString(),
      patientName: apt.patientId
        ? `${apt.patientId.firstName || ""} ${apt.patientId.lastName || ""}`.trim()
        : "Unknown",
      patientEmail: apt.patientId?.email || "",
      patientMobile: apt.patientId?.mobileNumber || "",
      emrNumber: apt.patientId?.emrNumber || "",
      doctorId: apt.doctorId?._id?.toString(),
      doctorName: apt.doctorId?.name || "Unknown",
      doctorEmail: apt.doctorId?.email || "",
      roomId: apt.roomId?._id?.toString(),
      roomName: apt.roomId?.name || "Unknown",
      status: apt.status,
      followType: apt.followType,
      startDate: apt.startDate ? new Date(apt.startDate).toISOString() : null,
      fromTime: apt.fromTime,
      toTime: apt.toTime,
      referral: apt.referral || "direct",
      emergency: apt.emergency || "no",
      notes: apt.notes || "",
      arrivedAt: apt.arrivedAt ? new Date(apt.arrivedAt).toISOString() : null,
      createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : null,
      updatedAt: apt.updatedAt ? new Date(apt.updatedAt).toISOString() : null,
    }));

    return res.status(200).json({
      success: true,
      appointments: formattedAppointments,
      total: formattedAppointments.length,
    });
  } catch (error) {
    console.error("Error fetching appointment history:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

