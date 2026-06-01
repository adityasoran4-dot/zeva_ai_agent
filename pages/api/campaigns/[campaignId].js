import { calculateDelay } from "../../../bullmq/helper";
import { scheduleWhatsappCampaignQueue } from "../../../bullmq/queue";
import dbConnect from "../../../lib/database";
import Campaign from "../../../models/Campaign";
import Segment from "../../../models/Segment";
import Lead from "../../../models/Lead";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;
  const { campaignId } = req.query;

  switch (method) {
    case "GET":
      return getSingleCampaign(req, res, campaignId);
    case "PUT":
      return updateCampaign(req, res, campaignId);
    case "DELETE":
      return deleteCampaign(req, res, campaignId);
    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

// GET - Fetch single campaign by ID
async function getSingleCampaign(req, res, campaignId) {
  try {
    // Authenticate user
    const user = await getUserFromReq(req);
    if (!user) return;

    const campaign = await Campaign.findById(campaignId)
      .populate("clinicId", "name")
      .populate("userId", "name email")
      .populate(
        "template",
        "name uniqueName category language status content headerText headerType headerFileUrl isHeader isFooter footer isButton templateButtons",
      )
      .populate("sender", "name label phone type")
      .populate("segmentId", "name")
      .populate("recipients", "name phone email")
      .lean()
      .exec();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check if user has access to this campaign (clinic owner or member)
    // if (campaign.clinicId._id.toString() !== user.clinicId?.toString()) {
    //   // Check if user is admin of the platform
    //   if (user.role !== "admin") {
    //     return res.status(403).json({
    //       success: false,
    //       message: "You don't have permission to access this campaign",
    //     });
    //   }
    // }

    return res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching campaign",
      error: error.message,
    });
  }
}

