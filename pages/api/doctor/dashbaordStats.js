import dbConnect from "../../../lib/database";
import DoctorProfile from "../../../models/DoctorProfile";
import Review from "../../../models/Review"; // assuming you have this model
import Enquiry from "../../../models/Enquiry"; // assuming you have this model
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doctorUserId = decoded.userId;

    // Get DoctorProfile
    const doctorProfile = await DoctorProfile.findOne({ user: doctorUserId });
    if (!doctorProfile) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const doctorId = doctorProfile._id;

    // Count related reviews
   const totalReviews = await Review.countDocuments({ doctorId: doctorId }); // ✅ correct


    // Count related enquiries
    const totalEnquiries = await Enquiry.countDocuments({ doctorId: doctorId });

    return res.status(200).json({
      success: true,
      totalReviews,
      totalEnquiries,
    });
  } catch (error) {
    // console.error("Doctor analytics error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
}
