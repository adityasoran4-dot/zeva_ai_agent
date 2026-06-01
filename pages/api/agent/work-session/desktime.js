// pages/api/agent/work-session/desktime.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withAgentApiAuth from '../../../../middleware/withAgentApiAuth';

export default withAgentApiAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const agentId = req.user.id;
    const { duration } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find or create today's session
    let session = await WorkSession.findOne({
      agentId,
      date: { $gte: today, $lt: tomorrow },
    });

    const now = new Date();

    if (!session) {
      session = new WorkSession({
        agentId,
        userId: agentId,
        role: 'agent',
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
        }]
      });
      // console.log('Created new agent desktime session:', agentId);
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

      // Recalculate productivity percentage
      if (session.deskTimeSeconds > 0) {
        session.productivityPercentage = Math.min(100, 
          Math.round(((session.productiveSeconds || 0) / session.deskTimeSeconds) * 100)
        );
      }
      console.log('Updated agent desktime:', agentId, 'Total:', session.deskTimeSeconds);
    }

    // Ensure required fields are set
    if (!session.userId) session.userId = agentId;
    if (!session.role) session.role = 'agent';

    await session.save();

    return res.json({
      success: true,
      message: 'DeskTime recorded',
      deskTimeSeconds: session.deskTimeSeconds,
      productivityPercentage: session.productivityPercentage,
    });
  } catch (error) {
    // console.error('DESK TIME ERROR:', error);
    // console.error('Validation errors:', error.errors || 'No validation errors');
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors) : null
    });
  }
});