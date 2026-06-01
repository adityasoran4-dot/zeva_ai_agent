// pages/api/doctor/work-session/idle.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withDoctorApiAuth from '../../../../middleware/withDoctorApiAuth';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { userId, duration } = req.body;
    
    if (!duration || duration < 1) {
      return res.status(400).json({ success: false, message: 'Invalid duration' });
    }

    let doctorId;

    if (userId && (req.user.role === 'clinic' || req.user.role === 'admin' || req.user.role === 'agent')) {
      // Clinic/admin/agent reporting for a doctor
      doctorId = userId;
    } else {
      // Doctor reporting their own idle time
      if (!['doctor', 'doctorStaff'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Doctor access only' });
      }
      doctorId = req.user.userId || req.user.id || req.user.doctorId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let session = await WorkSession.findOne({
      $or: [
        { doctorId },
        { userId: doctorId }
      ],
      role: { $in: ['doctor', 'doctorStaff'] },
      date: { $gte: today, $lte: endOfDay },
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active session found for today' 
      });
    }

    // Add idle time to activity logs
    session.activityLogs.push({
      timestamp: new Date(),
      isActive: false,
      duration,
      activityType: 'idle'
    });

    // Update last activity
    session.lastActivity = new Date();
    
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor idle time recorded',
      idleDuration: duration,
      sessionId: session._id
    });
  } catch (error) {
    // console.error('DOCTOR IDLE ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default withDoctorApiAuth(handler);