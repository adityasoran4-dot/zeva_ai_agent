// /pages/api/admin/user-count.js

import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
   
    const userCount = await User.countDocuments({ role: 'user' }).select("-password");

    return res.status(200).json({
      success: true,
      userCount,
    });
  } catch (error) {
    // console.error('Error fetching user count:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
}
