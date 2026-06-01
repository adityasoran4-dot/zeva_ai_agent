// middleware/withDoctorApiAuth.js
import jwt from 'jsonwebtoken';

export default function withDoctorApiAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'No authorization token provided'
        });
      }

      const token = authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const allowedRoles = ['doctor', 'doctorStaff', 'clinic', 'admin'];
      // const allowedRoles = ['doctor', 'doctorStaff' ];

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Invalid role.'
        });
      }

      req.user = decoded;
      return handler(req, res);

    } catch (error) {
      console.error('Doctor API Auth Error:', error.message);

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
}