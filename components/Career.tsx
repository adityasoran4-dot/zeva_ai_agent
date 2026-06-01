"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Stethoscope,
  UserSearch,
  Hospital,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pill,
  Heart,
  Brain,
  Microscope,
  Laptop,
  Shield,
  Activity,
  Briefcase,
  Clock,
  Filter,
  X,
  Search,
  MapPin,
  DollarSign,
} from "lucide-react";

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
  jobType: string;
  department: string;
  time: string;
  experience: string;
};

const CARDS_PER_VIEW = 4;

// Icon mapping based on department
const getDepartmentIcon = (department: string = "") => {
  const dept = department.toLowerCase();
  if (dept.includes("doctor") || dept.includes("medicine") || dept.includes("cardiology") || dept.includes("pediatric")) {
    return Stethoscope;
  }
  if (dept.includes("therapist") || dept.includes("mental") || dept.includes("counsel")) {
    return UserSearch;
  }
  if (dept.includes("clinic") || dept.includes("hospital") || dept.includes("administration")) {
    return Hospital;
  }
  if (dept.includes("management") || dept.includes("leadership")) {
    return TrendingUp;
  }
  if (dept.includes("nursing") || dept.includes("care")) {
    return Heart;
  }
  if (dept.includes("pharmacy") || dept.includes("pharmaceutical")) {
    return Pill;
  }
  if (dept.includes("mental") || dept.includes("psychology")) {
    return Brain;
  }
  if (dept.includes("research") || dept.includes("lab")) {
    return Microscope;
  }
  if (dept.includes("software") || dept.includes("it") || dept.includes("tech") || dept.includes("frontend") || dept.includes("backend") || dept.includes("devops") || dept.includes("data") || dept.includes("ai")) {
    return Laptop;
  }
  if (dept.includes("security") || dept.includes("compliance")) {
    return Shield;
  }
  if (dept.includes("fitness") || dept.includes("wellness")) {
    return Activity;
  }
  return Briefcase; // Default icon
};

const formatPostedDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const diff = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatSalary = (job: Job) => {
  if (!job.salary) return "Competitive";
  const num = parseInt(job.salary.replace(/[^\d]/g, ""));
  return num >= 1000 ? `${num / 1000}K AED` : `${job.salary} AED`;
};

const createJobSlug = (jobTitle: string, jobId: string): string => {
  if (!jobTitle) return jobId;
  const titleSlug = jobTitle
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
  return `${titleSlug}-${jobId}`;
};

