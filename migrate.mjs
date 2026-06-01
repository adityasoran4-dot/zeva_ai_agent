
import dotenv from "dotenv";
dotenv.config({ path: ".env" }); 
console.log("Loaded MONGODB_URI:", process.env.MONGODB_URI);


import dbConnect from "./lib/database.js";
import JobPosting from "./models/JobPosting.js";


const migrate = async () => {
  await dbConnect();

  // 1. Add default experience where missing
  await JobPosting.updateMany(
    { experience: { $exists: false } },
    { $set: { experience: "Fresher" } }
  );

  // 2. Normalize qualification (fallback to "Other")
  const allowedQualifications = [
    "B.Tech", "M.Tech", "BCA", "MCA", "Diploma in CS/IT",
    "B.Sc IT", "M.Sc IT", "BBA", "MBA", "Other Software",
    "MBBS", "BDS", "BAMS", "BHMS", "MD", "MS", "PhD",
    "Diploma", "Nursing", "Pharmacy", "Other Medical",
    "Graduate", "Post Graduate", "12th Pass", "10th Pass", "Other"
  ];

  await JobPosting.updateMany(
    { qualification: { $nin: allowedQualifications } }, // not in new enums
    { $set: { qualification: "Other" } }
  );

  // 3. Normalize department (fallback to "Other")
  const allowedDepartments = [
    "Software Development", "Frontend", "Backend", "Full Stack",
    "DevOps", "QA & Testing", "Automation Testing", "Manual Testing",
    "UI/UX", "Data Science", "AI/ML", "Cloud Computing",
    "Cybersecurity", "Database Administration", "Product Management",
    "Business Analysis",
    "General Medicine", "Cardiology", "Radiology", "Dental", "Pathology",
    "Pediatrics", "Orthopedics", "Gynecology", "Dermatology",
    "Anesthesiology", "Surgery", "ENT", "Psychiatry", "Physiotherapy",
    "Administration", "Pharmacy", "Research", "Other"
  ];

  await JobPosting.updateMany(
    { department: { $nin: allowedDepartments } }, // not in new enums
    { $set: { department: "Other" } }
  );

  console.log("Migration complete! ✅");
  process.exit();
};

migrate();
