// pages/api/admin/setDoctorCredentials.js

import dbConnect from '../../../lib/database';
import User from '../../../models/Users';
import { getUserFromReq } from "../lead-ms/auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: 'userId and password are required' });
  }

  try {
    // Get the logged-in user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing or invalid token" });
    }

    // If user is an agent, check update permission for approval_doctors module
    if (['agent', 'doctorStaff'].includes(me.role)) {
      const { hasPermission, error: permissionError } = await checkAgentPermission(
        me._id,
        "approval_doctors", // moduleKey
        "update", // action (setting credentials is an update operation)
        null // subModuleName
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: permissionError || "You do not have permission to update doctor credentials"
        });
      }
    }
    // Admin users bypass permission checks
    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Set password - pre-save middleware will hash it and set passwordChangedAt
    user.password = password;
    await user.save();
    
    // Ensure passwordChangedAt is set (in case pre-save hook didn't trigger)
    if (!user.passwordChangedAt) {
      user.passwordChangedAt = new Date();
      await user.save();
    }

    return res.status(200).json({ success: true, message: 'Credentials set successfully' });
  } catch (err) {
    // console.error('Set credentials error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