export default function Career() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy] = useState("most-recent");
  const [filters, setFilters] = useState<Filters>({
    jobType: "",
    department: "",
    time: "",
    experience: "",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLatestJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add filters
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      // Add search query
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      // Add sort
      if (sortBy) {
        params.append("sortBy", sortBy);
      }

      params.append("limit", "20");
      
      const res = await axios.get<{ jobs: Job[] }>(
        `/api/job-postings/all?${params.toString()}`
      );
      setJobs(res.data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLatestJobs();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const clearFilters = () => {
    setFilters({
      jobType: "",
      department: "",
      time: "",
      experience: "",
    });
    setSearchQuery("");
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(jobs.length / CARDS_PER_VIEW);
  // Check if all columns have full 4 cards (jobs.length is multiple of 4)
  const allColumnsFull = jobs.length > 0 && jobs.length % CARDS_PER_VIEW === 0;
  const showNavigation = totalPages >= 2; // Only show navigation when at least 2 pages
  const canGoNext = currentPage < totalPages - 1;
  const canGoPrevious = currentPage > 0;
  const activeFiltersCount = Object.values(filters).filter(v => v).length;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }
  };

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
    }
  };

  // Reset to first page when jobs change
  useEffect(() => {
    setCurrentPage(0);
  }, [jobs.length]);

  // Auto-slide functionality - only when all columns have full 4 cards (multiples of 4)
  useEffect(() => {
    if (autoSlide && showNavigation && !loading && allColumnsFull && totalPages >= 2) {
      intervalRef.current = setInterval(() => {
        setCurrentPage((prev) => (prev + 1) % totalPages);
      }, 3000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSlide, showNavigation, totalPages, loading, allColumnsFull]);

  // Pause auto-slide on hover
  const handleMouseEnter = () => setAutoSlide(false);
  const handleMouseLeave = () => setAutoSlide(true);

  return (
    <section className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 w-full bg-gradient-to-r from-blue-700 via-teal-800 to-blue-700 rounded-2xl py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center">
          <span className="inline-block text-sm font-medium px-4 py-1 rounded-full bg-white text-blue-600">
            Career Opportunities
          </span>

          <h4 className="mt-3 text-xl md:text-2xl font-semibold text-white">
            Healthcare Jobs & Opportunities
          </h4>

          <h2 className="mt-2 text-sm md:text-base text-white/90 max-w-2xl mx-auto">
            Discover your next career move in healthcare with leading institutions
          </h2>
        </div>

        {/* Filters Section */}
        <div className="mt-8 flex flex-wrap items-center gap-4 justify-between">
            {/* Date Posted */}
            <div className="ml-10 flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              <div className="flex items-center gap-2">
                {[
                  { value: "", label: "All time" },
                  { value: "week", label: "Last 7 days" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="time"
                      value={option.value}
                      checked={filters.time === option.value}
                      onChange={handleFilterChange}
                      className="w-3.5 h-3.5 text-blue-800 border-white/30 focus:ring-white"
                    />
                    <span className="ml-1.5 text-xs text-white group-hover:text-yellow-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-white" />
              <select
                name="jobType"
                value={filters.jobType}
                onChange={handleFilterChange}
                className="px-3 py-1.5 text-xs text-gray-900 bg-white border border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-white transition-colors"
              >
                <option value="">All Types</option>
                <option>Full Time</option>
                <option>Part Time</option>
                <option>Internship</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white" />
              <select
                name="experience"
                value={filters.experience}
                onChange={handleFilterChange}
                className="px-3 py-1.5 text-xs text-gray-900 bg-white border border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-white transition-colors"
              >
                <option value="">All Levels</option>
                <option value="fresher">Fresher</option>
                <option value="1-2">1-2 years</option>
                <option value="2-4">2-4 years</option>
                <option value="4-6">4-6 years</option>
                <option value="7+">7+ years</option>
              </select>
            </div>

            {/* Department */}
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-white" />
              <select
                name="department"
                value={filters.department}
                onChange={handleFilterChange}
                className="px-3 py-1.5 text-xs text-gray-900 bg-white border border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-white transition-colors"
              >
                <option value="">All Departments</option>
                <option>Software Development</option>
                <option>Frontend</option>
                <option>Backend</option>
                <option>Full Stack</option>
                <option>DevOps</option>
                <option>QA & Testing</option>
                <option>UI/UX</option>
                <option>Data Science</option>
                <option>AI/ML</option>
                <option>General Medicine</option>
                <option>Cardiology</option>
                <option>Dental</option>
                <option>Pediatrics</option>
                <option>Administration</option>
                <option>Other</option>
              </select>
            </div>

            {/* Filters Label - Right Corner */}
            <div className="flex items-center gap-2  mr-auto">
              <Filter className="w-4 h-4 text-white" />
              <span className="text-xs font-semibold text-white">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-400 text-blue-900 text-xs font-semibold rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-white hover:text-yellow-300 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
        </div>

        {/* Cards Carousel */}
        <div
          className="mt-10 md:mt-12 relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-white/10 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-white/50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No jobs found</h3>
              <p className="text-sm text-white/80 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-900 px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Clear all 
                
                
              </button>
            </div>
          ) : (
            <>
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: showNavigation ? `translateX(-${currentPage * 100}%)` : 'translateX(0)',
                  }}
                >
                  {showNavigation ? (
                    // Show carousel when 2+ pages
                    Array.from({ length: totalPages }).map((_, pageIndex) => {
                      const pageJobs = jobs.slice(
                        pageIndex * CARDS_PER_VIEW,
                        (pageIndex + 1) * CARDS_PER_VIEW
                      );

                      return (
                        <div
                          key={`page-${pageIndex}`}
                          className="flex-shrink-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2"
                        >
                        {pageJobs.map((job) => {
                          const Icon = getDepartmentIcon(job.department || job.role);
                          // Use database slug if available and locked, otherwise fallback to generated slug
                          const jobSlug = (job.slug && job.slugLocked) 
                            ? job.slug 
                            : createJobSlug(job.jobTitle || job.role, job._id);
                          
                          return (
                            <Link
                              key={job._id}
                              href={`/job-details/${jobSlug}`}
                              className="group block no-underline"
                            >
                              <div className="border border-white/20 rounded-2xl p-6 md:p-8 bg-white hover:shadow-xl transition-all duration-300 text-left h-full">
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-teal-50 flex items-center justify-center">
                                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-teal-700" />
                                </div>

                                <h3 className="mt-5 md:mt-6 text-gray-900 font-semibold text-base md:text-lg line-clamp-2">
                                  {job.jobTitle || job.role}
                                </h3>

                                <p className="mt-2 text-sm font-medium text-amber-500">
                                  {job.companyName}
                                </p>

                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <MapPin className="w-3 h-3 text-teal-700" />
                                    <span className="truncate">{job.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <DollarSign className="w-3 h-3 text-teal-700" />
                                    <span className="font-semibold text-teal-700">
                                      {formatSalary(job)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <Clock className="w-3 h-3 text-teal-700" />
                                    <span>{formatPostedDate(job.createdAt)}</span>
                                  </div>
                                </div>

                                {job.jobType && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                      {job.jobType}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                        {/* Fill empty slots if last page has fewer than 4 cards */}
                        {pageJobs.length < CARDS_PER_VIEW &&
                          Array.from({ length: CARDS_PER_VIEW - pageJobs.length }).map(
                            (_, idx) => <div key={`empty-${idx}`} />
                          )}
                      </div>
                    );
                  })
                  ) : (
                    // Show static grid when less than 2 pages
                    <div className="flex-shrink-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                      {jobs.map((job) => {
                        const Icon = getDepartmentIcon(job.department || job.role);
                        // Use database slug if available and locked, otherwise fallback to generated slug
                        const jobSlug = (job.slug && job.slugLocked) 
                          ? job.slug 
                          : createJobSlug(job.jobTitle || job.role, job._id);
                        
                        return (
                          <Link
                            key={job._id}
                            href={`/job-details/${jobSlug}`}
                            className="group block no-underline"
                          >
                            <div className="border border-white/20 rounded-2xl p-6 md:p-8 bg-white hover:shadow-xl transition-all duration-300 text-left h-full">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-teal-50 flex items-center justify-center">
                                <Icon className="w-6 h-6 md:w-7 md:h-7 text-teal-700" />
                              </div>

                              <h3 className="mt-5 md:mt-6 text-gray-900 font-semibold text-base md:text-lg line-clamp-2">
                                {job.jobTitle || job.role}
                              </h3>

                              <p className="mt-2 text-sm font-medium text-amber-500">
                                {job.companyName}
                              </p>

                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <MapPin className="w-3 h-3 text-teal-700" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <DollarSign className="w-3 h-3 text-teal-700" />
                                  <span className="font-semibold text-teal-700">
                                    {formatSalary(job)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Clock className="w-3 h-3 text-teal-700" />
                                  <span>{formatPostedDate(job.createdAt)}</span>
                                </div>
                              </div>

                              {job.jobType && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {job.jobType}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Arrows - Only show when 2+ pages */}
              {showNavigation && totalPages >= 2 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (canGoPrevious) {
                        handlePrevious();
                      }
                    }}
                    disabled={!canGoPrevious}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 flex items-center justify-center transition-all duration-200 z-10 p-2 ${
                      !canGoPrevious
                        ? "text-white/30 cursor-not-allowed opacity-50 pointer-events-none"
                        : "text-white hover:text-white/80 cursor-pointer active:scale-95"
                    }`}
                    aria-label="Previous cards"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (canGoNext) {
                        handleNext();
                      }
                    }}
                    disabled={!canGoNext}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 flex items-center justify-center transition-all duration-200 z-10 p-2 ${
                      !canGoNext
                        ? "text-white/30 cursor-not-allowed opacity-50 pointer-events-none"
                        : "text-white hover:text-white/80 cursor-pointer active:scale-95"
                    }`}
                    aria-label="Next cards"
                  >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  </button>
                </>
              )}

              {/* Page Indicators - Only show when 2+ pages */}
              {showNavigation && totalPages >= 2 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentPage === index
                          ? "w-8 bg-white"
                          : "w-2 bg-white/50 hover:bg-white/75"
                      }`}
                      aria-label={`Go to page ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA Button */}
        <div className="mt-12 md:mt-16 flex justify-center">
          <Link href="/job-listings">
            <button className="flex items-center text-black gap-2 bg-amber-400 px-6 md:px-7 py-2.5 md:py-3 rounded-md hover:bg-amber-300 transition font-medium text-sm md:text-base">
              Explore Healthcare Jobs
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
