import dbConnect from "../../../lib/database";
import Review from "../../../models/Review";
import Clinic from "../../../models/Clinic";
import DoctorProfile from "../../../models/DoctorProfile";
import User from "../../../models/Users";

// Keep image URLs consistent with `/clinic/findclinic` normalization
const normalizeImageUrl = (imagePath) => {
  if (!imagePath) return "";

  // Normalize slashes first (Windows paths)
  imagePath = String(imagePath).replace(/\\/g, "/");

  // Handle malformed URLs like "http://localhost:3000C:/Users/..."
  if (imagePath.includes("localhost") && /[A-Za-z]:/.test(imagePath)) {
    const driveMatch = imagePath.match(/([A-Za-z]:.*)/);
    if (driveMatch) imagePath = driveMatch[1];
  }

  // If it's already a relative path, just clean double slashes
  if (imagePath.startsWith("/")) {
    return imagePath.replace(/\/+/g, "/");
  }

  // If it's already a full URL, return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Windows absolute path => extract "/uploads/..." if present
  if (/^[A-Za-z]:/.test(imagePath)) {
    const uploadsIndex = imagePath.indexOf("/uploads/");
    if (uploadsIndex !== -1) {
      return imagePath.substring(uploadsIndex).replace(/\/+/g, "/");
    }
    const zevaIndex = imagePath.indexOf("ZEVA/");
    if (zevaIndex !== -1) {
      const afterZeva = imagePath.substring(zevaIndex + 5);
      const uploadsInAfter = afterZeva.indexOf("/uploads/");
      if (uploadsInAfter !== -1) {
        return afterZeva.substring(uploadsInAfter).replace(/\/+/g, "/");
      }
    }
  }

  // Otherwise ensure leading slash
  const cleaned = imagePath.replace(/\/+/g, "/");
  return "/" + cleaned.replace(/^\//, "");
};

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

const toArrayUnique = (arr) => Array.from(new Set((arr || []).filter(Boolean)));

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const tab = String(req.query.tab || "all"); // all | clinics | doctors
  const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
  const pageSize = Math.min(parseInt(req.query.pageSize || req.query.limit || "8", 10) || 8, 24);
  const skip = (page - 1) * pageSize;

  try {
    // ---------- Clinics: ALL approved clinics (include 0 reviews), computed ratings ----------
    let clinics = [];
    let clinicsTotal = 0;
    if (tab === "all" || tab === "clinics") {
      try {
        const clinicBaseMatch = { isApproved: true, declined: { $ne: true } };

        // For Top Rated Clinics, exclude 0-review clinics
        const clinicsRequireReviews = tab === "clinics";

        const clinicAgg = await Clinic.aggregate([
          { $match: clinicBaseMatch },
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "clinicId",
              as: "reviews",
            },
          },
          {
            $addFields: {
              totalReviews: { $size: "$reviews" },
              averageRating: {
                $cond: [
                  { $gt: [{ $size: "$reviews" }, 0] },
                  { $avg: "$reviews.rating" },
                  0,
                ],
              },
            },
          },
          ...(clinicsRequireReviews ? [{ $match: { totalReviews: { $gt: 0 } } }] : []),
          {
            $sort: {
              // User requirement for Top Rated Clinics: prioritize review count first
              totalReviews: -1,
              averageRating: -1,
            },
          },
          { $skip: skip },
          { $limit: pageSize },
          {
            $project: {
              name: 1,
              address: 1,
              pricing: 1,
              photos: 1,
              servicesName: 1,
              treatments: 1,
              averageRating: 1,
              totalReviews: 1,
            },
          },
        ]);

        // Compute totals for pagination
        if (clinicsRequireReviews) {
          const clinicCountAgg = await Clinic.aggregate([
            { $match: clinicBaseMatch },
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "clinicId",
                as: "reviews",
              },
            },
            { $addFields: { totalReviews: { $size: "$reviews" } } },
            { $match: { totalReviews: { $gt: 0 } } },
            { $count: "count" },
          ]);
          clinicsTotal = clinicCountAgg?.[0]?.count || 0;
        } else {
          clinicsTotal = await Clinic.countDocuments(clinicBaseMatch);
        }

        clinics = clinicAgg.map((c) => {
          const mainTreatments = (c.treatments || []).map((t) => t?.mainTreatment).filter(Boolean);
          const tags = toArrayUnique([...(c.servicesName || []), ...mainTreatments]).slice(0, 3);
          // Get the last photo (most recently uploaded profile picture) instead of first
          const photosArray = c.photos || [];
          const latestPhoto = photosArray.length > 0 ? photosArray[photosArray.length - 1] : null;
          return {
            type: "clinic",
            _id: String(c._id),
            name: c.name || "Clinic",
            address: c.address || "",
            image: normalizeImageUrl(latestPhoto),
            photos: photosArray.map(normalizeImageUrl),
            startingFrom: c.pricing ? `AED ${c.pricing}` : "",
            averageRating: round1(c.averageRating),
            totalReviews: c.totalReviews || 0,
            tags,
          };
        });
      } catch (clinicError) {
        // console.error("Error fetching clinics:", clinicError);
        clinics = [];
        clinicsTotal = 0;
      }
    }

    // ---------- Doctors: approved doctors only, computed ratings; exclude 0 reviews ----------
    let doctors = [];
    let doctorsTotal = 0;
    if (tab === "all" || tab === "doctors") {
      try {
        const doctorsRequireReviews = tab === "doctors";

        // Base: DoctorProfile joined with User approval flags
        const doctorAgg = await DoctorProfile.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          { $match: { "user.role": "doctor", "user.isApproved": true, "user.declined": { $ne: true } } },
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "doctorId",
              as: "reviews",
            },
          },
          {
            $addFields: {
              totalReviews: { $size: "$reviews" },
              averageRating: {
                $cond: [
                  { $gt: [{ $size: "$reviews" }, 0] },
                  { $avg: "$reviews.rating" },
                  0,
                ],
              },
            },
          },
          ...(doctorsRequireReviews ? [{ $match: { totalReviews: { $gt: 0 } } }] : []),
          { $sort: { totalReviews: -1, averageRating: -1 } },
          { $skip: skip },
          { $limit: pageSize },
          {
            $project: {
              degree: 1,
              address: 1,
              consultationFee: 1,
              photos: 1,
              treatments: 1,
              name: "$user.name",
              averageRating: 1,
              totalReviews: 1,
              slug: 1,
              slugLocked: 1,
            },
          },
        ]);

        // total count for pagination
        const doctorCountAgg = await DoctorProfile.aggregate([
          {
            $lookup: {
              from: "users",
              localField: "user",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          { $match: { "user.role": "doctor", "user.isApproved": true, "user.declined": { $ne: true } } },
          {
            $lookup: {
              from: "reviews",
              localField: "_id",
              foreignField: "doctorId",
              as: "reviews",
            },
          },
          { $addFields: { totalReviews: { $size: "$reviews" } } },
          ...(doctorsRequireReviews ? [{ $match: { totalReviews: { $gt: 0 } } }] : []),
          { $count: "count" },
        ]);
        doctorsTotal = doctorCountAgg?.[0]?.count || 0;

        doctors = doctorAgg.map((d) => {
          const mainTreatments = (d.treatments || []).map((t) => t?.mainTreatment).filter(Boolean);
          const tags = toArrayUnique([d.degree, ...mainTreatments]).slice(0, 3);
          // Get the last photo (most recently uploaded profile picture) instead of first
          const photosArray = d.photos || [];
          const latestPhoto = photosArray.length > 0 ? photosArray[photosArray.length - 1] : null;
          return {
            type: "doctor",
            _id: String(d._id),
            name: d.name || "Doctor",
            address: d.address || "",
            image: normalizeImageUrl(latestPhoto),
            startingFrom: typeof d.consultationFee === "number" ? `AED ${d.consultationFee}` : "",
            averageRating: round1(d.averageRating),
            totalReviews: d.totalReviews || 0,
            tags,
            slug: d.slug || null,
            slugLocked: d.slugLocked || false,
          };
        });
      } catch (doctorError) {
        // console.error("Error fetching doctors:", doctorError);
        doctors = [];
        doctorsTotal = 0;
      }
    }

    // Calculate hasNext properly based on current tab
    let clinicsHasNext = false;
    let doctorsHasNext = false;
    
    if (tab === "all" || tab === "clinics") {
      clinicsHasNext = skip + clinics.length < clinicsTotal;
    }
    
    if (tab === "all" || tab === "doctors") {
      doctorsHasNext = skip + doctors.length < doctorsTotal;
    }

    return res.status(200).json({
      success: true,
      data: {
        clinics,
        doctors,
        pagination: {
          page,
          pageSize,
          clinicsTotal,
          doctorsTotal,
          clinicsHasNext,
          doctorsHasNext,
        },
      },
    });
  } catch (error) {
   
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


