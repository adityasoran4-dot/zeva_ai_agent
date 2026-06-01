import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import { getUserFromReq, requireRole } from "./auth";
import { getClinicIdFromUser } from "./permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const me = await getUserFromReq(req);
  if (!requireRole(me, ["clinic", "agent"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { clinicId, error } = await getClinicIdFromUser(me);
  if (error) {
    return res.status(404).json({ success: false, message: error });
  }

  try {
    const agents = await User.find({
      role: "agent",
      isApproved: true,
      declined: false,
      ...(clinicId ? { clinicId } : {}),
    }).select("_id name email clinicId");

    return res.status(200).json({ success: true, users: agents });
  } catch (err) {
    // console.error("Error fetching agents:", err);/
    return res.status(500).json({ success: false, message: "Failed to fetch agents" });
  }
}
