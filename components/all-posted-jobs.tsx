// components/common/JobManagement.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, Edit, Trash2, Power, PowerOff, X, Building2, MapPin, Clock, Briefcase, GraduationCap, Users, DollarSign, Calendar, FileText} from 'lucide-react';
import JobPostingForm, { JobFormData } from './JobPostingForm';
import { getCurrencySymbol } from '@/lib/currencyHelper';

// Type definitions
interface JobConfig {
  title: string;
  subtitle: string;
  tokenKey: string;
  primaryColor: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateButtonText: string;
}

interface Job {
  _id: string;
  jobTitle: string;
  companyName?: string;
  clinicName?: string;
  hospitalName?: string;
  department?: string;
  jobType?: string;
  location?: string;
  salary?: string;
  isActive: boolean;
  status: 'pending' | 'approved' | 'declined';
  role?: string;
  qualification?: string;
  workingDays?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  noOfOpenings?: number;
  establishment?: string;
  experience?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ConfirmAction {
  type: 'toggle' | 'delete';
  jobId: string;
  currentStatus?: boolean;
  jobTitle: string;
  action: 'activate' | 'deactivate' | 'delete';
}

interface JobManagementProps {
  role?: 'clinic' | 'doctor';
  config?: JobConfig;
  permissions?: {
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
  currency?: string;
}

type StatusFilterType = 'all' | 'active' | 'inactive' | 'pending' | 'approved' | 'declined';
type SortByType = 'newest' | 'oldest' | 'title' | 'status';

// Simple salary formatter - display with currency symbol
const formatSalary = (salary: string, currency: string = 'INR'): string => {
  if (!salary) return 'N/A';
  const symbol = getCurrencySymbol(currency);
  // If salary already contains a currency symbol, return as-is
  if (/[₹$€£د.إS﷼C¥A]/.test(salary)) return salary;
  return `${symbol} ${salary}`;
};

// Status configuration
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'approved':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        label: 'Approved'
      };
    case 'pending':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        label: 'Pending Review'
      };
    case 'declined':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
        label: 'Declined'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: null,
        label: 'Unknown'
      };
  }
};

