import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await User.findById(me._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.currentStatus = "OFFLINE";
    user.lastActivity = new Date();
    await user.save();
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
