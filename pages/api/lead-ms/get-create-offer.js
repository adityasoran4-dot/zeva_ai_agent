// File: /pages/api/lead-ms/get-created-offer.js
import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import Service from "../../../models/Service";
import Clinic from "../../../models/Clinic"; 
import { getUserFromReq, requireRole } from "./auth";
import { checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    const user = await getUserFromReq(req);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Allow clinics, agents, doctors, doctorStaff, staff, and admins
    if (!requireRole(user, ["clinic", "agent", "admin", "doctor", "doctorStaff", "staff"])) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    let clinicId;

    if (user.role === "clinic") {
      const clinic = await Clinic.findOne({ owner: user._id }).select("_id");
      if (!clinic) {
        return res
          .status(404)
          .json({ success: false, message: "Clinic not found for this user" });
      }
      clinicId = clinic._id;
    } else if (user.role === "agent" || user.role === "doctorStaff" || user.role === "staff") {
      // agent, doctorStaff, and staff must have clinicId
      if (!user.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "User not linked to any clinic" });
      }
      clinicId = user.clinicId;
    } else if (user.role === "doctor") {
      if (!user.clinicId) {
        return res
          .status(403)
          .json({ success: false, message: "Doctor not linked to any clinic" });
      }
      clinicId = user.clinicId;
    } else if (user.role === "admin") {
      // Admin can access all offers, but we still need clinicId if provided
      const { clinicId: adminClinicId } = req.query;
      if (adminClinicId) {
        clinicId = adminClinicId;
      }
    }

    // ✅ Check permission for reading offers (only for doctorStaff and agent, clinic/admin/doctor/staff bypass)
    if (!["admin", "clinic", "doctor", "staff"].includes(user.role) && clinicId) {
      // If user is doctorStaff or agent, check read permission for create_offers module
      if (['agent', 'doctorStaff'].includes(user.role)) {
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          user._id,
          "create_offers", // moduleKey
          "read", // action
          null // subModuleName
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to view offers"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    // Fetch offers for the clinic - return all fields defined in CreateOffer model
    const now = new Date();
    const query = clinicId ? { clinicId } : {};
    const offers = await Offer.find(query)
      .populate({ 
        path: "serviceIds", 
        select: "name serviceSlug",
        options: { strictPopulate: false } 
      })
      .populate({ 
        path: "createdBy", 
        select: "name",
        options: { strictPopulate: false } 
      })
      .populate({ 
        path: "updatedBy", 
        select: "name",
        options: { strictPopulate: false } 
      })
      .populate({ 
        path: "clinicId", 
        select: "name",
        options: { strictPopulate: false } 
      })
      .sort({ createdAt: -1 })
      .lean();

    // Compute expired status in-memory and update database for expired offers
    const expiredOfferIds = [];
    
    const shapedOffers = offers.map((offer) => {
      // If offer is active but end date has passed, mark as expired
      const isDateExpired = offer.endsAt && new Date(offer.endsAt) < now;
      const shouldBeExpired = isDateExpired && offer.status === "active";
      
      if (shouldBeExpired) {
        // Track this offer ID to update in database
        expiredOfferIds.push(offer._id);
      }
      
      return {
        ...offer,
        status: shouldBeExpired ? "expired" : offer.status,
      };
    });
    
    // Update all expired offers in database (fire and forget - don't block response)
    if (expiredOfferIds.length > 0) {
      console.log(`[OfferExpiry] Auto-expiring ${expiredOfferIds.length} offers:`, expiredOfferIds);
      Offer.updateMany(
        { _id: { $in: expiredOfferIds } },
        { $set: { status: "expired", updatedAt: now } }
      ).catch(err => {
        console.error('[OfferExpiry] Failed to update expired offers in DB:', err);
      });
    }

    // Light caching for 5s (client-side private cache)
    res.setHeader("Cache-Control", "private, max-age=5, stale-while-revalidate=30");
    res.status(200).json({ success: true, offers: shapedOffers });
  } catch (err) {
    // console.error("Error fetching offers:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
}




