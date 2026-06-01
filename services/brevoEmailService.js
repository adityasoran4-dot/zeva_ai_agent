// services/brevoEmailService.js
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Initialize the Brevo API client (following Brevo's official example)
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Set API key from environment variable
const brevoApiKey = process.env.BREVO_API_KEY;

if (!brevoApiKey) {
  console.error('⚠️ BREVO_API_KEY environment variable is not set');
} else {
  // Validate API key format (should start with 'xkeysib-' for API v3 keys)
  if (!brevoApiKey.startsWith('xkeysib-') && !brevoApiKey.startsWith('xsmtpsib-')) {
    console.warn('⚠️ BREVO_API_KEY format may be incorrect. API v3 keys should start with "xkeysib-"');
  }
  apiKey.apiKey = brevoApiKey;
  console.log('✅ Brevo API client initialized with key:', brevoApiKey.substring(0, 15) + '...');
}

/**
 * Create an email campaign via Brevo API
 * @param {Object} campaignData - Campaign configuration
 * @param {string} campaignData.name - Campaign name
 * @param {string} campaignData.subject - Email subject
 * @param {Object} campaignData.sender - Sender info {name, email}
 * @param {string} campaignData.htmlContent - HTML content of the email
 * @param {Array<number>} campaignData.listIds - List IDs for recipients
 * @param {string} campaignData.scheduledAt - Optional scheduled date (format: 'YYYY-MM-DD HH:mm:ss')
 * @param {string} campaignData.type - Campaign type (default: 'classic')
 * @returns {Promise<Object>} Created campaign data
 */
async function createEmailCampaign(campaignData) {
  try {
    // Validate API key is set
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }
    
    // Create API instance (API key is already set globally)
    const emailCampaignsApi = new SibApiV3Sdk.EmailCampaignsApi();
    
    const {
      name,
      subject,
      sender,
      htmlContent,
      listIds = [],
      scheduledAt,
      type = 'classic'
    } = campaignData;

    // Validate required fields
    if (!name || !subject || !sender || !htmlContent) {
      throw new Error('Missing required fields: name, subject, sender, or htmlContent');
    }

    if (!sender.name || !sender.email) {
      throw new Error('Sender must have both name and email');
    }

    // Create campaign object
    const emailCampaigns = new SibApiV3Sdk.CreateEmailCampaign();
    emailCampaigns.name = name;
    emailCampaigns.subject = subject;
    emailCampaigns.sender = sender;
    emailCampaigns.type = type;
    emailCampaigns.htmlContent = htmlContent;

    // Set recipients if listIds provided
    if (listIds.length > 0) {
      emailCampaigns.recipients = { listIds };
    }

    // Schedule if provided
    if (scheduledAt) {
      emailCampaigns.scheduledAt = scheduledAt;
    }

    // Make API call
    const data = await emailCampaignsApi.createEmailCampaign(emailCampaigns);
    return {
      success: true,
      data: data,
      message: 'Campaign created successfully'
    };
  } catch (error) {
    console.error('Brevo API Error:', error);
    
    // Extract more detailed error information
    let errorMessage = error.message || 'Failed to create email campaign';
    let errorDetails = error.response?.body || error;
    
    // Check for authentication errors
    if (error.status === 401 || error.response?.status === 401) {
      errorMessage = 'Brevo API authentication failed. Please check your BREVO_API_KEY.';
      const keyPreview = brevoApiKey ? `${brevoApiKey.substring(0, 15)}...` : 'NOT SET';
      console.error('❌ API Key used:', keyPreview);
      console.error('💡 Note: API v3 keys should start with "xkeysib-". SMTP passwords (xsmtpsib-) cannot be used for API calls.');
      console.error('💡 Get your API key from: Brevo Dashboard > SMTP & API > API Keys');
    }
    
    throw {
      success: false,
      message: errorMessage,
      error: errorDetails
    };
  }
}

/**
 * Send transactional email via SMTP
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.htmlContent - HTML content
 * @param {string} emailData.textContent - Plain text content (optional)
 * @param {Object} emailData.sender - Sender info {name, email}
 * @returns {Promise<Object>} Send result
 */
async function sendTransactionalEmail(emailData) {
  try {
    // Validate API key is set
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }
    
    // Create API instance (API key is already set globally)
    const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();
    
    const {
      to,
      subject,
      htmlContent,
      textContent,
      sender
    } = emailData;

    if (!to || !subject || !htmlContent || !sender) {
      throw new Error('Missing required fields: to, subject, htmlContent, or sender');
    }

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }

    const data = await transactionalEmailsApi.sendTransacEmail(sendSmtpEmail);
    return {
      success: true,
      data: data,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Brevo Transactional Email Error:', error);
    
    // Extract more detailed error information
    let errorMessage = error.message || 'Failed to send transactional email';
    let errorDetails = error.response?.body || error;
    
    // Check for authentication errors
    if (error.status === 401 || error.response?.status === 401) {
      errorMessage = 'Brevo API authentication failed. Please check your BREVO_API_KEY.';
      const keyPreview = brevoApiKey ? `${brevoApiKey.substring(0, 15)}...` : 'NOT SET';
      console.error('❌ API Key used:', keyPreview);
      console.error('💡 Note: API v3 keys should start with "xkeysib-". SMTP passwords (xsmtpsib-) cannot be used for API calls.');
      console.error('💡 Get your API key from: Brevo Dashboard > SMTP & API > API Keys');
    }
    
    throw {
      success: false,
      message: errorMessage,
      error: errorDetails
    };
  }
}

module.exports = {
  createEmailCampaign,
  sendTransactionalEmail
};

