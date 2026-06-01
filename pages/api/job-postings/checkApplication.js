import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { jobId, applicantId } = req.query;

    if (!jobId || !applicantId) {
      return res.status(400).json({ message: "Missing jobId or applicantId" });
    }

    const existing = await JobApplication.findOne({ jobId, applicantId });

    return res.status(200).json({ applied: !!existing });
  } catch (err) {
    // console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
