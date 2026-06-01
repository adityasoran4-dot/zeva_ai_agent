// pages/api/agent/work-session/leave.js
import dbConnect from '@/lib/database';
import WorkSession from '@/models/WorkSession';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    await dbConnect();

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).end();

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const agentId = decoded.agentId || decoded.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const session = await WorkSession.findOne({
      agentId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!session) return res.status(404).end();

    session.leftTime = new Date();
    await session.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).end();
  }
}
