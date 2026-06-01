// pages/api/screenshots/bulk.js
import dbConnect from '../../../../lib/database';
import Screenshot from '../../../../models/Screenshot';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    } catch (jwtError) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    // Check permissions
    const userRole = decoded.role || decoded.userType;
    const allowedRoles = ['admin', 'clinic', 'doctor'];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized access' 
      });
    }
    
    const { agentIds, startDate, endDate } = req.body;
    
    if (!Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Agent IDs array is required' 
      });
    }
    
    await dbConnect();
    
    // Build query
    const query = {
      agentId: { $in: agentIds }
    };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    // Fetch screenshots for multiple agents
    const screenshots = await Screenshot.find(query)
      .sort({ timestamp: -1 })
      .limit(500) // Limit for bulk request
      .lean();
    
    // Group screenshots by agentId
    const groupedScreenshots = {};
    
    screenshots.forEach(screenshot => {
      const agentId = screenshot.agentId.toString();
      if (!groupedScreenshots[agentId]) {
        groupedScreenshots[agentId] = [];
      }
      
      groupedScreenshots[agentId].push({
        id: screenshot._id,
        url: screenshot.url,
        timestamp: screenshot.timestamp,
        createdAt: screenshot.createdAt
      });
    });
    
    return res.status(200).json({
      success: true,
      total: screenshots.length,
      groupedScreenshots
    });
    
  } catch (error) {
    console.error('Bulk screenshot fetch error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error'
    });
  }
}