import dbConnect from "../../../lib/database";
import Contract from "../../../models/Contract";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Disable Next.js default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to run multer middleware
const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    // Run multer to parse multipart/form-data (with "contractFile")
    await runMiddleware(req, res, upload.single("contractFile"));

    // Verify Admin Token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    // Extract form fields
    const {
      contractId,
      contractTitle,
      startDate,
      endDate,
      renewalDate,
      contractValue,
      paymentTerms,
      responsiblePerson,
      status,
    } = req.body;

    // Validation
    if (
      !contractId ||
      !contractTitle ||
      !startDate ||
      !endDate ||
      !contractValue ||
      !paymentTerms ||
      !responsiblePerson
    ) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    // Upload contract file to Cloudinary
    let uploadedFileUrl = null;
    const file = req.file;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (file && cloudName && uploadPreset) {
      const formData = new FormData();
      formData.append("file", file.buffer, file.originalname);
      formData.append("upload_preset", uploadPreset);

      const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      if (uploadData.secure_url) uploadedFileUrl = uploadData.secure_url;
    }

    // Create Contract
    const newContract = await Contract.create({
      contractId,
      contractTitle,
      startDate,
      endDate,
      renewalDate,
      contractValue,
      paymentTerms,
      responsiblePerson,
      status: status || "Active",
      contractFile: uploadedFileUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Contract created successfully",
      data: newContract,
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}