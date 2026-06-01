import dbConnect from "../../../../lib/database";
import Message from "../../../../models/Message";

export default async function handler(req, res) {
  let { url, emailId } = req.query;
  console.log("Email click link: ", { url, emailId });

  if (!url || !emailId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing url or emailId" });
  }

  try {
    await dbConnect();

    const decodedUrl = decodeURIComponent(url);
    const message = await Message.findById(emailId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    const campaignId = message.campaignId;
    const recipientId = message.recipientId;

    // const contact = await Contact.findById(recipientId);
    // if (!contact) {
    //   return res
    //     .status(404)
    //     .json({ success: false, message: "Contact not found" });
    // }

    // const fields = contact.additionalFields || {};
    const replacedUrl = decodedUrl;
    // const replacedUrl = replacePlaceholderInAWSUrl(decodedUrl, fields);

    // Mark message as clicked
    if (message.status !== "unsubscribed" && message.status !== "clicked") {
      message.status = "clicked";
    }
    await message.save();

    // const campaign = await Campaign.findById(campaignId);
    // if (campaign) {
    //   // === Handle clickedContacts logic ===
    //   const existing = campaign.clickedContacts.find(
    //     (c) => c.contact.toString() === recipientId.toString()
    //   );

    //   if (!existing) {
    //     // First time this contact clicked
    //     campaign.clickedMessages += 1;
    //     campaign.clickedContacts.push({
    //       contact: recipientId,
    //       message: emailId,
    //       clickCount: 1,
    //       clickedAt: new Date(),
    //       links: [
    //         { link: replacedUrl, clickCount: 1, lastClickedAt: new Date() },
    //       ],
    //     });
    //   } else {
    //     // Already exists - update click count and link
    //     existing.clickCount += 1;
    //     existing.clickedAt = new Date();

    //     const linkIndex = existing.links.findIndex(
    //       (l) => l.link === replacedUrl
    //     );
    //     if (linkIndex !== -1) {
    //       // Link already exists - increment count
    //       existing.links[linkIndex].clickCount += 1;
    //       existing.links[linkIndex].lastClickedAt = new Date();
    //     } else {
    //       // Add new link
    //       existing.links.push({
    //         link: replacedUrl,
    //         clickCount: 1,
    //         lastClickedAt: new Date(),
    //       });
    //     }
    //   }

    //   await campaign.save();
    // }

    // Redirect to actual destination
    return res.redirect(replacedUrl);
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to track click" });
  }
}
