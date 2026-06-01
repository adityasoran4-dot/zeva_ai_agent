import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import { useRouter } from "next/router";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { ShoppingCart, Filter, Info, Printer, Loader2, Building2 } from "lucide-react";
import debounce from "lodash.debounce";
import AddPurchaseReturnModal from "./_components/AddPurchaseReturnModal";
import EditPurchaseReturnModal from "./_components/EditPurchaseReturnModal";
import DeletePurchaseReturnModal from "./_components/DeletePurchaseReturnModal";
import FilterModal from "./_components/FilterModal";
import PurchaseReturnDetailModal from "./_components/PurchaseReturnDetailModal";

const MODULE_KEY = "clinic_stock_purchase_return";

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
      window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const PurchaseReturnPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clinicCurrency, setClinicCurrency] = useState<string>("INR");
  const [pagination, setPagination] = useState({
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });
  const [stats, setStats] = useState<any>({
    totalRecords: 0,
    totalValue: 0,
    uniqueSuppliersCount: 0,
    uniqueBranchesCount: 0,
    totalItems: 0,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [recordToDetail, setRecordToDetail] = useState<any | null>(null);

  // Filter modal
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    branch: "",
    supplier: "",
    purchaseReturnNo: "",
    purchasedOrder: "",
    fromDate: "",
    toDate: "",
    status: "",
  });

  // Fetch clinic currency
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const token = getTokenByPath();
        const res = await axios.get("/api/clinics/myallClinic", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success && res.data.clinic?.currency) {
          setClinicCurrency(res.data.clinic.currency);
        }
      } catch (err) {
        console.error("Error fetching clinic currency:", err);
      }
    };
    fetchClinicCurrency();
  }, []);

  // Detect agent route and token
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const hasAgent =
        Boolean(
          localStorage.getItem("agentToken") ||
            sessionStorage.getItem("agentToken"),
        ) ||
        Boolean(
          localStorage.getItem("staffToken") ||
            sessionStorage.getItem("staffToken"),
        ) ||
        Boolean(
          localStorage.getItem("userToken") ||
            sessionStorage.getItem("userToken"),
        );
      setHasAgentToken(hasAgent);
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const agentPath =
      router?.pathname?.startsWith("/agent/") ||
      window.location.pathname?.startsWith("/agent/");
    setIsAgentRoute(agentPath && hasAgentToken);
  }, [router.pathname, hasAgentToken]);

  // Helper function to get user info from token
  const getUserInfo = (): { role: string | null; id: string | null } => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      for (const key of TOKEN_PRIORITY) {
        const token =
          window.localStorage.getItem(key) ||
          window.sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) =>
                    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
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
  };

  // Helper function to get user role from token
  const getUserRole = (): string | null => {
    return getUserInfo().role;
  };

  // Handle permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    let isMounted = true;

    // Check which token type is being used
    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken")
        : null;
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken")
        : null;

    const userRole = getUserRole();
    const authToken =
      clinicToken || doctorToken || agentToken || staffToken || userToken;

    // ✅ For admin role, grant full access (bypass permission checks)
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

    // ✅ For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
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
            console.log("Clinic Sidebar Permissions Response:", res.data);
            // Check if permissions array exists and is not null
            // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              console.log("No permissions set, granting full access");
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the clinic_stock_purchase_return module OR parent clinic_stock module's subModules
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for clinic_stock_purchase_return module variations
                if (p.module === "clinic_stock_purchase_return") return true;
                if (p.module === "stock_purchase_return") return true;
                return false;
              });

              console.log("Direct module permission found:", modulePermission);

              // If not found as direct module, check parent clinic_stock module's subModules
              if (!modulePermission) {
                const parentStockModule = res.data.permissions.find((p: any) => 
                  p?.module === "clinic_stock" && Array.isArray(p.subModules)
                );
                
                console.log("Parent stock module found:", parentStockModule);
                
                if (parentStockModule) {
                  modulePermission = parentStockModule.subModules.find((sm: any) => 
                    sm?.moduleKey === "clinic_stock_purchase_return"
                  );
                  console.log("Submodule permission found:", modulePermission);
                }
              }

              if (modulePermission) {
                const actions = modulePermission.actions || {};
                console.log("Module permission actions:", actions);

                // Check if "all" is true, which grants all permissions
                const moduleAll =
                  actions.all === true ||
                  actions.all === "true" ||
                  String(actions.all).toLowerCase() === "true";
                const moduleCreate =
                  actions.create === true ||
                  actions.create === "true" ||
                  String(actions.create).toLowerCase() === "true";
                const moduleRead =
                  actions.read === true ||
                  actions.read === "true" ||
                  String(actions.read).toLowerCase() === "true";
                const moduleUpdate =
                  actions.update === true ||
                  actions.update === "true" ||
                  String(actions.update).toLowerCase() === "true";
                const moduleDelete =
                  actions.delete === true ||
                  actions.delete === "true" ||
                  String(actions.delete).toLowerCase() === "true";

                const newPermissions = {
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                };
                console.log("Setting permissions:", newPermissions);
                setPermissions(newPermissions);
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
          console.log(
            "Fetching Agent/Staff Permissions for clinic_stock_purchase_return...",
          );
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: MODULE_KEY },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          const data = res.data;
          console.log("Agent Permissions API Response:", data);

          if (!isMounted) return;

          // Default to true if module not found in permissions (matches backend logic)
          if (
            !data?.permissions &&
            data?.error?.includes("not found in agent permissions")
          ) {
            console.log(
              "Module not found in permissions, granting full access by default",
            );
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          const actions =
            data?.permissions?.actions || data?.data?.moduleActions || {};
          const isTrue = (val: any) =>
            val === true ||
            val === "true" ||
            String(val || "").toLowerCase() === "true";

          const canAll = isTrue(actions.all);

          const newPerms = {
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          };

          setPermissions(newPerms);
          console.log("Setting permissions:", newPerms);
        } catch (err: any) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            // Default to full access on error (backward compatibility)
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

      fetchPermissions();
      return;
    }

    // Default to full access for other cases
    setPermissions({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
    setPermissionsLoaded(true);
  }, [isAgentRoute]);

  const fetchRecords = useCallback(
    debounce(async (page = 1, search = "", filters: any = {}) => {
      try {
        setLoading(true);
        const token = getTokenByPath();
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("limit", String(pagination.limit || 10));
        if (search) params.append("search", encodeURIComponent(search));
        if (filters.branch) params.append("branch", filters.branch);
        if (filters.purchaseReturnNo)
          params.append("purchaseReturnNo", filters.purchaseReturnNo);
        if (filters.purchasedOrder)
          params.append("purchasedOrder", filters.purchasedOrder);

        const res = await axios.get(
          `/api/stocks/purchase-returns?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.data?.success) {
          setRecords(res.data.data.records || []);
          setPagination((prev) => ({
            ...prev,
            ...(res.data.data.pagination || {}),
          }));
          setStats(res.data.data.statistics || {});
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Error fetching purchase returns:", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [pagination.limit],
  );

  useEffect(() => {
    fetchRecords(1, searchTerm, filterData);
  }, [fetchRecords]);

  useEffect(() => {
    fetchRecords(1, searchTerm, filterData);
  }, [searchTerm, filterData, fetchRecords]);

  // Close dropdowns when clicking outside (match purchase-orders behavior)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menus = document.querySelectorAll("[id^=menu-]");
      menus.forEach((menu) => {
        if (
          menu instanceof HTMLElement &&
          !menu.contains(event.target as Node)
        ) {
          menu.classList.remove("block");
          menu.classList.add("hidden");
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAdd = () => setIsAddOpen(true);
  const handleEdit = (r: any) => {
    setRecordToEdit(r);
    setIsEditOpen(true);
  };
  const handleDelete = (r: any) => {
    setRecordToDelete(r);
    setIsDeleteOpen(true);
  };
  const handleDetail = (r: any) => {
    setRecordToDetail(r);
    setIsDetailOpen(true);
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      setIsDeleting(true);
      const token = getTokenByPath();
      const res = await axios.delete(
        `/api/stocks/purchase-returns/delete-purchase-return/${recordToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        setRecords((prev) => prev.filter((p) => p._id !== recordToDelete._id));
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete purchase return");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setRecordToDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchRecords(page, searchTerm, filterData);
  };

  const displayData = records || [];

  // If permissions are not loaded yet, show loading state
  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-700">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
          <p className="text-xs sm:text-sm">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // If canRead is false but canCreate is true, show only add button
  if (!permissions.canRead && permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="max-w-9xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Purchase Returns
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Manage your purchase returns and returned items
                </p>
              </div>
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleAdd}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Return
              </button>

              {/* Add Purchase Return Modal */}
              <AddPurchaseReturnModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => fetchRecords(1, searchTerm, filterData)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If canRead is false (and canCreate is also false), show access denied
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-700 mb-4">
            You do not have permission to view purchase returns.
          </p>
          <p className="text-xs text-gray-600">
            Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="mb-8">
        <div className="max-w-9xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Purchase Returns
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Manage your purchase returns and returned items
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permissions.canRead && (
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow-sm transition-all text-xs sm:text-sm font-medium"
                >
                  <Filter className="h-5 w-5" /> Advanced Filter
                </button>
              )}
              {permissions.canCreate && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm transition-all text-xs sm:text-sm font-medium"
                >
                  <PlusIcon className="h-5 w-5 mr-2" /> Add Return
                </button>
              )}
            </div>

            {permissions.canCreate && (
              <AddPurchaseReturnModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() => fetchRecords(1, searchTerm, filterData)}
              />
            )}
            {permissions.canDelete && (
              <DeletePurchaseReturnModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
                prNo={recordToDelete?.purchaseReturnNo || ""}
              />
            )}
            {permissions.canUpdate && (
              <EditPurchaseReturnModal
                isOpen={isEditOpen}
                onClose={() => {
                  setIsEditOpen(false);
                  setRecordToEdit(null);
                }}
                record={recordToEdit}
                onSuccess={() =>
                  fetchRecords(pagination.currentPage, searchTerm, filterData)
                }
              />
            )}
            <PurchaseReturnDetailModal
              isOpen={isDetailOpen}
              onClose={() => {
                setIsDetailOpen(false);
                setRecordToDetail(null);
              }}
              purchaseReturn={recordToDetail}
            />
          </div>
        </div>
      </div>

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(f: any) => {
          setFilterData(f);
          fetchRecords(1, searchTerm, f);
        }}
        filterData={filterData}
        setFilterData={setFilterData}
        title="Advanced Filter"
      />

      {permissions.canRead && (
        <>
      {/* Stats */}
      <div className="max-w-9xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">PR</span>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500 uppercase">
                  Total Returns
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalRecords || displayData.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500 uppercase">
                  Suppliers
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.uniqueSuppliersCount || "0"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500 uppercase">
                  Branches
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.uniqueBranchesCount || "0"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14"
                  />
                </svg>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500 uppercase">
                  Total Items
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalItems?.toLocaleString() || "0"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-9xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase Returns
            </h2>
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by PR number, supplier or order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Loading purchase returns...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No Purchase Returns found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first purchase return.
              </p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-xl"
              >
                {" "}
                <ShoppingCart className="h-5 w-5" /> Add First Return
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PR No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Order No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((r: any, idx: number) => (
                    <React.Fragment key={r._id}>
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {(
                                  (r.purchasedOrder?.purchaseNo ||
                                    r.purchaseReturnNo ||
                                    "") + ""
                                )
                                  .toString()
                                  .slice(-2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {r.purchaseReturnNo}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {r._id?.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.branch?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(r.date || r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {r.purchasedOrder?.orderNo ||
                            r.purchasedOrder?._id?.substring(0, 8) ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.purchasedOrder?.supplier?.name ||
                            r.supplier?.name ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCurrencySymbol(clinicCurrency)}{" "}
                          {(r.totalAmount || r.total || 0).toFixed
                            ? (r.totalAmount || r.total || 0).toFixed(2)
                            : r.totalAmount || r.total || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${({ New: "bg-blue-100 text-blue-800", Approved: "bg-green-100 text-green-800", Rejected: "bg-red-100 text-red-800", Cancelled: "bg-gray-100 text-gray-800" } as any)[r.status] || "bg-gray-100 text-gray-800"}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${({ New: "bg-blue-500", Approved: "bg-green-500", Rejected: "bg-red-500", Cancelled: "bg-gray-500" } as any)[r.status] || "bg-gray-500"}`}
                            />
                            {String(r.status || "").replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => {
                                const currentMenuState = document
                                  .getElementById(`menu-${r._id}`)
                                  ?.classList.contains("block");
                                // Close all other menus
                                document
                                  .querySelectorAll("[id^=menu-]")
                                  .forEach((el) => {
                                    if (el.id !== `menu-${r._id}`) {
                                      el.classList.remove("block");
                                      el.classList.add("hidden");
                                    }
                                  });
                                // Toggle current menu
                                const menuEl = document.getElementById(
                                  `menu-${r._id}`,
                                );
                                if (menuEl) {
                                  if (currentMenuState) {
                                    menuEl.classList.remove("block");
                                    menuEl.classList.add("hidden");
                                  } else {
                                    menuEl.classList.remove("hidden");
                                    menuEl.classList.add("block");
                                  }
                                }
                              }}
                              className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                              title="More options"
                            >
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </button>
                            <div
                              id={`menu-${r._id}`}
                              className={`hidden absolute ${idx >= displayData?.length - 2 ? "bottom-0 right-0" : "right-0"} z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none`}
                            >
                              <div className="py-1" role="none">
                                {permissions.canUpdate && (
                                  <button
                                    onClick={() => {
                                      handleEdit(r);
                                      // Close the dropdown after clicking
                                      const menuEl = document.getElementById(
                                        `menu-${r._id}`,
                                      );
                                      if (menuEl) {
                                        menuEl.classList.remove("block");
                                        menuEl.classList.add("hidden");
                                      }
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <div className="flex items-center">
                                      <PencilIcon className="h-4 w-4 mr-2" />
                                      Edit
                                    </div>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    // Open print page in new tab
                                    const printUrl = `/clinic/stocks/purchase-returns/print-purchase-return/?prId=${r._id}`;
                                    window.open(
                                      printUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                    const menuEl = document.getElementById(
                                      `menu-${r._id}`,
                                    );
                                    if (menuEl) {
                                      menuEl.classList.remove("block");
                                      menuEl.classList.add("hidden");
                                    }
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <div className="flex items-center">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDetail(r);
                                    const menuEl = document.getElementById(
                                      `menu-${r._id}`,
                                    );
                                    if (menuEl) {
                                      menuEl.classList.remove("block");
                                      menuEl.classList.add("hidden");
                                    }
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <div className="flex items-center">
                                    <Info className="h-4 w-4 mr-2" />
                                    Detail
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    toggleRowExpansion(r._id);
                                    const menuEl = document.getElementById(
                                      `menu-${r._id}`,
                                    );
                                    if (menuEl) {
                                      menuEl.classList.remove("block");
                                      menuEl.classList.add("hidden");
                                    }
                                  }}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <div className="flex items-center">
                                    <svg
                                      className="h-4 w-4 mr-2"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                    {expandedRows[r._id]
                                      ? "Hide Items"
                                      : "Show Items"}
                                  </div>
                                </button>
                                {permissions.canDelete && (
                                  <button
                                    onClick={() => {
                                      handleDelete(r);
                                      const menuEl = document.getElementById(
                                        `menu-${r._id}`,
                                      );
                                      if (menuEl) {
                                        menuEl.classList.remove("block");
                                        menuEl.classList.add("hidden");
                                      }
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                                  >
                                    <div className="flex items-center">
                                      <TrashIcon className="h-4 w-4 mr-2" />
                                      Delete
                                    </div>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[r._id] && (
                        <tr>
                          <td
                            colSpan={12}
                            className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200"
                          >
                            <div className="ml-8 mr-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                  <svg
                                    className="w-5 h-5 text-purple-600 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                  </svg>
                                  Items in Return #
                                  {r.purchaseReturnNo ||
                                    r.purchasedOrder?.orderNo}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1 text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                      />
                                    </svg>
                                    <span>
                                      {
                                        (
                                          r.purchasedOrder?.items ||
                                          r.items ||
                                          []
                                        ).length
                                      }{" "}
                                      items
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <svg
                                      className="w-4 h-4 mr-1 text-gray-500"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span>
                                      {getCurrencySymbol(clinicCurrency)}{" "}
                                      {(
                                        r.purchasedOrder?.items ||
                                        r.items ||
                                        []
                                      )
                                        .reduce(
                                          (sum: number, item: any) =>
                                            sum +
                                            (item.totalPrice ||
                                              item.total ||
                                              0),
                                          0,
                                        )
                                        .toFixed(2)}{" "}
                                      total
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Item
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Qty
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          UOM
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Unit Price
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Total
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Discount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Net Price
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          VAT %
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          VAT
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Net + VAT
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Free Qty
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {(
                                        r.purchasedOrder?.items ||
                                        r.items ||
                                        []
                                      ).map((item: any, itemIndex: number) => (
                                        <tr
                                          key={itemIndex}
                                          className="hover:bg-purple-50 transition-colors duration-150"
                                        >
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">
                                                  {(
                                                    item.name ||
                                                    item.itemName ||
                                                    ""
                                                  ).charAt(0)}
                                                </span>
                                              </div>
                                              <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {item.name ||
                                                    item.itemName ||
                                                    "-"}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="text-sm text-gray-600 max-w-xs truncate">
                                              {item.description ||
                                                item.desc || (
                                                  <span className="text-gray-400 italic">
                                                    No description
                                                  </span>
                                                )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {item.quantity || item.qty || 0}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                              {item.uom || "N/A"}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            <div className="flex items-center">
                                              <span className="text-green-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {(
                                                item.unitPrice ||
                                                item.price ||
                                                0
                                              ).toFixed
                                                ? (
                                                    item.unitPrice ||
                                                    item.price ||
                                                    0
                                                  ).toFixed(2)
                                                : item.unitPrice ||
                                                  item.price ||
                                                  0}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            <div className="flex items-center">
                                              <span className="text-green-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {(
                                                item.totalPrice ||
                                                item.total ||
                                                0
                                              ).toFixed
                                                ? (
                                                    item.totalPrice ||
                                                    item.total ||
                                                    0
                                                  ).toFixed(2)
                                                : item.totalPrice ||
                                                  item.total ||
                                                  0}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            <div className="flex items-center space-x-1">
                                              <span>
                                                {item.discount || 0}
                                                {item.discountType ===
                                                "Percentage"
                                                  ? "%"
                                                  : ""}
                                              </span>
                                              {(item.discount || 0) > 0 && (
                                                <span className="text-xs text-gray-500">
                                                  ({item.discountType})
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            <div className="flex items-center">
                                              <span className="text-blue-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {(
                                                item.netPrice ||
                                                item.totalPrice ||
                                                0
                                              ).toFixed
                                                ? (
                                                    item.netPrice ||
                                                    item.totalPrice ||
                                                    0
                                                  ).toFixed(2)
                                                : item.netPrice ||
                                                  item.totalPrice ||
                                                  0}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            <span>
                                              {item.vatPercentage || 0}%
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            <div className="flex items-center">
                                              <span className="text-orange-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {(item.vatAmount || 0).toFixed
                                                ? (item.vatAmount || 0).toFixed(
                                                    2,
                                                  )
                                                : item.vatAmount || 0}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                            <div className="flex items-center">
                                              <span className="text-purple-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {(
                                                item.netPlusVat ||
                                                (item.netPrice ||
                                                  item.totalPrice) +
                                                  (item.vatAmount || 0) ||
                                                0
                                              ).toFixed
                                                ? (
                                                    item.netPlusVat ||
                                                    (item.netPrice ||
                                                      item.totalPrice) +
                                                      (item.vatAmount || 0) ||
                                                    0
                                                  ).toFixed(2)
                                                : item.netPlusVat ||
                                                  (item.netPrice ||
                                                    item.totalPrice) +
                                                    (item.vatAmount || 0) ||
                                                  0}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            <div className="flex items-center">
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {item.freeQuantity || 0}
                                              </span>
                                              {(item.freeQuantity || 0) > 0 &&
                                                item.uom && (
                                                  <span className="ml-1 text-xs text-gray-500">
                                                    {item.uom}
                                                  </span>
                                                )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td
                                          colSpan={5}
                                          className="px-4 py-3 text-sm font-medium text-gray-700 text-right"
                                        >
                                          Return Totals:
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="text-green-600 mr-1">
                                              {getCurrencySymbol(clinicCurrency)}
                                            </span>
                                            {(
                                              r.purchasedOrder?.items ||
                                              r.items ||
                                              []
                                            )
                                              .reduce(
                                                (sum: number, item: any) =>
                                                  sum +
                                                  (item.totalPrice ||
                                                    item.total ||
                                                    0),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                          <span className="text-gray-500">
                                            Discounts:
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="text-blue-600 mr-1">
                                              {getCurrencySymbol(clinicCurrency)}
                                            </span>
                                            {(
                                              r.purchasedOrder?.items ||
                                              r.items ||
                                              []
                                            )
                                              .reduce(
                                                (sum: number, item: any) =>
                                                  sum +
                                                  (item.discountAmount || 0),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                          <span className="text-gray-500">
                                            VAT:
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="text-orange-600 mr-1">
                                              {getCurrencySymbol(clinicCurrency)}
                                            </span>
                                            {(
                                              r.purchasedOrder?.items ||
                                              r.items ||
                                              []
                                            )
                                              .reduce(
                                                (sum: number, item: any) =>
                                                  sum + (item.vatAmount || 0),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="text-purple-600 mr-1">
                                              {getCurrencySymbol(clinicCurrency)}
                                            </span>
                                            {(
                                              r.purchasedOrder?.items ||
                                              r.items ||
                                              []
                                            )
                                              .reduce(
                                                (sum: number, item: any) =>
                                                  sum +
                                                  (item.netPlusVat ||
                                                    (item.netPrice ||
                                                      item.totalPrice) +
                                                      (item.vatAmount || 0) ||
                                                    0),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </div>
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
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

          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalResults,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{pagination.totalResults}</span>{" "}
                results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map(
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${pageNum === pagination.currentPage ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

PurchaseReturnPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

const ProtectedPurchaseReturnPage = withClinicAuth(
  PurchaseReturnPage,
) as NextPageWithLayout;
ProtectedPurchaseReturnPage.getLayout = PurchaseReturnPage.getLayout;

export default ProtectedPurchaseReturnPage;
