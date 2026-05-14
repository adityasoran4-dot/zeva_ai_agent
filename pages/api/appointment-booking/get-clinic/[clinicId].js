import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { clinicId } = req.query;

  if (!clinicId) {
    return res.status(400).json({
      success: false,
      message: "clinicId is required",
    });
  }

  try {
    // Find the doctor user
    const clinic = await Clinic.findById(clinicId)
      .select(
        "name address photos email phone whatsapp website timings tagline currency",
      )
      .lean();

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Clinic details retrieved successfully",
      data: clinic,
    });
  } catch (err) {
    console.error("Error fetching clinic details:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
