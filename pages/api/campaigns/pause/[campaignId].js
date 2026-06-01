import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import dbConnect from "../../../../lib/database";
import Campaign from "../../../../models/Campaign";
import Message from "../../../../models/Message";
import { scheduleWhatsappCampaignQueue } from "../../../../bullmq/queue";

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

    // Ensure the campaign is completed
    if (campaign.status !== "processing") {
      return res.status(400).json({
        success: false,
        message: "Campaign has not been processing yet",
      });
    }

    // Update the campaign status to 'paused'
    campaign.status = "paused";
    await campaign.save();

    const jobId = campaign.jobId;
    if (campaign.type === "whatsapp") {
      let whatsappCampaignJob =
        await scheduleWhatsappCampaignQueue.getJob(jobId);
      if (whatsappCampaignJob) {
        await whatsappCampaignJob.remove();
        console.log(
          `Whatsapp campaign job removed successfully of JobId : ${jobId}`,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Campaign paused successfully",
    });
  } catch (err) {
    console.error("Error pausing campaign:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
