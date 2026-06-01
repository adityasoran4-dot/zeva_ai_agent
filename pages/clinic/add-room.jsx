"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import withClinicAuth from "../../components/withClinicAuth";
import ClinicLayout from "../../components/ClinicLayout";
import { Loader2, Trash2, AlertCircle, CheckCircle, X, Building2, DoorOpen, Plus, Edit2, Calendar } from "lucide-react";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import { Toaster, toast } from "react-hot-toast";

const MODULE_KEY = "clinic_addRoom";
const SUBMODULE_NAME = "Add Room";

const TOKEN_PRIORITY = [
  "clinicToken",
  "agentToken",
  "doctorToken",
  "userToken",
  "staffToken",
  "adminToken",
];

function getStoredToken() {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    try {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value) return value;
    } catch (error) {
      // Ignore storage access errors (Safari private mode, etc.)
    }
  }
  return null;
}

function getAuthHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

function getUserRole() {
  if (typeof window === 'undefined') return null;
  try {
    for (const key of TOKEN_PRIORITY) {
      const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.role || null;
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    console.error('Error getting user role:', error);
  }
  return null;
}

const MessageBanner = ({ type, text }) => {
  if (!text) return null;

  const styles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    error: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-sky-50 text-sky-800 border-sky-200",
  };

  const Icon = type === "error" ? AlertCircle : CheckCircle;

  return (
    <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border ${styles[type]}`} role="alert">
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      <p className="text-xs sm:text-sm font-medium">{text}</p>
    </div>
  );
};

function AddRoomPage({ contextOverride = null }) {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingDept, setSubmittingDept] = useState(false);
  const [message, setMessage] = useState({
    type: "info",
    text: "",
  });
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);
  const [token, setToken] = useState("");
  const [hasAgentToken, setHasAgentToken] = useState(contextOverride === "agent");
  const [isAgentRoute, setIsAgentRoute] = useState(contextOverride === "agent");
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editingRoomName, setEditingRoomName] = useState("");
  const [roomUpdateLoading, setRoomUpdateLoading] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingDeptName, setEditingDeptName] = useState("");
  const [deptUpdateLoading, setDeptUpdateLoading] = useState(false);
  const [viewMode, setViewMode] = useState("room");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "room",
  });
  const hasLoadedInitialData = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const storedToken = getStoredToken();
      setToken(storedToken || "");
      const hasAgent =
        Boolean(localStorage.getItem("agentToken")) ||
        Boolean(sessionStorage.getItem("agentToken"));
      setHasAgentToken(contextOverride === "agent" ? true : hasAgent);
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, [contextOverride]);

  useEffect(() => {
    if (contextOverride) {
      setIsAgentRoute(contextOverride === "agent");
      return;
    }
    if (typeof window === "undefined") return;
    const agentPath =
      router?.pathname?.startsWith("/agent/") ||
      window.location.pathname?.startsWith("/agent/");
    setIsAgentRoute(Boolean(agentPath && hasAgentToken));
  }, [contextOverride, router.pathname, hasAgentToken]);

  // Check if we're in clinic context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setIsClinicContext(path.startsWith("/clinic/"));
    } else if (router?.pathname) {
      setIsClinicContext(router.pathname.startsWith("/clinic/"));
    }
  }, [router?.pathname]);

  const { permissions: agentPermissions, loading: agentPermissionsLoading } = useAgentPermissions(
    isAgentRoute ? MODULE_KEY : null
  );

  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;
    setPermissions({
      canCreate: agentPermissions.canAll ? true : (agentPermissions.canCreate === true),
      canRead: agentPermissions.canAll ? true : (agentPermissions.canRead === true),
      canUpdate: agentPermissions.canAll ? true : (agentPermissions.canUpdate === true),
      canDelete: agentPermissions.canAll ? true : (agentPermissions.canDelete === true),
    });
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  useEffect(() => {
    if (isAgentRoute) return;
    if (!isClinicContext) {
      setPermissionsLoaded(true);
      return;
    }
    let cancelled = false;
    
    const fetchPermissions = async () => {
      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
          setPermissionsLoaded(true);
          return;
        }

        const userRole = getUserRole();
        
        if (userRole === 'clinic' || userRole === 'doctor') {
          try {
            const res = await axios.get('/api/clinic/sidebar-permissions', {
              headers: authHeaders,
            });
            
            if (cancelled) return;
            
            if (res.data.success) {
              if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
                setPermissions({
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                });
              } else {
                const modulePermission = res.data.permissions.find((p) => {
                  if (!p?.module) return false;
                  if (p.module === 'clinic_addRoom') return true;
                  if (p.module === 'addRoom') return true;
                  if (p.module === 'add_room') return true;
                  if (p.module?.endsWith('addRoom')) return true;
                  if (p.module?.endsWith('add_room')) return true;
                  return false;
                });

                if (modulePermission) {
                  const actions = modulePermission.actions || {};
                  
                  const moduleAll = actions.all === true || actions.all === 'true' || String(actions.all).toLowerCase() === 'true';
                  const moduleCreate = actions.create === true || actions.create === 'true' || String(actions.create).toLowerCase() === 'true';
                  const moduleRead = actions.read === true || actions.read === 'true' || String(actions.read).toLowerCase() === 'true';
                  const moduleUpdate = actions.update === true || actions.update === 'true' || String(actions.update).toLowerCase() === 'true';
                  const moduleDelete = actions.delete === true || actions.delete === 'true' || String(actions.delete).toLowerCase() === 'true';

                  setPermissions({
                    canCreate: moduleAll || moduleCreate,
                    canRead: moduleAll || moduleRead,
                    canUpdate: moduleAll || moduleUpdate,
                    canDelete: moduleAll || moduleDelete,
                  });
                } else {
                  setPermissions({
                    canCreate: false,
                    canRead: true,
                    canUpdate: false,
                    canDelete: false,
                  });
                }
              }
            } else {
              setPermissions({
                canCreate: true,
                canRead: true,
                canUpdate: true,
                canDelete: true,
              });
            }
          } catch (err) {
            console.error('Error fetching clinic sidebar permissions:', err);
            if (!cancelled) {
              setPermissions({
                canCreate: true,
                canRead: true,
                canUpdate: true,
                canDelete: true,
              });
            }
          }
          if (!cancelled) {
            setPermissionsLoaded(true);
          }
          return;
        }

        if (['agent', 'staff', 'doctorStaff'].includes(userRole || '')) {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
          setPermissionsLoaded(true);
          return;
        }

        setPermissions({
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        });
        setPermissionsLoaded(true);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        if (!cancelled) {
          setPermissions({
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
          });
        }
        if (!cancelled) {
          setPermissionsLoaded(true);
        }
      }
    };

    fetchPermissions();

    return () => {
      cancelled = true;
    };
  }, [isAgentRoute, isClinicContext, token]);

  const getHeadersOrNotify = () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setMessage({
        type: "error",
        text: "Authentication required. Please log in again.",
      });
    }
    return headers;
  };

  const loadRooms = async (showToast = true) => {
    const headers = getHeadersOrNotify();
    if (!headers) return;
    try {
      const res = await axios.get("/api/clinic/rooms", { headers });
      if (res.data.success) {
        setRooms(res.data.rooms || []);
        if (showToast) {
          toast.success(`Loaded ${res.data.rooms?.length || 0} room(s)`, { duration: 2000 });
        }
      } else {
        const errorMsg = res.data.message || "Failed to load rooms";
        setMessage({ type: "error", text: errorMsg });
        if (showToast) {
          toast.error(errorMsg, { duration: 3000 });
        }
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 || status === 401) {
        setRooms([]);
        return;
      }
      const errorMessage = error.response?.data?.message || "Failed to load rooms";
      if (showToast && status !== 403 && status !== 401) {
        toast.error(errorMessage, { duration: 3000 });
      }
      setMessage({ type: "error", text: errorMessage });
    }
  };

  const loadDepartments = async (showToast = true) => {
    const headers = getHeadersOrNotify();
    if (!headers) return;
    try {
      const res = await axios.get("/api/clinic/departments", { headers });
      if (res.data.success) {
        setDepartments(res.data.departments || []);
        if (showToast) {
          toast.success(`Loaded ${res.data.departments?.length || 0} department(s)`, { duration: 2000 });
        }
      } else {
        const errorMsg = res.data.message || "Failed to load departments";
        setMessage({ type: "error", text: errorMsg });
        if (showToast) {
          toast.error(errorMsg, { duration: 3000 });
        }
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 || status === 401) {
        setDepartments([]);
        return;
      }
      const errorMessage = error.response?.data?.message || "Failed to load departments";
      if (showToast && status !== 403 && status !== 401) {
        toast.error(errorMessage, { duration: 3000 });
      }
      setMessage({ type: "error", text: errorMessage });
    }
  };

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead && !permissions.canCreate) {
      setRooms([]);
      setDepartments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      toast.dismiss();
      try {
        await Promise.all([
          loadRooms(false),
          loadDepartments(false)
        ]);
        if (!cancelled) {
          if (!hasLoadedInitialData.current) {
            toast.success("Data loaded successfully", { duration: 2000 });
            hasLoadedInitialData.current = true;
          }
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          const status = error.response?.status;
          if (status !== 403 && status !== 401 && !hasLoadedInitialData.current) {
            toast.error("Failed to load some data", { duration: 3000 });
          }
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [permissionsLoaded, permissions.canRead, permissions.canCreate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!permissions.canCreate) {
      setMessage({ type: "error", text: "You do not have permission to create rooms" });
      return;
    }
    if (!roomName.trim()) {
      setMessage({ type: "error", text: "Please enter a room name" });
      return;
    }

    const headers = getHeadersOrNotify();
    if (!headers) return;
    setSubmitting(true);
    setMessage({ type: "info", text: "" });

    try {
      const res = await axios.post(
        "/api/clinic/rooms",
        { name: roomName.trim() },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Room created successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setRoomName("");
        await loadRooms(false);
      } else {
        const errorMsg = res.data.message || "Failed to create room";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      console.error("Error creating room", error);
      const errorMessage = error.response?.data?.message || "Failed to create room";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomUpdate = async () => {
    if (!editingRoomId) return;
    if (!permissions.canUpdate) {
      setMessage({ type: "error", text: "You do not have permission to update rooms" });
      return;
    }
    if (!editingRoomName.trim()) {
      setMessage({ type: "error", text: "Room name cannot be empty" });
      return;
    }

    const headers = getHeadersOrNotify();
    if (!headers) return;
    setRoomUpdateLoading(true);

    try {
      const res = await axios.put(
        "/api/clinic/rooms",
        { roomId: editingRoomId, name: editingRoomName.trim() },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Room updated successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setEditingRoomId(null);
        setEditingRoomName("");
        await loadRooms(false);
      } else {
        const errorMsg = res.data.message || "Failed to update room";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      console.error("Error updating room", error);
      const errorMessage = error.response?.data?.message || "Failed to update room";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setRoomUpdateLoading(false);
    }
  };

  const handleDelete = async (roomId) => {
    if (!permissions.canDelete) {
      const errorMsg = "You do not have permission to delete rooms";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg, { duration: 3000 });
      return;
    }
    const room = rooms.find((r) => r._id === roomId);
    setConfirmModal({
      isOpen: true,
      title: "Delete Room",
      message: `Are you sure you want to delete "${room?.name || "this room"}"? This action cannot be undone.`,
      onConfirm: async () => {
        const headers = getHeadersOrNotify();
        if (!headers) return;

        try {
          const res = await axios.delete(`/api/clinic/rooms?roomId=${roomId}`, { headers });
          if (res.data.success) {
            const successMsg = res.data.message || "Room deleted successfully";
            setMessage({ type: "success", text: successMsg });
            toast.success(successMsg, { duration: 3000 });
            if (editingRoomId === roomId) {
              setEditingRoomId(null);
              setEditingRoomName("");
            }
            await loadRooms(false);
          } else {
            const errorMsg = res.data.message || "Failed to delete room";
            setMessage({ type: "error", text: errorMsg });
            toast.error(errorMsg, { duration: 3000 });
          }
        } catch (error) {
          console.error("Error deleting room", error);
          const errorMessage = error.response?.data?.message || "Failed to delete room";
          setMessage({ type: "error", text: errorMessage });
          toast.error(errorMessage, { duration: 3000 });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      type: "room",
    });
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    if (!permissions.canCreate) {
      setMessage({ type: "error", text: "You do not have permission to create departments" });
      return;
    }
    if (!departmentName.trim()) {
      setMessage({ type: "error", text: "Please enter a department name" });
      return;
    }

    const headers = getHeadersOrNotify();
    if (!headers) return;
    setSubmittingDept(true);
    setMessage({ type: "info", text: "" });

    try {
      const res = await axios.post(
        "/api/clinic/departments",
        { name: departmentName.trim() },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Department created successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setDepartmentName("");
        await loadDepartments();
      } else {
        const errorMsg = res.data.message || "Failed to create department";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      console.error("Error creating department", error);
      const errorMessage = error.response?.data?.message || "Failed to create department";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setSubmittingDept(false);
    }
  };

  const handleDepartmentUpdate = async () => {
    if (!editingDeptId) return;
    if (!permissions.canUpdate) {
      setMessage({ type: "error", text: "You do not have permission to update departments" });
      return;
    }
    if (!editingDeptName.trim()) {
      setMessage({ type: "error", text: "Department name cannot be empty" });
      return;
    }
    const headers = getHeadersOrNotify();
    if (!headers) return;

    setDeptUpdateLoading(true);
    try {
      const res = await axios.put(
        "/api/clinic/departments",
        { departmentId: editingDeptId, name: editingDeptName.trim() },
        { headers }
      );
      if (res.data.success) {
        const successMsg = res.data.message || "Department updated successfully";
        setMessage({ type: "success", text: successMsg });
        toast.success(successMsg, { duration: 3000 });
        setEditingDeptId(null);
        setEditingDeptName("");
        await loadDepartments();
      } else {
        const errorMsg = res.data.message || "Failed to update department";
        setMessage({ type: "error", text: errorMsg });
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      console.error("Error updating department", error);
      const errorMessage = error.response?.data?.message || "Failed to update department";
      setMessage({ type: "error", text: errorMessage });
      toast.error(errorMessage, { duration: 3000 });
    } finally {
      setDeptUpdateLoading(false);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!permissions.canDelete) {
      const errorMsg = "You do not have permission to delete departments";
      setMessage({ type: "error", text: errorMsg });
      toast.error(errorMsg, { duration: 3000 });
      return;
    }
    const dept = departments.find((d) => d._id === departmentId);
    setConfirmModal({
      isOpen: true,
      title: "Delete Department",
      message: `Are you sure you want to delete "${dept?.name || "this department"}"? This action cannot be undone.`,
      onConfirm: async () => {
        const headers = getHeadersOrNotify();
        if (!headers) return;

        try {
          const res = await axios.delete(`/api/clinic/departments?departmentId=${departmentId}`, {
            headers,
          });
          if (res.data.success) {
            const successMsg = res.data.message || "Department deleted successfully";
            setMessage({ type: "success", text: successMsg });
            toast.success(successMsg, { duration: 3000 });
            if (editingDeptId === departmentId) {
              setEditingDeptId(null);
              setEditingDeptName("");
            }
            await loadDepartments();
          } else {
            const errorMsg = res.data.message || "Failed to delete department";
            setMessage({ type: "error", text: errorMsg });
            toast.error(errorMsg, { duration: 3000 });
          }
        } catch (error) {
          console.error("Error deleting department", error);
          const errorMessage = error.response?.data?.message || "Failed to delete department";
          setMessage({ type: "error", text: errorMessage });
          toast.error(errorMessage, { duration: 3000 });
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
      type: "department",
    });
  };

  const roomCreateDisabled = submitting || !permissions.canCreate;
  const deptCreateDisabled = submittingDept || !permissions.canCreate;

  return (
    <div className="min-h-screen bg-gray-50">
      <style dangerouslySetInnerHTML={{__html: `
        [data-hot-toast][data-type="error"] button[aria-label="Close"] {
          color: #fff !important;
          opacity: 0.9;
        }
        [data-hot-toast][data-type="error"] button[aria-label="Close"]:hover {
          opacity: 1;
          color: #fff !important;
        }
      `}} />
      <div className="p-3 sm:p-4 lg:p-5 space-y-3 lg:space-y-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            fontSize: "12px",
            padding: "8px 12px",
            borderRadius: "6px",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
            style: {
              background: "#10b981",
              color: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#fff",
              secondary: "#ef4444",
            },
            style: {
              background: "#ef4444",
              color: "#fff",
            },
          },
          warning: {
            iconTheme: {
              primary: "#f59e0b",
              secondary: "#fff",
            },
            style: {
              background: "#f59e0b",
              color: "#fff",
            },
          },
          info: {
            iconTheme: {
              primary: "#3b82f6",
              secondary: "#fff",
            },
            style: {
              background: "#3b82f6",
              color: "#fff",
            },
          },
        }}
      />
      {!permissionsLoaded ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-teal-700">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
          <p className="text-xs sm:text-sm">Checking your permissions...</p>
        </div>
      ) : !permissions.canRead && !permissions.canCreate ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
            <p className="text-sm text-teal-700 mb-4">
              You do not have permission to view or create rooms and departments.
            </p>
            <p className="text-xs text-teal-600">
              Please contact your administrator to request access to the Add Room module.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-700" />
                    <h1 className="text-xl sm:text-2xl font-bold text-teal-900">
                      Room & Department
                    </h1>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-teal-600">
                  Create and manage rooms, departments for your clinic
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-teal-200 rounded-lg p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("room");
                    setMessage({ type: "info", text: "" });
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-center ${
                    viewMode === "room"
                      ? "bg-white text-teal-900 shadow-sm"
                      : "text-teal-600 hover:text-teal-900"
                  }`}
                >
                  <DoorOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">Rooms</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("department");
                    setMessage({ type: "info", text: "" });
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-none justify-center ${
                    viewMode === "department"
                      ? "bg-white text-teal-900 shadow-sm"
                      : "text-teal-600 hover:text-teal-900"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">Departments</span>
                </button>
              </div>
            </div>
          </div>

          {permissions.canCreate && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-teal-700" />
              <h2 className="text-base sm:text-lg font-semibold text-teal-900">
                {viewMode === "room" ? "Create New Room" : "Create New Department"}
              </h2>
            </div>

            {message.text && (
              <div className={`mb-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" :
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" :
                "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {message.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {message.text}
              </div>
            )}

            {viewMode === "room" && permissions.canCreate && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-2">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Consultation Room 1, Operation Theater A"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={roomCreateDisabled}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 active:bg-teal-950 disabled:opacity-60 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submitting ? "Creating..." : "Create Room"}
                </button>
              </form>
            )}

            {viewMode === "department" && permissions.canCreate && (
              <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-teal-700 mb-2">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    placeholder="e.g., Cardiology, Pediatrics, Emergency"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={deptCreateDisabled}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 active:bg-teal-950 disabled:opacity-60 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {submittingDept ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {submittingDept ? "Creating..." : "Create Department"}
                </button>
              </form>
            )}
          </div>
          )}

          {permissions.canRead && (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DoorOpen className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-semibold text-teal-700">Total Rooms</span>
              </div>
              <p className="text-2xl font-bold text-teal-900 mb-1">{rooms.length}</p>
              <p className="text-xs text-teal-600">Active rooms in your clinic</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-semibold text-teal-700">Total Departments</span>
              </div>
              <p className="text-2xl font-bold text-teal-900 mb-1">{departments.length}</p>
              <p className="text-xs text-teal-600">Active departments in your clinic</p>
            </div>
          </div>

          {viewMode === "room" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <DoorOpen className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg sm:text-xl font-bold text-teal-900">All Rooms</h2>
                <span className="ml-auto px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold">
                  {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
                </span>
              </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-teal-600">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span className="text-sm">Loading rooms...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
              <DoorOpen className="w-8 h-8 text-teal-400" />
            </div>
            <p className="text-sm font-medium text-teal-900 mb-1">No rooms created yet</p>
            <p className="text-xs text-teal-600">Use the form above to create your first room</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room._id}
                className="border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:bg-teal-50 hover:border-gray-300 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  {editingRoomId === room._id ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                      <input
                        type="text"
                        value={editingRoomName}
                        onChange={(e) => setEditingRoomName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleRoomUpdate}
                          disabled={roomUpdateLoading}
                          className="flex-1 sm:flex-none px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors flex items-center justify-center"
                        >
                          {roomUpdateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingRoomId(null);
                            setEditingRoomName("");
                          }}
                          className="flex-1 sm:flex-none px-3 py-2 bg-teal-100 text-teal-700 text-sm rounded-lg hover:bg-teal-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <DoorOpen className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-teal-900">{room.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-teal-400" />
                          <span className="text-xs text-teal-500">
                            Created {new Date(room.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {editingRoomId !== room._id && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {permissions.canUpdate && (
                      <button
                        onClick={() => {
                          setEditingRoomId(room._id);
                          setEditingRoomName(room.name);
                        }}
                        className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                        title="Edit room"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {permissions.canDelete && (
                      <button
                        onClick={() => handleDelete(room._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </div>
          )}
            </>
          )}

          {viewMode === "department" && permissions.canRead && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-teal-700" />
                <h2 className="text-lg sm:text-xl font-bold text-teal-900">All Departments</h2>
                <span className="ml-auto px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                  {departments.length} {departments.length === 1 ? 'Department' : 'Departments'}
                </span>
              </div>

            {loading ? (
              <div className="flex items-center justify-center py-12 text-teal-600">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span className="text-sm">Loading departments...</span>
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-teal-400" />
                </div>
                <p className="text-sm font-medium text-teal-900 mb-1">No departments created yet</p>
                <p className="text-xs text-teal-600">Use the form above to create your first department</p>
              </div>
            ) : (
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div
                    key={dept._id}
                    className="border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:bg-teal-50 hover:border-gray-300 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      {editingDeptId === dept._id ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            value={editingDeptName}
                            onChange={(e) => setEditingDeptName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleDepartmentUpdate}
                              disabled={deptUpdateLoading}
                              className="flex-1 sm:flex-none px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-60 transition-colors"
                            >
                              {deptUpdateLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingDeptId(null);
                                setEditingDeptName("");
                              }}
                              className="flex-1 sm:flex-none px-3 py-2 bg-teal-100 text-teal-700 text-sm rounded-lg hover:bg-teal-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-teal-900">{dept.name}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3 h-3 text-teal-400" />
                              <span className="text-xs text-teal-500">
                                Created {new Date(dept.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {editingDeptId !== dept._id && (
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {permissions.canUpdate && (
                          <button
                            onClick={() => {
                              setEditingDeptId(dept._id);
                              setEditingDeptName(dept.name);
                            }}
                            className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                            title="Edit department"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {permissions.canDelete && (
                          <button
                            onClick={() => handleDeleteDepartment(dept._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </>
      )}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setConfirmModal({ ...confirmModal, isOpen: false });
              toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col transform transition-all duration-200 scale-100 opacity-100 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h2 id="confirm-modal-title" className="text-base sm:text-lg font-semibold text-teal-900">
                  {confirmModal.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
                }}
                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-teal-700" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-teal-700 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
              <button
                onClick={() => {
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  toast("Deletion cancelled", { duration: 2000, icon: "ℹ️" });
                }}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-teal-700 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

AddRoomPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export const AddRoomPageBase = AddRoomPage;

const ProtectedAddRoomPage = withClinicAuth(AddRoomPage);
ProtectedAddRoomPage.getLayout = AddRoomPage.getLayout;

export default ProtectedAddRoomPage;
