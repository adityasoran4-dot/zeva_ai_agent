// /pages/api/clinic/get-assignedLead.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import Treatment from "../../../models/Treatment";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { page: pageQuery, limit: limitQuery } = req.query;

  try {
    const user = await getUserFromReq(req);
    if (!requireRole(user, ["clinic", "agent", "doctor", "doctorStaff"])) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get clinic for this user
    let clinic = null;
    if (user.role === "clinic") {
      clinic = await Clinic.findOne({ owner: user._id });
    } else if (user.clinicId) {
      clinic = await Clinic.findById(user.clinicId);
    }
    if (!clinic) {
      return res.status(404).json({ message: "Clinic not found" });
    }

    const matchQuery = { clinicId: clinic._id };
    const scope = req.query.scope;
    if (scope === "agent" && user.role === "agent") {
      matchQuery["assignedTo.user"] = user._id;
    }

    // Pagination defaults & sanitization
    const page = Math.max(1, parseInt(pageQuery || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitQuery || "20", 10))); // default 20, max 100
    const skip = (page - 1) * limit;

    // Total count for the filtered query
    const totalCount = await Lead.countDocuments(matchQuery);

    // Calculate pages
    const totalPages = Math.ceil(totalCount / limit);

    // Pagination meta
    const currentPage = page;
    const hasMore = page < totalPages;

    // ✅ Fetch leads assigned to agents in this clinic
    const leads = await Lead.find(matchQuery)
      .skip(skip)
      .limit(limit)
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
      pagination: {
        totalLeads: totalCount,
        totalPages,
        currentPage,
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching assigned leads:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
}
