import { v2 as cloudinary, ConfigOptions } from 'cloudinary';

// Define the two Cloudinary accounts
export interface CloudinaryAccount {
  name: 'primary' | 'screenshot';
  config: ConfigOptions;
  uploadPreset: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  account: 'primary' | 'screenshot';
  folder: string;
  timestamp: Date;
}

export interface ScreenshotMetadata {
  agentId: string;
  sessionId?: string;
  windowTitle?: string;
  appName?: string;
  timestamp?: Date;
}

class MultiCloudinaryService {
  private static instance: MultiCloudinaryService;
  
  // Two separate Cloudinary accounts
  private primaryAccount: CloudinaryAccount;
  private screenshotAccount: CloudinaryAccount;
  
  private constructor() {
    // PRIMARY ACCOUNT: dxwuxbpir (for general uploads)
    this.primaryAccount = {
      name: 'primary',
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dxwuxbpir',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
        secure: true,
      },
      uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'sms_upload',
    };
    
    // SCREENSHOT ACCOUNT: dggxzfnyz (for desk time screenshots)
    this.screenshotAccount = {
      name: 'screenshot',
      config: {
        cloud_name: process.env.SCREENSHOT_CLOUDINARY_CLOUD_NAME || 'dggxzfnyz',
        api_key: process.env.SCREENSHOT_CLOUDINARY_API_KEY || '868421612295472',
        api_secret: process.env.SCREENSHOT_CLOUDINARY_API_SECRET || '0uzeS8IPknXJ3Edq9i-gkcx4NjQ',
        secure: true,
      },
      uploadPreset: process.env.SCREENSHOT_CLOUDINARY_UPLOAD_PRESET || 'desktime_screenshots',
    };
    
