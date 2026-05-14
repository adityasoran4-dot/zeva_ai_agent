import dbConnect from "../../../../lib/database";
import Users from "../../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { doctorId } = req.query;

  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: "doctorId is required",
    });
  }

  try {
    // Find the doctor user
    const doctor = await Users.findById(doctorId)
      .select("name phone email gender age dateOfBirth role")
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check if user has doctor role
    if (doctor.role !== "doctorStaff") {
      return res.status(400).json({
        success: false,
        message: "User is not a doctor",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor details retrieved successfully",
      data: doctor,
    });
  } catch (err) {
    console.error("Error fetching doctor details:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
