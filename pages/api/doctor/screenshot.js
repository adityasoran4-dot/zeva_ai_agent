// pages/api/doctor/screenshot.js
import dbConnect from '../../../lib/database';
import WorkSession from '../../../models/WorkSession';
import DoctorScreenshot from '../../../models/DoctorScreenshot';
import jwt from 'jsonwebtoken';
import { multiCloudinary } from '../../../lib/cloudinary-multi';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const token = auth.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Allow both roles
    if (decoded.role !== 'doctor' && decoded.role !== 'doctorStaff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Doctor access only' 
      });
    }

    const doctorId = decoded?.id || decoded?.userId;
    const { imageData, timestamp, userName } = req.body;

    if (!imageData) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    await dbConnect();

    // Find or create today's work session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let session = await WorkSession.findOne({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!session) {
      session = await WorkSession.create({
        doctorId,
        role: decoded.role,  // 'doctor' or 'doctorStaff'
        date: today,
        arrivalTime: new Date(),
        deskTimeSeconds: 0,
        productiveSeconds: 0,
        productivityPercentage: 0,
        activityLogs: [],
      });
    }

    // Prepare metadata
    const dateStr = new Date(timestamp || Date.now()).toISOString().split('T')[0];
    const folder = `desktime/screenshots/${dateStr}/doctor-${doctorId}`;

    // Upload using multi-cloudinary service
    const uploadResult = await multiCloudinary.uploadToAccount(
      imageData,
      'screenshot',
      {
        folder,
        publicId: `doctor-screenshot-${doctorId}-${Date.now()}`,
        resourceType: 'image',
        tags: ['desktime', 'doctor', `doctor-${doctorId}`, `date-${dateStr}`],
      }
    );

    // Create screenshot record using DoctorScreenshot model
    const screenshot = await DoctorScreenshot.create({
      doctorId,
      url: uploadResult.url,
      cloudinaryPublicId: uploadResult.publicId,
      timestamp: new Date(timestamp || Date.now()),
      sessionId: session._id,
      metadata: {
        userRole: decoded.role,
        userName: userName || decoded.name || 'Doctor',
        doctorId,
        account: 'screenshot-dggxzfnyz',
      }
    });

    // Link to session using the correct array
    session.doctorScreenshots = session.doctorScreenshots || [];
    session.doctorScreenshots.push(screenshot._id);
    await session.save();

    return res.status(201).json({
      success: true,
      message: 'Doctor screenshot created and uploaded successfully',
      screenshot: {
        id: screenshot._id,
        url: screenshot.url,
        timestamp: screenshot.timestamp,
      },
    });

  } catch (error) {
    // console.error('DOCTOR SCREENSHOT ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload doctor screenshot',
      error: error.message,
    });
  }
}