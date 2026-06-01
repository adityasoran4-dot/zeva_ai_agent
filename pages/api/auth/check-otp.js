//pages/api/auth/check-otp.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") return res.status(405).json({ success: false, message: "Method not allowed" });
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });
  const user = await User.findOne({ email }).select("role otpEnabled clinicId").lean();
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  const tokenKey = user.role === "agent" ? "agentToken" : "userToken";
  return res.status(200).json({ success: true, otpEnabled: !!user.otpEnabled, role: user.role, tokenKey, clinicId: user.clinicId?.toString() || null });
}
