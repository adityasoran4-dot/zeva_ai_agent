import dbConnect from "../../../lib/database";
import Notification from "../../../models/Notification";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    return res.status(400).json({ success: false, error: "Invalid IDs" });
  }

  await Notification.updateMany(
    { _id: { $in: ids } },
    { $set: { isRead: true } }
  );

  res.status(200).json({ success: true });
}
