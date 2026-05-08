import path from "path";
import fs from "fs";
import multer from "multer";
import { getUserFromReq } from "../../lead-ms/auth";

// Disable default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public/uploads/insurance");
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });
const uploadMiddleware = upload.fields([
  { name: "insuranceCard", maxCount: 1 },
  { name: "tableOfBenefits", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // Verify authentication
  let user;
  try {
    user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "doctor", "agent", "doctorStaff", "staff", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  try {
    await runMiddleware(req, res, uploadMiddleware);

    const files = req.files || {};
    const result = {
      insuranceCardFile: "",
      tableOfBenefitsFile: "",
      documentFiles: [],
    };

    if (files.insuranceCard && files.insuranceCard.length > 0) {
      result.insuranceCardFile = `/uploads/insurance/${files.insuranceCard[0].filename}`;
    }

    if (files.tableOfBenefits && files.tableOfBenefits.length > 0) {
      result.tableOfBenefitsFile = `/uploads/insurance/${files.tableOfBenefits[0].filename}`;
    }

    if (files.documents && files.documents.length > 0) {
      result.documentFiles = files.documents.map(
        (f) => `/uploads/insurance/${f.filename}`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status(500).json({ success: false, message: "Failed to upload files" });
  }
}
