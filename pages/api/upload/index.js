import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import dbConnect from "../../../lib/database";
import multer from "multer";

// Multer setup
const upload = multer({ storage: multer.memoryStorage() });

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

// Disable Next.js bodyParser → important for file upload
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const contentType = req.headers["content-type"] || "";
  const isMultipart = contentType.startsWith("multipart/form-data");

  let body = {};
  if (isMultipart) {
    await runMiddleware(req, res, upload.single("file"));
    body = req.body;
  } else {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
  }

  let me;
  if (body.source !== "zeva_server") {
    me = await getUserFromReq(req);
    if (!me) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (
      !requireRole(me, [
        "clinic",
        "agent",
        "admin",
        "doctor",
        "doctorStaff",
        "staff",
      ])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  }

  // Get clinicId based on user role
  //   let clinicId;
  //   if (me.role === "clinic") {
  //     const clinic = await Clinic.findOne({ owner: me._id });
  //     if (!clinic) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Clinic not found for this user",
  //       });
  //     }
  //     clinicId = clinic._id;
  //   } else if (me.role === "agent") {
  //     if (!me.clinicId) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Agent not tied to a clinic" });
  //     }
  //     clinicId = me.clinicId;
  //   } else if (me.role === "doctor") {
  //     if (!me.clinicId) {
  //       return res
  //         .status(400)
  //         .json({ success: false, message: "Doctor not tied to a clinic" });
  //     }
  //     clinicId = me.clinicId;
  //   } else if (me.role === "admin") {
  //     clinicId = req.body.clinicId;
  //     if (!clinicId) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "clinicId is required for admin",
  //       });
  //     }
  //   } else {
  //     return res.status(403).json({
  //       success: false,
  //       message: "Access denied",
  //     });
  //   }

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File is required for upload" });
    }

    // Here, you can process the uploaded file (req.file) as needed.
    const file = req.file;

    // For demonstration, we'll just log some file info
    console.log(
      `Received file: ${file.originalname}, size: ${file.size} bytes`,
    );

    // Upload to Cloudinary (unsigned upload using upload preset)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    console.log("Cloudinary Config:", { cloudName, uploadPreset }); // Debug log

    if (!cloudName || !uploadPreset) {
      console.error("Missing Cloudinary env vars");
      return res.status(500).json({
        success: false,
        message: "Cloudinary configuration missing on server",
      });
    }

    // Verify cloud name is not just whitespace
    if (!cloudName.trim() || cloudName.trim() === "") {
      console.error("Cloud name is empty or whitespace");
      return res.status(500).json({
        success: false,
        message: "Invalid Cloudinary cloud name",
      });
    }

    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    // Build a safe public_id and filename: keep extension, replace invalid chars with underscore, append timestamp
    const originalName = file.originalname || "file";
    const extMatch = originalName.match(/(\.[^/.]+)$/);
    const ext = extMatch ? extMatch[1] : "";
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const sanitized = nameWithoutExt
      .replace(/[\\/]/g, "_")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    const timestamp = Date.now();
    const publicId = `${sanitized || "file"}_${timestamp}`;
    const filename = `${publicId}${ext}`;

    let uploadResp;

    // Prefer multipart/form-data with FormData + Blob so Cloudinary receives a filename (avoids display_name issues)
    try {
      const formData = new FormData();
      const blob = new Blob([file.buffer], { type: file.mimetype });
      formData.append("file", blob, filename);
      formData.append("upload_preset", uploadPreset);
      formData.append("public_id", publicId);

      uploadResp = await fetch(cloudUrl, {
        method: "POST",
        body: formData,
      });
    } catch (e) {
      // Fallback to base64 data URL if FormData/Blob isn't available in environment
      console.warn(
        "FormData/Blob upload failed, falling back to data URL upload",
        e,
      );
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString(
        "base64",
      )}`;
      const params = new URLSearchParams();
      params.append("file", dataUrl);
      params.append("upload_preset", uploadPreset);
      params.append("public_id", publicId);

      uploadResp = await fetch(cloudUrl, {
        method: "POST",
        body: params,
      });
    }

    const uploadData = await uploadResp.json();

    if (!uploadResp.ok) {
      console.error("Cloudinary upload failed:", uploadData);
      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed",
        error: uploadData,
      });
    }

    // Successful upload — return secure URL
    return res.status(201).json({
      success: true,
      message: "Uploaded successfully.",
      url: uploadData.secure_url,
      raw: uploadData,
    });
  } catch (err) {
    console.error("Error in file upload:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
