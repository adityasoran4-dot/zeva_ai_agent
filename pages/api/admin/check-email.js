// pages/api/admin/check-email.js
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      return res.status(404).json({ message: 'Email or admin not found' });
    }

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    // console.error('Error checking email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}