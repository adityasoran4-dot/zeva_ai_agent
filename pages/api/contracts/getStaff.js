import dbConnect from "../../../lib/database";
import User from "../../../models/Users";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    await dbConnect();

    const staff = await User.find({ 
      role: { $in: ["staff", "doctorStaff"] } 
    })
    .select("_id name email role")
    .lean();

    return res.status(200).json({ 
      success: true, 
      data: staff 
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}