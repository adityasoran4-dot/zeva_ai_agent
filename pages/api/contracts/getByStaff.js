import dbConnect from "../../../lib/database";
import Contract from "../../../models/Contract";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";
import { checkAgentPermission } from "../../../lib/checkAgentPermission";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const user = await getAuthorizedStaffUser(req, {
      allowedRoles: ["staff", "doctorStaff", "doctor", "clinic", "agent", "admin"],
    });

    // Check agent permissions for reading contracts
    // All Contracts is a submodule under staff_management
    if (user.role === 'agent' || user.role === 'doctorStaff') {
      console.log(`Checking read permission for user ${user._id} on contracts submodule`);
      const hasPermission = await checkAgentPermission(
        user._id, 
        'staff_management', 
        'read',
        'All Contracts'
      ) || await checkAgentPermission(user._id, 'staff_management', 'all', 'All Contracts')
      || await checkAgentPermission(user._id, 'clinic_staff_management', 'read', 'All Contracts')
      || await checkAgentPermission(user._id, 'clinic_staff_management', 'all', 'All Contracts');
      
      console.log(`Read permission result for contracts:`, hasPermission);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to view contracts" 
        });
      }
    }

    // Fetch contracts assigned to this user
    console.log("Looking for contracts with responsiblePerson:", user._id);
    const contracts = await Contract.find({
      responsiblePerson: user._id,
    })
      .populate("responsiblePerson", "name email")
      .sort({ createdAt: -1 })
      .lean();
    
    console.log("Found contracts:", contracts.length);

    res.status(200).json({
      success: true,
      count: contracts.length,
      data: contracts,
    });
  } catch (error) {
    console.error("Error fetching staff contracts:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}