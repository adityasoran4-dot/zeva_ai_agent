// pages/api/admin/update-approval.js
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me || !requireRole(me, ["admin"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { userId, action } = req.body;
    if (!userId || !["approve", "decline"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (action === "approve") {
      user.isApproved = true;
      user.declined = false;
    } else if (action === "decline") {
      user.isApproved = false;
      user.declined = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${action === "approve" ? "approved" : "declined"} successfully`,
      user: { id: user._id, isApproved: user.isApproved, declined: user.declined },
    });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
