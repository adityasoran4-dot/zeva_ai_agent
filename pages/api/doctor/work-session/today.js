// pages/api/doctor/work-session/today.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withDoctorApiAuth from '../../../../middleware/withDoctorApiAuth';
import jwt from 'jsonwebtoken';

const LONG_INACTIVITY_MS = 300 * 60 * 1000; // 300 minutes

// Helper function to verify clinic token
const verifyClinicToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'clinic' ? decoded : null;
  } catch (error) {
    return null;
  }
};

// Helper function to find work session for a user
async function findWorkSessionForUser(userId, start, end) {
  const query = {
    $or: [
      { userId: userId },
      { doctorId: userId },
      { agentId: userId }
    ],
    date: { $gte: start, $lte: end }
  };

  return await WorkSession.findOne(query);
}

// Safe save function to ensure userId is set
async function saveSessionSafely(session, targetUserId) {
  // Ensure userId is set before saving
  if (!session.userId) {
    session.userId = targetUserId;
  }
  
  try {
    await session.save();
    return true;
  } catch (saveError) {
    // console.error('Failed to save session:', saveError.message);
    return false;
  }
}

export default withDoctorApiAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { doctorId, userId } = req.query;
    const queryDoctorId = doctorId || userId;

    let targetDoctorId;

    // If clinic admin is querying for a specific doctor/doctorStaff
    if (queryDoctorId) {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token required',
        });
      }

      const token = auth.split(' ')[1];
      const clinicToken = verifyClinicToken(token);

      if (!clinicToken) {
        return res.status(403).json({
          success: false,
          message: 'Clinic admin access required to view other users',
        });
      }

      targetDoctorId = queryDoctorId;
    } else {
      // Use the authenticated user's ID
      targetDoctorId = req.user.doctorId || req.user.id || req.user.userId;
      
      if (!targetDoctorId) {
        return res.status(400).json({
          success: false,
          message: 'User ID not found in token',
        });
      }
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let session = await findWorkSessionForUser(targetDoctorId, start, end);

    if (!session) {
      return res.json({
        success: true,
        data: {
          arrivalTime: null,
          leftTime: null,
          deskTimeSeconds: 0,
          productiveSeconds: 0,
          timeAtWorkSeconds: 0,
          productivityPercentage: 0,
          lastActivity: null,
          status: 'OFFLINE',
          nextArrivalTime: null
        },
        message: 'No session found for today',
      });
    }

    const now = new Date();

    // Auto set left time on long inactivity
    if (!session.leftTime && session.lastActivity &&
      now - session.lastActivity >= LONG_INACTIVITY_MS) {
      session.leftTime = session.lastActivity;
      session.status = 'OFFLINE';
      
      // ✅ FIXED: Use safe save instead of direct save
      await saveSessionSafely(session, targetDoctorId);
      // Note: Even if save fails, we continue and return the session data
    }

    // Find next arrival after break
    let nextArrivalTime = null;
    if (session.leftTime) {
      const nextSession = await WorkSession.findOne({
        $or: [
          { userId: targetDoctorId },
          { doctorId: targetDoctorId },
          { agentId: targetDoctorId }
        ],
        date: { $gt: session.date },
        arrivalTime: { $exists: true, $ne: null }
      }).sort({ date: 1, arrivalTime: 1 });

      if (nextSession && nextSession.arrivalTime) {
        nextArrivalTime = nextSession.arrivalTime;
      }
    }

    // Calculate time at work
    const timeAtWorkSeconds = session.leftTime
      ? Math.floor((session.leftTime - session.arrivalTime) / 1000)
      : Math.floor((now - session.arrivalTime) / 1000);

    return res.json({
      success: true,
      data: {
        arrivalTime: session.arrivalTime,
        leftTime: session.leftTime || null,
        deskTimeSeconds: session.deskTimeSeconds || 0,
        productiveSeconds: session.productiveSeconds || 0,
        timeAtWorkSeconds,
        productivityPercentage: session.productivityPercentage || 0,
        lastActivity: session.lastActivity,
        status: session.status || (session.leftTime ? 'OFFLINE' : 'ONLINE'),
        nextArrivalTime,
      },
    });
  } catch (error) {
    // console.error('DOCTOR TODAY SESSION ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});