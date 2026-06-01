import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import User from "../../../models/Users";
import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), "public/uploads/clinic");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "clinic-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image or pdf files are allowed"));
    }
  },
}).fields([
  { name: "photos", maxCount: 5 },
  { name: "resume", maxCount: 1 },
]);

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await runMiddleware(req, res, upload);

    const {
      userId,
      degree,
      experience,
      address,
      treatments,
      consultationFee,
      clinicContact,
      phone, // <-- add phone
      timeSlots,
      latitude,
      longitude,
    } = req.body;

    if (!userId)
      return res.status(400).json({ message: "User ID is required" });

    const profile = await DoctorProfile.findOne({ user: userId });
    if (!profile)
      return res.status(404).json({ message: "Doctor profile not found" });

    // 🔒 Protect slug if it's locked (SEO stability)
    // If slug is locked, prevent changes to slug and slugLocked fields
    if (profile.slugLocked) {
      // Remove slug and slugLocked from update data to prevent changes
      delete req.body.slug;
      delete req.body.slugLocked;
      // console.log("🔒 Slug is locked - preventing slug changes for SEO stability");
    }

    // Update fields
    profile.degree = degree;
    profile.experience = Number(experience);
    profile.address = address;
    profile.consultationFee = Number(consultationFee);
    profile.clinicContact = clinicContact;
    // Handle treatments with proper structure
    if (treatments) {
      try {
        const parsedTreatments =
          typeof treatments === "string" ? JSON.parse(treatments) : treatments;

        if (Array.isArray(parsedTreatments)) {
          profile.treatments = parsedTreatments.map((treatment) => {
            if (typeof treatment === "string") {
              return {
                mainTreatment: treatment,
                mainTreatmentSlug: treatment.toLowerCase().replace(/\s+/g, "-"),
                subTreatments: [],
              };
            } else if (treatment.mainTreatment && treatment.mainTreatmentSlug) {
              return {
                ...treatment,
                subTreatments: treatment.subTreatments || [],
              };
            }
            return treatment;
          });
        }
      } catch (error) {
        // console.error("Error parsing treatments:", error);
        // Fallback: convert to simple array format
        if (Array.isArray(treatments)) {
          profile.treatments = treatments.map((treatment) => ({
            mainTreatment: treatment,
            mainTreatmentSlug: treatment.toLowerCase().replace(/\s+/g, "-"),
            subTreatments: [],
          }));
        }
      }
    }

    // Parse and update timeSlots
    profile.timeSlots = timeSlots ? JSON.parse(timeSlots) : [];

    // Update coordinates
    profile.location = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)],
    };

    // Photos
    if (req.files["photos"]) {
      const photoPaths = req.files["photos"].map(
        (file) => `/uploads/clinic/${file.filename}`
      );
      profile.photos = photoPaths;
    }

    // Resume
    if (req.files["resume"] && req.files["resume"][0]) {
      profile.resumeUrl = `/uploads/clinic/${req.files["resume"][0].filename}`;
    }

    await profile.save();

    // Update phone in User model
    if (phone) {
      await User.findByIdAndUpdate(userId, { phone });
    }

    // Set base URL for images
    const getBaseUrl = () => {
      if (process.env.NODE_ENV === "production") {
        return "https://zeva360.com";
      }
    return process.env.NEXT_PUBLIC_BASE_URL ;
    };
    // Update photos and resumeUrl to full URLs
    let responseProfile = profile.toObject
      ? profile.toObject()
      : { ...profile };
    if (responseProfile.photos && responseProfile.photos.length > 0) {
      responseProfile.photos = responseProfile.photos.map((photo) =>
        photo.startsWith("http") ? photo : `${getBaseUrl()}${photo}`
      );
    }
    if (responseProfile.resumeUrl) {
      responseProfile.resumeUrl = responseProfile.resumeUrl.startsWith("http")
        ? responseProfile.resumeUrl
        : `${getBaseUrl()}${responseProfile.resumeUrl}`;
    }

    return res.status(200).json({
      message: "Doctor profile updated successfully",
      profile: responseProfile,
    });
  } catch (error) {
    // console.error("Edit profile error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
}
export const config = {
  api: {
    bodyParser: false,
  },
};
