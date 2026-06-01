// import-lead.js
import mongoose from "mongoose";
import multer from "multer";
import dbConnect from "../../../../lib/database";
import Lead from "../../../../models/Lead";
import User from "../../../../models/Users";
import Clinic from "../../../../models/Clinic"; // ✅ Added
import Segment from "../../../../models/Segment";
import { getUserFromReq, requireRole } from "../auth";
import {
  executeWorkflows,
  WORKFLOW_ENTITY_TYPE,
  WORKFLOW_TRIGGER_TYPE,
} from "../../../../bullmq/workflow";

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

  // console.log({ body });

  let me = await getUserFromReq(req);
  if (!me && body.userEmail) {
    me = await User.findOne({ email: body.userEmail });
  }
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
    const { checkClinicPermission } = await import("../permissions-helper");
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
        await import("../../agent/permissions-helper");
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

  try {
    let {
      name,
      phone,
      email,
      gender = "Male",
      age,
      segmentId,
      additionalInfo,
    } = body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing" });
    }

    // ✅ Create lead with correct clinicId
    const lead = await Lead.create({
      clinicId,
      name,
      phone,
      email,
      source: "Website",
      segments: segmentId ? [segmentId] : [],
      ...(additionalInfo
        ? {
            notes: [
              {
                text: additionalInfo,
                addedBy: clinicId,
              },
            ],
          }
        : {}),
      ...(gender ? { gender } : {}),
      ...(age ? { age } : {}),
    });

    // console.log("Created lead:", lead);

    await Segment.findByIdAndUpdate(segmentId, {
      $addToSet: {
        leads: lead._id,
      },
    });

    // Note: Execute workflow for the created lead
    executeWorkflows({
      entity: WORKFLOW_ENTITY_TYPE.LEAD,
      trigger: WORKFLOW_TRIGGER_TYPE.NEW_LEAD,
      leadId: lead._id?.toString(),
      clinicId: lead.clinicId?.toString(),
    });

    // Execute workflow for create_or_update_lead trigger
    executeWorkflows({
      entity: WORKFLOW_ENTITY_TYPE.LEAD,
      trigger: WORKFLOW_TRIGGER_TYPE.CREATE_OR_UPDATE_LEAD,
      leadId: lead._id?.toString(),
      clinicId: lead.clinicId?.toString(),
    });

    return res.status(200).json({ success: true, message: "Success", lead });
  } catch (err) {
    // console.error("Error in importing lead from ramacare:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
