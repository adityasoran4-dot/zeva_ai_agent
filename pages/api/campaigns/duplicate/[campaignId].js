import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import dbConnect from "../../../../lib/database";
import Campaign from "../../../../models/Campaign";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
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
    const { campaignId } = req.query;

    let campaign = await Campaign.findOne({
      _id: campaignId,
      clinicId,
    });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign not found or you do not have access to delete this campaign",
      });
    }

    const duplicateCampaign = await Campaign.create({
      clinicId: campaign.clinicId,
      userId: campaign.userId,
      name: `${campaign.name} (Duplicate)`,
      description: campaign.description,
      type: campaign.type,
      sender: campaign.sender,
      segmentId: campaign.segmentId,
      recipientType: campaign.recipientType,
      manualNumbers: campaign.manualNumbers,
      recipients: campaign.recipients,
      template: campaign.template,
      subject: campaign.subject,
      preheader: campaign.preheader,
      editorType: campaign.editorType,
      content: campaign.content,
      designJson: campaign.designJson,
      mediaUrl: campaign.mediaUrl,
      mediaType: campaign.mediaType,
      attachments: campaign.attachments,
      variableMappings: campaign.variableMappings,
      headerVariableMappings: campaign.headerVariableMappings,
      buttonVariableMappings: campaign.buttonVariableMappings,
      headerParameters: campaign.headerParameters,
      bodyParameters: campaign.bodyParameters,
      status: "draft",
    });

    return res.status(200).json({
      success: true,
      message: "Campaign duplicated successfully",
      data: duplicateCampaign,
    });
  } catch (err) {
    console.error("Error duplicating campaign:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
