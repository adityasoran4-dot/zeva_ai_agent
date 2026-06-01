import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";
import DoctorTreatment from "../../../models/DoctorTreatment";
import {
  getStaffUser,
  formatDoctorTreatments,
  ensureUniqueTreatmentSlug,
  slugifyValue,
} from "../../../server/staff/doctorTreatmentService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  let user;
  try {
    user = await getStaffUser(req);
  } catch (error) {
    const status = error.status || 401;
    return res.status(status).json({ success: false, message: error.message });
  }

  const { treatmentName, subTreatments, price } = req.body || {};

  if (!treatmentName || !treatmentName.trim()) {
    return res.status(400).json({ success: false, message: "Treatment name is required" });
  }

  try {
    const treatmentSlug = await ensureUniqueTreatmentSlug(treatmentName);

    const normalizedSubs = Array.isArray(subTreatments)
      ? subTreatments
          .filter((sub) => sub?.name?.trim())
          .map((sub) => ({
            name: sub.name.trim(),
            slug: slugifyValue(sub.name),
            price: sub.price && !Number.isNaN(Number(sub.price)) ? Number(sub.price) : 0,
          }))
      : [];

    const treatmentDoc = await Treatment.create({
      name: treatmentName.trim(),
      slug: treatmentSlug,
      subcategories: normalizedSubs,
    });

    const payload = {
      doctorId: user._id,
      treatmentId: treatmentDoc._id,
      subcategoryIds: normalizedSubs.map((sub) => sub.slug),
    };

    if (price !== undefined && price !== null && price !== "") {
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, message: "Price must be a positive number" });
      }
      payload.price = parsedPrice;
    }

    await DoctorTreatment.create(payload);
    const treatments = await formatDoctorTreatments(user._id);

    return res.status(201).json({
      success: true,
      message: "Custom treatment created successfully",
      treatments,
    });
  } catch (error) {
    console.error("Error creating custom treatment:", error);
    return res.status(500).json({ success: false, message: "Failed to create treatment" });
  }
}


