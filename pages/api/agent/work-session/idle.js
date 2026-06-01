// pages/api/agent/work-session/idle.js
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

    let session = await WorkSession.findOne({
      agentId,
      date: { $gte: today, $lt: tomorrow },
    });

    const now = new Date();

    if (!session) {
      //Create new session with ALL required fields
      session = new WorkSession({
        agentId,
        userId: agentId,
        role: 'agent',
        date: today,
        arrivalTime: now,
        deskTimeSeconds: 0,
        productiveSeconds: 0,
        idleTimeSeconds: duration,
        productivityPercentage: 0,
        status: 'ONLINE',
        lastActivity: now,
        activityLogs: [{
          timestamp: now,
          isActive: false,
          duration,
          activityType: 'idle'
        }]
      });
      // console.log('Created new agent idle session:', agentId);
    } else {
      // Update existing session
      session.idleTimeSeconds = (session.idleTimeSeconds || 0) + duration;
      session.lastActivity = now;
      
      // Ensure activityLogs array exists
      if (!session.activityLogs) {
        session.activityLogs = [];
      }
      
      session.activityLogs.push({
        timestamp: now,
        isActive: false,
        duration,
        activityType: 'idle'
      });
    }

    // DOUBLE CHECK: Ensure required fields are set
    if (!session.userId) session.userId = agentId;
    if (!session.role) session.role = 'agent';

    await session.save();

    return res.json({
      success: true,
      message: 'Idle time recorded',
      idleTimeSeconds: session.idleTimeSeconds,
    });
  } catch (error) {
    // console.error('IDLE TIME ERROR:', error);
    // console.error('Validation errors:', error.errors || 'No validation errors');
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors) : null
    });
  }
});