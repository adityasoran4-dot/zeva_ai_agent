import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

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
      return res.status(404).json({ success: false, message: error });
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

    // GET: Fetch custom time slot settings from customTimeSlots field
    if (req.method === "GET") {
      const clinic = await Clinic.findById(clinicId).select("customTimeSlots");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }

      const customTimeSlots = clinic.customTimeSlots;

      // Return custom time slot settings
      return res.status(200).json({
        success: true,
        appointmentTimeSlots: {
          useCustomTimeSlots: customTimeSlots?.useCustomTimeSlots || false,
          customStartTime: customTimeSlots?.customStartTime || "",
          customEndTime: customTimeSlots?.customEndTime || "",
        },
      });
    }

    // PUT: Update custom time slot settings
    if (req.method === "PUT") {
      const { useCustomTimeSlots, customStartTime, customEndTime } = req.body;

      // Validate input
      if (useCustomTimeSlots === undefined) {
        return res.status(400).json({
          success: false,
          message: "useCustomTimeSlots is required",
        });
      }

      // If custom time slots are enabled, validate start and end times
      if (useCustomTimeSlots) {
        if (!customStartTime || !customEndTime) {
          return res.status(400).json({
            success: false,
            message: "customStartTime and customEndTime are required when useCustomTimeSlots is true",
          });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(customStartTime) || !timeRegex.test(customEndTime)) {
          return res.status(400).json({
            success: false,
            message: "Invalid time format. Use HH:MM (24-hour format)",
          });
        }

        // Validate that end time is after start time
        const [startHour, startMin] = customStartTime.split(":").map(Number);
        const [endHour, endMin] = customEndTime.split(":").map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (endMinutes <= startMinutes) {
          return res.status(400).json({
            success: false,
            message: "End time must be after start time",
          });
        }
      }

      // Update clinic customTimeSlots field
      const clinic = await Clinic.findByIdAndUpdate(
        clinicId,
        {
          $set: {
            customTimeSlots: {
              useCustomTimeSlots: useCustomTimeSlots || false,
              customStartTime: useCustomTimeSlots ? customStartTime : "",
              customEndTime: useCustomTimeSlots ? customEndTime : "",
            },
          },
        },
        { new: true, runValidators: true }
      ).select("customTimeSlots");

      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Custom time slots updated successfully",
        appointmentTimeSlots: {
          useCustomTimeSlots: clinic.customTimeSlots?.useCustomTimeSlots || false,
          customStartTime: clinic.customTimeSlots?.customStartTime || "",
          customEndTime: clinic.customTimeSlots?.customEndTime || "",
        },
      });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error in custom-time-slots API:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      error: error.toString()
    });
  }
}

