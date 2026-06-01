import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import User from "../../../models/Users";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Fetch all clinics with their owner information
    const clinics = await Clinic.find({})
      .populate({
        path: "owner",
        model: User,
        select: "name email phone isApproved declined role",
      })
      .select("name address location isApproved declined owner slug")
      .lean();

    // Filter only active and registered clinics
    // Active means: isApproved = true, declined = false, owner isApproved = true, owner role = 'clinic'
    const activeClinics = clinics.filter(
      (clinic) =>
        clinic.owner &&
        clinic.isApproved === true &&
        clinic.declined !== true &&
        clinic.owner.isApproved === true &&
        clinic.owner.declined !== true &&
        clinic.owner.role === "clinic"
    );

    // Return clinic names and basic info
    const clinicList = activeClinics.map((clinic) => ({
      _id: clinic._id,
      name: clinic.name,
      address: clinic.address,
      slug: clinic.slug,
      location: clinic.location,
    }));

    return res.status(200).json({
      success: true,
      clinics: clinicList,
      count: clinicList.length,
    });
  } catch (error) {
    console.error("Error fetching clinics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch clinics",
      error: error.message,
    });
  }
}

