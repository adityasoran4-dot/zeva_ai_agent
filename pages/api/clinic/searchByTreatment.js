import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

// Helper to get base URL
function getBaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_BASE_URL || "https://zeva360.com";
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { treatment } = req.query;

    if (!treatment || !treatment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Treatment parameter is required",
      });
    }

    const treatmentQuery = treatment.trim();
    const parenMatch = treatmentQuery.match(/^(.*?)\s*\((.*?)\)\s*$/);
    const isSubWithMain = !!parenMatch;
    const subNameFromQuery = isSubWithMain ? parenMatch[1].trim().toLowerCase() : null;
    const mainNameFromQuery = isSubWithMain ? parenMatch[2].trim().toLowerCase() : null;

    // Fetch all approved clinics with their treatments
    const clinics = await Clinic.find({ isApproved: true })
      .populate({
        path: "owner",
        model: User,
        select: "name email phone isApproved declined role",
      })
      .select(
        "name address location owner treatments pricing timings photos slug slugLocked servicesName listingVisibility"
      )
      .lean();

    // Filter only registered and available clinics
    // Show clinics that are approved, only filter out if owner is declined or doesn't exist
    const availableClinics = clinics.filter(
      (clinic) => {
        // Clinic must be approved (already filtered in query)
        // Owner must exist and not be declined
        // Don't require owner.isApproved === true, just check they're not declined
        if (!clinic.owner) {
          return false; // No owner = exclude
        }
        if (clinic.owner.declined === true) {
          return false; // Owner declined = exclude
        }
        if (clinic.owner.role !== "clinic") {
          return false; // Wrong role = exclude
        }
        // Include clinic if owner exists, not declined, and has clinic role
        return true;
      }
    );

    // Filter clinics that have the specified treatment enabled
    const matchingClinics = availableClinics.filter((clinic) => {
      if (!Array.isArray(clinic.treatments)) return false;
      const tq = treatmentQuery.toLowerCase().trim();
      return clinic.treatments.some((t) => {
        const mainEnabled = t?.enabled !== false;
        const mainName = (t?.mainTreatment || "").trim().toLowerCase();
        const subs = Array.isArray(t?.subTreatments) ? t.subTreatments : [];

        // Case 1: Exact main match
        if (mainEnabled && mainName === tq) return true;

        // Case 2: Sub with explicit "(Main)"
        if (isSubWithMain) {
          if (!mainEnabled || mainName !== mainNameFromQuery) return false;
          return subs.some((st) => {
            const subEnabled = st?.enabled !== false;
            const subName = (st?.name || "").trim().toLowerCase();
            return subEnabled && subName === subNameFromQuery;
          });
        }

        // Case 3: Query is "Sub Main" (no parentheses)
        if (mainEnabled && tq.includes(mainName)) {
          const remainder = tq.replace(mainName, "").trim();
          if (!remainder) return true; // treat as main-only
          return subs.some((st) => {
            const subEnabled = st?.enabled !== false;
            const subName = (st?.name || "").trim().toLowerCase();
            return (
              subEnabled &&
              (subName === remainder ||
                remainder.includes(subName) ||
                subName.includes(remainder))
            );
          });
        }

        // Case 4: Query contains sub name somewhere (tolerant match)
        return subs.some((st) => {
          const subEnabled = st?.enabled !== false;
          const subName = (st?.name || "").trim().toLowerCase();
          return (
            subEnabled &&
            (subName === tq ||
              tq.includes(subName) ||
              subName.includes(tq))
          );
        });
      });
    });

    // Process clinics to format photos
    const formattedClinics = matchingClinics.map((clinic) => {
      const owner = clinic.owner || {};
      
      // Process photos array
      const photos = (clinic.photos || [])
        .map((photo) => {
          if (!photo) return null;
          if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo;
          }
          if (photo.startsWith("/uploads/")) {
            return `${getBaseUrl()}${photo}`;
          }
          if (photo.includes("uploads/clinic/")) {
            const uploadsIndex = photo.indexOf("uploads/clinic/");
            const relativePath = "/" + photo.substring(uploadsIndex);
            return `${getBaseUrl()}${relativePath}`;
          }
          return `${getBaseUrl()}/uploads/clinic/${photo}`;
        })
        .filter(Boolean);

      return {
        ...clinic,
        owner: {
          ...owner,
        },
        photos,
      };
    });

    return res.status(200).json({
      success: true,
      clinics: formattedClinics,
      count: formattedClinics.length,
      treatment: treatmentQuery,
    });
  } catch (error) {
    console.error("Error searching clinics by treatment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search clinics",
      error: error.message,
    });
  }
}

