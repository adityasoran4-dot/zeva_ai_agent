import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useState, useCallback, useEffect} from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { PurchaseRecord } from "@/types/stocks";
import debounce from "lodash.debounce";
import AddPurchaseRequestModal from "./_components/AddPurchaseRequestModal";
import DeletePurchaseRequestModal from "./_components/DeletePurchaseRequestModal";
import EditPurchaseRequestModal from "./_components/EditPurchaseRequestModal";
import PurchaseRequestDetailModal from "./_components/PurchaseRequestDetailModal";
import FilterModal from "./_components/FilterModal";
import { Printer, Loader2, Building2 } from "lucide-react";
import { useRouter } from "next/router";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";

const MODULE_KEY = "clinic_stock_purchase_requests";

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

const PurchaseRequestsPage: NextPageWithLayout = ({
  contextOverride = null,
}: {
  contextOverride?: "clinic" | "agent" | null;
}) => {
  const router = useRouter();
  const [_routeContext, setRouteContext] = useState<"clinic" | "agent">(
    contextOverride || "clinic",
  );
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);
  const token = getTokenByPath();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRecord[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [purchaseRequestToDelete, setPurchaseRequestToDelete] =
    useState<PurchaseRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [purchaseRequestToEdit, setPurchaseRequestToEdit] =
    useState<PurchaseRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [purchaseRequestForDetail, setPurchaseRequestForDetail] =
    useState<PurchaseRecord | null>(null);
  const [pagination, setPagination] = useState({
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    hasMore: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalValue: 0,
    avgValuePerRecord: 0,
    uniqueSuppliersCount: 0,
    uniqueBranchesCount: 0,
    totalItems: 0,
  });

  // Advanced Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    branch: "",
    supplier: "",
    orderNo: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    status: "",
  });

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

  useEffect(() => {
    if (contextOverride) {
      setRouteContext(contextOverride);
      return;
    }
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname || "";
    if (currentPath.startsWith("/agent/")) {
      setRouteContext("agent");
    } else {
      setRouteContext("clinic");
    }
  }, [contextOverride]);

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(
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
      canCreate: Boolean(
        agentPermissions.canAll || agentPermissions.canCreate,
      ),
      canUpdate: Boolean(
        agentPermissions.canAll || agentPermissions.canUpdate,
      ),
      canDelete: Boolean(
        agentPermissions.canAll || agentPermissions.canDelete,
      ),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

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

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    if (isAgentRoute) return;
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
              // Admin has set permissions - check the clinic_stock_purchase_requests module OR parent clinic_stock module's subModules
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for clinic_stock_purchase_requests module variations
                if (p.module === "clinic_stock_purchase_requests") return true;
                if (p.module === "clinic_stock_purchase_requests") return true;
                if (p.module === "stock_purchase_requests") return true;
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
                    sm?.moduleKey === "clinic_stock_purchase_requests"
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
            "Fetching Agent/Staff Permissions for clinic_stock_purchase_requests...",
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

  // Fetch purchase requests with proper error handling
  const fetchPurchaseRequests = useCallback(
    debounce(
      async (page: number = 1, search: string = "", filters: any = {}) => {
        try {
          setLoading(true);

          const token = getTokenByPath();
          // Build query parameters
          const params = new URLSearchParams();
          params.append("page", page.toString());
          params.append("limit", pagination.limit.toString());
          params.append("type", "Purchase_Request");

          if (search) {
            params.append("search", encodeURIComponent(search));
          }

          // Add filter parameters
          if (filters.branch) params.append("branch", filters.branch);
          if (filters.supplier) params.append("supplier", filters.supplier);
          if (filters.orderNo) params.append("orderNo", filters.orderNo);
          if (filters.fromDate) params.append("fromDate", filters.fromDate);
          if (filters.toDate) params.append("toDate", filters.toDate);
          if (filters.status) params.append("status", filters.status);

          const response = await axios.get(
            `/api/stocks/purchase-records?${params.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.data?.success) {
            setPurchaseRequests(response.data?.data?.records || []);
            setPagination((prev) => ({
              ...prev,
              ...response.data.data?.pagination,
            }));
            setStats(
              response.data?.data?.statistics || {
                totalRecords: 0,
                totalValue: 0,
                avgValuePerRecord: 0,
                uniqueSuppliersCount: 0,
                uniqueBranchesCount: 0,
                totalItems: 0,
              },
            );
          }
        } catch (error) {
          console.error("Error fetching purchase requests:", error);
          // Show empty state on error
          setPurchaseRequests([]);
        } finally {
          setLoading(false);
        }
      },
      300,
    ),
    [pagination.limit],
  );

  // Initial fetch on mount
  useEffect(() => {
    // Only fetch purchase requests if permissions are loaded and canRead is true
    if (permissionsLoaded && permissions.canRead) {
      fetchPurchaseRequests(1, "", filterData);
    } else if (permissionsLoaded) {
      // If canRead is false, don't fetch anything
      setLoading(false);
    }
  }, [permissionsLoaded, permissions.canRead]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchPurchaseRequests(page, searchTerm, filterData);
    },
    [fetchPurchaseRequests, searchTerm, filterData],
  );

  useEffect(() => {
    if (permissionsLoaded && permissions.canRead) {
      fetchPurchaseRequests(1, searchTerm, filterData);
    }
  }, [searchTerm, filterData, permissionsLoaded, permissions.canRead]);

  // Close dropdowns when clicking outside
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

  // Toggle row expansion for showing items
  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Use sample data if API is not working
  const displayData = purchaseRequests.length > 0 ? purchaseRequests : [];

  const handleAddPurchaseRequest = useCallback(() => {
    if (!permissions.canCreate) return;
    setIsAddModalOpen(true);
  }, [permissions.canCreate]);

  const handleDeleteClick = useCallback((purchaseRequest: PurchaseRecord) => {
    if (!permissions.canDelete) return;
    setPurchaseRequestToDelete(purchaseRequest);
    setIsDeleteModalOpen(true);
  }, [permissions.canDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!purchaseRequestToDelete || !permissions.canDelete) return;

    try {
      const token = getTokenByPath();
      setIsDeleting(true);
      const response = await axios.delete(
        `/api/stocks/purchase-records/delete-purchase-record/${purchaseRequestToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        // Refresh the list
        const updatedPurchaseRequests = purchaseRequests.filter(
          (pr) => pr._id !== purchaseRequestToDelete._id,
        );
        setPurchaseRequests(updatedPurchaseRequests);
        setIsDeleteModalOpen(false);
        setPurchaseRequestToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting purchase request:", error);
      alert("Failed to delete purchase request");
    } finally {
      setIsDeleting(false);
    }
  }, [
    purchaseRequestToDelete,
    fetchPurchaseRequests,
    pagination.currentPage,
    searchTerm,
    filterData,
    purchaseRequests,
    permissions.canDelete,
  ]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setPurchaseRequestToDelete(null);
  }, []);

  const handleEditClick = useCallback((purchaseRequest: PurchaseRecord) => {
    if (!permissions.canUpdate) return;
    setPurchaseRequestToEdit(purchaseRequest);
    setIsEditModalOpen(true);
  }, [permissions.canUpdate]);

  const handleEditCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setPurchaseRequestToEdit(null);
  }, []);

  const handleDetailClick = useCallback((purchaseRequest: PurchaseRecord) => {
    setPurchaseRequestForDetail(purchaseRequest);
    setIsDetailModalOpen(true);
  }, []);

  const handleDetailCancel = useCallback(() => {
    setIsDetailModalOpen(false);
    setPurchaseRequestForDetail(null);
  }, []);

  // If permissions are not loaded yet, show loading spinner
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

  // If canRead is false, show access denied
  if (!permissions.canRead && !permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-700 mb-4">
            You do not have permission to view purchase requests.
          </p>
          <p className="text-xs text-gray-600">
            Please contact your administrator to request access to the Purchase Requests module.
          </p>
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
                  Purchase Requests
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Manage your purchase requests and procurement workflow
                </p>
              </div>
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleAddPurchaseRequest}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Purchase Request
              </button>

              {/* Add Purchase Request Modal */}
              <AddPurchaseRequestModal
                token={token || ""}
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={(purchaseRequestData: PurchaseRecord) => {
                  setPurchaseRequests((prev) => [...prev, purchaseRequestData]);
                  fetchPurchaseRequests(
                    pagination.currentPage,
                    searchTerm,
                    filterData,
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="max-w-9xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Purchase Requests
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Manage your purchase requests and procurement workflow
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permissions.canRead && (
                <button
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                  onClick={() => setIsFilterOpen(true)}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  Advanced Filter
                </button>
              )}
              {permissions.canCreate && (
                <button
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                  onClick={handleAddPurchaseRequest}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Purchase Request
                </button>
              )}
            </div>

            {/* Add Purchase Request Modal */}
            {permissions.canCreate && (
              <AddPurchaseRequestModal
                token={token || ""}
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={(purchaseRequestData: PurchaseRecord) => {
                  setPurchaseRequests((prev) => [...prev, purchaseRequestData]);
                  fetchPurchaseRequests(
                    pagination.currentPage,
                    searchTerm,
                    filterData,
                  );
                }}
              />
            )}

            {/* Delete Purchase Request Modal */}
            {permissions.canDelete && (
              <DeletePurchaseRequestModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                purchaseRequestName={purchaseRequestToDelete?.orderNo}
                loading={isDeleting}
              />
            )}

            {/* Edit Purchase Request Modal */}
            {permissions.canUpdate && (
              <EditPurchaseRequestModal
                token={token || ""}
                isOpen={isEditModalOpen}
                onClose={handleEditCancel}
                purchaseRequestData={purchaseRequestToEdit}
                onSuccess={(purchaseRequestData) => {
                  const updatedPurchaseRequests = purchaseRequests.map((pr) =>
                    pr._id === purchaseRequestData._id ? purchaseRequestData : pr,
                  );
                  setPurchaseRequests(updatedPurchaseRequests);
                  fetchPurchaseRequests(
                    pagination.currentPage,
                    searchTerm,
                    filterData,
                  );
                }}
              />
            )}

            {/* Purchase Request Detail Modal */}
            <PurchaseRequestDetailModal
              isOpen={isDetailModalOpen}
              onClose={handleDetailCancel}
              purchaseRequest={purchaseRequestForDetail}
            />

            {/* Filter Modal */}
            {permissions.canRead && (
              <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(filters) => {
                  fetchPurchaseRequests(1, searchTerm, filters);
                }}
                filterData={filterData}
                setFilterData={setFilterData}
                title="Advanced Filter - Purchase Requests"
              />
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="max-w-9xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Purchase Requests Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">PR</span>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Requests
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.totalRecords || displayData.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Active purchase requests
              </div>
            </div>
          </div>

          {/* Suppliers Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 0 11-4 0 2 2 0 014 0zM7 10a2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Suppliers
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.uniqueSuppliersCount || "0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Unique suppliers</div>
            </div>
          </div>

          {/* Branches Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Branches
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.uniqueBranchesCount || "0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Active branches</div>
            </div>
          </div>

          {/* Total Items Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
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
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Items
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.totalItems?.toLocaleString() || "0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Items requested</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Data Table Section */}
      <div className="max-w-9xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Purchase Requests
              </h2>
              <div className="relative">
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
                  placeholder="Search by order number, supplier or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-600">Loading purchase requests...</p>
            </div>
          ) : displayData.length === 0 ? (
            /* Empty State */
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No purchase requests found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first purchase request.
              </p>
              {permissions.canCreate && (
                <button
                  onClick={handleAddPurchaseRequest}
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add First Request
                </button>
              )}
            </div>
          ) : (
            /* Data Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items Count
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayData.map((request, index: number) => (
                    <React.Fragment key={request._id}>
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {request.orderNo.charAt(
                                  request.orderNo.length - 2,
                                )}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.orderNo}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {request._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.supplier?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.branch?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.items.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          AED{" "}
                          {request.items
                            .reduce((sum, item) => sum + item.totalPrice, 0)
                            .toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              {
                                New: "bg-blue-100 text-blue-800",
                                Approved: "bg-green-100 text-green-800",
                                Partly_Delivered:
                                  "bg-yellow-100 text-yellow-800",
                                Delivered: "bg-teal-100 text-teal-800",
                                Partly_Invoiced:
                                  "bg-orange-100 text-orange-800",
                                Invoiced: "bg-emerald-100 text-emerald-800",
                                Rejected: "bg-red-100 text-red-800",
                                Cancelled: "bg-gray-100 text-gray-800",
                                Deleted: "bg-gray-100 text-gray-800",
                                Converted_To_PO:
                                  "bg-purple-100 text-purple-800",
                              }[
                                request.status as
                                  | "New"
                                  | "Approved"
                                  | "Partly_Delivered"
                                  | "Delivered"
                                  | "Partly_Invoiced"
                                  | "Invoiced"
                                  | "Rejected"
                                  | "Cancelled"
                                  | "Deleted"
                                  | "Converted_To_PO"
                              ] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${
                                {
                                  New: "bg-blue-500",
                                  Approved: "bg-green-500",
                                  Partly_Delivered: "bg-yellow-500",
                                  Delivered: "bg-teal-500",
                                  Partly_Invoiced: "bg-orange-500",
                                  Invoiced: "bg-emerald-500",
                                  Rejected: "bg-red-500",
                                  Cancelled: "bg-gray-500",
                                  Deleted: "bg-gray-500",
                                  Converted_To_PO: "bg-purple-500",
                                }[
                                  request.status as
                                    | "New"
                                    | "Approved"
                                    | "Partly_Delivered"
                                    | "Delivered"
                                    | "Partly_Invoiced"
                                    | "Invoiced"
                                    | "Rejected"
                                    | "Cancelled"
                                    | "Deleted"
                                    | "Converted_To_PO"
                                ] || "bg-gray-500"
                              }`}
                            />
                            {request.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => {
                                // Toggle dropdown menu for this request
                                const currentMenuState = document
                                  .getElementById(`menu-${request._id}`)
                                  ?.classList.contains("block");
                                // Close all other menus
                                document
                                  .querySelectorAll("[id^=menu-]")
                                  .forEach((el) => {
                                    if (el.id !== `menu-${request._id}`) {
                                      el.classList.remove("block");
                                      el.classList.add("hidden");
                                    }
                                  });
                                // Toggle current menu
                                const menuEl = document.getElementById(
                                  `menu-${request._id}`,
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
                              id={`menu-${request._id}`}
                              className={`hidden absolute ${
                                index >= displayData?.length - 2
                                  ? "bottom-0 right-0"
                                  : "right-0"
                              } z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none`}
                            >
                              <div className="py-1" role="none">
                                {permissions.canUpdate &&
                                  ![
                                    "Partly_Delivered",
                                    "Delivered",
                                    "Partly_Invoiced",
                                    "Invoiced",
                                    "Rejected",
                                    "Cancelled",
                                    "Deleted",
                                    "Converted_To_PO",
                                    "Converted_To_PI",
                                    "Converted_To_GRN",
                                  ].includes(request.status) && (
                                    <button
                                      onClick={() => {
                                        handleEditClick(request);
                                        // Close the dropdown after clicking
                                        const menuEl = document.getElementById(
                                          `menu-${request._id}`,
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
                                    const printUrl = `/clinic/stocks/purchase-requests/print-purchase-request?purId=${request?._id}`;
                                    window.open(
                                      printUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                    // Close the dropdown after clicking
                                    const menuEl = document.getElementById(
                                      `menu-${request?._id}`,
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
                                    handleDetailClick(request);
                                    // Close the dropdown after clicking
                                    const menuEl = document.getElementById(
                                      `menu-${request._id}`,
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
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    Detail
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    toggleRowExpansion(request._id);
                                    // Close the dropdown after clicking
                                    const menuEl = document.getElementById(
                                      `menu-${request._id}`,
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
                                    View Items
                                  </div>
                                </button>
                                {permissions.canDelete &&
                                  ![
                                    "Partly_Delivered",
                                    "Delivered",
                                    "Partly_Invoiced",
                                    "Invoiced",
                                    "Rejected",
                                    "Cancelled",
                                    "Deleted",
                                    "Converted_To_PO",
                                    "Converted_To_PI",
                                    "Converted_To_GRN",
                                  ].includes(request.status) && (
                                    <button
                                      onClick={() => {
                                        handleDeleteClick(request);
                                        // Close the dropdown after clicking
                                        const menuEl = document.getElementById(
                                          `menu-${request._id}`,
                                        );
                                        if (menuEl) {
                                          menuEl.classList.remove("block");
                                          menuEl.classList.add("hidden");
                                        }
                                      }}
                                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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
                      {expandedRows[request._id] && (
                        <tr>
                          <td colSpan={9} className="px-6 py-4 bg-gray-50">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Item Name
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Quantity
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Unit Price
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {request.items.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-4 py-2 text-sm text-gray-900">
                                        {item.name}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        {item.quantity}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        AED {item.unitPrice.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 text-sm text-gray-500">
                                        AED {item.totalPrice.toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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

          {/* Pagination */}
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
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          pagination.currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Layout configuration
PurchaseRequestsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedPurchaseRequestsPage = withClinicAuth(PurchaseRequestsPage) as NextPageWithLayout;
ProtectedPurchaseRequestsPage.getLayout = PurchaseRequestsPage.getLayout;

export default ProtectedPurchaseRequestsPage;
