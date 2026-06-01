import dbConnect from "../../../lib/database";
import PrescriptionRequest from "../../../models/PrescriptionRequest";
import DoctorProfile from "../../../models/DoctorProfile";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
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

    if (role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can view prescription requests" });
    }

    // Validate the doctor by ensuring a DoctorProfile exists for this user, same as getReviews
    const doctor = await DoctorProfile.findOne({ user: userId }).lean();
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const { status } = req.query;

    const query = { doctor: userId };
    if (
      status &&
      ["pending", "in_progress", "completed", "cancelled"].includes(status)
    ) {
      query.status = status;
    }

    const prescriptionRequests = await PrescriptionRequest.find(query)
      .populate("user", "name email phone")
      .populate("doctor", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: prescriptionRequests });
  } catch (error) {
    // console.error("Get prescription requests error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
