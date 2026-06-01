import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import Loader from "../../components/Loader";
import { Eye, CheckCircle, AlertCircle, X, Check, CircleDollarSign } from "lucide-react";

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

const getUserInfo = () => {
  if (typeof window === "undefined") return { role: null, id: null };
  try {
    for (const key of TOKEN_PRIORITY) {
      const token =
        localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!token) continue;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);
        return {
          role: decoded.role || decoded.userRole || null,
          id: decoded.userId || decoded.id || null,
        };
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error("Error getting user info:", error);
  }
  return { role: null, id: null };
};

const getUserRole = () => getUserInfo().role;

const isTruthy = (val) =>
  val === true || val === "true" || String(val || "").toLowerCase() === "true";

const findCommissionModule = (permissionsList) =>
  permissionsList.find((p) => {
    if (!p?.module) return false;
    const mod = String(p.module).toLowerCase();
    return (
      mod === "clinic_commission" ||
      mod === "clinic_commissions" ||
      mod === "commission"
    );
  });

const parsePermissionActions = (actions = {}) => {
  const moduleAll = isTruthy(actions.all);
  return {
    canRead: moduleAll || isTruthy(actions.read),
    canCreate: moduleAll || isTruthy(actions.create),
    canUpdate: moduleAll || isTruthy(actions.update),
    canDelete: moduleAll || isTruthy(actions.delete),
  };
};

