// import-patients.js
import dbConnect from "../../../lib/database";
import PatientRegistration from "../../../models/PatientRegistration";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { checkClinicPermission } from "../lead-ms/permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import Clinic from "../../../models/Clinic";
import { generateEmrNumber } from "../../../lib/generateEmrNumber";
import csv from "csvtojson";
import multer from "multer";
import * as XLSX from "xlsx";

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

const hasRole = (user, roles = []) => roles.includes(user.role);

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get authenticated user
    let user;
    try {
      user = await getAuthorizedStaffUser(req, {
        allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
      });
    } catch (err) {
      return res.status(err.status || 401).json({ success: false, message: err.message || "Authentication error" });
    }

    if (!hasRole(user, ["clinic", "staff", "admin", "agent", "doctorStaff", "doctor"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Check permissions for creating patients (admin bypasses all checks)
    if (user.role !== 'admin') {
      // For clinic role: Check clinic permissions
      if (user.role === 'clinic') {
        const clinic = await Clinic.findOne({ owner: user._id });
        if (clinic) {
          const { hasPermission: clinicHasPermission, error: clinicError } = await checkClinicPermission(
            clinic._id,
            "patient_registration",
            "create"
          );
          if (!clinicHasPermission) {
            return res.status(403).json({
              success: false,
              message: clinicError || "You do not have permission to import patients"
            });
          }
        }
      }
      // For agent role: Check agent permissions
      else if (user.role === 'agent') {
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          user._id,
          "patient_registration",
          "create"
        );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || "You do not have permission to import patients"
          });
        }
      }
      // For doctorStaff role: Check agent permissions
      else if (user.role === 'doctorStaff') {
        const { hasPermission: agentHasPermission, error: agentError } = await checkAgentPermission(
          user._id,
          "patient_registration",
          "create"
        );
        if (!agentHasPermission) {
          return res.status(403).json({
            success: false,
            message: agentError || "You do not have permission to import patients"
          });
        }
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

    // Get user name for invoicedBy
    const computedInvoicedBy =
      user.name ||
      user.fullName ||
      user.email ||
      user.username ||
      user.mobileNumber ||
      String(user._id);

    // Get current max invoice number for today to start sequential generation
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const invoicePattern = new RegExp(`^INV-${dateStr}-(\\d+)$`);
    
    const patientsWithInvoice = await PatientRegistration.find({
      invoiceNumber: { $regex: invoicePattern },
    })
      .select("invoiceNumber")
      .lean();

    let maxInvoiceSeq = 0;
    for (const patient of patientsWithInvoice) {
      if (patient.invoiceNumber) {
        const match = patient.invoiceNumber.match(invoicePattern);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxInvoiceSeq) {
            maxInvoiceSeq = num;
          }
        }
      }
    }

    // Sequential generator for invoice numbers
    let invoiceSequence = maxInvoiceSeq;

    const getNextInvoiceNumber = () => {
      invoiceSequence++;
      return `INV-${dateStr}-${String(invoiceSequence).padStart(3, "0")}`;
    };

    // Process patients
    const results = {
      total: jsonArray.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < jsonArray.length; i++) {
      const row = jsonArray[i];
      const errors = [];
      let patientName = ""; // For user-friendly error messages

      try {
        // Map columns
        const mapped = {};
        Object.entries(columnMapping).forEach(([excelCol, ourField]) => {
          mapped[ourField] = row[excelCol];
        });

        // Extract patient name early for error messages (try firstName or name field)
        const nameValue = mapped.firstName || mapped.name || row['name'] || row['Name'] || row['NAME'] || "";
        patientName = String(nameValue).trim() || `Row ${i + 2}`;

        // Handle full name splitting if name field contains both first and last name
        let firstName = mapped.firstName || "";
        let lastName = mapped.lastName || "";
        
        // If we have a "name" field but no firstName, try to split it
        if (!firstName && mapped.name) {
          const nameParts = String(mapped.name).trim().split(/\s+/);
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }
        
        // Also check raw row data for common column names
        if (!firstName) {
          const nameCol = row['name'] || row['Name'] || row['NAME'] || row['patient name'] || row['Patient Name'] || "";
          if (nameCol) {
            const nameParts = String(nameCol).trim().split(/\s+/);
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
          }
        }

        // Update mapped values
        mapped.firstName = firstName;
        if (lastName) {
          mapped.lastName = lastName;
        }

        // Update patient name for error messages
        patientName = firstName || `Row ${i + 2}`;

        // Validate required fields - firstName and mobileNumber are mandatory
        if (!firstName || firstName.trim() === "") {
          errors.push(`Patient name is missing. Please provide the patient's first name.`);
        }
        
        // Check mobileNumber in mapped data first, then check raw row for common column names
        let mobileNumber = mapped.mobileNumber || "";
        if (!mobileNumber) {
          // Try various common column name variations
          mobileNumber = row['phone'] || row['Phone'] || row['PHONE'] || 
                        row['mobile'] || row['Mobile'] || row['MOBILE'] ||
                        row['mobile number'] || row['Mobile Number'] || row['MOBILE NUMBER'] ||
                        row['phone number'] || row['Phone Number'] || row['PHONE NUMBER'] ||
                        row['contact'] || row['Contact'] || row['CONTACT'] ||
                        row['contact number'] || row['Contact Number'] || "";
        }
        
        // Update mapped value for consistency
        if (mobileNumber) {
          mapped.mobileNumber = mobileNumber;
        }
        
        if (!mobileNumber || String(mobileNumber).trim() === "") {
          const errorMsg = patientName !== `Row ${i + 2}`
            ? `Phone number is missing for ${patientName}. Please provide a phone number.`
            : `Phone number is missing. Please provide a phone number.`;
          errors.push(errorMsg);
        }

        if (errors.length > 0) {
          results.failed++;
          const errorMsg = patientName !== `Row ${i + 2}` 
            ? `❌ ${patientName}: ${errors.join(" ")}`
            : `Row ${i + 2}: ${errors.join(", ")}`;
          results.errors.push(errorMsg);
          continue;
        }

        // Normalize phone number (required) - remove all non-digit characters
        const patientPhone = String(mobileNumber).trim().replace(/\D/g, "");

        // Validate gender if provided (optional)
        let gender = "";
        if (mapped.gender) {
          gender = String(mapped.gender).trim();
          if (!["Male", "Female", "Other"].includes(gender)) {
            results.failed++;
            const errorMsg = patientName !== `Row ${i + 2}`
              ? `❌ ${patientName}: Gender "${mapped.gender}" is invalid. Please use: Male, Female, or Other.`
              : `Row ${i + 2}: Invalid gender. Must be Male, Female, or Other.`;
            results.errors.push(errorMsg);
            continue;
          }
        }

        // Normalize email if provided (optional)
        const patientEmail = mapped.email ? String(mapped.email).trim().toLowerCase() : "";

        // Check for duplicate patient by mobileNumber (primary) or email (secondary)
        // Scoped to userId (clinic) to allow same patient across different clinics
        const duplicateQuery = {
          userId: user._id,
          $or: [
            { mobileNumber: patientPhone } // Primary identifier
          ]
        };

        // Add email as secondary check if provided
        if (patientEmail) {
          duplicateQuery.$or.push({ email: patientEmail });
        }

        const existingPatient = await PatientRegistration.findOne(duplicateQuery);
        if (existingPatient) {
          const duplicateFields = [];
          if (existingPatient.mobileNumber === patientPhone) {
            duplicateFields.push("phone number");
          }
          if (patientEmail && existingPatient.email === patientEmail) {
            duplicateFields.push("email address");
          }
          results.failed++;
          const errorMsg = patientName !== `Row ${i + 2}`
            ? `❌ ${patientName}: This patient already exists in your clinic with the same ${duplicateFields.join(" or ")}. Existing patient EMR: ${existingPatient.emrNumber || "N/A"}. Please check if this is a duplicate or use a different phone number/email.`
            : `Row ${i + 2}: Patient already exists with same ${duplicateFields.join(" or ")}. EMR: ${existingPatient.emrNumber || "N/A"}`;
          results.errors.push(errorMsg);
          continue;
        }

        // Always auto-generate sequential invoice number (ignore any provided in file)
        let invoiceNumber = getNextInvoiceNumber();
        // Verify it doesn't exist (safety check)
        let existingInvoice = await PatientRegistration.findOne({ invoiceNumber });
        if (existingInvoice) {
          // If exists, keep incrementing until we find a unique one
          let attempts = 0;
          while (existingInvoice && attempts < 100) {
            invoiceSequence++;
            invoiceNumber = getNextInvoiceNumber();
            existingInvoice = await PatientRegistration.findOne({ invoiceNumber });
            if (!existingInvoice) break;
            attempts++;
          }
          if (attempts >= 100) {
            results.failed++;
            const errorMsg = patientName !== `Row ${i + 2}`
              ? `❌ ${patientName}: System error - Could not generate unique invoice number. Please try importing again or contact support.`
              : `Row ${i + 2}: Could not generate unique invoice number. Please try again.`;
            results.errors.push(errorMsg);
            continue;
          }
        }

        // Always auto-generate sequential EMR number using generateEmrNumber function (ignore any provided in file)
        const emrNumber = await generateEmrNumber();

        // Prepare patient data
        // Note: gender is required by model, so we provide default if not provided
        const patientData = {
          invoiceNumber: invoiceNumber,
          invoicedDate: mapped.invoicedDate ? new Date(mapped.invoicedDate) : new Date(),
          invoicedBy: computedInvoicedBy,
          userId: user._id,
          emrNumber: emrNumber,
          firstName: String(firstName).trim(),
          lastName: lastName ? String(lastName).trim() : "",
          gender: gender || undefined, // Leave undefined if not provided
          email: patientEmail, // Optional - already normalized above
          mobileNumber: patientPhone, // Required - validated above
          referredBy: mapped.referredBy ? String(mapped.referredBy).trim() : "",
          patientType: mapped.patientType && ["New", "Old"].includes(String(mapped.patientType).trim()) 
            ? String(mapped.patientType).trim() 
            : "New",
          insurance: mapped.insurance && ["Yes", "No"].includes(String(mapped.insurance).trim())
            ? String(mapped.insurance).trim()
            : "No",
          insuranceType: mapped.insuranceType && ["Paid", "Advance"].includes(String(mapped.insuranceType).trim())
            ? String(mapped.insuranceType).trim()
            : "Paid",
          advanceGivenAmount: mapped.advanceGivenAmount ? parseFloat(mapped.advanceGivenAmount) || 0 : 0,
          coPayPercent: mapped.coPayPercent ? parseFloat(mapped.coPayPercent) || 0 : 0,
          advanceClaimStatus: mapped.insurance === "Yes" 
            ? (mapped.advanceClaimStatus && ["Pending", "Released", "Cancelled", "Approved by doctor"].includes(String(mapped.advanceClaimStatus).trim())
              ? String(mapped.advanceClaimStatus).trim()
              : "Pending")
            : null,
          advanceClaimReleasedBy: mapped.advanceClaimReleasedBy ? String(mapped.advanceClaimReleasedBy).trim() : null,
          notes: mapped.notes ? String(mapped.notes).trim() : "",
        };

        // Create patient
        try {
          await PatientRegistration.create(patientData);
          results.imported++;
        } catch (patientError) {
          // Handle validation errors more gracefully with user-friendly messages
          let errorMsg = "";
          if (patientError.name === 'ValidationError') {
            const validationErrors = Object.values(patientError.errors).map(e => {
              const fieldName = e.path || "field";
              const message = e.message || "Invalid value";
              // Convert technical field names to user-friendly names
              const friendlyNames = {
                'mobileNumber': 'phone number',
                'firstName': 'first name',
                'email': 'email address',
                'gender': 'gender'
              };
              const friendlyField = friendlyNames[fieldName] || fieldName;
              return `${friendlyField}: ${message}`;
            }).join(". ");
            errorMsg = patientName !== `Row ${i + 2}`
              ? `❌ ${patientName}: ${validationErrors}`
              : `Row ${i + 2}: Patient validation failed: ${validationErrors}`;
          } else if (patientError.code === 11000) {
            const field = Object.keys(patientError.keyPattern)[0];
            const friendlyNames = {
              'mobileNumber': 'phone number',
              'email': 'email address',
              'invoiceNumber': 'invoice number'
            };
            const friendlyField = friendlyNames[field] || field;
            errorMsg = patientName !== `Row ${i + 2}`
              ? `❌ ${patientName}: A patient with this ${friendlyField} already exists in the system. Please check for duplicates.`
              : `Row ${i + 2}: ${field} already exists`;
          } else {
            const errorMessage = patientError.message || "Unknown error occurred";
            errorMsg = patientName !== `Row ${i + 2}`
              ? `❌ ${patientName}: Unable to save patient. ${errorMessage}. Please check the data and try again.`
              : `Row ${i + 2}: Failed to create patient: ${errorMessage}`;
          }
          results.failed++;
          results.errors.push(errorMsg);
        }
      } catch (error) {
        results.failed++;
        // Format error message to be more user-friendly
        let errorMessage = "An unexpected error occurred while processing this patient.";
        if (error.name === 'ValidationError') {
          const validationErrors = Object.values(error.errors).map(e => {
            const fieldName = e.path || "field";
            const friendlyNames = {
              'mobileNumber': 'phone number',
              'firstName': 'first name',
              'email': 'email address'
            };
            const friendlyField = friendlyNames[fieldName] || fieldName;
            return `${friendlyField}: ${e.message || "Invalid value"}`;
          }).join(". ");
          errorMessage = `Validation error: ${validationErrors}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        const errorMsg = patientName && patientName !== `Row ${i + 2}`
          ? `❌ ${patientName}: ${errorMessage}`
          : `Row ${i + 2}: ${errorMessage}`;
        results.errors.push(errorMsg);
      }
    }

    return res.status(200).json({
      success: true,
      data: results,
      message: `Imported ${results.imported} patients. ${results.failed} failed.`,
    });
  } catch (error) {
    console.error("Error importing patients:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to import patients",
    });
  }
}
