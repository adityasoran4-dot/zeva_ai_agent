// middleware/withAgentApiAuth.js
import jwt from 'jsonwebtoken';

const withAgentApiAuth = (handler) => async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // MUST MATCH verify-token.js
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    req.user = {
      id: userId,
      role: decoded.role,
    };

    return handler(req, res);
  } catch (error) {
    console.error('withAgentApiAuth error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

export default withAgentApiAuth;
