// lib/verifyAuth.js
import jwt from 'jsonwebtoken';
import User from '../../../models/Users';

export async function verifyAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return null;
    }

    if (!process.env.JWT_SECRET) {
      // console.error('JWT_SECRET is not set in environment variables');
      res.status(500).json({ success: false, error: 'Server configuration error' });
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      res.status(401).json({ success: false, error: 'Invalid token payload' });
      return null;
    }

    // ✅ Use decoded.userId (since you store it in login API)
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return null;
    }

    return user;
  } catch (err) {
    // console.error('verifyAuth error:', err);
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({ success: false, error: 'Invalid token' });
    } else if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Token expired' });
    } else {
      res.status(500).json({ success: false, error: 'Authentication error' });
    }
    return null;
  }
}
