"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import withClinicAuth from "../../components/withClinicAuth";
import ClinicLayout from "../../components/ClinicLayout";
import { Toaster, toast } from "react-hot-toast";
import { Loader2, Edit2, Trash2, CheckCircle, AlertCircle, Package, ChevronDown, X, Calendar, Search, User, Users, Plus, Save, Stethoscope, Percent, Clock, Star, Wrench } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

const MODULE_KEY = "Clinic_services_setup";
const TOKEN_PRIORITY = ["clinicToken", "agentToken", "doctorToken", "userToken", "staffToken", "adminToken"];

function getStoredToken() {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    try {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    } catch {}
  }
  return null;
}
function getAuthHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}
function slugify(text) {
  return (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function addMonths(dateString, months) {
  const d = new Date(dateString);
  if (isNaN(d)) return null;
  const copy = new Date(d.getTime());
  copy.setMonth(copy.getMonth() + (parseInt(months) || 0));
  return copy;
}

function isMembershipExpired(m) {
  if (!m || !m.createdAt || !m.durationMonths) return false;
  const expiry = addMonths(m.createdAt, m.durationMonths);
  if (!expiry) return false;
  return new Date() > expiry;
}

function ServicesSetupPage() {
  // Permission states
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

  // Helper function to get user info from token
  const getUserInfo = useCallback(() => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      for (const key of TOKEN_PRIORITY) {
        const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
            );
            const decoded = JSON.parse(jsonPayload);
            return {
              role: decoded.role || decoded.userRole || null,
              id: decoded.userId || decoded.id || null,
            };
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return { role: null, id: null };
  }, []);

  // Helper function to get user role from token
  const getUserRole = useCallback(() => {
    return getUserInfo().role;
  }, [getUserInfo]);

  // Sync token state on mount and storage change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const agentTok = localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken");
      setHasAgentToken(!!agentTok);
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, []);

  // Determine if this is an agent route
  useEffect(() => {
    if (typeof window === "undefined") return;
    const agentPath = window.location.pathname?.startsWith("/agent/");
    setIsAgentRoute(agentPath && hasAgentToken);
  }, [hasAgentToken]);

  // Use agent permissions hook for agent routes
  const agentPermissionsHook = useAgentPermissions(
    isAgentRoute ? MODULE_KEY : null,
  );
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;

    const newPermissions = {
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    if (isAgentRoute) return;
    let isMounted = true;

    // Check which token type is being used
    const clinicToken = typeof window !== "undefined" ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken") : null;
    const doctorToken = typeof window !== "undefined" ? localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken") : null;
    const agentToken = typeof window !== "undefined" ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken") : null;
    const staffToken = typeof window !== "undefined" ? localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken") : null;
    const userToken = typeof window !== "undefined" ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken") : null;

    const userRole = getUserRole();
    const authToken = clinicToken || doctorToken || agentToken || staffToken || userToken;

    // For admin role, grant full access (bypass permission checks)
    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return;
    }

    // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!authToken) {
            if (!isMounted) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
            setPermissionsLoaded(true);
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            console.log("Sidebar permissions API response:", res.data);
            // Check if permissions array exists and is not null
            if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the Clinic_services_setup module
              const modulePermission = res.data.permissions.find((p) => {
                if (!p?.module) return false;
                // Check for Clinic_services_setup module variations
                if (p.module === MODULE_KEY) return true;
                if (p.module === "clinic_services_setup") return true;
                if (p.module === "services_setup") return true;
                if (p.module === "Clinic_Services_Setup") return true;
                if (p.module === "clinic_Services_Setup") return true;
                return false;
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};

                console.log("Found module permission:", modulePermission);
                console.log("Actions:", actions);

                // Check if "all" is true, which grants all permissions
                const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
                const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
                const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
                const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
                const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

                console.log("Parsed permissions - all:", moduleAll, "create:", moduleCreate, "read:", moduleRead, "update:", moduleUpdate, "delete:", moduleDelete);

                setPermissions({
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                });
              } else {
                // Module permission not found in the permissions array - default to read-only
                setPermissions({
                  canRead: true, // Clinic/doctor can always read their own data
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            // API response doesn't have permissions, default to full access (backward compatibility)
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
          // On error, default to full access (backward compatibility)
          if (isMounted) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchClinicPermissions();
      return;
    }

    // For agent/doctorStaff tokens (when not on agent route), check permissions
    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log("Fetching Agent/Staff Permissions for", MODULE_KEY, "...");
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          // Try Clinic_services_setup first
          let res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: MODULE_KEY },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          let data = res.data;
          
          // If not found, try other variations
          if (!data?.permissions && data?.error?.includes("not found")) {
            res = await axios.get("/api/agent/get-module-permissions", {
              params: { moduleKey: "clinic_services_setup" },
              headers: { Authorization: `Bearer ${agentStaffToken}` },
            });
            data = res.data;
          }
          
          console.log("Agent Permissions API Response:", data);

          if (!isMounted) return;

          // Default to true if module not found in permissions (matches backend logic)
          if (!data?.permissions && data?.error?.includes("not found in agent permissions")) {
            console.log("Module not found in permissions, granting full access by default");
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          const actions = data?.permissions?.actions || data?.data?.moduleActions || {};
          const isTrue = (val) => val === true || val === "true" || String(val || "").toLowerCase() === "true";

          const canAll = isTrue(actions.all);

          const newPerms = {
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          };

          console.log("Final Agent/Staff Permissions:", newPerms);
          setPermissions(newPerms);
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          // Swallow agent permission errors; they will just result in no extra access
          setPermissions({
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          });
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchPermissions();
    } else {
      // Unknown token type - default to full access (likely clinic/doctor)
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isAgentRoute, getUserRole]);

  const [activeTab, setActiveTab] = useState("services");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [servicesBatch, setServicesBatch] = useState([
    { name: "", price: "", durationMinutes: "", clinicPrice: "" },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingDuration, setEditingDuration] = useState("");
  const [editingClinicPrice, setEditingClinicPrice] = useState("");
  const [editingDepartmentId, setEditingDepartmentId] = useState("");
  const [editingActive, setEditingActive] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Search states
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [membershipSearchTerm, setMembershipSearchTerm] = useState("");
  const [packageSearchTerm, setPackageSearchTerm] = useState("");
  
  const [memberships, setMemberships] = useState([]);
  const [memLoading, setMemLoading] = useState(true);
  const [memSubmitting, setMemSubmitting] = useState(false);
  const [memName, setMemName] = useState("");
  const [memPrice, setMemPrice] = useState("");
  const [memDurationMonths, setMemDurationMonths] = useState("");
  const [memFreeConsultations, setMemFreeConsultations] = useState("0");
  const [memDiscountPercentage, setMemDiscountPercentage] = useState("0");
  const [memPriorityBooking, setMemPriorityBooking] = useState(false);
  const [memEditingId, setMemEditingId] = useState(null);
  const [memEditingName, setMemEditingName] = useState("");
  const [memEditingPrice, setMemEditingPrice] = useState("");
  const [memEditingDurationMonths, setMemEditingDurationMonths] = useState("");
  const [memEditingFreeConsultations, setMemEditingFreeConsultations] = useState("0");
  const [memEditingDiscountPercentage, setMemEditingDiscountPercentage] = useState("0");
  const [memEditingPriorityBooking, setMemEditingPriorityBooking] = useState(false);
  const [memEditingActive, setMemEditingActive] = useState(true);
  const [memUpdating, setMemUpdating] = useState(false);
  const [memFilter, setMemFilter] = useState('all'); // all, active, expired, priority, upcoming-expiry

  // Packages state
  const [packages, setPackages] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgSubmitting, setPkgSubmitting] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgValidityInMonths, setPkgValidityInMonths] = useState("");
  const [pkgStartDate, setPkgStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [pkgEndDate, setPkgEndDate] = useState("");
  const [treatments, setTreatments] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState([]); // Array of { treatmentName, treatmentSlug, sessions, allocatedPrice }
  const [treatmentDropdownOpen, setTreatmentDropdownOpen] = useState(false);
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState("");
  const [pkgEditingId, setPkgEditingId] = useState(null);
  const [pkgEditingName, setPkgEditingName] = useState("");
  const [pkgEditingPrice, setPkgEditingPrice] = useState("");
  const [pkgEditingValidityInMonths, setPkgEditingValidityInMonths] = useState("");
  const [pkgEditingStartDate, setPkgEditingStartDate] = useState("");
  const [pkgEditingEndDate, setPkgEditingEndDate] = useState("");
  const [pkgEditingActive, setPkgEditingActive] = useState(true);
  const [pkgUpdating, setPkgUpdating] = useState(false);
  const [pkgEditModalOpen, setPkgEditModalOpen] = useState(false);
  const [pkgEditTreatments, setPkgEditTreatments] = useState([]);
  const [pkgEditTreatmentDropdownOpen, setPkgEditTreatmentDropdownOpen] = useState(false);
  const [pkgEditTreatmentSearchQuery, setPkgEditTreatmentSearchQuery] = useState("");

  // Update end date based on validity months and start date (creation)
  useEffect(() => {
    if (pkgStartDate && pkgValidityInMonths && !isNaN(pkgValidityInMonths)) {
      const start = new Date(pkgStartDate);
      const months = parseInt(pkgValidityInMonths);
      const end = new Date(start);
      end.setMonth(start.getMonth() + months);
      setPkgEndDate(end.toISOString().split('T')[0]);
    } else {
      setPkgEndDate("");
    }
  }, [pkgStartDate, pkgValidityInMonths]);

  // Update end date based on validity months and start date (editing)
  useEffect(() => {
    if (pkgEditingStartDate && pkgEditingValidityInMonths && !isNaN(pkgEditingValidityInMonths)) {
      const start = new Date(pkgEditingStartDate);
      const months = parseInt(pkgEditingValidityInMonths);
      const end = new Date(start);
      end.setMonth(start.getMonth() + months);
      setPkgEditingEndDate(end.toISOString().split('T')[0]);
    } else {
      setPkgEditingEndDate("");
    }
  }, [pkgEditingStartDate, pkgEditingValidityInMonths]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) return;
        const res = await axios.get('/api/clinics/myallClinic', { headers: authHeaders });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  const loadServices = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    try {
      const params = {};
      if (filterDepartmentId) params.departmentId = filterDepartmentId;
      const res = await axios.get("/api/clinic/services", { headers, params });
      if (res.data.success) {
        setServices(res.data.services || []);
      } else {
        const errorMsg = res.data.message || "Failed to load services";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const status = error.response?.status;
      if (status !== 401 && status !== 403) {
        const errorMsg = error.response?.data?.message || "Failed to load services";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    try {
      setDepartmentsLoading(true);
      console.log("Loading departments with module:", MODULE_KEY);
      const res = await axios.get("/api/clinic/departments", {
        headers,
        params: { module: MODULE_KEY },
      });
      console.log("Departments API response:", res.data);
      if (res.data.success) {
        console.log("Departments loaded:", res.data.departments);
        setDepartments(res.data.departments || []);
      } else {
        const errorMsg = res.data.message || "Failed to load departments";
        console.error("Departments API error:", errorMsg);
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const status = error.response?.status;
      console.error("Departments load error - status:", status, error.response?.data);
      if (status === 403) {
        console.warn("403 Forbidden - departments may not be accessible");
        // Still set empty array to allow form to work
        setDepartments([]);
      } else if (status !== 401) {
        const errorMsg = error.response?.data?.message || "Failed to load departments";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleAddRow = () => {
    setServicesBatch((prev) => [...prev, { name: "", price: "", durationMinutes: "", clinicPrice: "" }]);
  };

  const handleRemoveRow = (index) => {
    setServicesBatch((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    setServicesBatch((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setMessage({ type: "info", text: "" });
    if (!selectedDepartmentId) {
      setMessage({ type: "error", text: "Please select a department" });
      return;
    }
    const prepared = servicesBatch
      .map((r) => ({
        name: (r.name || "").trim(),
        price: r.price,
        durationMinutes: r.durationMinutes,
        clinicPrice: r.clinicPrice === "" ? null : r.clinicPrice,
      }))
      .filter((r) => r.name);
    if (prepared.length === 0) {
      setMessage({ type: "error", text: "Please add at least one service" });
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(
        "/api/clinic/services",
        {
          departmentId: selectedDepartmentId,
          items: prepared,
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Services created";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setServicesBatch([{ name: "", price: "", durationMinutes: "", clinicPrice: "" }]);
        await loadServices();
      } else {
        const errorMsg = res.data.message || "Failed to create services";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create services";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };



  useEffect(() => {
    if (!permissionsLoaded) return;
    // Always load departments (needed for create form even when canRead is false)
    loadDepartments();
    // Only load services if canRead is true
    if (permissions.canRead) {
      loadServices();
    }
  }, [permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    // reload services on department filter change
    if (permissionsLoaded && permissions.canRead) {
      loadServices();
    }
  }, [filterDepartmentId, permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    if (activeTab === "memberships") {
      const headers = getAuthHeaders();
      if (!headers) {
        setMessage({ type: "error", text: "Authentication required. Please log in again." });
        return;
      }
      (async () => {
        try {
          const res = await axios.get("/api/clinic/memberships", { headers });
          if (res.data.success) {
            setMemberships(res.data.memberships || []);
          } else {
            const errorMsg = res.data.message || "Failed to load memberships";
            setMessage({ type: "error", text: errorMsg });
            toast.error(errorMsg, { duration: 3000 });
          }
        } catch (error) {
          const status = error.response?.status;
          if (status !== 401 && status !== 403) {
            const errorMsg = error.response?.data?.message || "Failed to load memberships";
            setMessage({ type: "error", text: errorMsg });
            toast.error(errorMsg, { duration: 3000 });
          }
          setMemberships([]);
        } finally {
          setMemLoading(false);
        }
      })();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "packages") {
      const headers = getAuthHeaders();
      if (!headers) {
        setMessage({ type: "error", text: "Authentication required. Please log in again." });
        return;
      }
      (async () => {
        try {
          const res = await axios.get("/api/clinic/packages", { headers });
          if (res.data.success) {
            setPackages(res.data.packages || []);
          } else {
            const errorMsg = res.data.message || "Failed to load packages";
            setMessage({ type: "error", text: errorMsg });
            toast.error(errorMsg, { duration: 3000 });
          }
        } catch (error) {
          const status = error.response?.status;
          if (status !== 401 && status !== 403) {
            const errorMsg = error.response?.data?.message || "Failed to load packages";
            setMessage({ type: "error", text: errorMsg });
            toast.error(errorMsg, { duration: 3000 });
          }
          setPackages([]);
        } finally {
          setPkgLoading(false);
        }
      })();
    }
  }, [activeTab]);

  // Treatment selection functions
  const loadTreatments = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return [];
    }
    try {
      const res = await axios.get("/api/clinic/treatments", { headers });
      if (res.data.success) {
        const flattenedTreatments = [];
        const clinicTreatments = res.data.clinic?.treatments || [];

        clinicTreatments.forEach(mainTreatment => {
          if (mainTreatment.subTreatments && mainTreatment.subTreatments.length > 0) {
            mainTreatment.subTreatments.forEach(subTreatment => {
              flattenedTreatments.push({
                name: subTreatment.name,
                slug: subTreatment.slug,
                price: subTreatment.price,
                mainTreatment: mainTreatment.mainTreatment,
                type: "sub"
              });
            });
          } else {
            flattenedTreatments.push({
              name: mainTreatment.mainTreatment,
              slug: mainTreatment.mainTreatmentSlug,
              mainTreatment: null,
              type: "main"
            });
          }
        });

        // Also fetch Services and merge into the same list (without removing treatments)
        try {
          const servicesRes = await axios.get("/api/clinic/services", { headers });
          if (servicesRes.data?.success && Array.isArray(servicesRes.data.services)) {
            const services = servicesRes.data.services || [];
            services.forEach((svc) => {
              flattenedTreatments.push({
                name: svc.name,
                slug: svc.serviceSlug || svc._id,
                price: Number(svc.price) || 0,
                mainTreatment: "Service",
                type: "sub"
              });
            });
          }
        } catch {
          // Ignore services fetch errors and proceed with available treatments
        }

        setTreatments(flattenedTreatments);
        return flattenedTreatments;
      } else {
        const errorMsg = res.data.message || "Failed to load treatments";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
        return [];
      }
    } catch (error) {
      const status = error.response?.status;
      if (status !== 401 && status !== 403) {
        const errorMsg = error.response?.data?.message || "Failed to load treatments";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
      return [];
    }
  };

  const handleTreatmentToggle = (treatment) => {
    setSelectedTreatments((prev) => {
      const exists = prev.find((t) => t.treatmentSlug === treatment.slug);
      if (exists) {
        return prev.filter((t) => t.treatmentSlug !== treatment.slug);
      } else {
        setTreatmentDropdownOpen(false); // Close dropdown after selection
        return [...prev, { treatmentName: treatment.name, treatmentSlug: treatment.slug, sessions: 1, allocatedPrice: 0 }];
      }
    });
  };

  const handleRemoveTreatment = (treatmentSlug, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedTreatments((prev) => {
      return prev.filter((t) => t.treatmentSlug !== treatmentSlug);
    });
  };

  const handleSessionChange = (slug, sessions) => {
    setSelectedTreatments((prev) =>
      prev.map((t) => (t.treatmentSlug === slug ? { ...t, sessions: parseInt(sessions) || 1 } : t))
    );
  };

  const handleAllocatedPriceChange = (slug, allocatedPrice) => {
    setSelectedTreatments((prev) =>
      prev.map((t) => (t.treatmentSlug === slug ? { ...t, allocatedPrice: parseFloat(allocatedPrice) || 0 } : t))
    );
  };

  useEffect(() => {
    if (activeTab === "packages") {
      loadTreatments();
    }
  }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage({ type: "info", text: "" });
    if (!name.trim()) {
      setMessage({ type: "error", text: "Please enter a service name" });
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(
        "/api/clinic/services",
        {
          name: name.trim(),
          serviceSlug: slugify(name),
          price: parseFloat(price),
          durationMinutes: parseInt(durationMinutes),
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Service created";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setName("");
        setPrice("");
        setDurationMinutes("");
        await loadServices();
      } else {
        const errorMsg = res.data.message || "Failed to create service";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create service";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };



  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editingName.trim()) {
      setMessage({ type: "error", text: "Service name cannot be empty" });
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setUpdating(true);
    try {
      const res = await axios.put(
        "/api/clinic/services",
        {
          serviceId: editingId,
          name: editingName.trim(),
          serviceSlug: slugify(editingName),
          price: parseFloat(editingPrice),
          durationMinutes: parseInt(editingDuration),
          clinicPrice: editingClinicPrice === "" ? null : parseFloat(editingClinicPrice),
          departmentId: editingDepartmentId || null,
          isActive: Boolean(editingActive),
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Service updated";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setEditingId(null);
        setEditingName("");
        setEditingPrice("");
        setEditingDuration("");
        await loadServices();
      } else {
        const errorMsg = res.data.message || "Failed to update service";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update service";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setUpdating(false);
    }
  };



  const handleCreateMembership = async (e) => {
    e.preventDefault();
    setMessage({ type: "info", text: "" });
    if (!memName.trim()) {
      setMessage({ type: "error", text: "Please enter a name" });
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setMemSubmitting(true);
    try {
      const res = await axios.post(
        "/api/clinic/memberships",
        {
          name: memName.trim(),
          price: parseFloat(memPrice),
          durationMonths: parseInt(memDurationMonths),
          benefits: {
            freeConsultations: parseInt(memFreeConsultations),
            discountPercentage: parseFloat(memDiscountPercentage),
            priorityBooking: Boolean(memPriorityBooking),
          },
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Membership created";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setMemName("");
        setMemPrice("");
        setMemDurationMonths("");
        setMemFreeConsultations("0");
        setMemDiscountPercentage("0");
        setMemPriorityBooking(false);
        const reload = await axios.get("/api/clinic/memberships", { headers });
        setMemberships(reload.data.memberships || []);
      } else {
        const errorMsg = res.data.message || "Failed to create membership";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create membership";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setMemSubmitting(false);
    }
  };

  const handleUpdateMembership = async () => {
    if (!memEditingId) return;
    if (!memEditingName.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setMemUpdating(true);
    try {
      const res = await axios.put(
        "/api/clinic/memberships",
        {
          itemId: memEditingId,
          name: memEditingName.trim(),
          price: parseFloat(memEditingPrice),
          durationMonths: parseInt(memEditingDurationMonths),
          benefits: {
            freeConsultations: parseInt(memEditingFreeConsultations),
            discountPercentage: parseFloat(memEditingDiscountPercentage),
            priorityBooking: Boolean(memEditingPriorityBooking),
          },
          isActive: Boolean(memEditingActive),
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Membership updated";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setMemEditingId(null);
        setMemEditingName("");
        setMemEditingPrice("");
        setMemEditingDurationMonths("");
        setMemEditingFreeConsultations("0");
        setMemEditingDiscountPercentage("0");
        setMemEditingPriorityBooking(false);
        const reload = await axios.get("/api/clinic/memberships", { headers });
        setMemberships(reload.data.memberships || []);
      } else {
        const errorMsg = res.data.message || "Failed to update membership";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update membership";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setMemUpdating(false);
    }
  };

  const handleDeleteMembership = async (itemId) => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    try {
      const res = await axios.delete(`/api/clinic/memberships`, { headers, data: { itemId } });
      if (res.data.success) {
        const successMsg = res.data.message || "Membership deleted";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        const reload = await axios.get("/api/clinic/memberships", { headers });
        setMemberships(reload.data.memberships || []);
      } else {
        const errorMsg = res.data.message || "Failed to delete membership";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete membership";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    }
  };

  // Packages API functions
  const loadPackages = async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setPkgLoading(true);
    try {
      const res = await axios.get("/api/clinic/packages", { headers });
      if (res.data.success) {
        setPackages(res.data.packages || []);
      } else {
        const errorMsg = res.data.message || "Failed to load packages";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const status = error.response?.status;
      if (status !== 401 && status !== 403) {
        const errorMsg = error.response?.data?.message || "Failed to load packages";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
      setPackages([]);
    } finally {
      setPkgLoading(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setMessage({ type: "info", text: "" });
    if (!pkgName.trim()) {
      setMessage({ type: "error", text: "Please enter a package name" });
      return;
    }
    if (!pkgPrice || parseFloat(pkgPrice) < 0) {
      setMessage({ type: "error", text: "Please enter a valid price" });
      return;
    }
    if (selectedTreatments.length === 0) {
      setMessage({ type: "error", text: "Please select at least one treatment" });
      return;
    }
    
    // Validate allocated prices
    const totalAllocated = selectedTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0);
    const packagePrice = parseFloat(pkgPrice);
    if (Math.abs(totalAllocated - packagePrice) > 0.01) {
      setMessage({ 
        type: "error", 
        text: `Total allocated prices ($${totalAllocated.toFixed(2)}) must equal the package price ($${packagePrice.toFixed(2)})` 
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    setPkgSubmitting(true);
    try {
      const res = await axios.post(
        "/api/clinic/packages",
        {
          name: pkgName.trim(),
          totalPrice: parseFloat(pkgPrice),
          validityInMonths: parseInt(pkgValidityInMonths) || 0,
          startDate: pkgStartDate,
          endDate: pkgEndDate,
          treatments: selectedTreatments,
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Package created successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setPkgName("");
        setPkgPrice("");
        setPkgValidityInMonths("");
        setPkgStartDate(new Date().toISOString().split('T')[0]);
        setPkgEndDate("");
        setSelectedTreatments([]);
        setTreatmentDropdownOpen(false); // Close dropdown
        await loadPackages();
      } else {
        const errorMsg = res.data.message || "Failed to create package";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create package";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setPkgSubmitting(false);
    }
  };

  const handleUpdatePackage = async () => {
    if (!pkgEditingId) return;
    if (!pkgEditingName.trim()) {
      setMessage({ type: "error", text: "Package name cannot be empty" });
      return;
    }
    if (!pkgEditingPrice || parseFloat(pkgEditingPrice) < 0) {
      setMessage({ type: "error", text: "Please enter a valid price" });
      return;
    }
    if (pkgEditTreatments.length === 0) {
      setMessage({ type: "error", text: "Please select at least one treatment" });
      return;
    }
    
    // Validate allocated prices
    const totalAllocated = pkgEditTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0);
    const packagePrice = parseFloat(pkgEditingPrice);
    if (Math.abs(totalAllocated - packagePrice) > 0.01) {
      setMessage({ 
        type: "error", 
        text: `Total allocated prices ($${totalAllocated.toFixed(2)}) must equal the package price ($${packagePrice.toFixed(2)})` 
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) return;

    setPkgUpdating(true);
    try {
      const res = await axios.put(
        "/api/clinic/packages",
        {
          packageId: pkgEditingId,
          name: pkgEditingName.trim(),
          totalPrice: parseFloat(pkgEditingPrice),
          validityInMonths: parseInt(pkgEditingValidityInMonths) || 0,
          startDate: pkgEditingStartDate,
          endDate: pkgEditingEndDate,
          isActive: pkgEditingActive,
          treatments: pkgEditTreatments,
        },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Package updated successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        closeEditModal();
        await loadPackages();
      } else {
        const errorMsg = res.data.message || "Failed to update package";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update package";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setPkgUpdating(false);
    }
  };

  const openEditModal = (pkg) => {
    setPkgEditingId(pkg._id);
    setPkgEditingName(pkg.name);
    setPkgEditingPrice((pkg.totalPrice ?? pkg.price).toString());
    setPkgEditingValidityInMonths(pkg.validityInMonths ? pkg.validityInMonths.toString() : "");
    setPkgEditingStartDate(pkg.startDate ? new Date(pkg.startDate).toISOString().split('T')[0] : "");
    setPkgEditingEndDate(pkg.endDate ? new Date(pkg.endDate).toISOString().split('T')[0] : "");
    setPkgEditingActive(pkg.isActive !== false);
    if (pkg.treatments && Array.isArray(pkg.treatments)) {
      setPkgEditTreatments(
        pkg.treatments.map((t) => ({
          treatmentName: t.treatmentName || t.name || "",
          treatmentSlug: t.treatmentSlug || t.slug || "",
          sessions: t.sessions || 1,
          allocatedPrice: t.allocatedPrice || 0,
        }))
      );
    } else {
      setPkgEditTreatments([]);
    }
    setPkgEditModalOpen(true);
  };

  const closeEditModal = () => {
    setPkgEditingId(null);
    setPkgEditingName("");
    setPkgEditingPrice("");
    setPkgEditingValidityInMonths("");
    setPkgEditingStartDate("");
    setPkgEditingEndDate("");
    setPkgEditTreatments([]);
    setPkgEditTreatmentDropdownOpen(false);
    setPkgEditTreatmentSearchQuery("");
    setPkgEditModalOpen(false);
  };

  const handleEditTreatmentToggle = (treatment) => {
    setPkgEditTreatments((prev) => {
      const exists = prev.find((t) => t.treatmentSlug === treatment.slug);
      if (exists) {
        return prev.filter((t) => t.treatmentSlug !== treatment.slug);
      } else {
        setPkgEditTreatmentDropdownOpen(false);
        return [...prev, { treatmentName: treatment.name, treatmentSlug: treatment.slug, sessions: 1, allocatedPrice: 0 }];
      }
    });
  };

  const handleEditRemoveTreatment = (treatmentSlug, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPkgEditTreatments((prev) => {
      return prev.filter((t) => t.treatmentSlug !== treatmentSlug);
    });
  };

  const handleEditSessionChange = (slug, sessions) => {
    setPkgEditTreatments((prev) =>
      prev.map((t) => (t.treatmentSlug === slug ? { ...t, sessions: parseInt(sessions) || 1 } : t))
    );
  };

  const handleEditAllocatedPriceChange = (slug, allocatedPrice) => {
    setPkgEditTreatments((prev) =>
      prev.map((t) => (t.treatmentSlug === slug ? { ...t, allocatedPrice: parseFloat(allocatedPrice) || 0 } : t))
    );
  };

  const handleDeletePackage = async (packageId) => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    try {
      const res = await axios.delete(`/api/clinic/packages?packageId=${packageId}`, {
        headers,
      });
      if (res.data.success) {
        const successMsg = res.data.message || "Package deleted successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        await loadPackages();
      } else {
        const errorMsg = res.data.message || "Failed to delete package";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete package";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    }
  };
  const handleDelete = async (serviceId) => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({ type: "error", text: "Authentication required. Please log in again." });
      return;
    }
    try {
      const res = await axios.delete(`/api/clinic/services?serviceId=${serviceId}`, { headers });
      if (res.data.success) {
        const successMsg = res.data.message || "Service deleted";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        await loadServices();
      } else {
        const errorMsg = res.data.message || "Failed to delete service";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete service";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    }
  };



  // Show access denied message only if BOTH read and create are false
  if (!permissions.canRead && !permissions.canCreate) {
    console.log("Rendering Access Denied - permissions:", permissions);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-700">
            You do not have permission to view or create services. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // Helper to check if we should show list data (only when canRead is true)
  const shouldShowData = permissions.canRead;

  return (
    <>
      <Toaster position="top-right" />
      <div className="p-4 space-y-4 w-full lg:w-[95%] xl:w-[90%] mx-auto">
        <div className="flex border-b border-gray-200 mb-2">
          <button
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "services"
                ? "border-gray-800 text-teal-900"
                : "border-transparent text-teal-500 hover:text-teal-700"
            }`}
          >
            Services
          </button>
        
          <button
            onClick={() => setActiveTab("memberships")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "memberships"
                ? "border-gray-800 text-teal-900"
                : "border-transparent text-teal-500 hover:text-teal-700"
            }`}
          >
            Memberships
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === "packages"
                ? "border-gray-800 text-teal-900"
                : "border-transparent text-teal-500 hover:text-teal-700"
            }`}
          >
            Packages
          </button>
        </div>
        <div>
          {message.text && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded border ${
                message.type === "error"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : message.type === "success"
                  ? "bg-[#2D9AA5]/5 text-[#2D9AA5] border-[#2D9AA5]/20"
                  : "bg-sky-50 text-sky-800 border-sky-200"
              }`}
            >
              {message.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
        </div>

        {activeTab === "services" && (
          <>
            {/* Service Creation Form - Modern Healthcare UI */}
            {permissions.canCreate && (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-teal-800 tracking-tight">Create New Service</h2>
                    <p className="text-xs text-teal-600">Add a new service offering for your clinic</p>
                  </div>
                </div>
              
              <form onSubmit={handleCreateBatch} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-teal-700 mb-1.5">
                      Department
                    </label>
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                      disabled={departmentsLoading}
                      required
                    >
                      <option value="" disabled>Select department</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {servicesBatch.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-medium text-teal-700 mb-1.5">Service Name</label>
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => handleRowChange(idx, "name", e.target.value)}
                          placeholder="e.g., Dental Cleaning"
                          className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-teal-700 mb-1.5">Price ({getCurrencySymbol(currency)})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-medium text-sm">{getCurrencySymbol(currency)}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.price}
                            onChange={(e) => handleRowChange(idx, "price", e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-teal-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-teal-700 mb-1.5">Duration (Minutes)</label>
                        <input
                          type="number"
                          min="5"
                          value={row.durationMinutes}
                          onChange={(e) => handleRowChange(idx, "durationMinutes", e.target.value)}
                          placeholder="30"
                          className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs"
                          required
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-teal-700 mb-1.5">Clinic Price ({getCurrencySymbol(currency)})</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-medium text-sm">{getCurrencySymbol(currency)}</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={row.clinicPrice}
                              onChange={(e) => handleRowChange(idx, "clinicPrice", e.target.value)}
                              placeholder="0.00"
                              className="w-full border border-teal-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={servicesBatch.length === 1}
                          className="h-10 px-3 bg-rose-100 text-rose-700 text-xs font-medium rounded-md hover:bg-rose-200 disabled:opacity-50"
                          title="Remove row"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-2 bg-white text-teal-700 border border-teal-200 rounded-lg text-xs font-medium hover:bg-teal-50"
                    >
                      <Plus className="inline w-3 h-3 mr-1" />
                      Add Service Row
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 disabled:opacity-60 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          Create Services
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
            )}
            
            {/* Service Display Section - Modern Healthcare UI */}
            {shouldShowData && (
            <div className="bg-white border border-teal-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-teal-800 tracking-tight">Service Catalog</h2>
                    <p className="text-xs text-teal-600">Manage your clinic's service offerings</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Service Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400" />
                    <input
                      type="text"
                      placeholder="Search services..."
                      value={serviceSearchTerm}
                      onChange={(e) => setServiceSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-3.5 text-xs font-medium bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 w-full sm:w-64"
                    />
                  </div>
                  <div className="hidden sm:block px-3 py-1.5 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg border border-teal-200">
                    <span className="text-xs font-bold text-teal-700">
                      {services.length} {services.length === 1 ? 'Service' : 'Services'}
                    </span>
                  </div>
                  <select
                    value={filterDepartmentId}
                    onChange={(e) => setFilterDepartmentId(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-teal-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">Loading services...</span>
                  </div>
                </div>
              ) : services.filter(service => 
                service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-3">
                    <Wrench className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No services found</h3>
                  <p className="text-xs text-gray-600">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {services.filter(service => 
                    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
                  ).map((s) => {
                    const statusColor = s.isActive ? 'bg-[#2D9AA5]/10 text-[#2D9AA5]' : 'bg-gray-100 text-gray-800';
                    const statusText = s.isActive ? 'Active' : 'Inactive';
                    
                    return (
                      <div
                        key={s._id}
                        className={`bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                          s.isActive ? 'border-[#2D9AA5]/20 shadow-sm' : 'border-gray-200 shadow-sm'
                        }`}
                        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                      >
                        {/* Service Header */}
                        <div className={`px-4 py-3 ${
                          s.isActive ? 'bg-gradient-to-r from-[#2D9AA5]/5 to-[#2D9AA5]/10' : 'bg-gradient-to-r from-gray-50 to-slate-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-900 mb-1 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{s.name}</h3>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor} shadow-xs`}>
                                  {statusText}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal-100 text-teal-700 shadow-xs">
                                  {(() => {
                                    const d = departments.find((dd) => dd._id === String(s.departmentId || ""));
                                    return d ? d.name : "Unassigned";
                                  })()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-teal-700 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{getCurrencySymbol(currency)}{Number(s.price || 0).toFixed(2)}</div>
                              <div className="text-[10px] text-gray-600">{s.durationMinutes} min</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Service Details */}
                        <div className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Package className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Price</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">{getCurrencySymbol(currency)}{Number(s.price || 0).toFixed(2)}</span>
                            </div>
                            
                            {s.clinicPrice !== undefined && s.clinicPrice !== null && (
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-1.5">
                                  <div className="p-1.5 bg-teal-100 rounded-md">
                                    <Package className="w-3.5 h-3.5 text-teal-600" />
                                  </div>
                                  <span className="text-[10px] text-gray-600 font-medium">Clinic Price</span>
                                </div>
                                <span className="text-xs font-medium text-gray-900">{getCurrencySymbol(currency)}{Number(s.clinicPrice || 0).toFixed(2)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Duration</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">{s.durationMinutes} min</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Package className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Department</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">
                                {(() => {
                                  const d = departments.find((dd) => dd._id === String(s.departmentId || ""));
                                  return d ? d.name : "Unassigned";
                                })()}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Created</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">{new Date(s.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons - EDIT FUNCTIONALITY FULLY PRESERVED */}
                          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                            {editingId !== s._id ? (
                              <>
                                {permissions.canUpdate && (
                                <button
                                  onClick={() => {
                                    setEditingId(s._id);
                                    setEditingName(s.name || "");
                                    setEditingPrice(String(s.price ?? ""));
                                    setEditingDuration(String(s.durationMinutes ?? ""));
                                    setEditingClinicPrice(s.clinicPrice !== undefined && s.clinicPrice !== null ? String(s.clinicPrice) : "");
                                    setEditingDepartmentId(s.departmentId ? String(s.departmentId) : "");
                                    setEditingActive(Boolean(s.isActive));
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-md hover:bg-teal-200 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                                )}
                                {permissions.canDelete && (
                                <button
                                  onClick={() => handleDelete(s._id)}
                                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                )}
                              </>
                            ) : (
                              <div className="space-y-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                                <h3 className="text-xs font-semibold text-teal-800 mb-2">Edit Service</h3>
                                
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                      autoFocus
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Price ({getCurrencySymbol(currency)})
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-teal-500 font-medium text-xs">{getCurrencySymbol(currency)}</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingPrice}
                                        onChange={(e) => setEditingPrice(e.target.value)}
                                        className="w-full border border-teal-200 rounded-lg pl-6 pr-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Duration (min)
                                    </label>
                                    <input
                                      type="number"
                                      min="5"
                                      value={editingDuration}
                                      onChange={(e) => setEditingDuration(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Department
                                    </label>
                                    <select
                                      value={editingDepartmentId}
                                      onChange={(e) => setEditingDepartmentId(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                    >
                                      <option value="">Unassigned</option>
                                      {departments.map((d) => (
                                        <option key={d._id} value={d._id}>{d.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Clinic Price ({getCurrencySymbol(currency)})
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-teal-500 font-medium text-xs">{getCurrencySymbol(currency)}</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editingClinicPrice}
                                        onChange={(e) => setEditingClinicPrice(e.target.value)}
                                        className="w-full border border-teal-200 rounded-lg pl-6 pr-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-2">
                                    <span className="text-[10px] font-medium text-teal-700">Status:</span>
                                    <select
                                      value={editingActive ? "active" : "inactive"}
                                      onChange={(e) => setEditingActive(e.target.value === "active")}
                                      className="border border-teal-200 rounded-lg px-1.5 py-1 text-[10px] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-3">
                                  <button
                                    onClick={handleUpdate}
                                    disabled={updating}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-md hover:bg-teal-700 disabled:opacity-60 transition-colors"
                                  >
                                    {updating ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-3 h-3" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingId(null);
                                      setEditingName("");
                                      setEditingPrice("");
                                      setEditingDuration("");
                                      setEditingActive(true);
                                    }}
                                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}
          </>
        )}
               {activeTab === "memberships" && (
          <>
            {/* Membership Creation Form - Compact Healthcare UI */}
            {permissions.canCreate && (
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-4 mb-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-teal-800 tracking-tight">Create New Membership</h2>
                    <p className="text-xs text-teal-600">Set up membership plans for your patients</p>
                  </div>
                </div>
              <form onSubmit={handleCreateMembership} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-teal-700 mb-1.5">
                      Membership Name
                    </label>
                    <input
                      type="text"
                      value={memName}
                      onChange={(e) => setMemName(e.target.value)}
                      placeholder="e.g., Premium Annual Plan"
                      className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-teal-700 mb-1.5">
                      Price ({getCurrencySymbol(currency)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-medium text-sm">{getCurrencySymbol(currency)}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={memPrice}
                        onChange={(e) => setMemPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-teal-200 rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-teal-700 mb-1.5">
                      Duration (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={memDurationMonths}
                      onChange={(e) => setMemDurationMonths(e.target.value)}
                      placeholder="12"
                      className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-teal-700 mb-1.5">
                      Free Consultations
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={memFreeConsultations}
                      onChange={(e) => setMemFreeConsultations(e.target.value)}
                      placeholder="0 (0 = unlimited)"
                      className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-teal-700 mb-1.5">
                      Discount Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={memDiscountPercentage}
                        onChange={(e) => setMemDiscountPercentage(e.target.value)}
                        placeholder="0.0"
                        className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 font-medium text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs font-medium text-teal-700 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={memPriorityBooking}
                          onChange={(e) => setMemPriorityBooking(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-9 h-5 rounded-full transition-colors ${memPriorityBooking ? 'bg-teal-600' : 'bg-gray-300'}`}>
                          <div className={`absolute w-3 h-3 bg-white rounded-full shadow-xs transform transition-transform ${memPriorityBooking ? 'translate-x-5' : 'translate-x-1'} top-1`}></div>
                        </div>
                      </div>
                      Priority Booking
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={memSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-medium rounded-lg hover:from-teal-700 hover:to-cyan-700 disabled:opacity-60 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {memSubmitting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Create Membership
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            )}

            {/* Membership Display Section - Compact Healthcare UI */}
            {shouldShowData && (
            <div className="bg-white border border-teal-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-teal-800 tracking-tight">Membership Plans</h2>
                    <p className="text-xs text-teal-600">Manage your clinic's membership offerings</p>
                  </div>
                </div>
                
                {/* Filter Controls */}
                <div className="flex flex-wrap gap-2">
                  {/* Membership Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400" />
                    <input
                      type="text"
                      placeholder="Search memberships..."
                      value={membershipSearchTerm}
                      onChange={(e) => setMembershipSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs font-medium bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 w-full sm:w-64"
                    />
                  </div>
                  <select
                    value={memFilter}
                    onChange={(e) => setMemFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 dark:bg-white dark:text-gray-900"
                  >
                    <option value="all">All Memberships</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="priority">Priority Booking</option>
                    <option value="expiring-1-month">Expiring in 1 Month</option>
                    <option value="expiring-2-months">Expiring in 2 Months</option>
                    <option value="expiring-3-months">Expiring in 3 Months</option>
                    <option value="recent">Recent</option>
                  </select>
                </div>
              </div>
              
              {memLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-teal-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium">Loading memberships...</span>
                  </div>
                </div>
              ) : memberships.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">No memberships created yet</h3>
                  <p className="text-xs text-gray-600">Create your first membership plan to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(() => {
                    // Filter memberships based on selected filter and search term
                    const filteredMemberships = memberships.filter(m => {
                      const isExpired = isMembershipExpired(m);
                      const isActive = m.isActive && !isExpired;
                      
                      // Apply filter based on memFilter
                      let passesFilter = true;
                      switch(memFilter) {
                        case 'active':
                          passesFilter = isActive;
                          break;
                        case 'expired':
                          passesFilter = isExpired;
                          break;
                        case 'priority':
                          passesFilter = m.benefits?.priorityBooking === true;
                          break;
                        case 'expiring-soon':
                          // Show memberships that will expire soon (within 30 days)
                          if (!isActive) passesFilter = false; // Only consider active memberships
                          else {
                            const expirationDate = new Date(m.createdAt);
                            expirationDate.setMonth(expirationDate.getMonth() + m.durationMonths);
                            const today = new Date();
                            const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            passesFilter = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
                          }
                          break;
                        case 'expiring-1-month':
                          // Show memberships expiring within 1 month
                          if (!isActive) passesFilter = false; // Only consider active memberships
                          else {
                            const expDate1 = new Date(m.createdAt);
                            expDate1.setMonth(expDate1.getMonth() + m.durationMonths);
                            const today1 = new Date();
                            const daysUntilExpiry1 = Math.ceil((expDate1.getTime() - today1.getTime()) / (1000 * 60 * 60 * 24));
                            passesFilter = daysUntilExpiry1 <= 30 && daysUntilExpiry1 >= 0;
                          }
                          break;
                        case 'expiring-2-months':
                          // Show memberships expiring within 2 months
                          if (!isActive) passesFilter = false; // Only consider active memberships
                          else {
                            const expDate2 = new Date(m.createdAt);
                            expDate2.setMonth(expDate2.getMonth() + m.durationMonths);
                            const today2 = new Date();
                            const daysUntilExpiry2 = Math.ceil((expDate2.getTime() - today2.getTime()) / (1000 * 60 * 60 * 24));
                            passesFilter = daysUntilExpiry2 <= 60 && daysUntilExpiry2 >= 0;
                          }
                          break;
                        case 'expiring-3-months':
                          // Show memberships expiring within 3 months
                          if (!isActive) passesFilter = false; // Only consider active memberships
                          else {
                            const expDate3 = new Date(m.createdAt);
                            expDate3.setMonth(expDate3.getMonth() + m.durationMonths);
                            const today3 = new Date();
                            const daysUntilExpiry3 = Math.ceil((expDate3.getTime() - today3.getTime()) / (1000 * 60 * 60 * 24));
                            passesFilter = daysUntilExpiry3 <= 90 && daysUntilExpiry3 >= 0;
                          }
                          break;
                        case 'recent':
                          // Show recently created memberships (last 7 days)
                          const createdDate = new Date(m.createdAt);
                          const daysSinceCreation = Math.ceil((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                          passesFilter = daysSinceCreation <= 7;
                          break;
                        default: // 'all'
                          passesFilter = true;
                      }
                      
                      // Apply search filter
                      const passesSearch = m.name.toLowerCase().includes(membershipSearchTerm.toLowerCase());
                      
                      return passesFilter && passesSearch;
                    });
                    
                    if (filteredMemberships.length === 0) {
                      return (
                        <div key="no-results" className="col-span-full text-center py-8">
                          <div className="w-12 h-12 mx-auto bg-[#2D9AA5]/10 rounded-full flex items-center justify-center mb-3">
                            <Users className="w-6 h-6 text-[#2D9AA5]/60" />
                          </div>
                          <h3 className="text-base font-medium text-gray-900 mb-1">No memberships found</h3>
                          <p className="text-xs text-gray-600">Try changing your filter criteria</p>
                        </div>
                      );
                    }
                    return filteredMemberships.map((m) => {
                    const isExpired = isMembershipExpired(m);
                    const isActive = m.isActive && !isExpired;
                    const statusColor = isActive ? 'bg-[#2D9AA5]/10 text-[#2D9AA5]' : isExpired ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
                    const statusText = isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive';
                    
                    return (
                      <div
                        key={m._id}
                        className={`bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                          isActive ? 'border-[#2D9AA5]/20 shadow-sm' :
                          isExpired ? 'border-red-200 bg-red-50 shadow-sm' : 'border-gray-200 shadow-sm'
                        }`}
                        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                      >
                        {/* Membership Header */}
                        <div className={`px-4 py-3 ${
                          isActive ? 'bg-gradient-to-r from-teal-50 to-cyan-50' :
                          isExpired ? 'bg-gradient-to-r from-red-50 to-pink-50' : 'bg-gradient-to-r from-gray-50 to-slate-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-gray-900 mb-1 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{m.name}</h3>
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor} shadow-xs`}>
                                  {statusText}
                                </span>
                                {m.benefits?.priorityBooking && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 shadow-xs">
                                    <Star className="w-2.5 h-2.5 mr-1" />
                                    Priority
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-teal-700 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{getCurrencySymbol(currency)}{Number(m.price || 0).toFixed(2)}</div>
                              <div className="text-[10px] text-gray-600">{m.durationMonths} months</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Membership Benefits */}
                        <div className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Duration</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">{m.durationMonths} months</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Free Consultations</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">
                                {m.benefits?.freeConsultations === 0 ? 'Unlim' : m.benefits?.freeConsultations || 0}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Percent className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Discount</span>
                              </div>
                              <span className="text-xs font-medium text-gray-900">{m.benefits?.discountPercentage || 0}%</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1.5 bg-teal-100 rounded-md">
                                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-600 font-medium">Priority</span>
                              </div>
                              <span className={`text-xs font-medium ${m.benefits?.priorityBooking ? 'text-teal-600' : 'text-gray-400'}`}>
                                {m.benefits?.priorityBooking ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action Buttons - EDIT FUNCTIONALITY FULLY PRESERVED */}
                          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                            {memEditingId !== m._id ? (
                              <>
                                {permissions.canUpdate && (
                                <button
                                  onClick={() => {
                                    setMemEditingId(m._id);
                                    setMemEditingName(m.name || "");
                                    setMemEditingPrice(String(m.price ?? ""));
                                    setMemEditingDurationMonths(String(m.durationMonths ?? ""));
                                    setMemEditingFreeConsultations(String(m.benefits?.freeConsultations ?? "0"));
                                    setMemEditingDiscountPercentage(String(m.benefits?.discountPercentage ?? "0"));
                                    setMemEditingPriorityBooking(Boolean(m.benefits?.priorityBooking));
                                    setMemEditingActive(Boolean(m.isActive));
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-[#2D9AA5]/10 text-[#2D9AA5] text-xs font-medium rounded-md hover:bg-[#2D9AA5]/20 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                                )}
                                {permissions.canDelete && (
                                <button
                                  onClick={() => handleDeleteMembership(m._id)}
                                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                )}
                              </>
                            ) : (
                              <div className="space-y-3 p-3 bg-[#2D9AA5]/5 rounded-lg border border-[#2D9AA5]/20">
                                <h3 className="text-xs font-semibold text-[#2D9AA5] mb-2">Edit Membership</h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Name
                                    </label>
                                    <input
                                      type="text"
                                      value={memEditingName}
                                      onChange={(e) => setMemEditingName(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Price (AED)
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#2D9AA5]/70 font-medium text-xs">د.إ</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={memEditingPrice}
                                        onChange={(e) => setMemEditingPrice(e.target.value)}
                                        className="w-full border border-teal-200 rounded-lg pl-6 pr-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                        style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Duration (Months)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={memEditingDurationMonths}
                                      onChange={(e) => setMemEditingDurationMonths(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Free Cons
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={memEditingFreeConsultations}
                                      onChange={(e) => setMemEditingFreeConsultations(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-medium text-teal-700 mb-1">
                                      Discount %
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                      value={memEditingDiscountPercentage}
                                      onChange={(e) => setMemEditingDiscountPercentage(e.target.value)}
                                      className="w-full border border-teal-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 hover:border-teal-300 transition-all shadow-xs dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-2">
                                  <label className="flex items-center gap-2 text-[10px] font-medium text-teal-700">
                                    <input
                                      type="checkbox"
                                      checked={memEditingPriorityBooking}
                                      onChange={(e) => setMemEditingPriorityBooking(e.target.checked)}
                                      className="w-3 h-3 text-teal-600 rounded focus:ring-teal-500"
                                    />
                                    Priority
                                  </label>
                                  
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={memEditingActive ? "active" : "inactive"}
                                      onChange={(e) => setMemEditingActive(e.target.value === "active")}
                                      className="border border-teal-200 rounded-lg px-1.5 py-1 text-[10px] focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-gray-900 dark:bg-white dark:text-gray-900"
                                      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                                    >
                                      <option value="active">Active</option>
                                      <option value="inactive">Inactive</option>
                                    </select>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-3">
                                  <button
                                    onClick={handleUpdateMembership}
                                    disabled={memUpdating}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-md hover:bg-teal-700 disabled:opacity-60 transition-colors"
                                  >
                                    {memUpdating ? (
                                      <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-3 h-3" />
                                        Save
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setMemEditingId(null);
                                      setMemEditingName("");
                                      setMemEditingPrice("");
                                      setMemEditingDurationMonths("");
                                      setMemEditingFreeConsultations("0");
                                      setMemEditingDiscountPercentage("0");
                                      setMemEditingPriorityBooking(false);
                                    }}
                                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                 })()}
                </div>
              )}
            </div>
            )}
          </>
        )}
        {activeTab === "packages" && (
          <>
            {permissions.canCreate && (
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shadow-md">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-teal-800">Create New Package</h2>
                  <p className="text-xs text-teal-600">Define package details and allocate treatments</p>
                </div>
              </div>
              
              <form onSubmit={handleCreatePackage} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-teal-700 mb-1.5">Package Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pkgName}
                          onChange={(e) => setPkgName(e.target.value)}
                          placeholder="Enter package name"
                          className="w-full px-3 py-2.5 text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400 shadow-sm transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-teal-700 mb-1.5">Total Package Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-base"></span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={pkgPrice}
                          onChange={(e) => setPkgPrice(e.target.value)}
                          placeholder=""
                          className="w-full pl-8 pr-3 py-2.5 text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400 shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-teal-700 mb-1 sm:mb-1.5">Validity (Months)</label>
                        <input
                          type="number"
                          min="0"
                          value={pkgValidityInMonths}
                          onChange={(e) => setPkgValidityInMonths(e.target.value)}
                          placeholder="e.g. 12"
                          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400 shadow-sm transition-all placeholder:text-[10px] sm:placeholder:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-teal-700 mb-1 sm:mb-1.5">Start Date</label>
                        <input
                          type="date"
                          value={pkgStartDate}
                          onChange={(e) => setPkgStartDate(e.target.value)}
                          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400 shadow-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] sm:text-xs font-semibold text-teal-700 mb-1 sm:mb-1.5">End Date</label>
                        <input
                          type="date"
                          value={pkgEndDate}
                          readOnly
                          className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-teal-200 rounded-lg bg-teal-50 border-teal-200 text-teal-700 cursor-not-allowed shadow-sm transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Treatment Selection Card */}
                  <div className="bg-white border border-teal-200 rounded-lg p-4 shadow-sm">
                    <div className="mb-3">
                      <h3 className="font-semibold text-teal-700 mb-1">Select Treatments</h3>
                      <p className="text-xs text-teal-600">Choose treatments to include in this package</p>
                    </div>
                    
                    <div className="relative treatment-dropdown-container">
                      <button
                        type="button"
                        onClick={() => setTreatmentDropdownOpen(!treatmentDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-teal-50 border border-teal-200 rounded-md text-sm text-slate-700 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-white dark:border-slate-600 dark:text-slate-900 transition-all"
                      >
                        <span className="text-teal-700 font-medium dark:text-slate-900">
                          {selectedTreatments.length > 0
                            ? `${selectedTreatments.length} treatment(s) selected`
                            : "Select treatments to add..."}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-teal-500 transition-transform ${treatmentDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {treatmentDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1.5 bg-white border border-teal-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                          {/* Search Input */}
                          <div className="p-2 border-b border-teal-100 sticky top-0 bg-white">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400" />
                              <input
                                type="text"
                                placeholder="Search treatments..."
                                value={treatmentSearchQuery}
                                onChange={(e) => setTreatmentSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          {/* Treatment List */}
                          <div className="overflow-y-auto max-h-40">
                            {(() => {
                              // Show all treatments when search box is empty
                              if (!treatmentSearchQuery.trim()) {
                                return (
                                  <div className="p-1.5">
                                    {treatments.map((treatment) => {
                                      const isSelected = selectedTreatments.some((t) => t.treatmentSlug === treatment.slug);
                                      return (
                                        <button
                                          key={treatment.slug}
                                          type="button"
                                          onClick={() => {
                                            handleTreatmentToggle(treatment);
                                            setTreatmentSearchQuery(""); // Clear search after selection
                                          }}
                                          className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-all ${
                                            isSelected
                                              ? "bg-teal-50 text-teal-800 font-medium border border-teal-200"
                                              : "text-teal-700 hover:bg-teal-50 border border-transparent"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>
                                              {treatment.name}
                                              {treatment.type === "sub" && (
                                                <span className="text-[10px] text-teal-500 ml-1">({treatment.mainTreatment})</span>
                                              )}
                                            </span>
                                            {isSelected && (
                                              <span className="text-teal-600 text-xs">✓</span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              
                              const filteredTreatments = treatments.filter((treatment) => {
                                const query = treatmentSearchQuery.toLowerCase();
                                const nameMatch = treatment.name.toLowerCase().includes(query);
                                const mainTreatmentMatch = treatment.mainTreatment?.toLowerCase().includes(query);
                                return nameMatch || mainTreatmentMatch;
                              });
                              
                              if (filteredTreatments.length === 0) {
                                return (
                                  <div className="p-3 text-center text-xs text-teal-500">
                                    No treatments found matching "{treatmentSearchQuery}"
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="p-1.5">
                                  {filteredTreatments.map((treatment) => {
                                    const isSelected = selectedTreatments.some((t) => t.treatmentSlug === treatment.slug);
                                    return (
                                      <button
                                        key={treatment.slug}
                                        type="button"
                                        onClick={() => {
                                          handleTreatmentToggle(treatment);
                                          setTreatmentSearchQuery(""); // Clear search after selection
                                        }}
                                        className={`w-full text-left px-2.5 py-2 rounded-md text-xs transition-all ${
                                          isSelected
                                            ? "bg-blue-50 text-slate-800 font-medium border border-slate-200"
                                            : "text-slate-700 hover:bg-blue-50 border border-transparent"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>
                                            {treatment.name}
                                            {treatment.type === "sub" && treatment.mainTreatment && (
                                              <span className="text-[10px] text-teal-500 ml-1">({treatment.mainTreatment})</span>
                                            )}
                                          </span>
                                          {isSelected && (
                                            <span className="text-slate-600 text-xs">✓</span>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Selected Treatments with Sessions and Price - Enhanced Card Design */}
                {selectedTreatments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-teal-700 text-sm">Selected Treatments</h3>
                      <span className="px-2.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                        {selectedTreatments.length} treatment{selectedTreatments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedTreatments.map((selectedTreatment) => {
                        const treatment = treatments.find((t) => t.slug === selectedTreatment.treatmentSlug);
                        const sessionPrice = selectedTreatment.sessions > 0 
                          ? (selectedTreatment.allocatedPrice || 0) / selectedTreatment.sessions 
                          : 0;
                        return (
                          <div
                            key={selectedTreatment.treatmentSlug}
                            className="bg-white border border-teal-200 rounded-lg p-3 shadow-sm transition-all"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-teal-700 text-xs">
                                {selectedTreatment.treatmentName}
                              </h4>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveTreatment(selectedTreatment.treatmentSlug, e);
                                }}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Remove treatment"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-0.5">
                                <label className="block text-[10px] text-teal-600 font-medium">Price</label>
                                <div className="relative">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-teal-500 text-xs">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={selectedTreatment.allocatedPrice || ""}
                                    onChange={(e) => handleAllocatedPriceChange(selectedTreatment.treatmentSlug, e.target.value)}
                                    className="w-full pl-5 pr-1.5 py-1.5 text-xs font-medium border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-teal-50 dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-0.5">
                                <label className="block text-[10px] text-teal-600 font-medium">Sess</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={selectedTreatment.sessions || 1}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    handleSessionChange(selectedTreatment.treatmentSlug, value);
                                  }}
                                  className="w-full px-1.5 py-1.5 text-xs font-medium text-center border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-teal-50 dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                                  placeholder="1"
                                />
                              </div>
                              
                              <div className="space-y-0.5">
                                <label className="block text-[10px] text-teal-600 font-medium">/Sess</label>
                                <div className="px-1.5 py-1.5 text-xs font-bold text-center bg-teal-100 rounded-md text-teal-700 border border-teal-200 dark:bg-white dark:border-slate-600 dark:text-slate-900">
                                  ${sessionPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Price Validation Summary Card */}
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-white rounded-md border border-teal-200">
                          <p className="text-[10px] text-teal-600 font-medium">Package Price</p>
                          <p className="font-bold text-sm text-teal-700">${parseFloat(pkgPrice) || 0}</p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-md border border-teal-200">
                          <p className="text-[10px] text-teal-600 font-medium">Allocated Total</p>
                          <p className="font-bold text-sm text-teal-700">
                            ${selectedTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-white rounded-md border border-teal-200">
                          <p className="text-[10px] text-teal-600 font-medium">Remaining</p>
                          <p className={`font-bold text-sm ${Math.abs((parseFloat(pkgPrice) || 0) - selectedTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0)) < 0.01 ? 'text-teal-600' : 'text-amber-600'}`}>
                            ${((parseFloat(pkgPrice) || 0) - selectedTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="pt-1.5">
                  <button
                    type="submit"
                    disabled={pkgSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 disabled:opacity-60 transition-all shadow-md text-sm"
                  >
                    {pkgSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        <span className="sr-only">Creating package...</span>
                      </>
                    ) : "Create Package"}
                  </button>
                </div>
              </form>
            </div>
            )}
            
            {shouldShowData && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shadow-md">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-teal-800">All Packages</h2>
                    <p className="text-xs text-teal-600">Manage your existing packages</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Package Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-400" />
                    <input
                      type="text"
                      placeholder="Search packages..."
                      value={packageSearchTerm}
                      onChange={(e) => setPackageSearchTerm(e.target.value)}
                      className="pl-8 pr-3 py-3.5 text-xs font-medium bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-700 w-full sm:w-64"
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg border border-teal-200">
                    <span className="text-xs font-bold text-teal-700">
                      {packages.length} {packages.length === 1 ? 'Package' : 'Packages'}
                    </span>
                  </div>
                </div>
              </div>
              
              {pkgLoading ? (
                <div className="flex items-center justify-center py-12 text-teal-600">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 mr-2 animate-spin mx-auto mb-2" />
                    <span className="text-sm font-medium">Loading packages...</span>
                  </div>
                </div>
              ) : packages.filter(pkg => 
                pkg.name.toLowerCase().includes(packageSearchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
                    <Package className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-1">No packages found</p>
                  <p className="text-sm text-gray-600 mb-4">Try adjusting your search criteria</p>
                  <div className="inline-block px-3 py-1.5 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-lg">
                    <span className="text-xs text-teal-700 font-medium">Start building your service packages today!</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.filter(pkg => 
                    pkg.name.toLowerCase().includes(packageSearchTerm.toLowerCase())
                  ).map((pkg) => (
                    <div
                      key={pkg._id}
                      className="bg-white border border-teal-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-sm font-bold text-teal-800 truncate flex-1">{pkg.name}</h3>
                        </div>
                        <div className="flex gap-1 ml-2 flex-shrink-0">
                          {permissions.canUpdate && (
                          <button
                            onClick={() => openEditModal(pkg)}
                            className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-md transition-colors"
                            title="Edit package"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          )}
                          {permissions.canDelete && (
                          <button
                            onClick={() => handleDeletePackage(pkg._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete package"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          )}
                        </div>
                      </div>
                                            
                      <div className="space-y-2">
                        {/* Package Stats */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-teal-50 rounded p-2 border border-teal-200">
                            <p className="text-[10px] text-teal-600 font-medium">Total</p>
                            <p className="text-xs font-bold text-teal-700">{getCurrencySymbol(currency)}{parseFloat(pkg.totalPrice).toFixed(2)}</p>
                          </div>
                          <div className="bg-teal-50 rounded p-2 border border-teal-200">
                            <p className="text-[10px] text-teal-600 font-medium">Sessions</p>
                            <p className="text-xs font-bold text-teal-700">{pkg.totalSessions || pkg.treatments.reduce((sum, t) => sum + (t.sessions || 0), 0)}</p>
                          </div>
                          <div className="bg-teal-50 rounded p-2 border border-teal-200">
                            <p className="text-[10px] text-teal-600 font-medium">Avg/Session</p>
                            <p className="text-xs font-bold text-teal-700">
                              {getCurrencySymbol(currency)}{pkg.sessionPrice ? parseFloat(pkg.sessionPrice).toFixed(2) : (pkg.totalPrice / (pkg.totalSessions || pkg.treatments.reduce((sum, t) => sum + (t.sessions || 0), 0))).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Validity Info */}
                        {(pkg.validityInMonths || pkg.startDate || pkg.endDate) && (
                          <div className="bg-teal-50 rounded p-2 border border-teal-200">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] text-teal-600 font-medium flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                Validity: {pkg.validityInMonths || 0} Months
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div>
                                <p className="text-[9px] text-teal-500">Start</p>
                                <p className="text-[10px] font-bold text-teal-700 truncate">
                                  {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString() : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] text-teal-500">End</p>
                                <p className="text-[10px] font-bold text-teal-700 truncate">
                                  {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Treatments */}
                        <div>
                          <p className="text-[10px] text-teal-600 font-medium mb-1">Treatments</p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {pkg.treatments && pkg.treatments.length > 0 && pkg.treatments.slice(0, 3).map((treatment, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-teal-50 border border-teal-200 rounded p-1.5">
                                <span className="text-xs font-medium text-teal-700 truncate flex-1 mr-1">{treatment.treatmentName || treatment.name}</span>
                                <div className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                                  {treatment.sessions || 1} x {getCurrencySymbol(currency)}{((treatment.allocatedPrice || 0) / (treatment.sessions || 1)).toFixed(2)}
                                </div>
                              </div>
                            ))}
                            {pkg.treatments && pkg.treatments.length > 3 && (
                              <div className="text-[10px] text-teal-600 font-medium text-center pt-0.5">
                                +{pkg.treatments.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[9px] text-slate-500 flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(pkg.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[9px] bg-blue-100 text-slate-800 px-1.5 py-0.5 rounded-full">
                          {pkg.treatments && pkg.treatments.length} T
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </>
        )}
      </div>

      {/* Edit Package Modal */}
      {pkgEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-teal-800">Edit Package</h2>
                    <p className="text-sm text-teal-600 font-medium">Update package details and treatment allocations</p>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-xl transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Package Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-teal-700 mb-2">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={pkgEditingName}
                    onChange={(e) => setPkgEditingName(e.target.value)}
                    placeholder="Enter package name"
                    className="w-full border border-teal-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white hover:border-teal-300 transition-all shadow-sm dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-teal-700 mb-2">
                    Total Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 font-bold text-base">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pkgEditingPrice}
                      onChange={(e) => setPkgEditingPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full border border-teal-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white hover:border-teal-300 transition-all shadow-sm dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Validity & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-700 mb-1.5 sm:mb-2">
                    Validity (Months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={pkgEditingValidityInMonths}
                    onChange={(e) => setPkgEditingValidityInMonths(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full border border-teal-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white hover:border-teal-300 transition-all shadow-sm dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400 placeholder:text-xs sm:placeholder:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-700 mb-1.5 sm:mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={pkgEditingStartDate}
                    onChange={(e) => setPkgEditingStartDate(e.target.value)}
                    className="w-full border border-teal-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white hover:border-teal-300 transition-all shadow-sm dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-teal-700 mb-1.5 sm:mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={pkgEditingEndDate}
                    readOnly
                    className="w-full border border-teal-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm bg-teal-50 border-teal-200 text-teal-700 cursor-not-allowed shadow-sm transition-all"
                  />
                </div>
              </div>

              {/* Treatment Selection Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-[#2D9AA5] mb-2">
                  Select Treatments
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPkgEditTreatmentDropdownOpen(!pkgEditTreatmentDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-sm text-teal-700 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm"
                  >
                    <span className="text-teal-600 dark:text-teal-700">
                      {pkgEditTreatments.length > 0
                        ? `${pkgEditTreatments.length} treatment(s) selected`
                        : "Select treatments to add..."}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-teal-500 transition-transform ${pkgEditTreatmentDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {pkgEditTreatmentDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-teal-200 rounded-lg shadow-lg">
                      {/* Search */}
                      <div className="p-2 border-b border-teal-100">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                          <input
                            type="text"
                            value={pkgEditTreatmentSearchQuery}
                            onChange={(e) => setPkgEditTreatmentSearchQuery(e.target.value)}
                            placeholder="Search treatments..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Treatment List */}
                      <div className="overflow-y-auto max-h-48">
                        {(() => {
                          if (!pkgEditTreatmentSearchQuery.trim()) {
                            return (
                              <div className="p-2">
                                {treatments.map((treatment) => {
                                  const isSelected = pkgEditTreatments.some((t) => t.treatmentSlug === treatment.slug);
                                  return (
                                    <button
                                      key={treatment.slug}
                                      type="button"
                                      onClick={() => {
                                        handleEditTreatmentToggle(treatment);
                                        setPkgEditTreatmentSearchQuery("");
                                      }}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        isSelected
                                          ? "bg-teal-100 text-teal-700 font-medium border border-teal-200"
                                          : "text-teal-700 hover:bg-teal-100"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>
                                          {treatment.name}
                                          {treatment.type === "sub" && (
                                            <span className="text-xs text-teal-500 ml-1">({treatment.mainTreatment})</span>
                                          )}
                                        </span>
                                        {isSelected && (
                                          <span className="text-teal-600 text-xs">✓</span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          }

                          const filteredTreatments = treatments.filter((t) =>
                            t.name.toLowerCase().includes(pkgEditTreatmentSearchQuery.toLowerCase()) ||
                            (t.mainTreatment && t.mainTreatment.toLowerCase().includes(pkgEditTreatmentSearchQuery.toLowerCase()))
                          );

                          if (filteredTreatments.length === 0) {
                            return (
                              <div className="p-4 text-center text-sm text-teal-500">
                                No treatments found matching "{pkgEditTreatmentSearchQuery}"
                              </div>
                            );
                          }

                          return (
                            <div className="p-2">
                              {filteredTreatments.map((treatment) => {
                                const isSelected = pkgEditTreatments.some((t) => t.treatmentSlug === treatment.slug);
                                return (
                                  <button
                                    key={treatment.slug}
                                    type="button"
                                    onClick={() => {
                                      handleEditTreatmentToggle(treatment);
                                      setPkgEditTreatmentSearchQuery("");
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                      isSelected
                                        ? "bg-teal-50 text-teal-700 font-medium"
                                        : "text-teal-700 hover:bg-teal-50"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>
                                        {treatment.name}
                                      </span>
                                      {isSelected && (
                                        <span className="text-teal-600 text-xs">✓</span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Treatments with Sessions and Price */}
              {pkgEditTreatments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-teal-700 text-sm">Selected Treatments</h3>
                    <span className="px-2.5 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                      {pkgEditTreatments.length} treatment{pkgEditTreatments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pkgEditTreatments.map((selectedTreatment) => {
                      const sessionPrice = selectedTreatment.sessions > 0 
                        ? (selectedTreatment.allocatedPrice || 0) / selectedTreatment.sessions 
                        : 0;
                      return (
                        <div
                          key={selectedTreatment.treatmentSlug}
                          className="bg-white border border-teal-200 rounded-lg p-3 shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-teal-700 text-xs">
                              {selectedTreatment.treatmentName}
                            </h4>
                            <button
                              type="button"
                              onClick={(e) => handleEditRemoveTreatment(selectedTreatment.treatmentSlug, e)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Remove treatment"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-teal-600 font-medium">Price</label>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-teal-500 text-xs">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={selectedTreatment.allocatedPrice || ""}
                                  onChange={(e) => handleEditAllocatedPriceChange(selectedTreatment.treatmentSlug, e.target.value)}
                                  className="w-full pl-5 pr-1.5 py-1.5 text-xs font-medium border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-teal-50 dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-teal-600 font-medium">Sess</label>
                              <input
                                type="number"
                                min="1"
                                value={selectedTreatment.sessions || 1}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  handleEditSessionChange(selectedTreatment.treatmentSlug, value);
                                }}
                                className="w-full px-1.5 py-1.5 text-xs font-medium text-center border border-teal-200 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-teal-50 dark:bg-white dark:border-slate-600 dark:text-slate-900 dark:placeholder-slate-400"
                                placeholder="1"
                              />
                            </div>
                            
                            <div className="space-y-0.5">
                              <label className="block text-[10px] text-teal-600 font-medium">/Sess</label>
                              <div className="px-1.5 py-1.5 text-xs font-bold text-center bg-teal-100 rounded-md text-teal-700 border border-teal-200 dark:bg-white dark:border-slate-600 dark:text-slate-900">
                                ${sessionPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Price Validation Summary */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-teal-700 font-semibold">Package Price:</span>
                      <span className="font-semibold text-teal-700">${parseFloat(pkgEditingPrice) || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-teal-700 font-semibold">Allocated Total:</span>
                      <span className="font-semibold text-teal-700">
                        ${pkgEditTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 border-t border-gray-200 pt-1">
                      <span className="text-teal-700 font-semibold">Remaining:</span>
                      <span className={`font-semibold ${Math.abs((parseFloat(pkgEditingPrice) || 0) - pkgEditTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0)) < 0.01 ? 'text-teal-600' : 'text-amber-600'}`}>
                        ${((parseFloat(pkgEditingPrice) || 0) - pkgEditTreatments.reduce((sum, t) => sum + (parseFloat(t.allocatedPrice) || 0), 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-5 py-2.5 bg-white border border-teal-300 text-teal-700 text-sm font-medium rounded-xl hover:bg-teal-100 hover:border-teal-400 transition-all duration-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePackage}
                disabled={pkgUpdating}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-medium rounded-xl hover:from-teal-700 hover:to-cyan-700 disabled:opacity-60 transition-all shadow-md hover:shadow-lg"
              >
                {pkgUpdating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  "Update Package"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Match clinic/patient-registration layout wrapping and protection
ServicesSetupPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedServicesSetup = withClinicAuth(ServicesSetupPage);
ProtectedServicesSetup.getLayout = ServicesSetupPage.getLayout;

export { ServicesSetupPage };
export default ProtectedServicesSetup;
