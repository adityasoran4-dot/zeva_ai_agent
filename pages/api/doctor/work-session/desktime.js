// pages/api/doctor/work-session/desktime.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import jwt from 'jsonwebtoken';

// Helper to verify any token (doctor, clinic, etc.)
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    // console.error('Token verification error:', error.message);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Verify token
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = auth.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    const { userId: targetUserId, duration } = req.body;
    
    if (!duration || duration < 1) {
      return res.status(400).json({ success: false, message: 'Invalid duration' });
    }

    // Determine target doctor ID based on permissions
    let doctorId;

    // If clinic/admin/agent is reporting for a specific doctor
    if (targetUserId && ['clinic', 'admin', 'agent'].includes(decoded.role)) {
      doctorId = targetUserId;
    } 
    // Doctor reporting their own desktime
    else if (['doctor', 'doctorStaff'].includes(decoded.role)) {
      doctorId = decoded.userId || decoded.id || decoded.doctorId;
    } 
    // No permission
    else {
      return res.status(403).json({ 
        success: false, 
        message: 'Doctor access only' 
      });
    }

    // ✅ CRITICAL: Use the same value for both doctorId and userId
    const targetId = doctorId;

   

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing session
    let session = await WorkSession.findOne({
      $or: [
        { doctorId: targetId },
        { userId: targetId }
      ],
      date: { $gte: today, $lte: endOfDay },
    });

    const now = new Date();

    if (!session) {
      // ✅ FIXED: Create session with BOTH doctorId AND userId set
      session = new WorkSession({
        doctorId: targetId,      // Set doctorId
        userId: targetId,        // ✅ ALSO set userId (required field)
        role: 'doctorStaff',
        date: today,
        arrivalTime: now,
        deskTimeSeconds: duration,
        productiveSeconds: 0,
        idleTimeSeconds: 0,
        productivityPercentage: 0,
        status: 'ONLINE',
        lastActivity: now,
        activityLogs: [{
          timestamp: now,
          isActive: true,
          duration,
          activityType: 'desktime'
        }],
      });
      // console.log('Created new session for doctor:', targetId);
    } else {
      // Update existing session
      session.deskTimeSeconds = (session.deskTimeSeconds || 0) + duration;
      session.lastActivity = now;
      
      // Ensure activityLogs array exists
      if (!session.activityLogs) {
        session.activityLogs = [];
      }
      
      session.activityLogs.push({
        timestamp: now,
        isActive: true,
        duration,
        activityType: 'desktime'
      });

      // Recalculate productivity
      if (session.deskTimeSeconds > 0) {
        session.productivityPercentage = Math.min(100, 
          Math.round(((session.productiveSeconds || 0) / session.deskTimeSeconds) * 100)
        );
      }
      // console.log('Updated session for doctor:', targetId);
    }

    // ✅ CRITICAL: Double-check that userId is set before saving
    if (!session.userId) {
      session.userId = targetId;
    }
    if (!session.doctorId) {
      session.doctorId = targetId;
    }

    await session.save();
    // console.log('Session saved successfully');

    return res.json({
      success: true,
      message: 'Doctor DeskTime recorded',
      deskTimeSeconds: session.deskTimeSeconds,
      productivityPercentage: session.productivityPercentage,
    });
  } catch (error) {
    // console.error('DOCTOR DESK TIME ERROR:', error);
    // console.error('Error details:', {
    //   message: error.message,
    //   errors: error.errors,
    //   validationErrors: error.errors ? Object.keys(error.errors) : null
    // });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      validationError: error.errors ? 'Check if all required fields are set (userId, doctorId)' : null
    });
  }
}