import dbConnect from '../../../../lib/database';
import DoctorScreenshot from '../../../../models/DoctorScreenshot';
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

    const { doctorId } = req.query;
    const { startDate, endDate, limit = 100 } = req.query;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    await dbConnect();

    // Build filter
    const filter = { doctorId };
    
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
    const screenshots = await DoctorScreenshot.find(filter)
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
    console.error('Error fetching doctor screenshots:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}