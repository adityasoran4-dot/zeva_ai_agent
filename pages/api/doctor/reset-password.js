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

  const doctor = await User.findOne({ email, role: 'doctor' });

  if (!doctor) {
    return res.status(404).json({ message: 'Doctor not found' });
  }

  // ✅ Just set the plain password and let the pre-save hook hash it
  doctor.password = password;
  await doctor.save();

  return res.status(200).json({ message: 'Password reset successfully' });
}
