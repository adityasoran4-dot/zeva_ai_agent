// services/brevoSmtpService.js
const nodemailer = require('nodemailer');

// Create SMTP transporter using Brevo SMTP credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER || '9c2a53001@smtp-brevo.com',
      pass: process.env.BREVO_SMTP_PASSWORD || '3nmZLafgbzWPxpJh',
    },
  });
};

/**
 * Send email via SMTP
 * @param {Object} emailData - Email data
 * @param {string|Array} emailData.to - Recipient email(s)
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML content
 * @param {string} emailData.text - Plain text content (optional)
 * @param {Object} emailData.from - Sender info {name, email}
 * @param {string} emailData.replyTo - Reply-to email (optional)
 * @returns {Promise<Object>} Send result
 */
async function sendEmailViaSmtp(emailData) {
  try {
    const {
      to,
      subject,
      html,
      text,
      from,
      replyTo,
    } = emailData;

    if (!to || !subject || !html || !from) {
      throw new Error('Missing required fields: to, subject, html, or from');
    }

    if (!from.email) {
      throw new Error('Sender email is required');
    }

    const transporter = createTransporter();

    // Format recipients
    const recipients = Array.isArray(to) ? to : [to];
    
    // Format sender
    const fromAddress = from.name 
      ? `${from.name} <${from.email}>`
      : from.email;

    // Use unsubscribe URL from emailData if provided
    const unsubscribeUrl = emailData.unsubscribeUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/unsubscribe?email={email}`;
    
    const mailOptions = {
      from: fromAddress,
      to: recipients.join(', '),
      subject: subject,
      html: html,
      ...(text && { text: text }),
      ...(replyTo && { replyTo: replyTo }),
      // Anti-spam headers (important for inbox delivery)
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Mailer': 'Ayurveda Clinic Email System',
        'X-Priority': '3',
        'Importance': 'normal',
        'MIME-Version': '1.0',
        'Content-Type': 'text/html; charset=UTF-8',
        'X-Auto-Response-Suppress': 'All',
        'Message-ID': `<${Date.now()}-${Math.random().toString(36).substring(7)}@ayurvedaclinic.com>`,
      },
      // Additional options for better deliverability
      priority: 'normal',
      date: new Date(),
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      message: 'Email sent successfully via SMTP',
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error('Brevo SMTP Error:', error);
    
    let errorMessage = error.message || 'Failed to send email via SMTP';
    
    // Check for sender validation errors
    if (error.message && error.message.includes('sender') && error.message.includes('not valid')) {
      errorMessage = `Sender email "${from.email}" is not verified in Brevo. Please verify this email in your Brevo dashboard (Senders & IP section) or use a different verified sender email.`;
      console.error('❌ Sender validation error:', errorMessage);
      console.error('💡 To fix: Go to Brevo Dashboard → Senders & IP → Verify your sender email');
    } else if (error.responseCode === 550 || error.code === 'EAUTH') {
      errorMessage = 'SMTP authentication failed. Please check your BREVO_SMTP_USER and BREVO_SMTP_PASSWORD.';
    }
    
    throw {
      success: false,
      message: errorMessage,
      error: error,
    };
  }
}

module.exports = {
  sendEmailViaSmtp,
  createTransporter,
};

