import Clinic from "../../../models/Clinic";
import Treatment from "../../../models/Treatment";
import dbConnect from "../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { treatments, otherTreatment, clinicId } = req.body;

  try {
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) return res.status(404).json({ message: "Clinic not found" });

    // Check main treatments (ignore "other")
    for (let t of treatments) {
      if (t.slug === "other") continue; // skip "other"
      const exists = await Treatment.findOne({ slug: t.slug });
      if (!exists) {
        return res
          .status(400)
          .json({ message: `Main treatment '${t.name}' not found` });
      }
    }

    // Add main treatments (ignore "other")
    clinic.treatments.push(
      ...treatments
        .filter((t) => t.slug !== "other")
        .map((t) => ({
          mainTreatmentSlug: t.slug,
          mainTreatmentName: t.name,
          subTreatments: [], // empty by default
        }))
    );

    // Add multiple "other" treatments
    if (Array.isArray(otherTreatment) && otherTreatment.length > 0) {
      otherTreatment.forEach((ot) => {
        if (!ot.trim()) return; // skip empty strings
        clinic.treatments.push({
          mainTreatmentSlug: "other",
          mainTreatmentName: ot.trim(),
          subTreatments: [],
        });
      });
    }

    await clinic.save();
    return res
      .status(200)
      .json({ message: "Treatments added successfully", clinic });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add treatments" });
  }
}
