// pages/api/system/check-cloudinary.js
import { multiCloudinary } from '../../../lib/cloudinary-multi';
import { screenshotService } from '../../../lib/screenshot-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Get account information
    const accountInfo = multiCloudinary.getAccountInfo();
    
    // Test screenshot account specifically
    const screenshotAccountValid = screenshotService.validateScreenshotAccount();
    const screenshotAccountInfo = screenshotService.getAccountInfo();
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      system: 'Desk Time Screenshot System',
      accounts: {
        primary: {
          purpose: 'General uploads (avatars, documents, etc.)',
          cloudName: accountInfo.primary.cloudName,
          uploadPreset: accountInfo.primary.uploadPreset,
          valid: accountInfo.primary.isValid,
          status: accountInfo.primary.isValid ? '✅ Ready' : '❌ Not configured',
        },
        screenshot: {
          purpose: 'Desk time screenshots (automated captures)',
          cloudName: accountInfo.screenshot.cloudName,
          uploadPreset: accountInfo.screenshot.uploadPreset,
          valid: accountInfo.screenshot.isValid,
          status: accountInfo.screenshot.isValid ? '✅ Ready' : '❌ Not configured',
          folderStructure: 'desktime/screenshots/YYYY-MM-DD/agent-{agentId}/',
        },
      },
      endpoints: {
        uploadScreenshot: 'POST /api/agent/desktime/screenshot',
        testAccounts: 'GET /api/test/cloudinary-accounts',
      },
      instructions: {
        note: 'Screenshots are uploaded to the screenshot account (dggxzfnyz)',
        ensureUploadPreset: 'Make sure "desktime_screenshots" upload preset exists in the dggxzfnyz account',
        checkCredentials: 'Verify API keys and secrets in .env file',
      },
    });
    
  } catch (error) {
    console.error('Cloudinary check error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to check Cloudinary configuration',
      error: error.message,
    });
  }
}