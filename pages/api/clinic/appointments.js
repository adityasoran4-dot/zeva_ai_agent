import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import Service from "../../../models/Service";
import Clinic from "../../../models/Clinic";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import { formatDoctorTreatments } from "../../../server/staff/doctorTreatmentService";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../bullmq/workflow";

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Verify clinic authentication
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (
      !["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(
        clinicUser.role,
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied. Clinic role required.",
        });
    }

    let { clinicId, error, isAdmin } = await getClinicIdFromUser(clinicUser);
    if (error && !isAdmin) {
      return res.status(404).json({ message: error });
    }

    // Ensure clinicId is set correctly
    if (!clinicId && clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).select(
        "_id",
      );
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    }

    if (!clinicId) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found" });
    }

    // GET: Fetch appointments for the clinic
    if (req.method === "GET") {
      // ✅ Check permission for reading appointments (only for agent, doctorStaff roles)
      // Clinic, doctor, and staff roles have full access by default, admin bypasses
      if (
        !isAdmin &&
        clinicId &&
        ["agent", "doctorStaff"].includes(clinicUser.role)
      ) {
        const { checkAgentPermission } =
          await import("../agent/permissions-helper");
        const result = await checkAgentPermission(
          clinicUser._id,
          "clinic_Appointment",
          "read",
        );

        // If module doesn't exist in permissions yet, allow access by default
        if (
          !result.hasPermission &&
          result.error &&
          result.error.includes("not found in agent permissions")
        ) {
          console.log(
            `[appointments] Module clinic_Appointment not found in permissions for user ${clinicUser._id}, allowing access by default`,
          );
        } else if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message:
              result.error || "You do not have permission to view appointments",
          });
        }
      }

      const { date, doctorId, roomId } = req.query;

      let query = { clinicId };

      // If user is doctorStaff, only show their appointments
      if (clinicUser.role === "doctorStaff") {
        query.doctorId = clinicUser._id;
      }

      let parsedDateMatch = null; // Store for debugging later

      // Filter by date if provided
      // Normalize date to UTC midnight for consistent querying
      if (date) {
        console.log("=== APPOINTMENTS QUERY DEBUG ===");
        console.log("Received date query parameter:", date);
        console.log("Type of date:", typeof date);

        // Parse date string (expected format: YYYY-MM-DD)
        parsedDateMatch = String(date)
          .trim()
          .match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (parsedDateMatch) {
          const year = parseInt(parsedDateMatch[1], 10);
          const month = parseInt(parsedDateMatch[2], 10) - 1; // Month is 0-indexed
          const day = parseInt(parsedDateMatch[3], 10);

          console.log(
            `Parsed date components: year=${year}, month=${month + 1}, day=${day}`,
          );

          // Create start of day in UTC (00:00:00.000)
          const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          // Create end of day in UTC (23:59:59.999)
          const endOfDay = new Date(
            Date.UTC(year, month, day, 23, 59, 59, 999),
          );

          console.log("Query startOfDay (UTC):", startOfDay.toISOString());
          console.log("Query endOfDay (UTC):", endOfDay.toISOString());
          console.log("Query startOfDay timestamp:", startOfDay.getTime());
          console.log("Query endOfDay timestamp:", endOfDay.getTime());

          // Use a wider range to catch any timezone edge cases
          // Start from previous day 12:00 UTC to next day 12:00 UTC to ensure we catch all dates
          const safeStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          safeStart.setUTCHours(0, 0, 0, 0);
          const safeEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
          safeEnd.setUTCHours(23, 59, 59, 999);

          query.startDate = { $gte: safeStart, $lte: safeEnd };
        } else {
          // Fallback: try parsing as-is, but normalize to UTC
          console.log(
            "Date format didn't match YYYY-MM-DD, trying fallback parsing",
          );
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getUTCFullYear();
            const month = parsedDate.getUTCMonth();
            const day = parsedDate.getUTCDate();
            console.log(
              `Fallback parsed: year=${year}, month=${month + 1}, day=${day}`,
            );
            const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
            const endOfDay = new Date(
              Date.UTC(year, month, day, 23, 59, 59, 999),
            );
            console.log("Fallback startOfDay (UTC):", startOfDay.toISOString());
            console.log("Fallback endOfDay (UTC):", endOfDay.toISOString());
            query.startDate = { $gte: startOfDay, $lte: endOfDay };
          } else {
            console.log("ERROR: Could not parse date:", date);
          }
        }
        console.log(
          "Final query.startDate:",
          JSON.stringify(
            {
              $gte: query.startDate?.$gte?.toISOString(),
              $lte: query.startDate?.$lte?.toISOString(),
            },
            null,
            2,
          ),
        );
        console.log("==");
      }

      // Filter by doctor if provided
      if (doctorId) {
        query.doctorId = doctorId;
      }

      // Filter by room if provided
      if (roomId) {
        query.roomId = roomId;
      }

      // IMPORTANT: Do NOT filter by status - return ALL appointments regardless of status
      // (booked, Arrived, Consultation, Cancelled, etc. should all be shown)

      const appointments = await Appointment.find(query)
        .populate(
          "patientId",
          "firstName lastName mobileNumber email invoiceNumber emrNumber gender",
        )
        .populate("doctorId", "name email")
        .populate("roomId", "name")
        .populate("serviceId", "name")
        .populate("serviceIds", "name")
        .sort({ startDate: 1, fromTime: 1 })
        .lean();

      // Fetch doctor treatments for each unique doctor
      const doctorIds = [
        ...new Set(
          appointments
            .map((apt) => apt.doctorId?._id?.toString())
            .filter(Boolean),
        ),
      ];
      const doctorTreatmentsMap = {};

      for (const doctorId of doctorIds) {
        try {
          const treatments = await formatDoctorTreatments(doctorId);
          doctorTreatmentsMap[doctorId] = treatments.map((t) => ({
            mainTreatment: t.treatmentName,
            mainTreatmentSlug: t.treatmentId,
            subTreatments: t.subcategories || [],
          }));
        } catch (error) {
          console.error(
            `Error fetching treatments for doctor ${doctorId}:`,
            error,
          );
          doctorTreatmentsMap[doctorId] = [];
        }
      }

      // Debug: Log bookedFrom values and dates from database
      console.log("=== FETCHING APPOINTMENTS ===");
      console.log(`Found ${appointments.length} appointments matching query`);
      appointments.forEach((apt) => {
        console.log(`Appointment ${apt._id}:`);
        console.log(
          `  - bookedFrom="${apt.bookedFrom}" (type: ${typeof apt.bookedFrom})`,
        );
        console.log(`  - startDate (raw): ${apt.startDate}`);
        console.log(`  - startDate (ISO): ${apt.startDate?.toISOString()}`);
        console.log(
          `  - startDate (UTC date): ${apt.startDate ? new Date(apt.startDate).toISOString().split("T")[0] : "N/A"}`,
        );
      });

      // Also log what dates exist in DB for debugging
      if (date && appointments.length === 0) {
        console.log(
          "⚠️ No appointments found for query date. Checking what dates exist in DB...",
        );
        const allAppointments = await Appointment.find({ clinicId })
          .select("startDate _id")
          .limit(20)
          .sort({ startDate: -1 })
          .lean();
        console.log(`Sample of dates in DB (last 20):`);
        allAppointments.forEach((apt) => {
          if (apt.startDate) {
            const dbDate = new Date(apt.startDate);
            const dbDateStr = dbDate.toISOString().split("T")[0];
            const dbDateUTC = new Date(
              Date.UTC(
                dbDate.getUTCFullYear(),
                dbDate.getUTCMonth(),
                dbDate.getUTCDate(),
                0,
                0,
                0,
                0,
              ),
            );
            const dbDateUTCStr = dbDateUTC.toISOString().split("T")[0];
            console.log(`  - ID: ${apt._id}`);
            console.log(`    Raw ISO: ${dbDate.toISOString()}`);
            console.log(`    Date string: ${dbDateStr}`);
            console.log(`    UTC normalized: ${dbDateUTCStr}`);
            console.log(`    Timestamp: ${dbDate.getTime()}`);
          }
        });

        // Also check if there are any appointments with dates close to the query date
        if (parsedDateMatch) {
          const year = parseInt(parsedDateMatch[1], 10);
          const month = parseInt(parsedDateMatch[2], 10) - 1;
          const day = parseInt(parsedDateMatch[3], 10);

          // Check day before and after
          const dayBefore = new Date(
            Date.UTC(year, month, day - 1, 0, 0, 0, 0),
          );
          const dayAfter = new Date(
            Date.UTC(year, month, day + 1, 23, 59, 59, 999),
          );

          const nearbyAppointments = await Appointment.find({
            clinicId,
            startDate: { $gte: dayBefore, $lte: dayAfter },
          })
            .select("startDate _id")
            .limit(10)
            .lean();

          console.log(`Appointments within ±1 day of query date (${date}):`);
          nearbyAppointments.forEach((apt) => {
            if (apt.startDate) {
              const aptDate = new Date(apt.startDate);
              console.log(`  - ID: ${apt._id}, Date: ${aptDate.toISOString()}`);
            }
          });
        }
      }
      console.log("");

      return res.status(200).json({
        success: true,
        appointments: appointments.map((apt) => ({
          _id: apt._id.toString(),
          patientId: apt.patientId?._id?.toString(),
          patientName: apt.patientId
            ? `${apt.patientId.firstName || ""} ${apt.patientId.lastName || ""}`.trim()
            : "Unknown",
          doctorId: apt.doctorId?._id?.toString(),
          doctorName: apt.doctorId?.name || "Unknown",
          roomId: apt.roomId?._id?.toString(),
          roomName: apt.roomId?.name || "Unknown",
          status: apt.status,
          followType: apt.followType,
          startDate: apt.startDate,
          fromTime: apt.fromTime,
          toTime: apt.toTime,
          referral: apt.referral,
          emergency: apt.emergency,
          notes: apt.notes,
          patientInvoiceNumber: apt.patientId?.invoiceNumber || null,
          patientEmrNumber: apt.patientId?.emrNumber || null,
          patientGender: apt.patientId?.gender || null,
          patientEmail: apt.patientId?.email || null,
          patientMobileNumber: apt.patientId?.mobileNumber || null,
          bookedFrom:
            apt.bookedFrom === "room" || apt.bookedFrom === "doctor"
              ? apt.bookedFrom
              : apt.bookedFrom
                ? apt.bookedFrom
                : "doctor", // Include booking source, default to "doctor" for old appointments without this field
          doctorTreatments:
            doctorTreatmentsMap[apt.doctorId?._id?.toString()] || [],
          serviceId: apt.serviceId?._id?.toString() || null,
          serviceName: apt.serviceId?.name || null,
          serviceIds: Array.isArray(apt.serviceIds)
            ? apt.serviceIds.map((s) => s?._id?.toString()).filter(Boolean)
            : [],
          serviceNames: (() => {
            const fromServiceIds = Array.isArray(apt.serviceIds)
              ? apt.serviceIds.map((s) => s?.name || "").filter(Boolean)
              : [];
            const fromServiceId = apt.serviceId?.name || "";
            const combined = fromServiceId
              ? [
                  fromServiceId,
                  ...fromServiceIds.filter((n) => n !== fromServiceId),
                ]
              : fromServiceIds;
            return combined;
          })(),
          createdAt: apt.createdAt,
        })),
      });
    }

    // POST: Create a new appointment
    if (req.method === "POST") {
      // ✅ Check permission for creating appointments (only for agent, doctorStaff roles)
      // Clinic, doctor, and staff roles have full access by default, admin bypasses
      if (
        !isAdmin &&
        clinicId &&
        ["agent", "doctorStaff"].includes(clinicUser.role)
      ) {
        const { checkAgentPermission } =
          await import("../agent/permissions-helper");
        const result = await checkAgentPermission(
          clinicUser._id,
          "clinic_Appointment",
          "create",
        );

        // If module doesn't exist in permissions yet, allow access by default
        if (
          !result.hasPermission &&
          result.error &&
          result.error.includes("not found in agent permissions")
        ) {
          console.log(
            `[appointments] Module clinic_Appointment not found in permissions for user ${clinicUser._id}, allowing access by default`,
          );
        } else if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message:
              result.error ||
              "You do not have permission to create appointments",
          });
        }
      }

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
        bookedFrom, // Track which column the appointment was booked from
      } = req.body;

      // Basic required-field validation with user-friendly errors
      const errors = {};
      const missingFields = [];
      const missingFieldLabels = [];
      const requireField = (value, field, label) => {
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field] = `${label} is required`;
          missingFields.push(field);
          missingFieldLabels.push(label);
        }
      };
      requireField(patientId, "patientId", "Patient");
      // Either doctorId or roomId is required, but both are checked individually below
      // requireField(doctorId, "doctorId", "Doctor");
      // requireField(roomId, "roomId", "Room");
      if (!doctorId && !roomId) {
        errors.doctorId = "Either Doctor or Room is required";
        missingFields.push("doctorId");
        missingFieldLabels.push("Doctor or Room");
      }
      requireField(status, "status", "Status");
      requireField(followType, "followType", "Follow Type");
      requireField(startDate, "startDate", "Appointment Date");
      requireField(fromTime, "fromTime", "From Time");
      requireField(toTime, "toTime", "To Time");
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Please fill all required fields",
          errors,
          missingFields,
          missingFieldLabels,
        });
      }

      // Debug log to verify bookedFrom is being received
      console.log("=== API RECEIVING APPOINTMENT ===");
      console.log("Received bookedFrom from request:", bookedFrom);
      console.log("Type of bookedFrom:", typeof bookedFrom);
      console.log("bookedFrom === 'room':", bookedFrom === "room");
      console.log("bookedFrom === 'doctor':", bookedFrom === "doctor");
      console.log(
        "bookedFrom value (stringified):",
        JSON.stringify(bookedFrom),
      );
      console.log("Request body bookedFrom:", req.body.bookedFrom);
      console.log("Full request body:", JSON.stringify(req.body, null, 2));
      console.log("==================================");

      // Ensure bookedFrom is a valid value - use explicit string comparison
      // CRITICAL: Check the actual value received from the request
      let validBookedFrom;
      const receivedValue = req.body.bookedFrom;
      console.log("🔍 API received bookedFrom value:", receivedValue);
      console.log("🔍 Type of received value:", typeof receivedValue);
      console.log("🔍 Is it exactly 'room'?", receivedValue === "room");
      console.log("🔍 Is it exactly 'doctor'?", receivedValue === "doctor");
      console.log(
        "🔍 String comparison 'room':",
        String(receivedValue) === "room",
      );
      console.log(
        "🔍 String comparison 'doctor':",
        String(receivedValue) === "doctor",
      );

      if (receivedValue === "room" || String(receivedValue) === "room") {
        validBookedFrom = "room";
        console.log("✅ Setting validBookedFrom to 'room'");
      } else if (
        receivedValue === "doctor" ||
        String(receivedValue) === "doctor"
      ) {
        validBookedFrom = "doctor";
        console.log("✅ Setting validBookedFrom to 'doctor'");
      } else {
        validBookedFrom = "doctor";
        console.log(
          "⚠️ bookedFrom is not 'room' or 'doctor', defaulting to 'doctor'. Received value was:",
          receivedValue,
          "Type:",
          typeof receivedValue,
        );
      }
      console.log(
        "🎯 Final validBookedFrom that will be saved:",
        validBookedFrom,
      );

      // REMOVED: All validation checks
      // Allow unlimited bookings - no restrictions on doctor or patient concurrency
      // This enables maximum flexibility for all booking scenarios

      // Add missing date parsing logic
      // Normalize startDate to UTC midnight for consistent comparison
      let appointmentDate;
      if (typeof startDate === "string") {
        const dateMatch = String(startDate)
          .trim()
          .match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10) - 1;
          const day = parseInt(dateMatch[3], 10);
          appointmentDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        } else {
          const parsed = new Date(startDate);
          if (!isNaN(parsed.getTime())) {
            const year = parsed.getUTCFullYear();
            const month = parsed.getUTCMonth();
            const day = parsed.getUTCDate();
            appointmentDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          } else {
            appointmentDate = new Date(startDate);
          }
        }
      } else {
        // If it's already a Date object, normalize it
        const year = startDate.getUTCFullYear();
        const month = startDate.getUTCMonth();
        const day = startDate.getUTCDate();
        appointmentDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      }

      // Query for appointments on the same date (using date range)
      const startOfDay = new Date(appointmentDate);
      const endOfDay = new Date(
        Date.UTC(
          appointmentDate.getUTCFullYear(),
          appointmentDate.getUTCMonth(),
          appointmentDate.getUTCDate(),
          23,
          59,
          59,
          999,
        ),
      );

      // Validation 2: Check for duplicate booking for the same patient
      // Allow multiple bookings for the same patient - enable maximum flexibility
      /*
      const duplicateQuery = {
        clinicId,
        patientId, // Same patient
        startDate: { $gte: startOfDay, $lte: endOfDay },
        fromTime,
        toTime,
        $or: [],
      };

      if (roomId) {
        duplicateQuery.$or.push({ roomId: roomId });
      }
      if (doctorId) {
        duplicateQuery.$or.push({ doctorId: doctorId });
      }

      // Only run duplicate check if we have either roomId or doctorId
      if (duplicateQuery.$or.length > 0) {
        const duplicateAppointment = await Appointment.findOne(duplicateQuery);

        if (duplicateAppointment) {
          return res.status(400).json({
            success: false,
            message: "This appointment already exists",
          });
        }
      }
      */

      // Validation 3 removed for clinic, agent, and doctorStaff roles (handled below)

      // UPDATED POLICY:
      // Allow clinic, agent, and doctorStaff to book different doctors in the same room at the same time
      // Skip the "different doctor same room/time" validation for these roles
      // Keep restriction for other roles (e.g., doctor, staff, unknown)
      // Note: "same doctor same room/time" restriction still applies to prevent duplicate bookings by the same doctor
      if (
        roomId &&
        !["clinic", "agent", "doctorStaff"].includes(clinicUser.role)
      ) {
        const differentDoctorSameRoomAppointment = await Appointment.findOne({
          clinicId,
          roomId,
          doctorId: { $ne: doctorId },
          startDate: { $gte: startOfDay, $lte: endOfDay },
          $or: [
            { fromTime, toTime },
            {
              $or: [
                { fromTime: { $gte: fromTime, $lt: toTime } },
                { toTime: { $gt: fromTime, $lte: toTime } },
                { fromTime: { $lte: fromTime }, toTime: { $gte: toTime } },
              ],
            },
          ],
        });
        if (differentDoctorSameRoomAppointment) {
          return res.status(400).json({
            success: false,
            message:
              "Another doctor is already booked in this room at this time",
          });
        }
      }

      // Create appointment
      console.log("💾 Creating appointment with bookedFrom:", validBookedFrom);
      // Ensure appointmentDate is normalized to UTC midnight
      const normalizedAppointmentDate =
        appointmentDate instanceof Date
          ? new Date(
              Date.UTC(
                appointmentDate.getUTCFullYear(),
                appointmentDate.getUTCMonth(),
                appointmentDate.getUTCDate(),
                0,
                0,
                0,
                0,
              ),
            )
          : appointmentDate;

      const appointmentData = {
        clinicId,
        patientId,
        doctorId,
        roomId,
        status,
        followType,
        startDate: normalizedAppointmentDate, // Use the normalized date
        fromTime,
        toTime,
        referral: referral || "direct",
        emergency: emergency || "no",
        notes: notes || "",
        createdBy: clinicUser._id,
        bookedFrom: validBookedFrom, // Use validated value - explicitly set to override default
        customTimeSlots: req.body.customTimeSlots || undefined, // Save custom time slots if provided
      };
      // Optional service selection
      if (req.body.serviceId) {
        try {
          const svc = await Service.findOne({
            _id: req.body.serviceId,
            clinicId,
          })
            .select("_id")
            .lean();
          if (!svc) {
            return res
              .status(400)
              .json({
                success: false,
                message: "Selected service not found for this clinic",
              });
          }
          appointmentData.serviceId = req.body.serviceId;
        } catch {
          return res
            .status(400)
            .json({ success: false, message: "Invalid service selected" });
        }
      }
      if (
        Array.isArray(req.body.serviceIds) &&
        req.body.serviceIds.length > 0
      ) {
        const ids = req.body.serviceIds.filter(Boolean).map((id) => String(id));
        const svcs = await Service.find({ _id: { $in: ids }, clinicId })
          .select("_id")
          .lean();
        const validIds = svcs.map((s) => s._id?.toString()).filter(Boolean);
        appointmentData.serviceIds = validIds;
      }
      console.log(
        "💾 Appointment data being saved:",
        JSON.stringify(appointmentData, null, 2),
      );

      const appointment = await Appointment.create(appointmentData);

      console.log("✅ Appointment created. ID:", appointment._id);
      console.log(
        "✅ Appointment bookedFrom immediately after create:",
        appointment.bookedFrom,
      );
      console.log(
        "✅ Appointment bookedFrom type:",
        typeof appointment.bookedFrom,
      );

      // Force-set bookedFrom in case schema hot-reload missed the new field
      if (appointment.bookedFrom !== validBookedFrom) {
        console.log(
          "⚠ bookedFrom on created doc is",
          appointment.bookedFrom,
          "-> forcing update to",
          validBookedFrom,
        );
        await Appointment.updateOne(
          { _id: appointment._id },
          { $set: { bookedFrom: validBookedFrom } },
        );
      }

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate(
          "patientId",
          "firstName lastName mobileNumber email invoiceNumber emrNumber gender",
        )
        .populate("doctorId", "name email")
        .populate("roomId", "name")
        .populate("serviceId", "name")
        .populate("serviceIds", "name")
        .lean();

      console.log(
        "📖 Populated appointment bookedFrom from DB:",
        populatedAppointment.bookedFrom,
      );
      console.log(
        "📖 Populated appointment bookedFrom type:",
        typeof populatedAppointment.bookedFrom,
      );

      // Fetch doctor treatments for the created appointment's doctor
      let doctorTreatments = [];
      try {
        const did = populatedAppointment.doctorId?._id?.toString();
        if (did) {
          const treatments = await formatDoctorTreatments(did);
          doctorTreatments = (treatments || []).map((t) => ({
            mainTreatment: t.treatmentName,
            mainTreatmentSlug: t.treatmentId,
            subTreatments: t.subcategories || [],
          }));
        }
      } catch (err) {
        console.error(
          "Error fetching doctor treatments for created appointment:",
          err,
        );
        doctorTreatments = [];
      }

      // Note: Execute workflow for the created appointment
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.APPOINTMENT,
        trigger: WORKFLOW_TRIGGER_TYPE.BOOKED_APPOINTMENT,
        appointmentId: appointment._id?.toString(),
        patientId: patientId,
        clinicId: clinicId?.toString(),
      });

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        appointment: {
          _id: populatedAppointment._id.toString(),
          patientId: populatedAppointment.patientId?._id?.toString(),
          patientName: populatedAppointment.patientId
            ? `${populatedAppointment.patientId.firstName || ""} ${populatedAppointment.patientId.lastName || ""}`.trim()
            : "Unknown",
          doctorId: populatedAppointment.doctorId?._id?.toString(),
          doctorName: populatedAppointment.doctorId?.name || "Unknown",
          roomId: populatedAppointment.roomId?._id?.toString(),
          roomName: populatedAppointment.roomId?.name || "Unknown",
          status: populatedAppointment.status,
          followType: populatedAppointment.followType,
          startDate: populatedAppointment.startDate,
          fromTime: populatedAppointment.fromTime,
          toTime: populatedAppointment.toTime,
          referral: populatedAppointment.referral,
          emergency: populatedAppointment.emergency,
          notes: populatedAppointment.notes,
          bookedFrom:
            populatedAppointment.bookedFrom === "room" ||
            populatedAppointment.bookedFrom === "doctor"
              ? populatedAppointment.bookedFrom
              : validBookedFrom, // Use value from database, fallback to validated value
          doctorTreatments,
          serviceId: populatedAppointment.serviceId?._id?.toString() || null,
          serviceName: populatedAppointment.serviceId?.name || null,
          serviceIds: Array.isArray(populatedAppointment.serviceIds)
            ? populatedAppointment.serviceIds
                .map((s) => s?._id?.toString())
                .filter(Boolean)
            : [],
          serviceNames: (() => {
            const fromServiceIds = Array.isArray(
              populatedAppointment.serviceIds,
            )
              ? populatedAppointment.serviceIds
                  .map((s) => s?.name || "")
                  .filter(Boolean)
              : [];
            const fromServiceId = populatedAppointment.serviceId?.name || "";
            const combined = fromServiceId
              ? [
                  fromServiceId,
                  ...fromServiceIds.filter((n) => n !== fromServiceId),
                ]
              : fromServiceIds;
            return combined;
          })(),
          patientInvoiceNumber:
            populatedAppointment.patientId?.invoiceNumber || null,
          patientEmrNumber: populatedAppointment.patientId?.emrNumber || null,
          patientGender: populatedAppointment.patientId?.gender || null,
          patientEmail: populatedAppointment.patientId?.email || null,
          patientMobileNumber:
            populatedAppointment.patientId?.mobileNumber || null,
        },
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Error in appointments API:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
}
