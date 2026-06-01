import dbConnect from "../../../lib/database";
import Notification from "../../../models/Notification";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "DELETE") {
    const { userId } = req.query;

    try {
      await Notification.deleteMany({ user: userId }); // ✅ Fix here
      return res.status(200).json({ success: true, message: "All notifications cleared" });
    } catch (err) {
      // console.error("Clear notifications error:", err);
      return res.status(500).json({ success: false, message: "Failed to clear notifications" });
    }
  } else {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
}
