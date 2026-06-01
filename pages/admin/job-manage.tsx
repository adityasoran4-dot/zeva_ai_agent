"use client";

import axios from "axios";
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";

import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon as GridIcon,
  Bars3Icon as ListIcon,
} from "@heroicons/react/24/outline";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

// Define a Job interface
interface Job {
  _id: string;
  jobTitle: string;
  companyName: string;
  location: string;
  department: string;
  qualification: string;
  jobType: string;
  salary?: string;
  salaryType?: string;
  postedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  workingDays?: string;
  jobTiming?: string;
  skills?: string[];
  perks?: string[];
  languagesPreferred?: string[];
  description?: string;
  noOfOpenings?: number;
  establishment?: string;
  experience?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface JobsData {
  pending: Job[];
  approved: Job[];
  declined: Job[];
}

interface Filters {
  search: string;
  jobType: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  department: string;
}

interface ConfirmationModal {
  isOpen: boolean;
  type: 'approve' | 'decline' | 'delete' | null;
  jobId: string;
  jobTitle: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Toast Component
const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircleIcon className="w-4 h-4" />,
    error: <XCircleIcon className="w-4 h-4" />,
    info: <InformationCircleIcon className="w-4 h-4" />,
    warning: <ExclamationTriangleIcon className="w-4 h-4" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`${colors[toast.type]} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded p-0.5 transition-colors"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

const JOBS_PER_PAGE = 9;

function AdminJobs() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [jobs, setJobs] = useState<JobsData>({
    pending: [],
    approved: [],
    declined: [],
  });

  // Store all unfiltered jobs for filter options (location, jobType, department)
  const [allJobsForFilters, setAllJobsForFilters] = useState<JobsData>({
    pending: [],
    approved: [],
    declined: [],
  });

  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "declined">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    jobType: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    department: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openSelect, setOpenSelect] = useState<null | 'jobType' | 'location' | 'department'>(null);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    type: null,
    jobId: '',
    jobTitle: '',
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  
  // Track if initial load has completed
  const initialLoadDone = useRef(false);
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  // Always call the hook (React rules), but only use it if isAgent is true
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_manage_job" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  // Fetch all unfiltered jobs for filter options
  const fetchAllJobsForFilters = useCallback(async () => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      if (!token) return;
      
      const res = await axios.get<{ success: boolean; pending: Job[]; approved: Job[]; declined: Job[] }>("/api/admin/job-manage", {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      
      if (res?.data) {
        const allJobsData: JobsData = {
          pending: res.data.pending || [],
          approved: res.data.approved || [],
          declined: res.data.declined || [],
        };
        setAllJobsForFilters(allJobsData);
      }
    } catch (error) {
      console.error('Failed to fetch all jobs for filters:', error);
    }
  }, []);

  // Fetch jobs function with filter and pagination support
  const fetchJobs = useCallback(async (filterParams?: Filters, pageNum?: number) => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      if (!token) {
        setIsLoading(false);
        showToast('No authentication token found', 'error');
        return;
      }
      
      setIsLoading(true);
      
      // Build query parameters from filters
      const queryParams = new URLSearchParams();
      if (filterParams) {
        if (filterParams.search) queryParams.append('search', filterParams.search);
        if (filterParams.jobType) queryParams.append('jobType', filterParams.jobType);
        if (filterParams.location) queryParams.append('location', filterParams.location);
        if (filterParams.department) queryParams.append('department', filterParams.department);
        if (filterParams.salaryMin) queryParams.append('salaryMin', filterParams.salaryMin);
        if (filterParams.salaryMax) queryParams.append('salaryMax', filterParams.salaryMax);
      }
      
      // Add pagination for approved section only
      if (activeTab === 'approved') {
        const pageToUse = pageNum !== undefined ? pageNum : currentPage;
        queryParams.append('page', pageToUse.toString());
        queryParams.append('limit', JOBS_PER_PAGE.toString());
        queryParams.append('status', 'approved');
      }
      
      const url = `/api/admin/job-manage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔍 Fetching jobs with filters:', filterParams, 'URL:', url);
      
