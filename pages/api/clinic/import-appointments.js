// import-appointments.js
import dbConnect from "../../../lib/database";
import Appointment from "../../../models/Appointment";
import PatientRegistration from "../../../models/PatientRegistration";
import User from "../../../models/Users";
import Room from "../../../models/Room";
import Clinic from "../../../models/Clinic";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import { generateEmrNumber } from "../../../lib/generateEmrNumber";
import csv from "csvtojson";
import multer from "multer";
import * as XLSX from "xlsx";
import mongoose from "mongoose";

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Disable Next.js bodyParser for file upload
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get authenticated user
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Get clinic ID
    let { clinicId, error, isAdmin } = await getClinicIdFromUser(clinicUser);
    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

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

    // Check create permission for agent/doctorStaff
    if (!isAdmin && ["agent", "doctorStaff"].includes(clinicUser.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        clinicUser._id,
        "clinic_Appointment",
        "create"
      );

      if (!result.hasPermission && result.error && !result.error.includes("not found in agent permissions")) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to create appointments"
        });
      }
    }

    // Handle file upload
    await runMiddleware(req, res, upload.single("file"));

    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required for import" });
    }

    // Check file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum allowed size is 5MB. Your file is ${(
          req.file.size / (1024 * 1024)
        ).toFixed(2)}MB.`,
      });
    }

    // Check file extension
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExt = req.file.originalname
      .toLowerCase()
      .substring(req.file.originalname.lastIndexOf("."));
    if (!validExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
      });
    }

    // Parse column mapping from form data
    let columnMapping = {};
    if (req.body.columnMapping) {
      try {
        columnMapping = typeof req.body.columnMapping === 'string' 
          ? JSON.parse(req.body.columnMapping) 
          : req.body.columnMapping;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: "Invalid column mapping format",
        });
      }
    }

    // Parse the file
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname.toLowerCase();
    let jsonArray = [];

    if (fileName.endsWith(".csv")) {
      jsonArray = await csv().fromString(fileBuffer.toString());
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      jsonArray = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported file format. Upload CSV or Excel.",
      });
    }

    if (!jsonArray || jsonArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "File is empty or has no data",
      });
    }

    // Get clinic owner for invoicedBy
    let clinicOwnerName = clinicUser.name || clinicUser.fullName || clinicUser.email || String(clinicUser._id);
    if (clinicUser.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: clinicUser._id }).select("name owner").lean();
      if (clinic) {
        const owner = await User.findById(clinic.owner).select("name fullName email").lean();
        if (owner) {
          clinicOwnerName = owner.name || owner.fullName || owner.email || clinicOwnerName;
        }
      }
    }

    // Get all doctors and rooms for the clinic
    const doctors = await User.find({
      clinicId: clinicId,
      role: { $in: ["doctor", "doctorStaff"] },
      isApproved: true,
    }).select("_id name email").lean();

    const rooms = await Room.find({ clinicId: clinicId }).select("_id name").lean();

    // Helper function to generate invoice number
    const generateInvoiceNumber = () => {
      const date = new Date();
      const seq = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
      return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${seq}`;
    };

    // Create maps for quick lookup
    const doctorMap = {};
    doctors.forEach((doc) => {
      doctorMap[doc.name.toLowerCase().trim()] = doc._id;
    });

    const roomMap = {};
    rooms.forEach((room) => {
      roomMap[room.name.toLowerCase().trim()] = room._id;
    });

    // Helper function to normalize date to UTC midnight
    // This ensures all dates are stored consistently regardless of timezone
    const normalizeDateToUTCMidnight = (year, month, day) => {
      // Create date string in YYYY-MM-DD format and parse as UTC
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Parse as UTC to avoid timezone issues
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    };

    // Helper functions
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const str = String(dateStr).trim();
      
      // Parse YYYY-MM-DD format (most common)
      const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(ymdMatch[3], 10);
        // Normalize to UTC midnight for consistent storage
        const date = normalizeDateToUTCMidnight(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Parse DD/MM/YYYY format
      const dmyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1; // Month is 0-indexed
        const year = parseInt(dmyMatch[3], 10);
        // Normalize to UTC midnight for consistent storage
        const date = normalizeDateToUTCMidnight(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Parse DD-MM-YYYY format
      const dmyDashMatch = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (dmyDashMatch) {
        const day = parseInt(dmyDashMatch[1], 10);
        const month = parseInt(dmyDashMatch[2], 10) - 1; // Month is 0-indexed
        const year = parseInt(dmyDashMatch[3], 10);
        // Normalize to UTC midnight for consistent storage
        const date = normalizeDateToUTCMidnight(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Parse YYYY/MM/DD format
      const ymdSlashMatch = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
      if (ymdSlashMatch) {
        const year = parseInt(ymdSlashMatch[1], 10);
        const month = parseInt(ymdSlashMatch[2], 10) - 1; // Month is 0-indexed
        const day = parseInt(ymdSlashMatch[3], 10);
        // Normalize to UTC midnight for consistent storage
        const date = normalizeDateToUTCMidnight(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try direct parsing as fallback, then normalize to UTC midnight
      const parsedDate = new Date(str);
      if (!isNaN(parsedDate.getTime())) {
        // Extract year, month, day and normalize to UTC midnight
        const year = parsedDate.getUTCFullYear();
        const month = parsedDate.getUTCMonth();
        const day = parsedDate.getUTCDate();
        return normalizeDateToUTCMidnight(year, month, day);
      }

      return null;
    };

    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      const str = String(timeStr).trim();

      // Try 24-hour format (HH:MM)
      const time24Match = str.match(/^(\d{1,2}):(\d{2})$/);
      if (time24Match) {
        const hours = parseInt(time24Match[1]);
        const minutes = parseInt(time24Match[2]);
        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        }
      }

      // Try 12-hour format (HH:MM AM/PM)
      const time12Match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (time12Match) {
        let hours = parseInt(time12Match[1]);
        const minutes = parseInt(time12Match[2]);
        const period = time12Match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
        }
      }

      return null;
    };

    // Process appointments
    const results = {
      total: jsonArray.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < jsonArray.length; i++) {
      const row = jsonArray[i];
      const errors = [];

      try {
        // Map columns
        const mapped = {};
        Object.entries(columnMapping).forEach(([excelCol, ourField]) => {
          mapped[ourField] = row[excelCol];
        });

        // Validate required fields
        if (!mapped.patientName || String(mapped.patientName).trim() === "") {
          errors.push("Patient name is required");
        }
        if (!mapped.patientPhone || String(mapped.patientPhone).trim() === "") {
          errors.push("Patient phone is required");
        }
        if (!mapped.doctorName || String(mapped.doctorName).trim() === "") {
          errors.push("Doctor name is required");
        }
        if (!mapped.roomName || String(mapped.roomName).trim() === "") {
          errors.push("Room name is required");
        }
        if (!mapped.appointmentDate) {
          errors.push("Appointment date is required");
        }
        if (!mapped.startTime) {
          errors.push("Start time is required");
        }
        if (!mapped.endTime) {
          errors.push("End time is required");
        }

        if (errors.length > 0) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${errors.join(", ")}`);
          continue;
        }

        // Find or create patient
        const patientPhone = String(mapped.patientPhone).trim().replace(/\D/g, "");
        
        // Validate phone number (must be 10 digits)
        if (patientPhone.length !== 10) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid phone number. Must be exactly 10 digits.`);
          continue;
        }

        // Find existing patient by mobile number and userId
        let patient = await PatientRegistration.findOne({
          userId: clinicUser._id,
          mobileNumber: patientPhone,
        });

        if (!patient) {
          // Generate unique invoice number
          let invoiceNumber = generateInvoiceNumber();
          let invoiceExists = await PatientRegistration.findOne({ invoiceNumber });
          let attempts = 0;
          while (invoiceExists && attempts < 10) {
            invoiceNumber = generateInvoiceNumber();
            invoiceExists = await PatientRegistration.findOne({ invoiceNumber });
            attempts++;
          }
          if (invoiceExists) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Could not generate unique invoice number. Please try again.`);
            continue;
          }

          // Parse patient name
          const patientNameParts = String(mapped.patientName).trim().split(" ");
          const firstName = patientNameParts[0] || mapped.patientName;
          const lastName = patientNameParts.slice(1).join(" ") || "";

          // Validate gender - leave undefined if not provided
          const gender = mapped.patientGender || undefined;
          if (gender && !["Male", "Female", "Other"].includes(gender)) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Invalid gender. Must be Male, Female, or Other.`);
            continue;
          }

          // Generate EMR number for new patient
          const generatedEmrNumber = await generateEmrNumber();

          // Create new patient
          const patientData = {
            invoiceNumber: invoiceNumber,
            invoicedDate: new Date(),
            invoicedBy: clinicOwnerName,
            userId: clinicUser._id,
            emrNumber: generatedEmrNumber, // Auto-generated sequential EMR number
            firstName: firstName,
            lastName: lastName,
            mobileNumber: patientPhone,
            email: (mapped.patientEmail || "").toLowerCase().trim(),
            gender: gender,
            referredBy: "",
            patientType: "New", // Valid enum values: "New" or "Old"
            insurance: "No", // Default to "No"
            insuranceType: "Paid",
            advanceGivenAmount: 0,
            coPayPercent: 0,
            // advanceClaimStatus is only set if insurance is "Yes", otherwise null
            notes: mapped.notes || "",
          };

          try {
            patient = await PatientRegistration.create(patientData);
          } catch (patientError) {
            // Handle validation errors more gracefully
            if (patientError.name === 'ValidationError') {
              const validationErrors = Object.values(patientError.errors).map(e => e.message).join(", ");
              results.failed++;
              results.errors.push(`Row ${i + 1}: Patient validation failed: ${validationErrors}`);
            } else {
              results.failed++;
              results.errors.push(`Row ${i + 1}: Failed to create patient: ${patientError.message || "Unknown error"}`);
            }
            continue;
          }
        }

        // Find doctor
        const doctorName = String(mapped.doctorName).trim().toLowerCase();
        const doctorId = doctorMap[doctorName];
        if (!doctorId) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Doctor "${mapped.doctorName}" not found`);
          continue;
        }

        // Find room
        const roomName = String(mapped.roomName).trim().toLowerCase();
        const roomId = roomMap[roomName];
        if (!roomId) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Room "${mapped.roomName}" not found`);
          continue;
        }

        // Parse date and time
        const appointmentDate = parseDate(String(mapped.appointmentDate));
        if (!appointmentDate) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid date format`);
          continue;
        }

        const startTime = parseTime(String(mapped.startTime));
        const endTime = parseTime(String(mapped.endTime));
        if (!startTime || !endTime) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Invalid time format`);
          continue;
        }

        // Validate time range
        const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
        const endMinutes = parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1]);
        if (startMinutes >= endMinutes) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: End time must be after start time`);
          continue;
        }

        // Check for overlapping appointments
        // Normalize appointmentDate to UTC midnight for consistent querying
        const appointmentDateStart = new Date(Date.UTC(
          appointmentDate.getUTCFullYear(),
          appointmentDate.getUTCMonth(),
          appointmentDate.getUTCDate(),
          0, 0, 0, 0
        ));
        const appointmentDateEnd = new Date(Date.UTC(
          appointmentDate.getUTCFullYear(),
          appointmentDate.getUTCMonth(),
          appointmentDate.getUTCDate(),
          23, 59, 59, 999
        ));

        const existingAppointment = await Appointment.findOne({
          clinicId: clinicId,
          doctorId: doctorId,
          startDate: { $gte: appointmentDateStart, $lte: appointmentDateEnd },
          $or: [
            { fromTime: { $gte: startTime, $lt: endTime } },
            { toTime: { $gt: startTime, $lte: endTime } },
            { fromTime: { $lte: startTime }, toTime: { $gte: endTime } },
          ],
        });

        if (existingAppointment) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Appointment overlaps with existing appointment`);
          continue;
        }

        // Create appointment
        // Ensure appointmentDate is normalized to UTC midnight
        const normalizedAppointmentDate = appointmentDate instanceof Date 
          ? new Date(Date.UTC(
              appointmentDate.getUTCFullYear(),
              appointmentDate.getUTCMonth(),
              appointmentDate.getUTCDate(),
              0, 0, 0, 0
            ))
          : appointmentDate;
        
        console.log(`[IMPORT] Row ${i + 1}: Creating appointment with date:`);
        console.log(`  - Original parsed date: ${appointmentDate?.toISOString()}`);
        console.log(`  - Normalized date (UTC midnight): ${normalizedAppointmentDate?.toISOString()}`);
        console.log(`  - Date string (YYYY-MM-DD): ${normalizedAppointmentDate ? new Date(normalizedAppointmentDate).toISOString().split('T')[0] : 'N/A'}`);
        
        const appointmentData = {
          clinicId: clinicId,
          patientId: patient._id,
          doctorId: doctorId,
          roomId: roomId,
          status: mapped.status || "booked",
          followType: mapped.followType || "first time",
          startDate: normalizedAppointmentDate,
          fromTime: startTime,
          toTime: endTime,
          referral: mapped.referral || "direct",
          emergency: mapped.emergency || "no",
          notes: mapped.notes || "",
          createdBy: clinicUser._id,
          bookedFrom: "doctor",
        };

        const createdAppointment = await Appointment.create(appointmentData);
        console.log(`[IMPORT] Row ${i + 1}: Appointment created with ID ${createdAppointment._id}`);
        console.log(`  - Stored startDate: ${createdAppointment.startDate?.toISOString()}`);
        results.imported++;
      } catch (error) {
        results.failed++;
        // Format error message to be more user-friendly
        let errorMessage = "Unknown error";
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map(e => e.message).join(", ");
          errorMessage = `Validation failed: ${validationErrors}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    // Get the dates of imported appointments for feedback
    // Extract dates in YYYY-MM-DD format (UTC) to ensure consistency
    const importedDates = [];
    if (results.imported > 0) {
      // Fetch the imported appointments to get their dates
      const importedAppointments = await Appointment.find({
        clinicId: clinicId,
        createdBy: clinicUser._id,
      })
        .sort({ createdAt: -1 })
        .limit(results.imported)
        .select("startDate")
        .lean();
      
      console.log("[IMPORT] Extracting dates from imported appointments:");
      importedAppointments.forEach((apt) => {
        if (apt.startDate) {
          // Ensure we get the date in UTC to avoid timezone issues
          const dateObj = new Date(apt.startDate);
          const year = dateObj.getUTCFullYear();
          const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getUTCDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          console.log(`  - Raw date: ${apt.startDate}, Extracted: ${dateStr}`);
          if (!importedDates.includes(dateStr)) {
            importedDates.push(dateStr);
          }
        }
      });
      console.log("[IMPORT] Final importedDates array:", importedDates);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...results,
        importedDates: importedDates, // Include dates for UI feedback
      },
      message: `Imported ${results.imported} appointments. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error("Error importing appointments:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to import appointments",
    });
  }
}

