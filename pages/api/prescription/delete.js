import dbConnect from "../../../lib/database";
import PrescriptionRequest from "../../../models/PrescriptionRequest";
import Chat from "../../../models/Chat";  // import Chat model
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  try {
    const user = await getUserFromReq(req); // doctor auth
    if (!user || user.role !== "doctor") {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.query;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Prescription ID is required" });
    }

    // Ensure prescription belongs to this doctor
    const prescription = await PrescriptionRequest.findOne({
      _id: id,
      doctor: user._id,
    });
    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // ✅ Delete the prescription
    await PrescriptionRequest.deleteOne({ _id: id });

    // ✅ Also delete any chats linked to this prescription
    await Chat.deleteMany({ prescriptionRequest: id });

    return res.json({
      success: true,
      message: "Prescription and related chats deleted successfully",
    });
  } catch (err) {
    // console.error("Delete prescription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
