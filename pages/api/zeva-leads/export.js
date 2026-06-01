import dbConnect from "../../../lib/database";
import ZevaLead from "../../../models/ZevaLead";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const search = req.query.search?.trim();
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { clinicName: { $regex: search, $options: "i" } },
      ];
    }

    const leads = await ZevaLead.find(query).sort({ createdAt: -1 }).lean();

    // Define CSV headers
    const headers = ["Name", "Email", "Phone", "Clinic Name", "Date Received"];

    // Convert data to CSV rows
    const rows = leads.map((lead) => {
      return [
        `"${(lead.name || "").replace(/"/g, '""')}"`,
        `"${(lead.email || "").replace(/"/g, '""')}"`,
        `"${(lead.phone || "").replace(/"/g, '""')}"`,
        `"${(lead.clinicName || "").replace(/"/g, '""')}"`,
        `"${new Date(lead.createdAt).toLocaleString()}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=zeva-leads-${new Date().toISOString().split("T")[0]}.csv`,
    );

    return res.status(200).send(csvContent);
  } catch (err) {
    console.error("Error exporting zeva leads:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
}
