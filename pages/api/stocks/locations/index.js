import { getUserFromReq, requireRole } from "../../lead-ms/auth";
import Clinic from "../../../../models/Clinic";
import StockLocation from "../../../../models/stocks/StockLocation";
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
    clinicId = req.body.clinicId;
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
      const { location } = req.body;

      const newLocation = new StockLocation({
        clinicId,
        location,
        createdBy: me._id,
      });
      await newLocation.save();

      res.status(201).json({
        success: true,
        message: "Stock Location added successfully.",
        location: newLocation,
      });
    } catch (err) {
      console.error("Error in add stock locations:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else if (req.method === "GET") {
    // Get all locations with pagination
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const search = req.query.search
        ? req.query.search.trim().toLowerCase()
        : null;

      let query = { clinicId };

      if (search) {
        query.$or = [{ location: { $regex: search, $options: "i" } }];
      }

      const totalLocations = await StockLocation.countDocuments(query);

      const locations = await StockLocation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPages = Math.ceil(totalLocations / limit);
      const hasMore = page * limit < totalLocations;

      res.status(200).json({
        success: true,
        message: "Stock location fetched successfully.",
        locations,
        pagination: {
          totalResults: totalLocations,
          totalPages,
          currentPage: page,
          limit,
          hasMore,
        },
      });
    } catch (err) {
      console.error("Error in fetch stock locations:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
