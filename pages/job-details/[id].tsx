import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";
import { FaWhatsapp, FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaUsers, FaCalendarAlt, FaBuilding, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  salaryType?: string;
  createdAt: string;
  jobType?: string;
  department?: string;
  workingDays?: string;
  noOfOpenings?: number;
  establishment?: string;
  experience?: string;
  qualification?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  slug?: string;
  slugLocked?: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

const JobDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query; // This will be the slug now
  const { user, isAuthenticated } = useAuth() as {
    user: User | null;
    isAuthenticated: boolean;
  };

  const [job, setJob] = useState<Job | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [fileError, setFileError] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const shouldApplyAfterLogin = useRef(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Helper: extract full MongoDB ObjectId from slug
  // Format: job-title-abc12345def67890 (title + full 24-char ID at the end)
  const extractJobIdFromSlug = (slug: string): string | null => {
    if (!slug) return null;
    
    // MongoDB ObjectId is 24 hex characters
    // Try to extract it from the end of the slug
    const objectIdPattern = /([a-f0-9]{24})$/i;
    const match = slug.match(objectIdPattern);
    
    if (match) {
      return match[1]; // Return the full 24-character ID
    }
    
    return null;
  };

  useEffect(() => {
    if (id && typeof id === 'string') {
      // Check if it's a MongoDB ObjectId (24 hex characters) - backward compatibility
      const isObjectId = /^[a-f0-9]{24}$/i.test(id);
      
      if (isObjectId) {
        // Old URL format with ID - redirect to slug-based URL if available
        console.log("🔍 Detected ObjectId, checking for slug redirect:", id);
        axios
          .get(`/api/jobs/redirect/${id}`)
          .then(() => {
            // Redirect API will handle the redirect
            // If no redirect happens, fetch by ID as fallback
            return axios.get<{ jobs: Job[] }>(`/api/job-postings/all?jobId=${id}`);
          })
          .then((res) => {
            if (res?.data?.jobs && res.data.jobs.length > 0) {
              const job = res.data.jobs[0];
              // If job has slug, redirect to slug URL
              if (job.slug && job.slugLocked) {
                router.replace(`/job-details/${job.slug}`, undefined, { shallow: false });
                return;
              }
              setJob(job);
            } else {
              router.push('/job-listings');
            }
          })
          .catch(() => {
            router.push('/job-listings');
          });
      } else {
        // New URL format with slug - fetch by slug
        fetchJobBySlug(id);
      }
    }
  }, [id]);

  const fetchJobBySlug = async (slug: string) => {
    console.log("🔍 Fetching job by slug:", slug);
    
    try {
      // Use the new slug-based API
      const res = await axios.get<{ success: boolean; job: Job }>(`/api/jobs/by-slug/${slug}`);
      
      if (res.data.success && res.data.job) {
        console.log("✅ Found job by slug:", res.data.job.jobTitle);
        setJob(res.data.job);
      } else {
        console.error("❌ Job not found for slug:", slug);
        router.push('/job-listings');
      }
    } catch (error: any) {
      console.error("Error fetching job by slug:", error);
      // If slug API fails, try fallback to ID extraction (for backward compatibility)
      const jobId = extractJobIdFromSlug(slug);
      if (jobId) {
        try {
          const res = await axios.get<{ jobs: Job[] }>(`/api/job-postings/all?jobId=${jobId}`);
          if (res.data.jobs && res.data.jobs.length > 0) {
            const foundJob = res.data.jobs[0];
            console.log("✅ Found job by ID (fallback):", foundJob.jobTitle);
            // If job has slug, redirect to slug URL
            if (foundJob.slug && foundJob.slugLocked) {
              router.replace(`/job-details/${foundJob.slug}`, undefined, { shallow: false });
              return;
            }
            setJob(foundJob);
          } else {
            router.push('/job-listings');
          }
        } catch (fallbackError) {
          router.push('/job-listings');
        }
      } else {
        router.push('/job-listings');
      }
    }
  }

  useEffect(() => {
    if (isAuthenticated && shouldApplyAfterLogin.current) {
      shouldApplyAfterLogin.current = false;
      handleApply();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (job?._id && user?._id) {
      axios
        .get<{ applied: boolean }>(
          `/api/job-postings/checkApplication?jobId=${job._id}&applicantId=${user._id}`
        )
        .then((res) => setHasApplied(res.data.applied))
        .catch(console.error);
    }
  }, [job?._id, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");

    if (file) {
      const maxSize = 998 * 1024;
      if (file.size > maxSize) {
        setFileError("File must be less than 1 MB");
        setResumeFile(null);
        e.target.value = "";
        return;
      }

      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        setFileError("Only PDF, DOC, or DOCX files allowed");
        setResumeFile(null);
        e.target.value = "";
        return;
      }

      setResumeFile(file);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated || !user) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldApplyAfterLogin.current = true;
      return;
    }

    if (!resumeFile) {
      setFileError("Please upload your resume");
      return;
    }

    setIsApplying(true);
    try {
      const formData = new FormData();
      formData.append("jobId", job?._id || "");
      formData.append("applicantId", user._id);
      formData.append("name", user.name);
      formData.append("email", user.email);
      formData.append("phone", user.phone || "");
      formData.append("role", user.role || "");
      formData.append("resume", resumeFile);

      await axios.post("/api/job-postings/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setHasApplied(true);
      // alert("Successfully applied!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
    } finally {
      setIsApplying(false);
    }
  };

  const toggleDescription = () => {
    if (isDescExpanded) {
      // When collapsing, scroll to the description section
      descriptionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsDescExpanded(false);
      }, 100);
    } else {
      // When expanding, just expand
      setIsDescExpanded(true);
    }
  };

  const getDaysAgo = (date: string) => {
    const now = new Date();
    const createdDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 30) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  };

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const shareLink = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `Check out this job: ${job.jobTitle} at ${job.companyName}\n${shareLink}`
  )}`;

  const shouldShowExpand = (job.description?.length || 0) > 400;
  
  // Helper to strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  const truncatedDescription = shouldShowExpand && !isDescExpanded
    ? stripHtml(job.description || '').slice(0, 400) + '...'
    : job.description || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-20 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-white px-6 sm:px-8 py-6 sm:py-8 border-b-4 border-transparent" style={{ borderImage: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%) 1' }}>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                    {getDaysAgo(job.createdAt)}
                  </span>
                  {job.noOfOpenings && (
                    <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                      {job.noOfOpenings} Openings
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-gray-900">{job.jobTitle}</h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaBuilding className="w-4 h-4" />
                    <span className="font-medium">{job.companyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Apply Section */}
              <div className="hidden lg:block w-72 bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Upload Resume</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX (Max 1MB)</p>
                  {fileError && (
                    <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                      <span>⚠</span> {fileError}
                    </p>
                  )}
                  {resumeFile && !fileError && (
                    <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                      <span>✓</span> {resumeFile.name}
                    </p>
                  )}
                </div>
                <button
                  className={`w-full py-3 rounded-lg text-sm font-semibold mb-3 transition-all ${
                    hasApplied
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : isApplying
                      ? "bg-blue-700 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  }`}
                  onClick={!hasApplied && !isApplying ? handleApply : undefined}
                  disabled={hasApplied || isApplying}
                >
                  {isApplying ? "Applying..." : hasApplied ? "✓ Applied" : "Apply Now"}
                </button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg text-sm font-semibold transition-all"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  Share Job
                </a>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8">
            
            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <FaMoneyBillWave className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-xs text-gray-600 mb-1">Salary</p>
                <p className="text-sm font-bold text-gray-900">{job.salary}</p>
                <p className="text-xs text-gray-500">/{job.salaryType}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <FaUsers className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-xs text-gray-600 mb-1">Experience</p>
                <p className="text-sm font-bold text-gray-900">{job.experience}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <FaCalendarAlt className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-xs text-gray-600 mb-1">Working Days</p>
                <p className="text-sm font-bold text-gray-900">{job.workingDays}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <FaClock className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-xs text-gray-600 mb-1">Timing</p>
                <p className="text-sm font-bold text-gray-900">{job.jobTiming}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Required Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {job.description && (
                  <div ref={descriptionRef} className="scroll-mt-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Job Description</h2>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div 
                        className="text-gray-700 leading-relaxed text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: isDescExpanded ? (job.description || '') : truncatedDescription }}
                      />
                      {shouldShowExpand && (
                        <button
                          onClick={toggleDescription}
                          className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
                        >
                          {isDescExpanded ? (
                            <>Show Less <FaChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Read More <FaChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {job.perks && job.perks.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Benefits & Perks</h2>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {job.perks.map((perk, index) => (
                        <div key={index} className="flex items-center gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                          <span className="text-green-600 text-lg">✓</span>
                          <span className="text-sm text-gray-700">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                
                {/* Company Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Company Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="text-sm font-semibold text-gray-900">{job.companyName}</p>
                    </div>
                    {job.establishment && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Established</p>
                        <p className="text-sm font-semibold text-gray-900">{job.establishment}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{job.location}</p>
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Job Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Type</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {job.jobType || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Department</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {job.department || "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
                  <div className="space-y-3">
                    {job.qualification && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Education</p>
                        <p className="text-sm text-gray-900">{job.qualification}</p>
                      </div>
                    )}
                    {job.languagesPreferred && job.languagesPreferred.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Languages</p>
                        <p className="text-sm text-gray-900">{job.languagesPreferred.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-50">
        <div className="flex gap-2">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
            id="mobile-resume"
          />
          <label
            htmlFor="mobile-resume"
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-lg text-sm font-semibold cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            CV
          </label>
          <button
            className={`flex-1 py-3 rounded-lg text-sm font-semibold ${
              hasApplied
                ? "bg-gray-300 text-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={!hasApplied && !isApplying ? handleApply : undefined}
            disabled={hasApplied || isApplying}
          >
            {isApplying ? "..." : hasApplied ? "Applied" : "Apply"}
          </button>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 text-white p-3 rounded-lg"
          >
            <FaWhatsapp className="w-5 h-5" />
          </a>
        </div>
        {(fileError || resumeFile) && (
          <div className="mt-2 text-center text-xs">
            {fileError && <p className="text-red-600">{fileError}</p>}
            {resumeFile && !fileError && <p className="text-green-600">✓ {resumeFile.name}</p>}
          </div>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
};

export default JobDetail;