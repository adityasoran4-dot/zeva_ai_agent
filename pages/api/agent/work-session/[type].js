// pages/api/agent/work-session/[type].js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withAgentApiAuth from '../../../../middleware/withAgentApiAuth';

export default withAgentApiAuth(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { type } = req.query;
  const { duration } = req.body;

  if (!['desktime', 'mouse-activity', 'idle', 'arrival', 'leave'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid activity type' });
  }

  if (!duration || duration < 1) {
    return res.status(400).json({ success: false, message: 'Invalid duration' });
  }

  try {
    await dbConnect();

    const agentId = req.user.id;
    const role = req.user.role;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find or create session
    let session = await WorkSession.findOne({
      $or: [
        { agentId: agentId },
        { userId: agentId }
      ],
      role: { $in: ['agent', 'agentStaff'] },
      date: { $gte: today, $lt: tomorrow },
    });

    if (!session) {
      session = new WorkSession({
        agentId: agentId,
        userId: agentId,
        role: role,
        date: today,
        arrivalTime: new Date(),
        deskTimeSeconds: 0,
        productiveSeconds: 0,
        productivityPercentage: 0,
        activityLogs: [],
      });
    }

    // Add activity log
    const activityLog = {
      timestamp: new Date(),
      isActive: type !== 'idle',
      duration: duration,
      activityType: type === 'mouse-activity' ? 'mouse' : type,
    };

    session.activityLogs.push(activityLog);

    // Update counters based on type
    if (type === 'desktime') {
      session.deskTimeSeconds = (session.deskTimeSeconds || 0) + duration;
    } else if (type === 'mouse-activity') {
      session.productiveSeconds = (session.productiveSeconds || 0) + duration;
    }

    // Recalculate productivity
    if (session.deskTimeSeconds > 0) {
      session.productivityPercentage = Math.round(
        (session.productiveSeconds / session.deskTimeSeconds) * 100
      );
    }

    // Update last activity
    session.lastActivity = new Date();

    await session.save();

    // console.log('Agent activity recorded:', {
    //   type,
    //   duration,
    //   agentId,
    //   role,
    //   deskTime: session.deskTimeSeconds,
    //   productive: session.productiveSeconds,
    // });

    return res.json({
      success: true,
      message: `Agent ${type} activity recorded`,
      duration: duration,
      deskTimeSeconds: session.deskTimeSeconds,
      productiveSeconds: session.productiveSeconds,
      productivityPercentage: session.productivityPercentage,
    });
  } catch (error) {
    // console.error('AGENT ACTIVITY ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});