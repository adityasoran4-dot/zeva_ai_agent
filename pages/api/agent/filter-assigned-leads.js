// /pages/api/agent/filter-assigned-leads.js
import dbConnect from '../../../lib/database';
import Lead from '../../../models/Lead';
import User from '../../../models/Users';
import Treatment from '../../../models/Treatment';
import { getUserFromReq, requireRole } from '../lead-ms/auth';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getUserFromReq(req);
    if (!requireRole(user, ['agent'])) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, phone, source, customSource } = req.body;

    let query = { "assignedTo.user": user._id };

    // ✅ Only add filters if value is not empty
    if (name && name.trim() !== "") {
      query.name = { $regex: name.trim(), $options: 'i' };
    }
    if (phone && phone.trim() !== "") {
      query.phone = { $regex: phone.trim(), $options: 'i' };
    }
    if (source && source.trim() !== "") {
      query.source = source === 'Other' ? customSource : source;
    }

    // ✅ Populate treatments & assignedTo.user
    const leads = await Lead.find(query)
      .populate("treatments.treatment", "name")
      .populate("assignedTo.user", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Keep only latest assignedTo for this agent
    const filteredLeads = leads
      .map(lead => {
        if (lead.assignedTo?.length > 0) {
          const latest = lead.assignedTo[lead.assignedTo.length - 1];
          return { ...lead, assignedTo: [latest] };
        }
        return { ...lead, assignedTo: [] };
      })
      .filter(lead => lead.assignedTo[0]?.user?._id.toString() === user._id.toString());

    return res.status(200).json({
      success: true,
      totalAssigned: filteredLeads.length,
      leads: filteredLeads
    });
  } catch (err) {
    // console.error("Error filtering assigned leads:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}
