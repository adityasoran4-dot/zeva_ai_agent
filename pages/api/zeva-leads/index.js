import dbConnect from "../../../lib/database";
import ZevaLead from "../../../models/ZevaLead";

export default async function handler(req, res) {
  await dbConnect();

  res.setHeader("Allow", ["POST", "GET"]);

  if (!["POST", "GET"].includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  if (req.method === "POST") {
    try {
      const { name, email, phone, clinicName, source } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Valid name is required" });
      }
      if (!email || typeof email !== "string" || email.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Valid email is required" });
      }
      if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Valid phone is required" });
      }

      const newZevaLead = new ZevaLead({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        clinicName: clinicName?.trim() || "",
        source: source || "Website Form",
      });

      await newZevaLead.save();

      return res.status(201).json({
        success: true,
        message: "Demo request submitted successfully",
        data: newZevaLead,
      });
    } catch (err) {
      console.error("Error creating zeva lead:", err);
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
      const search = req.query.search?.trim();

      let query = {};

      if (search) {
        query.$or = [
          {
            name: { $regex: search, $options: "i" },
            email: { $regex: search, $options: "i" },
            phone: { $regex: search, $options: "i" },
            clinicName: { $regex: search, $options: "i" },
          },
        ];
      }

      const totalZevaLeads = await ZevaLead.countDocuments(query);

      // Calculate analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [leadsToday, leadsThisWeek] = await Promise.all([
        ZevaLead.countDocuments({ createdAt: { $gte: today } }),
        ZevaLead.countDocuments({ createdAt: { $gte: lastWeek } }),
      ]);

      const zevaLeads = await ZevaLead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPages = Math.ceil(totalZevaLeads / limit);

      return res.status(200).json({
        success: true,
        message: "Zeva leads fetched successfully",
        data: {
          leads: zevaLeads,
          stats: {
            totalLeads: totalZevaLeads,
            leadsToday,
            leadsThisWeek,
          },
          pagination: {
            totalResults: totalZevaLeads,
            totalPages,
            currentPage: page,
            limit,
            hasMore: page < totalPages,
          },
        },
      });
    } catch (err) {
      console.error("Error fetching zeva leads:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  }
}
