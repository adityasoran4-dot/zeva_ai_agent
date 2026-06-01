import jwt from "jsonwebtoken";
import dbConnect from "../../../lib/database";
import PettyCash from "../../../models/PettyCash";
import User from "../../../models/Users";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";

// ✅ Configure multer for in-memory upload (for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Disable body parser for multipart form-data
export const config = {
  api: { bodyParser: false },
};

// ✅ Helper to run multer middleware
const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  try {
    // ✅ Parse form-data with possible receipt files
    await runMiddleware(req, res, upload.array("receipts"));

    // ✅ JWT Verification
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staffId = decoded.userId;

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== "staff") {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Extract and validate required fields
    const { patientName, patientEmail, patientPhone, note, allocatedAmounts } = req.body;

    if (!patientName || !patientEmail || !patientPhone || !allocatedAmounts) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // ✅ Parse allocated amounts (supports JSON string from form-data)
    let parsedAllocations = [];
    try {
      parsedAllocations = JSON.parse(allocatedAmounts);
    } catch {
      return res.status(400).json({ message: "Invalid allocatedAmounts format — must be JSON array" });
    }

    // ✅ Upload receipts to Cloudinary (optional)
    const receiptFiles = req.files || [];
    const receiptUrls = [];

    if (receiptFiles.length > 0) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      for (const file of receiptFiles) {
        const formData = new FormData();
        formData.append("file", file.buffer, file.originalname);
        formData.append("upload_preset", uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.secure_url) receiptUrls.push(data.secure_url);
        // else console.warn("Cloudinary upload failed:", data);
      }
    }

    // ✅ Combine amounts with receipts (if applicable)
    const formattedAllocations = parsedAllocations.map((amt) => ({
      amount: Number(amt),
      receipts: receiptUrls,
      date: new Date(),
    }));

    // ✅ Create new Petty Cash record
    const newPettyCash = new PettyCash({
      staffId,
      patientName,
      patientEmail,
      patientPhone,
      note,
      allocatedAmounts: formattedAllocations,
    });

    await newPettyCash.save();

    // Update global total amount
    const totalAmount = formattedAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    await PettyCash.updateGlobalTotalAmount(totalAmount, 'add');

    res.status(201).json({
      success: true,
      message: "Petty cash entry added successfully",
      pettyCash: newPettyCash,
    });
  } catch (error) {
    // console.error("Error adding petty cash:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
