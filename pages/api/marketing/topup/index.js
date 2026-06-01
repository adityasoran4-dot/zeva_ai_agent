import dbConnect from "../../../../lib/database";
import SmsTopupRequest from "../../../../models/SmsTopupRequest";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();
  const user = await getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      let query = {};
      if (requireRole(user, ["clinic", "doctor"])) {
        query.ownerId = user._id;
      } else if (!requireRole(user, ["admin"])) {
        return res.status(403).json({ success: false, message: "Access denied" });
      } else {
        if (req.query.ownerId) query.ownerId = req.query.ownerId;
        if (req.query.ownerType) query.ownerType = req.query.ownerType;
        if (req.query.status) query.status = req.query.status;
      }

      const limit = parseInt(req.query.limit || "50", 10);
      const requests = await SmsTopupRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("ownerId", "name email phone role");

      return res.status(200).json({ success: true, data: requests });
    } catch (error) {
      // console.error("topup list error", error);
      return res.status(500).json({ success: false, message: "Failed to fetch top-up requests" });
    }
  }

  if (req.method === "POST") {
    if (!requireRole(user, ["clinic", "doctor"])) {
      return res.status(403).json({ success: false, message: "Only clinics or doctors can request top-ups" });
    }

    const { credits, note } = req.body;
    if (!credits || credits <= 0) {
      return res.status(400).json({ success: false, message: "Credits must be greater than zero" });
    }

    try {
      const request = await SmsTopupRequest.create({
        ownerId: user._id,
        ownerType: user.role,
        credits,
        note,
      });
      return res.status(201).json({ success: true, data: request });
    } catch (error) {
      // console.error("topup create error", error);
      return res.status(500).json({ success: false, message: "Failed to create top-up request" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

