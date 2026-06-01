// cron/cleanupJobs.js
import dbConnect from "../../../lib/database.js";
import mongoose from "mongoose";

// Import your schemas
import JobApplicationSchema from "../../../models/JobApplication.js";
import JobPostingSchema from "../../../models/JobPosting.js";

// Safely register models
const JobApplication = mongoose.models.JobApplication || mongoose.model("JobApplication", JobApplicationSchema);
const JobPosting = mongoose.models.JobPosting || mongoose.model("JobPosting", JobPostingSchema);

async function cleanupJobs() {
  try {
    // ✅ Ensure DB connection
    await dbConnect();

    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);

    // 1. DELETE Rejected Applications older than 6 months
    const rejectedDeleted = await JobApplication.deleteMany({
      status: "rejected",
      createdAt: { $lt: sixMonthsAgo },
    });

    // 2. Find expired jobs where isActive is false
    const expiredJobs = await JobPosting.find({
      isActive: false,
      updatedAt: { $lt: twoMonthsAgo },
    });

    // 3. DELETE applications for expired jobs older than 2 months
    const expiredJobIds = expiredJobs.map((job) => job._id);
    const expiredAppsDeleted = await JobApplication.deleteMany({
      jobId: { $in: expiredJobIds },
      createdAt: { $lt: twoMonthsAgo },
    });

    console.log("🧹 Cleanup complete:");
    // console.log(- Rejected applications deleted: ${rejectedDeleted.deletedCount});
    // console.log(- Expired job applications deleted: ${expiredAppsDeleted.deletedCount});
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
  }
}

// Run immediately on startup
cleanupJobs();

// Schedule to run every 5 minutes
setInterval(cleanupJobs, 5 * 60 * 1000);