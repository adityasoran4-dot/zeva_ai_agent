// pages/api/auth/reset-password.js
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and new password are required' });
  }

  try {
    // Find user (regular users only)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: { $in: ['user', null, undefined] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the plain password and let the pre-save hook hash it
    user.password = password;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    // console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

