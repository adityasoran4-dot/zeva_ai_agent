import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobPosting",
    required: true,
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applicantInfo: {
    name: String,
    email: String,
    phone: String,
    role: String,
  },
  resume: {
    type: String, // Store resume file path or URL
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "contacted", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

delete mongoose.models.JobApplication;

export default mongoose.models.JobApplication ||
  mongoose.model("JobApplication", JobApplicationSchema);
