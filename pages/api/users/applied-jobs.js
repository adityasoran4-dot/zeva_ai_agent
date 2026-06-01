import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import  "../../../models/JobPosting";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const applications = await JobApplication.find({ 
      applicantId: userId,
      jobId: { $ne: null } // Filter out applications where jobId is null
    }).populate("jobId"); // pulls full job details

    // Additional filtering to ensure populated jobId is not null
    // This handles cases where the referenced job was deleted
    const validApplications = applications.filter(app => app.jobId !== null);

    return res.status(200).json(validApplications);
  } catch {
    console.error("Error fetching applied jobs:", error);
    return res.status(500).json({ message: "Server error" });
  }
}