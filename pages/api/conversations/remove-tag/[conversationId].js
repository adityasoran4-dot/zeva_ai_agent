import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import Conversation from "../../../../models/Conversation";
import dbConnect from "../../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

  // Changed from DELETE to POST since we're modifying, not deleting the entire conversation
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Get clinicId based on user role
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({
        success: false,
        message: "Clinic not found for this user",
      });
    }
    clinicId = clinic._id;
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId;
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "clinicId is required for admin",
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  try {
    const { conversationId } = req.query;
    const { tag } = req.body;

    // Validate inputs
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required in query parameters",
      });
    }

    if (!tag || typeof tag !== "string") {
      return res.status(400).json({
        success: false,
        message: "tag is required in request body and must be a string",
      });
    }

    // Clean the tag (should match how tags are stored)
    const tagToRemove = tag.trim().toLowerCase();

    // Find the conversation first
    const conversation = await Conversation.findOne({
      _id: conversationId,
      clinicId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you do not have access to it",
      });
    }

    // Check if the tag exists in the conversation
    const currentTags = conversation.tags || [];
    if (!currentTags.includes(tagToRemove)) {
      return res.status(400).json({
        success: false,
        message: `Tag "${tag}" does not exist in this conversation`,
        data: {
          conversationId,
          currentTags,
          requestedTag: tagToRemove,
        },
      });
    }

    // Remove the tag
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clinicId },
      {
        $pull: { tags: tagToRemove },
        $set: { updatedAt: new Date() },
      },
      {
        new: true,
        select: "tags status updatedAt",
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: `Tag "${tagToRemove}" removed successfully`,
      data: {
        conversationId,
        removedTag: tagToRemove,
        tags: updatedConversation.tags,
        total: updatedConversation.tags.length,
      },
    });
  } catch (err) {
    console.error("Error removing tag from conversation:", err);

    // Handle specific errors
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
