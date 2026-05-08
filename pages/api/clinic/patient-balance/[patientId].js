import dbConnect from "../../../../lib/database";
import Billing from "../../../../models/Billing";
import InsuranceClaim from "../../../../models/InsuranceClaim";
import { getUserFromReq } from "../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (
      !["clinic", "agent", "doctorStaff", "staff", "admin"].includes(
        clinicUser.role,
      )
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { patientId } = req.query;
    if (!patientId) {
      return res
        .status(400)
        .json({ success: false, message: "Patient ID is required" });
    }

    // Determine clinicId
    let clinicId;
    if (clinicUser.role === "clinic") {
      const Clinic = (await import("../../../../models/Clinic")).default;
      const clinic = await Clinic.findOne({ owner: clinicUser._id });
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (clinicUser.role === "admin") {
      // Admin can view across clinics if clinicId provided (optional)
      clinicId = req.query.clinicId || undefined;
    } else {
      clinicId = clinicUser.clinicId;
      if (!clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "User not linked to a clinic" });
      }
    }

    const match = { patientId };
    if (clinicId) match.clinicId = clinicId;

    // We track advance and pending separately (not net)
    const billings = await Billing.find(match)
      .select(
        "pending advance advanceUsed pendingUsed pendingClaimUsed pastAdvance pastAdvanceUsed pastAdvanceType pendingBalanceImage claimAmountUsed createdAt",
      )
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Debug logging
    console.log(`[Patient Balance] Found ${billings.length} billing records for patient ${patientId}`);
    const recordsWithImages = billings.filter(b => b.pendingBalanceImage && b.pendingBalanceImage.length > 0);
    console.log(`[Patient Balance] Records with images: ${recordsWithImages.length}`);
    if (recordsWithImages.length > 0) {
      console.log(`[Patient Balance] Sample images from first record:`, JSON.stringify(recordsWithImages[0].pendingBalanceImage));
    }
    
    // Log all billing records to see their structure
    if (billings.length > 0) {
      console.log(`[Patient Balance] First billing record keys:`, Object.keys(billings[0]));
      console.log(`[Patient Balance] First record pendingBalanceImage field:`, billings[0].pendingBalanceImage);
      console.log(`[Patient Balance] Has pendingBalanceImage property:`, 'pendingBalanceImage' in billings[0]);
    }

    let totalPending = 0;
    let totalPendingUsed = 0;
    let totalAdvanceGenerated = 0;
    let totalAdvanceUsed = 0;

    // Track past advance and its usage
    let totalPastAdvanceGenerated = 0;
    let totalPastAdvanceUsed = 0;
    let total50PercentOfferPastAdvanceGenerated = 0;
    let total50PercentOfferPastAdvanceUsed = 0;
    let total54PercentOfferPastAdvanceGenerated = 0;
    let total54PercentOfferPastAdvanceUsed = 0;
    let total159FlatPastAdvanceGenerated = 0;
    let total159FlatPastAdvanceUsed = 0;

    // Collect all pending balance images
    const allPendingBalanceImages = [];

    for (const b of billings) {
      totalPending += Number(b.pending || 0);
      totalPendingUsed += Number(b.pendingUsed || 0);
      totalAdvanceGenerated += Number(b.advance || 0);
      totalAdvanceUsed += Number(b.advanceUsed || 0);

      // Track past advance
      totalPastAdvanceGenerated += Number(b.pastAdvance || 0);
      totalPastAdvanceUsed += Number(b.pastAdvanceUsed || 0);

      if (b.pastAdvanceType === "50% Offer") {
        total50PercentOfferPastAdvanceGenerated += Number(b.pastAdvance || 0);
        total50PercentOfferPastAdvanceUsed += Number(b.pastAdvanceUsed || 0);
      }
      if (b.pastAdvanceType === "54% Offer") {
        total54PercentOfferPastAdvanceGenerated += Number(b.pastAdvance || 0);
        total54PercentOfferPastAdvanceUsed += Number(b.pastAdvanceUsed || 0);
      }
      if (b.pastAdvanceType === "159 Flat") {
        total159FlatPastAdvanceGenerated += Number(b.pastAdvance || 0);
        total159FlatPastAdvanceUsed += Number(b.pastAdvanceUsed || 0);
      }

      // Collect pending balance images
      if (b.pendingBalanceImage && Array.isArray(b.pendingBalanceImage)) {
        allPendingBalanceImages.push(...b.pendingBalanceImage);
      }
    }

    const pendingBalance = Math.max(
      0,
      Number((totalPending - totalPendingUsed).toFixed(2)),
    );
    const advanceBalance = Math.max(
      0,
      Number((totalAdvanceGenerated - totalAdvanceUsed).toFixed(2)),
    );

    // Calculate past advance balance
    const pastAdvanceBalance = Math.max(
      0,
      Number((totalPastAdvanceGenerated - totalPastAdvanceUsed).toFixed(2)),
    );

    // Calculate past advance balance for each type
    const pastAdvance50PercentBalance = Math.max(
      0,
      Number(
        (
          total50PercentOfferPastAdvanceGenerated -
          total50PercentOfferPastAdvanceUsed
        ).toFixed(2),
      ),
    );
    const pastAdvance54PercentBalance = Math.max(
      0,
      Number(
        (
          total54PercentOfferPastAdvanceGenerated -
          total54PercentOfferPastAdvanceUsed
        ).toFixed(2),
      ),
    );
    const pastAdvance159FlatBalance = Math.max(
      0,
      Number(
        (
          total159FlatPastAdvanceGenerated - total159FlatPastAdvanceUsed
        ).toFixed(2),
      ),
    );

    // Aggregate insurance claim amounts - ONLY include "Released" claims
    const claimMatch = { patientId, status: "Released" };
    // Don't filter by clinicId for now to see all claims
    console.log(`[Patient Balance] Querying claims with:`, claimMatch);
    const claims = await InsuranceClaim.find(claimMatch)
      .select("claimAmount advanceAmount claimType status pendingClaim")
      .lean();
    
    console.log(`[Patient Balance] Found ${claims.length} insurance claims for patient ${patientId}`);
    console.log(`[Patient Balance] Claims data:`, JSON.stringify(claims));
    
    let totalClaimAmount = 0;
    for (const c of claims) {
      console.log(`[Patient Balance] Processing claim ${c._id}:`, {
        claimType: c.claimType,
        claimAmount: c.claimAmount,
        advanceAmount: c.advanceAmount,
        status: c.status
      });
      // For Advance type: use claimAmount, for Paid type: use advanceAmount
      if (c.claimType === "Advance") {
        totalClaimAmount += Number(c.claimAmount || 0);
        console.log(`[Patient Balance] Added claimAmount for Advance type:`, c.claimAmount);
      } else if (c.claimType === "Paid") {
        totalClaimAmount += Number(c.advanceAmount || 0);
        console.log(`[Patient Balance] Added advanceAmount for Paid type:`, c.advanceAmount);
      } else {
        console.log(`[Patient Balance] Unknown claimType:`, c.claimType);
      }
    }
    
    console.log(`[Patient Balance] Total original claim amount: ${totalClaimAmount}`);
    
    // Calculate total claimAmountUsed from all billings
    const totalClaimAmountUsed = billings.reduce(
      (sum, b) => sum + Number(b.claimAmountUsed || 0), 0
    );
    
    console.log(`[Patient Balance] Total claim amount used: ${totalClaimAmountUsed}`);
    console.log(`[Patient Balance] Individual billing claimAmountUsed values:`, billings.map(b => ({ _id: b._id, claimAmountUsed: b.claimAmountUsed })));
    
    // Calculate remaining claim amount
    const claimAmount = Math.max(0, Number((totalClaimAmount - totalClaimAmountUsed).toFixed(2)));
    console.log(`[Patient Balance] Final claim amount: ${claimAmount}`);
    
    // Calculate total pending claim amount from released claims
    const totalPendingClaim = claims.reduce(
      (sum, c) => sum + Number(c.pendingClaim || 0), 0
    );
    console.log(`[Patient Balance] Total pending claim from claims: ${totalPendingClaim}`);
    
    // Calculate total pending claim amount that has been paid in billings
    // Use the pendingClaimUsed field which tracks pending claim payments
    const totalPendingClaimPaid = billings.reduce((sum, b) => {
      const pendingClaimUsedAmount = Number(b.pendingClaimUsed || 0);
      return sum + pendingClaimUsedAmount;
    }, 0);
    console.log(`[Patient Balance] Total pending claim paid in billings: ${totalPendingClaimPaid}`);
    
    // Final pending claim = total from claims - amount already paid
    const finalPendingClaim = Math.max(0, Number((totalPendingClaim - totalPendingClaimPaid).toFixed(2)));
    console.log(`[Patient Balance] Final pending claim after payments: ${finalPendingClaim}`);

    return res.status(200).json({
      success: true,
      balances: {
        advanceBalance,
        pendingBalance,
        claimAmount,
        pendingClaim: finalPendingClaim,
        pastAdvanceBalance,
        pastAdvance50PercentBalance,
        pastAdvance54PercentBalance,
        pastAdvance159FlatBalance,
        pendingBalanceImages: allPendingBalanceImages,
      },
      count: billings.length,
    });
  } catch (error) {
    console.error("Error computing patient balance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to compute patient balance",
    });
  }
}
