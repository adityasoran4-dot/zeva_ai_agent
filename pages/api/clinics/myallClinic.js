import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import jwt from "jsonwebtoken";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Allow clinic, admin, agent, doctor, doctorStaff, and staff roles
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Resolve clinicId correctly
    let clinicId;
    let clinic = null;
    
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id }).select("_id");
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    } else if (me.role === "admin") {
      // Admin users need to provide clinicId in query or use their own clinic if linked
      // For now, if admin has clinicId, use it; otherwise return error
      if (me.clinicId) {
        clinicId = me.clinicId;
      } else {
        // Admin without clinicId - try to find any clinic (fallback)
        // In practice, admin should have clinicId or query param
        return res.status(400).json({ success: false, message: "Admin must be linked to a clinic or provide clinicId" });
      }
    } else if (["agent", "doctor", "doctorStaff", "staff"].includes(me.role)) {
      // For agent, doctor, doctorStaff, and staff, use their clinicId
      if (!me.clinicId) {
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      }
      clinicId = me.clinicId;
    }

    // ✅ Check permission for reading clinic (only for agent, doctorStaff roles)
    // Clinic, doctor, and staff roles have full access by default, admin bypasses
    if (me.role !== "admin" && clinicId && ["agent", "doctorStaff"].includes(me.role)) {
      const { checkAgentPermission } = await import("../agent/permissions-helper");
      const result = await checkAgentPermission(
        me._id,
        "clinic_health_center",
        "read"
      );

      if (!result.hasPermission) {
        return res.status(403).json({
          success: false,
          message: result.error || "You do not have permission to view clinic information"
        });
      }
    }

    // Fetch clinic data
    if (!clinic) {
      if (me.role === "clinic") {
        clinic = await Clinic.findOne({ owner: me._id }).lean();
      } else if (clinicId) {
        clinic = await Clinic.findById(clinicId).lean();
      } else {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
    } else {
      clinic = await Clinic.findById(clinic._id).lean();
    }

    // ✅ Log result of DB query
    console.log("🏥 Clinic found:", clinic);

    if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found" });

    // Helper to get base URL
    function getBaseUrl() {
      if (process.env.NODE_ENV === "production") {
        return "https://zeva360.com";
      }
      return process.env.NEXT_PUBLIC_BASE_URL ;
    }

    // Ensure photos are absolute URLs
    if (clinic.photos && Array.isArray(clinic.photos)) {
      clinic.photos = clinic.photos.map((photo) =>
        photo.startsWith("http") ? photo : `${getBaseUrl()}${photo}`
      );
    }
    // Ensure documents URLs are absolute
    if (clinic.documents && Array.isArray(clinic.documents)) {
      clinic.documents = clinic.documents.map((doc) => {
        if (!doc?.url) return doc;
        const url = doc.url;
        if (url.startsWith("http")) return doc;
        return { ...doc, url: `${getBaseUrl()}${url}` };
      });
    }
    if (clinic.licenseDocumentUrl) {
      clinic.licenseDocumentUrl = clinic.licenseDocumentUrl.startsWith("http")
        ? clinic.licenseDocumentUrl
        : `${getBaseUrl()}${clinic.licenseDocumentUrl}`;
    }

    // Transform treatments to include main treatments with their sub-treatments
    if (clinic.treatments && Array.isArray(clinic.treatments)) {
      clinic.treatments = clinic.treatments.map((treatment) => ({
        mainTreatment: treatment.mainTreatment,
        mainTreatmentSlug: treatment.mainTreatmentSlug,
        enabled: treatment.enabled !== false, // preserve enabled flag
        subTreatments: (treatment.subTreatments || []).map((sub) => ({
          name: sub.name,
          slug: sub.slug,
          price: sub.price || 0,
          enabled: sub.enabled !== false, // preserve sub enabled flag
        })),
      }));
    }

    return res.status(200).json({ success: true, clinic });
  } catch (err) {
    console.error("❌ Error in myallClinic API:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
