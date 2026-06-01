import dbConnect from "../../../../lib/database";
import SmsWallet from "../../../../models/SmsWallet";
import SmsTopupRequest from "../../../../models/SmsTopupRequest";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import { consumeAdminCredits, getOrCreateAdminCredits } from "../../../../lib/adminCredits";

export default async function handler(req, res) {
  await dbConnect();
  const user = await getUserFromReq(req);
  if (!user || !requireRole(user, ["admin"])) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  if (req.method === "GET") {
    try {
      const { ownerType, ownerId } = req.query;
      const query = {};
      if (ownerType) query.ownerType = ownerType;
      if (ownerId) query.ownerId = ownerId;
      const wallets = await SmsWallet.find(query).populate("ownerId", "name email phone role");
      return res.status(200).json({ success: true, data: wallets });
    } catch (error) {
      // console.error("wallet admin get error", error);
      return res.status(500).json({ success: false, message: "Failed to fetch wallets" });
    }
  }

  if (req.method === "POST") {
    try {
      const { ownerId, ownerType, credits, note } = req.body;
      if (!ownerId || !ownerType || typeof credits !== "number") {
        return res.status(400).json({ success: false, message: "ownerId, ownerType and credits are required" });
      }
      if (credits <= 0) {
        return res.status(400).json({ success: false, message: "Credits must be greater than zero" });
      }

      await consumeAdminCredits(credits);

      const wallet = await SmsWallet.findOneAndUpdate(
        { ownerId, ownerType },
        {
          $inc: {
            balance: credits,
            totalPurchased: credits > 0 ? credits : 0,
          },
          $set: { lastTopupAt: new Date() },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await SmsTopupRequest.create({
        ownerId,
        ownerType,
        credits,
        note: note || "Manual adjustment",
        adminNote: "Admin adjustment",
        status: "approved",
      });

      const adminCredits = await getOrCreateAdminCredits();

      return res.status(200).json({ success: true, data: wallet, adminCredits });
    } catch (error) {
      if (error.code === "INSUFFICIENT_ADMIN_CREDITS") {
        return res.status(400).json({ success: false, message: "Not enough admin SMS credits available." });
      }
      // console.error("wallet admin post error", error);
      return res.status(500).json({ success: false, message: "Failed to update wallet" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

