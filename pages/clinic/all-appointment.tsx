  "use client";
  import React, { useEffect, useState, useCallback, useRef } from "react";
  import axios from "axios";
  import withClinicAuth from "../../components/withClinicAuth";
  import ClinicLayout from "../../components/ClinicLayout";
  import type { NextPageWithLayout } from "../_app";
  import {
    Search,
    Filter,
    User,
    MoreVertical,
    Edit,
    History,
    FileText,
    MessageCircle,
    Trash2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    X,
    Receipt,
  } from "lucide-react";
  import EditAppointmentModal from "../../components/EditAppointmentModal";
  import AppointmentHistoryModal from "../../components/AppointmentHistoryModal";
  import AppointmentReportModal from "../../components/AppointmentReportModal";
  import AppointmentComplaintModal from "../../components/AppointmentComplaintModal";
  import AppointmentBillingModal from "../../components/AppointmentBillingModal";
  import { APPOINTMENT_STATUS_OPTIONS } from "../../data/appointmentStatusOptions";

  interface Appointment {
    _id: string;
    visitId: string;
    patientId: string;
    patientName: string;
    patientNumber: string;
    patientEmail: string;
    emrNumber: string;
    invoiceNumber: string;
    gender: string;
    doctorId: string;
    doctorName: string;
    doctorEmail: string;
    roomId: string;
    roomName: string;
    serviceId?: string;
    serviceName?: string;
    serviceIds?: string[];
    serviceNames?: string[];
    status: string;
    followType: string;
    referral: string;
    emergency: string;
    notes: string;
    registeredDate: string;
    registeredTime: string;
    invoicedDate: string;
    invoicedTime: string;
    startDate: string;
    fromTime: string;
    toTime: string;
    createdAt: string;
    updatedAt: string;
  }

  interface Doctor {
    _id: string;
    name: string;
    email: string;
  }

  interface Room {
    _id: string;
    name: string;
  }

  interface FilterState {
    search: string;
    emrNumber: string;
    fromDate: string;
    toDate: string;
    doctorId: string;
    roomId: string;
    status: string;
    followType: string;
    referral: string;
    emergency: string;
  }

  const AllAppointmentsPage: NextPageWithLayout = ({
    contextOverride = null,
  }: {
    contextOverride?: "clinic" | "agent" | null;
  }) => {
    const [permissions, setPermissions] = useState({
      canRead: true,
      canUpdate: true,
      canCreate: true,
      canDelete: true,
    });
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [routeContext, setRouteContext] = useState<"clinic" | "agent">(
      (contextOverride || "clinic") as "clinic" | "agent"
    );
    useEffect(() => {
      if (contextOverride) {
        setRouteContext(contextOverride);
        return;
      }
      if (typeof window === "undefined") return;
      const isAgentRoute =
        window.location.pathname?.startsWith("/agent/") ?? false;
      setRouteContext(isAgentRoute ? "agent" : "clinic");
    }, [contextOverride]);
    // Helper to get today's date in YYYY-MM-DD format
    const getTodayDateString = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    
    // Applied filters (used for API calls)
    const [filters, setFilters] = useState<FilterState>({
      search: "",
      emrNumber: "",
      fromDate: getTodayDateString(),
      toDate: getTodayDateString(),
      doctorId: "",
      roomId: "",
      status: "",
      followType: "",
      referral: "",
      emergency: "",
    });
    
    // Pending filters (for the filter inputs before applying)
    const [pendingFilters, setPendingFilters] = useState<FilterState>({
      search: "",
      emrNumber: "",
      fromDate: getTodayDateString(),
      toDate: getTodayDateString(),
      doctorId: "",
      roomId: "",
      status: "",
      followType: "",
      referral: "",
      emergency: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
    const menuPositionRefs = useRef<Record<string, { top?: number; bottom?: number; left?: number }>>({});
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [complaintModalOpen, setComplaintModalOpen] = useState(false);
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [selectedPatientName, setSelectedPatientName] = useState<string>("");
    const [reportAppointment, setReportAppointment] = useState<Appointment | null>(null);
    const [complaintAppointment, setComplaintAppointment] = useState<Appointment | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const appointmentRef = useRef<Appointment | null>(null);
    const [initialEditId, setInitialEditId] = useState<string | null>(null); // For handling edit from URL hash


    // Sync ref with state
    useEffect(() => {
      if (selectedAppointment) {
        appointmentRef.current = selectedAppointment;
      }
    }, [selectedAppointment]);

    // Handle URL hash for opening edit modal
    useEffect(() => {
      const handleHashChange = () => {
        const hash = window.location.hash;
        if (hash.startsWith('#edit-')) {
          const appointmentId = hash.substring(6); // Remove '#edit-' prefix
          setInitialEditId(appointmentId);
        }
      };

      // Check hash on initial load
      handleHashChange();

      // Listen for hash changes
      window.addEventListener('hashchange', handleHashChange);

      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }, []);

    // Open edit modal when initialEditId is set and appointments are loaded
    useEffect(() => {
      if (initialEditId && appointments.length > 0) {
        const appointmentToEdit = appointments.find(apt => apt._id === initialEditId);
        if (appointmentToEdit) {
          setSelectedAppointment(appointmentToEdit);
          setEditModalOpen(true);
          // Clear the initial edit ID to prevent reopening
          setInitialEditId(null);
        }
      }
    }, [initialEditId, appointments]);

    // Add custom scrollbar styles and ensure horizontal scrolling works
    useEffect(() => {
      const style = document.createElement("style");
      style.id = "appointment-table-scroll-styles";
      style.textContent = `
        /* Custom scrollbar for webkit browsers */
        [style*="overflow-x: auto"]::-webkit-scrollbar,
        .overflow-x-auto::-webkit-scrollbar {
          height: 12px;
          display: block !important;
        }
        [style*="overflow-x: auto"]::-webkit-scrollbar-track,
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 6px;
        }
        [style*="overflow-x: auto"]::-webkit-scrollbar-thumb,
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        [style*="overflow-x: auto"]::-webkit-scrollbar-thumb:hover,
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        /* Firefox scrollbar */
        [style*="overflow-x: auto"],
        .overflow-x-auto {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }
        @media (max-width: 640px) {
          [style*="overflow-x: auto"]::-webkit-scrollbar,
          .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
          }
        }
        /* Force horizontal scroll to work */
        .appointment-table-wrapper {
          overflow-x: auto !important;
          overflow-y: auto !important;
          height: 400px !important;
          max-height: 400px !important;
          -webkit-overflow-scrolling: touch !important;
          width: 100% !important;
          display: block !important;
        }
        /* Ensure main content allows horizontal overflow */
        main[role="main"] {
          overflow-x: visible !important;
          overflow-y: auto !important;
        }
        /* Override any parent constraints */
        .appointment-table-wrapper table {
          min-width: 100% !important;
          width: max-content !important;
        }
        /* Toast animation */
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `;
      
      // Remove existing style if present
      const existingStyle = document.getElementById("appointment-table-scroll-styles");
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
      
      document.head.appendChild(style);
      return () => {
        const styleToRemove = document.getElementById("appointment-table-scroll-styles");
        if (styleToRemove) {
          document.head.removeChild(styleToRemove);
        }
      };
    }, []);

    const getAuthHeaders = useCallback((): Record<string, string> => {
      if (typeof window === "undefined") return {};
      let token = null;
      if (routeContext === "agent") {
        // Prefer explicit agent tokens; fall back to user tokens
        token =
          localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken") ||
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken");
      } else {
        token =
          localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken") ||
          localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken") ||
          localStorage.getItem("adminToken") ||
          sessionStorage.getItem("adminToken") ||
          localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken") ||
          localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken") ||
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken");
      }
      if (!token) return {};
      return { Authorization: `Bearer ${token}` };
    }, [routeContext]);

    const getUserRole = useCallback((): string | null => {
      const headers = getAuthHeaders();
      const token = headers.Authorization?.replace("Bearer ", "");
      if (!token) return null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.role || null;
      } catch {
        return null;
      }
    }, [getAuthHeaders]);

    // Fetch permissions - clinic/doctor fetch from admin-level permissions; agent/doctorStaff use agent permissions
    useEffect(() => {
      const fetchPermissions = async () => {
        let isMounted = true;
        const role = getUserRole();
        const headers = getAuthHeaders();
        const token = headers.Authorization?.replace("Bearer ", "");

        // ✅ For admin role, grant full access (bypass permission checks)
        if (role === "admin") {
          if (!isMounted) return;
          setPermissions({ canRead: true, canUpdate: true, canCreate: true, canDelete: true });
          setPermissionsLoaded(true);
          return;
        }

        // ✅ For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
        if (role === "clinic" || role === "doctor") {
          const fetchClinicPermissions = async () => {
            try {
              if (!token) {
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
                headers: { Authorization: `Bearer ${token}` },
              });

              if (!isMounted) return;

              if (res.data.success) {
                // Check if permissions array exists and is not null
                // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
                if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
                  // No admin restrictions set yet - default to full access for backward compatibility
                  setPermissions({
                    canRead: true,
                    canCreate: true,
                    canUpdate: true,
                    canDelete: true,
                  });
                } else {
                  // Admin has set permissions - check the clinic_ScheduledAppointment module
                  const modulePermission = res.data.permissions.find((p: any) => {
                    if (!p?.module) return false;
                    // Only check for clinic_ScheduledAppointment module (clinic/all-appointment page)
                    if (p.module === "clinic_ScheduledAppointment") return true;
                    if (p.module === "clinic_scheduled_appointment") return true;
                    if (p.module === "scheduled_appointment") return true;
                    if (p.module === "ScheduledAppointment") return true;
                    return false;
                  });

                  if (modulePermission) {
                    const actions = modulePermission.actions || {};
                    
                    // Check if "all" is true, which grants all permissions
                    const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
                    const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
                    const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
                    const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
                    const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

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
            } catch (err: any) {
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

        // For agent/doctorStaff roles, use agent permissions API
        if (!["agent", "doctorStaff"].includes(role || "")) {
          if (!isMounted) return;
          setPermissions({ canRead: false, canUpdate: false, canCreate: false, canDelete: false });
          setPermissionsLoaded(true);
          return;
        }

        try {
          const res = await axios.get(
            "/api/agent/get-module-permissions?moduleKey=clinic_ScheduledAppointment",
            { headers }
          );
          if (res.data?.success && res.data.permissions) {
            const actions = res.data.permissions.actions || {};
            const canAll =
              actions.all === true ||
              actions.all === "true" ||
              String(actions.all).toLowerCase() === "true";
            if (!isMounted) return;
            setPermissions({
              canRead: canAll || actions.read === true,
              canUpdate: canAll || actions.update === true,
              canCreate: canAll || actions.create === true,
              canDelete: canAll || actions.delete === true,
            });
          } else {
            if (!isMounted) return;
            setPermissions({ canRead: false, canUpdate: false, canCreate: false, canDelete: false });
          }
        } catch (err) {
          console.error("Error fetching permissions:", err);
          if (!isMounted) return;
          setPermissions({ canRead: false, canUpdate: false, canCreate: false, canDelete: false });
        } finally {
          if (isMounted) {
          setPermissionsLoaded(true);
        }
        }

        return () => { isMounted = false; };
      };

      fetchPermissions();
    }, [getAuthHeaders, getUserRole]);

    // Fetch doctors and rooms for filter dropdowns
    const fetchFilterData = useCallback(async () => {
      if (!permissionsLoaded) return;
      if (!permissions.canRead) {
        return;
      }
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const response = await axios.get("/api/clinic/appointment-data", { headers });
        if (response.data.success) {
          setDoctors(response.data.doctorStaff || []);
          setRooms(response.data.rooms || []);
        }
      } catch (err) {
        console.error("Failed to fetch filter data:", err);
      }
    }, [getAuthHeaders, permissionsLoaded, permissions.canRead]);

    // Fetch appointments with filters
    const fetchAppointments = useCallback(async () => {
      if (!permissionsLoaded) return;
      if (!permissions.canRead) {
        setAppointments([]);
        setTotal(0);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) {
          setLoading(false);
          return;
        }
        const params: any = { page, limit: 10 };
        
        // Add filters to params
        if (filters.search) params.search = filters.search;
        if (filters.emrNumber) params.emrNumber = filters.emrNumber;
        if (filters.fromDate) params.fromDate = filters.fromDate;
        if (filters.toDate) params.toDate = filters.toDate;
        if (filters.doctorId) params.doctorId = filters.doctorId;
        if (filters.roomId) params.roomId = filters.roomId;
        if (filters.status) params.status = filters.status;
        if (filters.followType) params.followType = filters.followType;
        if (filters.referral) params.referral = filters.referral;
        if (filters.emergency) params.emergency = filters.emergency;

        const response = await axios.get("/api/clinic/all-appointments", {
          headers,
          params,
        });

        if (response.data.success) {
          const newAppointments = response.data.appointments || [];
          setAppointments(newAppointments);
          
          // Update selectedAppointment if it matches any in the new list
          if (selectedAppointment) {
            const updated = newAppointments.find((a: Appointment) => a._id === selectedAppointment._id);
            if (updated) setSelectedAppointment(updated);
          }
          
          // Update complaintAppointment if it matches any in the new list
          if (complaintAppointment) {
            const updated = newAppointments.find((a: Appointment) => a._id === complaintAppointment._id);
            if (updated) setComplaintAppointment(updated);
          }

          setTotal(response.data.total || 0);
          setTotalPages(response.data.totalPages || 1);
        } else {
          setError(response.data.message || "Failed to fetch appointments");
        }
      } catch (err: any) {
        console.error("Error fetching appointments:", err);
        setError(err.response?.data?.message || "Failed to fetch appointments");
      } finally {
        setLoading(false);
      }
    }, [filters, page, getAuthHeaders, permissionsLoaded, permissions.canRead]);

    useEffect(() => {
      fetchFilterData();
    }, [fetchFilterData, permissionsLoaded, permissions.canRead]);

    useEffect(() => {
      fetchAppointments();
    }, [fetchAppointments, permissionsLoaded, permissions.canRead]);

    // Close action menu when clicking outside - handled by backdrop div

    // Handle filter input changes (updates pending filters only)
    const handleFilterChange = (key: keyof FilterState, value: string) => {
      setPendingFilters((prev) => ({ ...prev, [key]: value }));
    };

    // Apply filters - copies pending filters to applied filters and triggers API call
    const applyFilters = () => {
      setFilters(pendingFilters);
      setPage(1); // Reset to first page when filters are applied
    };

    // Handle Enter key in search input
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        applyFilters();
      }
    };

    const clearFilters = () => {
      const emptyFilters = {
        search: "",
        emrNumber: "",
        fromDate: "",
        toDate: "",
        doctorId: "",
        roomId: "",
        status: "",
        followType: "",
        referral: "",
        emergency: "",
      };
      setPendingFilters(emptyFilters);
      setFilters(emptyFilters);
      setPage(1);
    };

    const getStatusBadgeColor = (status: string) => {
      const statusLower = status.toLowerCase();
      if (statusLower === "discharged") return "bg-gray-100 text-teal-800";
      if (statusLower === "invoiced") return "bg-purple-100 text-purple-800";
      if (statusLower === "booked") return "bg-green-100 text-green-800";
      if (statusLower === "enquiry") return "bg-yellow-100 text-yellow-800";
      if (statusLower === "cancelled") return "bg-red-100 text-red-800";
      if (statusLower === "arrived") return "bg-indigo-100 text-indigo-800";
      if (statusLower === "consultation") return "bg-gray-100 text-teal-800";
      return "bg-gray-100 text-teal-800";
    };

    const getGenderIcon = (gender: string) => {
      if (gender?.toLowerCase() === "male") return "♂";
      if (gender?.toLowerCase() === "female") return "♀";
      return "";
    };

    const handleDeleteClick = (apt: Appointment) => {
      setAppointmentToDelete(apt);
      setDeleteConfirmOpen(true);
      setOpenActionMenu(null);
    };

    const handleDeleteConfirm = async () => {
      if (!appointmentToDelete) return;

      setDeleting(true);
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) {
          setError("Unauthorized. Please log in again.");
          setDeleteConfirmOpen(false);
          setAppointmentToDelete(null);
          setDeleting(false);
          return;
        }

        const response = await axios.delete(
          `/api/clinic/delete-appointment/${appointmentToDelete._id}`,
          { headers }
        );

        if (response.data.success) {
          // Remove appointment from list
          setAppointments((prev) =>
            prev.filter((apt) => apt._id !== appointmentToDelete._id)
          );
          setTotal((prev) => Math.max(0, prev - 1));
          setDeleteConfirmOpen(false);
          setAppointmentToDelete(null);
          setToast({ message: "Appointment deleted successfully", type: 'success' });
          setTimeout(() => setToast(null), 3000);
        } else {
          setToast({ message: response.data.message || "Failed to delete appointment", type: 'error' });
          setTimeout(() => setToast(null), 3000);
          setDeleteConfirmOpen(false);
          setAppointmentToDelete(null);
        }
      } catch (err: any) {
        console.error("Error deleting appointment:", err);
        setToast({ message: err.response?.data?.message || "Failed to delete appointment", type: 'error' });
        setTimeout(() => setToast(null), 3000);
        setDeleteConfirmOpen(false);
        setAppointmentToDelete(null);
      } finally {
        setDeleting(false);
      }
    };

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === "-") return "-";
      return dateStr;
    };

    return (
      <>
        {/* Toast Notification */}
        {toast ? (
          <div className="fixed top-4 right-4 z-[300] animate-slide-in">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="font-medium text-sm">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="bg-gray-50" style={{ width: '100%', padding: '0', margin: '0' }}>
          <div className="p-1 sm:p-2 md:p-3" style={{ width: '100%', minWidth: '100%' }}>
            <div className="w-full" style={{ width: '100%', overflowX: 'visible' }}>
              {/* Header - Matching clinic dashboard theme */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2 sm:mb-3">
                <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div>
                      <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900">All Appointments</h1>
                      <p className="text-[10px] sm:text-xs md:text-sm text-teal-700 mt-0.5 hidden sm:block">View and manage all appointment records</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <button
                        onClick={exportAppointmentsToCSV}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-[10px] sm:text-xs md:text-sm font-medium"
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Export</span>
                      </button> */}
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-[10px] sm:text-xs md:text-sm font-medium"
                      >
                        <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">{showFilters ? "Hide Filters" : "Show Filters"}</span>
                        <span className="xs:hidden">{showFilters ? "Hide" : "Filters"}</span>
                      </button>
                    </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                      <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search by patient name, mobile, visit ID..."
                  value={pendingFilters.search}
                  onChange={(e) => {
                    handleFilterChange("search", e.target.value);
                  }}
                  onKeyDown={handleSearchKeyDown}
                        className="w-full pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 md:pr-4 py-1.5 sm:py-2 text-[11px] sm:text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-900 focus:border-gray-900 outline-none text-teal-900"
                />
                    </div>
                  </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-2 sm:mb-3">
                  <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3">
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {/* EMR Number */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        EMR Number
                      </label>
                      <input
                        type="text"
                        value={pendingFilters.emrNumber}
                        onChange={(e) => handleFilterChange("emrNumber", e.target.value)}
                        placeholder="EMR #"
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      />
                    </div>

                    {/* From Date */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={pendingFilters.fromDate}
                        onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={pendingFilters.toDate}
                        onChange={(e) => handleFilterChange("toDate", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      />
                    </div>

                    {/* Doctor */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        Doctor
                      </label>
                      <select
                        value={pendingFilters.doctorId}
                        onChange={(e) => handleFilterChange("doctorId", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      >
                        <option value="">All</option>
                        {doctors.map((doc) => (
                          <option key={doc._id} value={doc._id}>
                            {doc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Room */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        Room
                      </label>
                      <select
                        value={pendingFilters.roomId}
                        onChange={(e) => handleFilterChange("roomId", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      >
                        <option value="">All</option>
                        {rooms.map((room) => (
                          <option key={room._id} value={room._id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        Status
                      </label>
                      <select
                        value={pendingFilters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      >
                        <option value="">All</option>
                        {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Follow Type */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        Follow Type
                      </label>
                      <select
                        value={pendingFilters.followType}
                        onChange={(e) => handleFilterChange("followType", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      >
                        <option value="">All</option>
                        <option value="first time">First Time</option>
                        <option value="follow up">Follow Up</option>
                        <option value="repeat">Repeat</option>
                      </select>
                    </div>

                    {/* Referral */}
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-teal-800 mb-1 uppercase tracking-wide">
                        Source
                      </label>
                      <select
                        value={pendingFilters.referral}
                        onChange={(e) => handleFilterChange("referral", e.target.value)}
                            className="w-full px-2 py-1.5 text-[10px] sm:text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-teal-900 bg-white"
                      >
                        <option value="">All</option>
                        <option value="direct">Direct</option>
                        <option value="referral">Referral</option>
                      </select>
                    </div>
                  </div>

                  {/* Apply and Clear Filters Buttons */}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={clearFilters}
                          className="px-3 py-1.5 text-[10px] sm:text-xs text-teal-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition font-medium"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={applyFilters}
                      className="px-3 py-1.5 text-[10px] sm:text-xs text-white bg-teal-600 border border-teal-600 rounded-md hover:bg-teal-700 transition font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
            </div>
                </div>
              )}

            {/* Results Count */}
              <div className="mb-2 sm:mb-3 text-[10px] sm:text-xs md:text-sm text-teal-700">
              Showing {appointments.length} of {total} appointments
            </div>

            {/* Table */}
            {!permissionsLoaded ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                  <p className="text-sm text-teal-700">Loading permissions...</p>
                </div>
            ) : !permissions.canRead ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
                    <p className="text-sm text-teal-700 mb-4">
                      You do not have permission to view scheduled appointments.
                    </p>
                    <p className="text-xs text-teal-600">
                      Please contact your administrator to request access to the Scheduled Appointment module.
                    </p>
                  </div>
                </div>
            ) : loading ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                  <p className="text-sm text-teal-700">Loading appointments...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            ) : appointments.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <p className="text-sm text-teal-700">No appointments found</p>
              </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                
                {/* Horizontal Scroll Indicator */}
                <div className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-50 border-b border-gray-200 text-[10px] sm:text-xs text-teal-700 flex items-center justify-center gap-1 sm:gap-2">
                  <span className="hidden md:inline">← Scroll horizontally to view all columns →</span>
                  <span className="hidden sm:inline md:hidden">← Scroll to view all →</span>
                  <span className="sm:hidden">← Swipe →</span>
                </div>
                
                {/* Scrollable Table Container - Fixed height to ensure scrollbar is at page bottom */}
                <div 
                  className="appointment-table-wrapper flex-grow"
                  style={{ 
                    overflowX: 'auto',
                    overflowY: 'auto',
                    height: '400px',  /* Fixed height to ensure scrollbar is always at the same position */
                    maxHeight: '400px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#888 #f1f1f1',
                    width: '100%',
                    display: 'block',
                    position: 'relative',
                    maxWidth: '100%'
                  }}
                >
                  <table 
                    className="min-w-full divide-y divide-teal-200" 
                    style={{ 
                      minWidth: '1400px',
                      tableLayout: 'auto',
                      display: 'table'
                    }}
                  >
                      <thead className="bg-teal-600 text-white">
                        <tr>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[30px]">
                            <input
                              type="checkbox"
                              checked={selectedRows.size === appointments.length && appointments.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRows(new Set(appointments.map((apt) => apt._id)));
                                } else {
                                  setSelectedRows(new Set());
                                }
                              }}
                              className="rounded w-3 h-3"
                            />
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[40px]">
                            Photo
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[70px]">
                            Visit ID
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[140px]">
                            Date & Time
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[180px]">
                            Patient Details
                          </th>
                          {getUserRole() !== "doctorStaff" && (
                            <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[140px]">
                              Doctor Details
                            </th>
                          )}
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[120px]">
                            Treatments
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[90px]">
                            Room
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[100px]">
                            Remarks
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[50px]">
                            EMR
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[80px]">
                            Status
                          </th>
                          <th className="px-1 py-1.5 text-left text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap w-[60px]">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-teal-200">
                        {appointments.map((apt) => (
                          <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(apt._id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedRows);
                                if (e.target.checked) {
                                  newSelected.add(apt._id);
                                } else {
                                  newSelected.delete(apt._id);
                                }
                                setSelectedRows(newSelected);
                              }}
                              className="rounded"
                            />
                          </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="w-4 h-4 sm:w-6 sm:h-6 text-teal-700" />
                              </div>
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-teal-800 rounded-full text-[10px] sm:text-xs font-semibold">
                                {apt.visitId}
                              </span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-[8px] sm:text-[9px]">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-teal-700">Reg: </span>
                                <span className="font-medium text-teal-900">{formatDate(apt.registeredDate)}</span>
                                {apt.registeredTime && (
                                  <span className="text-red-600 ml-0.5 text-[7px]">{apt.registeredTime}</span>
                                )}
                              </div>
                              <div>
                                <span className="text-teal-700">Inv: </span>
                                <span className="font-medium text-teal-900">{formatDate(apt.invoicedDate)}</span>
                                {apt.invoicedTime && <span className="text-teal-700 ml-0.5 text-[7px]">{apt.invoicedTime}</span>}
                              </div>
                            </div>
                          </td>
                            <td className="px-1 py-1.5 text-[8px] sm:text-[9px]">
                              <div className="space-y-0.5">
                                <div 
                                  className="font-semibold text-teal-900 cursor-pointer hover:text-teal-700 hover:underline transition-colors"
                                  onClick={() => {
                                    if (permissions.canUpdate) {
                                      appointmentRef.current = apt;
                                      setSelectedAppointment(apt);
                                      setEditModalOpen(true);
                                    }
                                  }}
                                >
                                  {apt.patientName}
                                </div>
                                <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap">
                                  <span className="px-0.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[7px] sm:text-[8px]">
                                    ID: {apt.patientId.slice(-4) || "N/A"}
                                  </span>
                                  <span className="text-teal-700 text-[7px] sm:text-[8px]">{apt.patientNumber}</span>
                                  {apt.gender && (
                                    <span className="px-0.5 py-0.5 bg-gray-100 text-teal-800 rounded text-[7px] sm:text-[8px] flex items-center gap-0.5">
                                      {getGenderIcon(apt.gender)} {apt.gender}
                                    </span>
                                  )}
                                  {apt.emrNumber && (
                                    <span className="px-0.5 py-0.5 bg-gray-100 text-teal-800 rounded text-[7px] sm:text-[8px]">
                                      DOB: {apt.emrNumber}
                                    </span>
                                  )}
                                  <button className="px-0.5 py-0.5 bg-red-100 text-red-800 rounded text-[7px] sm:text-[8px] hover:bg-red-200 transition">
                                    Direct →
                                  </button>
                                </div>
                              </div>
                            </td>
                            {getUserRole() !== "doctorStaff" && (
                              <td className="px-1 py-1.5 text-[8px] sm:text-[9px]">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-0.5">
                                    <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                                    <span className="font-medium text-teal-900">{apt.doctorName}</span>
                                  </div>
                                  <div className="text-teal-700 text-[7px] sm:text-[8px] truncate">{apt.doctorEmail}</div>
                                </div>
                              </td>
                            )}
                            <td className="px-1 py-1.5 text-[8px] sm:text-[9px] text-teal-900 max-w-[120px]">
                              <div className="truncate" title={apt.serviceNames?.join(", ") || apt.serviceName || "-"}>
                                {apt.serviceNames && apt.serviceNames.length > 0 
                                  ? apt.serviceNames.join(", ") 
                                  : apt.serviceName || "-"}
                              </div>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-[8px] sm:text-[9px] text-teal-900 truncate max-w-[90px]">
                              {apt.roomName || "-"}
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap text-[8px] sm:text-[9px] max-w-[100px] truncate text-teal-900">
                              {apt.notes || "No Remarks"}
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                            {permissions.canCreate && apt.status?.toLowerCase() === "arrived" ? (
                                <button
                                  type="button"
                                  className="w-7 h-7 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition"
                                  title="Patient Complaint"
                                  onClick={() => {
                                    setComplaintAppointment(apt);
                                    setComplaintModalOpen(true);
                                  }}
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              ) : apt.emrNumber ? (
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 text-xs">✓</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                                  <span className="text-yellow-600 text-xs">1</span>
                                </div>
                              )}
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap">
                              <span
                                className={`px-1 py-0.5 rounded-full text-[8px] sm:text-[9px] font-semibold ${getStatusBadgeColor(
                                  apt.status
                                )}`}
                              >
                                {apt.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-1 py-1.5 whitespace-nowrap relative">
                            <div className="relative">
                              {(permissions.canUpdate || permissions.canDelete || permissions.canCreate) && (
                                <button
                                  onClick={(e) => {
                                    const buttonRect = e.currentTarget.getBoundingClientRect();
                                    const viewportHeight = window.innerHeight;
                                    const viewportWidth = window.innerWidth;
                                    const spaceBelow = viewportHeight - buttonRect.bottom;
                                    const spaceAbove = buttonRect.top;
                                    const menuHeight = 280; // Approximate menu height
                                    const menuWidth = 192; // w-48 = 192px
                                    
                                    // Calculate horizontal position (align to right of button)
                                  let left = buttonRect.right - menuWidth;
                                  // If menu would go off screen to the left, align to button's left
                                  if (left < 8) {
                                    left = buttonRect.left;
                                  }
                                  // If menu would go off screen to the right, adjust
                                  if (left + menuWidth > viewportWidth - 8) {
                                    left = viewportWidth - menuWidth - 8;
                                  }
                                  
                                  // Calculate vertical position
                                  if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
                                    // Show above
                                    menuPositionRefs.current[apt._id] = { 
                                      bottom: viewportHeight - buttonRect.top + 4,
                                      left: left
                                    };
                                  } else {
                                    // Show below
                                    menuPositionRefs.current[apt._id] = { 
                                      top: buttonRect.bottom + 4,
                                      left: left
                                    };
                                  }
                                  setOpenActionMenu(openActionMenu === apt._id ? null : apt._id);
                                  }}
                                  className="p-0.5 hover:bg-gray-200 rounded transition"
                                >
                                  <MoreVertical className="w-3.5 h-3.5 text-teal-700" />
                                </button>
                              )}
                              
                              {/* Dropdown Menu */}
                              {(permissions.canUpdate || permissions.canDelete || permissions.canCreate) && openActionMenu === apt._id && (
                                <>
                                  {/* Backdrop to close menu when clicking outside */}
                                  <div
                                    className="fixed inset-0 z-40"
                                    onMouseDown={(e) => {
                                      if (e.target === e.currentTarget) {
                                        setOpenActionMenu(null);
                                      }
                                    }}
                                  ></div>
                                  
                                  {/* Dropdown Content - Fixed positioning to prevent scrolling issues */}
                                  <div 
                                    className="fixed w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                                    style={{
                                      top: menuPositionRefs.current[apt._id]?.top,
                                      bottom: menuPositionRefs.current[apt._id]?.bottom,
                                      left: menuPositionRefs.current[apt._id]?.left,
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <div className="py-1">
                                      {permissions.canUpdate && (
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            appointmentRef.current = apt;
                                            setOpenActionMenu(null);
                                            setSelectedAppointment(apt);
                                            setEditModalOpen(true);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-teal-700 hover:bg-gray-100 flex items-center gap-2 transition cursor-pointer"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Edit
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setOpenActionMenu(null);
                                          setSelectedPatientId(apt.patientId);
                                          setSelectedPatientName(apt.patientName);
                                          setHistoryModalOpen(true);
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-teal-700 hover:bg-gray-100 flex items-center gap-2 transition cursor-pointer"
                                      >
                                        <History className="w-4 h-4" />
                                        Appointment History
                                      </button>
                                      {permissions.canCreate && apt.status?.toLowerCase() === "arrived" && (
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenActionMenu(null);
                                            setReportAppointment(apt);
                                            setReportModalOpen(true);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-teal-700 hover:bg-gray-100 flex items-center gap-2 transition cursor-pointer"
                                        >
                                          <FileText className="w-4 h-4" />
                                          Report
                                        </button>
                                      )}
                                      {permissions.canCreate && (apt.status?.toLowerCase() === "arrived" || apt.status?.toLowerCase() === "invoiced") && (
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpenActionMenu(null);
                                            setSelectedAppointment(apt);
                                            setBillingModalOpen(true);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-teal-700 hover:bg-gray-100 flex items-center gap-2 transition cursor-pointer"
                                        >
                                          <Receipt className="w-4 h-4" />
                                          Billing
                                        </button>
                                      )}
                                      {permissions.canDelete && (
                                        <button
                                          type="button"
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteClick(apt);
                                          }}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-gray-50  border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
                    <div className="text-[10px] sm:text-xs md:text-sm text-teal-700">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Edit Appointment Modal */}
        <EditAppointmentModal
          isOpen={editModalOpen && (selectedAppointment !== null || appointmentRef.current !== null)}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedAppointment(null);
            appointmentRef.current = null;
          }}
          onSuccess={() => {
            fetchAppointments();
            setEditModalOpen(false);
            setSelectedAppointment(null);
            appointmentRef.current = null;
          }}
          appointment={selectedAppointment || appointmentRef.current}
          rooms={rooms}
          doctors={doctors}
          getAuthHeaders={getAuthHeaders}
        />

        {/* Appointment History Modal */}
        <AppointmentHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedPatientId("");
            setSelectedPatientName("");
          }}
          patientId={selectedPatientId}
          patientName={selectedPatientName}
          getAuthHeaders={getAuthHeaders}
        />

        <AppointmentReportModal
          isOpen={reportModalOpen}
          appointment={reportAppointment}
          onClose={() => {
            setReportModalOpen(false);
            setReportAppointment(null);
          }}
          getAuthHeaders={getAuthHeaders}
          onSuccess={() => {
            fetchAppointments();
          }}
        />

        <AppointmentComplaintModal
          key={complaintAppointment?._id || 'no-appointment'}
          isOpen={complaintModalOpen}
          appointment={complaintAppointment}
          onClose={() => {
            setComplaintModalOpen(false);
            setComplaintAppointment(null);
          }}
          getAuthHeaders={getAuthHeaders}
          onSuccess={() => {
            fetchAppointments();
          }}
        />

        <AppointmentBillingModal
          isOpen={billingModalOpen}
          appointment={selectedAppointment}
          onClose={() => {
            setBillingModalOpen(false);
            setSelectedAppointment(null);
          }}
          getAuthHeaders={getAuthHeaders}
          onSuccess={() => {
            fetchAppointments();
            setBillingModalOpen(false);
            setSelectedAppointment(null);
          }}
        />

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-teal-900 text-center mb-2">
                  Delete Appointment
                </h2>
                <p className="text-teal-700 text-center mb-6">
                  Are you sure you want to delete this appointment?
                </p>
                {appointmentToDelete && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-teal-700 mb-1">
                      <span className="font-semibold">Patient:</span> {appointmentToDelete.patientName}
                    </p>
                    <p className="text-sm text-teal-700 mb-1">
                      <span className="font-semibold">Visit ID:</span> {appointmentToDelete.visitId}
                    </p>
                    <p className="text-sm text-teal-700">
                      <span className="font-semibold">Date:</span> {formatDate(appointmentToDelete.startDate)} {appointmentToDelete.fromTime}
                    </p>
                  </div>
                )}
                <p className="text-sm text-red-600 font-medium text-center mb-6">
                  This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setAppointmentToDelete(null);
                    }}
                    disabled={deleting}
                    className="px-4 py-2 text-teal-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  AllAppointmentsPage.getLayout = function PageLayout(page: React.ReactElement) {
    // Wrap page in ClinicLayout for persistent layout
    // When getLayout is used, Next.js keeps the layout mounted and only swaps page content
    // This prevents sidebar and header from re-rendering on navigation
    // For clinic routes, sidebar and header will be visible and persistent
    // For agent routes, the component can handle hiding via contextOverride if needed
    return (
      <ClinicLayout hideSidebar={false} hideHeader={false}>
        {page}
      </ClinicLayout>
    );
  };
  export const ClinicAllAppointmentsPageBase = AllAppointmentsPage;

  const ProtectedAppointmentsPage = withClinicAuth(AllAppointmentsPage) as NextPageWithLayout;
  ProtectedAppointmentsPage.getLayout = AllAppointmentsPage.getLayout;

  export default ProtectedAppointmentsPage;

