// pages/api/admin/reset-password.js
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

  const admin = await User.findOne({ email, role: 'admin' });

  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  // ✅ Just set the plain password and let the pre-save hook hash it
  admin.password = password;
  await admin.save();

  return res.status(200).json({ message: 'Password reset successfully' });
}