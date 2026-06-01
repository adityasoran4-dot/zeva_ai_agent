// pages/api/marketing/gmail-send.js
import dbConnect from "../../../lib/database";
import { getUserFromReq, requireRole } from "../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../lead-ms/permissions-helper";
import { sendEmailViaSmtp } from "../../../services/brevoSmtpService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Allow clinic, doctor, doctorStaff, staff, and agent roles
    if (!requireRole(user, ["clinic", "doctor", "doctorStaff", "staff", "agent", "admin"])) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied",
      });
    }

    // Check permissions for clinic/agent/doctor/doctorStaff/staff roles
    if (["clinic", "agent", "doctor", "doctorStaff", "staff"].includes(user.role)) {
      try {
        const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
        if (clinicError || !clinicId) {
          return res.status(403).json({ 
            success: false,
            message: clinicError || "Unable to determine clinic access" 
          });
        }

        const { hasPermission, error: permError } = await checkClinicPermission(
          clinicId,
          "clinic_staff_management",
          "create",
          "Gmail Marketing"
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permError || "You do not have permission to send emails"
          });
        }
      } catch (permErr) {
        // console.error("Permission check error:", permErr);
        return res.status(500).json({ success: false, message: "Error checking permissions" });
      }
    }

    const { subject, body, to, mediaUrl } = req.body;

    if (!subject || !body || !to) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: subject, body, or recipients",
      });
    }

    // Clean subject line - remove excessive punctuation and caps (spam triggers)
    const cleanSubject = subject
      .replace(/[!]{2,}/g, '!') // Remove multiple exclamation marks
      .replace(/[$]{2,}/g, '$') // Remove multiple dollar signs
      .replace(/\b(FREE|FREE!!!|CLICK HERE|BUY NOW|URGENT|ACT NOW)\b/gi, '') // Remove common spam words
      .trim()
      .substring(0, 78); // Keep subject under 78 characters (email standard)

    const recipients = Array.isArray(to) ? to : [to];
    if (!recipients.length) {
      return res.status(400).json({
        success: false,
        message: "At least one recipient email is required",
      });
    }

    // Use verified sender email from Brevo (must be verified in Brevo account)
    const senderName = process.env.BREVO_DEFAULT_SENDER_NAME || user.name || "Ayurveda Clinic";
    const senderEmail = process.env.BREVO_DEFAULT_SENDER_EMAIL || "diglip4@gmail.com";

    if (!senderEmail) {
      return res.status(500).json({
        success: false,
        message:
          "Sender email not configured. Set BREVO_DEFAULT_SENDER_EMAIL in env.",
      });
    }

    // Build professional HTML email with anti-spam best practices
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Clean and format body text
    const cleanBody = body.replace(/\n/g, "<br/>");
    
    // Function to build HTML for each recipient (with their unsubscribe link)
    const buildHtmlContent = (recipientEmail) => {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
      
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #ffffff; border-bottom: 1px solid #e0e0e0;">
              <h1 style="margin: 0; font-size: 24px; color: #333333; font-weight: 600;">${senderName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${mediaUrl ? `<div style="margin-bottom: 30px; text-align: center;"><img src="${mediaUrl}" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;"/></div>` : ''}
              <div style="font-size: 16px; line-height: 1.6; color: #333333;">
                ${cleanBody}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666666; text-align: center;">
              <p style="margin: 0 0 10px 0;">This email was sent to you by ${senderName}.</p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe</a> | 
                <a href="mailto:${senderEmail}" style="color: #666666; text-decoration: underline;">Contact Us</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    };

    // Create plain text version (important for deliverability)
    const textContent = body.replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n');

    // Send emails individually to each recipient (better deliverability)
    const results = [];
    
    for (const recipientEmail of recipients) {
      try {
        const recipientHtmlContent = buildHtmlContent(recipientEmail);
        const recipientUnsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
        
        const response = await sendEmailViaSmtp({
          to: recipientEmail,
          subject: cleanSubject,
          html: recipientHtmlContent,
          text: textContent,
          from: {
            name: senderName,
            email: senderEmail,
          },
          replyTo: senderEmail,
          unsubscribeUrl: recipientUnsubscribeUrl,
        });
        
        results.push({
          to: recipientEmail,
          status: response.accepted?.includes(recipientEmail) ? "success" : "failed",
        });
      } catch (err) {
        // console.error(`Failed to send email to ${recipientEmail}:`, err);
        results.push({
          to: recipientEmail,
          status: "failed",
          error: err.message,
        });
      }
    }
    
    const successCount = results.filter(r => r.status === "success").length;
    
    return res.status(200).json({
      success: successCount > 0,
      message: `Emails sent: ${successCount}/${recipients.length} successful`,
      data: results,
    });
  } catch (err) {
    // console.error("Gmail Send API error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error",
      error: err.error || err,
    });
  }
}


