import { getUserFromReq, requireRole } from "../lead-ms/auth";
import Clinic from "../../../models/Clinic";
import Conversation from "../../../models/Conversation";
import dbConnect from "../../../lib/database";

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
    const { leadId } = req.body;

    // Check if a conversation already exists for the given lead in this clinic
    const existingConversation = await Conversation.findOne({
      leadId,
      clinicId,
    }).populate({
      path: "leadId",
      select: "_id name phone email createdAt", // Specify the fields you want to select
      model: "Lead", // Make sure the correct model is being populated
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exist.",
        conversation: existingConversation,
      });
    }

    // Create a new conversation
    const newConversation = await Conversation.create({
      clinicId,
      leadId,
      ownerId: me._id,
    });

    const findConv = await Conversation.findById(newConversation._id).populate({
      path: "leadId",
      select: "_id name phone email createdAt", // Specify the fields you want to select
      model: "Lead", // Make sure the correct model is being populated
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully.",
      conversation: findConv,
    });
  } catch (err) {
    console.error("Error creating conversation:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