function ClinicCommissionPage() {
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [source, setSource] = useState("referral");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalItems, setModalItems] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [lastSource, setLastSource] = useState("referral"); // Track last source to detect changes
  const [expandedRow, setExpandedRow] = useState(null);
  const [patientInfoMap, setPatientInfoMap] = useState({});
  const [membershipList, setMembershipList] = useState([]);
  const [packageList, setPackageList] = useState([]);
  const [expandedMemberships, setExpandedMemberships] = useState({});
  const [expandedPackages, setExpandedPackages] = useState({});
  const [addExpenseRow, setAddExpenseRow] = useState(null); // commissionId or null
  const [newExpenses, setNewExpenses] = useState([{ name: "", price: "" }]);
  const [addExpenseLoading, setAddExpenseLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter main items by search query
  const filteredMainItems = items.filter(row => {
    if (!searchQuery) return true;
    const nameLower = (row.name || "").toLowerCase();
    return nameLower.includes(searchQuery.toLowerCase());
  });

  // Filter modal items by search query
  const filteredModalItems = modalItems.filter(item => {
    if (!searchQuery) return true;
    const patientName = (item.patientName || "").toLowerCase();
    const doctorName = (item.doctorName || "").toLowerCase();
    const queryLower = searchQuery.toLowerCase();
    return patientName.includes(queryLower) || doctorName.includes(queryLower);
  });

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Clinic-level (sidebar-permissions) + agent/doctorStaff-level (get-module-permissions)
  useEffect(() => {
    let isMounted = true;

    const userRole = getUserRole();
    const authToken = getStoredToken();
    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken")
        : null;

    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken")
        : null;

    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          const clinicAuthToken = clinicToken || doctorToken || authToken;
          if (!clinicAuthToken) {
            if (!isMounted) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${clinicAuthToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              const modulePermission = findCommissionModule(res.data.permissions);

              if (modulePermission) {
                setPermissions(parsePermissionActions(modulePermission.actions || {}));
              } else {
                setPermissions({
                  canRead: true,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
          if (isMounted) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchClinicPermissions();
      return () => {
        isMounted = false;
      };
    }

    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (
      agentToken ||
      staffToken ||
      userToken ||
      userRole === "agent" ||
      userRole === "doctorStaff" ||
      userRole === "staff"
    ) {
      const fetchAgentPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          let permissionToken = agentStaffToken;
          if (userRole === "agent") {
            permissionToken = agentToken || agentStaffToken;
          } else if (userRole === "doctorStaff" || userRole === "staff") {
            permissionToken = userToken || staffToken || agentStaffToken;
          }
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_commission" },
            headers: { Authorization: `Bearer ${permissionToken}` },
          });

          if (!isMounted) return;

          if (
            !res.data?.permissions &&
            res.data?.error?.includes("not found in agent permissions")
          ) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          if (res.data?.success && res.data?.permissions) {
            setPermissions(parsePermissionActions(res.data.permissions.actions || {}));
          } else {
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchAgentPermissions();
    } else {
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
  }, []);

  // Clear commission data when read access is denied
  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) {
      setItems([]);
      setModalItems([]);
      setShowModal(false);
      setLoading(false);
      setExpandedRow(null);
      setAddExpenseRow(null);
    }
  }, [permissionsLoaded, permissions.canRead]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const token = 
          localStorage.getItem('clinicToken') || 
          sessionStorage.getItem('clinicToken') || 
          localStorage.getItem('agentToken') || 
          sessionStorage.getItem('agentToken');
        if (!token) return;
        const res = await axios.get('/api/clinics/myallClinic', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  const load = useCallback(async () => {
    if (!permissionsLoaded || !permissions.canRead) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/clinic/commissions/summary", {
        params: { source },
        headers,
      });
      if (res.data.success) {
        setItems(res.data.items || []);
      } else {
        showToast(res.data.message || "Failed to load commissions", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [source, showToast, permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    if (!permissionsLoaded || !permissions.canRead) return;
    load();
    // Clear modal when source changes
    if (source !== lastSource) {
      setShowModal(false);
      setModalItems([]);
      setSelectedPerson(null);
      setLastSource(source);
    }
  }, [load, source, lastSource, permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    if (!permissionsLoaded || !permissions.canRead) return;
    const headers = getAuthHeaders();
    if (!headers) return;
    (async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          axios.get("/api/clinic/memberships", { headers }),
          axios.get("/api/clinic/packages", { headers }),
        ]);
        setMembershipList(Array.isArray(mRes.data?.memberships) ? mRes.data.memberships : []);
        setPackageList(Array.isArray(pRes.data?.packages) ? pRes.data.packages : []);
      } catch {}
    })();
  }, [permissionsLoaded, permissions.canRead]);

  const openDetails = async (row) => {
    const headers = getAuthHeaders();
    if (!headers) {
      showToast("Authentication required", "error");
      return;
    }
    
    // Clear previous data and show modal
    setSelectedPerson(null);
    setModalItems([]);
    setShowModal(true);
    setModalLoading(true);
    
    try {
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setSelectedPerson(row);
      const params =
        row.source === "referral"
          ? { source: "referral", referralId: row.personId }
          : { source: "staff", staffId: row.personId };
      const res = await axios.get("/api/clinic/commissions/by-person", {
        params,
        headers,
      });
      if (res.data.success) {
        setModalItems(res.data.items || []);
      } else {
        showToast(res.data.message || "Failed to load history", "error");
        setShowModal(false);
      }
    } catch (err) {
      showToast("Network error", "error");
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const toggleRow = async (row) => {
    const isExpanded = expandedRow === row.commissionId;
    if (isExpanded) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(row.commissionId);
    // Lazy-load patient info for tags (membership/package status) if not available
    if (row.patientId && !patientInfoMap[row.patientId]) {
      const headers = getAuthHeaders();
      if (!headers) return;
      try {
        const [basicRes, fullRes, pkgUsageRes] = await Promise.all([
          axios.get(`/api/clinic/${row.patientId}`, { headers }),
          axios.get(`/api/staff/get-patient-data/${row.patientId}`, { headers }),
          axios.get(`/api/clinic/package-usage/${row.patientId}`, { headers }).catch(() => ({ data: null })),
        ]);
        const full = fullRes?.data || null;
        const transferIds = new Set();
        if (full?.membershipTransfers) {
          full.membershipTransfers.forEach(t => {
            if (t.fromPatientId) transferIds.add(String(t.fromPatientId));
            if (t.toPatientId) transferIds.add(String(t.toPatientId));
          });
        }
        if (full?.packageTransfers) {
          full.packageTransfers.forEach(t => {
            if (t.fromPatientId) transferIds.add(String(t.fromPatientId));
            if (t.toPatientId) transferIds.add(String(t.toPatientId));
          });
        }
        const transferNameMap = {};
        await Promise.all(
          Array.from(transferIds).map(async (pid) => {
            try {
              const r = await axios.get(`/api/staff/get-patient-data/${pid}`, { headers });
              const d = r.data;
              const name = `${(d.firstName || "").trim()} ${(d.lastName || "").trim()}`.trim() || d.emrNumber || pid;
              transferNameMap[pid] = name;
            } catch {}
          })
        );
        const entries = [];
        const existing = Array.isArray(full?.memberships) ? full.memberships : [];
        const transferredIns = (full?.membershipTransfers || [])
          .filter(t => t.type === 'in')
          .map(t => ({ membershipId: t.membershipId, startDate: t.startDate, endDate: t.endDate }));
        const displayMemberships = [...existing];
        transferredIns.forEach(t => {
          const dup = displayMemberships.some(m =>
            String(m.membershipId) === String(t.membershipId) &&
            (!!m.startDate ? String(m.startDate) === String(t.startDate) : true) &&
            (!!m.endDate ? String(m.endDate) === String(t.endDate) : true)
          );
          if (!dup) displayMemberships.push(t);
        });
        displayMemberships.forEach(m => {
          if (m.membershipId && m.startDate && m.endDate) {
            entries.push({ membershipId: m.membershipId, startDate: m.startDate, endDate: m.endDate });
          }
        });
        const membershipUsageMap = {};
        await Promise.all(entries.map(async (e) => {
          const qs = new URLSearchParams();
          qs.set("membershipId", e.membershipId);
          qs.set("startDate", e.startDate);
          qs.set("endDate", e.endDate);
          try {
            const mRes = await axios.get(`/api/clinic/membership-usage/${row.patientId}?${qs.toString()}`, { headers });
            const key = `${e.membershipId}|${e.startDate}|${e.endDate}`;
            membershipUsageMap[key] = mRes.data && mRes.data.success ? mRes.data : null;
          } catch {
            const key = `${e.membershipId}|${e.startDate}|${e.endDate}`;
            membershipUsageMap[key] = null;
          }
        }));

        setPatientInfoMap((prev) => ({
          ...prev,
          [row.patientId]: { 
            data: basicRes.data, 
            full, 
            transferNameMap, 
            membershipUsageMap,
            displayMemberships,
            packageUsage: pkgUsageRes?.data?.success ? pkgUsageRes.data.packageUsage : null,
            error: null 
          }
        }));
      } catch (e) {
        setPatientInfoMap((prev) => ({ ...prev, [row.patientId]: { data: null, error: "Failed to load patient" } }));
      }
    }
  };

  const handleAddExpense = async (commissionId) => {
    if (!permissions.canUpdate) {
      showToast("You do not have permission to add expenses", "error");
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      showToast("Authentication required", "error");
      return;
    }
    const validExpenses = newExpenses.filter((e) => e.name.trim() !== "" && Number(e.price) > 0);
    if (validExpenses.length === 0) {
      showToast("Enter at least one valid expense with name and price", "error");
      return;
    }
    setAddExpenseLoading(true);
    try {
      const res = await axios.post(
        "/api/clinic/commissions/add-expense",
        { commissionId, expenses: validExpenses },
        { headers }
      );
      if (res.data.success) {
        setModalItems((prev) =>
          prev.map((item) =>
            item.commissionId === commissionId ? { ...item, ...res.data.updated } : item
          )
        );
        setAddExpenseRow(null);
        setNewExpenses([{ name: "", price: "" }]);
        showToast("Expense added successfully");
      } else {
        showToast(res.data.message || "Failed to add expense", "error");
      }
    } catch {
      showToast("Failed to add expense", "error");
    } finally {
      setAddExpenseLoading(false);
    }
  };

  const handleToggleSubmit = async (commissionId) => {
    if (!permissions.canUpdate) {
      showToast("You do not have permission to update commissions", "error");
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const res = await axios.post("/api/clinic/commissions/toggle-submit", { commissionId }, { headers });
      if (res.data.success) {
        setModalItems((prev) =>
          prev.map((item) =>
            item.commissionId === commissionId
              ? { ...item, isSubmitted: res.data.isSubmitted }
              : item
          )
        );
        // Refresh summary so the Approve button's pendingApprovalCount updates immediately
        load();
      } else {
        showToast(res.data.message || "Failed to update", "error");
      }
    } catch {
      showToast("Failed to update submission", "error");
    }
  };

  const handleApprove = async (personId, src) => {
    if (!permissions.canUpdate) {
      showToast("You do not have permission to approve commissions", "error");
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const endpoint =
        src === "referral"
          ? "/api/clinic/commissions/approve-referral"
          : "/api/clinic/commissions/approve";
      const payload =
        src === "referral" ? { referralId: personId } : { staffId: personId };
      const res = await axios.post(endpoint, payload, { headers });
      if (res.data.success) {
        showToast(`${res.data.approvedCount} commission(s) approved`);
        // Refresh summary list to update pendingApprovalCount badge
        load();
        // Refresh modal items if open for this person
        if (selectedPerson && selectedPerson.personId === personId) {
          setModalItems((prev) => prev.map((item) => (item.isSubmitted ? { ...item, isApproved: true } : item)));
        }
      } else {
        showToast(res.data.message || "Failed to approve", "error");
      }
    } catch {
      showToast("Failed to approve", "error");
    }
  };

  if (!permissionsLoaded) {
    return <Loader />;
  }

  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CircleDollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-400">
            You do not have permission to view commissions. Please contact your
            administrator.
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
      <div className="max-w-9xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-teal-900">Commission Tracker</h2>
              <p className="text-xs sm:text-sm text-teal-600">Referral and doctor/staff commissions</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Doctor/Staff Name</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-teal-700 hover:bg-teal-50 transition-all whitespace-nowrap"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Filter
                </button>
                <button 
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md border border-gray-300 text-teal-700 hover:bg-teal-50 transition-all whitespace-nowrap"
                  onClick={load}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${source === "referral" ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700" : "bg-white text-teal-700 border border-gray-300 hover:bg-teal-50"}`}
              onClick={() => {
                if (source !== "referral") {
                  setSource("referral");
                }
              }}
            >
              Referral
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${source === "staff" ? "bg-teal-600 text-white shadow-sm hover:bg-teal-700" : "bg-white text-teal-700 border border-gray-300 hover:bg-teal-50"}`}
              onClick={() => {
                if (source !== "staff") {
                  setSource("staff");
                }
              }}
            >
              Doctor/Staff
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-teal-600">Loading...</div>
          ) : filteredMainItems.length === 0 ? (
            <div className="text-sm text-teal-600">No commissions found</div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">Name</th>
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">Type</th>
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">%</th>
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">Earned</th>
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">Paid</th>
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">Count</th>
                    <th className="px-2 sm:px-4 py-3 font-medium whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMainItems.map((row) => (
                    <tr key={`${row.source}-${row.personId}`} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">{row.name || "—"}</td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">{row.source === "referral" ? "Referral" : "Doctor/Staff"}</td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">{row.percent ?? 0}</td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">{getCurrencySymbol(currency)} {Number(row.totalEarned || 0).toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">{getCurrencySymbol(currency)} {Number(row.totalPaid || 0).toFixed(2)}</td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">{row.count}</td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2">
                          <button
                            className="w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs rounded-md bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1 font-medium transition-all shadow-sm"
                            onClick={() => openDetails(row)}
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                          {permissions.canUpdate && (
                            <button
                              className={`w-full sm:w-auto px-2 sm:px-3 py-1.5 text-xs rounded-md flex items-center justify-center gap-1 font-medium transition-all shadow-sm ${
                                Number(row.pendingApprovalCount || 0) > 0
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                              disabled={Number(row.pendingApprovalCount || 0) === 0}
                              onClick={() => handleApprove(row.personId, row.source)}
                              title={
                                Number(row.pendingApprovalCount || 0) > 0
                                  ? `Approve ${row.pendingApprovalCount} submitted commission(s)`
                                  : "No submitted commissions to approve"
                              }
                            >
                              <Check className="w-3 h-3" />
                              <span className="whitespace-nowrap">Approve{Number(row.pendingApprovalCount || 0) > 0 ? ` (${row.pendingApprovalCount})` : ""}</span>
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

        {/* Modal Popup */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 z-50">
            <div className="bg-white mt-3 rounded-lg shadow-xl max-h-[95vh] w-[98vw] sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[80vw] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 flex-shrink-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-teal-900 truncate">
                    {selectedPerson?.source === "referral" ? "Referral History" : "Doctor/Staff History"}
                  </h3>
                  <p className="text-[10px] text-teal-600 mt-0.5 truncate">{selectedPerson?.name || ""}</p>
                </div>
                <button 
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 ml-1"
                  onClick={() => setShowModal(false)}
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-1.5 overflow-y-auto flex-1">
                {modalLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center px-3 py-1.5 bg-teal-50 rounded-lg">
                      <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-teal-700 font-medium text-[10px]">Loading history...</span>
                    </div>
                  </div>
                ) : filteredModalItems.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-teal-600 text-[10px]">No records found</div>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="min-w-full text-[9px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Patient</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">EMR</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Invoice</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Paid</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Ref. Ded.</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Bank Ded.</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Earned</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Comm.</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Doctor</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                          <th className="px-1.5 py-2 text-left text-[8px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredModalItems.map((it) => (
                          <React.Fragment key={it.commissionId}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">{it.patientName || "—"}</td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">{it.patientEmr || "—"}</td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">{it.invoiceNumber || "—"}</td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">{getCurrencySymbol(currency)} {Number(it.paidAmount || 0).toFixed(2)}</td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">
                                {Number(it.referralCommissionDeducted || 0) > 0 ? (
                                  `${getCurrencySymbol(currency)} ${Number(it.referralCommissionDeducted).toFixed(2)}`
                                ) : "—"}
                              </td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">
                                {it.bankDeduction?.deductionAmount ? (
                                  `${getCurrencySymbol(currency)} ${Number(it.bankDeduction.deductionAmount).toFixed(2)}`
                                ) : "—"}
                              </td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[8px]">
                                {it.paymentMethod === "Cash" ? (
                                  <span className="text-gray-700">Cash</span>
                                ) : it.paymentMethod && it.bankDeduction?.enabled ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium text-gray-700">{it.paymentMethod}</span>
                                    <span className="text-gray-600">
                                      {it.bankDeduction.type === "flat" ? (
                                        `${getCurrencySymbol(currency)} ${Number(it.bankDeduction.value).toFixed(2)}`
                                      ) : (
                                        `${Number(it.bankDeduction.value).toFixed(0)}%`
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">
                                {Number((it.finalCommissionAmount ?? it.commissionAmount) || 0) > 0
                                  ? `${getCurrencySymbol(currency)} ${Number((it.finalCommissionAmount ?? it.commissionAmount) || 0).toFixed(2)}`
                                  : "—"}
                              </td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">
                                {Number((it.finalCommissionAmount ?? it.commissionAmount) || 0) > 0
                                  ? `${getCurrencySymbol(currency)} ${Number((it.finalCommissionAmount ?? it.commissionAmount) || 0).toFixed(2)} (${Number(it.commissionPercent || 0)}%)`
                                  : "—"}
                              </td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">{it.doctorName || "—"}</td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap text-[9px]">{it.invoicedDate ? new Date(it.invoicedDate).toLocaleDateString() : "—"}</td>
                              <td className="px-1.5 py-1.5 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => toggleRow(it)}
                                    className="px-1.5 py-1 text-[8px] rounded-md bg-teal-600 hover:bg-teal-700 text-white whitespace-nowrap"
                                  >
                                    {expandedRow === it.commissionId ? "Hide" : "View"}
                                  </button>
                                  {/* Tick button: mark/unmark this commission as submitted */}
                                  {permissions.canUpdate && (
                                    <button
                                      onClick={() => handleToggleSubmit(it.commissionId)}
                                      title={it.isSubmitted ? "Unmark submission" : "Mark as submitted"}
                                      className={`p-1 sm:p-1.5 rounded-md transition-all ${
                                        it.isSubmitted
                                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                          : "bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200"
                                      }`}
                                    >
                                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  )}
                                  {it.isApproved && (
                                    <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[7px] bg-emerald-100 text-emerald-700 font-semibold whitespace-nowrap">
                                      Approved
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedRow === it.commissionId && (
                              <tr className="bg-gray-50/60">
                                <td colSpan={12} className="px-1.5 py-1.5">
                                  <div className="rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-1.5 mb-1.5">
                                      <div className="flex flex-wrap items-center gap-1">
                                        <span className="text-[9px] font-semibold text-gray-700">Details:</span>
                                        {it.service === "Package" ? (
                                          <>
                                            <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[8px] bg-indigo-100 text-indigo-700 font-medium">
                                              Package: {it.package || "—"}
                                            </span>
                                            {Array.isArray(it.selectedPackageTreatments) && it.selectedPackageTreatments.length > 0 && (
                                              <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[8px] bg-cyan-100 text-cyan-700 font-medium">
                                                Sess used: {it.selectedPackageTreatments.reduce((s, t) => s + (Number(t.sessions) || 0), 0)}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[8px] bg-emerald-100 text-emerald-700 font-medium">
                                              Treatment: {it.treatment || it.service || "—"}
                                            </span>
                                          </>
                                        )}
                                        {it.isFreeConsultation ? (
                                          <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[8px] bg-amber-100 text-amber-700 font-semibold">
                                            Free consult{it.freeConsultationCount ? ` (${it.freeConsultationCount})` : ""}
                                          </span>
                                        ) : null}
                                        {Number(it.membershipDiscountApplied || 0) > 0 && (
                                          <span className="inline-flex items-center px-1 py-0.5 rounded-full text-[8px] bg-teal-100 text-teal-700 font-medium">
                                            Discount: {getCurrencySymbol(currency)}{Number(it.membershipDiscountApplied).toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                                        {(() => {
                                          const totalPending = Number((it.totalPendingBalance ?? it.pendingAmount ?? 0) || 0);
                                          const totalAdvance = Number((it.totalAdvanceBalance ?? it.advanceAmount ?? 0) || 0);
                                          return (
                                            <>
                                              {totalPending > 0 && (
                                                <span className="inline-flex items-center px-1 py-0.5 rounded-md text-[8px] font-semibold text-rose-700 bg-rose-50 border border-rose-100">
                                                  Pending: {getCurrencySymbol(currency)} {totalPending.toFixed(2)}
                                                </span>
                                              )}
                                              {totalAdvance > 0 && (
                                                <span className="inline-flex items-center px-1 py-0.5 rounded-md text-[8px] font-semibold text-green-700 bg-green-50 border border-green-100">
                                                  Advance: {getCurrencySymbol(currency)} {totalAdvance.toFixed(2)}
                                                </span>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div className="border-t border-gray-100 my-1" />
                                    {/* Package treatments list if present */}
                                    {it.service === "Package" && Array.isArray(it.selectedPackageTreatments) && it.selectedPackageTreatments.length > 0 && (
                                      <div className="mb-1.5">
                                        <div className="text-[9px] text-gray-600 font-semibold mb-0.5">Treatments:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {it.selectedPackageTreatments.map((pt, idx) => (
                                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-gray-100 text-gray-700">
                                              {pt.treatmentName} — {pt.sessions} sess
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Expenses for this billing */}
                                    {(Number(it.expenseTotal || 0) > 0 || Number(it.complaintExpenseTotal || 0) > 0) && (
                                      <div className="mb-1.5">
                                        <div className="text-[9px] text-gray-600 font-semibold mb-0.5">Expenses:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {(Array.isArray(it.expenses) ? it.expenses : []).map((ex, iEx) => (
                                            <span key={`be-${iEx}`} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-amber-100 text-amber-800 border border-amber-200">
                                              {ex.name}: {getCurrencySymbol(currency)}{Number(ex.amount || 0).toFixed(2)}
                                            </span>
                                          ))}
                                          {Array.isArray(it.complaintExpenses) && it.complaintExpenses.length > 0 && it.complaintExpenses.map((cx, idx) => (
                                            <span key={`ce-${idx}`} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-orange-100 text-orange-800 border border-orange-200">
                                              {cx.name} • {cx.quantity} {cx.uom} • {getCurrencySymbol(currency)}{Number(cx.totalAmount || 0).toFixed(2)}
                                            </span>
                                          ))}
                                          {(Number(it.expenseTotal || 0) > 0) && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-amber-200 text-amber-900 font-semibold">
                                              Manual total: {getCurrencySymbol(currency)}{Number(it.expenseTotal || 0).toFixed(2)}
                                            </span>
                                          )}
                                          {(Number(it.complaintExpenseTotal || 0) > 0) && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-orange-200 text-orange-900 font-semibold">
                                              Items total: {getCurrencySymbol(currency)}{Number(it.complaintExpenseTotal || 0).toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {/* Commission base amount summary */}
                                    <div className="mt-1 flex flex-wrap items-center gap-1">
                                      {Number(it.commissionBaseAmount || 0) > 0 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-semibold text-teal-700 bg-teal-50 border border-teal-200">
                                          Comm Base: {getCurrencySymbol(currency)}{Number(it.commissionBaseAmount || 0).toFixed(2)}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                        Final Comm: {getCurrencySymbol(currency)}{Number(it.finalCommissionAmount || it.commissionAmount || 0).toFixed(2)} ({Number(it.commissionPercent || 0)}%)
                                      </span>
                                    </div>
                                    {/* Post-commission expenses */}
                                    {Array.isArray(it.postCommissionExpenses) && it.postCommissionExpenses.length > 0 && (
                                      <div className="mt-1">
                                        <div className="text-[9px] text-gray-600 font-semibold mb-0.5">Post-commission expenses:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {it.postCommissionExpenses.map((pce, iPce) => (
                                            <span key={`pce-${iPce}`} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-violet-100 text-violet-800 border border-violet-200">
                                              {pce.name}: {getCurrencySymbol(currency)}{Number(pce.price || 0).toFixed(2)}
                                            </span>
                                          ))}
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-violet-200 text-violet-900 font-semibold">
                                            Post-exp total: {getCurrencySymbol(currency)}{it.postCommissionExpenses.reduce((s, e) => s + Number(e.price || 0), 0).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    {/* Add Expense button / inline form */}
                                    {permissions.canUpdate && (
                                    <div className="mt-2">
                                      {addExpenseRow !== it.commissionId ? (
                                        <button
                                          onClick={() => { setAddExpenseRow(it.commissionId); setNewExpenses([{ name: "", price: "" }]); }}
                                          className="px-2 py-1 text-[9px] rounded-md bg-violet-600 hover:bg-violet-700 text-white font-medium transition-all"
                                        >
                                          + Add Expense
                                        </button>
                                      ) : (
                                        <div className="rounded-md border border-violet-200 bg-violet-50/40 p-2 mt-1">
                                          <div className="text-[9px] font-semibold text-violet-800 mb-1.5">Add Expenses</div>
                                          {newExpenses.map((exp, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 mb-1">
                                              <input
                                                type="text"
                                                placeholder="Expense name"
                                                value={exp.name}
                                                onChange={(e) => setNewExpenses((prev) => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                                                className="flex-1 px-1.5 py-1 text-[9px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400"
                                              />
                                              <input
                                                type="number"
                                                placeholder="Price"
                                                min="0"
                                                value={exp.price}
                                                onChange={(e) => setNewExpenses((prev) => prev.map((x, i) => i === idx ? { ...x, price: e.target.value } : x))}
                                                className="w-20 px-1.5 py-1 text-[9px] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400"
                                              />
                                              {newExpenses.length > 1 && (
                                                <button
                                                  onClick={() => setNewExpenses((prev) => prev.filter((_, i) => i !== idx))}
                                                  className="text-[9px] text-red-500 hover:text-red-700 px-1"
                                                >
                                                  ✕
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                          <div className="flex items-center gap-1.5 mt-1">
                                            <button
                                              onClick={() => setNewExpenses((prev) => [...prev, { name: "", price: "" }])}
                                              className="px-2 py-1 text-[9px] rounded-md border border-violet-300 text-violet-700 hover:bg-violet-100"
                                            >
                                              + Add Row
                                            </button>
                                            <button
                                              disabled={addExpenseLoading}
                                              onClick={() => handleAddExpense(it.commissionId)}
                                              className="px-2 py-1 text-[9px] rounded-md bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50"
                                            >
                                              {addExpenseLoading ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                              onClick={() => { setAddExpenseRow(null); setNewExpenses([{ name: "", price: "" }]); }}
                                              className="px-2 py-1 text-[9px] rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    )}
                                    <div className="border-t border-gray-100 my-2" />
                                    {it.patientId && patientInfoMap[it.patientId]?.full && (() => {
                                      const full = patientInfoMap[it.patientId].full;
                                      const outMemIds = new Set((full.membershipTransfers || []).filter(t => t.type === 'out').map(t => String(t.membershipId)));
                                      const outPkgIds = new Set((full.packageTransfers || []).filter(t => t.type === 'out').map(t => String(t.packageId)));
                                      const showMembership = full.membership === "Yes" && full.membershipId && !outMemIds.has(String(full.membershipId));
                                      const showPackage = full.package === "Yes" && full.packageId && !outPkgIds.has(String(full.packageId));
                                      if (!showMembership && !showPackage) return null;
                                      return (
                                        <div className="mt-1 flex flex-wrap items-center gap-1">
                                          {showMembership && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-purple-100 text-purple-700">
                                              Membership active
                                            </span>
                                          )}
                                          {showPackage && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] bg-blue-100 text-blue-700">
                                              Package assigned
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    {/* Detailed Membership Info */}
                                    {it.patientId && patientInfoMap[it.patientId]?.full && (
                                      <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                        {(() => {
                                          const full = patientInfoMap[it.patientId].full;
                                          const outIds = new Set((full.membershipTransfers || []).filter(t => t.type === 'out').map(t => String(t.membershipId)));
                                          const list = Array.isArray(patientInfoMap[it.patientId].displayMemberships) ? patientInfoMap[it.patientId].displayMemberships : [];
                                          const filtered = list.filter(m => m.membershipId && !outIds.has(String(m.membershipId)));
                                          if (filtered.length === 0) return null;
                                          return filtered.map((mItem, idx) => {
                                            const mId = mItem.membershipId;
                                            const m = membershipList.find(x => String(x._id) === String(mId));
                                            const name = m?.name || "Membership";
                                            const start = mItem.startDate ? new Date(mItem.startDate).toLocaleDateString() : "-";
                                            const end = mItem.endDate ? new Date(mItem.endDate).toLocaleDateString() : "-";
                                            const usageMap = patientInfoMap[it.patientId].membershipUsageMap || {};
                                            const values = Object.entries(usageMap)
                                              .filter(([k]) => k.startsWith(String(mId) + "|"))
                                              .map(([, v]) => v)
                                              .filter(Boolean);
                                            const totalFree = values.reduce((s, u) => s + (u.totalFreeConsultations || 0), 0);
                                            const usedFree = values.reduce((s, u) => s + (u.usedFreeConsultations || 0), 0);
                                            const remaining = Math.max(0, totalFree - usedFree);
                                            const inTransferred = Array.isArray(full.membershipTransfers) && full.membershipTransfers.some(t => t.type === 'in' && String(t.membershipId) === String(mId));
                                            const memKey = `${mId}|${start}|${end}`;
                                            const isOpen = !!expandedMemberships[memKey];
                                            return (
                                              <div key={idx} className="rounded-md border border-purple-200 bg-purple-50/40 p-1.5">
                                                <div className="text-[9px] font-semibold text-purple-800 mb-0.5">Membership</div>
                                                <div className="flex flex-wrap items-center gap-1">
                                                  <span className="inline-flex px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[8px]">{name}</span>
                                                  <span className="text-[8px] text-gray-600">From {start} to {end}</span>
                                                  {inTransferred && (
                                                    <span className="inline-flex px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[8px]">Transferred in</span>
                                                  )}
                                                  <button
                                                    onClick={() => setExpandedMemberships(prev => ({ ...prev, [memKey]: !prev[memKey] }))}
                                                    className="ml-auto inline-flex px-1.5 py-0.5 rounded-md bg-white border border-purple-200 text-[8px] text-purple-700 hover:bg-purple-100"
                                                  >
                                                    {isOpen ? "Hide details" : "Included"}
                                                  </button>
                                                </div>
                                                {isOpen && (
                                                  <div className="mt-2 rounded-md bg-white border border-purple-100 p-2">
                                                    <div className="text-[11px] text-gray-700">
                                                      Free consults: <span className="font-semibold">{usedFree}/{totalFree}</span>{remaining > 0 ? <span className="ml-2 inline-flex px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Remaining {remaining}</span> : null}
                                                    </div>
                                                    {m?.benefits && (
                                                      <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {m.benefits.priorityBooking ? (
                                                          <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px]">Priority booking</span>
                                                        ) : null}
                                                        {typeof m.benefits.discountPercentage === 'number' && m.benefits.discountPercentage > 0 ? (
                                                          <span className="inline-flex px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[11px]">Discount {m.benefits.discountPercentage}%</span>
                                                        ) : null}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          });
                                        })()}
                                        {/* Detailed Package Info */}
                                        {(() => {
                                          const full = patientInfoMap[it.patientId].full || {};
                                          const usage = Array.isArray(patientInfoMap[it.patientId].packageUsage) ? patientInfoMap[it.patientId].packageUsage : [];
                                          const usageList = usage.filter(pkg => pkg && pkg.packageName);
                                          if (usageList.length > 0) {
                                            return usageList.map((pkg, idx) => {
                                              const totalUsed = typeof pkg.totalSessions === 'number'
                                                ? pkg.totalSessions
                                                : (Array.isArray(pkg.treatments) ? pkg.treatments.reduce((s, t) => s + (t.totalUsedSessions || 0), 0) : 0);
                                              const inTransferred = !!pkg.isTransferred;
                                              const pkgKey = `name:${pkg.packageName}`;
                                              const isOpen = !!expandedPackages[pkgKey];
                                              return (
                                                <div key={`pkg-usage-${idx}`} className="rounded-md border border-blue-200 bg-blue-50/40 p-2">
                                                  <div className="text-[11px] font-semibold text-blue-800 mb-1">Package</div>
                                                  <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px]">{pkg.packageName}</span>
                                                    {inTransferred && (
                                                      <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px]">Transferred in</span>
                                                    )}
                                                    <button
                                                      onClick={() => setExpandedPackages(prev => ({ ...prev, [pkgKey]: !prev[pkgKey] }))}
                                                      className="ml-auto inline-flex px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[11px] text-blue-700 hover:bg-blue-100"
                                                    >
                                                      {isOpen ? "Hide treatments" : "Included"}
                                                    </button>
                                                  </div>
                                                  <div className="mt-1 text-[11px] text-gray-700">Used sessions: <span className="font-semibold">{totalUsed}</span></div>
                                                  {isOpen && Array.isArray(pkg.treatments) && pkg.treatments.length > 0 && (
                                                    <div className="mt-2 rounded-md bg-white border border-blue-100 p-2">
                                                      <div className="text-[11px] text-gray-700 font-medium mb-1">Treatments</div>
                                                      <div className="flex flex-wrap gap-1.5">
                                                        {pkg.treatments.map((t, i2) => (
                                                          <span key={i2} className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                                                            {t.treatmentName} {t.totalUsedSessions || 0}/{t.maxSessions || 0}
                                                          </span>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            });
                                          }
                                          // Fallback: show assigned packages when usage is empty
                                          const transfersOutIds = new Set((full.packageTransfers || []).filter(t => t.type === 'out').map(t => String(t.packageId)));
                                          const assigned = Array.isArray(full.packages) ? full.packages : [];
                                          const mainPkgId = full.packageId ? String(full.packageId) : null;
                                          const allAssignedIds = new Set(assigned.map(p => String(p.packageId)));
                                          if (mainPkgId) allAssignedIds.add(mainPkgId);
                                          const filteredIds = Array.from(allAssignedIds).filter(pid => !transfersOutIds.has(pid));
                                          if (filteredIds.length === 0) return null;
                                          return filteredIds.map((pid, idx) => {
                                            const pkgDef = packageList.find(x => String(x._id) === String(pid));
                                            const name = pkgDef?.name || "Package";
                                            const inTransferred = Array.isArray(full.packageTransfers) && full.packageTransfers.some(t => t.type === 'in' && String(t.packageId) === String(pid));
                                            const pkgKey = `id:${pid}`;
                                            const isOpen = !!expandedPackages[pkgKey];
                                            return (
                                              <div key={`pkg-assigned-${idx}`} className="rounded-md border border-blue-200 bg-blue-50/40 p-2">
                                                <div className="text-[11px] font-semibold text-blue-800 mb-1">Package</div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px]">{name}</span>
                                                  {inTransferred && (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px]">Transferred in</span>
                                                  )}
                                                  <button
                                                    onClick={() => setExpandedPackages(prev => ({ ...prev, [pkgKey]: !prev[pkgKey] }))}
                                                    className="ml-auto inline-flex px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[11px] text-blue-700 hover:bg-blue-100"
                                                  >
                                                    {isOpen ? "Hide treatments" : "Included"}
                                                  </button>
                                                </div>
                                                {isOpen && Array.isArray(pkgDef?.treatments) && pkgDef.treatments.length > 0 && (
                                                  <div className="mt-2 rounded-md bg-white border border-blue-100 p-2">
                                                    <div className="text-[11px] text-gray-700 font-medium mb-1">Treatments</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                      {pkgDef.treatments.map((t, i2) => (
                                                        <span key={i2} className="inline-flex px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px]">
                                                          {t.treatmentName} 0/{t.sessions || 0}
                                                        </span>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ClinicCommissionPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicCommissionPage = withClinicAuth(ClinicCommissionPage);
ProtectedClinicCommissionPage.getLayout = ClinicCommissionPage.getLayout;

export default ProtectedClinicCommissionPage;
