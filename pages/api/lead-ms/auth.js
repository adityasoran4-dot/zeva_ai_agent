// /lib/auth.js
import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export async function getUserFromReq(req) {
  try {
    await dbConnect();
  } catch (dbError) {
    // console.error("Database connection error in getUserFromReq:", dbError);
    return null;
  }

  try { 
    const auth = req.headers.authorization || "";
    
    if (!auth) {
      return null;
    }

    const token = auth?.toLowerCase().startsWith("bearer ")
      ? auth.slice(7)
      : null;
    
    if (!token) {
      return null;
    }

    if (!process.env.JWT_SECRET) {
      // console.error("JWT_SECRET is not set in environment variables");
      return null;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle different token formats:
    // Admin uses 'id', others use 'userId'
    const userId = payload?.userId || payload?.id;
    if (!userId) {
      return null;
    }

    const user = await User.findById(userId);
    return user || null;
  } catch (e) {
    // Don't log JWT errors as they're expected for invalid tokens
    if (e.name !== 'JsonWebTokenError' && e.name !== 'TokenExpiredError') {
      // console.error("Auth error in getUserFromReq:", e.message);
    }
    return null;
  }
}

export function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
 );
}

export function requireRole(user, roles = []) {
  if (!user) return false;
  if (!roles.length) return true;
  return roles.includes(user.role);
}