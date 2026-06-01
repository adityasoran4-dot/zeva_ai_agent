// /pages/api/agent/get-assignedLead.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import User from '../../../models/Users';
import Treatment from '../../../models/Treatment';
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await getUserFromReq(req);
    if (!requireRole(user, ["agent"])) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ Fetch leads for this agent
    const leads = await Lead.find({ "assignedTo.user": user._id })
      .populate("treatments.treatment", "name")
      .populate("assignedTo.user", "name email role")
      .lean();

    // ✅ Keep only the latest assignedTo entry
    const filteredLeads = leads
      .map((lead) => {
        if (lead.assignedTo?.length > 0) {
          const latest = lead.assignedTo[lead.assignedTo.length - 1];
          return { ...lead, assignedTo: [latest] };
        }
        return { ...lead, assignedTo: [] };
      })
      .filter(
        (lead) =>
          lead.assignedTo[0]?.user?._id.toString() === user._id.toString()
      );

    // ✅ Today’s date boundaries
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // ✅ Classify leads by nextFollowUps date
    const past = [];
    const today = [];
    const future = [];

    filteredLeads.forEach((lead) => {
      // Get the **nearest next follow-up date** if multiple
      let nextDate = null;
      if (lead.nextFollowUps?.length > 0) {
        nextDate = lead.nextFollowUps
          .map((f) => new Date(f.date))
          .sort((a, b) => a - b)[0]; // earliest upcoming
      }

      if (!nextDate) {
        future.push({ ...lead, followUpStatus: "none" }); // no follow-up date
      } else if (nextDate < todayStart) {
        past.push({ ...lead, followUpStatus: "past" }); // 🔴
      } else if (nextDate >= todayStart && nextDate <= todayEnd) {
        today.push({ ...lead, followUpStatus: "today" }); // 🟢
      } else {
        future.push({ ...lead, followUpStatus: "future" }); // normal
      }
    });

    // ✅ Order: Past → Today → Future
    const orderedLeads = [...past, ...today, ...future];

    return res.status(200).json({
      success: true,
      totalAssigned: orderedLeads.length,
      leads: orderedLeads,
    });
  } catch (error) {
    // console.error("Error fetching assigned leads:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}
