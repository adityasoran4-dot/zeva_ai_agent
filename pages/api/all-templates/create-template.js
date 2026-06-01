import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Provider from "../../../models/Provider";
import Template from "../../../models/Template";
import {
  createWhatsAppTemplate,
  getWhatsappHandlerId,
  getWhatsappUploadId,
} from "../../../services/whatsapp";
import dbConnect from "../../../lib/database";
import multer from "multer";

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
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Get clinicId based on user role
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({
        success: false,
        message: "Clinic not found for this user",
      });
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
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId;
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "clinicId is required for admin",
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    let {
      templateType,
      name,
      uniqueName,
      subject,
      category,
      language,
      content,
      provider,
      variables = [],
      bodyVariableSampleValues = [],
      headerVariables = [],
      headerVariableSampleValues = [],
      templateButtons = [],
      ...rest
    } = body;

    // Safe JSON parse helper: handles arrays, JSON strings, empty strings, and invalid JSON
    const safeParseArray = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        const t = val.trim();
        if (t === "" || t === "undefined") return [];
        try {
          const parsed = JSON.parse(t);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      }
      return [];
    };

    variables = safeParseArray(req.body?.variables ?? variables);
    headerVariables = safeParseArray(headerVariables);
    bodyVariableSampleValues = safeParseArray(bodyVariableSampleValues);
    headerVariableSampleValues = safeParseArray(headerVariableSampleValues);
    templateButtons = safeParseArray(templateButtons);

    // console.log({
    //   templateButtons,
    //   bodyVariableSampleValues,
    //   variables,
    //   headerVariables,
    //   headerVariableSampleValues,
    // });

    let newTemplate;

    // Validate templateType
    const allowedTypes = ["sms", "email", "whatsapp"];
    if (!templateType || !allowedTypes.includes(templateType)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing templateType. Must be one of: sms, email, whatsapp",
      });
    }

    if (templateType === "sms") {
      newTemplate = new Template({
        clinicId,
        templateType,
        provider,
        name,
        uniqueName,
        content,
        category,
        status: "approved",
        variables,
        language,
        ...rest,
      });
    } else if (templateType === "email") {
      newTemplate = new Template({
        clinicId,
        templateType,
        provider,
        name,
        uniqueName,
        subject,
        content,
        status: "approved",
        variables,
        language,
        ...rest,
      });
    } else if (templateType === "whatsapp") {
      // console.log({ provider });
      const findProvider = await Provider.findById(provider);
      if (!findProvider) {
        return res.status(404).json({
          success: false,
          message: "Provider not found",
        });
      }

      const accessToken = findProvider?.secrets?.whatsappAccessToken;
      const whatsappNumberId = findProvider?.secrets?.wabaId;
      // console.log({ accessToken, whatsappNumberId });

      if (!accessToken || !whatsappNumberId) {
        return res.status(400).json({
          success: false,
          message: "Invalid provider credentials",
        });
      }

      let resData;
      if (!rest.isHeader || (rest.isHeader && rest.headerType === "text")) {
        resData = await createWhatsAppTemplate(whatsappNumberId, accessToken, {
          uniqueName,
          category,
          language,
          content,
          variables,
          bodyVariableSampleValues,
          headerVariables,
          headerVariableSampleValues,
          templateButtons,
          ...rest,
        });
      } else {
        if (!req.file) {
          return res
            .status(400)
            .json({ success: false, message: "No file uploaded" });
        }

        // Extract file details
        const { originalname, mimetype, buffer, size } = req.file;

        // Sanitize the filename by replacing spaces with underscores
        const sanitizedFilename = originalname.replace(/\s+/g, "_");

        // console.log("File Name:", sanitizedFilename);
        // console.log("File Type:", mimetype);
        // console.log("File Size:", size); // File size in bytes
        // console.log("File Buffer:", buffer);

        let whatsappUploadId = await getWhatsappUploadId(
          size,
          mimetype,
          accessToken
        );
        if (whatsappUploadId) {
          let whatsappHandlerId = await getWhatsappHandlerId(
            whatsappUploadId,
            buffer,
            accessToken
          );

          resData = await createWhatsAppTemplate(
            whatsappNumberId,
            accessToken,
            {
              uniqueName,
              category,
              language,
              content,
              variables,
              bodyVariableSampleValues,
              headerVariables,
              headerVariableSampleValues,
              whatsappHandlerId,
              templateButtons,
              ...rest,
            }
          );
        }
      }

      if (!resData || !resData.id) {
        return res.status(500).json({
          success: false,
          message: "Failed to create WhatsApp template",
        });
      }

      const templateId = resData.id;

      newTemplate = new Template({
        clinicId,
        templateType,
        provider,
        name,
        uniqueName,
        category,
        content,
        status: resData?.status?.toLowerCase() || "pending",
        variables,
        headerVariables,
        headerVariableSampleValues,
        bodyVariableSampleValues,
        templateId,
        language,
        templateButtons,
        ...rest,
      });
    }

    await newTemplate.save();

    return res.status(201).json({
      success: true,
      message: "Template created successfully.",
      data: newTemplate,
    });
  } catch (err) {
    // console.error("Error creating template:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
