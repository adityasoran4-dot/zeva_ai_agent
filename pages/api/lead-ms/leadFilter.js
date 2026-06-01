// /pages/api/lead-ms/leadFilter.js
import dbConnect from "../../../lib/database";
import Lead from "../../../models/Lead";
import Clinic from "../../../models/Clinic";
import Treatment from "../../../models/Treatment";
import User from "../../../models/Users";
import { getUserFromReq, requireRole } from "./auth";
import { checkAgentPermission } from "../agent/permissions-helper";

export default async function handler(req, res) {
  await dbConnect();

  const me = await getUserFromReq(req);
  if (
    !requireRole(me, [
      "clinic",
      "agent",
      "admin",
      "doctor",
      "doctorStaff",
      "staff",
    ])
  ) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // ✅ Resolve clinicId based on role
  let clinic;
  if (me.role === "clinic") {
    clinic = await Clinic.findOne({ owner: me._id });
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(403)
        .json({ success: false, message: "Agent not linked to any clinic" });
    }
    clinic = await Clinic.findById(me.clinicId);
  } else if (me.role === "doctor") {
    // Doctor uses their clinicId if they have one
    if (!me.clinicId) {
      return res
        .status(403)
        .json({ success: false, message: "Doctor not linked to any clinic" });
    }
    clinic = await Clinic.findById(me.clinicId);
  } else if (me.role === "doctorStaff" || me.role === "staff") {
    // DoctorStaff/Staff uses their clinicId if they have one
    if (!me.clinicId) {
      return res
        .status(403)
        .json({ success: false, message: "Staff not linked to any clinic" });
    }
    clinic = await Clinic.findById(me.clinicId);
  } else if (me.role === "admin") {
    // Admin can access all leads, but we still need clinicId if provided
    const { clinicId: adminClinicId } = req.query;
    if (adminClinicId) {
      clinic = await Clinic.findById(adminClinicId);
    }
  }

  if (!clinic) {
    return res
      .status(404)
      .json({ success: false, message: "Clinic not found for this user" });
  }

  // ✅ Check permission for reading leads (only for clinic, agent, doctor, and doctorStaff/staff; admin bypasses)
  if (me.role !== "admin" && clinic._id) {
    try {
      // First check if clinic has read permission for "create_lead" module
      const { checkClinicPermission } = await import("./permissions-helper");
      // console.log("[leadFilter] Checking permission for", {
      //   role: me.role,
      //   clinicId: clinic._id?.toString(),
      //   moduleKey: "create_lead",
      //   action: "read",
      // });
      // Pass the user's role to check role-specific permissions (doctor uses 'doctor' role, clinic uses 'clinic' role)
      const { hasPermission: clinicHasPermission, error: clinicError } =
        await checkClinicPermission(
          clinic._id,
          "create_lead", // Check "create_lead" module permission
          "read",
          null, // No submodule - this is a module-level check
          me.role === "doctor"
            ? "doctor"
            : me.role === "clinic"
            ? "clinic"
            : null
        );

      // console.log("[leadFilter] Permission check result", {
      //   hasPermission: clinicHasPermission,
      //   error: clinicError,
      //   role: me.role,
      // });

      if (!clinicHasPermission) {
        return res.status(403).json({
          success: false,
          message: clinicError || "You do not have permission to view leads",
        });
      }
    } catch (permError) {
      // console.error("[leadFilter] Error checking permissions:", permError);
      return res.status(500).json({
        success: false,
        message: "Error checking permissions",
        error: permError.message,
      });
    }

    // If user is an agent, also check agent-specific permissions
    if (me.role === "agent") {
      const { hasPermission: agentHasPermission, error: agentError } =
        await checkAgentPermission(
          me._id,
          "create_lead", // Check "create_lead" module permission
          "read",
          null // No submodule
        );

      if (!agentHasPermission) {
        return res.status(403).json({
          success: false,
          message: agentError || "You do not have permission to view leads",
        });
      }
    }
    // Doctor and doctorStaff/staff roles use clinic permissions (no separate permission check needed)
  }

  if (req.method === "GET") {
    try {
      const {
        treatment,
        offer,
        source,
        status,
        name,
        startDate,
        endDate,
        page: pageQuery,
        limit: limitQuery,
        segmentId,
      } = req.query;

      const filter = { clinicId: clinic._id };

      if (treatment) filter["treatments.treatment"] = treatment;
      if (offer) filter.offerTag = offer;
      if (source) filter.source = source;
      if (status) filter.status = status;
      if (name) filter.name = { $regex: name, $options: "i" };
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (segmentId) {
        // This finds leads where segments array contains the segmentId
        filter.segments = { $in: [segmentId] };
      }

      // Pagination defaults & sanitization
      const page = Math.max(1, parseInt(pageQuery || "1", 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(limitQuery || "20", 10))
      ); // default 20, max 100
      const skip = (page - 1) * limit;

      // Total count for the filtered query
      const totalCount = await Lead.countDocuments(filter);

      // Calculate pages
      const totalPages = Math.ceil(totalCount / limit);

      const leads = await Lead.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate({
          path: "treatments.treatment",
          model: "Treatment",
          select: "name",
        })
        .populate({
          path: "assignedTo.user",
          model: "User",
          select: "name role email",
        })
        .populate({ path: "notes.addedBy", model: "User", select: "name" })
        .lean();

      // Pagination meta
      const currentPage = page;
      const hasMore = page < totalPages;

      return res.status(200).json({
        success: true,
        leads,
        pagination: {
          totalLeads: totalCount,
          totalPages,
          currentPage,
          limit,
          hasMore,
        },
      });
    } catch (err) {
      // console.error("Error fetching leads:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch leads" });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
