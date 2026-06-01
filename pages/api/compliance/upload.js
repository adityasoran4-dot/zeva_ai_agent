// api/compliance/upload
import fs from "fs";
import path from "path";
import formidable from "formidable";
import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
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

    const typeParam = String(req.query.type || "sops").toLowerCase();
    const subfolder = typeParam === "playbooks" ? "PolicyAndCompliance/Playbook" : "PolicyAndCompliance/SOP";
    const uploadDir = path.join(process.cwd(), "public", "uploads", "tmp");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      filename: (name, ext, part) => {
        const timestamp = Date.now();
        const originalName = part.originalFilename || "file";
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
        return `${clinicId}-${timestamp}-${sanitizedName}`;
      },
    });

    const [fields, files] = await form.parse(req);

    let file;
    if (files.file) {
      file = Array.isArray(files.file) ? files.file[0] : files.file;
    } else {
      const keys = Object.keys(files);
      if (keys.length) {
        const k = keys[0];
        file = Array.isArray(files[k]) ? files[k][0] : files[k];
      }
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filepath = file.filepath || file.path;
    if (!filepath || !fs.existsSync(filepath)) {
      return res.status(500).json({ success: false, message: "Upload failed" });
    }

    const originalName = file.originalFilename || "file";
    const extMatch = originalName.match(/(\.[^/.]+)$/);
    const ext = extMatch ? extMatch[1] : "";
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const safeBaseName = nameWithoutExt
      .replace(/[\\/]/g, "_")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const finalName = `${safeBaseName || "file"}_${Date.now()}${ext || ""}`;

    const basePublicFolder = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "public", "zeva360")
      : path.join(process.cwd(), "public");
    const destDir = path.join(basePublicFolder, "uploads", "compliance", typeParam === "playbooks" ? "Playbook" : "SOP");
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, finalName);
    fs.renameSync(filepath, destPath);

    function getBaseUrl() {
      if (process.env.NODE_ENV === "production") {
        return process.env.NEXT_PUBLIC_BASE_URL || "https://zeva360.com";
      }
      return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    }
    const baseUrl = getBaseUrl();
    const relativeFromPublic = path
      .relative(path.join(process.cwd(), "public"), destPath)
      .replace(/\\/g, "/");
    const urlPath = `/${relativeFromPublic}`;
    const absoluteUrl = `${baseUrl}${urlPath}`;

    return res.status(200).json({
      success: true,
      url: absoluteUrl,
      path: urlPath,
      folder: subfolder
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Internal error" });
  }
}
