// pages/api/agent/work-session/arrival.js
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    await dbConnect();

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }

    const token = auth.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Try different possible token structures
    const agentId = decoded.id || decoded.userId || decoded.agentId || decoded._id;

    if (!agentId) {
      // console.error('No agentId found in token:', decoded);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid token structure',
      });
    }

    // console.log('Processing arrival for agent:', agentId);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let session = await WorkSession.findOne({
      agentId,
      date: { $gte: start, $lte: end },
    });

    const now = new Date();

    if (!session) {
      //Create session with ALL required fields
      session = await WorkSession.create({
        agentId,
        userId: agentId,
        role: 'agent',
        date: start,
        arrivalTime: now,
        deskTimeSeconds: 0,
        productiveSeconds: 0,
        idleTimeSeconds: 0,
        productivityPercentage: 0,
        status: 'ONLINE',
        lastActivity: now
      });
      // console.log('Created new arrival session for agent:', agentId);
    } else if (!session.arrivalTime) {
      session.arrivalTime = now;
      session.status = 'ONLINE';
      session.lastActivity = now;
      
      // Ensure required fields are set
      if (!session.userId) session.userId = agentId;
      if (!session.role) session.role = 'agent';
      
      await session.save();
      // console.log('Updated arrival time for agent:', agentId);
    }

    return res.json({
      success: true,
      arrivalTime: session.arrivalTime,
    });
  } catch (err) {
    // console.error('ARRIVAL ERROR:', err);
    // console.error('Validation errors:', err.errors || 'No validation errors');
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: err.message,
      validationErrors: err.errors ? Object.keys(err.errors) : null
    });
  }
}