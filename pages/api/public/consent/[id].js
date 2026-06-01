import dbConnect from "../../../../lib/database";
import Consent from "../../../../models/Consent";

export default async function handler(req, res) {
  await dbConnect();

  // GET: Fetch consent form by ID (public access for patients)
  if (req.method === "GET") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: "Consent ID is required" });
      }

      const consent = await Consent.findById(id).lean();

      if (!consent) {
        return res.status(404).json({ success: false, message: "Consent form not found" });
      }

      // Only return published forms
      if (consent.status !== "published") {
        return res.status(403).json({ success: false, message: "Consent form is not accessible" });
      }

      return res.status(200).json({
        success: true,
        consent: {
          _id: consent._id,
          formName: consent.formName,
          description: consent.description,
          language: consent.language,
          version: consent.version,
          enableDigitalSignature: consent.enableDigitalSignature,
          requireNameConfirmation: consent.requireNameConfirmation,
        },
      });
    } catch (error) {
      console.error("Error fetching public consent form:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch consent form" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
