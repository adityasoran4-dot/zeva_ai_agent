import dbConnect from "../../../lib/database";
import Vendor from "../../../models/VendorProfile";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
    });

    const vendors = await Vendor.find({}).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      data: vendors
    });

  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}