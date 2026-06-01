import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  // GET: list doctors by clinicId (public endpoint for appointment booking)
  if (req.method === "GET") {
    try {
      const { clinicId, search = "", page = 1, limit = 10 } = req.query;

      if (!clinicId) {
        return res
          .status(400)
          .json({ success: false, message: "clinicId is required" });
      }

      // Build query
      const doctorsQuery = {
        clinicId: clinicId,
        role: "doctorStaff",
        isApproved: true,
      };

      // Add search filter if provided
      if (search) {
        doctorsQuery.name = { $regex: search, $options: "i" };
      }

      // Get total count for pagination
      const totalDoctors = await User.countDocuments(doctorsQuery);
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const totalPages = Math.ceil(totalDoctors / parseInt(limit));

      // Fetch doctors with pagination
      const doctors = await User.find(doctorsQuery)
        .select("_id name email phone gender age dateOfBirth role")
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          doctors,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalDoctors,
            hasMore: parseInt(page) < totalPages,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching doctors:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch doctors" });
    }
  }

  res.setHeader("Allow", ["GET"]);
  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
