import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import DoctorProfile from "../../../models/DoctorProfile";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Fetch the doctor profile
    const doctorProfile = await DoctorProfile.findOne({
      user: user._id,
    }).lean();

    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    // Set base URL for images
    const getBaseUrl = () => {
      if (process.env.NODE_ENV === "production") {
        return "https://zeva360.com";
      }
      return process.env.NEXT_PUBLIC_BASE_URL ;
    };
    // Update photos and resumeUrl to full URLs
    if (doctorProfile.photos && doctorProfile.photos.length > 0) {
      doctorProfile.photos = doctorProfile.photos.map((photo) =>
        photo.startsWith("http") ? photo : `${getBaseUrl()}${photo}`
      );
    }
    if (doctorProfile.resumeUrl) {
      doctorProfile.resumeUrl = doctorProfile.resumeUrl.startsWith("http")
        ? doctorProfile.resumeUrl
        : `${getBaseUrl()}${doctorProfile.resumeUrl}`;
    }

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        declined: user.declined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      doctorProfile,
    });
  } catch {
    return res
      .status(401)
      .json({ message: "Invalid or expired token. Please login to continue" });
  }
}
