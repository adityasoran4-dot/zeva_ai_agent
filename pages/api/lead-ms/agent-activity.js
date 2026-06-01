import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import AgentProfile from "../../../models/AgentProfile";
import { getUserFromReq } from "./auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { agentId } = req.query;
    if (!agentId) {
      return res.status(400).json({ success: false, message: "agentId is required" });
    }

    const user = await User.findById(agentId).select("currentStatus lastActivity passwordChangedAt createdAt");
    const profile = await AgentProfile.findOne({ userId: agentId }).select("isActive createdAt updatedAt contractFrontUrl contractBackUrl otherDocuments");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const data = {
      currentStatus: user.currentStatus || "OFFLINE",
      lastActivity: user.lastActivity || null,
      isActive: profile ? profile.isActive : null,
      lastLogin: user.lastActivity || null,
      passwordChangedAt: user.passwordChangedAt || null,
      contractUpdatedAt: profile ? profile.updatedAt : null,
      documentUploadedAt: profile ? profile.updatedAt : null,
      profileCreatedAt: profile ? profile.createdAt : user.createdAt || null,
    };

    return res.status(200).json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
