import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import withAgentApiAuth from '../../../../middleware/withAgentApiAuth';


export default withAgentApiAuth(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const agentId = req.user.id;
    const { view = 'daily' } = req.query; // daily, weekly, monthly

    let startDate, endDate;
    const now = new Date();

    if (view === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
    } else if (view === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);
    }

    const sessions = await WorkSession.find({
      agentId,
      date: { $gte: startDate, $lt: endDate }
    }).sort({ date: 1 });

    if (!sessions.length) {
      return res.status(200).json({
        success: true,
        data: {
          arrivalTime: null,
          leftTime: null,
          deskTimeSeconds: 0,
          productiveSeconds: 0,
          productivityPercentage: 0,
          timeAtWorkSeconds: 0
        }
      });
    }

    // Aggregate metrics
    const totalDesk = sessions.reduce((sum, s) => sum + (s.deskTimeSeconds || 0), 0);
    const totalProductive = sessions.reduce((sum, s) => sum + (s.productiveSeconds || 0), 0);
    const productivity = totalDesk > 0 ? Math.round((totalProductive / totalDesk) * 100) : 0;

    const first = sessions[0];
    const last = sessions[sessions.length - 1];

    return res.status(200).json({
      success: true,
      data: {
        arrivalTime: first.arrivalTime,
        leftTime: last.leftTime,
        deskTimeSeconds: totalDesk,
        productiveSeconds: totalProductive,
        productivityPercentage: productivity,
        timeAtWorkSeconds: totalDesk
      }
    });
  } catch (error) {
    // console.error('Error fetching work session:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});