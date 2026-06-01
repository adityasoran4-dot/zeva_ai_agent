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
    // Check if user exists (regular users, not clinic/doctor/admin)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      role: { $in: ['user', null, undefined] } // Regular users or no role
    });

    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    return res.status(200).json({ message: 'Email found', user: { email: user.email } });
  } catch (error) {
    // console.error('Error checking email:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

