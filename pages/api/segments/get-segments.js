import dbConnect from "../../../lib/database";
import Clinic from "../../../models/Clinic";
import Segment from "../../../models/Segment";
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
      const {
        status,
        name,
        startDate,
        endDate,
        page: pageQuery,
        limit: limitQuery,
      } = req.query;

      const filter = { clinicId: clinic._id };

      if (status) filter.status = status;
      if (name) filter.name = { $regex: name, $options: "i" };
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      // Pagination defaults & sanitization
      const page = Math.max(1, parseInt(pageQuery || "1", 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(limitQuery || "20", 10))
      ); // default 20, max 100
      const skip = (page - 1) * limit;

      // Total count for the filtered query
      const totalCount = await Segment.countDocuments(filter);
      // Calculate pages
      const totalPages = Math.ceil(totalCount / limit);

      const segments = await Segment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Pagination meta
      const currentPage = page;
      const hasMore = page < totalPages;

      return res.status(200).json({
        success: true,
        message: "Segments Fetched Successfully",
        segments,
        pagination: {
          totalSegments: totalCount,
          totalPages,
          currentPage,
          limit,
          hasMore,
        },
      });
    } catch (error) {
      console.error("Error fetching segments:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch segments" });
    }
  } catch (error) {
    console.error("Get Segments error: ", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal server error",
    });
  }
}
