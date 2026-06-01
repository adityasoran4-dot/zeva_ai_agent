// /pages/api/lead-ms/update-permissions.ts
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Only clinic can assign permissions
    if (user.role !== "clinic") {
      return res.status(403).json({ message: "Only clinics can update permissions" });
    }

    const { agentId, permission, action } = req.body;

    if (!agentId || !permission || !["add", "remove"].includes(action)) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const agent = await User.findById(agentId);
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    if (action === "add") {
      if (!agent.permissions.includes(permission)) {
        agent.permissions.push(permission);
      }
    } else if (action === "remove") {
      agent.permissions = agent.permissions.filter(p => p !== permission);
    }

    await agent.save();

    return res.status(200).json({ message: "Permissions updated", permissions: agent.permissions });
  } catch (err) {
    // console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
