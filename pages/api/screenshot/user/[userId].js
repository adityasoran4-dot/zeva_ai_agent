import dbConnect from '../../../../lib/database';
import Screenshot from '../../../../models/Screenshot';
import User from '../../../../models/Users';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const requestorId = decoded.id || decoded.userId;
    const requestorRole = decoded.role;
    
    if (!requestorId) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await dbConnect();

    // Check permissions
    // Users can only view their own screenshots
    const isAdminOrClinic = ['admin', 'clinic'].includes(requestorRole);
    const isViewingOwnScreenshots = requestorId === userId;
    
    if (!isAdminOrClinic && !isViewingOwnScreenshots) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own screenshots' 
      });
    }

    // Get query parameters
    const { 
      role, 
      startDate, 
      endDate, 
      limit = 50, 
      page = 1 
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId };
    
    if (role) {
      query.userRole = role;
    }
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get screenshots
    const [screenshots, total] = await Promise.all([
      Screenshot.find(query)
        .sort({ timestamp: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .lean(),
      Screenshot.countDocuments(query)
    ]);

    // Get user info
    const user = await User.findById(userId)
      .select('name email role currentStatus lastActivity')
      .lean();

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayCount = await Screenshot.countDocuments({
      ...query,
      timestamp: { $gte: today, $lt: tomorrow }
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        screenshots: screenshots.map(s => ({
          ...s,
          formattedDate: new Date(s.timestamp).toLocaleDateString(),
          formattedTime: new Date(s.timestamp).toLocaleTimeString()
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        statistics: {
          total,
          today: todayCount,
          lastScreenshot: screenshots[0]?.timestamp || null
        }
      }
    });
  } catch (error) {
    console.error('Screenshot retrieval error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}