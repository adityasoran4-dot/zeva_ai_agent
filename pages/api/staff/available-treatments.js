import dbConnect from "../../../lib/database";
import Treatment from "../../../models/Treatment";
import { getAuthorizedStaffUser } from "../../../server/staff/authHelpers";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await getAuthorizedStaffUser(req);
    const treatments = await Treatment.find({})
      .select("name subcategories")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ success: true, treatments });
  } catch (error) {
    const status = error.status || 500;
    const message = error.message || "Failed to load treatments";
    return res.status(status).json({ success: false, message });
  }
}


