import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import Provider from "../../../../models/Provider";
import Template from "../../../../models/Template";
import {
  getWhatsappHandlerId,
  getWhatsappUploadId,
  updateWhatsAppTemplate,
} from "../../../../services/whatsapp";
import dbConnect from "../../../../lib/database";
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

  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
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
    const { templateId } = req.query;
    // console.log("Updating template with ID:", templateId);
    let {
      templateType,
      name,
      uniqueName,
      category,
      language,
      subject,
      preheader,
      content,
      designJson,
      editorType,
      provider,
      variables,
      bodyVariableSampleValues,
      headerVariables,
      headerVariableSampleValues,
      templateButtons,
      emailTemplateType, // for email editor type
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

    let template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Update Template
    template.category = category || template.category;
    template.subject = subject || template.subject;
    template.preheader = preheader || template.preheader;
    template.content = content || template.content;
    template.designJson = designJson || template.designJson;
    template.editorType = editorType || template.editorType;
    template.variables = variables || template.variables;
    template.headerVariables = headerVariables || template.headerVariables;
    template.templateButtons = templateButtons || template.templateButtons;
    template.bodyVariableSampleValues =
      bodyVariableSampleValues || template.bodyVariableSampleValues;
    template.headerVariableSampleValues =
      headerVariableSampleValues || template.headerVariableSampleValues;

    template.headerText = rest.headerText || template.headerText;
    template.footerText = rest.footerText || template.footerText;
    template.isHeader = rest.isHeader ?? template.isHeader;
    template.isFooter = rest.isFooter ?? template.isFooter;
    template.headerType = rest.headerType || template.headerType;

    // for email template type
    template.emailTemplateType =
      emailTemplateType || template.emailTemplateType;

    if (templateType === "whatsapp") {
      const findProvider = await Provider.findById(template.provider);
      if (!findProvider) {
        return res.status(404).json({
          success: false,
          message: "Provider not found",
        });
      }

      const whatsappTemplateId = template.templateId;
      const accessToken = findProvider?.secrets?.whatsappAccessToken;
      const whatsappNumberId = findProvider?.secrets?.wabaId;

      if (!accessToken || !whatsappNumberId) {
        return res.status(400).json({
          success: false,
          message: "Invalid provider credentials",
        });
      }

      let resData;
      if (!rest.isHeader || (rest.isHeader && rest.headerType === "text")) {
        resData = await updateWhatsAppTemplate(
          whatsappTemplateId,
          accessToken,
          {
            templateId: template.templateId, // Pass existing WhatsApp template ID
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
          },
        );
      } else {
        if (!req.file) {
          return res
            .status(400)
            .json({ success: false, message: "No file uploaded" });
        }

        const { originalname, mimetype, buffer, size } = req.file;
        const sanitizedFilename = originalname.replace(/\s+/g, "_");

        let whatsappUploadId = await getWhatsappUploadId(
          size,
          mimetype,
          accessToken,
        );
        if (whatsappUploadId) {
          let whatsappHandlerId = await getWhatsappHandlerId(
            whatsappUploadId,
            buffer,
            accessToken,
          );

          resData = await updateWhatsAppTemplate(
            whatsappTemplateId,
            accessToken,
            {
              templateId: template.templateId, // Pass existing WhatsApp template ID
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
            },
          );
        }
      }
      // console.log({ resData });

      if (!resData) {
        return res.status(500).json({
          success: false,
          message: "Failed to update WhatsApp template",
        });
      }

      template.status = resData?.status?.toLowerCase() || "pending";
    }

    await template.save();

    return res.status(200).json({
      success: true,
      message: "Template updated successfully",
      data: template,
    });
  } catch (err) {
    // console.error("Error updating template:", err);

    return res.status(500).json({
      success: false,
      message: err?.error_user_msg || err.message || "Internal Server Error",
    });
  }
}
