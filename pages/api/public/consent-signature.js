import dbConnect from "../../../lib/database";
import ConsentSignature from "../../../models/ConsentSignature";
import Consent from "../../../models/Consent";
import PatientRegistration from "../../../models/PatientRegistration";

export default async function handler(req, res) {
  await dbConnect();

  // POST: Submit consent signature
  if (req.method === "POST") {
    try {
      const {
        consentFormId,
        patientId,
        patientName,
        patientFirstName,
        patientLastName,
        date,
        signature,
        nameConfirmed,
        agreedToTerms,
        questionsAnswered,
        understandResults,
        ipAddress,
        userAgent,
        appointmentId,
      } = req.body;

      if (!consentFormId || !patientName || !date) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      // Validate that consent form exists and is published
      const consentForm = await Consent.findById(consentFormId);
      if (!consentForm || consentForm.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Consent form not found or not published",
        });
      }

      // Try to find patient by name if patientId not provided
      let resolvedPatientId = patientId;
      if (!resolvedPatientId && (patientFirstName || patientLastName)) {
        const query = {};
        if (patientFirstName) query.firstName = patientFirstName;
        if (patientLastName) query.lastName = patientLastName;
        
        const patient = await PatientRegistration.findOne(query);
        if (patient) {
          resolvedPatientId = patient._id;
        }
      }

      // Create consent signature record
      const consentSignature = await ConsentSignature.create({
        consentFormId,
        patientId: resolvedPatientId,
        patientName,
        patientFirstName: patientFirstName || "",
        patientLastName: patientLastName || "",
        date,
        signature: signature || "",
        nameConfirmed: nameConfirmed || "",
        agreedToTerms: agreedToTerms || false,
        questionsAnswered: questionsAnswered || false,
        understandResults: understandResults || false,
        ipAddress: ipAddress || "",
        userAgent: userAgent || "",
        clinicId: consentForm.clinicId,
        appointmentId: appointmentId || null,
        status: "signed",
      });

      return res.status(201).json({
        success: true,
        message: "Consent submitted successfully",
        signatureId: consentSignature._id,
      });
    } catch (error) {
      console.error("Error submitting consent signature:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to submit consent signature",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
