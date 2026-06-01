// lib/screenshot-service.ts
import { multiCloudinary } from "./cloudinary-multi";

export interface AgentScreenshot {
  agentId: string;
  sessionId?: string;
  timestamp: Date;
  url: string;
  publicId: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    windowTitle?: string;
    appName?: string;
  };
}

export interface ScreenshotStats {
  totalScreenshots: number;
  todayScreenshots: number;
  totalStorage: number;
  lastScreenshot?: Date;
}

export interface ScreenshotMetadata {
  agentId: string;
  sessionId?: string;
  windowTitle?: string;
  appName?: string;
  timestamp?: Date;
}

class ScreenshotService {
  private static instance: ScreenshotService;

  private constructor() {
    console.log("Screenshot Service initialized (using dggxzfnyz account)");
  }

  public static getInstance(): ScreenshotService {
    if (!ScreenshotService.instance) {
      ScreenshotService.instance = new ScreenshotService();
    }
    return ScreenshotService.instance;
  }

  /** Capture and upload screenshot for an agent*/
  async captureAndUpload(
    base64Image: string,
    agentId: string,
    options: {
      sessionId?: string;
      windowTitle?: string;
      appName?: string;
      compress?: boolean;
    } = {}
  ): Promise<AgentScreenshot> {
    const { sessionId, windowTitle, appName, compress = true } = options;

    try {
      // Compress image if requested (client-side only)
      let processedImage = base64Image;
      if (compress && this.isBrowser()) {
        processedImage = await this.compressImage(base64Image, 1600, 0.8);
      }

      // Upload to screenshot Cloudinary account (dggxzfnyz)
      const uploadResult = await multiCloudinary.uploadScreenshot(
        processedImage,
        {
          agentId,
          sessionId,
          windowTitle,
          appName,
          timestamp: new Date(),
        }
      );

      // Create agent screenshot object
      const agentScreenshot: AgentScreenshot = {
        agentId,
        sessionId,
        timestamp: uploadResult.timestamp,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        metadata: {
          width: uploadResult.width,
          height: uploadResult.height,
          size: uploadResult.bytes,
          windowTitle,
          appName,
        },
      };

      // console.log(`Screenshot captured for agent ${agentId}:`, {
      //   url: agentScreenshot.url.substring(0, 80) + '...',
      //   size: `${(uploadResult.bytes / 1024).toFixed(1)} KB`,
      //   dimensions: `${uploadResult.width}x${uploadResult.height}`,
      // });

      return agentScreenshot;
    } catch (error: any) {
      console.error(
        `Failed to capture screenshot for agent ${agentId}:`,
        error
      );
      throw new Error(`Screenshot capture failed: ${error.message}`);
    }
  }

  /**Get signed upload parameters for direct frontend upload*/
  getDirectUploadParams(agentId: string): {
    cloudName: string;
    uploadPreset: string;
    folder: string;
    tags: string[];
    timestamp: number;
  } {
    const dateStr = new Date().toISOString().split("T")[0];
    const folder = `desktime/screenshots/${dateStr}/agent-${agentId}`;
    const timestamp = Math.floor(Date.now() / 1000);

    return {
      cloudName: "dggxzfnyz", // Screenshot account
      uploadPreset: "desktime_screenshots",
      folder,
      tags: ["desktime", "screenshot", `agent-${agentId}`, `date-${dateStr}`],
      timestamp,
    };
  }

  /** Compress image in browser */
  private async compressImage(
    base64Image: string,
    maxWidth: number = 1600,
    quality: number = 0.8
  ): Promise<string> {
    if (!this.isBrowser()) {
      return base64Image;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Draw with high quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with specified quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for compression"));
      };

      img.src = base64Image;
    });
  }

  /** Check if running in browser*/
  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  /* Validate screenshot Cloudinary account*/
  validateScreenshotAccount(): boolean {
    const accountInfo = multiCloudinary.getAccountInfo();
    return accountInfo.screenshot.isValid;
  }

  /*Get screenshot account info */
  getAccountInfo() {
    return multiCloudinary.getAccountInfo().screenshot;
  }
}

// Export singleton instance
export const screenshotService = ScreenshotService.getInstance();
