import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // find user with allowed roles (doctor, staff, doctorStaff, agent)
    const user = await User.findOne({
      email,
      role: { $in: ["doctor", "staff", "doctorStaff", "agent"] },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // check approval
    if (!user.isApproved || user.declined) {
      return res.status(403).json({ success: false, message: "Account not approved" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token with name included
    const payload = {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET); // expires in 7 days

    try {
      user.currentStatus = 'ONLINE';
      user.lastActivity = new Date();
      await user.save();
    } catch (e) {
      // console.error('Failed to update lastActivity/currentStatus on login', e);
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      doctor: {
        name: user.name,
        email: user.email,
      },
      token,
      tokenKey: user.role === "agent" ? "agentToken" : "doctorToken",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });

  } catch (err) {
    // console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
