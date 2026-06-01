import dbConnect from "../../../../lib/database";
import Appointment from "../../../../models/Appointment";
import Clinic from "../../../../models/Clinic";
import User from "../../../../models/Users";
import Room from "../../../../models/Room";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Verify clinic authentication
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied. Clinic role required." });
    }

    let { clinicId, error, isAdmin } = await getClinicIdFromUser(clinicUser);
    if (error && !isAdmin) {
      return res.status(404).json({ message: error });
    }

    // Ensure clinicId is set correctly
    if (!clinicId && clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    }

    if (!clinicId) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // ✅ Check permission for updating appointments (only for agent, doctorStaff roles)
    // Clinic, doctor, and staff roles have full access by default, admin bypasses
    if (!isAdmin && clinicId && ["agent", "doctorStaff"].includes(clinicUser.role)) {
      const { checkAgentPermission } = await import("../../agent/permissions-helper");

      // Support both legacy and new module keys for appointments
      const moduleKeysToTry = [
        "clinic_ScheduledAppointment", // new key used on frontend
        "clinic_Appointment",          // legacy key
        "ScheduledAppointment",
        "Appointment",
      ];

      let hasPermission = false;
      let lastError = null;

      for (const moduleKey of moduleKeysToTry) {
        const result = await checkAgentPermission(
          clinicUser._id,
          moduleKey,
          "update"
        );

        if (result.hasPermission) {
          hasPermission = true;
          lastError = null;
          break;
        }

        lastError = result.error;

        // If module not found, continue trying other keys (backward compatibility)
        if (result.error && result.error.includes("not found in agent permissions")) {
          continue;
        }
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: lastError || "You do not have permission to update appointments",
        });
      }
    }
    const appointmentId = req.query.id;

    // Validate appointment ID
    if (!appointmentId || !appointmentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });
    }

    // Find the appointment and verify it belongs to this clinic
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.clinicId.toString() !== clinicId.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Appointment does not belong to your clinic." });
    }

    // Get update data from request body
    const {
      patientId,
      doctorId,
      roomId,
      status,
      followType,
      startDate,
      fromTime,
      toTime,
      referral,
      emergency,
      notes,
      treatment,
      serviceId,
      serviceIds,
    } = req.body;

    // Validate required fields
    const errors = {};
    const missingFields = [];
    const missingFieldLabels = [];

    if (!patientId) {
      errors.patientId = "Patient is required";
      missingFields.push("patientId");
      missingFieldLabels.push("Patient");
    }
    if (!doctorId) {
      errors.doctorId = "Doctor is required";
      missingFields.push("doctorId");
      missingFieldLabels.push("Doctor");
    }
    if (!roomId) {
      errors.roomId = "Room is required";
      missingFields.push("roomId");
      missingFieldLabels.push("Room");
    }
    if (!status) {
      errors.status = "Status is required";
      missingFields.push("status");
      missingFieldLabels.push("Status");
    }
    if (!followType) {
      errors.followType = "Follow type is required";
      missingFields.push("followType");
      missingFieldLabels.push("Follow Type");
    }
    if (!startDate) {
      errors.startDate = "Start date is required";
      missingFields.push("startDate");
      missingFieldLabels.push("Start Date");
    }
    if (!fromTime) {
      errors.fromTime = "From time is required";
      missingFields.push("fromTime");
      missingFieldLabels.push("From Time");
    }
    if (!toTime) {
      errors.toTime = "To time is required";
      missingFields.push("toTime");
      missingFieldLabels.push("To Time");
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
        missingFields,
        missingFieldLabels,
      });
    }

    // Validate doctor belongs to clinic
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctorStaff" || doctor.clinicId?.toString() !== clinicId.toString()) {
      return res.status(400).json({ success: false, message: "Invalid doctor. Doctor must belong to your clinic." });
    }

    // Validate room belongs to clinic
    const room = await Room.findById(roomId);
    if (!room || room.clinicId?.toString() !== clinicId.toString()) {
      return res.status(400).json({ success: false, message: "Invalid room. Room must belong to your clinic." });
    }

    // Validate status enum
    const validStatuses = ["booked", "enquiry", "Discharge", "Arrived", "Consultation", "Cancelled", "Approved", "Rescheduled", "Waiting", "Rejected", "Completed", "invoice"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    // Validate followType enum
    const validFollowTypes = ["first time", "follow up", "repeat"];
    if (!validFollowTypes.includes(followType)) {
      return res.status(400).json({ success: false, message: "Invalid follow type" });
    }

    // Validate referral enum
    // REMOVED: Allow any string for referral to support specific referral names
    // if (referral && !["direct", "referral"].includes(referral)) {
    //   return res.status(400).json({ success: false, message: "Invalid referral value" });
    // }

    // Validate emergency enum
    if (emergency && !["yes", "no"].includes(emergency)) {
      return res.status(400).json({ success: false, message: "Invalid emergency value" });
    }

    // Update appointment
    const updateData = {
      patientId,
      doctorId,
      roomId,
      status,
      followType,
      startDate: new Date(startDate),
      fromTime,
      toTime,
      referral: referral || "No",
      emergency: emergency || "no",
      notes: notes || "",
      treatment: treatment || "",
      serviceId: serviceId || null,
      serviceIds: Array.isArray(serviceIds) ? serviceIds : (serviceId ? [serviceId] : []),
    };

    // If status is "Arrived", set arrivedAt timestamp
    if (status === "Arrived" && appointment.status !== "Arrived") {
      updateData.arrivedAt = new Date();
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("patientId", "firstName lastName mobileNumber email emrNumber")
      .populate("doctorId", "name email")
      .populate("roomId", "name")
      .populate("serviceId", "name")
      .populate("serviceIds", "name")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}

