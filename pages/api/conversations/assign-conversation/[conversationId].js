import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import Conversation from "../../../../models/Conversation";
import User from "../../../../models/Users"; // Add User import
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
  } else if (me.role === "agent" || me.role === "doctor") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "User not tied to a clinic" });
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
    const { ownerId } = req.body; // Get ownerId from request body

    // Validate inputs
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "conversationId is required",
      });
    }

    // If ownerId is provided, validate it belongs to the same clinic
    if (ownerId) {
      // Check if the agent/user exists and belongs to the same clinic
      const agent = await User.findOne({
        _id: ownerId,
        clinicId: clinicId,
        role: { $in: ["agent", "doctor", "staff", "doctorStaff"] }, // Only assign to these roles
      });

      if (!agent) {
        return res.status(400).json({
          success: false,
          message: "Agent not found or does not belong to this clinic",
        });
      }

      // Check if agent is approved and active
      if (!agent.isApproved || agent.declined) {
        return res.status(400).json({
          success: false,
          message: "Agent is not approved or has been declined",
        });
      }
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

    // Check if conversation can be assigned (optional business logic)
    if (
      conversation.status === "trashed" ||
      conversation.status === "blocked"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign conversation with status: ${conversation.status}`,
      });
    }

    // Check if trying to assign to same owner
    if (conversation.ownerId && conversation.ownerId.toString() === ownerId) {
      return res.status(200).json({
        success: true,
        message: "Conversation already assigned to this agent",
        data: {
          conversationId,
          ownerId,
          previousOwnerId: conversation.ownerId,
          changed: false,
        },
      });
    }

    // Get previous owner for notification/logging
    const previousOwnerId = conversation.ownerId;

    // Update conversation with new owner
    const updatedConversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clinicId },
      {
        $set: {
          ownerId: ownerId || null, // Set to null if unassigning
          updatedAt: new Date(),
          // You might want to update status when assigned
          status: ownerId ? "open" : conversation.status,
        },
      },
      {
        new: true,
        select: "ownerId status updatedAt leadId tags",
        runValidators: true,
      }
    ).populate("ownerId", "name email role phone"); // Populate owner info

    // Optional: Create an activity log or notification
    // await createConversationActivityLog({
    //   conversationId,
    //   userId: me._id,
    //   action: ownerId ? "assigned" : "unassigned",
    //   details: {
    //     previousOwnerId,
    //     newOwnerId: ownerId,
    //   },
    // });

    return res.status(200).json({
      success: true,
      message: ownerId
        ? "Conversation assigned successfully"
        : "Conversation unassigned successfully",
      data: {
        conversationId,
        ownerId: updatedConversation.ownerId,
        previousOwnerId,
        changed: true,
        conversation: {
          id: updatedConversation._id,
          status: updatedConversation.status,
          updatedAt: updatedConversation.updatedAt,
          // Include populated owner info if exists
          owner: updatedConversation.ownerId
            ? {
                _id: updatedConversation.ownerId._id,
                name: updatedConversation.ownerId.name,
                email: updatedConversation.ownerId.email,
                role: updatedConversation.ownerId.role,
                phone: updatedConversation.ownerId.phone,
              }
            : null,
        },
      },
    });
  } catch (err) {
    console.error("Error assigning conversation:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors,
      });
    }

    // Handle invalid ObjectId
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
