import dbConnect from "../../../../lib/database";
import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import { getOrCreateWallet } from "../../../../lib/smsWallet";
import { getClinicIdFromUser, checkClinicPermission } from "../../lead-ms/permissions-helper";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Allow clinic, doctor, doctorStaff, staff, and agent roles
    if (!requireRole(user, ["doctor", "clinic", "doctorStaff", "staff", "agent"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Check permissions for clinic/agent/doctor/doctorStaff/staff roles
    // Note: We allow wallet viewing even without explicit permissions for better UX
    // Permission checks are enforced when actually sending SMS
    if (["clinic", "agent", "doctor", "doctorStaff", "staff"].includes(user.role)) {
      try {
        const { clinicId, error: clinicError } = await getClinicIdFromUser(user);
        if (clinicError || !clinicId) {
          // console.error("Wallet access - clinic ID error:", clinicError);
          // Still allow wallet access even if clinic ID resolution fails
          // The wallet is user-specific, not clinic-specific
        } else {
          // Try to check permissions, but don't block wallet viewing
          // Users need to see their balance even if permissions aren't fully set up
          try {
            const { hasPermission, error: permError } = await checkClinicPermission(
              clinicId,
              "clinic_staff_management",
              "read",
              "SMS Marketing"
            );

            if (!hasPermission) {
              // console.log("Wallet access - Permission check failed (non-blocking):", permError);
              // Don't block - allow wallet viewing for UX
            }
          } catch (permErr) {
            // console.error("Wallet access - Permission check error (non-blocking):", permErr);
            // Continue without blocking - allow wallet viewing
          }
        }
      } catch (err) {
        // console.error("Wallet access - Error in permission check setup (non-blocking):", err);
        // Continue without blocking - allow wallet viewing
      }
    }

    // Determine ownerType based on role
    let ownerType = "clinic";
    if (user.role === "doctor" || user.role === "doctorStaff") {
      ownerType = "doctor";
    } else if (["clinic", "agent", "staff"].includes(user.role)) {
      ownerType = "clinic";
    }
    const wallet = await getOrCreateWallet(user._id, ownerType);

    return res.status(200).json({
      success: true,
      data: {
        _id: wallet._id,
        balance: wallet.balance,
        totalSent: wallet.totalSent || 0,
        totalPurchased: wallet.totalPurchased || 0,
        lastTopupAt: wallet.lastTopupAt,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
        lowBalanceThreshold: parseInt(process.env.SMS_LOW_BALANCE_THRESHOLD || "20", 10),
      },
    });
  } catch (error) {
    // console.error("wallet me error", error);
    return res.status(500).json({ success: false, message: "Failed to load wallet" });
  }
}

