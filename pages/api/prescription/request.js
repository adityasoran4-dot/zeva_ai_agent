import dbConnect from "../../../lib/database";
import PrescriptionRequest from "../../../models/PrescriptionRequest";
import DoctorProfile from "../../../models/DoctorProfile";
import User from "../../../models/Users";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { role, userId } = decoded;

    if (role !== "user") {
      return res
        .status(403)
        .json({ message: "Only users can request prescriptions" });
    }

    const { doctorId, healthIssue, symptoms } = req.body;

    if (!doctorId || !healthIssue) {
      return res
        .status(400)
        .json({ message: "Doctor ID and health issue are required" });
    }

    // Resolve provided doctorId to the doctor's User _id
    let doctorUserId = null;

    // Try treating doctorId as DoctorProfile._id first (like in getReviews)
    const doctorProfile = await DoctorProfile.findById(doctorId).lean();
    if (doctorProfile && doctorProfile.user) {
      doctorUserId = String(doctorProfile.user);
    } else {
      // Fallback: treat doctorId as a User _id
      const doctorUser = await User.findById(doctorId).lean();
      if (doctorUser && doctorUser.role === "doctor") {
        doctorUserId = String(doctorUser._id);
      }
    }

    if (!doctorUserId) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if there's already a pending/in-progress request from this user to this doctor
    const existingRequest = await PrescriptionRequest.findOne({
      user: userId,
      doctor: doctorUserId,
      status: { $in: ["pending", "in_progress"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          "You already have a pending prescription request with this doctor",
      });
    }

    const prescriptionRequest = await PrescriptionRequest.create({
      user: userId,
      doctor: doctorUserId,
      healthIssue,
      symptoms: symptoms || "",
      status: "pending",
    });

    await prescriptionRequest.populate("user", "name email");
    await prescriptionRequest.populate("doctor", "name email");

    res.status(201).json({
      success: true,
      message: "Prescription request sent successfully",
      data: prescriptionRequest,
    });
  } catch (error) {
    // console.error("Prescription request error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
