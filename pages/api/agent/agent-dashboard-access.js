import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth"; // adjust path if needed

// Map DB permissions to sidebar permissionKeys
const permissionKeyMap = {
  "lead": "lead:menu",
  "create lead": "lead:create",
  "assign lead": "lead:assign",
  "dashboard": "dashboard:view",
  "create agent": "agent:create",
  "create permission": "permission:manage",
  "create offers": "offer:create",
  "marketing": "marketing:manage",
  // Add other mappings if needed
};

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await getUserFromReq(req);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (user.role !== "agent") {
      return res.status(403).json({ message: "Access denied: not an agent" });
    }

    const agent = await User.findById(user._id).select("permissions");

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Map DB permissions to permissionKeys
    const mappedPermissions = (agent.permissions || [])
      .map((p) => permissionKeyMap[p.toLowerCase()])
      .filter(Boolean); // remove undefined

    return res.status(200).json({
      permissions: mappedPermissions,
    });
  } catch (err) {
    // console.error("Error in /api/agent/agent-dashboard-access:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
