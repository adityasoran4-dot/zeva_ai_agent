// lib/cloudinary-config.ts
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset: string;
}

// Primary Cloudinary config (for general uploads using sms_upload preset)
export const primaryCloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dxwuxbpir',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'sms_upload',
};

// Screenshot Cloudinary config (for desk time screenshots using desktime_screenshots preset)
export const screenshotCloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.SCREENSHOT_CLOUDINARY_CLOUD_NAME || 'dggxzfnyz',
  apiKey: process.env.SCREENSHOT_CLOUDINARY_API_KEY || '868421612295472',
  apiSecret: process.env.SCREENSHOT_CLOUDINARY_API_SECRET || '0uzeS8IPknXJ3Edq9i-gkcx4NjQ',
  uploadPreset: process.env.SCREENSHOT_CLOUDINARY_UPLOAD_PRESET || 'desktime_screenshots',
};

// Validate configurations
export function validateCloudinaryConfig(config: CloudinaryConfig): boolean {
  return !!(config.cloudName && config.apiKey && config.apiSecret && config.uploadPreset);
}

export const isPrimaryCloudinaryValid = validateCloudinaryConfig(primaryCloudinaryConfig);
export const isScreenshotCloudinaryValid = validateCloudinaryConfig(screenshotCloudinaryConfig);

// Log configuration status (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Cloudinary Config Status:', {
    primary: {
      cloudName: primaryCloudinaryConfig.cloudName,
      uploadPreset: primaryCloudinaryConfig.uploadPreset,
      isValid: isPrimaryCloudinaryValid,
      hasApiKey: !!primaryCloudinaryConfig.apiKey,
      hasApiSecret: !!primaryCloudinaryConfig.apiSecret,
    },
    screenshot: {
      cloudName: screenshotCloudinaryConfig.cloudName,
      uploadPreset: screenshotCloudinaryConfig.uploadPreset,
      isValid: isScreenshotCloudinaryValid,
      hasApiKey: !!screenshotCloudinaryConfig.apiKey,
      hasApiSecret: !!screenshotCloudinaryConfig.apiSecret,
    },
  });
  
  if (!isPrimaryCloudinaryValid) {
    console.warn(' Primary Cloudinary config incomplete. Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env');
  }
  
  if (!isScreenshotCloudinaryValid) {
    console.warn(' Screenshot Cloudinary config incomplete');
  }
}