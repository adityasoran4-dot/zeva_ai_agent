// create-lead.js
import mongoose from "mongoose";
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Treatment from "../../../models/Treatment";
import User from "../../../models/Users";
import Clinic from "../../../models/Clinic"; // ✅ Added
import { getUserFromReq, requireRole } from "./auth";
import csv from "csvtojson";
import multer from "multer";
import * as XLSX from "xlsx";
import Segment from "../../../models/Segment";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../bullmq/workflow";

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
  } else {
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

  // ✅ Check permission for creating leads (only for clinic, agent, and doctor; admin bypasses)
  if (me.role !== "admin" && clinicId) {
    // Check if clinic has create permission for "create_lead" module (not submodule)
    const { checkClinicPermission } = await import("./permissions-helper");
    const { hasPermission: clinicHasPermission, error: clinicError } =
      await checkClinicPermission(
        clinicId,
        "create_lead", // Check "create_lead" module permission
        "create",
        null, // No submodule - this is a module-level check
        me.role === "doctor"
          ? "doctor"
          : me.role === "clinic"
            ? "clinic"
            : null,
      );

    if (!clinicHasPermission) {
      return res.status(403).json({
        success: false,
        message: clinicError || "You do not have permission to create leads",
      });
    }

    // If user is an agent, also check agent-specific permissions
    if (me.role === "agent") {
      const { checkAgentPermission } =
        await import("../agent/permissions-helper");
      const { hasPermission: agentHasPermission, error: agentError } =
        await checkAgentPermission(
          me._id,
          "create_lead", // Check "create_lead" module permission
          "create",
          null, // No submodule
        );

      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to create leads",
        });
      }
    }
  }

  const mode = isMultipart ? body.mode || "bulk" : body.mode || "manual";

  try {
    // console.log({ mode });
    // ---------------- Manual Mode ----------------
    if (mode === "manual") {
      const {
        name,
        phone,
        email,
        gender,
        age,
        treatments,
        source,
        customSource,
        offerTag,
        status,
        customStatus,
        notes,
        followUps,
        assignedTo,
        segmentId,
      } = body;

      if (
        !name ||
        !phone ||
        !email ||
        !gender ||
        !source ||
        !treatments?.length
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Required fields missing" });
      }

      // Validate treatments
      const validatedTreatments = await Promise.all(
        treatments.map(async (t) => {
          if (!t.treatment) throw new Error("Treatment field missing");
          const treatmentName = t.treatment;

          const tDoc = mongoose.Types.ObjectId.isValid(treatmentName)
            ? await Treatment.findById(treatmentName)
            : await Treatment.findOne({
                name: { $regex: `^${treatmentName}$`, $options: "i" },
              });

          if (!tDoc) throw new Error(`Treatment not found: ${t.treatment}`);

          if (t.subTreatment) {
            const subExists = tDoc.subcategories?.some(
              (s) => s.name === t.subTreatment,
            );
            if (!subExists)
              throw new Error(`SubTreatment not found: ${t.subTreatment}`);
          }

          return { treatment: tDoc._id, subTreatment: t.subTreatment || null };
        }),
      );

      const followUpsArray = Array.isArray(followUps)
        ? followUps.map((f) => ({ date: new Date(f.date), addedBy: me._id }))
        : [];

      const notesArray = Array.isArray(notes)
        ? notes.map((n) => ({
            text: typeof n === "string" ? n : n.text,
            addedBy: me._id,
            createdAt: new Date(),
          }))
        : notes
          ? [{ text: notes, addedBy: me._id, createdAt: new Date() }]
          : [];

      let assignedArray = [];
      if (assignedTo) {
        const rawAssigned = Array.isArray(assignedTo)
          ? assignedTo
          : [assignedTo];

        assignedArray = await Promise.all(
          rawAssigned.map(async (val) => {
            if (mongoose.Types.ObjectId.isValid(val)) {
              return {
                user: new mongoose.Types.ObjectId(val),
                assignedAt: new Date(),
              };
            } else {
              const u = await User.findOne({
                name: { $regex: `^${val}$`, $options: "i" },
              });
              if (!u) throw new Error(`Assigned user not found: ${val}`);
              return { user: u._id, assignedAt: new Date() };
            }
          }),
        );
      }

      // ✅ Create lead with correct clinicId
      const lead = await Lead.create({
        clinicId,
        name,
        phone,
        email,
        gender,
        age,
        treatments: validatedTreatments,
        source,
        customSource,
        offerTag,
        status,
        customStatus,
        notes: notesArray,
        followUps: followUpsArray,
        assignedTo: assignedArray,
        segments: segmentId ? [segmentId] : [],
      });

      await Segment.findByIdAndUpdate(segmentId, {
        $addToSet: {
          leads: lead._id,
        },
      });

      // console.log({ lead });

      // Note: Execute workflow for the created lead
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.LEAD,
        trigger: WORKFLOW_TRIGGER_TYPE.NEW_LEAD,
        leadId: lead._id?.toString(),
        clinicId: clinicId?.toString(),
      });

      // Execute workflow for create_or_update_lead trigger
      executeWorkflows({
        entity: WORKFLOW_ENTITY_TYPE.LEAD,
        trigger: WORKFLOW_TRIGGER_TYPE.CREATE_OR_UPDATE_LEAD,
        leadId: lead._id?.toString(),
        clinicId: clinicId?.toString(),
      });

      return res.status(201).json({ success: true, lead });
    }

    // ---------------- Bulk Mode ----------------
    if (mode === "bulk") {
      if (!req.file)
        return res.status(400).json({ message: "File is required" });

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
        return res
          .status(400)
          .json({ message: "Unsupported file format. Upload CSV or Excel." });
      }

      const leadsToInsert = await Promise.all(
        jsonArray.map(async (row) => {
          let {
            name,
            phone,
            gender,
            age,
            treatments,
            source,
            customSource,
            offerTag,
            status,
            customStatus,
            notes,
            followUpDate,
            assignedTo,
          } = row;

          if (!name || !phone || !gender || !source || !treatments) {
            throw new Error(
              `Missing required fields in row: ${JSON.stringify(row)}`,
            );
          }

          const cleanedTreatments = treatments
            .toString()
            .replace(/[\[\]'"]/g, "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

          const parsedTreatments = await Promise.all(
            cleanedTreatments.map(async (entry) => {
              const [treatmentNameRaw, subTreatmentRaw] = entry.split(":");

              const treatmentName = treatmentNameRaw?.normalize("NFKC").trim();
              const subTreatment = subTreatmentRaw?.normalize("NFKC").trim();

              if (!treatmentName)
                throw new Error(`Invalid treatment entry: ${entry}`);

              let tDoc;
              if (subTreatment) {
                tDoc = await Treatment.findOne({
                  "subcategories.name": {
                    $regex: `^${treatmentName}$`,
                    $options: "i",
                  },
                });
              } else {
                tDoc = await Treatment.findOne({
                  name: { $regex: `^${treatmentName}$`, $options: "i" },
                });
              }

              if (!tDoc)
                throw new Error(`Treatment not found: ${treatmentName}`);

              if (subTreatment) {
                const exists = tDoc.subcategories?.some(
                  (s) =>
                    s.name?.trim().toLowerCase() === subTreatment.toLowerCase(),
                );
                if (!exists)
                  throw new Error(
                    `SubTreatment not found: ${subTreatment} for ${treatmentName}`,
                  );
              }

              return {
                treatment: tDoc._id,
                subTreatment: subTreatment || null,
              };
            }),
          );

          let assignedArray = [];
          if (assignedTo) {
            const rawAssigned = Array.isArray(assignedTo)
              ? assignedTo
              : assignedTo
                  .toString()
                  .split(",")
                  .map((a) => a.trim());

            assignedArray = await Promise.all(
              rawAssigned.map(async (val) => {
                if (mongoose.Types.ObjectId.isValid(val)) {
                  return {
                    user: new mongoose.Types.ObjectId(val),
                    assignedAt: new Date(),
                  };
                } else {
                  const u = await User.findOne({
                    name: { $regex: `^${val}$`, $options: "i" },
                  });
                  if (!u) throw new Error(`Assigned user not found: ${val}`);
                  return { user: u._id, assignedAt: new Date() };
                }
              }),
            );
          }

          return {
            clinicId, // ✅ fixed
            name: name.trim(),
            phone: phone.toString().trim(),
            gender: gender.trim(),
            age: age ? Number(age) : undefined,
            treatments: parsedTreatments,
            source: source.trim(),
            customSource: customSource?.trim() || null,
            offerTag: offerTag?.trim() || null,
            status: status?.trim() || "New",
            customStatus: customStatus?.trim() || null,
            notes: notes
              ? [{ text: notes, addedBy: me._id, createdAt: new Date() }]
              : [],
            followUps: followUpDate
              ? [{ date: new Date(followUpDate), addedBy: me._id }]
              : [],
            assignedTo: assignedArray,
          };
        }),
      );

      const createdLeads = await Lead.insertMany(leadsToInsert);
      return res
        .status(201)
        .json({ success: true, count: createdLeads.length });
    }

    return res.status(400).json({ success: false, message: "Invalid mode" });
  } catch (err) {
    // console.error("Error creating/uploading leads:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
