import dbConnect from "../../../lib/database";
import ConsentSignature from "../../../models/ConsentSignature";
import Consent from "../../../models/Consent";

export default async function handler(req, res) {
  await dbConnect();

  // GET: Fetch consent form status for a patient/appointment
  if (req.method === "GET") {
    try {
      const { patientId, appointmentId } = req.query;

      if (!patientId && !appointmentId) {
        return res.status(400).json({
          success: false,
          message: "Either patientId or appointmentId is required",
        });
      }

      // Build query
      const query = {};
      if (patientId) query.patientId = patientId;
      if (appointmentId) query.appointmentId = appointmentId;

      // Fetch all signed consents
      const signatures = await ConsentSignature.find(query)
        .populate("consentFormId", "formName description")
        .sort({ createdAt: -1 })
        .lean();

      // Format response
      const consentStatuses = signatures.map((sig) => ({
        _id: sig._id,
        consentFormId: sig.consentFormId?._id,
        consentFormName: sig.consentFormId?.formName || "Unknown",
        description: sig.consentFormId?.description || "",
        patientName: sig.patientName,
        date: sig.date,
        hasSignature: !!sig.signature,
        status: sig.status || "pending",
        signedAt: sig.createdAt,
      }));

      return res.status(200).json({
        success: true,
        consentStatuses,
        total: consentStatuses.length,
      });
    } catch (error) {
      console.error("Error fetching consent statuses:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch consent statuses",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
