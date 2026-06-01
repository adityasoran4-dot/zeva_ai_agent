// pages/api/agent/work-session/productive-time.js
import { verifyToken } from '../../../../lib/auth';
import dbConnect from '../../../../lib/database';
import WorkSession from '../../../../models/WorkSession';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // console.log('Productive time endpoint called');
    
    // Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    // Get agent ID from decoded token
    const agentId = decoded.userId || decoded.id || decoded.agentId || decoded._id;
    if (!agentId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token payload' 
      });
    }

    const { productiveSeconds } = req.body;
    
    // Validate productive seconds
    if (!productiveSeconds || typeof productiveSeconds !== 'number' || productiveSeconds <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid productive seconds value' 
      });
    }

    await dbConnect();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Find today's work session
    let workSession = await WorkSession.findOne({
      agentId: agentId,
      date: { $gte: today, $lte: end }
    });

    if (!workSession) {
      // If no session exists for today, create one
      workSession = await WorkSession.create({
        agentId: agentId,
        date: today,
        arrivalTime: new Date(),
        deskTimeSeconds: productiveSeconds,
        productiveSeconds: productiveSeconds,
        productivityPercentage: 100,
        lastActivity: new Date()
      });
    } else {
      // Update existing session
      workSession.deskTimeSeconds = (workSession.deskTimeSeconds || 0) + productiveSeconds;
      workSession.productiveSeconds = (workSession.productiveSeconds || 0) + productiveSeconds;
      workSession.lastActivity = new Date();
      
      // Calculate productivity percentage
      if (workSession.deskTimeSeconds > 0) {
        workSession.productivityPercentage = Math.round(
          (workSession.productiveSeconds / workSession.deskTimeSeconds) * 100
        );
      }
      
      await workSession.save();
    }

    res.status(200).json({
      success: true,
      message: `Added ${productiveSeconds} productive seconds`,
      data: {
        deskTimeSeconds: workSession.deskTimeSeconds,
        productiveSeconds: workSession.productiveSeconds,
        productivityPercentage: workSession.productivityPercentage
      }
    });

  } catch (error) {
    // console.error('Productive time update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}