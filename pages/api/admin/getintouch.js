// pages/api/admin/getintouch.js
import dbConnect from "../../../lib/database";
import GetInTouch from "../../../models/GetInTouch";
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET requests allowed" });
  }

  try {
    await dbConnect();
    
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
    }
    
    // Check permissions for agents - admins bypass all checks
    if (me.role === 'agent' || me.role === 'doctorStaff') {
      const { hasPermission } = await checkAgentPermission(me._id, "admin_request_callback", "read");
      if (!hasPermission) {
        return res.status(403).json({ 
          message: "Permission denied: You do not have read permission for request callback module" 
        });
      }
    } else if (me.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin or agent role required" });
    }

    const leads = await GetInTouch.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    // console.error("❌ Error fetching leads:", error);
    return res.status(500).json({
      message: "Failed to fetch leads",
      details: error.message,
    });
  }
}
