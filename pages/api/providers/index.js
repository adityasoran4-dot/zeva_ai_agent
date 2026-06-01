import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Provider from "../../../models/Provider";
import { getUserFromReq, requireRole } from "../lead-ms/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: `${req.method} - Method not allowed` });
  }
  try {
    await dbConnect();

    const me = await getUserFromReq(req);
    // console.log({ me });
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

    // ✅TODO: Check permission for reading leads (only for clinic, agent, doctor, and doctorStaff/staff; admin bypasses)
    if (me.role !== "admin" && clinic._id) {
      // For Get Provider Permissions
    }

    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search
        ? req.query.search.trim().toLowerCase()
        : null;
      const status = req.query.status || "all";
      const type = req.query.type || "all";

      let query = { clinicId: clinic._id };
      if (search) {
        query.$or = [
          { label: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (status !== "all") {
        query.status = status;
      }

      if (type !== "all") {
        query.type = { $in: [type] };
      }

      const totalProviders = await Provider.countDocuments(query);

      const providers = await Provider.find(query)
        .select("-secrets -_ac -_ct")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPages = Math.ceil(totalProviders / limit);
      const hasMore = page * limit < totalProviders;

      return res.status(200).json({
        success: true,
        message: "Providers fetched successfully",
        data: providers,
        pagination: {
          totalResults: totalProviders,
          totalPages,
          currentPage: page,
          limit,
          hasMore,
        },
      });
    } catch (error) {
      // console.error("Error fetching provider:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch providers" });
    }
  } catch (error) {
    // console.error("Get Providers error: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
