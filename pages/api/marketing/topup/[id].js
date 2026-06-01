import dbConnect from "../../../../lib/database";
import SmsTopupRequest from "../../../../models/SmsTopupRequest";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import { creditWallet } from "../../../../lib/smsWallet";
import { consumeAdminCredits, getOrCreateAdminCredits } from "../../../../lib/adminCredits";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
    const user = await getUserFromReq(req);
    if (!user || !requireRole(user, ["admin"])) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const {
      query: { id },
      body: { status, adminNote },
    } = req;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const request = await SmsTopupRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Top-up request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request already processed" });
    }

    request.status = status;
    request.adminNote = adminNote;

        let adminCredits;
        if (status === "approved") {
          await consumeAdminCredits(request.credits);
          await creditWallet({
            ownerId: request.ownerId,
            ownerType: request.ownerType,
            amount: request.credits,
            reason: "topup_approved",
            meta: { requestId: request._id, adminNote },
          });
          adminCredits = await getOrCreateAdminCredits();
        }

        await request.save();
        return res.status(200).json({ success: true, data: request, adminCredits });
  } catch (error) {
        if (error.code === "INSUFFICIENT_ADMIN_CREDITS") {
          return res.status(400).json({ success: false, message: "Admin SMS credits are insufficient to approve this request." });
        }
    // console.error("topup update error", error);
    return res.status(500).json({ success: false, message: "Failed to update top-up request" });
  }
}

