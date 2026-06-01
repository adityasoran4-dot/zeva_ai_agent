// lib/auth.js
import jwt from 'jsonwebtoken';

export function verifyToken(token) {
  try {
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

// Optional: Create token
export function createToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}