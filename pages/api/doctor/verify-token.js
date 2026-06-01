import jwt from 'jsonwebtoken';
import dbConnect from '../../../lib/database';
import User from '../../../models/Users';


// console.log("🔥 verify-token.js LOADED BY NEXT.JS");

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;

  // console.log("==== VERIFY API CALLED ====");

  // console.log("Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // console.log("❌ Missing or invalid Authorization header");
    return res.status(401).json({ valid: false, message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];

  // console.log("📌 Token Received From Frontend:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // console.log("📌 DECODED TOKEN:", decoded);

    const userId = decoded?.userId || decoded?.id;

    // console.log("📌 Extracted userId from Token:", userId);

    if (!userId) {
      // console.log("❌ Token does not contain valid userId/id field");
      return res.status(401).json({ valid: false, message: 'Invalid token format' });
    }

    const user = await User.findById(userId);

    // console.log("📌 USER FOUND IN DB:", user);
    // console.log("📌 USER ROLE IN DB:", user?.role);
// 
    if (!user) {
      // console.log("❌ User not found in DB");
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    const allowedRoles = ['doctor', 'doctorStaff'];
    if (!allowedRoles.includes(user.role)) {
      // console.log(`❌ Role mismatch. Required: ${allowedRoles.join('/')} | Found: ${user.role}`);
      return res.status(403).json({ valid: false, message: 'Access denied. Doctor or doctorStaff role required' });
    }

    if (!user.isApproved) {
      // console.log("❌ User not approved");
      return res.status(403).json({ valid: false, message: 'Account not approved' });
    }

    if (user.declined) {
      // console.log("❌ User account declined");
      return res.status(403).json({ valid: false, message: 'Account has been declined' });
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const tokenIssuedAt = new Date(decoded.iat * 1000); // Convert JWT iat (seconds) to Date
      const passwordChangedAt = new Date(user.passwordChangedAt);
      
      if (passwordChangedAt > tokenIssuedAt) {
        // console.log("❌ Password was changed after token was issued");
        // console.log("Token issued at:", tokenIssuedAt);
        // console.log("Password changed at:", passwordChangedAt);
        return res.status(401).json({ 
          valid: false, 
          message: 'Password has been changed. Please login again.',
          passwordChanged: true 
        });
      }
    }

    // console.log("✅ Token Verified Successfully. Access Granted.");

    return res.status(200).json({
      valid: true,
      decoded,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    // console.log("❌ TOKEN VERIFICATION ERROR:", error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ valid: false, message: 'Token expired' });
    }

    return res.status(401).json({ valid: false, message: 'Invalid token. Please login again' });
  }
}
