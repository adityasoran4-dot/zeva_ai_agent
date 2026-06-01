// pages/api/doctor/work-session/activity.js
import { verifyToken } from '../../../../lib/auth';
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';

const LONG_INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes
const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes for idle time

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Get doctor ID from token
    const doctorId = decoded.userId || decoded.id || decoded.doctorId;

    if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    await dbConnect();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let session = await WorkSession.findOne({
      $or: [
        { doctorId },
        { userId: doctorId }
      ],
      role: { $in: ['doctor', 'doctorStaff'] },

      date: { $gte: start, $lte: end },
    });

    // CREATE SESSION IF NOT EXISTS
    if (!session) {
      session = await WorkSession.create({
        doctorId,
        userId: doctorId,
        role: 'doctor',
        date: start,
        arrivalTime: new Date(),
        deskTimeSeconds: 0,
        productiveSeconds: 0,
        productivityPercentage: 0,
        lastActivity: new Date(),
        activityLogs: [],
      });
    }

    // IF USER HAS ALREADY LEFT → IGNORE ACTIVITY
    if (session.leftTime) {
      return res.status(200).json({
        success: true,
        message: 'Session already ended',
        data: {
          leftTime: session.leftTime,
          deskTimeSeconds: session.deskTimeSeconds,
          productiveSeconds: session.productiveSeconds,
          productivity: session.productivityPercentage,
        },
      });
    }

    // DESK TIME CALCULATION - only if not idle
    let deltaSeconds = 0;
    const now = new Date();

    if (session.lastActivity) {
      const diffMs = now - session.lastActivity;

      // Count as active time only if not idle
      if (diffMs <= IDLE_THRESHOLD_MS) {
        deltaSeconds = Math.floor(diffMs / 1000);
      } else {
        // Add idle log if needed
        session.activityLogs.push({
          timestamp: new Date(session.lastActivity.getTime() + IDLE_THRESHOLD_MS),
          isActive: false,
          duration: Math.floor((diffMs - IDLE_THRESHOLD_MS) / 1000),
          activityType: 'idle'
        });
      }
    }

    if (deltaSeconds > 0) {
      session.deskTimeSeconds += deltaSeconds;
      session.productiveSeconds += deltaSeconds;
      session.activityLogs.push({
        timestamp: now,
        isActive: true,
        duration: deltaSeconds,
        activityType: 'activity'
      });
    }

    session.lastActivity = now;

    // Auto logout on long inactivity
    if (session.lastActivity && now - session.lastActivity >= LONG_INACTIVITY_MS) {
      session.leftTime = session.lastActivity;
      session.status = 'OFFLINE';
    }

    // PRODUCTIVITY
    session.productivityPercentage =
      session.deskTimeSeconds > 0
        ? Math.round((session.productiveSeconds / session.deskTimeSeconds) * 100)
        : 0;

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor activity recorded',
      data: {
        deskTimeSeconds: session.deskTimeSeconds,
        productiveSeconds: session.productiveSeconds,
        productivity: session.productivityPercentage,
        lastActivity: session.lastActivity,
      },
    });
  } catch (error) {
    // console.error('DOCTOR ACTIVITY ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}