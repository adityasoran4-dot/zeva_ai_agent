import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { Plus, Edit2, Trash2, Package, Activity, X, Check, CheckCircle, XCircle, AlertCircle, Info, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500 border-emerald-600",
    error: "bg-rose-500 border-rose-600",
    info: "bg-blue-500 border-blue-600",
    warning: "bg-amber-500 border-amber-600"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />
  };

  return (
    <div className={`${styles[type]} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg border flex items-center gap-2 sm:gap-3 min-w-[280px] sm:min-w-[300px] max-w-[calc(100vw-2rem)] sm:max-w-md backdrop-blur-sm animate-[slide-in_0.3s_ease-out]`}>
      {icons[type]}
      <span className="flex-1 font-medium text-sm sm:text-base">{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded-lg p-1 sm:p-1.5 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmModal({ isOpen, onConfirm, onCancel, title, message }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 animate-[scale-in_0.2s_ease-out] mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900">{title}</h3>
        </div>
        <p className="text-sm sm:text-base text-slate-600 mb-5 sm:mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors shadow-sm text-sm sm:text-base"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            1
          </button>
          {startPage > 2 && <span className="text-slate-400">...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-sm font-medium transition-colors ${
            currentPage === page
              ? "bg-indigo-600 text-white shadow-sm"
              : "border border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-slate-400">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}

function AdminStaffTreatments() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({ package: "", treatment: "", packagePrice: "", treatmentPrice: "" });
  const [treatments, setTreatments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, onConfirm: null, title: "", message: "" });
  
  const formRef = useRef(null);

  const ITEMS_PER_PAGE = 7;
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Admin Add Service - Initial Token Check:', { 
        adminToken, 
        agentToken, 
        isAgentRoute,
        pathname: router.pathname,
        locationPath: window.location.pathname
      });
      
      // CRITICAL: If on agent route, prioritize agentToken over adminToken
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
  // This page is under Staff Management -> Create Services submodule
  const agentPermissionsData = useAgentPermissions(isAgent ? "admin_staff_management" : null, isAgent ? "Create Services" : null);
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const showToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirm = (title, message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmModal({ isOpen: false, onConfirm: null, title: "", message: "" });
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal({ isOpen: false, onConfirm: null, title: "", message: "" });
          resolve(false);
        }
      });
    });
  };

  const fetchTreatments = async () => {
    try {
      setFetching(true);
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      const res = await axios.get("/api/admin/staff-treatments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        setTreatments(res.data.data);
        showToast("Treatments loaded successfully", "success");
      } else {
       
        setTreatments([]);
        showToast("No treatments found", "info");
      }
    } catch (err) {
      console.error("Error fetching treatments:", err);
      // Handle 403 permission denied errors
      if (err.response?.status === 403) {
        setTreatments([]);
        showToast(err.response?.data?.message || "Permission denied", "error");
      } else {
        showToast("Failed to load treatments", "error");
        setTreatments([]);
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTreatments();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchTreatments();
        } else {
          setFetching(false); // Agent doesn't have read permission - stop loading
        }
      }
    } else {
      setFetching(false); // Neither admin nor agent - stop loading
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async () => {
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canCreate !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to create services", "error");
      return;
    }
    
    if (!formData.package.trim() && !formData.treatment.trim()) {
      showToast("Please enter at least a package or a treatment", "warning");
      return;
    }

    try {
      setLoading(true);
      
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      const payload = {};
      if (formData.package.trim()) payload.package = formData.package.trim();
      if (formData.treatment.trim()) payload.treatment = formData.treatment.trim();
      if (formData.packagePrice !== "") payload.packagePrice = Number(formData.packagePrice);
      if (formData.treatmentPrice !== "") payload.treatmentPrice = Number(formData.treatmentPrice);

      const res = await axios.post("/api/admin/staff-treatments", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.success) {
        showToast("Record added successfully", "success");
        setFormData({ package: "", treatment: "", packagePrice: "", treatmentPrice: "" });
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error adding record:", err);
      showToast("Failed to add record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({ package: item.package || "", treatment: item.treatment || "", packagePrice: item.packagePrice ?? "", treatmentPrice: item.treatmentPrice ?? "" });
    setEditingId(item._id);
    showToast("Editing mode activated", "info");
    
    // Scroll to form section using ref
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canUpdate !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to update services", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      const payload = { id: editingId };
      payload.package = formData.package.trim() || "";
      payload.treatment = formData.treatment.trim() || "";
      if (formData.packagePrice !== "") payload.packagePrice = Number(formData.packagePrice);
      if (formData.treatmentPrice !== "") payload.treatmentPrice = Number(formData.treatmentPrice);

      const res = await axios.put("/api/admin/staff-treatments", payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.success) {
        showToast("Record updated successfully", "success");
        setEditingId(null);
        setFormData({ package: "", treatment: "", packagePrice: "", treatmentPrice: "" });
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error updating record:", err);
      showToast("Failed to update record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      "Delete Record",
      "Are you sure you want to delete this item? This action cannot be undone."
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await axios.delete(`/api/admin/staff-treatments?id=${id}`);
      if (res.data.success) {
        showToast("Record deleted successfully", "success");
        fetchTreatments();
      }
    } catch (err) {
      console.error("Error deleting:", err);
      showToast("Failed to delete record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ package: "", treatment: "" });
    setEditingId(null);
    showToast("Edit cancelled", "info");
  };

  // Filter logic
  const filteredTreatments = treatments.filter(item => {
    const matchesSearch = 
      (item.package?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.treatment?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (activeTab === "all") {
      return (item.package && item.package.trim()) || (item.treatment && item.treatment.trim());
    }
    if (activeTab === "packages") {
      return item.package && item.package.trim();
    }
    if (activeTab === "treatments") {
      return item.treatment && item.treatment.trim();
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTreatments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTreatments = filteredTreatments.slice(startIndex, endIndex);

  // Updated counts
  const allCount = treatments.filter(t => (t.package && t.package.trim()) || (t.treatment && t.treatment.trim())).length;
  const packagesCount = treatments.filter(t => t.package && t.package.trim()).length;
  const treatmentsCount = treatments.filter(t => t.treatment && t.treatment.trim()).length;

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (fetching || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm sm:text-base text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if agent doesn't have read permission
  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view staff treatments. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Toast Container */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex flex-col gap-2 sm:gap-3">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
            Staff Treatments
          </h1>
          <p className="text-sm sm:text-base text-slate-600">Manage packages and treatments for your staff</p>
        </div>

        {/* Form Section */}
        <div ref={formRef} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 scroll-mt-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {editingId ? (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Edit Record</h2>
              </>
            ) : (
              <>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Add New Entry</h2>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            {/* Package Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 flex-shrink-0" />
                <span>Package Name</span>
              </label>
              <input
                type="text"
                name="package"
                value={formData.package}
                onChange={handleChange}
                placeholder="e.g., Premium Wellness Package"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500">Optional - Leave empty if adding only treatment</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <span>Package Price</span>
                  </label>
                  <input
                    type="number"
                    name="packagePrice"
                    value={formData.packagePrice}
                    onChange={handleChange}
                    placeholder="e.g., 1999"
                    min="0"
                    step="0.01"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Treatment Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 flex-shrink-0" />
                <span>Treatment Name</span>
              </label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleChange}
                placeholder="e.g., Full Body Massage&#10;Aromatherapy&#10;Facial Treatment"
                rows="3"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-500">Optional - Use new lines for multiple treatments</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700">
                    <span>Treatment Price</span>
                  </label>
                  <input
                    type="number"
                    name="treatmentPrice"
                    value={formData.treatmentPrice}
                    onChange={handleChange}
                    placeholder="e.g., 999"
                    min="0"
                    step="0.01"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-900 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {(() => {
              const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
              const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
              const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
              
              if (!editingId) {
                // Add Record button
                // Admin always sees button - but ONLY if NOT on agent route
                if (!isAgentRoute && adminTokenExists && isAdmin) {
                  return (
                    <button
                      onClick={handleAdd}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      {loading ? "Adding..." : "Add Record"}
                    </button>
                  );
                }
                
                // For agents: Only show if permissions are loaded AND create permission is explicitly true
                if ((isAgentRoute || isAgent) && agentTokenExists) {
                  if (permissionsLoading || !agentPermissions) {
                    return null;
                  }
                  
                  const hasCreatePermission = agentPermissions.canCreate === true || agentPermissions.canAll === true;
                  if (hasCreatePermission) {
                    return (
                      <button
                        onClick={handleAdd}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-emerald-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        {loading ? "Adding..." : "Add Record"}
                      </button>
                    );
                  }
                }
                
                return null;
              } else {
                // Update Record button
                // Admin always sees button - but ONLY if NOT on agent route
                if (!isAgentRoute && adminTokenExists && isAdmin) {
                  return (
                    <>
                      <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        {loading ? "Updating..." : "Update Record"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-medium hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        Cancel
                      </button>
                    </>
                  );
                }
                
                // For agents: Only show if permissions are loaded AND update permission is explicitly true
                if ((isAgentRoute || isAgent) && agentTokenExists) {
                  if (permissionsLoading || !agentPermissions) {
                    return (
                      <button
                        onClick={handleCancel}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-medium hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        Cancel
                      </button>
                    );
                  }
                  
                  const hasUpdatePermission = agentPermissions.canUpdate === true || agentPermissions.canAll === true;
                  if (hasUpdatePermission) {
                    return (
                      <>
                        <button
                          onClick={handleUpdate}
                          disabled={loading}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                          {loading ? "Updating..." : "Update Record"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-medium hover:bg-slate-300 transition-colors"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          Cancel
                        </button>
                      </>
                    );
                  } else {
                    // No update permission, only show cancel
                    return (
                      <button
                        onClick={handleCancel}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-medium hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        Cancel
                      </button>
                    );
                  }
                }
                
                return (
                  <button
                    onClick={handleCancel}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl font-medium hover:bg-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cancel
                  </button>
                );
              }
            })()}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-slate-600">All Records</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{allCount}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-slate-600">Packages</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{packagesCount}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow xs:col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-slate-600">Treatments</h3>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900">{treatmentsCount}</p>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 md:p-8">
          {/* Tabs and Search */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-lg sm:rounded-xl overflow-x-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "all"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({allCount})
              </button>
              <button
                onClick={() => setActiveTab("packages")}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "packages"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Packages ({packagesCount})
              </button>
              <button
                onClick={() => setActiveTab("treatments")}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "treatments"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Treatments ({treatmentsCount})
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="text-gray-700 w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Results Info */}
          {!fetching && filteredTreatments.length > 0 && (
            <div className="mb-4 text-sm text-slate-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredTreatments.length)} of {filteredTreatments.length} records
            </div>
          )}

          {fetching ? (
            <div className="text-center py-8 sm:py-12">
              <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-slate-500">Loading records...</p>
            </div>
          ) : paginatedTreatments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 text-base sm:text-lg font-medium">No records found</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-2">
                {searchQuery ? "Try adjusting your search" : "Add your first package or treatment above"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:gap-4">
                {paginatedTreatments.map((item) => (
                  <div
                    key={item._id}
                    className="group border border-slate-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        {/* Show package only in "all" and "packages" tabs */}
                        {activeTab !== "treatments" && item.package && item.package.trim() && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                            <span className="inline-block bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg break-words">
                              {item.package}
                            </span>
                            {typeof item.packagePrice === "number" && (
                              <span className="ml-2 inline-block text-xs sm:text-sm font-medium text-slate-600">د.إ{item.packagePrice.toFixed(2)}</span>
                            )}
                          </div>
                        )}
                        {/* Show treatment only in "all" and "treatments" tabs */}
                        {activeTab !== "packages" && item.treatment && item.treatment.trim() && (
                          <div className="flex items-start gap-2">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm md:text-base text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                                {item.treatment}
                              </p>
                            </div>
                            {typeof item.treatmentPrice === "number" && (
                              <span className="ml-2 inline-block text-xs sm:text-sm font-medium text-slate-600">د.إ{item.treatmentPrice.toFixed(2)}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 sm:pt-4 border-t border-slate-100">
                        {/* Edit button: Only show for admins OR agents with explicit update permission */}
                        {(() => {
                          const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                          const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                          const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                          
                          // Admin always sees edit button - but ONLY if NOT on agent route
                          if (!isAgentRoute && adminTokenExists && isAdmin) {
                            return (
                              <button
                                onClick={() => handleEdit(item)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs sm:text-sm"
                              >
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Edit</span>
                              </button>
                            );
                          }
                          
                          // For agents: Only show if permissions are loaded AND update permission is explicitly true
                          if ((isAgentRoute || isAgent) && agentTokenExists) {
                            if (permissionsLoading || !agentPermissions) {
                              return null;
                            }
                            
                            const hasUpdatePermission = agentPermissions.canUpdate === true || agentPermissions.canAll === true;
                            if (hasUpdatePermission) {
                              return (
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs sm:text-sm"
                                >
                                  <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>Edit</span>
                                </button>
                              );
                            }
                          }
                          
                          return null;
                        })()}
                        
                        {/* Delete button: Only show for admins OR agents with explicit delete permission */}
                        {(() => {
                          const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                          const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                          const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                          
                          // Admin always sees delete button - but ONLY if NOT on agent route
                          if (!isAgentRoute && adminTokenExists && isAdmin) {
                            return (
                              <button
                                onClick={() => handleDelete(item._id)}
                                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors font-medium text-xs sm:text-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Delete</span>
                              </button>
                            );
                          }
                          
                          // For agents: Only show if permissions are loaded AND delete permission is explicitly true
                          if ((isAgentRoute || isAgent) && agentTokenExists) {
                            if (permissionsLoading || !agentPermissions) {
                              return null;
                            }
                            
                            const hasDeletePermission = agentPermissions.canDelete === true || agentPermissions.canAll === true;
                            if (hasDeletePermission) {
                              return (
                                <button
                                  onClick={() => handleDelete(item._id)}
                                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors font-medium text-xs sm:text-sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span>Delete</span>
                                </button>
                              );
                            }
                          }
                          
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

AdminStaffTreatments.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminStaffTreatments);
ProtectedDashboard.getLayout = AdminStaffTreatments.getLayout;

export default ProtectedDashboard;