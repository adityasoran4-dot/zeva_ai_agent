import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Conversation from "../../../models/Conversation";
import Lead from "../../../models/Lead";
import Message from "../../../models/Message";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: `${req.method} - Method not allowed` });
  }
  try {
    await dbConnect();

    const me = await getUserFromReq(req);
    if (
      !requireRole(me, [
        "clinic",
        "agent",
        "admin",
        "doctor",
        "doctorStaff",
        "staff",
      ])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ✅ Resolve clinicId based on role
    let clinic;
    if (me.role === "clinic") {
      clinic = await Clinic.findOne({ owner: me._id });
    } else if (me.role === "agent") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Agent not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "doctor") {
      // Doctor uses their clinicId if they have one
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Doctor not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "doctorStaff" || me.role === "staff") {
      // DoctorStaff/Staff uses their clinicId if they have one
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Staff not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "admin") {
      // Admin can access all leads, but we still need clinicId if provided
      const { clinicId: adminClinicId } = req.query;
      if (adminClinicId) {
        clinic = await Clinic.findById(adminClinicId);
      }
    }

    if (!clinic) {
      return res
        .status(404)
        .json({ success: false, message: "Clinic not found for this user" });
    }

    // ✅TODO: Check permission for reading leads (only for clinic, agent, doctor, and doctorStaff/staff; admin bypasses)
    if (me.role !== "admin" && clinic._id) {
    }

    console.log({ clinic });

    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search
        ? req.query.search.trim().toLowerCase()
        : null;
      const status = req.query.status || "all";
      // Ensure we only fetch conversations for this clinic and where leadId exists and is not null
      let query = {
        clinicId: clinic._id,
        leadId: { $ne: null, $exists: true },
      };
      if (status === "all") {
        query.status = { $nin: ["trashed", "blocked"] };
      } else if (status === "read") {
        query.unreadMessages = { $size: 0 };
      } else if (status === "unread") {
        query.unreadMessages = { $ne: [] };
      } else {
        query.status = status;
      }

      // fetch by filters of ownerId
      if (req.query.ownerId) {
        query.ownerId = req.query.ownerId;
      }

      // if role is agent then only show assigned conversations
      if (me.role === "agent" || me.role === "doctorStaff") {
        query.ownerId = me._id;
      }

      console.log({ meUser: me });

      // Search by contact name or phone number
      let leadIdsFromSearch = null;
      if (search) {
        const searchRegex = new RegExp(search, "i");
        const matchingLeads = await Lead.find({
          $or: [{ name: searchRegex }, { phone: searchRegex }],
        }).select("_id");

        leadIdsFromSearch = matchingLeads.map((c) => c._id).filter(Boolean);
      }

      // Ensure leadId actually references an existing Lead in this clinic.
      const existingLeadIds = await Lead.find({
        clinicId: clinic._id,
      }).distinct("_id");
      if (!existingLeadIds || existingLeadIds.length === 0) {
        // No leads for this clinic -> return empty result
        return res.status(200).json({
          success: true,
          message: "Conversations Found.",
          conversations: [],
          pagination: {
            totalConversations: 0,
            currentPage: page,
            totalPages: 0,
            hasMore: false,
          },
        });
      }

      // Build final allowed leadId list by intersecting search results (if any) with existing leads
      const existingLeadIdStrs = existingLeadIds.map((id) => String(id));
      let finalLeadIds = existingLeadIds;
      if (leadIdsFromSearch) {
        const filtered = leadIdsFromSearch.filter((id) =>
          existingLeadIdStrs.includes(String(id)),
        );
        finalLeadIds = filtered;
      }

      if (!finalLeadIds || finalLeadIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Conversations Found.",
          conversations: [],
          pagination: {
            totalConversations: 0,
            currentPage: page,
            totalPages: 0,
            hasMore: false,
          },
        });
      }

      // Apply final leadId filter (ensures referenced Lead exists)
      query.leadId = { $in: finalLeadIds };

      // TODO: Filter by tags

      // Get total count
      const totalConversations = await Conversation.countDocuments(query);
      // Fetch conversations with pagination
      let conversations = await Conversation.find(query)
        .populate({
          path: "leadId",
          select: "_id name phone email patientId createdAt",
          model: "Lead",
        })
        .populate(
          "recentMessage",
          "subject channel content mediaType mediaUrl attachments createdAt",
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      // Determine if there are more conversations
      const hasMore = page * limit < totalConversations;

      res.status(200).json({
        success: true,
        message: "Conversations Found.",
        conversations,
        pagination: {
          totalConversations,
          currentPage: page,
          totalPages: Math.ceil(totalConversations / limit),
          hasMore,
        },
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch conversations" });
    }
  } catch (error) {
    console.error("Get Conversations error: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
