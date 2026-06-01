// pages/api/verifyToken.js

import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import admin from '../../../lib/firebaseAdmin';

export default async function handler(req, res) {
  await dbConnect();

  const { token } = req.body;

  if (!token) {
    console.log('❌ No token received in request');
    return res.status(400).json({ message: 'Missing token' });
  }

  try {
    // 🔐 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email;

    console.log('🔥 Incoming token:', token);
console.log('📩 Decoded email:', decoded.email);
// console.log('📦 DB Response:', user);
//     console.log('✅ Token verified, email:', email);

    // 🔍 Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 💾 Create new user in MongoDB
      console.log('🔄 User not found, creating...');
      user = await User.create({ email, role: 'clinic' });
    } else {
      console.log('ℹ️ User already exists');
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('❌ Firebase token verification failed:', error);
    res.status(401).json({ message: 'Invalid or expired token.Please Login to continue', error });
  }
}
