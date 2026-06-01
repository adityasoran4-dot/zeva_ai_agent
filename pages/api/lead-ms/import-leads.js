// import-leads.js
import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Treatment from "../../../models/Treatment";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";
import csv from "csvtojson";
import multer from "multer";
import * as XLSX from "xlsx";
import { importLeadsFromFileQueue } from "../../../bullmq/queue.js";

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

// Disable Next.js bodyParser → important for file upload
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const contentType = req.headers["content-type"] || "";
  const isMultipart = contentType.startsWith("multipart/form-data");

  let body = {};
  if (isMultipart) {
    await runMiddleware(req, res, upload.single("file"));
    body = req.body;

    // Parse JSON data from form
    if (body.data) {
      try {
        const parsedData = JSON.parse(body.data);
        body = { ...body, ...parsedData };
        delete body.data;
      } catch (error) {
        // console.error("Error parsing form data:", error);
      }
    }
  } else {
    // For non-multipart requests (JSON body)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  }

  const me = await getUserFromReq(req);
  if (!me || !requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ✅ Resolve clinicId correctly
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res
        .status(400)
        .json({ success: false, message: "Clinic not found for this user" });
    }
    clinicId = clinic._id;
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
    }
    clinicId = me.clinicId;
  }

  // ✅ Check permission for importing leads
  if (me.role !== "admin" && clinicId) {
    const { checkClinicPermission } = await import("./permissions-helper");
    const { hasPermission: clinicHasPermission, error: clinicError } =
      await checkClinicPermission(
        clinicId,
        "create_lead",
        "create",
        null,
        me.role === "doctor" ? "doctor" : me.role === "clinic" ? "clinic" : null
      );

    if (!clinicHasPermission) {
      return res.status(403).json({
        success: false,
        message: clinicError || "You do not have permission to import leads",
      });
    }

    if (me.role === "agent") {
      const { checkAgentPermission } = await import(
        "../agent/permissions-helper"
      );
      const { hasPermission: agentHasPermission, error: agentError } =
        await checkAgentPermission(me._id, "create_lead", "create", null);

      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to import leads",
        });
      }
    }
  }

  try {
    // Get additional data and column mapping from request
    const {
      treatments = [],
      source = "Instagram",
      customSource = "",
      offerTag = "",
      status = "New",
      customStatus = "",
      note = "",
      followUpDate = "",
      assignedTo = [],
      columnMapping = {}, // Get column mapping from frontend
      segmentId,
    } = body;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required for import" });
    }

    // ✅ Check file size on backend too (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum allowed size is 5MB. Your file is ${(
          req.file.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`,
      });
    }

    // ✅ Check file extension
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

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname.toLowerCase();
    let jsonArray = [];

    // Parse the file
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
      return res
        .status(400)
        .json({ success: false, message: "No data found in the file" });
    }

    // Validate that required columns are mapped
    const requiredFields = ["name", "phone"];
    const missingFields = requiredFields.filter(
      (field) => !Object.values(columnMapping).includes(field)
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please map the following required fields: ${missingFields.join(
          ", "
        )}`,
      });
    }

    // Parse treatments from additional data
    const validatedTreatments = await Promise.all(
      treatments.map(async (t) => {
        if (!t.treatment) return null;

        const treatmentName = t.treatment;
        const tDoc = mongoose.Types.ObjectId.isValid(treatmentName)
          ? await Treatment.findById(treatmentName)
          : await Treatment.findOne({
              name: { $regex: `^${treatmentName}$`, $options: "i" },
            });

        if (!tDoc) {
          // console.warn(`Treatment not found: ${treatmentName}`);
          return null;
        }

        if (t.subTreatment) {
          const subExists = tDoc.subcategories?.some(
            (s) => s.name === t.subTreatment
          );
          if (!subExists) {
            // console.warn(`SubTreatment not found: ${t.subTreatment}`);
            return null;
          }
        }

        return {
          treatment: tDoc._id,
          subTreatment: t.subTreatment || null,
        };
      })
    ).then((results) => results.filter(Boolean));

    // Parse assigned users
    let assignedArray = [];
    if (assignedTo && assignedTo.length > 0) {
      assignedArray = await Promise.all(
        assignedTo.map(async (val) => {
          if (mongoose.Types.ObjectId.isValid(val)) {
            const user = await User.findById(val);
            if (!user) {
              // console.warn(`User not found with ID: ${val}`);
              return null;
            }
            return {
              user: user._id,
              assignedAt: new Date(),
            };
          } else {
            const u = await User.findOne({
              name: { $regex: `^${val}$`, $options: "i" },
              clinicId: clinicId,
            });
            if (!u) {
              // console.warn(`User not found with name: ${val}`);
              return null;
            }
            return { user: u._id, assignedAt: new Date() };
          }
        })
      ).then((results) => results.filter(Boolean));
    }

    // Prepare notes
    const notesArray = note
      ? [{ text: note, addedBy: me._id, createdAt: new Date() }]
      : [];

    // Helper function to parse date from string
    // Helper function to parse date from string with time
    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      // Clean the string (remove any extra spaces, commas)
      const cleanStr = dateStr.toString().trim().replace(/,\s+/g, " ");

      // Try different date-time formats
      const formats = [
        // ISO format (2024-01-15T14:30)
        () => new Date(cleanStr),

        // DD/MM/YYYY HH:MM (15/01/2024 14:30)
        () => {
          const match = cleanStr.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i
          );
          if (match) {
            let [_, day, month, year, hour, minute, second, ampm] = match;
            month = parseInt(month) - 1;
            day = parseInt(day);
            year = parseInt(year);
            hour = parseInt(hour);
            minute = parseInt(minute);
            second = second ? parseInt(second) : 0;

            // Handle AM/PM
            if (ampm) {
              const isPM = ampm.toUpperCase() === "PM";
              const is12 = hour === 12;
              if (isPM && !is12) hour += 12;
              if (!isPM && is12) hour = 0;
            }

            return new Date(year, month, day, hour, minute, second);
          }
          return null;
        },

        // YYYY-MM-DD HH:MM (2024-01-15 14:30)
        () => {
          const match = cleanStr.match(
            /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i
          );
          if (match) {
            let [_, year, month, day, hour, minute, second, ampm] = match;
            month = parseInt(month) - 1;
            day = parseInt(day);
            year = parseInt(year);
            hour = parseInt(hour);
            minute = parseInt(minute);
            second = second ? parseInt(second) : 0;

            // Handle AM/PM
            if (ampm) {
              const isPM = ampm.toUpperCase() === "PM";
              const is12 = hour === 12;
              if (isPM && !is12) hour += 12;
              if (!isPM && is12) hour = 0;
            }

            return new Date(year, month, day, hour, minute, second);
          }
          return null;
        },

        // DD/MM/YYYY, HH:MM (15/01/2024, 14:30) - Your format
        () => {
          const match = cleanStr.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4}),\s*(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i
          );
          if (match) {
            let [_, day, month, year, hour, minute, second, ampm] = match;
            month = parseInt(month) - 1;
            day = parseInt(day);
            year = parseInt(year);
            hour = parseInt(hour);
            minute = parseInt(minute);
            second = second ? parseInt(second) : 0;

            // Handle AM/PM
            if (ampm) {
              const isPM = ampm.toUpperCase() === "PM";
              const is12 = hour === 12;
              if (isPM && !is12) hour += 12;
              if (!isPM && is12) hour = 0;
            }

            return new Date(year, month, day, hour, minute, second);
          }
          return null;
        },

        // Date without time (fallback)
        () => {
          const parts = cleanStr.split(/[/-]/);
          if (parts.length === 3) {
            // Try DD/MM/YYYY
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1;
            const year = parseInt(parts[2]);
            if (
              year > 1000 &&
              day > 0 &&
              day < 32 &&
              month >= 0 &&
              month < 12
            ) {
              return new Date(year, month, day);
            }
            // Try MM/DD/YYYY
            const month2 = parseInt(parts[0]) - 1;
            const day2 = parseInt(parts[1]);
            const year2 = parseInt(parts[2]);
            if (
              year2 > 1000 &&
              day2 > 0 &&
              day2 < 32 &&
              month2 >= 0 &&
              month2 < 12
            ) {
              return new Date(year2, month2, day2);
            }
            // Try YYYY-MM-DD
            const year3 = parseInt(parts[0]);
            const month3 = parseInt(parts[1]) - 1;
            const day3 = parseInt(parts[2]);
            if (
              year3 > 1000 &&
              day3 > 0 &&
              day3 < 32 &&
              month3 >= 0 &&
              month3 < 12
            ) {
              return new Date(year3, month3, day3);
            }
          }
          return null;
        },
      ];

      for (const format of formats) {
        try {
          const date = format();
          if (date && !isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Continue to next format
        }
      }

      // console.warn(`Could not parse date: ${dateStr}`);
      return null;
    };

    // Process each row from the file using column mapping
    const leadsToInsert = [];
    const failedRows = [];

    for (let i = 0; i < jsonArray.length; i++) {
      const row = jsonArray[i];

      try {
        // Extract values using column mapping
        const name = getMappedValue(row, columnMapping, "name")?.trim() || "";
        const phone =
          getMappedValue(row, columnMapping, "phone")?.toString()?.trim() || "";
        const email =
          getMappedValue(row, columnMapping, "email")?.toString()?.trim() || "";
        const gender =
          getMappedValue(row, columnMapping, "gender")?.toString()?.trim() ||
          "Male";
        const age = getMappedValue(row, columnMapping, "age");
        const followUpDateFromFile = getMappedValue(
          row,
          columnMapping,
          "followUpDate"
        );

        // Validate required fields
        if (!name || !phone) {
          throw new Error(`Missing name or phone in row ${i + 1}`);
        }

        // Validate gender
        const validGenders = ["Male", "Female", "Other"];
        let finalGender = "Male";
        if (gender) {
          const genderLower = gender.toLowerCase();
          if (genderLower.includes("male")) finalGender = "Male";
          else if (genderLower.includes("female")) finalGender = "Female";
          else if (genderLower.includes("other")) finalGender = "Other";
          else finalGender = "Male"; // Default
        }

        // Parse age
        let finalAge = undefined;
        if (age) {
          const parsedAge = parseInt(age);
          if (!isNaN(parsedAge) && parsedAge > 0 && parsedAge < 150) {
            finalAge = parsedAge;
          }
        }

        // Prepare follow-ups array
        const followUpsArray = [];

        // Add follow-up from file if available and valid
        if (followUpDateFromFile) {
          const parsedDate = parseDate(followUpDateFromFile.toString());
          if (parsedDate) {
            followUpsArray.push({ date: parsedDate, addedBy: me._id });
          }
        }

        // Add additional follow-up date if provided
        if (followUpDate) {
          try {
            const additionalDate = new Date(followUpDate);
            if (!isNaN(additionalDate.getTime())) {
              followUpsArray.push({ date: additionalDate, addedBy: me._id });
            }
          } catch (e) {
            // console.warn(`Invalid additional follow-up date: ${followUpDate}`);
          }
        }

        // Prepare lead object
        const lead = {
          clinicId,
          name,
          phone,
          email,
          gender: finalGender,
          age: finalAge,
          treatments: validatedTreatments,
          source: customSource || source,
          customSource: customSource || null,
          offerTag: offerTag || null,
          status: customStatus || status,
          customStatus: customStatus || null,
          notes: notesArray,
          followUps: followUpsArray,
          assignedTo: assignedArray,
          segments: segmentId ? [segmentId] : [],
        };

        leadsToInsert.push(lead);
      } catch (error) {
        failedRows.push({
          row: i + 1,
          error: error.message,
          data: row,
        });
        // console.warn(`Error processing row ${i + 1}:`, error.message);
      }
    }

    if (leadsToInsert.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid leads to import",
        failedRows,
      });
    }

    // Import in batches of 100
    // const BATCH_SIZE = 100;
    let importedCount = 0;
    let batchFailedCount = 0;
    const batchFailedRecords = [];

    // for (let i = 0; i < leadsToInsert.length; i += BATCH_SIZE) {
    //   const batch = leadsToInsert.slice(i, i + BATCH_SIZE);

    //   try {
    //     await Lead.insertMany(batch, { ordered: false });
    //     importedCount += batch.length;
    //   } catch (batchError) {
    //     console.error(
    //       `Error importing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
    //       batchError
    //     );

    //     // Try to import each lead individually in this batch
    //     for (const lead of batch) {
    //       try {
    //         await Lead.create(lead);
    //         importedCount += 1;
    //       } catch (individualError) {
    //         batchFailedCount += 1;
    //         batchFailedRecords.push({
    //           name: lead.name,
    //           phone: lead.phone,
    //           error: individualError.message,
    //         });
    //       }
    //     }
    //   }
    // }

    // add import leads job to queue for background processing
    await importLeadsFromFileQueue.add("import-leads", {
      leadsToInsert,
      segmentId,
    });

    // Combine all failed records
    const allFailedRecords = [
      ...failedRows.map((fr) => ({
        name:
          fr.data[
            Object.keys(columnMapping).find((k) => columnMapping[k] === "name")
          ] || "Unknown",
        phone:
          fr.data[
            Object.keys(columnMapping).find((k) => columnMapping[k] === "phone")
          ] || "Unknown",
        error: fr.error,
      })),
      ...batchFailedRecords,
    ];

    return res.status(201).json({
      success: true,
      message: `Successfully imported ${importedCount} leads out of ${jsonArray.length}`,
      data: {
        total: jsonArray.length,
        imported: importedCount,
        failed: failedRows.length + batchFailedCount,
        failedRows: allFailedRecords.length > 0 ? allFailedRecords : undefined,
        details: {
          processed: leadsToInsert.length,
          skipped: failedRows.length,
          batchFailures: batchFailedCount,
        },
      },
    });
  } catch (err) {
    // console.error("Error importing leads:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}

// Helper function to get mapped value from row
function getMappedValue(row, columnMapping, fieldName) {
  const columnName = Object.keys(columnMapping).find(
    (key) => columnMapping[key] === fieldName
  );
  return columnName ? row[columnName] : undefined;
}
