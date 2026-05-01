import dbConnect from "../../../lib/database";
import Offer from "../../../models/CreateOffer";
import Service from "../../../models/Service";
import Department from "../../../models/Department";
import Clinic from "../../../models/Clinic";  
import { getUserFromReq, requireRole } from "./auth";
import { getClinicIdFromUser, checkClinicPermission } from "./permissions-helper";
import { checkAgentPermission } from "../agent/permissions-helper";
import { getRobotsMetaForEntity } from "../../../lib/seo/RobotsService";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

   if (!requireRole(user, ["clinic", "admin", "agent", "doctor", "doctorStaff"])) {
  return res.status(403).json({ success: false, message: "Access denied" });
}

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const data = req.body;
    const requiredFields = ["title", "offerType", "startsAt", "endsAt"];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    // ✅ Resolve clinicId based on role
    const { clinicId, error, isAdmin } = await getClinicIdFromUser(user);
    let resolvedClinicId = clinicId;

    if (error && !isAdmin) {
      return res.status(404).json({ success: false, message: error });
    }

    if (isAdmin) {
      if (!data.clinicId) {
        return res.status(400).json({ success: false, message: "clinicId is required for admins" });
      }
      const clinic = await Clinic.findById(data.clinicId);
      if (!clinic) {
        return res.status(404).json({ success: false, message: "Clinic not found" });
      }
      resolvedClinicId = clinic._id;
    }

    if (!resolvedClinicId) {
      return res.status(400).json({ success: false, message: "Clinic not found for this user" });
    }

    // ✅ Check permission for creating offers (only for doctorStaff and agent, clinic/admin/doctor bypass)
    if (!["admin", "clinic", "doctor"].includes(user.role)) {
      // If user is doctorStaff or agent, check create permission for create_offers module
      if (['agent', 'doctorStaff'].includes(user.role)) {
        const { hasPermission, error: permissionError } = await checkAgentPermission(
          user._id,
          "create_offers", // moduleKey
          "create", // action
          null // subModuleName
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: permissionError || "You do not have permission to create offers"
          });
        }
      }
      // Clinic, admin, and doctor users bypass permission checks
    }


    // ✅ Resolve serviceIds from direct selection
    let serviceIds = [];

    if (Array.isArray(data.serviceIds) && data.serviceIds.length > 0) {
      for (const idOrSlug of data.serviceIds) {
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
          // If it's already a valid ObjectId, we trust it and add it
          serviceIds.push(new mongoose.Types.ObjectId(idOrSlug));
        } else {
          // If it's a slug, we try to resolve it to an ID
          const service = await Service.findOne({
            clinicId: resolvedClinicId,
            $or: [{ serviceSlug: idOrSlug }, { name: idOrSlug }],
          });
          if (service) {
            serviceIds.push(service._id);
          }
        }
      }

      // Ensure unique IDs
      serviceIds = Array.from(new Set(serviceIds.map((id) => id.toString()))).map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    // ✅ Resolve serviceIds from departmentIds
    if (Array.isArray(data.departmentIds) && data.departmentIds.length > 0) {
      const departmentServiceIds = await Service.find({
        clinicId: resolvedClinicId,
        departmentId: { $in: data.departmentIds.map(id => new mongoose.Types.ObjectId(id)) }
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
    if (Array.isArray(data.departmentIds) && data.departmentIds.length > 0) {
      const departments = await Department.find({
        _id: { $in: data.departmentIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).select('name').lean();
      departmentNames = departments.map(d => d.name);
    }

    // ✅ Check if any of the selected services are already linked to another active offer
    // Skip this check if forceUpdate is true (user confirmed they want to proceed)
    if (serviceIds.length > 0 && !data.applyOnAllServices && !data.forceUpdate) {
      const existingOffers = await Offer.find({
        clinicId: resolvedClinicId,
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

    const offer = new Offer({
      clinicId: resolvedClinicId,
      title: data.title,
      description: data.description || "",
      offerType: data.offerType,
      code: data.code || undefined,
      slug: data.slug || undefined,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      timezone: data.timezone || "Asia/Kolkata",
      status: data.status || "draft",
      enabled: data.enabled ?? true,

      // Applicability
      applyOnAllServices: data.applyOnAllServices ?? true,
      serviceIds: serviceIds,
      departmentIds: data.departmentIds || [],
      serviceNames: serviceNames,
      departmentNames: departmentNames,
      doctorIds: data.doctorIds || [],

      // Stacking & Rules
      allowCombiningWithOtherOffers: data.allowCombiningWithOtherOffers || false,
      allowReceptionistDiscount: data.allowReceptionistDiscount || false,
      maxBenefitCap: data.maxBenefitCap || 0,
      minimumBillAmount: data.minimumBillAmount || 0,
      marginThresholdPercent: data.marginThresholdPercent || 0,
      sameDayReuseBlocked: data.sameDayReuseBlocked ?? true,
      partialPaymentAllowed: data.partialPaymentAllowed || false,

      // Smart Toggles
      autoApplyBestOffer: data.autoApplyBestOffer ?? true,
      allowManualOverride: data.allowManualOverride || false,
      requireApprovalForOverride: data.requireApprovalForOverride ?? true,
      blockIfProfitMarginBelowX: data.blockIfProfitMarginBelowX ?? true,

      // Type Specific
      discountMode: data.discountMode || null,
      discountValue: data.discountValue || 0,
      cashbackAmount: data.cashbackAmount || 0,
      cashbackExpiryDays: data.cashbackExpiryDays || 0,
      buyQty: data.buyQty || 0,
      freeQty: data.freeQty || 0,

      createdBy: user._id,
      updatedBy: user._id,
    });

    await offer.save();

    // Generate robots meta tags for the offer
    try {
      // console.log(`🤖 [SEO] Generating robots meta for offer: ${offer._id}`);
      
      // Create a simple indexing decision for the offer
      // Active offers should be indexed, others should not
      const shouldIndex = offer.status === 'active' && 
                         offer.title && 
                         offer.description && 
                         offer.endsAt && 
                         new Date(offer.endsAt) > new Date();
      
      const indexingDecision = {
        shouldIndex: shouldIndex,
        reason: shouldIndex ? 'Offer is active and valid' : 'Offer is not active or expired',
        priority: shouldIndex ? 'high' : 'low',
        warnings: [],
      };

      const robotsMeta = await getRobotsMetaForEntity('offer', offer._id.toString(), indexingDecision);
      
      // console.log(`   📊 Robots Meta Result:`, JSON.stringify({
      //   content: robotsMeta.content,
      //   noindex: robotsMeta.noindex,
      //   nofollow: robotsMeta.nofollow,
      // }, null, 2));
      
      // You can store robotsMeta in the offer if needed, or just log it
      // For now, we'll just log it
    } catch (robotsError) {
      // console.error("❌ Robots meta generation error (non-fatal):", robotsError.message);
    }

    return res.status(201).json({ success: true, offer });
  } catch (err) {
    // console.error("Error creating offer:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
}
