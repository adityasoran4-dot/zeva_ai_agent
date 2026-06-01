import dbConnect from "../../../../../lib/database";
import Billing from "../../../../../models/Billing";
import { getUserFromReq } from "../../../lead-ms/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
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

    const { imageUrl } = req.body;
    if (!imageUrl || typeof imageUrl !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Image URL is required" });
    }

    // Find all pending billing records for this patient
    let clinicId;
    if (clinicUser.role === "clinic") {
      const Clinic = (await import("../../../../../models/Clinic")).default;
      const clinic = await Clinic.findOne({ owner: clinicUser._id });
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found" });
      }
      clinicId = clinic._id;
    } else if (clinicUser.role === "admin") {
      clinicId = req.body.clinicId || undefined;
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

    // Find ALL billing records for this patient (not just pending ones)
    // This ensures images are saved even if the bill has been paid
    const allBillings = await Billing.find(match).sort({ createdAt: -1 });

    console.log(`[Upload Image] Found ${allBillings.length} total billing records for patient ${patientId}`);

    if (allBillings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No billing records found for this patient",
      });
    }

    // Add the image URL to the most recent billing record (or all records)
    // Strategy: Add to the latest billing record to keep it simple
    const latestBilling = allBillings[0];
    
    console.log(`[Upload Image] Latest billing ID: ${latestBilling._id}`);
    console.log(`[Upload Image] Current pendingBalanceImage before update:`, latestBilling.pendingBalanceImage);
    console.log(`[Upload Image] Has pendingBalanceImage property:`, 'pendingBalanceImage' in latestBilling);
    
    if (!latestBilling.pendingBalanceImage) {
      latestBilling.pendingBalanceImage = [];
      console.log(`[Upload Image] Initialized pendingBalanceImage as empty array`);
    }
    
    // Avoid duplicate URLs
    if (!latestBilling.pendingBalanceImage.includes(imageUrl)) {
      latestBilling.pendingBalanceImage.push(imageUrl);
      console.log(`[Upload Image] Adding image to billing ${latestBilling._id}: ${imageUrl}`);
      console.log(`[Upload Image] pendingBalanceImage after push:`, latestBilling.pendingBalanceImage);
      
      const savedBilling = await latestBilling.save();
      console.log(`[Upload Image] Saved billing record`);
      console.log(`[Upload Image] Saved pendingBalanceImage:`, savedBilling.pendingBalanceImage);
    } else {
      console.log(`[Upload Image] Image already exists in billing record`);
    }

    return res.status(200).json({
      success: true,
      message: "Image uploaded and saved successfully",
      imagesCount: latestBilling.pendingBalanceImage?.length || 0,
    });
  } catch (error) {
    console.error("Error saving pending balance image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save pending balance image",
    });
  }
}
