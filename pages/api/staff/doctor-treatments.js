import dbConnect from "../../../lib/database";
import DoctorTreatment from "../../../models/DoctorTreatment";
import Treatment from "../../../models/Treatment";
import { getStaffUser, formatDoctorTreatments } from "../../../server/staff/doctorTreatmentService";

export default async function handler(req, res) {
  await dbConnect();

  let user;
  try {
    user = await getStaffUser(req);
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({ success: false, message: error.message });
  }

  if (req.method === "GET") {
    try {
      const treatments = await formatDoctorTreatments(user._id);
      return res.status(200).json({ success: true, treatments });
    } catch (error) {
      console.error("Error fetching doctor treatments:", error);
      return res.status(500).json({ success: false, message: "Failed to load treatments" });
    }
  }

  if (req.method === "POST") {
    const { treatmentId, subcategoryIds, price } = req.body;

    if (!treatmentId) {
      return res.status(400).json({ success: false, message: "treatmentId is required" });
    }

    try {
      const treatmentExists = await Treatment.findById(treatmentId).lean();
      if (!treatmentExists) {
        return res.status(404).json({ success: false, message: "Treatment not found" });
      }

      const payload = {
        doctorId: user._id,
        treatmentId,
        subcategoryIds: Array.isArray(subcategoryIds)
          ? subcategoryIds.filter(Boolean)
          : [],
      };

      if (price !== undefined && price !== null && price !== "") {
        const parsedPrice = Number(price);
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ success: false, message: "Price must be a positive number" });
        }
        payload.price = parsedPrice;
      }

      await DoctorTreatment.findOneAndUpdate(
        { doctorId: user._id, treatmentId },
        payload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const treatments = await formatDoctorTreatments(user._id);

      return res.status(201).json({
        success: true,
        message: "Treatment saved successfully",
        treatments,
      });
    } catch (error) {
      console.error("Error saving doctor treatment:", error);
      return res.status(500).json({ success: false, message: "Failed to save treatment" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ success: false, message: "Method not allowed" });
}


