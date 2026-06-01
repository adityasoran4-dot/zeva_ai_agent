// pages/api/doctor/work-session/hourly.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withDoctorApiAuth from '../../../../middleware/withDoctorApiAuth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { userId, date } = req.query;
    let doctorId;

    // If userId is provided, verify it's clinic/admin/agent accessing
    if (userId) {
      if (!['clinic', 'admin', 'agent'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Clinic/admin/agent access required to view other users',
        });
      }
      doctorId = userId;
    } else {
      // Use the authenticated doctor's ID
      if (!['doctor', 'doctorStaff'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Doctor access only',
        });
      }
      doctorId = req.user.userId || req.user.id || req.user.doctorId;
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const session = await WorkSession.findOne({
      $or: [
        { doctorId: doctorId },
        { userId: doctorId }
      ],
      role: { $in: ['doctor', 'doctorStaff'] },
      date: { $gte: targetDate, $lte: endDate },
    });

    if (!session) {
      // Return empty stats
      const emptyStats = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        deskTime: 0,
        productiveTime: 0,
        idleTime: 0,
        productivity: 0
      }));

      return res.json({
        success: true,
        data: {
          hourlyStats: emptyStats,
          totalDeskTime: 0,
          totalProductiveTime: 0,
          totalIdleTime: 0,
          date: targetDate
        }
      });
    }

    // Aggregate per hour from activityLogs
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      deskTime: 0,
      productiveTime: 0,
      idleTime: 0,
      productivity: 0
    }));

    session.activityLogs.forEach(log => {
      const logHour = new Date(log.timestamp).getHours();
      const duration = log.duration || 0;

      if (log.activityType === 'idle') {
        hourlyStats[logHour].idleTime += duration;
      } else {
        hourlyStats[logHour].deskTime += duration;
        if (log.activityType === 'mouse-activity' || log.activityType === 'activity') {
          hourlyStats[logHour].productiveTime += duration;
        }
      }
    });

    // Calculate totals
    let totalDeskTime = 0;
    let totalProductiveTime = 0;
    let totalIdleTime = 0;

    hourlyStats.forEach(stat => {
      totalDeskTime += stat.deskTime;
      totalProductiveTime += stat.productiveTime;
      totalIdleTime += stat.idleTime;

      stat.productivity = stat.deskTime > 0 
        ? Math.round((stat.productiveTime / stat.deskTime) * 100)
        : 0;
    });

    return res.json({
      success: true,
      data: {
        hourlyStats,
        totalDeskTime,
        totalProductiveTime,
        totalIdleTime,
        date: targetDate
      }
    });
  } catch (error) {
    // console.error('DOCTOR HOURLY STATS ERROR:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}

export default withDoctorApiAuth(handler);