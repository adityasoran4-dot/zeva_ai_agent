import dbConnect from "../../../lib/database";
import "../../../models/Users";
import JobPosting from "../../../models/JobPosting";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await dbConnect();

  const { location, jobType, department, skills, salary, time, experience, jobId, search, sortBy, page, limit } = req.query;
  
  // ✅ Pagination parameters
  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 6; // Default 6 items per page
  const skip = (pageNumber - 1) * pageSize;

  // ✅ Always only approved + active
  const filters = { 
    isActive: true,
    status: "approved"
  };

  // ✅ Normalize text helper
  const normalize = (str) => str.replace(/[\s\-.]/g, "").toLowerCase();

  // ✅ Job type
  if (jobType?.trim()) {
    filters.jobType = { $regex: jobType.trim(), $options: "i" };
  }

  // ✅ Department
  if (department?.trim()) {
    filters.department = { $regex: department.trim(), $options: "i" };
  }

  // ✅ Job ID
  if (jobId?.trim()) {
    filters._id = jobId.trim();
  }

  // ✅ Skills (comma separated, case-insensitive)
  if (skills?.trim()) {
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills.split(",").map(s => s.trim()).filter(Boolean);

    filters.skills = { $in: skillsArray.map(skill => new RegExp(skill, "i")) };
  }

  // ✅ Time filter (last 7 days)
  if (time === "week") {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    filters.createdAt = { $gte: oneWeekAgo };
  }

  // ✅ Determine sort order
  let sortOrder = { createdAt: -1 }; // Default: Most Recent
  if (sortBy) {
    switch (sortBy) {
      case "most-recent":
        sortOrder = { createdAt: -1 };
        break;
      case "most-relevant":
        sortOrder = { createdAt: -1 }; // Relevance can be enhanced later
        break;
      case "salary-high-low":
        sortOrder = { salary: -1, createdAt: -1 };
        break;
      case "salary-low-high":
        sortOrder = { salary: 1, createdAt: -1 };
        break;
      default:
        sortOrder = { createdAt: -1 };
    }
  }

  try {
    let jobs = await JobPosting.find(filters)
      .populate("postedBy", "username role")
      .sort(sortOrder)
      .lean();

    const initialCount = jobs.length;
    // console.log(`📊 Initial jobs count: ${initialCount}`);

    // ✅ Search filter (jobTitle, companyName) - applied first
    if (search?.trim()) {
      const searchQuery = search.trim().toLowerCase();
      // console.log(`🔍 Filtering by search query: "${searchQuery}"`);
      const beforeCount = jobs.length;
      jobs = jobs.filter(job => {
        const jobTitleMatch = job.jobTitle?.toLowerCase().includes(searchQuery);
        const companyNameMatch = job.companyName?.toLowerCase().includes(searchQuery);
        return jobTitleMatch || companyNameMatch;
      });
      // console.log(`✅ After search filter: ${beforeCount} → ${jobs.length} jobs`);
    }

    // ✅ Location normalization check (real fuzzy match)
    if (location?.trim()) {
      const normalizedQuery = normalize(location);
      // console.log(`📍 Filtering by location: "${location}" (normalized: "${normalizedQuery}")`);
      const beforeCount = jobs.length;
      jobs = jobs.filter(
        job => job.location && normalize(job.location).includes(normalizedQuery)
      );
      
    }

    

    // ✅ Experience filter (range based, now AFTER jobs are fetched)
   // ✅ Experience filter (range + "Fresher")
if (experience?.trim()) {
  let min = 0, max = Infinity;
  const expFilter = experience.trim();

  switch (expFilter) {
    case "fresher":
      min = 0; max = 0; break; // treat Fresher as 0 years
    case "1-2":
      min = 1; max = 2; break;
    case "2-4":
      min = 2; max = 4; break;
    case "4-6":
      min = 4; max = 6; break;
    case "7+":
      min = 7; max = Infinity; break;
  }

  jobs = jobs.filter(job => {
    if (!job.experience) return false;

    const expStr = job.experience.toString().toLowerCase();

    // direct fresher match
    if (expFilter === "fresher" && expStr.includes("fresher")) return true;

    // numeric extraction
    const expNum = parseInt(expStr.match(/\d+/)?.[0] || "0", 10);
    return expNum >= min && expNum <= max;
  });
}


    // ✅ Salary filter (range check instead of exact match)
    if (salary?.trim()) {
      const salaryNumber = parseInt(salary.trim(), 10);
      jobs = jobs.filter(job => {
        if (!job.salary) return false;

        const parts = job.salary.split("-").map(s => parseInt(s.trim(), 10)).filter(Boolean);
        if (parts.length === 2) {
          return salaryNumber >= parts[0] && salaryNumber <= parts[1];
        } else if (parts.length === 1) {
          return salaryNumber === parts[0];
        }
        return false;
      });
    }

    // ✅ Apply client-side sorting for salary (since salary is stored as string)
    if (sortBy === "salary-high-low" || sortBy === "salary-low-high") {
      jobs.sort((a, b) => {
        const getSalaryValue = (job) => {
          if (!job.salary) return 0;
          const salaryStr = job.salary.toString();
          const numbers = salaryStr.match(/\d+/g);
          if (!numbers || numbers.length === 0) return 0;
          // Use the first number (for ranges, use the max)
          const values = numbers.map(n => parseInt(n, 10));
          return Math.max(...values);
        };
        
        const aVal = getSalaryValue(a);
        const bVal = getSalaryValue(b);
        
        return sortBy === "salary-high-low" ? bVal - aVal : aVal - bVal;
      });
    }

    // ✅ Get total count before pagination
    const totalJobs = jobs.length;
    const totalPages = Math.ceil(totalJobs / pageSize);

    // ✅ Apply backend pagination
    const paginatedJobs = jobs.slice(skip, skip + pageSize);

    // ✅ Return paginated results with metadata
    res.status(200).json({ 
      success: true, 
      jobs: paginatedJobs,
      pagination: {
        currentPage: pageNumber,
        pageSize: pageSize,
        totalJobs: totalJobs,
        totalPages: totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch jobs" });
  }
}
