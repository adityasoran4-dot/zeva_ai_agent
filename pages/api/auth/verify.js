import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export const verifyToken = async (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined in env');

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch {
    throw new Error('Invalid or expired token.Please login to continue');
  }

  await dbConnect();

  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }

  return user; // Return full user object
};

// API route handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const user = await verifyToken(token);
    return res.status(200).json({ user });
  } catch (error) {
    // console.error('Token verification error:', error);

    const message =
      error.name === 'TokenExpiredError'
        ? 'Token expired'
        : error.message || 'Invalid or expired token';

    return res.status(401).json({ message });
  }
}
