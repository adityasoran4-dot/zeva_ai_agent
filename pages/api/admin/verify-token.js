import jwt from 'jsonwebtoken';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try { 
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token (use the same secret as in your login API)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Token is valid
    return res.status(200).json({
      valid: true,
      userId: decoded.id,  // FIXED: Using 'id' instead of 'userId' to match what's in the token
      role: decoded.role   // Including role for additional validation if needed
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, message: 'Token expired' });
    }
    return res.status(401).json({ valid: false, message: 'Invalid token' });
  }
}