      const res = await axios.get<{ success: boolean; pending: Job[]; approved: Job[]; declined: Job[]; pagination?: any }>(url, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(err => {
        if (err.response?.status === 403) {
          showToast('Permission denied: You do not have access to view jobs', 'error');
          return { data: { success: true, pending: [], approved: [], declined: [] } };
        }
        throw err;
      });
      
      // Extract jobs data from response (response has success field)
      const jobsData: JobsData = {
        pending: res.data?.pending || [],
        approved: res.data?.approved || [],
        declined: res.data?.declined || [],
      };
      
      // Update pagination info if available (for approved section)
      if (activeTab === 'approved' && res.data && 'pagination' in res.data && res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages);
        setTotalJobs(res.data.pagination.totalJobs);
      } else if (activeTab !== 'approved') {
        // For other tabs, calculate pagination client-side
        const tabJobs = jobsData[activeTab] || [];
        setTotalPages(Math.ceil(tabJobs.length / JOBS_PER_PAGE));
        setTotalJobs(tabJobs.length);
      }
      
      console.log('📦 Jobs data received:', jobsData);
      setJobs(jobsData);
      
      // If no filters, also update allJobsForFilters (for filter options)
      if (!filterParams || !Object.values(filterParams).some(f => f)) {
        setAllJobsForFilters(jobsData);
      }
      
