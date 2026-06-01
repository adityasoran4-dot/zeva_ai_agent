// pages/api/doctor/sidebar-permissions.js
// Returns navigation items for doctor sidebar based on permissions
// For now, doctors see all their navigation items (no permission model yet)
// This can be extended later if needed
import dbConnect from "../../../lib/database";
import User from "../../../models/Users";
import ClinicNavigationItem from "../../../models/ClinicNavigationItem";
import { getUserFromReq } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Get the logged-in doctor user
    const me = await getUserFromReq(req);
    if (!me) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    // Verify user is a doctor or an agent/doctorStaff accessing doctor routes
    // Agents can access doctor routes if they have appropriate permissions
    if (me.role === 'doctor') {
      // Doctor user - proceed normally
    } else if (['agent', 'doctorStaff'].includes(me.role)) {
      // Agent accessing doctor route - check if they have doctor permissions
      // This is handled by the agent sidebar-permissions API, but we allow it here
      // for direct API calls from agent routes
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Doctor role or agent with doctor permissions required' });
    }

    // Get navigation items for doctor role
    const navigationItems = await ClinicNavigationItem.find({ 
      role: 'doctor', 
      isActive: true 
    }).sort({ order: 1 });

    // Helper function to transform paths to /doctor paths
    const transformPath = (path) => {
      if (!path) return path;
      // Transform /staff/* to /doctor/staff/* (for staff pages)
      if (path.startsWith('/staff/')) {
        return path.replace('/staff/', '/doctor/staff/');
      }
      // Transform /staff to /doctor/staff
      if (path === '/staff') {
        return '/doctor/staff';
      }
      // Transform /lead/* to /doctor/lead/*
      if (path.startsWith('/lead/')) {
        return path.replace('/lead/', '/doctor/lead/');
      }
      // Transform /lead to /doctor/lead
      if (path === '/lead') {
        return '/doctor/lead';
      }
      // Transform /marketingalltype/* to /doctor/marketing/*
      if (path.startsWith('/marketingalltype/')) {
        return path.replace('/marketingalltype/', '/doctor/marketing/');
      }
      // Transform /marketingalltype to /doctor/marketing
      if (path === '/marketingalltype') {
        return '/doctor/marketing';
      }
      return path;
    };

    // For now, doctors see all navigation items
    // This can be extended later with DoctorPermission model if needed
    return res.status(200).json({
      success: true,
      permissions: null,
      navigationItems: navigationItems.map(item => ({
        _id: item._id,
        label: item.label,
        path: transformPath(item.path),
        icon: item.icon,
        description: item.description,
        order: item.order,
        moduleKey: item.moduleKey,
        subModules: (item.subModules || []).map(subModule => ({
          name: subModule.name,
          path: transformPath(subModule.path || ''),
          icon: subModule.icon || '',
          order: subModule.order || 0
        }))
      })),
      doctorId: me._id.toString()
    });

  } catch (error) {
    // console.error('Error fetching doctor sidebar permissions:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

