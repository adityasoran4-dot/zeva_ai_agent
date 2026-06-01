import Message from "../../../../models/Message";
import Campaign from "../../../../models/Campaign";
import dbConnect from "../../../../lib/database";

export default async function handler(req, res) {
  try {
    await dbConnect();
    const { emailId } = req.query;
    const message = await Message.findById(emailId);
    if (!message) return res.status(404).send("Invalid emailId");

    const { campaignId, recipientId } = message;
    // const campaign = await Campaign.findById(campaignId);
    // if (campaign) {
    //   // Try finding the existing openedContact
    //   const existing = campaign.openedContacts.find(
    //     (c) => c.contact.toString() === recipientId.toString()
    //   );

    //   if (existing) {
    //     existing.openCount += 1;
    //     existing.openedAt = new Date();
    //   } else {
    //     campaign.openedMessages += 1;
    //     campaign.openedContacts.push({
    //       contact: recipientId,
    //       message: emailId,
    //       openCount: 1,
    //       openedAt: new Date(),
    //     });
    //   }
    //   await campaign.save();
    // }

    if (message.status !== "unsubscribed" && message.status !== "clicked") {
      message.status = "opened";
    }
    await message.save();

    // Return 1x1 gif
    const transparentGifBuffer = Buffer.from(
      "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64",
    );
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Content-Length", transparentGifBuffer.length);
    return res.status(200).end(transparentGifBuffer);
  } catch (error) {
    console.error("Error tracking open:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to track open" });
  }
}
