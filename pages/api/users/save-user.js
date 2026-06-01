// pages/api/verifyToken.js
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  await dbConnect();

  const { token } = req.body;
  if (!token) {
    console.log('❌ No token received');
    return res.status(400).json({ message: 'Missing token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email;

    console.log('✅ Token decoded, email:', email);

    let user = await User.findOne({ email });

    if (!user) {
      console.log('🔄 Creating new user in DB...');
      user = await User.create({ email, role: 'clinic' });
    } else {
      console.log('ℹ️ User already exists in DB');
    }

    console.log('✅ Final user data:', user);

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ Token verification failed', error);
    res.status(401).json({ message: 'Invalid token', error });
  }
}
