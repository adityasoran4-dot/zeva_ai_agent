import dbConnect from '../../../lib/database';
import User from '../../../models/Users';

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method === 'GET') {
      const count = await User.countDocuments();
      return res.status(200).json({
        success: true,
        count,
        message: `✅ Found ${count} registered users.`,
      });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  } catch (error) {
    console.error('❌ Error fetching user count:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
}
