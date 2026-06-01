import dbConnect from "../../../lib/database";
import Notification from "../../../models/Notification";

export default async function handler(req, res) {
  await dbConnect();

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: "userId required" });
  }

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, notifications });
}
