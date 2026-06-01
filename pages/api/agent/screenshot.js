// pages/api/agent/screenshot.js
import dbConnect from '../../../lib/database';
import WorkSession from '../../../models/WorkSession';
import AgentScreenshot from '../../../models/AgentScreenshot';
import { screenshotService } from '../../../lib/screenshot-service';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const agentId = decoded.agentId || decoded.id || decoded.userId;

    if (!agentId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    // Connect to database
    await dbConnect();

    // Get data from request body
    const { imageData, timestamp, sessionId, metadata } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    // Find today's work session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let workSession = await WorkSession.findOne({
      agentId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Upload to Cloudinary using screenshot service
    const screenshotResult = await screenshotService.captureAndUpload(
      imageData,
      agentId,
      {
        sessionId: workSession?._id?.toString() || sessionId,
        publicIdPrefix: `agent_screenshots/agent_${agentId}`,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        windowTitle: metadata?.windowTitle || 'Desk Time Tracker',
        appName: metadata?.appName || 'Web Browser',
        compress: true,
      }
    );

    // Create screenshot record using AgentScreenshot model
    const screenshot = await AgentScreenshot.create({
      agentId,
      url: screenshotResult.url,
      cloudinaryPublicId: screenshotResult.publicId,
      timestamp: screenshotResult.timestamp,
      sessionId: workSession?._id || sessionId || null,
      metadata: {
        width: screenshotResult.metadata?.width,
        height: screenshotResult.metadata?.height,
        size: screenshotResult.metadata?.size,
        windowTitle: metadata?.windowTitle,
        appName: metadata?.appName,
        captureMethod: metadata?.captureMethod || 'automatic',
        userRole: 'agent',
      },
      createdAt: new Date(),
    });

    // Update work session with screenshot reference
    if (workSession) {
      workSession.agentScreenshots = workSession.agentScreenshots || [];
      workSession.agentScreenshots.push(screenshot._id);
      await workSession.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Agent screenshot captured and saved',
      screenshot: {
        id: screenshot._id,
        url: screenshotResult.url,
        publicId: screenshotResult.publicId,
        timestamp: screenshotResult.timestamp,
        agentId,
        sessionId: workSession?._id || sessionId,
        metadata: screenshotResult.metadata,
      }
    });
  } catch (error) {
    // console.error('Agent Screenshot save error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}