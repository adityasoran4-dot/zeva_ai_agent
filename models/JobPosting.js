// models/JobPosting.ts
import mongoose from 'mongoose';

const JobPostingSchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic',
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['clinic', 'doctor', 'agent', 'doctorStaff'],
    required: true,
  },
  companyName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  department: {
    type: String,
    enum: [
      // --- Software & IT ---
      'Software Development',
      'Frontend',
      'Backend',
      'Full Stack',
      'DevOps',
      'QA & Testing',
      'Automation Testing',
      'Manual Testing',
      'UI/UX',
      'Data Science',
      'AI/ML',
      'Cloud Computing',
      'Cybersecurity',
      'Database Administration',
      'Product Management',
      'Business Analysis',

      // --- Medical & Clinical ---
      'General Medicine',
      'Cardiology',
      'Radiology',
      'Dental',
      'Pathology',
      'Pediatrics',
      'Orthopedics',
      'Gynecology',
      'Dermatology',
      'Anesthesiology',
      'Surgery',
      'ENT',
      'Psychiatry',
      'Physiotherapy',

      // --- Other ---
      'Administration',
      'Pharmacy',
      'Research',
      'Other',
    ],
    required: true,
  },
  qualification: {
    type: String,
    enum: [
      // --- Software & IT ---
      'B.Tech',
      'M.Tech',
      'BCA',
      'MCA',
      'Diploma in CS/IT',
      'B.Sc IT',
      'M.Sc IT',
      'BBA',
      'MBA',
      'Other Software',

      // --- Medical ---
      'MBBS',
      'BDS',
      'BAMS',
      'BHMS',
      'MD',
      'MS',
      'PhD',
      'Diploma',
      'Nursing',
      'Pharmacy',
      'Other Medical',

      // --- General ---
      'Graduate',
      'Post Graduate',
      '12th Pass',
      '10th Pass',
      'Other',
    ],
    required: true,
  },

  jobType: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Internship'],
    required: true,
  },
  workingDays: { type: String, default: '' },
  location: { type: String, required: true },
  jobTiming: { type: String, required: true },
  skills: [String],
  perks: [String],
  languagesPreferred: [String],
  description: { type: String },
  noOfOpenings: { type: Number, required: true },
  salary: { type: String, required: true },
  salaryType: { type: String, enum: ["month", "year"], required: true },
  establishment: { type: String },
  experience: {
    type: String, // e.g. "Fresher", "1-3 years", "5+ years"
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },
  isActive: { type: Boolean, default: true },
  slug: {
    type: String,
    unique: true,
    sparse: true, // Only unique when exists
    index: true,
  },
  slugLocked: { type: Boolean, default: false }, // Lock slug once approved
}, { timestamps: true });

delete mongoose.models.JobPosting;
export default mongoose.models.JobPosting || mongoose.model('JobPosting', JobPostingSchema);
