import dbConnect from "../../../lib/database";
import ConsentLog from "../../../models/ConsentLog";
import Consent from "../../../models/Consent";

export default async function handler(req, res) {
  await dbConnect();

  // POST: Log when a consent form is sent
  if (req.method === "POST") {
    try {
      const {
        consentFormId,
        consentFormName,
        patientId,
        patientName,
        appointmentId,
        clinicId,
        sentVia,
        sentBy,
      } = req.body;

      if (!consentFormId || !patientId) {
        return res.status(400).json({
          success: false,
          message: "consentFormId and patientId are required",
        });
      }

      // Validate that consent form exists
      const consentForm = await Consent.findById(consentFormId);
      if (!consentForm) {
        return res.status(404).json({
          success: false,
          message: "Consent form not found",
        });
      }

      // Create consent log
      const consentLog = await ConsentLog.create({
        consentFormId,
        consentFormName: consentFormName || consentForm.formName,
        patientId,
        patientName,
        appointmentId: appointmentId || null,
        clinicId: clinicId || null,
        sentVia: sentVia || "whatsapp",
        sentBy: sentBy || null,
        status: "sent",
      });

      return res.status(201).json({
        success: true,
        message: "Consent form sent logged successfully",
        logId: consentLog._id,
      });
    } catch (error) {
      console.error("Error logging consent form sent:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to log consent form sent",
      });
    }
  }

  // GET: Fetch consent logs for a patient/appointment
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

      // Fetch all consent logs
      const logs = await ConsentLog.find(query)
        .populate("consentFormId", "formName description")
        .sort({ createdAt: -1 })
        .lean();

      // Format response
      const consentLogs = logs.map((log) => ({
        _id: log._id,
        consentFormId: log.consentFormId?._id,
        consentFormName: log.consentFormName || log.consentFormId?.formName || "Unknown",
        description: log.consentFormId?.description || "",
        patientId: log.patientId,
        patientName: log.patientName,
        appointmentId: log.appointmentId,
        sentVia: log.sentVia,
        sentBy: log.sentBy,
        status: log.status,
        signedAt: log.signedAt,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      }));

      return res.status(200).json({
        success: true,
        consentLogs,
        total: consentLogs.length,
      });
    } catch (error) {
      console.error("Error fetching consent logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch consent logs",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
