import dbConnect from "../../../../lib/database";
import Prescription from "../../../../models/Prescription";

export default async function handler(req, res) {
  await dbConnect();

  // GET: Fetch prescription by ID (public access for patients)
  if (req.method === "GET") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: "Prescription ID is required" });
      }

      const prescription = await Prescription.findById(id)
        .populate("patientId", "firstName lastName mobileNumber")
        .populate("doctorId", "name")
        .lean();

      if (!prescription) {
        return res.status(404).json({ success: false, message: "Prescription not found" });
      }

      // Only return prescriptions with PDF URL
      if (!prescription.pdfUrl) {
        return res.status(403).json({ success: false, message: "Prescription PDF not available" });
      }

      return res.status(200).json({
        success: true,
        prescription: {
          _id: prescription._id,
          patientName: prescription.patientId 
            ? `${prescription.patientId.firstName || ""} ${prescription.patientId.lastName || ""}`.trim()
            : "Unknown Patient",
          doctorName: prescription.doctorId?.name || "Unknown Doctor",
          medicines: prescription.medicines,
          aftercareInstructions: prescription.aftercareInstructions,
          pdfUrl: prescription.pdfUrl,
          createdAt: prescription.createdAt,
        },
      });
    } catch (error) {
      console.error("Error fetching public prescription:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch prescription" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
