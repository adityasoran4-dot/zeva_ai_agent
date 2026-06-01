import dbConnect from "../../../../lib/database";
import Blog from "../../../../models/Blog";
import { getUserFromReq } from "../../lead-ms/auth";
import { checkAgentPermission } from "../../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check delete permission for all_blogs module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "all_blogs", // moduleKey
        "delete", // action
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to delete blogs"
        });
      }
    }
    // Admin users bypass permission checks

    const { id } = req.query;
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    return res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (error) {
    // console.error("Error deleting blog:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
}
