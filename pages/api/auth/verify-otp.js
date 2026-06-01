//pages/api/auth/verify-otp.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  const { email, otp } = req.body || {};
  if (!email || !otp) return res.status(400).json({ success: false, message: "Email and otp required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!user.otpEnabled) return res.status(400).json({ success: false, message: "OTP not enabled" });
  const now = new Date();
  const otpStr = String(otp).trim();
  const phoneValid = user.otpCodePhone && user.otpExpiresPhone && (now <= new Date(user.otpExpiresPhone)) && otpStr === String(user.otpCodePhone).trim();
  const emailValid = user.otpCodeEmail && user.otpExpiresEmail && (now <= new Date(user.otpExpiresEmail)) && otpStr === String(user.otpCodeEmail).trim();
  if (!phoneValid && !emailValid) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }
  const payload = { userId: user._id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  user.otpCode = null;
  user.otpExpires = null;
  user.otpCodePhone = null;
  user.otpCodeEmail = null;
  user.otpExpiresPhone = null;
  user.otpExpiresEmail = null;
  await user.save();
  const tokenKey = user.role === "agent" ? "agentToken" : "userToken";
  return res.status(200).json({ success: true, token, tokenKey, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}
