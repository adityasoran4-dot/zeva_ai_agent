import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import Provider from "../../../../models/Provider";
import Template from "../../../../models/Template";
import { deleteWhatsappTemplate } from "../../../../services/whatsapp";
import dbConnect from "../../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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

    let template = await Template.findOne({
      _id: templateId,
      clinicId,
    });
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found or you do not have access to it",
      });
    }

    if (
      template?.templateType === "sms" ||
      template?.templateType === "email"
    ) {
      await Template.findByIdAndDelete(templateId);
    } else if (template?.templateType === "whatsapp") {
      const provider = await Provider.findById(template.provider);
      const accessToken = provider?.secrets?.whatsappAccessToken;
      const wabaId = provider?.secrets?.wabaId;

      await deleteWhatsappTemplate(accessToken, wabaId, template.uniqueName);
      await Template.findByIdAndDelete(templateId);
    }

    return res.status(200).json({
      success: true,
      message: "Template deleted successfully",
      data: template,
    });
  } catch (err) {
    // console.error("Error delete template:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
