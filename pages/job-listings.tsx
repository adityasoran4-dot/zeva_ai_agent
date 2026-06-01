import React, { useEffect, useState, ChangeEvent, useRef, useCallback } from "react";
import Head from "next/head";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";

type Job = {
  _id: string;
  companyName: string;
  location: string;
  salary?: string;
  salaryType?: string;
  role: string;
  createdAt: string;
  jobType?: string;
  department?: string;
  experience?: string;
  jobTitle?: string;
  slug?: string;
  slugLocked?: boolean;
};

type Filters = {
  location: string;
  jobType: string;
  department: string;
  skills: string;
  salary: string;
  time: string;
  experience?: string;
};

const AllJobs: React.FC = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<Filters>({
    location: "",
    jobType: "",
    department: "",
    skills: "",
    salary: "",
    time: "",
    experience: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("most-recent");
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    totalJobs: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const jobsPerPage = 6;

  // Helper: convert text to URL-friendly slug
  // Special handling for values that should stay as-is (like "week", "1-2", etc.)
  const textToSlug = (text: string, key?: string) => {
    if (!text) return "";
    
    // For time filter, keep "week" as-is (already URL-safe)
    if (key === "time" && text.toLowerCase() === "week") {
      return "week";
    }
    
    // For experience filter, keep values like "1-2", "2-4", "7+", "fresher" as-is
    if (key === "experience") {
      const expValues = ["fresher", "1-2", "2-4", "4-6", "7+"];
      if (expValues.includes(text.toLowerCase())) {
        return text.toLowerCase();
      }
    }
    
    // For other values, convert to slug
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces -> hyphen
      .replace(/-+/g, "-"); // collapse multiple hyphens
  };

  // Helper: create SEO-friendly slug from job title with full ID
  // Format: job-title-abc12345def67890 (title slug + full 24-char ID)
  // The ID is included for direct database lookup (optimized) but title is prominent for SEO
  const createJobSlug = (jobTitle: string, jobId: string): string => {
    if (!jobTitle) return jobId; // Fallback to ID if no title
    
    const titleSlug = jobTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces -> hyphen
      .replace(/-+/g, "-") // collapse multiple hyphens
      .substring(0, 60); // limit length for SEO (leaving room for ID)
    
    // Append full ID for direct database lookup (optimized approach)
    // This ensures: 1) No conflicts, 2) Fast lookup, 3) SEO-friendly title
    return `${titleSlug}-${jobId}`;
  };


  const fetchJobs = useCallback(async (searchValue?: string, locationValue?: string, pageNumber?: number) => {
    // Use provided values or fall back to current state values
    const searchToUse = searchValue !== undefined ? searchValue : searchQuery;
    const locationToUse = locationValue !== undefined ? locationValue : filters.location;
    const pageToUse = pageNumber !== undefined ? pageNumber : currentPage;
    
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      // Use immediate values for API call (from button click or initial load)
      const filtersForAPI: Filters = {
        location: locationToUse,
        jobType: filters.jobType,
        department: filters.department,
        skills: filters.skills,
        salary: filters.salary,
        time: filters.time,
        experience: filters.experience,
      };
      
      Object.entries(filtersForAPI).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      // Use immediate search query for API call
      if (searchToUse.trim()) {
        params.append("search", searchToUse.trim());
      }

      // Add sort parameter
      if (sortBy) {
        params.append("sortBy", sortBy);
      }

      // Add pagination parameters
      params.append("page", pageToUse.toString());
      params.append("limit", jobsPerPage.toString());

      const apiUrl = `/api/job-postings/all?${params.toString()}`;
      
      const res = await axios.get<{ 
        jobs: Job[]; 
        pagination: {
          currentPage: number;
          pageSize: number;
          totalJobs: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
        }
      }>(apiUrl);
      
      setJobs(res.data.jobs || []);
      
      // Update pagination metadata from API
      if (res.data.pagination) {
        setPagination({
          totalJobs: res.data.pagination.totalJobs,
          totalPages: res.data.pagination.totalPages,
          currentPage: res.data.pagination.currentPage,
          hasNextPage: res.data.pagination.hasNextPage,
          hasPreviousPage: res.data.pagination.hasPreviousPage,
        });
        // Sync currentPage state with API response
        setCurrentPage(res.data.pagination.currentPage);
      }
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, currentPage]);

  const formatPostedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatSalary = (job: Job) => {
    if (job.salary) return `${job.salary} ${job.salaryType ? `/ ${job.salaryType}` : ""}`;
    if (job.salaryType) return `Not specified / ${job.salaryType}`;
    return "Not specified";
  };

  // Use pagination from API (no client-side slicing needed)
  const currentJobs = jobs;
  const totalPages = pagination.totalPages;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    fetchJobs(searchQuery, filters.location, pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // On first load, fetch all jobs
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!router.isReady) return;
    if (hasInitialized.current) return;

    hasInitialized.current = true;
    fetchJobs("", "");
  }, [router.isReady]);

  // Real-time API calls when filter dropdowns change (debounced)
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    // Debounce filter changes to avoid too many API calls
    const timer = setTimeout(() => {
      // Always fetch page 1 when filters change
      fetchJobs(searchQuery, filters.location, 1);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.jobType, filters.department, filters.skills, filters.salary, filters.time, filters.experience]);

  // Real-time API call when sort changes (no debounce for immediate feedback)
  useEffect(() => {
    if (!hasInitialized.current) return;
    // Always fetch page 1 when sort changes
    fetchJobs(searchQuery, filters.location, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("🔤 Search input changed:", value);
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    // Call API with current search and location values (always page 1 for new search)
    fetchJobs(searchQuery, filters.location, 1);
    
    // Update URL with current values
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, textToSlug(String(value), key as keyof Filters));
      }
    });
    if (searchQuery.trim()) {
      params.set("search", textToSlug(searchQuery.trim(), "search"));
    }
    const newUrl = params.toString()
      ? `${router.pathname}?${params.toString()}`
      : router.pathname;
    router.replace(newUrl, undefined, { shallow: true });

    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <>
      <Head>
        {/* Schema Markup - Job Posting */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Careers at ZEVA",
              "url": "https://zeva360.com/job-listings",
              "description": "Explore exciting career opportunities at ZEVA. Discover job openings for healthcare professionals, IT specialists, and wellness experts across multiple locations. Apply for full-time, part-time, or remote positions with transparent salary information.",
              "hiringOrganization": {
                "@type": "Organization",
                "name": "ZEVA",
                "sameAs": "https://zeva360.com",
                "logo": "https://zeva360.com/logo.png"
              },
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Abu Dhabi, UAE",
                  "addressLocality": "Abu Dhabi",
                  "addressCountry": "AE"
                }
              },
              "datePosted": "2025-12-18",
              "employmentType": "FULL_TIME",
              "validThrough": "2026-12-31T23:59",
              "baseSalary": {
                "@type": "MonetaryAmount",
                "currency": "AED",
                "value": {
                  "@type": "QuantitativeValue",
                  "value": "70000",
                  "unitText": "YEAR"
                }
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mt-8 mb-2 tracking-tight">
              Find Your Dream Job
            </h1>
            <p className="text-base md:text-lg text-teal-100 max-w-2xl mx-auto">
              Explore opportunities tailored to your skills and preferences
            </p>
          </div>

          {/* Main Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-1.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Job title, keywords, or company"
                    className="w-full pl-9 pr-2.5 py-2 text-xs text-gray-900 placeholder-gray-500 rounded-md border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-colors"
                  />
                </div>
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    name="location"
                    value={filters.location}
                    onChange={handleChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="City or state"
                    className="w-full pl-9 pr-2.5 py-2 text-xs text-gray-900 placeholder-gray-500 rounded-md border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleSearchSubmit}
                  className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-medium py-2 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 text-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-0.5">{jobs.length}</div>
              <div className="text-teal-200 text-xs">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-0.5">500+</div>
              <div className="text-teal-200 text-xs">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-0.5">300+</div>
              <div className="text-teal-200 text-xs">New This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-0.5">1M+</div>
              <div className="text-teal-200 text-xs">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    setFilters({ location: "", jobType: "", department: "", skills: "", salary: "", time: "", experience: "" });
                    setSearchQuery("");
                    fetchJobs("", "");
                  }}
                  className="text-sm text-teal-800 hover:text-teal-900 font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-6">
                {/* Date Posted */}
                <div className="relative z-10">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Date Posted
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="time"
                        value=""
                        checked={filters.time === ""}
                        onChange={handleChange}
                        className="w-4 h-4 text-teal-800 border-gray-300 focus:ring-teal-800"
                      />
                      <span className="ml-3 text-sm text-gray-700">All time</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="time"
                        value="week"
                        checked={filters.time === "week"}
                        onChange={handleChange}
                        className="w-4 h-4 text-teal-800 border-gray-300 focus:ring-teal-800"
                      />
                      <span className="ml-3 text-sm text-gray-700">Last 7 days</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Job Type */}
                <div className="relative z-20">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Job Type
                  </label>
                  <select
                    name="jobType"
                    value={filters.jobType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-teal-800 transition-colors relative z-20"
                  >
                    <option value="">All Types</option>
                    <option>Full Time</option>
                    <option>Part Time</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Experience Level */}
                <div className="relative z-30">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Experience Level
                  </label>
                  <select
                    name="experience"
                    value={filters.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-teal-800 transition-colors relative z-30"
                  >
                    <option value="">All Levels</option>
                    <option value="fresher">Fresher</option>
                    <option value="1-2">1-2 years</option>
                    <option value="2-4">2-4 years</option>
                    <option value="4-6">4-6 years</option>
                    <option value="7+">7+ years</option>
                  </select>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Department */}
                <div className="relative z-40">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Department
                  </label>
                  <select
                    name="department"
                    value={filters.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-teal-800 transition-colors relative z-40"
                  >
                    <option value="">All Departments</option>
                    <option>Software Development</option>
                    <option>Frontend</option>
                    <option>Backend</option>
                    <option>Full Stack</option>
                    <option>DevOps</option>
                    <option>QA & Testing</option>
                    <option>Automation Testing</option>
                    <option>Manual Testing</option>
                    <option>UI/UX</option>
                    <option>Data Science</option>
                    <option>AI/ML</option>
                    <option>Cloud Computing</option>
                    <option>Cybersecurity</option>
                    <option>Database Administration</option>
                    <option>Product Management</option>
                    <option>Business Analysis</option>
                    <option>General Medicine</option>
                    <option>Cardiology</option>
                    <option>Radiology</option>
                    <option>Dental</option>
                    <option>Pathology</option>
                    <option>Pediatrics</option>
                    <option>Orthopedics</option>
                    <option>Gynecology</option>
                    <option>Dermatology</option>
                    <option>Anesthesiology</option>
                    <option>Surgery</option>
                    <option>ENT</option>
                    <option>Psychiatry</option>
                    <option>Physiotherapy</option>
                    <option>Administration</option>
                    <option>Pharmacy</option>
                    <option>Research</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="border-t border-gray-200"></div>

                {/* Salary Range */}
                <div className="relative z-10">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Minimum Salary (AED)
                  </label>
                  <input
                    name="salary"
                    value={filters.salary}
                    onChange={handleChange}
                    type="number"
                    placeholder="e.g. 20000"
                    className="w-full px-4 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-800 focus:border-teal-800 transition-colors"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Job Listings */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {loading ? "Searching..." : pagination.totalJobs > 0 ? `${pagination.totalJobs} ${pagination.totalJobs === 1 ? 'job' : 'jobs'} found` : "No jobs found"}
                </h2>
                {!loading && (
                  <p className="text-sm text-gray-600 mt-1">
                    {pagination.totalJobs > 0
                      ? `Showing ${((currentPage - 1) * jobsPerPage) + 1}-${Math.min(currentPage * jobsPerPage, pagination.totalJobs)} of ${pagination.totalJobs} ${pagination.totalJobs === 1 ? 'result' : 'results'}`
                      : "Try adjusting your search or filters"}
                  </p>
                )}
              </div>
              <select 
                value={sortBy} 
                onChange={handleSortChange}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-800 focus:border-teal-800"
              >
                <option value="most-recent">Most Recent</option>
                <option value="most-relevant">Most Relevant</option>
                <option value="salary-high-low">Salary: High to Low</option>
                <option value="salary-low-high">Salary: Low to High</option>
              </select>
            </div>

            {/* Job Cards */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <div className="w-16 h-16 border-4 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  No positions match your criteria. Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => {
                    setFilters({ location: "", jobType: "", department: "", skills: "", salary: "", time: "", experience: "" });
                    setSearchQuery("");
                    fetchJobs("", "");
                  }}
                  className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white px-5 py-2.5 rounded-lg font-medium transition-colors text-sm"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentJobs.map((job) => {
                  // Use database slug if available and locked, otherwise fallback to generated slug
                  const jobSlug = (job.slug && job.slugLocked) 
                    ? job.slug 
                    : createJobSlug(job.jobTitle || "", job._id);
                  return (
                    <Link key={job._id} href={`/job-details/${jobSlug}`} className="block">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-teal-800 hover:shadow-lg transition-all duration-200 group h-full flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Company Logo */}
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-800 to-teal-700 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {job.companyName.charAt(0)}
                        </div>

                        {/* Save Button */}
                        {/* <button className="ml-auto flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border-2 border-gray-200 text-gray-400 hover:border-teal-800 hover:text-teal-800 hover:bg-teal-50 transition-all">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button> */}
                      </div>

                      {/* Job Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-800 transition-colors mb-1 line-clamp-2">
                          {job.jobTitle}
                        </h3>
                        <p className="text-sm text-gray-700 font-medium mb-3">
                          {job.companyName}
                        </p>

                        {/* Job Meta */}
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-teal-800">{formatSalary(job)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatPostedDate(job.createdAt)}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {job.jobType && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {job.jobType}
                              </span>
                            )}
                            {job.experience && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800">
                                {job.experience}
                              </span>
                            )}
                          </div>

                          {/* Right Arrow Icon */}
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-50 text-teal-800 group-hover:bg-teal-800 group-hover:text-white transition-all ml-auto">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page as number)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === page
                          ? 'bg-teal-800 text-white'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
    </>
  );
};

export default AllJobs;