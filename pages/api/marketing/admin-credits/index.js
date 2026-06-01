import dbConnect from "../../../../lib/database";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import { addAdminCredits, getOrCreateAdminCredits, updateAdminLowThreshold } from "../../../../lib/adminCredits";

export default async function handler(req, res) {
  await dbConnect();

  const user = await getUserFromReq(req);
  if (!user || !requireRole(user, ["admin"])) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  if (req.method === "GET") {
    try {
      const doc = await getOrCreateAdminCredits();
      return res.status(200).json({
        success: true,
        data: {
          availableCredits: doc.availableCredits,
          totalAdded: doc.totalAdded,
          totalConsumed: doc.totalConsumed,
          lowThreshold: doc.lowThreshold,
          lastTopupAt: doc.lastTopupAt,
          isLow: doc.availableCredits <= doc.lowThreshold,
          updatedAt: doc.updatedAt,
        },
      });
    } catch (error) {
      // console.error("admin credits get error", error);
      return res.status(500).json({ success: false, message: "Failed to load admin credits" });
    }
  }

  if (req.method === "POST") {
    try {
      const { amount, note, lowThreshold } = req.body;
      let doc;
      if (amount) {
        doc = await addAdminCredits(parseInt(amount, 10), note);
      } else {
        doc = await getOrCreateAdminCredits();
      }

      if (typeof lowThreshold === "number" && lowThreshold >= 0) {
        doc = await updateAdminLowThreshold(lowThreshold);
      }

      return res.status(200).json({
        success: true,
        data: {
          availableCredits: doc.availableCredits,
          totalAdded: doc.totalAdded,
          totalConsumed: doc.totalConsumed,
          lowThreshold: doc.lowThreshold,
          lastTopupAt: doc.lastTopupAt,
          isLow: doc.availableCredits <= doc.lowThreshold,
          updatedAt: doc.updatedAt,
        },
      });
    } catch (error) {
      if (error.message === "Amount must be greater than zero") {
        return res.status(400).json({ success: false, message: error.message });
      }
      // console.error("admin credits post error", error);
      return res.status(500).json({ success: false, message: "Failed to update admin credits" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

