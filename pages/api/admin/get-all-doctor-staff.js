import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    // ✅ Fetch all doctors and doctorStaff
    const doctors = await User.find({
      role: { $in: ["doctor", "doctorStaff"] },
      isApproved: true,
      declined: false,
    })
      .select("name email role clinicId") // Only return required fields
      .sort({ createdAt: -1 });

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ success: false, message: "No doctors found" });
    }

    return res.status(200).json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    // console.error("❌ Error fetching doctors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