const JobManagement: React.FC<JobManagementProps> = ({ 
  config = {
    title: 'My Job Posts',
    subtitle: 'Manage your job postings and track applications',
    tokenKey: 'clinicToken',
    primaryColor: '#2D9AA5',
    emptyStateTitle: 'No Job Posts Yet',
    emptyStateDescription: 'Start by creating your first job posting to attract healthcare professionals.',
    emptyStateButtonText: 'Create Your First Job'
  },
  permissions = {
    canRead: true,
    canUpdate: true,
    canDelete: true,
  },
  currency = 'INR'
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('newest');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve auth token with fallbacks so doctorStaff/userToken also work
  const getAuthToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    // 1) Try explicit tokenKey from config (clinicToken/agentToken)
    const primaryToken =
      localStorage.getItem(config.tokenKey) ||
      sessionStorage.getItem(config.tokenKey);
    if (primaryToken) return primaryToken;

    // 2) Fallbacks: agentToken > userToken > clinicToken > doctorToken > adminToken
    const fallbackKeys = [
      "agentToken",
      "userToken",
      "clinicToken",
      "doctorToken",
      "adminToken",
    ];

    for (const key of fallbackKeys) {
      const value =
        localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    }

    return null;
  }, [config.tokenKey]);

  const fetchJobs = useCallback(async (): Promise<void> => {
    // Don't fetch if no read permission
    if (!permissions.canRead) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setJobs([]);
        setLoading(false);
        return;
      }
      const res = await axios.get<{ jobs: Job[] }>('/api/job-postings/my-jobs', {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status === 200 || status === 403,
      });
      
      if (res.status === 403) {
        setJobs([]);
        return;
      }
      
      setJobs(res.data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [config.tokenKey, permissions.canRead, getAuthToken]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const exportJobsToCSV = () => {
    if (jobs.length === 0) {
      toast.error("No jobs to export");
      return;
    }

    const headers = [
      "Job Title",
      "Department",
      "Job Type",
      "Location",
      "Salary",
      "Status",
      "Openings",
      "Experience",
      "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...jobs.map(job => [
        `"${(job.jobTitle || "").replace(/"/g, '""')}"`,
        `"${(job.department || "").replace(/"/g, '""')}"`,
        `"${(job.jobType || "").replace(/"/g, '""')}"`,
        `"${(job.location || "").replace(/"/g, '""')}"`,
        `"${(job.salary || "").replace(/"/g, '""')}"`,
        `"${(job.status || "").replace(/"/g, '""')}"`,
        `"${job.noOfOpenings || 0}"`,
        `"${(job.experience || "").replace(/"/g, '""')}"`,
        `"${job.createdAt ? new Date(job.createdAt).toLocaleString() : ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `jobs_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Jobs exported successfully");
  };
  
  void exportJobsToCSV;

  // Get unique departments and job types for filters
  const uniqueDepartments = useMemo(() => {
    const departments = jobs.map(job => job.department).filter(Boolean);
    return [...new Set(departments)];
  }, [jobs]);

  const uniqueJobTypes = useMemo(() => {
    const jobTypes = jobs.map(job => job.jobType).filter(Boolean);
    return [...new Set(jobTypes)];
  }, [jobs]);

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    const filtered = jobs.filter(job => {
      const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.companyName && job.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.department && job.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && job.isActive) || 
        (statusFilter === 'inactive' && !job.isActive) ||
        (statusFilter === 'pending' && job.status === 'pending') ||
        (statusFilter === 'approved' && job.status === 'approved') ||
        (statusFilter === 'declined' && job.status === 'declined');

      const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
      const matchesJobType = selectedJobType === 'all' || job.jobType === selectedJobType;

      return matchesSearch && matchesStatus && matchesDepartment && matchesJobType;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'oldest':
          return new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime();
        case 'title':
          return a.jobTitle.localeCompare(b.jobTitle);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, searchTerm, statusFilter, sortBy, selectedDepartment, selectedJobType]);

  const handleToggleJob = (jobId: string, currentStatus: boolean, jobTitle: string): void => {
    if (!permissions.canUpdate) {
      return;
    }
    setConfirmAction({
      type: 'toggle',
      jobId,
      currentStatus,
      jobTitle,
      action: currentStatus ? 'deactivate' : 'activate'
    });
    setShowConfirmModal(true);
  };

  const handleDeleteJob = (jobId: string, jobTitle: string): void => {
    if (!permissions.canDelete) {
      return;
    }
    setConfirmAction({
      type: 'delete',
      jobId,
      jobTitle,
      action: 'delete'
    });
    setShowConfirmModal(true);
  };

  const executeAction = async (): Promise<void> => {
    if (!confirmAction) return;
    
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }
    
    try {
      if (confirmAction.type === 'toggle') {
        await axios.patch('/api/job-postings/toggle', {
          jobId: confirmAction.jobId,
          isActive: !confirmAction.currentStatus,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Job ${confirmAction.currentStatus ? 'deactivated' : 'activated'} successfully`);
      } else if (confirmAction.type === 'delete') {
        await axios.delete(`/api/job-postings/delete?jobId=${confirmAction.jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Job deleted successfully');
      }
      
      fetchJobs();
      setShowConfirmModal(false);
      setConfirmAction(null);
    } catch (error: any) {
      console.error('Error executing action:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to perform action';
      toast.error(errorMessage);
    }
  };

  const handleEditJob = async (formData: JobFormData): Promise<void> => {
    if (!editJob || !permissions.canUpdate) {
      toast.error("You do not have permission to edit jobs");
      throw new Error("You do not have permission to edit jobs");
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        throw new Error("Missing auth token");
      }
      await axios.put(`/api/job-postings/update?jobId=${editJob._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Job updated successfully!");
      setIsEditing(false);
      setEditJob(null);
      fetchJobs();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update job posting";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelAction = (): void => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const clearAllFilters = (): void => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedDepartment('all');
    setSelectedJobType('all');
    setSortBy('newest');
  };

  // Stats calculations
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => job.isActive).length;
  const inactiveJobs = jobs.filter(job => !job.isActive).length;
  const pendingJobs = jobs.filter(job => job.status === 'pending').length;
  const approvedJobs = jobs.filter(job => job.status === 'approved').length;
  const declinedJobs = jobs.filter(job => job.status === 'declined').length;

  // Confirmation Modal Component
  const ConfirmationModal: React.FC = () => (
    <>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={cancelAction}
      />
      
      <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          
          <div className={`px-6 py-4 ${
            confirmAction?.action === 'delete' 
              ? 'bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200' 
              : confirmAction?.action === 'activate'
              ? 'bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200'
              : 'bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                confirmAction?.action === 'delete' 
                  ? 'bg-red-500' 
                  : confirmAction?.action === 'activate'
                  ? 'bg-green-500'
                  : 'bg-orange-500'
              }`}>
                {confirmAction?.action === 'delete' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : confirmAction?.action === 'activate' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmAction?.action === 'delete' 
                    ? 'Delete Job Posting' 
                    : confirmAction?.action === 'activate'
                    ? 'Activate Job Posting'
                    : 'Deactivate Job Posting'}
                </h3>
                <p className={`text-sm ${
                  confirmAction?.action === 'delete' 
                    ? 'text-red-700' 
                    : confirmAction?.action === 'activate'
                    ? 'text-green-700'
                    : 'text-orange-700'
                }`}>
                  {confirmAction?.action === 'delete' 
                    ? 'This action cannot be undone' 
                    : confirmAction?.action === 'activate'
                    ? 'Job will be visible to candidates'
                    : 'Job will be hidden from candidates'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to <strong>{confirmAction?.action}</strong> the job posting:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900">{confirmAction?.jobTitle}</p>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 ${
                  confirmAction?.action === 'delete'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : confirmAction?.action === 'activate'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                {confirmAction?.action === 'delete' 
                  ? 'Delete Job' 
                  : confirmAction?.action === 'activate'
                  ? 'Activate Job'
                  : 'Deactivate Job'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-700">Loading job postings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Don't render content if no read permission
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-700 mb-4">
              You do not have permission to view job postings.
            </p>
            <p className="text-sm text-gray-700">
              Please contact your administrator to request access to the Jobs module.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-1 sm:p-2">
      <div className="w-full">
        
        {/* Header - Compact */}
        <div className="mb-4 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#2D9AA5] flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900">{config.title}</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-700 mt-0.5">{config.subtitle}</p>
            </div>
          </div>

          {/* Enhanced Stats - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 mb-2">
            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Total</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{totalJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Active</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{activeJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Inactive</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{inactiveJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Pending</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{pendingJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Approved</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{approvedJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] text-gray-700">Declined</p>
                  <p className="text-sm sm:text-base font-bold text-gray-900">{declinedJobs}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filter Section - Compact */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 sm:p-3 mb-2">
            <div className="flex flex-col gap-2 sm:gap-3">
              {/* Main Search Bar and Quick Actions */}
              <div className="flex flex-col lg:flex-row gap-2">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search jobs by title, company, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-black block w-full pl-8 pr-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                  />
                </div>

                {/* Quick Filter Buttons */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-[9px] sm:text-[10px] font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      showFilters 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    Filters
                  </button>
                  
                  <button
                    onClick={clearAllFilters}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200 text-[9px] sm:text-[10px] font-medium flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                  
                  {/* <button
                    onClick={exportJobsToCSV}
                    className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 text-[9px] sm:text-[10px] font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Export
                  </button> */}
                </div>
              </div>

              {/* Advanced Filters (Collapsible) - Compact */}
              {showFilters && (
                <div className="border-t border-gray-200 pt-2 pb-16 mb-2 relative" style={{ zIndex: 1000 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {/* Status Filter */}
                    <div className="relative" style={{ zIndex: 1001 }}>
                      <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                        className="text-black block w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        style={{ position: 'relative', zIndex: 1001 }}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active Jobs</option>
                        <option value="inactive">Inactive Jobs</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>

                    {/* Department Filter */}
                    <div className="relative" style={{ zIndex: 1000 }}>
                      <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Department</label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="text-black block w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        style={{ position: 'relative', zIndex: 1000 }}
                      >
                        <option value="all">All Departments</option>
                        {uniqueDepartments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Job Type Filter */}
                    <div className="relative" style={{ zIndex: 999 }}>
                      <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Job Type</label>
                      <select
                        value={selectedJobType}
                        onChange={(e) => setSelectedJobType(e.target.value)}
                        className="text-black block w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        style={{ position: 'relative', zIndex: 999 }}
                      >
                        <option value="all">All Types</option>
                        {uniqueJobTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort By */}
                    <div className="relative" style={{ zIndex: 1001 }}>
                      <label className="block text-[9px] sm:text-[10px] font-medium text-gray-700 mb-1">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortByType)}
                        className="text-black block w-full px-2 py-1.5 text-[9px] sm:text-[10px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white"
                        style={{ position: 'relative', zIndex: 1001 }}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="title">Job Title A-Z</option>
                        <option value="status">Status</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count and Active Filters - Compact */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="text-[9px] sm:text-[10px] text-gray-700">
                  Showing {filteredAndSortedJobs.length} of {jobs.length} jobs
                  {searchTerm && ` matching "${searchTerm}"`}
                </div>
                
                {/* Active Filters Tags */}
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Search: {searchTerm}
                      <button onClick={() => setSearchTerm('')} className="hover:text-blue-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Status: {statusFilter}
                      <button onClick={() => setStatusFilter('all')} className="hover:text-green-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {selectedDepartment !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Dept: {selectedDepartment}
                      <button onClick={() => setSelectedDepartment('all')} className="hover:text-purple-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {selectedJobType !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Type: {selectedJobType}
                      <button onClick={() => setSelectedJobType('all')} className="hover:text-orange-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List - Compact */}
        <div className="space-y-1.5 sm:space-y-2 relative" style={{ zIndex: 1 }}>
          {filteredAndSortedJobs.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {searchTerm || statusFilter !== 'all' || selectedDepartment !== 'all' || selectedJobType !== 'all' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                  )}
                </svg>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5">
                {searchTerm || statusFilter !== 'all' || selectedDepartment !== 'all' || selectedJobType !== 'all' ? 'No Jobs Found' : config.emptyStateTitle}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-gray-700 mb-4 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' || selectedDepartment !== 'all' || selectedJobType !== 'all'
                  ? 'Try adjusting your search criteria or filters to find what you\'re looking for.' 
                  : config.emptyStateDescription
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && selectedDepartment === 'all' && selectedJobType === 'all') && (
                <button 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-[9px] sm:text-[10px] font-medium shadow-sm"
                >
                  {config.emptyStateButtonText}
                </button>
              )}
            </div>
          ) : (
            filteredAndSortedJobs.map(job => {
              const statusConfig = getStatusConfig(job.status);
              return (
                <div key={job._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="p-2 sm:p-3">
                    
                    {/* Job Header - Compact */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md flex items-center justify-center shadow-sm flex-shrink-0 ${
                          job.isActive ? statusConfig.bg : 'bg-gray-100'
                        }`}>
                          <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${job.isActive ? statusConfig.text.replace('text-', 'text-').replace('-800', '-600') : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{job.jobTitle}</h3>
                            {/* Status Badge next to job title */}
                            <div className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold flex items-center gap-0.5 ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </div>
                          </div>
                          <p className="font-medium text-[9px] sm:text-[10px] text-gray-700 truncate">
                            {job.companyName || job.clinicName || job.hospitalName}
                          </p>
                          
                          {/* Job Details - Compact */}
                          <div className="flex flex-wrap gap-1.5 mt-1.5 text-[8px] sm:text-[9px] text-gray-700">
                            {job.department && (
                              <span className="flex items-center gap-0.5">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
                                </svg>
                                {job.department}
                              </span>
                            )}
                            {job.jobType && (
                              <span className="flex items-center gap-0.5">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {job.jobType}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-0.5">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {job.location}
                              </span>
                            )}
                            {job.salary && (
                              <span className="flex items-center gap-0.5 font-semibold text-green-600">
                                {formatSalary(job.salary, currency)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status and Action Buttons - Compact Header Style */}
                      <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                        {/* Active/Inactive Badge */}
                        <div className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-semibold flex items-center gap-0.5 ${
                          job.isActive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${job.isActive ? 'bg-emerald-600' : 'bg-gray-600'}`}></div>
                          {job.isActive ? 'Active' : 'Inactive'}
                        </div>
                        
                        {/* Action Buttons - Compact Header Style */}
                        <button
                          onClick={() => setPreviewJob(job)}
                          className="px-1.5 py-0.5 bg-blue-500 text-white hover:bg-blue-600 rounded text-[7px] sm:text-[8px] font-medium transition-all duration-200 flex items-center gap-0.5"
                          title="Preview"
                        >
                          <Eye className="w-2.5 h-2.5" />
                          Preview
                        </button>
                        {permissions.canUpdate && (
                          <>
                            <button
                              onClick={() => {
                                setEditJob(job);
                                setIsEditing(true);
                              }}
                              className="px-1.5 py-0.5 bg-gray-700 text-white hover:bg-gray-800 rounded text-[7px] sm:text-[8px] font-medium transition-all duration-200 flex items-center gap-0.5"
                              title="Edit"
                            >
                              <Edit className="w-2.5 h-2.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleJob(job._id, job.isActive, job.jobTitle)}
                              disabled={job.status !== 'approved'}
                              className={`px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-medium transition-all duration-200 flex items-center gap-0.5 ${
                                job.status !== 'approved'
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : job.isActive 
                                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                              title={job.status !== 'approved' ? 'Only approved jobs can be activated/deactivated' : ''}
                            >
                              {job.isActive ? <PowerOff className="w-2.5 h-2.5" /> : <Power className="w-2.5 h-2.5" />}
                              {job.isActive ? 'Unpublish' : 'Publish'}
                            </button>
                          </>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => handleDeleteJob(job._id, job.jobTitle)}
                            className="px-1.5 py-0.5 bg-red-500 text-white hover:bg-red-600 rounded text-[7px] sm:text-[8px] font-medium transition-all duration-200 flex items-center gap-0.5"
                            title="Delete"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Job Status Information Bar - Compact */}
                    {job.status === 'pending' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px]">
                          <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-yellow-800 font-medium">Awaiting admin approval before going live</span>
                        </div>
                      </div>
                    )}
                    
                    {job.status === 'declined' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px]">
                          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="text-red-800 font-medium">Job posting was declined - please review and resubmit</span>
                        </div>
                      </div>
                    )}

                    {/* Expandable Job Details */}
                    <details className="mt-4 group">
                      <summary className="cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between">
                        <span>View Details</span>
                        <svg className="w-4 h-4 transform group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-700">
                        {/* Main details grid - 4 columns on large screens */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                          <div><strong>Company:</strong> {job.companyName || 'N/A'}</div>
                          <div><strong>Department:</strong> {job.department || 'N/A'}</div>
                          <div><strong>Qualification:</strong> {job.qualification || 'N/A'}</div>
                          <div><strong>Job Type:</strong> {job.jobType || 'N/A'}</div>
                          <div><strong>Working Days:</strong> {job.workingDays || 'N/A'}</div>
                          <div><strong>Job Timing:</strong> {job.jobTiming || 'N/A'}</div>
                          <div><strong>No. of Openings:</strong> {job.noOfOpenings !== undefined ? job.noOfOpenings : 'N/A'}</div>
                          <div><strong>Establishment:</strong> {job.establishment || 'N/A'}</div>
                           <div><strong>Experience:</strong> {job.experience || 'N/A'}</div>
                          <div><strong>Created:</strong> {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</div>
                          
                          {/* Skills Row */}
                          {job.skills && job.skills.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-4">
                              <strong>Skills:</strong> 
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.skills.map((skill, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Perks Row */}
                          {job.perks && job.perks.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-4">
                              <strong>Perks:</strong> 
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.perks.map((perk, index) => (
                                  <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    {perk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Languages Row */}
                          {job.languagesPreferred && job.languagesPreferred.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-4">
                              <strong>Languages:</strong> 
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.languagesPreferred.map((lang, index) => (
                                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                    {lang}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Description Row */}
                          {job.description && (
                            <div className="sm:col-span-2 lg:col-span-4 border-t border-gray-200 pt-3 mt-2">
                              <strong>Description:</strong>
                              <div
                                className="mt-1 text-gray-700 leading-relaxed bg-white rounded-md border border-gray-200 p-3"
                                // Description may contain basic HTML (e.g., <p> tags) – render it safely
                                dangerouslySetInnerHTML={{ __html: job.description }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && <ConfirmationModal />}

      {/* Preview Modal - Enhanced UI */}
      {previewJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden flex flex-col">
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Job Preview</h2>
                  <p className="text-xs text-gray-600">Review your job posting details</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewJob(null)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-sm rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Enhanced Content */}
            <div className="overflow-y-auto max-h-[75vh]">
              <div className="p-6 space-y-6">
                {/* Title & Company */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">{previewJob.jobTitle}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Building2 className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold">{previewJob.companyName || previewJob.clinicName || previewJob.hospitalName}</span>
                  </div>
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2">
                  {previewJob.department && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold shadow-sm">
                      <Briefcase className="w-3.5 h-3.5" />
                      {previewJob.department}
                    </span>
                  )}
                  {previewJob.jobType && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold shadow-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {previewJob.jobType}
                    </span>
                  )}
                  {previewJob.location && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold shadow-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      {previewJob.location}
                    </span>
                  )}
                  {previewJob.salary && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-sm">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatSalary(previewJob.salary, currency)}
                    </span>
                  )}
                </div>

                {/* Enhanced Details Grid - 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                  {previewJob.companyName || previewJob.clinicName || previewJob.hospitalName ? (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Company</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.companyName || previewJob.clinicName || previewJob.hospitalName}</p>
                      </div>
                    </div>
                  ) : null}
                  {previewJob.department && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-teal-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Department</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.department}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.qualification && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-4 h-4 text-purple-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Qualification</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.qualification}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.jobType && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-green-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Job Type</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.jobType}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.noOfOpenings !== undefined && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-orange-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">No. of Openings</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.noOfOpenings}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.workingDays && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-cyan-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Working Days</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.workingDays}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.establishment && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-indigo-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Establishment</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.establishment}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.jobTiming && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-yellow-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Job Timing</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.jobTiming}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.experience && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-4 h-4 text-pink-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Experience</p>
                        <p className="text-sm text-gray-900 font-semibold">{previewJob.experience}</p>
                      </div>
                    </div>
                  )}
                  {previewJob.createdAt && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Created</p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {new Date(previewJob.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description - Enhanced */}
                {previewJob.description && (
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-teal-700" />
                      </div>
                      Job Description
                    </h4>
                    <div 
                      className="text-gray-700 text-sm leading-relaxed p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-inner"
                      dangerouslySetInnerHTML={{ __html: previewJob.description }}
                    />
                  </div>
                )}

                {/* Skills - Enhanced */}
                {previewJob.skills && previewJob.skills.length > 0 && (
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-blue-700" />
                      </div>
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {previewJob.skills.map((skill, index) => (
                        <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Perks - Enhanced */}
                {previewJob.perks && previewJob.perks.length > 0 && (
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      Perks & Benefits
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {previewJob.perks.map((perk, index) => (
                        <span key={index} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all">
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Compact */}
      {isEditing && editJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col my-4">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div>
                <h2 className="text-base font-bold text-gray-900">Edit Job Posting</h2>
                <p className="text-[9px] text-gray-700 mt-0.5">Update your job posting details</p>
              </div>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditJob(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <JobPostingForm
                onSubmit={handleEditJob}
                isSubmitting={isSubmitting}
                title="Edit Job Posting"
                subtitle="Update your job posting details"
                isCompact={true}
                initialData={{
                  companyName: editJob.companyName || '',
                  jobTitle: editJob.jobTitle || '',
                  department: editJob.department || '',
                  qualification: editJob.qualification || '',
                  jobType: editJob.jobType || '',
                  location: editJob.location || '',
                  jobTiming: editJob.jobTiming || '',
                  skills: Array.isArray(editJob.skills) ? editJob.skills.join(', ') : editJob.skills || '',
                  perks: Array.isArray(editJob.perks) ? editJob.perks.join(', ') : editJob.perks || '',
                  languagesPreferred: Array.isArray(editJob.languagesPreferred) ? editJob.languagesPreferred.join(', ') : editJob.languagesPreferred || '',
                  description: editJob.description || '',
                  noOfOpenings: editJob.noOfOpenings?.toString() || '',
                  salary: editJob.salary || '',
                  salaryType: '',
                  experience: editJob.experience || '',
                  establishment: editJob.establishment || '',
                  workingDays: editJob.workingDays || '',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;
