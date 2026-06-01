// pages/api/agent/work-session/hourly.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
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

// Helper function to verify agent token
const verifyAgentToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const auth = req.headers.authorization;
    const { userId, date } = req.query;

    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required',
      });
    }

    const token = auth.split(' ')[1];
    let targetAgentId;
    let decoded;

    // If userId is provided, verify clinic token
    if (userId) {
      decoded = verifyClinicToken(token);
      if (!decoded) {
        return res.status(403).json({
          success: false,
          message: 'Clinic/admin access required to view other users',
        });
      }
      targetAgentId = userId;
    } else {
      // Use the authenticated agent's ID
      decoded = verifyAgentToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      targetAgentId = decoded.id || decoded.userId || decoded.agentId || decoded._id;
    }

    if (!targetAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token structure or userId parameter',
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
        { agentId: targetAgentId },
        { userId: targetAgentId }
      ],
      date: { $gte: targetDate, $lte: endDate },
    });

    if (!session) {
      // Return empty stats if no session
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
        if (log.activityType === 'mouse' || log.activityType === 'mouse-activity' || log.activityType === 'activity') {
          hourlyStats[logHour].productiveTime += duration;
        }
      }
    });

    // Calculate productivity per hour and totals
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
    // console.error('HOURLY STATS ERROR:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}