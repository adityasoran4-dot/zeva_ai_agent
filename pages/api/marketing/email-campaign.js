// pages/api/marketing/email-campaign.js
import dbConnect from "../../../lib/database";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { createEmailCampaign, sendTransactionalEmail } from "../../../services/brevoEmailService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Authenticate user
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check permissions - adjust roles as needed
    if (!requireRole(user, ["admin", "clinic", "doctor"])) {
      return res.status(403).json({ 
        success: false, 
        message: "Forbidden: Insufficient permissions to create email campaigns" 
      });
    }

    const { campaignType, ...campaignData } = req.body;

    // Validate Brevo API key
    if (!process.env.BREVO_API_KEY) {
      // console.error('BREVO_API_KEY is not set in environment variables');
      return res.status(500).json({ 
        success: false, 
        message: "Brevo API key not configured. Please set BREVO_API_KEY in environment variables." 
      });
    }
    
    // Log API key status (first 10 chars only for security)
    // console.log('Brevo API Key loaded:', process.env.BREVO_API_KEY ? `${process.env.BREVO_API_KEY.substring(0, 10)}...` : 'NOT FOUND');

    let result;

    // Handle different campaign types
    if (campaignType === "campaign") {
      // Create email campaign
      const {
        name,
        subject,
        sender,
        htmlContent,
        listIds,
        scheduledAt,
        type = "classic"
      } = campaignData;

      if (!name || !subject || !sender || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, subject, sender, or htmlContent"
        });
      }

      result = await createEmailCampaign({
        name,
        subject,
        sender,
        htmlContent,
        listIds: listIds || [],
        scheduledAt,
        type
      });
    } else if (campaignType === "transactional") {
      // Send transactional email
      const {
        to,
        subject,
        htmlContent,
        textContent,
        sender
      } = campaignData;

      if (!to || !subject || !htmlContent || !sender) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: to, subject, htmlContent, or sender"
        });
      }

      result = await sendTransactionalEmail({
        to,
        subject,
        htmlContent,
        textContent,
        sender
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid campaignType. Must be 'campaign' or 'transactional'"
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    // console.error("Email Campaign API error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      error: err.error || err
    });
  }
}

