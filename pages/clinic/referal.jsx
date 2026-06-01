import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import { X, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];
const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const v = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (v) return v;
  }
  return null;
};
const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

function ClinicReferralPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    referralPercent: 0,
    addExpense: false,
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
  // Try clinic_Referral first; hook will fallback gracefully if not found
  const agentPermissionsHook = useAgentPermissions(
    isAgentRoute ? "clinic_referal" : null,
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
              // Admin has set permissions - check the clinic_Referral module
              const modulePermission = res.data.permissions.find((p) => {
                if (!p?.module) return false;
                // Check for clinic_Referral module variations
                if (p.module === "clinic_Referral") return true;
                if (p.module === "clinic_referral") return true;
                if (p.module === "clinic_referal") return true;
                if (p.module === "clinic_referal") return true;
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
          console.log("Fetching Agent/Staff Permissions for clinic_Referral...");
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          // Try clinic_Referral first (proper casing)
          let res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_referal" },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          let data = res.data;
          
          // If not found, try clinic_referral (lowercase)
          if (!data?.permissions && data?.error?.includes("not found")) {
            res = await axios.get("/api/agent/get-module-permissions", {
              params: { moduleKey: "clinic_referal" },
              headers: { Authorization: `Bearer ${agentStaffToken}` },
            });
            data = res.data;
          }
          
          // If still not found, try clinic_referal (typo in backend)
          if (!data?.permissions && data?.error?.includes("not found")) {
            res = await axios.get("/api/agent/get-module-permissions", {
              params: { moduleKey: "clinic_referal" },
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

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      referralPercent: 0,
      addExpense: false,
    });
    setErrors({});
    setEditing(null);
  }, []);

  const validate = useCallback(() => {
    const e = {};
    if (!String(form.firstName).trim()) e.firstName = "Required";
    if (!String(form.phone).trim()) e.phone = "Required";
    const pct = Number(form.referralPercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) e.referralPercent = "0-100 required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const load = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/clinic/referrals", { headers });
      if (res.data.success) {
        setItems(res.data.referrals || []);
      }
    } catch (err) {
      showToast("Failed to load referrals", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) return;
    load();
  }, [load, permissionsLoaded, permissions.canRead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "addExpense") {
      const checked = e.target.checked;
      setForm((prev) => ({ ...prev, addExpense: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: name === "referralPercent" ? value : value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast("Fix validation errors", "error");
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      showToast("Authentication required", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await axios.put(
          "/api/clinic/referrals",
          {
            id: editing._id,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            email: form.email,
            referralPercent: Number(form.referralPercent),
            addExpense: form.addExpense,
          },
          { headers }
        );
        if (res.data.success) {
          showToast("Referral updated", "success");
          setShowModal(false);
          resetForm();
          load();
        } else {
          showToast(res.data.message || "Update failed", "error");
        }
      } else {
        const res = await axios.post(
          "/api/clinic/referrals",
          {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            email: form.email,
            referralPercent: Number(form.referralPercent),
            addExpense: form.addExpense,
          },
          { headers }
        );
        if (res.data.success) {
          showToast("Referral created", "success");
          setShowModal(false);
          resetForm();
          load();
        } else {
          showToast(res.data.message || "Create failed", "error");
        }
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      phone: item.phone || "",
      email: item.email || "",
      referralPercent: item.referralPercent ?? 0,
      addExpense: !!item.addExpense,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) {
      showToast("Authentication required", "error");
      return;
    }
    try {
      const res = await axios.delete("/api/clinic/referrals", {
        data: { id },
        headers,
      });
      if (res.data.success) {
        showToast("Referral deleted", "success");
        load();
      } else {
        showToast(res.data.message || "Delete failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  // Show access denied message only if BOTH read and create are false
  if (!permissions.canRead && !permissions.canCreate) {
    console.log("Rendering Access Denied - permissions:", permissions);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-700">
            You do not have permission to view or create referrals. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg flex items-center gap-2 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{toast.message}</span>
          <button className="hover:bg-white/10 rounded p-1" onClick={() => setToast(null)}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-teal-900">Referral Management</h2>
              <p className="text-[10px] sm:text-xs text-teal-700">Create, update, and delete referral contacts</p>
            </div>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 text-white text-xs rounded-md flex items-center gap-1 ${permissions.canCreate ? "bg-teal-600 hover:bg-teal-700" : "bg-gray-400 cursor-not-allowed"}`}
                onClick={() => {
                  console.log("New button clicked, canCreate:", permissions.canCreate);
                  if (!permissions.canCreate) return;
                  resetForm();
                  setShowModal(true);
                }}
                disabled={!permissions.canCreate}
                title={!permissions.canCreate ? "No permission to create referral" : ""}
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
          </div>

          {/* READ-ONLY SECTION: Table and data - Only shown when canRead is true */}
          {permissions.canRead && (
          <div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-teal-900">Referrals</h3>
                <button className="px-2 py-1 text-[10px] border border-gray-300 rounded-md" onClick={load}>
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-xs text-gray-700">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-xs text-gray-700">No referrals</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[10px]">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="px-2 py-1">Name</th>
                        <th className="px-2 py-1">Phone</th>
                        <th className="px-2 py-1">Email</th>
                        <th className="px-2 py-1">Referral %</th>
                        <th className="px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it._id} className="border-t">
                          <td className="px-2 py-1">{[it.firstName, it.lastName].filter(Boolean).join(" ")}</td>
                          <td className="px-2 py-1">{it.phone}</td>
                          <td className="px-2 py-1">{it.email || "—"}</td>
                          <td className="px-2 py-1">{it.referralPercent ?? 0}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              {permissions.canUpdate && (
                                <button className="p-1 rounded hover:bg-teal-100" onClick={() => startEdit(it)} title="Edit">
                                  <Edit2 className="w-3 h-3 text-teal-700" />
                                </button>
                              )}
                              {permissions.canDelete && (
                                <button className="p-1 rounded hover:bg-red-100" onClick={() => handleDelete(it._id)} title="Delete">
                                  <Trash2 className="w-3 h-3 text-red-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] max-h-[98vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-teal-900 truncate">
                  {editing ? "Edit Referral" : "Create Referral"}
                </h3>
              </div>
              <button 
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-3 overflow-y-auto flex-1">
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">First Name <span className="text-red-500">*</span></label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className={`w-full px-2 py-1 text-[10px] border rounded-md ${errors.firstName ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-[9px] mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Last Name</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Phone <span className="text-red-500">*</span></label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full px-2 py-1 text-[10px] border rounded-md ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.phone && <p className="text-red-500 text-[9px] mt-0.5">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Referral %</label>
                  <input
                    type="number"
                    name="referralPercent"
                    value={form.referralPercent}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    className={`w-full px-2 py-1 text-[10px] border rounded-md ${errors.referralPercent ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.referralPercent && <p className="text-red-500 text-[9px] mt-0.5">{errors.referralPercent}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <div className="mr-auto flex items-center gap-2">
                    <input
                      id="addExpense"
                      type="checkbox"
                      name="addExpense"
                      checked={!!form.addExpense}
                      onChange={handleChange}
                      className="h-3 w-3 border-gray-300 rounded"
                    />
                    <label htmlFor="addExpense" className="text-[10px] text-gray-700">
                      Add an expense
                    </label>
                  </div>
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-md text-[10px]"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-3 py-1 text-[10px] rounded-md text-white ${saving ? "bg-gray-500" : "bg-teal-600 hover:bg-teal-700"}`}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {editing ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ClinicReferralPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicReferralPage = withClinicAuth(ClinicReferralPage);
ProtectedClinicReferralPage.getLayout = ClinicReferralPage.getLayout;

export default ProtectedClinicReferralPage;

