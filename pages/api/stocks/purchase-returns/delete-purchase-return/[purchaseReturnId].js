import dbConnect from "../../../../../lib/database";
import PurchaseReturn from "../../../../../models/stocks/PurchaseReturn";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { purchaseReturnId } = req.query;
  res.setHeader("Allow", ["DELETE"]);

  if (req.method !== "DELETE") {
    return res
      .status(405)
      .json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const me = await getUserFromReq(req);
    if (!me)
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });

    if (
      !requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Soft-delete by setting status to Deleted where applicable
    const existing = await PurchaseReturn.findById(purchaseReturnId);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Purchase return not found" });

    existing.status = "Deleted";
    await existing.save();

    return res
      .status(200)
      .json({ success: true, message: "Purchase return deleted" });
  } catch (err) {
    console.error("Error deleting purchase return:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
