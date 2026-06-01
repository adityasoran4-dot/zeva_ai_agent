import dbConnect from "../../../lib/database";
import UserPackage from "../../../models/UserPackage";
import PatientRegistration from "../../../models/PatientRegistration";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { getClinicIdFromUser } from "../lead-ms/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();
  
  const { method } = req;

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  let user;
  try {
    user = await getAuthorizedStaffUser(req, { allowedRoles: ["clinic", "staff", "admin", "agent", "doctorStaff"] });
  } catch (err) {
    return res.status(err.status || 401).json({ success: false, message: err.message || "Authentication error" });
  }

  if (method === 'GET') {
    try {
      const { status, search } = req.query;
      
      // Get clinicId using the helper function that handles all user roles correctly
      const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
      
      if (clinicError || !clinicId) {
        return res.status(403).json({ 
          success: false,
          message: clinicError || "Unable to determine clinic access" 
        });
      }

      console.log('=== USER PACKAGES DEBUG ===');
      console.log('User ID:', user._id);
      console.log('User role:', user.role);
      console.log('Resolved clinicId:', clinicId);
      console.log('Status filter:', status);
      console.log('Search query:', search);

      // Filter by clinicId to ensure data isolation
      let query = { clinicId };

      // Only apply status filter if it's provided and valid
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query.approvalStatus = status;
      }

      console.log('MongoDB Query:', JSON.stringify(query));

      const packages = await UserPackage.find(query)
        .populate({
          path: 'patientId',
          model: PatientRegistration,
          select: 'firstName lastName emrNumber',
        })
        .sort({ createdAt: -1 })
        .lean();

      console.log('Found packages count:', packages.length);
      if (packages.length > 0) {
        console.log('First package clinicId:', packages[0]?.clinicId?.toString());
        console.log('First package approvalStatus:', packages[0]?.approvalStatus);
      }

      let filteredPackages = packages;
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredPackages = packages.filter(pkg => {
          const patient = pkg.patientId;
          if (!patient) return false;
          const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
          return fullName.includes(searchTerm) || patient.emrNumber?.toLowerCase().includes(searchTerm);
        });
      }

      return res.status(200).json({ success: true, packages: filteredPackages });
    } catch (error) {
      console.error("Error fetching user packages:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch user packages" });
    }
  }

  if (method === 'PATCH') {
    try {
      const { packageId } = req.query;
      const { action } = req.body;
      
      // Get clinicId using the helper function
      const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
      
      if (clinicError || !clinicId) {
        return res.status(403).json({ 
          success: false,
          message: clinicError || "Unable to determine clinic access" 
        });
      }

      if (!packageId) {
        return res.status(400).json({ success: false, message: "Package ID is required" });
      }

      const pkg = await UserPackage.findOne({ _id: packageId, clinicId });
      
      if (!pkg) {
        return res.status(404).json({ success: false, message: "Package not found" });
      }

      if (action === 'approve') {
        pkg.approvalStatus = 'approved';
        await pkg.save();
        return res.status(200).json({ success: true, message: "Package approved successfully", package: pkg });
      } else if (action === 'reject') {
        pkg.approvalStatus = 'rejected';
        await pkg.save();
        return res.status(200).json({ success: true, message: "Package rejected successfully", package: pkg });
      } else {
        return res.status(400).json({ success: false, message: "Invalid action. Use 'approve' or 'reject'" });
      }
    } catch (error) {
      console.error("Error updating package approval:", error);
      return res.status(500).json({ success: false, message: "Failed to update package approval" });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
