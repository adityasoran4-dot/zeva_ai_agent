// pages/api/clinic/reset-password.js
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

  const clinic = await User.findOne({ email, role: 'clinic' });

  if (!clinic) {
    return res.status(404).json({ message: 'Clinic not found' });
  }

  // ✅ Just set the plain password and let the pre-save hook hash it
  clinic.password = password;
  await clinic.save();

  return res.status(200).json({ message: 'Password reset successfully' });
}