// pages/api/doctor/work-session/monthly.js
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
    let doctorId;

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
      
      doctorId = userId;
    } else {
      // Use the authenticated doctor's ID
      doctorId = req.user.id;
    }

    const offsetValue = parseInt(offset) || 0;

    // Calculate month range
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offsetValue, 1);
    
    const startOfMonth = new Date(targetDate);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get sessions
    const sessions = await WorkSession.find({
      $or: [
        { doctorId: doctorId },
        { userId: doctorId }
      ],
      role: { $in: ['doctor', 'doctorStaff'] },
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort({ date: 1 });

    // Calculate totals
    let totalDeskTime = 0;
    let totalProductiveTime = 0;
    let totalDays = 0;

    // Group by week
    const weeks = [];
    let currentWeek = [];
    let currentWeekNumber = 1;
    
    for (let i = 0; i < endOfMonth.getDate(); i++) {
      const dayDate = new Date(startOfMonth);
      dayDate.setDate(startOfMonth.getDate() + i);
      
      const daySession = sessions.find(s => 
        s.date.toDateString() === dayDate.toDateString()
      );

      const deskTime = daySession?.deskTimeSeconds || 0;
      const productiveTime = daySession?.productiveSeconds || 0;

      currentWeek.push({
        date: dayDate,
        dayNumber: i + 1,
        deskTime,
        productiveTime,
        hasSession: !!daySession,
      });

      totalDeskTime += deskTime;
      totalProductiveTime += productiveTime;
      if (daySession) totalDays++;

      // Start new week on Sundays or end of month
      if (dayDate.getDay() === 6 || i === endOfMonth.getDate() - 1) {
        const weekProductiveTime = currentWeek.reduce((sum, day) => sum + day.productiveTime, 0);
        const weekDeskTime = currentWeek.reduce((sum, day) => sum + day.deskTime, 0);
        const weekProductivity = weekDeskTime > 0 ? (weekProductiveTime / weekDeskTime) * 100 : 0;

        weeks.push({
          weekNumber: currentWeekNumber++,
          startDate: currentWeek[0].date,
          endDate: currentWeek[currentWeek.length - 1].date,
          days: [...currentWeek],
          deskTime: weekDeskTime,
          productiveTime: weekProductiveTime,
          productivity: Math.round(weekProductivity),
        });

        currentWeek = [];
      }
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
        totalDays,
        weeks,
        monthStart: startOfMonth,
        monthEnd: endOfMonth,
        monthName: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      }
    });
  } catch (error) {
    // console.error('DOCTOR MONTHLY STATS ERROR:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});