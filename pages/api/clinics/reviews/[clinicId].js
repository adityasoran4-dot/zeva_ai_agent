// pages/api/clinics/reviews/[clinicId].js
import dbConnect from "../../../../lib/database";
import Review from "../../../../models/Review";
import User from "../../../../models/Users";
import { getUserFromReq } from "../../lead-ms/auth";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { clinicId } = req.query;

  if (!clinicId) {
    return res.status(400).json({ message: "Clinic ID is required" });
  }

  try {
    // Optional: Verify user has access to this clinic (if authenticated)
    let authUser = null;
    try {
      authUser = await getUserFromReq(req);
    } catch (authError) {
      // If authentication fails, allow unauthenticated access (public reviews)
      console.log("Auth check failed, allowing public access:", authError.message);
    }
    
    if (authUser) {
      // If user is authenticated, verify they have access to this clinic
      const { clinicId: userClinicId, error, isAdmin } = await getClinicIdFromUser(authUser);
      
      // Verify clinic access
      if (authUser.role === "clinic") {
        try {
          const Clinic = (await import("../../../../models/Clinic")).default;
          const clinic = await Clinic.findOne({ owner: authUser._id }).select("_id");
          if (clinic && clinic._id.toString() !== clinicId.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
          }
        } catch (clinicError) {
          console.error("Error checking clinic access:", clinicError);
          // Allow access if clinic check fails (fallback)
        }
      } else if (["agent", "doctor", "doctorStaff", "staff"].includes(authUser.role)) {
        if (!userClinicId || userClinicId.toString() !== clinicId.toString()) {
          return res.status(403).json({ success: false, message: "Access denied" });
        }
      }
      // Admin and unauthenticated users can access any clinic's reviews

      // ✅ Check permission for reading clinic reviews (only for agent, doctorStaff roles)
      // Clinic, doctor, and staff roles have full access by default, admin bypasses
      if (!isAdmin && userClinicId && userClinicId.toString() === clinicId.toString() && ["agent", "doctorStaff"].includes(authUser.role)) {
        const { checkAgentPermission } = await import("../../agent/permissions-helper");
        const result = await checkAgentPermission(
          authUser._id,
          "clinic_health_center",
          "read"
        );

        if (!result.hasPermission) {
          return res.status(403).json({
            success: false,
            message: result.error || "You do not have permission to view clinic reviews"
          });
        }
      }
    }
    // Fetch all reviews for the clinic
    const allReviews = await Review.find({ clinicId })
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "name",
        model: User,
      })
      .lean();

    // Filter duplicates: Keep only the most recent review per user
    const uniqueReviewsMap = new Map();
    allReviews.forEach(review => {
      const userId = review.userId?._id?.toString() || review.userId?.toString();
      if (userId) {
        // If user already has a review, keep the most recent one (since we sorted by createdAt: -1)
        if (!uniqueReviewsMap.has(userId)) {
          uniqueReviewsMap.set(userId, review);
        }
      } else {
        // If userId is missing, include the review anyway
        uniqueReviewsMap.set(`missing_${review._id}`, review);
      }
    });

    // Convert map to array
    const reviews = Array.from(uniqueReviewsMap.values());

    // Calculate average rating and total reviews (only unique reviews)
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Round to 1 decimal place
    const roundedRating = Math.round(averageRating * 10) / 10;

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews,
        averageRating: roundedRating,
      },
    });
  } catch (error) {
    console.error("Error fetching clinic reviews:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}