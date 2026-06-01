import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Treatment from "../../../models/Treatment";
import DoctorTreatment from "../../../models/DoctorTreatment";
import User from "../../../models/Users";
import { getUserFromReq } from "../lead-ms/auth";
import {
  formatDoctorTreatments,
  ensureUniqueTreatmentSlug,
  slugifyValue,
} from "../../../server/staff/doctorTreatmentService";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has access (clinic, agent, doctorStaff, staff)
    if (!["clinic", "agent", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { treatmentName, subTreatments, doctorStaffId } = req.body;

    if (!treatmentName || !treatmentName.trim()) {
      return res.status(400).json({ success: false, message: "Treatment name is required" });
    }

    // Find the clinic
    let clinic;
    if (clinicUser.role === "clinic") {
      clinic = await Clinic.findOne({ owner: clinicUser._id });
    } else if (["agent", "doctorStaff", "staff"].includes(clinicUser.role)) {
      if (!clinicUser.clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
      clinic = await Clinic.findById(clinicUser.clinicId);
    }

    if (!clinic) {
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    const treatmentNameTrimmed = treatmentName.trim();
    const treatmentSlug = treatmentNameTrimmed.toLowerCase().replace(/\s+/g, "-");

    // Prepare subTreatments with slugs
    const preparedSubTreatments = (subTreatments || []).map((sub) => ({
      name: sub.name.trim(),
      slug: sub.name.trim().toLowerCase().replace(/\s+/g, "-"),
      price: sub.price || 0,
    }));

    // 1. Add to Treatment model (if doesn't exist, create it; if exists, update subcategories)
    let treatmentDoc = await Treatment.findOne({ name: treatmentNameTrimmed });
    
    if (!treatmentDoc) {
      // Create new treatment in Treatment model
      treatmentDoc = await Treatment.create({
        name: treatmentNameTrimmed,
        slug: treatmentSlug,
        subcategories: preparedSubTreatments.map((sub) => ({
          name: sub.name,
          slug: sub.slug,
          price: sub.price,
        })),
      });
    } else {
      // Treatment exists - add new subcategories if they don't exist
      const existingSubSlugs = treatmentDoc.subcategories.map((sub) => sub.slug);
      const newSubcategories = preparedSubTreatments
        .filter((sub) => !existingSubSlugs.includes(sub.slug))
        .map((sub) => ({
          name: sub.name,
          slug: sub.slug,
          price: sub.price,
        }));

      if (newSubcategories.length > 0) {
        treatmentDoc.subcategories.push(...newSubcategories);
        await treatmentDoc.save();
      }
    }

    // 2. Add to Clinic model treatments array
    const existingClinicTreatment = clinic.treatments.find(
      (t) => t.mainTreatment === treatmentNameTrimmed || t.mainTreatmentSlug === treatmentSlug
    );

    if (!existingClinicTreatment) {
      // Add new treatment to clinic
      clinic.treatments.push({
        mainTreatment: treatmentNameTrimmed,
        mainTreatmentSlug: treatmentSlug,
        subTreatments: preparedSubTreatments,
      });
      await clinic.save();
    } else {
      // Treatment exists in clinic - merge subTreatments
      const existingSubSlugs = existingClinicTreatment.subTreatments.map((sub) => sub.slug);
      const newSubTreatments = preparedSubTreatments.filter(
        (sub) => !existingSubSlugs.includes(sub.slug)
      );

      if (newSubTreatments.length > 0) {
        existingClinicTreatment.subTreatments.push(...newSubTreatments);
        await clinic.save();
      }
    }

    // 3. Also assign to doctor if doctorStaffId is provided
    let doctorTreatments = [];
    if (doctorStaffId) {
      try {
        // Find the doctor staff user
        const targetDoctorStaff = await User.findById(doctorStaffId);
        if (!targetDoctorStaff) {
          return res.status(404).json({ success: false, message: "Doctor staff not found" });
        }

        // Verify access (clinic is already found above)
        const clinicId = clinic._id;
        if (targetDoctorStaff.clinicId?.toString() !== clinicId?.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Get subcategory IDs (slugs)
        const subcategoryIds = preparedSubTreatments.map((sub) => sub.slug);

        // Find or create doctor treatment assignment
        let doctorTreatment = await DoctorTreatment.findOne({
          doctorId: doctorStaffId,
          treatmentId: treatmentDoc._id,
        });

        if (doctorTreatment) {
          // Update existing assignment
          doctorTreatment.subcategoryIds = subcategoryIds;
          await doctorTreatment.save();
        } else {
          // Create new assignment
          doctorTreatment = await DoctorTreatment.create({
            doctorId: doctorStaffId,
            treatmentId: treatmentDoc._id,
            subcategoryIds: subcategoryIds,
          });
        }

        // Fetch all treatments for this doctor using formatDoctorTreatments
        doctorTreatments = await formatDoctorTreatments(doctorStaffId);
      } catch (error) {
        console.error("Error assigning treatment to doctor:", error);
        // Continue even if doctor assignment fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Treatment added to clinic and treatment database successfully",
      treatment: {
        _id: treatmentDoc._id,
        name: treatmentDoc.name,
        slug: treatmentDoc.slug,
      },
      treatments: Array.isArray(doctorTreatments) ? doctorTreatments : [], // Ensure it's always an array
    });
  } catch (error) {
    console.error("Error adding clinic treatment:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add treatment",
    });
  }
}

