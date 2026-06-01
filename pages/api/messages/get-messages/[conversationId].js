import dbConnect from "../../../../lib/database";
import Clinic from "../../../../models/Clinic";
import Message from "../../../../models/Message";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";

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
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Doctor not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "doctorStaff" || me.role === "staff") {
      if (!me.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Staff not linked to any clinic" });
      }
      clinic = await Clinic.findById(me.clinicId);
    } else if (me.role === "admin") {
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
      // For Get Messages Permissions
    }
    try {
      const { conversationId } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      let query = { clinicId: clinic._id, conversationId };

      let messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("senderId", "name email phone")
        .populate("recipientId", "name email phone")
        .populate("provider", "name label email phone")
        .populate({
          path: "replyToMessageId",
          select: "content mediaType mediaUrl channel direction",
          populate: [
            {
              path: "senderId",
              select: "name email phone",
            },
            {
              path: "recipientId",
              select: "name email phone",
            },
          ],
        })
        .lean(); // 🔥 CRITICAL: Add .lean() to get plain JavaScript objects

      // Group messages by date
      const groupedMessages = {};

      messages.forEach((message) => {
        if (!message.createdAt) return;

        const date = new Date(message.createdAt).toISOString().split("T")[0];
        if (!groupedMessages[date]) {
          groupedMessages[date] = [];
        }
        groupedMessages[date].push(message);
      });

      // Convert grouped messages into array of {date, messages} sorted in ascending order of date
      const formatedData = Object.keys(groupedMessages)
        .sort((a, b) => new Date(a) - new Date(b))
        .map((date) => ({
          date,
          messages: groupedMessages[date].reverse(), // Reverse the messages within each date group
        }));

      const totalMessages = await Message.countDocuments(query);
      const totalPages = Math.ceil(totalMessages / limit);
      const hasMore = page * limit < totalMessages;

      res.status(200).json({
        success: true,
        message: "Found.",
        data: formatedData,
        pagination: {
          totalMessages,
          totalPages,
          currentPage: page,
          limit,
          hasMore,
        },
      });
    } catch (error) {
      // console.error("Error fetching messages of conversation:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch messages of conversation",
      });
    }
  } catch (error) {
    console.error("Get Messages error conversation: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
