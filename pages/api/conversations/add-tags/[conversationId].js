import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import Conversation from "../../../../models/Conversation";
import dbConnect from "../../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

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
    const { tags } = req.body;

    // Validate inputs
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required",
      });
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({
        success: false,
        message: "tags must be a non-empty array",
      });
    }

    // Validate each tag
    const validTags = [];
    const invalidTags = [];

    tags.forEach((tag) => {
      const cleanedTag = tag.trim().toLowerCase();
      if (cleanedTag.length >= 2 && cleanedTag.length <= 50) {
        validTags.push(cleanedTag);
      } else {
        invalidTags.push(tag);
      }
    });

    if (validTags.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid tags provided. Tags must be 2-50 characters.",
        invalidTags,
      });
    }

    // Find the conversation
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

    // Check if conversation can be tagged (optional)
    if (
      conversation.status === "trashed" ||
      conversation.status === "blocked"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot tag conversation with status: ${conversation.status}`,
      });
    }

    // Add tags, avoiding duplicates
    const currentTags = conversation.tags || [];
    const newUniqueTags = validTags.filter((tag) => !currentTags.includes(tag));

    if (newUniqueTags.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All tags already exist in conversation",
        data: {
          conversationId,
          tags: currentTags,
          added: 0,
          total: currentTags.length,
        },
      });
    }

    // Calculate new total (checking limits)
    const totalAfterAdd = currentTags.length + newUniqueTags.length;
    const MAX_TAGS = 50; // Define a limit

    if (totalAfterAdd > MAX_TAGS) {
      const canAdd = MAX_TAGS - currentTags.length;
      return res.status(400).json({
        success: false,
        message: `Cannot add ${newUniqueTags.length} tags. Maximum ${MAX_TAGS} tags allowed. You can add ${canAdd} more.`,
        maxTags: MAX_TAGS,
        currentTags: currentTags.length,
        canAdd,
      });
    }

    // Update conversation with new tags
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clinicId },
      {
        $addToSet: { tags: { $each: newUniqueTags } },
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
      message: "Tags added successfully",
      data: {
        conversationId,
        tags: updatedConversation.tags,
        added: newUniqueTags.length,
        total: updatedConversation.tags.length,
        invalidTags: invalidTags.length > 0 ? invalidTags : undefined,
      },
    });
  } catch (err) {
    console.error("Error adding tags to conversation:", err);

    // Handle duplicate key errors or validation errors
    if (err.name === "MongoError" && err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate tag error",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
