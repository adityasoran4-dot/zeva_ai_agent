// pages/api/doctors/reviews/[doctorId].js
import dbConnect from "../../../../lib/database";
import Review from "../../../../models/Review";
import User from "../../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { doctorId } = req.query;

  if (!doctorId) {
    return res.status(400).json({ message: "Doctor ID is required" });
  }

  try {
    // Fetch all reviews for the doctor
    const reviews = await Review.find({ doctorId })
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "name",
        model: User,
      })
      .lean();

    // Calculate average rating and total reviews
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
    // console.error("Error fetching doctor reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}