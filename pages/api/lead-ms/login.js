import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import bcrypt from 'bcryptjs';
import { signToken } from './auth';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  await dbConnect();
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Missing credentials' });

  const user = await User.findOne({ email }).exec();
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  if (!user.password)
    return res.status(401).json({ success: false, message: 'Password not set' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  // Optional: check isApproved for agents
  if (user.role === 'agent' && !user.isApproved) {
    return res.status(403).json({ success: false, message: 'Agent not approved yet' });
  }

  const token = signToken(user);
  return res.status(200).json({
    success: true,
    token,
    role: user.role,
     user: {
    id: user._id,
    email: user.email,
    role: user.role,
  },
 
  });
}
