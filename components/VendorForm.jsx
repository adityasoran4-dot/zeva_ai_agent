"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { CheckCircle, AlertCircle, Trash2, Edit3, Plus, X, Search, Mail, Phone, MapPin, Hash, Info, AlertTriangle, Loader2 } from "lucide-react";
import { useAgentPermissions } from "../hooks/useAgentPermissions";

const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
    info: <Info className="w-5 h-5 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />
  };

  const styles = {
    success: "bg-green-100 text-green-700 border-green-200",
    error: "bg-red-100 text-red-700 border-red-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200"
  };

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${styles[type]} min-w-[300px] max-w-md`}>
        {icons[type]}
        <span className="text-sm font-medium flex-1">{message}</span>
        <button onClick={onClose} className="hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  const buttonStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700"
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        onClick={onClose}
      ></div>

      {/* Dialog Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${type === 'danger' ? 'bg-red-100' : type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-all font-medium ${buttonStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VendorForm() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    trnNumber: "", // ✅ new field
    note: "",
  });

  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, vendorId: null });
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);
  
  // Check if we're in clinic context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setIsClinicContext(path.startsWith("/clinic/"));
    } else if (router?.pathname) {
      setIsClinicContext(router.pathname.startsWith("/clinic/"));
    }
  }, [router?.pathname]);

  // Fetch permissions for clinic context
  const fetchClinicPermissions = useCallback(async () => {
    if (!isClinicContext) {
      setPermissionsLoaded(true);
      return;
    }

    try {
      setPermissionsLoaded(false);
      const token = getStoredToken();
      if (!token) {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
        setPermissionsLoaded(true);
        return;
      }

      const res = await axios.get("/api/clinic/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      if (data.success && data.data) {
        // Find clinic_staff_management module
        const modulePermission = data.data.permissions?.find((p) => {
          if (!p?.module) return false;
          const normalized = p.module.startsWith("clinic_")
            ? p.module.slice(7)
            : p.module.startsWith("admin_")
            ? p.module.slice(6)
            : p.module;
          return normalized === "clinic_staff_management" || normalized === "staff_management";
        });

        if (modulePermission) {
          const actions = modulePermission.actions || {};
          const moduleAll = actions.all === true || 
                           actions.all === "true" || 
                           String(actions.all).toLowerCase() === "true";

          // Find "Add Vendor" submodule
          const vendorSubModule = modulePermission.subModules?.find(
            (sm) => {
              const subModuleName = (sm?.name || "").trim();
              const subModulePath = (sm?.path || "").trim();
              const nameMatch = subModuleName === "Add Vendor" || 
                               subModuleName === "Create Vendor" ||
                               subModuleName.toLowerCase().includes("vendor");
              const pathMatch = subModulePath.includes("/add-vendor") || 
                               subModulePath.includes("/create-vendor") ||
                               subModulePath.includes("vendor");
              return nameMatch || pathMatch;
            }
          );

          if (vendorSubModule) {
            const subModuleActions = vendorSubModule.actions || {};
            const subModuleAll = subModuleActions.all === true || 
                                subModuleActions.all === "true" || 
                                String(subModuleActions.all).toLowerCase() === "true";

            const checkPermission = (actionName) => {
              if (subModuleActions && subModuleActions.hasOwnProperty(actionName)) {
                const actionValue = subModuleActions[actionName];
                if (actionValue === true || actionValue === "true" || String(actionValue).toLowerCase() === "true") {
                  return true;
                }
                if (actionValue === false || actionValue === "false" || String(actionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              if (subModuleAll) return true;
              if (actions && actions.hasOwnProperty(actionName)) {
                const moduleActionValue = actions[actionName];
                if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                  return true;
                }
                if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              if (moduleAll) return true;
              return false;
            };

            setPermissions({
              canCreate: checkPermission("create"),
              canRead: checkPermission("read"),
              canUpdate: checkPermission("update"),
              canDelete: checkPermission("delete"),
            });
          } else {
            const checkPermission = (actionName) => {
              if (moduleAll) return true;
              const moduleActionValue = actions[actionName];
              if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                return true;
              }
              if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                return false;
              }
              return false;
            };

            setPermissions({
              canCreate: checkPermission("create"),
              canRead: checkPermission("read"),
              canUpdate: checkPermission("update"),
              canDelete: checkPermission("delete"),
            });
          }
        } else {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
        }
      } else {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
      }
    } catch (error) {
      console.error("Error fetching clinic permissions for Add Vendor:", error);
      setPermissions({
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      });
    } finally {
      setPermissionsLoaded(true);
    }
  }, [isClinicContext]);

  useEffect(() => {
    fetchClinicPermissions();
  }, [fetchClinicPermissions]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = getStoredToken();
      if (!token) {
        setIsAdmin(false);
        setIsAgent(false);
        return;
      }
      
      // Decode token to check role
      try {
        const jwt = require('jwt-decode');
        const decoded = jwt.jwtDecode(token);
        const role = decoded?.role;
        const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
        
        // Check if user is admin
        if (role === 'admin' || role === 'super admin') {
          setIsAdmin(true);
          setIsAgent(false);
        } 
        // Check if user is agent (and on agent route or has agentToken)
        else if (role === 'agent' || (isAgentRoute && (role === 'agent' || !!localStorage.getItem('agentToken')))) {
          setIsAdmin(false);
          setIsAgent(true);
        } 
        // For clinic/doctor/staff accessing via agent route, treat as agent for permission checks
        else if (isAgentRoute && (role === 'clinic' || role === 'doctor' || role === 'doctorStaff' || role === 'staff')) {
          setIsAdmin(false);
          setIsAgent(true);
        }
        else {
          setIsAdmin(false);
          setIsAgent(false);
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  // Always call the hook (React rules), but only use it if isAgent is true
  // This page is under Staff Management -> Create Vendor submodule
  const agentPermissionsData = useAgentPermissions(isAgent ? "admin_staff_management" : null, isAgent ? "Create Vendor" : null);
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  useEffect(() => {
    if (isClinicContext && !permissionsLoaded) {
      return;
    }
    if (isClinicContext && !permissions.canRead) {
      setVendors([]);
      setFilteredVendors([]);
      return;
    }
    if (isAdmin) {
      fetchVendors();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchVendors();
        }
      }
    } else if (isClinicContext && permissionsLoaded && permissions.canRead) {
      fetchVendors();
    } else {
      // Neither admin nor agent nor clinic with read permission - don't fetch
    }
  }, [isAdmin, isAgent, isClinicContext, permissionsLoaded, permissions.canRead, permissionsLoading, agentPermissions]);

  useEffect(() => {
    const filtered = vendors.filter((v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone.includes(searchQuery)
    );
    setFilteredVendors(filtered);
  }, [searchQuery, vendors]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const fetchVendors = async () => {
    // Wait for permissions to load if agent
    if (isAgent && permissionsLoading) return;
    
    // Check if user has read permission
    if (isAgent && agentPermissions && agentPermissions.canRead === false && agentPermissions.canAll !== true) {
      setVendors([]);
      setFilteredVendors([]);
      return;
    }

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        return;
      }
      
      const res = await axios.get("/api/admin/get-vendors", { headers });
      if (res.data.success) {
        setVendors(res.data.data);
        setFilteredVendors(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching vendors:", err);
      // Handle 403 permission denied errors
      if (err.response?.status === 403) {
        setVendors([]);
        setFilteredVendors([]);
        showToast(err.response?.data?.message || "Permission denied", "error");
      } else {
        showToast("Failed to fetch vendors", "error");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check clinic permissions first
    if (isClinicContext) {
      if (editId && !permissions.canUpdate) {
        showToast("You do not have permission to update vendors", "error");
        return;
      }
      if (!editId && !permissions.canCreate) {
        showToast("You do not have permission to create vendors", "error");
        return;
      }
    }
    
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if (editId) {
      // Update operation
      if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canUpdate !== true && agentPermissions.canAll !== true) {
        showToast("You do not have permission to update vendors", "error");
        return;
      }
    } else {
      // Create operation
      if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canCreate !== true && agentPermissions.canAll !== true) {
        showToast("You do not have permission to create vendors", "error");
        return;
      }
    }
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        return;
      }
      
      const config = { headers };

      if (editId) {
        const res = await axios.put(
          `/api/admin/update-vendor?id=${editId}`,
          formData,
          config
        );
        if (res.data.success) {
          showToast("Vendor updated successfully!", "success");
          // Reset form and close modal on success
          setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            trnNumber: "",
            note: "",
          });
          setEditId(null);
          setIsModalOpen(false);
          fetchVendors();
        }
      } else {
        const res = await axios.post(
          "/api/admin/create-vendor",
          formData,
          config
        );
        if (res.data.success) {
          showToast("Vendor created successfully!", "success");
          // Reset form and close modal on success
          setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            trnNumber: "",
            note: "",
          });
          setEditId(null);
          setIsModalOpen(false);
          fetchVendors();
        }
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        trnNumber: "",
        note: "",
      });
      setEditId(null);
      setIsModalOpen(false);
      fetchVendors();
    } catch (err) {
      // Handle permission errors from API
      if (err.response?.status === 403) {
        showToast(err.response.data?.message || "You don't have permission to perform this action", "error");
      } else {
        console.error("Error submitting vendor form:", err);
        showToast(err.response?.data?.message || "Error saving vendor!", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    // Check clinic permissions first
    if (isClinicContext && !permissions.canDelete) {
      showToast("You do not have permission to delete vendors", "error");
      return;
    }
    
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to delete vendors", "error");
      return;
    }
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        showToast("Authentication required. Please login again.", "error");
        return;
      }
      
      const res = await axios.delete(`/api/admin/delete-vendor?id=${id}`, { headers });
      
      if (res.data.success) {
        showToast("Vendor deleted successfully!", "success");
        fetchVendors();
      }
    } catch (err) {
      console.error("Error deleting vendor:", err);
      if (err.response?.status === 403) {
        showToast(err.response.data?.message || "You don't have permission to delete vendors", "error");
      } else {
        showToast("Failed to delete vendor!", "error");
      }
    }
  };

  const handleEdit = (vendor) => {
    // Check clinic permissions first
    if (isClinicContext && !permissions.canUpdate) {
      showToast("You do not have permission to update vendors", "error");
      return;
    }
    
    setEditId(vendor._id);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      trnNumber: vendor.trnNumber, // ✅ updated field
      note: vendor.note,
    });
    setIsModalOpen(true);
  };

  const openModal = () => {
    setEditId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      trnNumber: "", // ✅ updated field
      note: "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      trnNumber: "", // ✅ updated field
      note: "",
    });
  };


  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) || (isClinicContext && permissions.canRead);

  // Show loading spinner while checking permissions
  if ((isAgent && permissionsLoading) || (isClinicContext && !permissionsLoaded)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="mt-4 text-sm sm:text-base text-slate-500">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if agent or clinic doesn't have read permission
  if ((isAgent && !hasReadPermission) || (isClinicContext && !permissions.canRead)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view vendors. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Vendor Management</h1>
            <p className="text-gray-800 mt-1">Manage your vendors efficiently</p>
          </div>
          {/* Add Vendor button: Only show for admins OR agents with explicit create permission */}
          {(() => {
            const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
            const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
            const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
            
            // Admin always sees button - but ONLY if NOT on agent route
            if (!isAgentRoute && adminTokenExists && isAdmin) {
              return (
                <button
                  onClick={openModal}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Vendor</span>
                </button>
              );
            }
            
            // For clinic: Only show if permissions are loaded AND create permission is explicitly true
            if (isClinicContext && permissionsLoaded && permissions.canCreate) {
              return (
                <button
                  onClick={openModal}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Vendor</span>
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
                    onClick={openModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add Vendor</span>
                  </button>
                );
              }
            }
            
            return null;
          })()}
        </div>

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 w-5 h-5" />
            <input
              type="text"
              placeholder="Search vendors by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-gray-800 w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Vendor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor._id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2"></div>
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate pr-2">
                    {vendor.name}
                  </h3>
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Edit button: Only show for admins OR agents with explicit update permission */}
                    {(() => {
                      const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                      const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                      const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                      
                      // Admin always sees edit button - but ONLY if NOT on agent route
                      if (!isAgentRoute && adminTokenExists && isAdmin) {
                        return (
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                            title="Edit Vendor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        );
                      }
                      
                      // For clinic: Only show if permissions are loaded AND update permission is explicitly true
                      if (isClinicContext && permissionsLoaded && permissions.canUpdate) {
                        return (
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                            title="Edit Vendor"
                          >
                            <Edit3 className="w-4 h-4" />
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
                              onClick={() => handleEdit(vendor)}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all"
                              title="Edit Vendor"
                            >
                              <Edit3 className="w-4 h-4" />
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
                            onClick={() => setConfirmDialog({ isOpen: true, vendorId: vendor._id })}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Delete Vendor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        );
                      }
                      
                      // For clinic: Only show if permissions are loaded AND delete permission is explicitly true
                      if (isClinicContext && permissionsLoaded && permissions.canDelete) {
                        return (
                          <button
                            onClick={() => setConfirmDialog({ isOpen: true, vendorId: vendor._id })}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                            title="Delete Vendor"
                          >
                            <Trash2 className="w-4 h-4" />
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
                              onClick={() => setConfirmDialog({ isOpen: true, vendorId: vendor._id })}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                              title="Delete Vendor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          );
                        }
                      }
                      
                      return null;
                    })()}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-800">
                    <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-800">
                    <Phone className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm">{vendor.phone}</span>
                  </div>
                  {vendor.address && (
                    <div className="flex items-start gap-3 text-gray-800">
                      <MapPin className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm line-clamp-2">{vendor.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-800">
                    <Hash className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      TRN Number: {vendor.trnNumber || "N/A"}
                    </span>
                  </div>

                  {vendor.note && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-800 italic line-clamp-2">
                        {vendor.note}
                      </p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-800">
                      Created by: <span className="font-medium text-gray-800">{vendor.createdBy}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <Search className="w-12 h-12 text-gray-800" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
              {searchQuery ? "No vendors found" : "No vendors yet"}
            </h3>
            <p className="text-gray-800 text-sm sm:text-base mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by adding your first vendor"}
            </p>
            {!searchQuery && (isAdmin || (isAgent && agentPermissions && (agentPermissions.canCreate === true || agentPermissions.canAll === true))) && (
              <button
                onClick={openModal}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Vendor</span>
              </button>
            )}
            {!searchQuery && isAgent && agentPermissions && agentPermissions.canCreate !== true && agentPermissions.canAll !== true && (
              <p className="text-red-500 text-xs">You do not have permission to create vendors</p>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, vendorId: null })}
          onConfirm={() => handleDelete(confirmDialog.vendorId)}
          title="Delete Vendor"
          message="Are you sure you want to delete this vendor? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with blur */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
              onClick={closeModal}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {editId ? "Update Vendor" : "Add New Vendor"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter vendor name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="vendor@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TRN Number
                    </label>
                    <input
                      type="text"
                      name="trnNumber"
                      placeholder="Enter TRN Number"
                      value={formData.trnNumber}
                      onChange={handleChange}
                      required
                      min="0"
                      max="100"
                      step="0.01"
                      className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter vendor address"
                    value={formData.address}
                    onChange={handleChange}
                    className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    name="note"
                    placeholder="Add any additional notes..."
                    value={formData.note}
                    onChange={handleChange}
                    rows="3"
                    className="text-gray-800 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium shadow-md hover:shadow-lg"
                  >
                    {editId ? "Update Vendor" : "Create Vendor"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}