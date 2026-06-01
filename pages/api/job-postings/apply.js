import dbConnect from "../../../lib/database";
import JobApplication from "../../../models/JobApplication";
import fs from "fs";
import path from "path";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "resume");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      multiples: false,
      uploadDir,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        // console.error("Form parse error:", err);
        return res.status(500).json({ message: "File upload error" });
      }

      // Helper to normalize fields (array → string)
      const getField = (f) => Array.isArray(f) ? f[0] : f;

      const jobId = getField(fields.jobId);
      const applicantId = getField(fields.applicantId);
      const name = getField(fields.name);
      const email = getField(fields.email);
      const phone = getField(fields.phone);
      const role = getField(fields.role);

      if (!jobId || !applicantId) {
        return res.status(400).json({ message: "Missing jobId or applicantId" });
      }

      const existing = await JobApplication.findOne({ jobId, applicantId });
      if (existing) {
        return res.status(400).json({ message: "Already applied to this job." });
      }

      let resumeUrl = null;
      if (files.resume) {
        const resumeFile = Array.isArray(files.resume) ? files.resume[0] : files.resume;

        if (resumeFile && resumeFile.filepath) {
          const fileName = Date.now() + "_" + (resumeFile.originalFilename || "resume.pdf");
          const newPath = path.join(uploadDir, fileName);

          fs.renameSync(resumeFile.filepath, newPath);

          const relativePath = `/uploads/resume/${fileName}`;

          resumeUrl =
            process.env.NODE_ENV === "production"
              ? `https://zeva360.ae${relativePath}`
              : relativePath;
        }
      }

      const application = new JobApplication({
        jobId,
        applicantId,
        applicantInfo: { name, email, phone, role },
        resume: resumeUrl,
      });

      await application.save();

      return res.status(200).json({ message: "Application submitted successfully." });
    });
  } catch (err) {
    // console.error("Server error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
