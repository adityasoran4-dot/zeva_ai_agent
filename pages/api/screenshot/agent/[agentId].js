// // pages/api/screenshots/agent/[agentId].js
// import dbConnect from '../../../../lib/database';
// import Screenshot from '../../../../models/Screenshot';
// import jwt from 'jsonwebtoken';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ 
//       success: false, 
//       message: 'Method not allowed' 
//     });
//   }

//   try {
//     // Authentication - check if user is admin/clinic/doctor
//     const authHeader = req.headers.authorization;
    
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'No token provided' 
//       });
//     }
    
//     const token = authHeader.split(' ')[1];
    
//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
//     } catch (jwtError) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Invalid or expired token' 
//       });
//     }
    
//     // Check user permissions (admin, clinic, or doctor)
//     const userRole = decoded.role || decoded.userType;
//     const userId = decoded.userId || decoded.id;
    
//     // Only allow admin, clinic, or doctor roles
//     const allowedRoles = ['admin', 'clinic', 'doctor'];
//     if (!allowedRoles.includes(userRole)) {
//       return res.status(403).json({ 
//         success: false, 
//         message: 'Unauthorized access' 
//       });
//     }
    
//     // Get agentId from query parameters
//     const { agentId } = req.query;
    
//     if (!agentId) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Agent ID is required' 
//       });
//     }
    
//     await dbConnect();
    
//     // Get date range from query (optional)
//     const { startDate, endDate, limit = 100 } = req.query;
    
//     let dateFilter = {};
    
//     if (startDate || endDate) {
//       dateFilter.timestamp = {};
//       if (startDate) {
//         dateFilter.timestamp.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         dateFilter.timestamp.$lte = new Date(endDate);
//       }
//     } else {
//       // Default: last 7 days
//       const lastWeek = new Date();
//       lastWeek.setDate(lastWeek.getDate() - 7);
//       dateFilter.timestamp = { $gte: lastWeek };
//     }
    
//     // Fetch screenshots for the agent
//     const screenshots = await Screenshot.find({
//       agentId,
//       ...dateFilter
//     })
//     .sort({ timestamp: -1 })
//     .limit(parseInt(limit))
//     .lean();
    
//     // Format the response
//     const formattedScreenshots = screenshots.map(screenshot => ({
//       id: screenshot._id,
//       url: screenshot.url,
//       timestamp: screenshot.timestamp,
//       sessionId: screenshot.sessionId,
//       agentId: screenshot.agentId,
//       createdAt: screenshot.createdAt,
//       // Add Cloudinary info if available
//       cloudinaryAccount: screenshot.cloudinaryAccount,
//       cloudinaryCloudName: screenshot.cloudinaryCloudName,
//       publicId: screenshot.publicId,
//       // Add metadata if available
//       metadata: screenshot.metadata || {}
//     }));
    
//     return res.status(200).json({
//       success: true,
//       count: formattedScreenshots.length,
//       agentId,
//       screenshots: formattedScreenshots
//     });
    
//   } catch (error) {
//     console.error('Error fetching screenshots:', error);
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Server error',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// }

import dbConnect from '../../../../lib/database';
import AgentScreenshot from '../../../../models/AgentScreenshot';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
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
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Only clinic/doctor/admin should access
    const allowedRoles = ['clinic', 'doctor', 'admin', 'doctorStaff'];
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { agentId } = req.query;
    const { startDate, endDate, limit = 100 } = req.query;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        message: 'Agent ID is required'
      });
    }

    await dbConnect();

    // Build filter
    const filter = { agentId };
    
    // Add date filter if provided
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Fetch screenshots
    const screenshots = await AgentScreenshot.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('url timestamp metadata sessionId')
      .lean();

    return res.status(200).json({
      success: true,
      count: screenshots.length,
      screenshots: screenshots.map(s => ({
        url: s.url,
        timestamp: s.timestamp,
        metadata: s.metadata,
        sessionId: s.sessionId
      }))
    });

  } catch (error) {
    console.error('Error fetching agent screenshots:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}