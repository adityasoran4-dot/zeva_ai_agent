// pages/api/agent/work-session/mouse-activity.js
import dbConnect from "../../../../lib/database";
import WorkSession from "../../../../models/WorkSession";
import withAgentApiAuth from "../../../../middleware/withAgentApiAuth";

export default withAgentApiAuth(async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
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
        role: "agent",
        date: today,
        arrivalTime: now,
        deskTimeSeconds: 0,
        productiveSeconds: duration,
        idleTimeSeconds: 0,
        productivityPercentage: 0,
        status: "ONLINE",
        lastActivity: now,
        activityLogs: [
          {
            timestamp: now,
            isActive: true,
            duration,
            activityType: "mouse",
          },
        ],
      });
      // console.log("Created new agent mouse activity session:", agentId);
    } else {
      // Add to existing productive time
      session.productiveSeconds = (session.productiveSeconds || 0) + duration;
      session.lastActivity = now;

      // Ensure activityLogs array exists
      if (!session.activityLogs) {
        session.activityLogs = [];
      }

      session.activityLogs.push({
        timestamp: now,
        isActive: true,
        duration,
        activityType: "mouse",
      });

      // Recalculate productivity if there's desk time
      if (session.deskTimeSeconds > 0) {
        session.productivityPercentage = Math.min(
          100,
          Math.round(
            (session.productiveSeconds / session.deskTimeSeconds) * 100,
          ),
        );
      }
    }

    // Ensure required fields are set
    if (!session.userId) session.userId = agentId;
    if (!session.role) session.role = "agent";

    await session.save();

    // console.log('MOUSE ACTIVITY RECORDED:', {
    //   agentId,
    //   productiveSeconds: session.productiveSeconds,
    // });

    return res.json({
      success: true,
      message: "Mouse activity recorded",
      productiveSeconds: session.productiveSeconds,
    });
  } catch (error) {
    // console.error("MOUSE ACTIVITY ERROR:", error);
    // console.error("Validation errors:", error.errors || "No validation errors");

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors) : null,
    });
  }
});
