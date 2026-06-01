import DoctorTreatment from "../../models/DoctorTreatment";
import Treatment from "../../models/Treatment";
import Department from "../../models/Department";
import { getAuthorizedStaffUser } from "./authHelpers";

export async function getStaffUser(req, options = {}) {
  return getAuthorizedStaffUser(req, {
    allowedRoles: options.allowedRoles || ["doctor", "clinic", "doctorStaff", "staff", "agent", "admin"],
    requireActiveFor: options.requireActiveFor || ["doctor", "doctorStaff"],
  });
}

export async function formatDoctorTreatments(doctorId) {
  const docs = await DoctorTreatment.find({ doctorId })
    .populate("treatmentId", "name subcategories")
    .populate("department", "name")
    .sort({ createdAt: -1 })
    .lean();

  return docs.map((doc) => {
    const allSubcategories = doc.treatmentId?.subcategories || [];
    const selectedSubcategoryIds = doc.subcategoryIds || [];
    
    // Filter subcategories based on selected subcategoryIds and include prices
    const filteredSubcategories = allSubcategories.filter((sub) =>
      selectedSubcategoryIds.includes(sub.slug || sub.name)
    );

    return {
      _id: doc._id.toString(),
      treatmentId: doc.treatmentId?._id || doc.treatmentId,
      treatmentName: doc.treatmentId?.name || "Unknown treatment",
      subcategoryIds: selectedSubcategoryIds,
      subcategories: filteredSubcategories.map((sub) => ({
        name: sub.name,
        slug: sub.slug || sub.name,
        price: sub.price || null,
      })),
      price: doc.price ?? null,
      department: doc.department?._id?.toString() || null,
      departmentName: doc.department?.name || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  });
}

export function slugifyValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || `treatment-${Date.now()}`;
}

export async function ensureUniqueTreatmentSlug(name) {
  const baseSlug = slugifyValue(name);
  let slug = baseSlug;
  let counter = 1;
  while (await Treatment.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}


