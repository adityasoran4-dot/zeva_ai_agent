import fs from "fs";
import path from "path";
import multer from "multer";
import axios from "axios";
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import DoctorProfile from "../../../models/DoctorProfile";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "public/uploads/clinic");
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

const uploadMiddleware = upload.fields([{ name: "resume", maxCount: 1 }]);

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
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  await dbConnect();
  await runMiddleware(req, res, uploadMiddleware);

  try {
    const { name, phone, email, specialization, degree, experience, address, latitude, longitude } =
      req.body;

    // Validate experience
    const parsedExperience = parseInt(experience);
    if (isNaN(parsedExperience)) {
      return res
        .status(400)
        .json({ message: "Experience must be a valid number" });
    }

    const existingUser = await User.findOne({ email, role: "doctor" });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "A doctor with this email already exists" });
    }

    const resumePath = req.files?.["resume"]?.[0]?.path
      ? req.files["resume"][0].path.replace("public", "").replace(/\\/g, "/")
      : "";

    // Use provided coordinates if available, otherwise geocode the address
    let location = null;
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0) {
      // Use provided coordinates
      location = {
        lat: parsedLat,
        lng: parsedLng
      };
    } else {
      // Try to geocode the address if coordinates not provided
      try {
        const geoRes = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address,
              key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            },
          }
        );

        location = geoRes.data.results[0]?.geometry.location;
        if (!location) {
          return res.status(400).json({ message: "Invalid address. Please set location on map." });
        }
      } catch (geoError) {
        // console.error("Geocoding error:", geoError);
        return res.status(400).json({ message: "Invalid address. Please set location on map." });
      }
    }

    // Create user
    const user = await User.create({
      name,
      phone,
      email,
      role: "doctor",
      isApproved: false,
      declined: false,
    });

    try {
      // Handle treatments - convert specialization to treatments structure
      let treatments = [];
      if (specialization && specialization.trim()) {
        treatments = [
          {
            mainTreatment: specialization.trim(),
            mainTreatmentSlug: specialization
              .trim()
              .toLowerCase()
              .replace(/\s+/g, "-"),
            subTreatments: [],
          },
        ];
      }

      // Generate slug preview (not locked yet, will be locked on approval)
      let slugPreview = null;
      let slugPreviewUrl = null;
      let slugUserMessage = null;
      
      try {
        const { slugify, generateUniqueSlug } = await import('../../../lib/utils');
        
        // Extract city from address
        let cityName = '';
        if (address) {
          const addressParts = address.split(',').map(part => part.trim());
          cityName = addressParts[0] || '';
        }

        // Generate base slug from doctor name (add "dr-" prefix)
        const baseSlugFromName = slugify(`dr ${name}`);
        let baseSlug = baseSlugFromName;
        if (cityName) {
          const citySlug = slugify(cityName);
          baseSlug = `${baseSlugFromName}-${citySlug}`;
        }

        if (baseSlug) {
          // Check if slug exists (checking locked slugs only)
          const checkExists = async (slugToCheck) => {
            const existing = await DoctorProfile.findOne({
              slug: slugToCheck,
              slugLocked: true,
            }).populate('user', 'isApproved');
            
            if (existing && existing.user && existing.user.isApproved) {
              return true;
            }
            return false;
          };

          // Generate unique slug
          const finalSlug = await generateUniqueSlug(baseSlug, checkExists);
          slugPreview = finalSlug;
          
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://zeva360.com';
          slugPreviewUrl = `${baseUrl}/doctors/${finalSlug}`;
          
          // User-friendly message
          const collisionResolved = finalSlug !== baseSlug;
          if (collisionResolved && cityName) {
            slugUserMessage = `Good news! Another doctor already uses this name, so we added your city (${cityName}) to create a unique page for you.`;
          } else if (collisionResolved) {
            slugUserMessage = 'Good news! Another doctor already uses this name, so we added a number to create a unique page for you.';
          } else {
            slugUserMessage = 'Your doctor page is ready! We created a unique URL based on your name' + 
              (cityName ? ` and city (${cityName})` : '') + 
              ' to help patients find you easily.';
          }
        }
      } catch (slugError) {
        // console.error('❌ Slug preview generation error (non-fatal):', slugError.message);
        // Continue with doctor creation even if slug preview fails
      }

      // Create doctor profile
      const doctor = await DoctorProfile.create({
        user: user._id,
        degree,
        experience: parsedExperience,
        address,
        treatments,
        location: {
          type: "Point",
          coordinates: [location.lng, location.lat],
        },
        resumeUrl: resumePath,
      });

      return res.status(201).json({
        message: "Doctor registered successfully",
        user,
        doctor,
        slug_preview: slugPreview ? {
          slug: slugPreview,
          url: slugPreviewUrl,
          user_message: slugUserMessage,
        } : null,
      });
    } catch (err) {
      // Rollback user if doctor profile fails
      await User.findByIdAndDelete(user._id);
      // console.error("DoctorProfile creation failed, rolled back user:", err);
      return res.status(500).json({
        message: "Failed to create doctor profile",
        error: err.message,
      });
    }
  } catch (error) {
    // console.error("Unhandled error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}
