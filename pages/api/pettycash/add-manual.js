import dbConnect from "../../../lib/database";
import jwt from "jsonwebtoken";
import User from "../../../models/Users";
import PettyCash from "../../../models/PettyCash";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";

// Multer config for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Disable default body parser
export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle multipart/form-data
  },
};

// Helper to run multer
const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });

// Helper: verify JWT and get user
async function getUserFromToken(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];
  if (!token) throw { status: 401, message: "No token provided" };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw { status: 401, message: "User not found" };
    return user;
  } catch (err) {
    throw { status: 401, message: "Invalid or expired token" };
  }
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Parse multipart/form-data
    await runMiddleware(req, res, upload.array("receipts"));

    const user = await getUserFromToken(req);
    const { note, amount } = req.body;

    // Check if user is staff
    if (user.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Staff role required.",
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Upload receipts to Cloudinary
    const receiptFiles = req.files || [];
    const receiptUrls = [];

    for (const file of receiptFiles) {
      const formData = new FormData();
      formData.append("file", file.buffer, file.originalname);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      );

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) receiptUrls.push(data.secure_url);
    }

    // Create a new PettyCash record for each manual addition
    const pettyCashRecord = await PettyCash.create({
      staffId: user._id,
      note: note || "Manual petty cash addition",
      allocatedAmounts: [
        {
          amount: parseFloat(amount),
          receipts: receiptUrls,
          date: new Date(),
        },
      ],
      expenses: [],
    });

    // Update global total amount
    await PettyCash.updateGlobalTotalAmount(parseFloat(amount), 'add');

    return res.status(201).json({
      success: true,
      message: "Manual petty cash added successfully",
      data: pettyCashRecord,
    });
  } catch (error) {
    // console.error("Error adding manual petty cash:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
