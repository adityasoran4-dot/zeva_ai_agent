import dbConnect from "../../../../../lib/database";
import PurchaseReturn from "../../../../../models/stocks/PurchaseReturn";
import PurchaseRecord from "../../../../../models/stocks/PurchaseRecord";
import { getUserFromReq, requireRole } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  const { purchaseReturnId } = req.query;
  res.setHeader("Allow", ["PUT"]);

  if (req.method !== "PUT") {
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

    const updateData = req.body || {};

    // If purchasedOrder is provided, validate it
    if (updateData.purchasedOrder) {
      const pr = await PurchaseRecord.findById(updateData.purchasedOrder);
      if (!pr)
        return res
          .status(400)
          .json({ success: false, message: "Purchase order not found" });
    }

    const updated = await PurchaseReturn.findByIdAndUpdate(
      purchaseReturnId,
      updateData,
      { new: true },
    )
      .populate("branch", "name")
      .populate({
        path: "purchasedOrder",
        select: "orderNo date supplier",
        populate: { path: "supplier", select: "name" },
      })
      .populate("createdBy", "name email")
      .lean();

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Purchase return not found" });

    return res.status(200).json({
      success: true,
      message: "Purchase return updated",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating purchase return:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
