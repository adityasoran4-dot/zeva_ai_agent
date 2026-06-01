"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import { Toaster, toast } from 'react-hot-toast';
import { Edit2, Trash2, X, Check, Loader2 } from 'lucide-react';

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

const EodNotePad = () => {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  const [activeTab, setActiveTab] = useState("add");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);

  // Determine API base path based on route
  const getApiBase = () => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/clinic/")) {
        return "/api/clinic";
      }
    }
    if (router?.pathname?.startsWith("/clinic/")) {
      return "/api/clinic";
    }
    return "/api/staff";
  };

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
        // Find clinic_staff_management module (try various formats)
        const modulePermission = data.data.permissions?.find((p) => {
          if (!p?.module) return false;
          const normalized = p.module.startsWith("clinic_")
            ? p.module.slice(7)
            : p.module.startsWith("admin_")
            ? p.module.slice(6)
            : p.module;
          // Check for clinic_staff_management or staff_management
          return normalized === "clinic_staff_management" || normalized === "staff_management";
        });

        if (modulePermission) {
          const actions = modulePermission.actions || {};
          // Handle both boolean true and string "true" cases
          const moduleAll = actions.all === true || 
                           actions.all === "true" || 
                           String(actions.all).toLowerCase() === "true";

          // Find "Add EOD Task" submodule - check multiple possible names and paths
          const eodTaskSubModule = modulePermission.subModules?.find(
            (sm) => {
              const subModuleName = (sm?.name || "").trim();
              const subModulePath = (sm?.path || "").trim();
              // Match by name (exact or variations)
              const nameMatch = subModuleName === "Add EOD Task" || 
                               subModuleName === "Add EOD Notes" ||
                               subModuleName === "EOD Task" ||
                               subModuleName === "EOD Notes" ||
                               subModuleName.toLowerCase().includes("eod");
              // Match by path (if available)
              const pathMatch = subModulePath.includes("/eodNotes") || 
                               subModulePath.includes("/eod-notes") ||
                               subModulePath.includes("eodNotes");
              return nameMatch || pathMatch;
            }
          );

          // If submodule exists, use submodule permissions (priority)
          if (eodTaskSubModule) {
            const subModuleActions = eodTaskSubModule.actions || {};
            const subModuleAll = subModuleActions.all === true || 
                                subModuleActions.all === "true" || 
                                String(subModuleActions.all).toLowerCase() === "true";

          // Helper to check permission: submodule explicit > submodule all > module explicit > module all
            // IMPORTANT: Submodule permissions take priority over module permissions
          const checkPermission = (actionName) => {
              // Priority 1: If submodule has explicit permission, use it (respects false values)
            if (subModuleActions && subModuleActions.hasOwnProperty(actionName)) {
                const actionValue = subModuleActions[actionName];
                // Handle boolean and string "true"/"false"
                if (actionValue === true || actionValue === "true" || String(actionValue).toLowerCase() === "true") {
                  return true;
            }
                if (actionValue === false || actionValue === "false" || String(actionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              
              // Priority 2: If submodule has "all" permission, grant all
              if (subModuleAll) return true;
              
              // Priority 3: Fall back to module-level explicit permission
              if (actions && actions.hasOwnProperty(actionName)) {
                const moduleActionValue = actions[actionName];
                if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                  return true;
                }
                if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              
              // Priority 4: If module has "all" permission, grant all
              if (moduleAll) return true;
              
              // Default: no permission
              return false;
          };

          setPermissions({
            canCreate: checkPermission("create"),
            canRead: checkPermission("read"),
            canUpdate: checkPermission("update"),
            canDelete: checkPermission("delete"),
          });
          } else {
            // Submodule not found - use module-level permissions only
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
          // If no permission entry exists, deny all access by default
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
      console.error("Error fetching clinic permissions for EOD Notes:", error);
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

  // Set default tab based on permissions when permissions are loaded
  useEffect(() => {
    if (isClinicContext && permissionsLoaded) {
      // If user only has create permission, set to add tab
      if (permissions.canCreate && !permissions.canRead && activeTab === "view") {
        setActiveTab("add");
      }
      // If user only has read permission, set to view tab
      if (permissions.canRead && !permissions.canCreate && activeTab === "add") {
        setActiveTab("view");
      }
      // If user has neither permission, stay on current tab (will show access denied)
    }
  }, [permissionsLoaded, permissions.canCreate, permissions.canRead, isClinicContext, activeTab]);

  const handleAddNote = async () => {
    if (isClinicContext && !permissions.canCreate) {
      toast.error("You do not have permission to create EOD notes", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    if (!note.trim()) {
      toast.error("Please enter a note", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Authentication required. Please login again.", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    const loadingToast = toast.loading("Saving your note...", {
      position: 'top-right',
    });

    try {
      const res = await axios.post(
        `${getApiBase()}/addEodNote`,
        { note },
        { headers }
      );
      setNotes(res.data.eodNotes);
      setNote("");
      toast.success("Note saved successfully!", {
        duration: 3000,
        position: 'top-right',
      });
      setActiveTab("view");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save note. Please try again.", {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  const fetchNotes = async (date = "") => {
    if (isClinicContext && !permissionsLoaded) {
      return;
    }

    if (isClinicContext && !permissions.canRead) {
      setNotes([]);
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Authentication required. Please login again.", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    try {
      const res = await axios.get(`${getApiBase()}/getEodNotes${date ? `?date=${date}` : ""}`, {
        headers,
      });
      setNotes(res.data.eodNotes || []);
      setExpandedNotes({});
      
      if (date) {
        toast.success(`Notes filtered for ${new Date(date).toLocaleDateString()}`, {
          duration: 2000,
          position: 'top-right',
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch notes. Please try again.", {
        duration: 3000,
        position: 'top-right',
      });
    }
  };

  useEffect(() => {
    if (isClinicContext && !permissionsLoaded) {
      return;
    }
    if (isClinicContext && !permissions.canRead) {
      setNotes([]);
      // If user only has create permission, switch to add tab
      if (permissions.canCreate && activeTab === "view") {
        setActiveTab("add");
      }
      return;
    }
    const loadNotes = async () => {
      try {
        await fetchNotes();
        toast.success("Notes loaded successfully", {
          duration: 2000,
          position: 'top-right',
        });
      } catch (err) {
        toast.error("Failed to load notes", {
          duration: 3000,
          position: 'top-right',
        });
      }
    };
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsLoaded, permissions.canRead, isClinicContext]);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    fetchNotes(newDate);
  };

  const clearDateFilter = () => {
    setSelectedDate("");
    fetchNotes();
    toast.success("Filter cleared. Showing all notes.", {
      duration: 2000,
      position: 'top-right',
    });
  };

  const toggleExpand = (index) => {
    setExpandedNotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    
    if (!expandedNotes[index]) {
      toast.success("Note expanded", {
        duration: 1500,
        position: 'bottom-right',
        icon: '📖',
      });
    }
  };

  const shouldTruncate = (text) => {
    return text.split('\n').length > 4;
  };

  const getTruncatedText = (text) => {
    const lines = text.split('\n');
    return lines.slice(0, 4).join('\n');
  };

  const handleEditNote = (noteId, noteText) => {
    setEditingNoteId(noteId);
    setEditingNoteText(noteText);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText("");
  };

  const handleUpdateNote = async () => {
    if (isClinicContext && !permissions.canUpdate) {
      toast.error("You do not have permission to update EOD notes", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    if (!editingNoteText.trim()) {
      toast.error("Note cannot be empty", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Authentication required. Please login again.", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    setIsUpdating(true);
    const loadingToast = toast.loading("Updating note...", {
      position: 'top-right',
    });

    try {
      const res = await axios.put(
        `${getApiBase()}/updateEodNote`,
        { noteId: editingNoteId, note: editingNoteText },
        { headers }
      );
      setNotes(res.data.eodNotes);
      setEditingNoteId(null);
      setEditingNoteText("");
      toast.success("Note updated successfully!", {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update note. Please try again.", {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsUpdating(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (isClinicContext && !permissions.canDelete) {
      toast.error("You do not have permission to delete EOD notes", {
        duration: 3000,
        position: 'top-right',
      });
      setDeleteConfirmId(null);
      return;
    }

    const headers = getAuthHeaders();
    if (!headers) {
      toast.error("Authentication required. Please login again.", {
        duration: 3000,
        position: 'top-right',
      });
      return;
    }

    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting note...", {
      position: 'top-right',
    });

    try {
      const res = await axios.delete(
        `${getApiBase()}/deleteEodNote?noteId=${noteId}`,
        { headers }
      );
      setNotes(res.data.eodNotes);
      setDeleteConfirmId(null);
      toast.success("Note deleted successfully!", {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete note. Please try again.", {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsDeleting(false);
      toast.dismiss(loadingToast);
    }
  };

  // Show loading state while checking permissions
  if (isClinicContext && !permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-sm text-gray-700">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if no read permission
  if (isClinicContext && permissionsLoaded && !permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
            !
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view or manage EOD notes. Please contact your administrator if you believe this is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        toastOptions={{
          success: {
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            End of Day Notes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your daily notes and observations
          </p>
        </div>
      </div>

      {/* Tabs Navigation - Only show tabs user has permission for */}
      {((isClinicContext && (permissions.canCreate || permissions.canRead)) || !isClinicContext) && (
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
              {((isClinicContext && permissions.canCreate) || !isClinicContext) && (
            <button
                  onClick={() => {
                    if (isClinicContext && !permissions.canCreate) {
                      toast.error("You do not have permission to create EOD notes", {
                        duration: 3000,
                        position: 'top-right',
                      });
                      return;
                    }
                    setActiveTab("add");
                  }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "add"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Add Note
            </button>
              )}
              {((isClinicContext && permissions.canRead) || !isClinicContext) && (
            <button
                  onClick={() => {
                    if (isClinicContext && !permissions.canRead) {
                      toast.error("You do not have permission to view EOD notes", {
                        duration: 3000,
                        position: 'top-right',
                      });
                      return;
                    }
                    setActiveTab("view");
                  }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "view"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              View Notes
            </button>
              )}
          </nav>
        </div>
      </div>
      )}

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Note Section - Only show if user has create permission */}
        {activeTab === "add" && (
          <div className="max-w-3xl">
            {(!isClinicContext || permissions.canCreate) ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Create New Note
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                      Note Content
                    </label>
                    <textarea
                      id="note"
                      rows="10"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Enter your end-of-day notes here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 transition-shadow"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNote}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Permission Denied</h3>
                <p className="text-sm text-gray-600">
                  You do not have permission to create EOD notes. Please contact your administrator.
                </p>
              </div>
            )}
          </div>
        )}

        {/* View Notes Section - Only show if user has read permission */}
        {activeTab === "view" && (
          (!isClinicContext || permissions.canRead) ? (
          <div>
            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Your Notes
                </h2>
                
                <div className="flex items-center gap-3">
                  <label htmlFor="date-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Filter by date:
                  </label>
                  <input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="text-gray-800 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {selectedDate && (
                    <button
                      onClick={clearDateFilter}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {notes.length > 0 ? (
                notes.map((n, i) => {
                  const isExpanded = expandedNotes[i];
                  const needsTruncation = shouldTruncate(n.note);
                  const displayText = needsTruncation && !isExpanded 
                    ? getTruncatedText(n.note) 
                    : n.note;
                  const isEditing = editingNoteId === n._id.toString();

                  return (
                    <div 
                      key={n._id || i} 
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-sm text-gray-500">
                            {new Date(n.createdAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(n.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-2 ml-4">
                            {(!isClinicContext || permissions.canUpdate) && (
                              <button
                                onClick={() => handleEditNote(n._id.toString(), n.note)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit note"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {(!isClinicContext || permissions.canDelete) && (
                              <button
                                onClick={() => setDeleteConfirmId(n._id.toString())}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete note"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {isClinicContext && !permissions.canUpdate && !permissions.canDelete && (
                              <span className="text-xs text-gray-400">No actions available</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingNoteText}
                            onChange={(e) => setEditingNoteText(e.target.value)}
                            rows="8"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400 transition-shadow"
                            placeholder="Enter your note here..."
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleUpdateNote}
                              disabled={isUpdating}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              {isUpdating ? "Updating..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isUpdating}
                              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {displayText}
                          </p>

                          {needsTruncation && (
                            <button
                              onClick={() => toggleExpand(i)}
                              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {isExpanded ? "Show less" : "Show more"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedDate 
                      ? "No notes available for the selected date." 
                      : "Get started by creating your first note."}
                  </p>
                  {!selectedDate && (
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab("add")}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Note
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Permission Denied</h3>
              <p className="text-sm text-gray-600">
                You do not have permission to view EOD notes. Please contact your administrator.
              </p>
            </div>
          )
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Note
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteNote(deleteConfirmId)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

EodNotePad.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedDashboard = withClinicAuth(EodNotePad);
ProtectedDashboard.getLayout = EodNotePad.getLayout;

export default ProtectedDashboard;