import dbConnect from "../../../lib/database";
import Notification from "../../../models/Notification";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "DELETE") {
    const { id } = req.query;

    try {
      await Notification.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ success: true, message: "Notification deleted" });
    } catch {
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete notification" });
    }
  } else {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}
