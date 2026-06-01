import dbConnect from "../../../../../lib/database";
import UserPackage from "../../../../../models/UserPackage";
import { getAuthorizedStaffUser } from "../../../../../server/staff/authHelpers";
import { getClinicIdFromUser } from "../../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();
  
  const { method } = req;

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  let user;
  try {
    user = await getAuthorizedStaffUser(req, { allowedRoles: ["clinic", "agent", "doctorStaff","admin"] });
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message || "Authentication error" });
  }

  const { packageId } = req.query;

  if (!packageId) {
    return res.status(400).json({ success: false, message: "Package ID is required" });
  }

  if (method === 'PATCH') {
    try {
      const { action } = req.body;
      
      // Get clinicId using the helper function
      const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
       
      if (clinicError || !clinicId) {
        return res.status(403).json({ 
          success: false,
          message: clinicError || "Unable to determine clinic access" 
        });
      }

      const pkg = await UserPackage.findOne({ _id: packageId, clinicId }).populate('patientId', 'firstName lastName emrNumber');
      
      if (!pkg) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      if (action === 'approve') {
        pkg.approvalStatus = 'approved';
        await pkg.save();
        return res.status(200).json({ 
          success: true, 
          message: "Package approved successfully", 
          package: pkg 
        });
      } else if (action === 'reject') {
        pkg.approvalStatus = 'rejected';
        await pkg.save();
        return res.status(200).json({ 
          success: true, 
          message: "Package rejected successfully", 
          package: pkg 
        });
      } else {
        return res.status(400).json({ success: false, message: "Invalid action. Use 'approve' or 'reject'" });
      }
    } catch (error) {
      console.error("Error updating package approval:", error);
      return res.status(500).json({ success: false, message: "Failed to update package approval" });
    }
  }

  res.setHeader('Allow', ['PATCH']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
