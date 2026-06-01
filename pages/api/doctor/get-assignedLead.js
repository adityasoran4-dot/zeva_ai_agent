// /pages/api/doctor/get-assignedLead.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import Treatment from '../../../models/Treatment';
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await getUserFromReq(req);
    if (!requireRole(user, ["doctor"])) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get clinic for this doctor
    if (!user.clinicId) {
      return res.status(404).json({ message: "Doctor not linked to any clinic" });
    }

    const clinic = await Clinic.findById(user.clinicId);
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    // ✅ Fetch leads assigned to agents in this clinic
    const leads = await Lead.find({ clinicId: clinic._id })
      .populate("treatments.treatment", "name")
      .populate("assignedTo.user", "name email role")
      .lean();

    // ✅ Today's date boundaries
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));

    // ✅ Classify leads by nextFollowUps date
    const past = [];
    const today = [];
    const future = [];

    leads.forEach((lead) => {
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

