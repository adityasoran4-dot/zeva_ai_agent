import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Provider from "../../../models/Provider";
import Template from "../../../models/Template";
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
      // For Get Segments Permissions
    }

    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search
        ? req.query.search.trim().toLowerCase()
        : null;
      // Agar ek ya multiple statuses aaye, unko array me convert karo
      const parseQueryArray = (queryParam) => {
        if (!queryParam) return [];

        try {
          if (Array.isArray(queryParam)) {
            return queryParam;
          }

          // Handle comma-separated string
          if (typeof queryParam === "string" && queryParam.includes(",")) {
            return queryParam
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
          }

          // Handle JSON string
          const parsed = JSON.parse(queryParam);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
          // If JSON parsing fails, treat as single value
          return [String(queryParam)];
        }
      };

      const statuses = parseQueryArray(req.query.statuses);
      const types = parseQueryArray(req.query.types);
      let query = { clinicId: clinic._id };

      if (search) {
        query.$or = [{ name: { $regex: search, $options: "i" } }];
      }

      if (statuses.length > 0) {
        query.status = { $in: statuses };
      }

      if (types.length > 0) {
        query.templateType = { $in: types };
      }

      const totalTemplates = await Template.countDocuments(query);

      const templates = await Template.find(query)
        .populate("provider")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .then((templates) =>
          templates.map((template) => {
            if (template.provider) {
              const { secrets, _ac, _ct, ...filteredProvider } =
                template.provider;
              template.provider = filteredProvider;
            }
            return template;
          })
        );

      const totalPages = Math.ceil(totalTemplates / limit);
      const hasMore = page * limit < totalTemplates;

      res.status(200).json({
        success: true,
        message: "Found.",
        templates,
        pagination: {
          totalResults: totalTemplates,
          totalPages,
          currentPage: page,
          limit,
          hasMore,
        },
      });
    } catch (error) {
      // console.error("E/rror fetching provider:", error);
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