      // Don't show toast on pagination change
      if (!pageNum) {
        const totalJobs = (jobsData.pending?.length || 0) + (jobsData.approved?.length || 0) + (jobsData.declined?.length || 0);
        if (filterParams && Object.values(filterParams).some(f => f)) {
          showToast(`Found ${totalJobs} jobs matching your filters`, 'success');
        } else {
          showToast(`Loaded ${totalJobs} jobs successfully`, 'success');
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch jobs:', error);
      if (error.response?.status === 403) {
        setJobs({ pending: [], approved: [], declined: [] });
      } else {
        showToast(error.response?.data?.message || 'Failed to fetch jobs', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [showToast, activeTab, currentPage]);

  useEffect(() => {
    if (isAdmin) {
      // On initial load, fetch without pagination to get all jobs for filter options
      // Then if on approved tab, fetch with pagination
      if (activeTab === 'approved') {
        fetchJobs(filters, currentPage);
      } else {
        fetchJobs();
      }
      fetchAllJobsForFilters(); // Also fetch all jobs for filter options
      initialLoadDone.current = true;
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          if (activeTab === 'approved') {
            fetchJobs(filters, currentPage);
          } else {
            fetchJobs();
          }
          fetchAllJobsForFilters(); // Also fetch all jobs for filter options
          initialLoadDone.current = true;
        } else {
          setIsLoading(false);
        }
      }
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions, fetchJobs, fetchAllJobsForFilters, activeTab, currentPage, filters]);

  // Removed auto-apply - filters will only be applied when "Apply Filters" button is clicked

  const deleteJob = async (jobId: string) => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to delete jobs", 'error');
      return;
    }
    
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
    const token = adminToken || agentToken;

    if (!token) {
      showToast("No token found. Please login again.", 'error');
      return;
    }

    try {
      await axios.delete(`/api/admin/job-updateStatus?jobId=${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast('Job deleted successfully', 'success');
      // Refetch jobs with current filters
      fetchJobs(filters);
      // Also refresh filter options
      fetchAllJobsForFilters();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete job', 'error');
    }
  };

  const updateStatus = async (jobId: string, status: "approved" | "declined") => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to approve/decline jobs", 'error');
      return;
    }
    
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
    const token = adminToken || agentToken;

    if (!token) {
      showToast("No token found. Please login again.", 'error');
      return;
    }
    
    try {
      const response = await axios.patch(
        "/api/admin/job-updateStatus",
        { jobId, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Enhanced success message for approval with SEO details
      if (status === "approved") {
        // Show SEO messages if available
        if (response.data?.seo_messages && Array.isArray(response.data.seo_messages)) {
          response.data.seo_messages.forEach((msg: { type: string; message: string }) => {
            showToast(msg.message, msg.type as 'success' | 'error' | 'info' | 'warning');
          });
        }
        
        // Show slug lock message if available
        if (response.data?.slug_lock_message) {
          showToast(response.data.slug_lock_message, 'success');
        }
        
        // Default success message
        showToast(`Job approved successfully. SEO pipeline initiated.`, 'success');
      } else {
        showToast(`Job ${status} successfully`, 'success');
      }
      // Refetch jobs with current filters
      fetchJobs(filters);
      // Also refresh filter options
      fetchAllJobsForFilters();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || `Failed to ${status} job`, 'error');
    }
  };

  const openConfirmationModal = (type: 'approve' | 'decline' | 'delete', jobId: string, jobTitle: string) => {
    setConfirmationModal({
      isOpen: true,
      type,
      jobId,
      jobTitle,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      type: null,
      jobId: '',
      jobTitle: '',
    });
  };

  const handleConfirmAction = () => {
    const { type, jobId } = confirmationModal;

    if (type === 'delete') {
      deleteJob(jobId);
    } else if (type === 'approve') {
      updateStatus(jobId, 'approved');
    } else if (type === 'decline') {
      updateStatus(jobId, 'declined');
    }

    closeConfirmationModal();
  };

  // Extract unique values for filter options from ALL unfiltered jobs
  // This ensures filter options always show all available options, not just filtered ones
  const filterOptions = useMemo(() => {
    const allJobs = [...allJobsForFilters.pending, ...allJobsForFilters.approved, ...allJobsForFilters.declined];

    return {
      jobTypes: [...new Set(allJobs.map(job => job.jobType))].filter(Boolean).sort(),
      locations: [...new Set(allJobs.map(job => job.location))].filter(Boolean).sort(),
      departments: [...new Set(allJobs.map(job => job.department))].filter(Boolean).sort(),
    };
  }, [allJobsForFilters]);

  // Filter and search logic - now jobs are already filtered from API, so just use them directly
  const filteredJobs = useMemo(() => {
    const result = jobs[activeTab] || [];
    console.log(`📊 Filtered jobs for ${activeTab}:`, result.length, result);
    return result;
  }, [jobs, activeTab]);

  // Pagination logic
  // For approved section, use backend pagination (jobs already paginated)
  // For other sections, use client-side pagination
  const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
  const paginatedJobs = useMemo(() => {
    if (activeTab === 'approved') {
      // Backend already paginated, use directly
      return filteredJobs;
    } else {
      // Client-side pagination for pending/declined
      return filteredJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);
    }
  }, [filteredJobs, activeTab, startIndex]);

  // Track previous filters and tab to detect changes
  const prevFiltersRef = useRef<string>(JSON.stringify(filters));
  const prevActiveTabRef = useRef<string>(activeTab);
  
  // Reset pagination when filters or tab changes (but not when page changes)
  useEffect(() => {
    const filtersChanged = prevFiltersRef.current !== JSON.stringify(filters);
    const tabChanged = prevActiveTabRef.current !== activeTab;
    
    if (filtersChanged || tabChanged) {
      setCurrentPage(1);
      // Recalculate pagination for non-approved tabs
      if (activeTab !== 'approved') {
        const tabJobs = jobs[activeTab] || [];
        setTotalPages(Math.ceil(tabJobs.length / JOBS_PER_PAGE));
        setTotalJobs(tabJobs.length);
      }
      prevFiltersRef.current = JSON.stringify(filters);
      prevActiveTabRef.current = activeTab;
    }
  }, [filters, activeTab, jobs]);
  
  // Fetch jobs when page changes for approved section ONLY (don't reset page)
  useEffect(() => {
    if (activeTab === 'approved' && initialLoadDone.current) {
      // Only fetch if page actually changed, not if filters/tab changed
      fetchJobs(filters, currentPage);
    }
  }, [currentPage]);

  const handleFilterChange = (key: keyof Filters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || "" }));
  };

  const applyFilters = useCallback(() => {
    console.log('🔍 Apply Filters clicked with filters:', filters);
    // Check if user has permission
    if (isAdmin) {
      fetchJobs(filters);
    } else if (isAgent) {
      if (!permissionsLoading && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
        fetchJobs(filters);
      }
    } else {
      showToast('You do not have permission to apply filters', 'error');
    }
  }, [filters, isAdmin, isAgent, permissionsLoading, agentPermissions, fetchJobs, showToast]);

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      jobType: "",
      location: "",
      salaryMin: "",
      salaryMax: "",
      department: "",
    };
    setFilters(emptyFilters);
    showToast('Filters cleared', 'info');
    // Refetch without filters
    if (isAdmin) {
      fetchJobs(emptyFilters);
    } else if (isAgent) {
      if (!permissionsLoading && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
        fetchJobs(emptyFilters);
      }
    }
  };

  // Close custom selects on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (openSelect && !(event.target as HTMLElement).closest('.custom-select')) {
        setOpenSelect(null);
      }
    };
    if (openSelect) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openSelect]);

  const getTabCount = (status: keyof JobsData) => {
    if (status === activeTab) {
      return filteredJobs.length;
    }
    return jobs[status].length;
  };

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  if (isLoading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-blue-700">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Access Denied</h2>
          <p className="text-blue-700 mb-4">
            You do not have permission to view job management. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pt-2 sm:pt-3 lg:pt-4 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-blue-800 to-blue-900 p-2.5 rounded-xl shadow-md">
                <BriefcaseIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg font-bold text-blue-900">
                    Job Management
                  </h1>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">New</span>
                </div>
                <p className="text-sm text-blue-600">
                  Manage and review job listings across different statuses
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showFilters
                    ? 'bg-blue-800 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                Filters
              </button>

              <div className="flex items-center gap-2 border border-blue-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-blue-800 text-white" : "text-blue-700 hover:bg-blue-100"}`}
                >
                  <GridIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-blue-800 text-white" : "text-blue-700 hover:bg-blue-100"}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-blue-200">
            {[
              { title: 'Pending', value: jobs.pending.length, icon: ClockIcon, color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
              { title: 'Approved', value: jobs.approved.length, icon: CheckCircleIcon, color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
              { title: 'Declined', value: jobs.declined.length, icon: XCircleIcon, color: 'bg-rose-500', bgColor: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className={`${stat.bgColor} ${stat.borderColor} rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-medium ${stat.textColor} uppercase tracking-wide mb-0.5`}>{stat.title}</p>
                      <p className="text-xl font-bold text-blue-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-2 rounded-lg text-white shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 p-4">
          <nav className="flex space-x-4 border-b border-blue-200">
            {(['pending', 'approved', 'declined'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                  showToast(`Switched to ${tab} jobs`, 'info');
                }}
                className={`py-1.5 px-2 border-b-2 font-medium text-xs capitalize transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-blue-800 text-blue-800'
                    : 'border-transparent text-blue-600 hover:text-blue-900 hover:border-blue-300'
                  }`}
              >
                {tab} ({getTabCount(tab)})
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-blue-200/50 p-3">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-blue-900">Filters & Search</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-700" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Job title, company, department..."
                    className="w-full pl-10 pr-3 py-2 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-transparent"
              />
                </div>
            </div>

            {/* Job Type Filter */}
            <div className="custom-select relative">
              <label className="block text-sm font-medium text-blue-700 mb-1">Job Type</label>
              <button
                type="button"
                onClick={() => setOpenSelect(openSelect === 'jobType' ? null : 'jobType')}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-transparent flex items-center justify-between"
              >
                <span className="truncate">{filters.jobType || "All Types"}</span>
                <svg
                  className={`w-4 h-4 text-blue-500 transition-transform ${openSelect === 'jobType' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSelect === 'jobType' && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-56 overflow-y-auto overscroll-contain">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('jobType', "");
                      setOpenSelect(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${filters.jobType === "" ? "bg-blue-50 text-blue-600" : "text-blue-900"}`}
                  >
                    All Types
                  </button>
                  {filterOptions.jobTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        handleFilterChange('jobType', type);
                        setOpenSelect(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${filters.jobType === type ? "bg-blue-50 text-blue-600" : "text-blue-900"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div className="custom-select relative">
              <label className="block text-sm font-medium text-blue-700 mb-1">Location</label>
              <button
                type="button"
                onClick={() => setOpenSelect(openSelect === 'location' ? null : 'location')}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-transparent flex items-center justify-between"
              >
                <span className="truncate">{filters.location || "All Locations"}</span>
                <svg
                  className={`w-4 h-4 text-blue-500 transition-transform ${openSelect === 'location' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSelect === 'location' && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-56 overflow-y-auto overscroll-contain">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('location', "");
                      setOpenSelect(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${filters.location === "" ? "bg-blue-50 text-blue-600" : "text-blue-900"}`}
                  >
                    All Locations
                  </button>
                  {filterOptions.locations.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => {
                        handleFilterChange('location', location);
                        setOpenSelect(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${filters.location === location ? "bg-blue-50 text-blue-600" : "text-blue-900"}`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Department Filter */}
            <div className="custom-select relative">
              <label className="block text-sm font-medium text-blue-700 mb-1">Department</label>
              <button
                type="button"
                onClick={() => setOpenSelect(openSelect === 'department' ? null : 'department')}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-transparent flex items-center justify-between"
              >
                <span className="truncate">{filters.department || "All Departments"}</span>
                <svg
                  className={`w-4 h-4 text-blue-500 transition-transform ${openSelect === 'department' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSelect === 'department' && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-56 overflow-y-auto overscroll-contain">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('department', "");
                      setOpenSelect(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${filters.department === "" ? "bg-blue-50 text-blue-600" : "text-blue-900"}`}
                  >
                    All Departments
                  </button>
                  {filterOptions.departments.map((department) => (
                    <button
                      key={department}
                      type="button"
                      onClick={() => {
                        handleFilterChange('department', department);
                        setOpenSelect(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-100 transition-colors ${filters.department === department ? "bg-blue-50 text-blue-600" : "text-blue-900"}`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Salary Range */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-blue-700 mb-1">Salary Range</label>
              <div className="flex items-end gap-10">
                <div className="flex space-x-2 flex-1">
                  <input
                    type="number"
                    value={filters.salaryMin}
                    onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                    placeholder="Min salary"
                      className="flex-1 px-2 py-2 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-transparent"
                  />
                    <span className="flex items-center text-blue-700">to</span>
                  <input
                    type="number"
                    value={filters.salaryMax}
                    onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                    placeholder="Max salary"
                      className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyFilters}
                  className="flex items-center px-3 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
          <p className="text-sm text-blue-700">
            Showing {paginatedJobs.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + JOBS_PER_PAGE, activeTab === 'approved' ? totalJobs : filteredJobs.length)} of {activeTab === 'approved' ? totalJobs : filteredJobs.length} {activeTab} job{(activeTab === 'approved' ? totalJobs : filteredJobs.length) !== 1 ? 's' : ''}
            {Object.values(filters).some(filter => filter) && ' (filtered)'}
          </p>
        </div>

        {/* Job Cards */}
          {paginatedJobs.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[600px]" : "space-y-4"}>
            {paginatedJobs.map((job) => (
              <div key={job._id} className="bg-white border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                {/* Compact Header */}
                <div className="p-4 border-b border-blue-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-blue-900 line-clamp-2 flex-1">{job.jobTitle}</h3>
                    {job.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        job.status === 'approved' ? 'bg-green-100 text-green-800' :
                            job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                        {job.status}
                        </span>
                    )}
                      </div>
                  <div className="flex items-center gap-3 text-xs text-blue-700">
                    <div className="flex items-center gap-1">
                      <BuildingOfficeIcon className="w-3 h-3" />
                      <span className="truncate">{job.companyName}</span>
                  </div>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-3 h-3" />
                      <span className="truncate">{job.location}</span>
                          </div>
                        </div>
                          </div>

                {/* Compact Details */}
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {job.salary && (
                      <div className="flex items-center gap-1 text-gray-700">
                        <CurrencyDollarIcon className="w-3 h-3 text-green-600" />
                        <span className="truncate">{job.salary} {job.salaryType || ''}</span>
                        </div>
                      )}
                    <div className="flex items-center gap-1 text-gray-700">
                      <ClockIcon className="w-3 h-3 text-green-600" />
                      <span className="truncate">{job.jobType}</span>
                          </div>
                    {job.noOfOpenings !== undefined && (
                      <div className="flex items-center gap-1 text-gray-700">
                        <UserGroupIcon className="w-3 h-3 text-purple-600" />
                        <span>{job.noOfOpenings} openings</span>
                        </div>
                      )}
                    {job.department && (
                      <div className="flex items-center gap-1 text-gray-700">
                        <BriefcaseIcon className="w-3 h-3 text-purple-600" />
                        <span className="truncate">{job.department}</span>
                    </div>
                    )}
                  </div>

                  {job.postedBy && (
                    <div className="text-xs text-gray-700 pt-2 border-t border-gray-100">
                      <span className="font-medium">Posted by:</span> {job.postedBy.name} ({job.postedBy.role})
                    </div>
                  )}

                      {job.createdAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-700">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                        </div>

                {/* See Full Details Button */}
                <div className="px-4 pb-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowJobDetails(true);
                    }}
                    className="w-full px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                  >
                    <InformationCircleIcon className="w-3 h-3" />
                    See Full Details
                  </button>
                    </div>

                    {/* Action Buttons */}
                <div className="p-4 pt-0 flex flex-wrap gap-2">
                      {(() => {
                        const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                        const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                        const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                        
                        const shouldShowAction = (action: 'approve' | 'decline' | 'delete') => {
                          if (!isAgentRoute && adminTokenExists && isAdmin) {
                            return true;
                          }
                          
                          if ((isAgentRoute || isAgent) && agentTokenExists) {
                            if (permissionsLoading || !agentPermissions) {
                              return false;
                            }
                            
                            if (action === 'approve' || action === 'decline') {
                              return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                            }
                            if (action === 'delete') {
                              return agentPermissions.canDelete === true || agentPermissions.canAll === true;
                            }
                          }
                          
                          return false;
                        };
                        
                        return (
                          <>
                            {activeTab === "pending" && (
                              <>
                                {shouldShowAction('approve') && (
                                  <button
                                    onClick={() => openConfirmationModal('approve', job._id, job.jobTitle)}
                                className="flex-1 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <CheckCircleIcon className="w-3 h-3" />
                                    Approve
                                  </button>
                                )}
                                {shouldShowAction('decline') && (
                                  <button
                                    onClick={() => openConfirmationModal('decline', job._id, job.jobTitle)}
                                className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <XCircleIcon className="w-3 h-3" />
                                    Decline
                                  </button>
                                )}
                                {shouldShowAction('delete') && (
                                  <button
                                    onClick={() => openConfirmationModal('delete', job._id, job.jobTitle)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <TrashIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            )}
                            {activeTab === "approved" && (
                              <>
                                {shouldShowAction('decline') && (
                                  <button
                                    onClick={() => openConfirmationModal('decline', job._id, job.jobTitle)}
                                className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <XCircleIcon className="w-3 h-3" />
                                    Decline
                                  </button>
                                )}
                                {shouldShowAction('delete') && (
                                  <button
                                    onClick={() => openConfirmationModal('delete', job._id, job.jobTitle)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <TrashIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            )}
                            {activeTab === "declined" && (
                              <>
                                {shouldShowAction('approve') && (
                                  <button
                                    onClick={() => openConfirmationModal('approve', job._id, job.jobTitle)}
                                className="flex-1 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <CheckCircleIcon className="w-3 h-3" />
                                    Approve
                                  </button>
                                )}
                                {shouldShowAction('delete') && (
                                  <button
                                    onClick={() => openConfirmationModal('delete', job._id, job.jobTitle)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                                  >
                                <TrashIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
            ))}
            {/* Empty placeholder cards to maintain grid layout when cards are less than 9 */}
            {viewMode === "grid" && paginatedJobs.length < JOBS_PER_PAGE && 
              Array.from({ length: JOBS_PER_PAGE - paginatedJobs.length }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-transparent border-0" aria-hidden="true"></div>
              ))
            }
                </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-12 text-center">
            <BriefcaseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-blue-700 mb-4">
                {Object.values(filters).some(filter => filter)
                  ? "Try adjusting your filters or search terms"
                  : `No ${activeTab} jobs available`}
              </p>
              {Object.values(filters).some(filter => filter) && (
                <button
                  onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

        {/* Pagination - Fixed position, only Next/Previous */}
        {(activeTab === 'approved' ? totalJobs > JOBS_PER_PAGE : totalPages > 1) && (
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 mt-4">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        {showJobDetails && selectedJob && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-blue-800 rounded-t-2xl p-4 sm:p-6 text-white relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                <div className="relative flex items-start justify-between gap-4 min-w-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 sm:gap-3 flex-wrap">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BriefcaseIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span className="break-words">{selectedJob.jobTitle}</span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/90">
                      {selectedJob.companyName && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <BuildingOfficeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{selectedJob.companyName}</span>
                        </div>
                      )}
                      {selectedJob.location && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPinIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{selectedJob.location}</span>
                        </div>
                      )}
                      {selectedJob.status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          selectedJob.status === 'approved' ? 'bg-green-500 text-white' :
                          selectedJob.status === 'pending' ? 'bg-yellow-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {selectedJob.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowJobDetails(false);
                      setSelectedJob(null);
                    }}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Key Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedJob.salary && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-blue-700 font-medium uppercase tracking-wider">Salary</div>
                        <div className="font-semibold text-blue-900">{selectedJob.salary} {selectedJob.salaryType || ''}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-700 font-medium uppercase tracking-wider">Job Type</div>
                      <div className="font-semibold text-blue-900">{selectedJob.jobType}</div>
                    </div>
                  </div>

                  {selectedJob.noOfOpenings !== undefined && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-xs text-blue-700 font-medium uppercase tracking-wider">Openings</div>
                        <div className="font-semibold text-blue-900">{selectedJob.noOfOpenings}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-blue-200">
                      <span className="text-sm font-medium text-blue-700">Department</span>
                      <span className="text-sm text-blue-900">{selectedJob.department}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-blue-200">
                      <span className="text-sm font-medium text-blue-700">Qualification</span>
                      <span className="text-sm text-blue-900">{selectedJob.qualification}</span>
                    </div>
                    {selectedJob.experience && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Experience</span>
                        <span className="text-sm text-blue-900">{selectedJob.experience}</span>
                      </div>
                    )}
                    {selectedJob.establishment && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Established</span>
                        <span className="text-sm text-blue-900">{selectedJob.establishment}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedJob.workingDays && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Working Days</span>
                        <span className="text-sm text-blue-900">{selectedJob.workingDays}</span>
                      </div>
                    )}
                    {selectedJob.jobTiming && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Timing</span>
                        <span className="text-sm text-blue-900">{selectedJob.jobTiming}</span>
                      </div>
                    )}
                    {selectedJob.isActive !== undefined && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Active</span>
                        <span className={`text-sm font-medium ${selectedJob.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedJob.isActive ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                    {selectedJob.createdAt && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Created</span>
                        <span className="text-sm text-blue-900">{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedJob.updatedAt && (
                      <div className="flex justify-between py-2 border-b border-blue-200">
                        <span className="text-sm font-medium text-blue-700">Updated</span>
                        <span className="text-sm text-blue-900">{new Date(selectedJob.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Posted By */}
                {selectedJob.postedBy && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Posted By</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div><span className="font-medium">Name:</span> {selectedJob.postedBy.name}</div>
                      <div><span className="font-medium">Email:</span> {selectedJob.postedBy.email}</div>
                      <div><span className="font-medium">Role:</span> {selectedJob.postedBy.role}</div>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {(selectedJob.skills?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Skills Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedJob.skills || []).map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Perks */}
                {(selectedJob.perks?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Perks & Benefits</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedJob.perks || []).map((perk, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {perk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {(selectedJob.languagesPreferred?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Languages Preferred</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedJob.languagesPreferred || []).map((language, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Job Description</h4>
                    <div 
                      className="text-sm text-blue-700 bg-blue-50 p-4 rounded-lg leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedJob.description }}
                    />
                  </div>
                )}
              </div>

              {/* Footer with Actions */}
              <div className="border-t border-blue-200 p-6 bg-blue-50">
                <div className="flex flex-wrap gap-2 justify-end">
                  {(() => {
                    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                    
                    const shouldShowAction = (action: 'approve' | 'decline' | 'delete') => {
                      if (!isAgentRoute && adminTokenExists && isAdmin) {
                        return true;
                      }
                      
                      if ((isAgentRoute || isAgent) && agentTokenExists) {
                        if (permissionsLoading || !agentPermissions) {
                          return false;
                        }
                        
                        if (action === 'approve' || action === 'decline') {
                          return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                        }
                        if (action === 'delete') {
                          return agentPermissions.canDelete === true || agentPermissions.canAll === true;
                        }
                      }
                      
                      return false;
                    };
                    
                    return (
                      <>
                        {activeTab === "pending" && (
                          <>
                            {shouldShowAction('approve') && (
                          <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('approve', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                Approve
                          </button>
                        )}
                            {shouldShowAction('decline') && (
                  <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('decline', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <XCircleIcon className="w-4 h-4" />
                                Decline
                  </button>
                            )}
                            {shouldShowAction('delete') && (
                              <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('delete', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {activeTab === "approved" && (
                          <>
                            {shouldShowAction('decline') && (
                              <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('decline', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <XCircleIcon className="w-4 h-4" />
                                Decline
                              </button>
                            )}
                            {shouldShowAction('delete') && (
                              <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('delete', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        {activeTab === "declined" && (
                          <>
                            {shouldShowAction('approve') && (
                              <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('approve', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                                Approve
                              </button>
                            )}
                            {shouldShowAction('delete') && (
                              <button
                                onClick={() => {
                                  setShowJobDetails(false);
                                  openConfirmationModal('delete', selectedJob._id, selectedJob.jobTitle);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                              >
                                <TrashIcon className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => {
                            setShowJobDetails(false);
                            setSelectedJob(null);
                          }}
                          className="px-4 py-2 bg-blue-200 hover:bg-blue-300 text-blue-700 text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                          Close
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Confirmation Modal */}
        {confirmationModal.isOpen && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 max-w-md w-full transform transition-all duration-300 ease-out">
              <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center">
                  {confirmationModal.type === "approve" && (
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon className="w-8 h-8 text-green-600" />
                        </div>
                      )}
                  {confirmationModal.type === "decline" && (
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="w-8 h-8 text-yellow-600" />
                        </div>
                      )}
                  {confirmationModal.type === "delete" && (
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircleIcon className="w-8 h-8 text-red-600" />
                        </div>
                      )}
                    </div>

                <h2 className="text-2xl font-bold text-blue-900 mb-2 capitalize">
                  Confirm {confirmationModal.type}
                </h2>

                <p className="text-base text-blue-700 mb-8 leading-relaxed">
                  Are you sure you want to {confirmationModal.type} this job?
                  {confirmationModal.type === "delete" && (
                    <span className="block mt-2 text-red-600 font-medium text-sm">
                      This action cannot be undone.
                    </span>
                        )}
                      </p>

                <div className="flex gap-3">
                  <button
                    onClick={closeConfirmationModal}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-6 py-3 rounded-xl font-medium text-base transition-all duration-200 hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAction}
                    className={`flex-1 text-white px-6 py-3 rounded-xl font-medium text-base transition-all duration-200 hover:shadow-md ${
                      confirmationModal.type === "approve"
                        ? "bg-blue-800 hover:bg-blue-700"
                        : confirmationModal.type === "decline"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {confirmationModal.type === "approve"
                      ? "Approve"
                      : confirmationModal.type === "decline"
                        ? "Decline"
                        : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

AdminJobs.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminJobs);
ProtectedDashboard.getLayout = AdminJobs.getLayout;

export default ProtectedDashboard;
