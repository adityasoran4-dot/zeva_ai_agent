// pages/api/doctor/work-session/weekly.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withDoctorApiAuth from '../../../../middleware/withDoctorApiAuth';
import jwt from 'jsonwebtoken';

// Helper function to verify clinic token
const verifyClinicToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'clinic' || decoded.role === 'admin' ? decoded : null;
  } catch (error) {
    return null;
  }
};

export default withDoctorApiAuth(async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { userId, offset } = req.query;
    let targetDoctorId;

    // If userId is provided, verify clinic token
    if (userId) {
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
          message: 'Clinic/admin access required to view other users',
        });
      }
      
      targetDoctorId = userId;
    } else {
      // Use the authenticated doctor's ID
      targetDoctorId = req.user.id;
    }

    const offsetValue = parseInt(offset) || 0;

    // Calculate weekly range
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + (offsetValue * 7));
    
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get sessions
    const sessions = await WorkSession.find({
      $or: [
        { doctorId: targetDoctorId ,
          role: { $in: ['doctor', 'doctorStaff'] }
        },

        { userId: targetDoctorId,
          role: { $in: ['doctor', 'doctorStaff'] }
         }
      ],
      date: { $gte: startOfWeek, $lte: endOfWeek },
    }).sort({ date: 1 });

    // Calculate totals
    let totalDeskTime = 0;
    let totalProductiveTime = 0;
    let totalSessions = 0;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      
      const daySession = sessions.find(s => 
        s.date.toDateString() === dayDate.toDateString()
      );

      const deskTime = daySession?.deskTimeSeconds || 0;
      const productiveTime = daySession?.productiveSeconds || 0;
      const productivity = deskTime > 0 ? (productiveTime / deskTime) * 100 : 0;

      days.push({
        date: dayDate,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()],
        deskTime,
        productiveTime,
        productivity: Math.round(productivity),
        hasSession: !!daySession,
      });

      totalDeskTime += deskTime;
      totalProductiveTime += productiveTime;
      if (daySession) totalSessions++;
    }

    const avgProductivity = totalDeskTime > 0 
      ? Math.round((totalProductiveTime / totalDeskTime) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        totalDeskTime,
        totalProductiveTime,
        avgProductivity,
        totalSessions,
        days,
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
      }
    });
  } catch (error) {
    // console.error('DOCTOR WEEKLY STATS ERROR:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});