import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import dbConnect from "../../../../lib/database";
import Campaign from "../../../../models/Campaign";
import Message from "../../../../models/Message";
import { Parser } from "json2csv";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
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
    const { campaignId } = req.query;

    let campaign = await Campaign.findOne({
      _id: campaignId,
      clinicId,
    });
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign not found or you do not have access to delete this campaign",
      });
    }

    // Ensure the campaign is completed
    if (campaign.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Campaign has not been completed yet",
      });
    }

    // Fetch all messages related to the campaign
    const messages = await Message.find({ campaignId })
      .populate("senderId", "name email phone")
      .populate("recipientId", "name phone")
      .sort({ createdAt: -1 });

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No messages found for this campaign",
      });
    }

    // Define CSV export fields with proper checks
    const fields = [
      {
        label: "To",
        value: (message) => {
          const contact =
            message.direction === "incoming"
              ? message.senderId
              : message.recipientId;
          return contact?.name
            ? `${contact.name} (${contact.phone || "N/A"})`
            : contact?.phone || "Unknown";
        },
      },
      {
        label: "From",
        value: (message) => {
          const contact =
            message.direction === "incoming"
              ? message.recipientId
              : message.senderId;
          return contact?.name
            ? `${contact.name} (${contact.phone || "N/A"})`
            : contact?.phone || "Unknown";
        },
      },
      { label: "Direction", value: "direction" },
      { label: "Message", value: "content" },
      { label: "Media Url", value: "mediaUrl" },
      { label: "Media Type", value: "mediaType" },
      { label: "Channel", value: "channel" },
      { label: "Status", value: "status" },
      { label: "Sender", value: "senderId.name" },
      { label: "Receiver", value: "recipientId.name" },
      { label: "Error Code", value: "errorCode" },
      { label: "Error Message", value: "errorMessage" },
      { label: "Created At", value: "createdAt" },
      { label: "Updated At", value: "updatedAt" },
    ];

    // Convert JSON to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(messages);

    // Send the CSV as a response for download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${campaign.name.replace(/[^a-zA-Z0-9 ]/g, "")}_messages_analytics.csv`,
    );
    res.send(csv);
  } catch (err) {
    console.error("Error exporting campaign:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