// PUT - Update campaign
async function updateCampaign(req, res, campaignId) {
  try {
    // Authenticate user
    const user = await getUserFromReq(req);
    if (!user) return;

    let {
      name,
      description,
      sender,
      segmentId,
      template,
      whatsappMsgType,
      content,
      headerText,
      footerText,
      replyButtons,
      listSections,
      mediaUrl,
      mediaType,
      headerParameters,
      bodyParameters,
      variableMappings,
      headerVariableMappings,
      buttonVariableMappings,
      scheduleType,
      scheduleTime,
      isDraft = true,

      // for recipients (manual numbers or segment)
      recipientType,
      manualNumbers,
    } = req.body;

    // Find campaign
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const segment = await Segment.findById(segmentId || campaign.segmentId);

    // Update campaign fields
    if (name !== undefined) campaign.name = name;
    if (description !== undefined) campaign.description = description;
    if (sender !== undefined) campaign.sender = sender;
    if (segmentId !== undefined) campaign.segmentId = segmentId;
    campaign.recipients = segment?.leads || [];

    if (template !== undefined) campaign.template = template;
    if (whatsappMsgType !== undefined)
      campaign.whatsappMsgType = whatsappMsgType;
    if (content !== undefined) campaign.content = content;
    if (headerText !== undefined) campaign.headerText = headerText;
    if (footerText !== undefined) campaign.footerText = footerText;
    if (replyButtons !== undefined) campaign.replyButtons = replyButtons;
    if (listSections !== undefined) campaign.listSections = listSections;
    if (mediaUrl !== undefined) campaign.mediaUrl = mediaUrl;
    if (mediaType !== undefined) campaign.mediaType = mediaType;
    if (headerParameters !== undefined)
      campaign.headerParameters = headerParameters;
    if (bodyParameters !== undefined) campaign.bodyParameters = bodyParameters;
    campaign.scheduleType = scheduleType || campaign.scheduleType;
    campaign.scheduleTime = scheduleTime || campaign.scheduleTime;
    campaign.variableMappings = variableMappings || campaign.variableMappings;
    campaign.headerVariableMappings =
      headerVariableMappings || campaign.headerVariableMappings;
    campaign.buttonVariableMappings =
      buttonVariableMappings || campaign.buttonVariableMappings;

    // Update recipientType and manualNumbers
    if (recipientType !== undefined) campaign.recipientType = recipientType;
    if (manualNumbers !== undefined) campaign.manualNumbers = manualNumbers;

    await campaign.save();

    // TODO: Calculate and deduct credits

    // generate custom job id for unique identifier for every job
    const customJobId = `${campaignId}-${Date.now()}`;
    let queueJob;
    // Calculate delay based on scheduling type
    let delay = 0;
    if (scheduleType === "later") {
      const timezone = "Asia/Kolkata";
      delay = calculateDelay(scheduleTime.date, scheduleTime.time, timezone);
      console.log({ delay });

      if (delay <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid schedule time" });
      }
    }

    if (!isDraft) {
      // deduct credit first and then schedule campaign
      // if (campaign.type === "whatsapp") {
      //   if (team.whatsappCredits <= 0) {
      //     return res.status(400).json({
      //       success: false,
      //       message: "Insufficient WhatsApp credits. Please recharge.",
      //     });
      //   }

      //   // Deduct WhatsApp credits directly from team.whatsappCredits
      //   team.whatsappCredits -= credits;
      // }
      // it means we need to schedule this campaign now or later

      // if recipientType is manual then create leads and segment and add to segment
      if (recipientType === "manual") {
        // Create leads and segment
        // Add leads to segment
        const newSegment = await Segment.create({
          name: `${campaign?.name || "Untitled Campaign"}`,
          clinicId: campaign.clinicId,
          userId: campaign.userId,
        });

        console.log({ manualNumbers });
        // remove duplicate numbers from manualNumbers
        manualNumbers = manualNumbers
          .split("\n")
          .map((number) => number.trim());
        const uniqueNumbers = [...new Set(manualNumbers)];
        console.log({ uniqueNumbers, manualNumbers });

        const leadsData = uniqueNumbers.map((number) => ({
          clinicId: campaign.clinicId,
          phone: number,
          name: number,
          segments: [],
          source: "Other",
          customSource: "Zeva Campaign",
        }));
        for (let i = 0; i < leadsData.length; i++) {
          // find lead by phone number
          const lead = await Lead.findOne({
            phone: leadsData[i].phone,
            clinicId: campaign.clinicId,
          });
          if (!lead) {
            const newLead = await Lead.create(leadsData[i]);
            newLead.segments.push(newSegment);
            newSegment.leads.push(newLead?._id);
            await newLead.save();
          } else {
            newSegment.leads.push(lead?._id);
          }
          await newSegment.save();
        }

        campaign.segmentId = newSegment._id;
        campaign.recipients = newSegment.leads;
        await campaign.save();
      }

      // if campaign type is whatsapp then schedule it
      if (campaign.type === "whatsapp") {
        queueJob = await scheduleWhatsappCampaignQueue.add(
          "scheduleWhatsappQueue",
          {
            campaignId,
          },
          {
            delay: scheduleType === "later" ? delay : 0,
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true,
            jobId: customJobId,
          },
        );
      }

      campaign.jobId = queueJob.id;
      campaign.status = scheduleType === "now" ? "processing" : "scheduled";
      await Promise.all([campaign.save()]);
    }

    // Populate the updated campaign
    const updatedCampaign = await Campaign.findById(campaignId)
      .populate("clinicId", "name")
      .populate("userId", "name email")
      .populate(
        "template",
        "name uniqueName category language status content headerText headerType headerFileUrl isHeader isFooter footer isButton templateButtons",
      )
      .populate("sender", "name label phone type")
      .populate("segmentId", "name")
      .lean();

    return res.status(200).json({
      success: true,
      campaign: updatedCampaign,
      message: "Campaign updated successfully",
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating campaign",
      error: error.message,
    });
  }
}

// DELETE - Delete campaign
async function deleteCampaign(req, res, campaignId) {
  try {
    // Authenticate user
    const user = await getUserFromReq(req);
    if (!user) return;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Prevent deletion of active campaigns
    if (["processing", "scheduled"].includes(campaign.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a campaign that is processing or scheduled",
      });
    }

    await Campaign.findByIdAndDelete(campaignId);

    return res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting campaign",
      error: error.message,
    });
  }
}
