import dbConnect from "../../../lib/database";
import ConsentSignature from "../../../models/ConsentSignature";

export default async function handler(req, res) {
  await dbConnect();

  // GET: Fetch existing signature for a consent form and patient
  if (req.method === "GET") {
    try {
      const { consentFormId, patientName } = req.query;

      if (!consentFormId || !patientName) {
        return res.status(400).json({
          success: false,
          message: "consentFormId and patientName are required",
        });
      }

      // Find existing signature
      const existingSignature = await ConsentSignature.findOne({
        consentFormId,
        patientName,
        status: "signed",
      })
        .sort({ createdAt: -1 })
        .lean();

      if (existingSignature) {
        return res.status(200).json({
          success: true,
          signature: {
            _id: existingSignature._id,
            signature: existingSignature.signature,
            date: existingSignature.date,
            nameConfirmed: existingSignature.nameConfirmed,
            agreedToTerms: existingSignature.agreedToTerms,
            questionsAnswered: existingSignature.questionsAnswered,
            understandResults: existingSignature.understandResults,
          },
        });
      } else {
        return res.status(200).json({
          success: true,
          signature: null,
        });
      }
    } catch (error) {
      console.error("Error fetching existing signature:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch existing signature",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
