// pages/api/doctor/work-session/mouse-activity.js
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
      // Doctor reporting their own activity
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
      userId: doctorId,
      role: req.user.role,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!session) {
      session = await WorkSession.create({
        userId: doctorId,
        role: req.user.role, 
        date: today,
        arrivalTime: new Date(),
        deskTimeSeconds: 0,
        productiveSeconds: duration,
        productivityPercentage: 0,
        lastActivity: new Date(),
        activityLogs: [{
          timestamp: new Date(),
          isActive: true,
          duration,
          activityType: 'mouse-activity'
        }],
      });
    } else {
      // Update existing session
      session.productiveSeconds = (session.productiveSeconds || 0) + duration;
      session.lastActivity = new Date();
      
      session.activityLogs.push({
        timestamp: new Date(),
        isActive: true,
        duration,
        activityType: 'mouse-activity'
      });

      // Recalculate productivity
      if (session.deskTimeSeconds > 0) {
        session.productivityPercentage = Math.min(100,
          Math.round((session.productiveSeconds / session.deskTimeSeconds) * 100)
        );
      }
    }

    await session.save();

    return res.json({
      success: true,
      message: 'Doctor mouse activity recorded',
      productiveSeconds: session.productiveSeconds,
      productivityPercentage: session.productivityPercentage,
    });
  } catch (error) {
    // console.error('DOCTOR MOUSE ACTIVITY ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

export default withDoctorApiAuth(handler);