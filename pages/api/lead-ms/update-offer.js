// File: /pages/api/lead-ms/update-offer.js
import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import Service from "../../../models/Service";
import Department from "../../../models/Department";
import Clinic from "../../../models/Clinic";
import { getUserFromReq, requireRole } from "./auth";
import { checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const user = await getUserFromReq(req);
    if (!user)
      return res.status(401).json({ success: false, message: "User not authenticated" });

    // ✅ Allow clinic, agent, admin, doctor, and doctorStaff
    if (!requireRole(user, ["clinic", "agent", "admin", "doctor", "doctorStaff"]))
      return res.status(403).json({ success: false, message: "Access denied" });

    const { id } = req.query;
    if (!id || !mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Valid offerId is required" });

    // ✅ First, get the offer to determine which clinic it belongs to
    const offer = await Offer.findById(id);
    if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

    // ✅ Resolve clinic based on role
    let clinic;
    if (user.role === "clinic") {
      clinic = await Clinic.findOne({ owner: user._id }).select("_id");
      // Ensure the offer belongs to this clinic
      if (offer.clinicId.toString() !== clinic._id.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed to access this offer" });
      }
    } else if (user.role === "agent" || user.role === "doctorStaff") {
      if (!user.clinicId)
        return res.status(403).json({ success: false, message: "User not linked to a clinic" });
      clinic = await Clinic.findById(user.clinicId).select("_id");
      // Ensure the offer belongs to this clinic
      if (offer.clinicId.toString() !== clinic._id.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed to access this offer" });
      }
    } else if (user.role === "doctor") {
      if (!user.clinicId)
        return res.status(403).json({ success: false, message: "Doctor not linked to a clinic" });
      clinic = await Clinic.findById(user.clinicId).select("_id");
      if (!clinic) {
        return res.status(403).json({ success: false, message: "Clinic not found" });
      }
      if (offer.clinicId.toString() !== clinic._id.toString()) {
        return res.status(403).json({ success: false, message: "Not allowed to access this offer" });
      }
    } else if (user.role === "admin") {
      // Admin can access any offer
      clinic = await Clinic.findById(offer.clinicId).select("_id");
      if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    if (!clinic) return res.status(404).json({ success: false, message: "Clinic not found" });

    // ✅ Check permission for reading/updating offers (only for doctorStaff and agent, clinic/admin/doctor bypass)
    const action = req.method === "GET" ? "read" : "update";
    if (!["admin", "clinic", "doctor"].includes(user.role)) {
      // If user is doctorStaff or agent, check permission for create_offers module
      if (['agent', 'doctorStaff'].includes(user.role)) {
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          user._id,
          "create_offers", // moduleKey
          action, // action (read or update)
          null // subModuleName
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || `You do not have permission to ${action} offers`
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }

    // 🔹 GET: Fetch offer for editing
    if (req.method === "GET") {
      // Return the offer as-is from the database without modifying it
      // Do NOT auto-update status to expired - let the UI display the exact data from DB
      
      return res.status(200).json({
        success: true,
        offer: offer.toObject(),
      });
    }

    // 🔹 PUT: Update offer
    if (req.method === "PUT") {
      const data = req.body;

      // ✅ Resolve serviceIds from direct selection
      let serviceIds = [];

      if (Array.isArray(data.serviceIds) && data.serviceIds.length > 0) {
        for (const item of data.serviceIds) {
          if (mongoose.Types.ObjectId.isValid(item)) {
            // If it's already a valid ObjectId, we trust it and add it
            serviceIds.push(new mongoose.Types.ObjectId(item));
          } else {
            // If it's a slug, we try to resolve it to an ID
            const slug = typeof item === "string" ? item : item.slug;
            if (slug) {
              const service = await Service.findOne({
                clinicId: clinic._id,
                $or: [{ serviceSlug: slug }, { name: slug }],
              });
              if (service) {
                serviceIds.push(service._id);
              }
            }
          }
        }

        // Ensure unique IDs
        serviceIds = Array.from(new Set(serviceIds.map((id) => id.toString()))).map(
          (id) => new mongoose.Types.ObjectId(id)
        );
      }

      // ✅ Resolve serviceIds from departmentIds
      const resolvedDepartmentIds = data.departmentIds || offer.departmentIds || [];
      if (Array.isArray(resolvedDepartmentIds) && resolvedDepartmentIds.length > 0) {
        const departmentServiceIds = await Service.find({
          clinicId: clinic._id,
          departmentId: { $in: resolvedDepartmentIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).distinct('_id');
        
        // Merge with existing serviceIds
        serviceIds = serviceIds.concat(departmentServiceIds);
        
        // Ensure unique IDs
        serviceIds = Array.from(new Set(serviceIds.map((id) => id.toString()))).map(
          (id) => new mongoose.Types.ObjectId(id)
        );
      }

      // ✅ Cache service names for display purposes
      let serviceNames = [];
      if (serviceIds.length > 0) {
        const services = await Service.find({
          _id: { $in: serviceIds }
        }).select('name').lean();
        serviceNames = services.map(s => s.name);
      }

      // ✅ Cache department names for display purposes
      let departmentNames = [];
      if (resolvedDepartmentIds.length > 0) {
        const departments = await Department.find({
          _id: { $in: resolvedDepartmentIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).select('name').lean();
        departmentNames = departments.map(d => d.name);
      }
      
      // ✅ Check if any of the selected services are already linked to another active offer (exclude current offer)
      // Skip this check if forceUpdate is true (user confirmed they want to proceed)
      if (serviceIds.length > 0 && !data.applyOnAllServices && !data.forceUpdate) {
        const existingOffers = await Offer.find({
          clinicId: clinic._id,
          _id: { $ne: id }, // Exclude current offer
          status: { $in: ['active', 'draft'] },
          serviceIds: { $in: serviceIds }
        }).populate('serviceIds', 'name');
      
        if (existingOffers.length > 0) {
          // Find which services are already linked
          const linkedServices = new Set();
          existingOffers.forEach(offer => {
            offer.serviceIds.forEach(service => {
              const serviceIdStr = service._id ? service._id.toString() : service.toString();
              if (serviceIds.some(sid => sid.toString() === serviceIdStr)) {
                linkedServices.add(service.name || serviceIdStr);
              }
            });
          });
      
          if (linkedServices.size > 0) {
            const serviceNames = Array.from(linkedServices).join(', ');
            return res.status(400).json({
              success: false,
              message: `The following treatments are already linked with another offer: ${serviceNames}`
            });
          }
        }
      }

      // Update fields
      offer.title = data.title ?? offer.title;
      offer.description = data.description ?? offer.description;
      offer.offerType = data.offerType ?? offer.offerType;
      offer.code = data.code ?? offer.code;
      offer.slug = data.slug ?? offer.slug;
      offer.startsAt = data.startsAt ? new Date(data.startsAt) : offer.startsAt;
      offer.endsAt = data.endsAt ? new Date(data.endsAt) : offer.endsAt;
      offer.timezone = data.timezone ?? offer.timezone;
      offer.status = data.status ?? offer.status;
      offer.enabled = data.enabled !== undefined ? Boolean(data.enabled) : offer.enabled;

      // Applicability
      offer.applyOnAllServices = data.applyOnAllServices ?? offer.applyOnAllServices;
      if (serviceIds.length > 0) offer.serviceIds = serviceIds;
      offer.departmentIds = data.departmentIds ?? offer.departmentIds;
      offer.serviceNames = serviceNames;
      offer.departmentNames = departmentNames;
      offer.doctorIds = data.doctorIds ?? offer.doctorIds;

      // Stacking & Rules
      offer.allowCombiningWithOtherOffers = data.allowCombiningWithOtherOffers ?? offer.allowCombiningWithOtherOffers;
      offer.allowReceptionistDiscount = data.allowReceptionistDiscount ?? offer.allowReceptionistDiscount;
      offer.maxBenefitCap = data.maxBenefitCap !== undefined ? Number(data.maxBenefitCap) : offer.maxBenefitCap;
      offer.minimumBillAmount = data.minimumBillAmount !== undefined ? Number(data.minimumBillAmount) : offer.minimumBillAmount;
      offer.marginThresholdPercent = data.marginThresholdPercent !== undefined ? Number(data.marginThresholdPercent) : offer.marginThresholdPercent;
      offer.sameDayReuseBlocked = data.sameDayReuseBlocked ?? offer.sameDayReuseBlocked;
      offer.partialPaymentAllowed = data.partialPaymentAllowed ?? offer.partialPaymentAllowed;

      // Smart Toggles
      offer.autoApplyBestOffer = data.autoApplyBestOffer ?? offer.autoApplyBestOffer;
      offer.allowManualOverride = data.allowManualOverride ?? offer.allowManualOverride;
      offer.requireApprovalForOverride = data.requireApprovalForOverride ?? offer.requireApprovalForOverride;
      offer.blockIfProfitMarginBelowX = data.blockIfProfitMarginBelowX ?? offer.blockIfProfitMarginBelowX;

      // Type Specific
      offer.discountMode = data.discountMode ?? offer.discountMode;
      offer.discountValue = data.discountValue !== undefined ? Number(data.discountValue) : offer.discountValue;
      offer.cashbackAmount = data.cashbackAmount !== undefined ? Number(data.cashbackAmount) : offer.cashbackAmount;
      offer.cashbackExpiryDays = data.cashbackExpiryDays !== undefined ? Number(data.cashbackExpiryDays) : offer.cashbackExpiryDays;
      offer.buyQty = data.buyQty !== undefined ? Number(data.buyQty) : offer.buyQty;
      offer.freeQty = data.freeQty !== undefined ? Number(data.freeQty) : offer.freeQty;

      offer.updatedBy = user._id;
      offer.updatedAt = new Date();

      await offer.save();

      return res.status(200).json({ success: true, offer });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (err) {
    // console.error("Error in update-offer:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}
