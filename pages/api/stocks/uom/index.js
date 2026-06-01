import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import UOM from "../../../../models/stocks/UOM"; // Assuming the model is named UOM
import dbConnect from "../../../../lib/database";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["POST", "GET"]);

  if (!["POST", "GET"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  const me = await getUserFromReq(req);
  if (!me) {
    return res
      .status(401)
      .json({ success: false, message: "Not authenticated" });
  }

  if (!requireRole(me, ["clinic", "agent", "admin", "doctor", "doctorStaff"])) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  // Get clinicId based on user role
  let clinicId;
  if (me.role === "clinic") {
    const clinic = await Clinic.findOne({ owner: me._id });
    if (!clinic) {
      return res.status(400).json({
        success: false,
        message: "Clinic not found for this user",
      });
    }
    clinicId = clinic._id;
  } else if (me.role === "agent") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Agent not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "doctor" || me.role === "doctorStaff") {
    if (!me.clinicId) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not tied to a clinic" });
    }
    clinicId = me.clinicId;
  } else if (me.role === "admin") {
    clinicId = req.body.clinicId || req.query.clinicId;
    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: "clinicId is required for admin",
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  if (req.method === "POST") {
    try {
      const { name, category, status } = req.body;

      // Validation
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Valid name is required",
        });
      }

      if (category && !["Main", "Sub"].includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Category must be either 'Main' or 'Sub'",
        });
      }

      if (status && !["Active", "Inactive", "Allocated"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      // Check for duplicate UOM name in same clinic
      const existingUOM = await UOM.findOne({
        clinicId,
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });

      if (existingUOM) {
        return res.status(409).json({
          success: false,
          message: "UOM with this name already exists",
        });
      }

      const newUOM = new UOM({
        clinicId,
        name: name.trim(),
        category: category || "Main",
        status: status || "Allocated",
        createdBy: me._id,
      });

      await newUOM.save();

      return res.status(201).json({
        success: true,
        message: "UOM added successfully.",
        data: newUOM,
      });
    } catch (err) {
      console.error("Error in add UOM:", err);

      // Handle mongoose validation errors
      if (err.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: Object.values(err.errors)
            .map((e) => e.message)
            .join(", "),
        });
      }

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else if (req.method === "GET") {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const skip = (page - 1) * limit;
      const search = req.query.search?.trim() || null;
      const category = req.query.category; // Optional filter by category
      const status = req.query.status; // Optional filter by status

      let query = { clinicId };

      // Search functionality
      if (search) {
        query.$or = [{ name: { $regex: search, $options: "i" } }];
      }

      // Filter by category
      if (category && ["Main", "Sub"].includes(category)) {
        query.category = category;
      }

      // Filter by status
      if (status && ["Active", "Inactive", "Allocated"].includes(status)) {
        query.status = status;
      }

      // Execute queries in parallel for better performance
      const [totalUOMs, uoms] = await Promise.all([
        UOM.countDocuments(query),
        UOM.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ]);

      const totalPages = Math.ceil(totalUOMs / limit);
      const hasMore = page < totalPages;

      // Get counts by category for statistics
      const categoryCounts = await Promise.all([
        UOM.countDocuments({ ...query, category: "Main" }),
        UOM.countDocuments({ ...query, category: "Sub" }),
      ]);

      return res.status(200).json({
        success: true,
        message: "UOMs fetched successfully.",
        data: {
          uoms,
          statistics: {
            total: totalUOMs,
            mainCategory: categoryCounts[0],
            subCategory: categoryCounts[1],
          },
          pagination: {
            totalResults: totalUOMs,
            totalPages,
            currentPage: page,
            limit,
            hasMore,
          },
        },
      });
    } catch (err) {
      console.error("Error in fetch UOMs:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