    this.validateAccounts();
  }
  
  public static getInstance(): MultiCloudinaryService {
    if (!MultiCloudinaryService.instance) {
      MultiCloudinaryService.instance = new MultiCloudinaryService();
    }
    return MultiCloudinaryService.instance;
  }
  
  private validateAccounts(): void {
    console.log('Validating Cloudinary accounts...');
    
    const primaryValid = this.validateAccount(this.primaryAccount);
    const screenshotValid = this.validateAccount(this.screenshotAccount);
    
    console.log('Cloudinary Accounts Status:', {
      primary: {
        name: this.primaryAccount.config.cloud_name,
        valid: primaryValid,
        preset: this.primaryAccount.uploadPreset,
      },
      screenshot: {
        name: this.screenshotAccount.config.cloud_name,
        valid: screenshotValid,
        preset: this.screenshotAccount.uploadPreset,
      },
    });
    
    if (!primaryValid) {
      console.warn('Primary Cloudinary account (dxwuxbpir) is not properly configured');
    }
    
    if (!screenshotValid) {
      console.warn('Screenshot Cloudinary account (dggxzfnyz) is not properly configured');
    }
  }
  
  private validateAccount(account: CloudinaryAccount): boolean {
    return !!(account.config.cloud_name && account.config.api_key && account.config.api_secret);
  }
  
  private getAccountConfig(accountType: 'primary' | 'screenshot'): CloudinaryAccount {
    return accountType === 'screenshot' ? this.screenshotAccount : this.primaryAccount;
  }
  
  private getCloudinaryInstance(accountType: 'primary' | 'screenshot') {
    const account = this.getAccountConfig(accountType);
    cloudinary.config(account.config);
    return cloudinary;
  }

  /** Upload image to specified Cloudinary account */
  async uploadToAccount(
    imageData: string | Buffer,
    accountType: 'primary' | 'screenshot',
    options: {
      folder?: string;
      publicId?: string;
      tags?: string[];
      transformation?: any;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    } = {}
  ): Promise<UploadResult> {
    const account = this.getAccountConfig(accountType);
    const cloudinaryInstance = this.getCloudinaryInstance(accountType);
    
    const {
      folder = accountType === 'screenshot' ? 'desktime/screenshots' : 'uploads',
      publicId,
      tags = [],
      transformation,
      resourceType = 'auto',
    } = options;
    
    try {
      console.log(`Uploading to ${accountType} Cloudinary (${account.config.cloud_name})...`);
      
      const uploadOptions: any = {
        folder,
        resource_type: resourceType,
        timeout: 30000,
        context: `account=${accountType}|cloud=${account.config.cloud_name}|timestamp=${Date.now()}`,
      };
      
      // Only include upload_preset if explicitly configured
      if (account.uploadPreset) {
        uploadOptions.upload_preset = account.uploadPreset;
      }
      
      if (publicId) {
        uploadOptions.public_id = publicId;
      }
      
      if (tags.length > 0) {
        uploadOptions.tags = tags;
      }
      
      if (transformation) {
        uploadOptions.transformation = transformation;
      }
      
      // Special optimizations for screenshots
      if (accountType === 'screenshot' && resourceType === 'image') {
        uploadOptions.quality = 'auto:good';
        uploadOptions.format = 'jpg';
        uploadOptions.eager = [
          { width: 1200, crop: 'scale' },
          { width: 800, crop: 'scale' },
        ];
      }
      
      let result: any;
      
      if (typeof imageData === 'string') {
        // Base64 string
        let base64Data = imageData;
        if (!base64Data.startsWith('data:')) {
          base64Data = `data:image/jpeg;base64,${base64Data}`;
        }
        result = await cloudinaryInstance.uploader.upload(base64Data, uploadOptions);
      } else {
        // Buffer
        result = await new Promise((resolve, reject) => {
          const stream = cloudinaryInstance.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(imageData);
        });
      }
      
      const uploadResult: UploadResult = {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width || 0,
        height: result.height || 0,
        bytes: result.bytes || 0,
        account: accountType,
        folder,
        timestamp: new Date(),
      };
      
      console.log(`Upload successful to ${accountType} account:`, {
        publicId: uploadResult.publicId,
        size: `${(uploadResult.bytes / 1024).toFixed(1)} KB`,
        url: uploadResult.url.substring(0, 80) + '...',
      });
      
      return uploadResult;
      
    } catch (error: any) {
      console.error(`Upload failed to ${accountType} account (${account.config.cloud_name}):`, {
        error: error.message,
        httpCode: error.http_code,
        folder,
        preset: account.uploadPreset,
      });
      
      throw new Error(`Failed to upload to ${accountType} Cloudinary (${account.config.cloud_name}): ${error.message}`);
    }
  }
  
  /** Upload screenshot to screenshot account (dggxzfnyz) */
  async uploadScreenshot(
    base64Image: string,
    metadata: ScreenshotMetadata
  ): Promise<UploadResult> {
    const { agentId, sessionId, windowTitle, appName, timestamp = new Date() } = metadata;
    
    const dateStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    
    // Organized folder structure
    const folder = `desktime/screenshots/${dateStr}/agent-${agentId}`;
    
    // Build tags for better organization
    const tags = [
      'desktime',
      'screenshot',
      'automated-capture',
      `agent-${agentId}`,
      `date-${dateStr}`,
      `time-${timeStr}`,
    ];
    
    if (sessionId) {
      tags.push(`session-${sessionId}`);
    }
    
    if (windowTitle) {
      const safeTitle = windowTitle.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      tags.push(`window-${safeTitle}`);
    }
    
    if (appName) {
      const safeAppName = appName.toLowerCase().replace(/\s+/g, '-');
      tags.push(`app-${safeAppName}`);
    }
    
    // Screenshot-specific optimizations
    const transformation = {
      quality: 'auto:good',
      fetch_format: 'auto',
      width: 1600,
      crop: 'limit',
      dpr: 'auto',
    };
    
    return this.uploadToAccount(
      base64Image,
      'screenshot',
      {
        folder,
        publicId: `screenshot-${Date.now()}-${agentId}`,
        tags,
        transformation,
      }
    );
  }
  
  /** Upload general file to primary account (dxwuxbpir)*/
  async uploadGeneralFile(
    fileData: string | Buffer,
    fileName: string,
    folder: string = 'general-uploads'
  ): Promise<UploadResult> {
    const publicId = fileName.replace(/\.[^/.]+$/, '');
    
    return this.uploadToAccount(
      fileData,
      'primary',
      {
        folder,
        publicId,
        tags: ['general-upload', `filename-${fileName}`],
      }
    );
  }
  
  /** Delete image from specific account */
  async deleteImage(
    publicId: string,
    accountType: 'primary' | 'screenshot'
  ): Promise<boolean> {
    try {
      const cloudinaryInstance = this.getCloudinaryInstance(accountType);
      const result = await cloudinaryInstance.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error: any) {
      console.error(`Delete failed from ${accountType} account:`, error.message);
      return false;
    }
  }

  /** Get account information for debugging */
  getAccountInfo() {
    return {
      primary: {
        cloudName: this.primaryAccount.config.cloud_name,
        uploadPreset: this.primaryAccount.uploadPreset,
        isValid: this.validateAccount(this.primaryAccount),
      },
      screenshot: {
        cloudName: this.screenshotAccount.config.cloud_name,
        uploadPreset: this.screenshotAccount.uploadPreset,
        isValid: this.validateAccount(this.screenshotAccount),
      },
    };
  }
}

export const multiCloudinary = MultiCloudinaryService.getInstance();
