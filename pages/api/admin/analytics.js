import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
  
  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check read permission for admin_user_analytics module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "admin_user_analytics", // moduleKey
        "read", // action
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to view user analytics"
        });
      }
    }
    // Admin users bypass permission checks

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    // Fetch total count
    const totalUsers = await User.countDocuments({ role: "user" });

    // Fetch paginated users where role is 'user' - sorted by name A-Z by default
    const users = await User.find({ role: "user" })
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }); // Sort by name A-Z

    return res.status(200).json({ 
      success: true, 
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit
      }
    });
  } catch (error) {
    // console.error("Error fetching users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
