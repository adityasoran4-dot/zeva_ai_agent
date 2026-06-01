// pages/api/agent/work-session/period-data.js
import { verifyToken } from '../../../../lib/auth';
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const agentId = decoded.userId || decoded.id || decoded.agentId || decoded._id;
    if (!agentId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    await dbConnect();

    const { period = 'weekly' } = req.query;
    const now = new Date();
    
    let start, end;

    switch (period) {
      case 'weekly':
        // Last 7 days including today
        start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case 'monthly':
        // Last 30 days
        start = new Date(now);
        start.setDate(now.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid period' });
    }

    const sessions = await WorkSession.find({
      agentId,
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });

    // Group by day
    const dailyData = {};
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyData[dateStr] = {
        deskTime: 0,
        productiveTime: 0,
        date: new Date(currentDate),
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill with actual data
    sessions.forEach(session => {
      const dateStr = session.date.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].deskTime += session.deskTimeSeconds || 0;
        dailyData[dateStr].productiveTime += session.productiveSeconds || 0;
      }
    });

    const dailyArray = Object.values(dailyData).sort((a, b) => a.date - b.date);

    // Calculate totals
    const totals = dailyArray.reduce((acc, day) => ({
      deskTime: acc.deskTime + day.deskTime,
      productiveTime: acc.productiveTime + day.productiveTime,
    }), { deskTime: 0, productiveTime: 0 });

    totals.effectiveness = totals.deskTime > 0
      ? Math.round((totals.productiveTime / totals.deskTime) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        period,
        startDate: start,
        endDate: end,
        dailyData: dailyArray,
        totals,
        sessionCount: sessions.length,
      }
    });

  } catch (error) {
    // console.error('PERIOD DATA ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
}