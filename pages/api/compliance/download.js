import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";
import crypto from "crypto";
import SOP from "../../../models/SOP";
import Playbook from "../../../models/Playbook";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }
  await dbConnect();
  try {
    let user;
    try {
      user = await getUserFromReq(req);
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      if (!["clinic", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    let clinicId;
    if (user.role === "admin") {
      clinicId = req.query.clinicId || req.body?.clinicId;
    } else {
      const resolved = await getClinicIdFromUser(user);
      clinicId = resolved.clinicId;
      if (resolved.error || !clinicId) {
        return res.status(403).json({ success: false, message: resolved.error || "Unable to determine clinic access" });
      }
    }

    const type = String(req.query.type || "").toLowerCase();
    const id = String(req.query.id || "");
    if (!id || !type) {
      return res.status(400).json({ success: false, message: "Missing id or type" });
    }

    let item;
    if (type === "sops") {
      item = await SOP.findOne({ _id: id, clinicId }).lean();
    } else if (type === "playbooks") {
      item = await Playbook.findOne({ _id: id, clinicId }).lean();
    } else {
      return res.status(400).json({ success: false, message: "Invalid type" });
    }
    if (!item) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const docUrl = item.documentUrl || (Array.isArray(item.attachments) ? item.attachments[0] : "");
    if (!docUrl) {
      return res.status(400).json({ success: false, message: "No document URL" });
    }

    let publicId = "";
    let format = "pdf";
    let cloudName = process.env.SCREENSHOT_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const apiKey = process.env.SCREENSHOT_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || "";
    const apiSecret = process.env.SCREENSHOT_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || "";
    try {
      const u = new URL(docUrl);
      const isCloudinary = /res\.cloudinary\.com$/i.test(u.host);
      if (!isCloudinary) {
        return res.status(200).json({ success: true, url: docUrl });
      }
      const parts = u.pathname.split("/");
      const idx = parts.findIndex(p => p === "upload");
      if (idx === -1) {
        return res.status(200).json({ success: true, url: docUrl });
      }
      const after = parts.slice(idx + 1);
      const last = after[after.length - 1] || "";
      const m = last.match(/^(.*)\.(\w+)$/);
      if (m) {
        format = m[2];
        const prefix = after.length > 1 && /^v\d+$/i.test(after[0]) ? after.slice(1, -1).join("/") : after.slice(0, -1).join("/");
        publicId = prefix ? `${prefix}/${m[1]}` : m[1];
      } else {
        const prefix = after.length > 1 && /^v\d+$/i.test(after[0]) ? after.slice(1).join("/") : after.join("/");
        publicId = prefix;
      }
    } catch {
      return res.status(200).json({ success: true, url: docUrl });
    }

    if (!cloudName || !apiKey || !apiSecret || !publicId) {
      return res.status(200).json({ success: true, url: docUrl });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `format=${format}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
    const downloadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/download?timestamp=${timestamp}&public_id=${encodeURIComponent(publicId)}&format=${encodeURIComponent(format)}&signature=${signature}&api_key=${apiKey}`;

    return res.status(200).json({ success: true, url: downloadUrl });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Internal error" });
  }
}
