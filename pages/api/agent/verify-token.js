import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ valid: false, message: "Authorization header missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded?.userId || decoded?.id;

    if (!userId) {
      return res.status(401).json({ valid: false, message: "Invalid token format" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }

    // Allow agent and doctorStaff roles (doctorStaff can act as agent)
    if (!["agent", "doctorStaff"].includes(user.role)) {
      return res.status(403).json({ valid: false, message: "Agent or doctorStaff role required" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ valid: false, message: "Account not approved" });
    }

    if (user.declined) {
      return res.status(403).json({ valid: false, message: "Account has been declined" });
    }

    return res.status(200).json({
      valid: true,
      decoded,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ valid: false, message: "Token expired" });
    }
    // console.error("Agent token verification error:", error);
    return res
      .status(401)
      .json({ valid: false, message: "Invalid token. Please login to continue" });
  }
}

