import dbConnect from "../../../lib/database";
import { getUserFromReq } from "../lead-ms/auth";
import { generateEmrNumber } from "../../../lib/generateEmrNumber";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    // Verify clinic authentication
    const clinicUser = await getUserFromReq(req);
    if (!clinicUser) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!["clinic", "admin", "agent", "doctor", "doctorStaff", "staff"].includes(clinicUser.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Generate next EMR number
    const nextEmrNumber = await generateEmrNumber();

    return res.status(200).json({
      success: true,
      emrNumber: nextEmrNumber,
    });
  } catch (error) {
    console.error("Error generating next EMR number:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate EMR number",
      error: error.message,
    });
  }
}

