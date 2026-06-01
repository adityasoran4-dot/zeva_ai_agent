import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { FileText, ShoppingCart, Filter, Printer } from "lucide-react";
import { PurchaseRecord } from "@/types/stocks";
import debounce from "lodash.debounce";
import AddPurchaseOrderModal from "./_components/AddPurchaseOrderModal";
import DeletePurchaseOrderModal from "./_components/DeletePurchaseOrderModal";
import EditPurchaseOrderModal from "./_components/EditPurchaseOrderModal";
import PurchaseOrderDetailModal from "./_components/PurchaseOrderDetailModal";
import ConvertPurchaseRequestModal from "./_components/ConvertPurchaseRequestModal";
import FilterModal from "./_components/FilterModal";

// import AddStockItemModal from "@/components/shared/AddStockItemModal";

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
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const getUserInfo = (): { role: string | null; id: string | null } => {
  if (typeof window === "undefined") return { role: null, id: null };
  try {
    for (const key of TOKEN_PRIORITY) {
      const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (!token) continue;
      const base64Url = token.split(".")[1];
      if (!base64Url) continue;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""),
      );
      const decoded = JSON.parse(jsonPayload);
      return { role: decoded.role || decoded.userRole || null, id: decoded.userId || decoded.id || null };
    }
  } catch (error) {
    console.error("Error getting user info:", error);
  }
  return { role: null, id: null };
};

const getUserRole = (): string | null => getUserInfo().role;

const PurchaseOrdersPage: NextPageWithLayout = () => {
  const token = getTokenByPath();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] =
    useState<PurchaseRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [purchaseOrderToEdit, setPurchaseOrderToEdit] =
    useState<PurchaseRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [purchaseOrderForDetail, setPurchaseOrderForDetail] =
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

  // Permission state
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [_permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Fetch purchase orders with proper error handling
  const fetchPurchaseOrders = useCallback(
    debounce(
      async (page: number = 1, search: string = "", filters: any = {}) => {
        try {
          setLoading(true);

          const token = getTokenByPath();
          // Build query parameters
          const params = new URLSearchParams();
          params.append("page", page.toString());
          params.append("limit", pagination.limit.toString());
          params.append("type", "Purchase_Order");

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
            setPurchaseOrders(response.data?.data?.records || []);
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
          console.error("Error fetching purchase orders:", error);
          // Show empty state on error
          setPurchaseOrders([]);
        } finally {
          setLoading(false);
        }
      },
      300,
    ),
    [pagination.limit],
  );

  // Initial fetch on mount - only after permissions are loaded
  useEffect(() => {
    if (_permissionsLoaded) {
      fetchPurchaseOrders(1, "", filterData);
    }
  }, [_permissionsLoaded, filterData]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchPurchaseOrders(page, searchTerm, filterData);
    },
    [fetchPurchaseOrders, searchTerm, filterData],
  );

  useEffect(() => {
    if (_permissionsLoaded) {
      fetchPurchaseOrders(1, searchTerm, filterData);
    }
  }, [searchTerm, filterData, _permissionsLoaded]);

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

  // Check which tokens exist
  const clinicToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("clinicToken") ||
        window.sessionStorage.getItem("clinicToken")
      : null;
  const doctorToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("doctorToken") ||
        window.sessionStorage.getItem("doctorToken")
      : null;
  const agentToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("agentToken") ||
        window.sessionStorage.getItem("agentToken")
      : null;
  const staffToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("staffToken") ||
        window.sessionStorage.getItem("staffToken")
      : null;
  const userToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem("userToken") ||
        window.sessionStorage.getItem("userToken")
      : null;

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    let isMounted = true;
    const userRole = getUserRole();
    const authToken =
      clinicToken || doctorToken || agentToken || staffToken || userToken;

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
            // Check if permissions array exists and is not null
            // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the clinic_stock_purchase_orders module
              // First check for the specific module key
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                if (p.module === "clinic_stock_purchase_orders") return true;
                if (p.module === "clinic_stock_Purchase_Orders") return true;
                if (p.module === "purchase_orders") return true;
                if (p.module === "stock_purchase_orders") return true;
                return false;
              });

              // If not found as direct module, check parent clinic_stock module's subModules
              if (!modulePermission) {
                const parentStockModule = res.data.permissions.find((p: any) =>
                  p?.module === "clinic_stock" && Array.isArray(p.subModules)
                );
                if (parentStockModule) {
                  modulePermission = parentStockModule.subModules.find((sm: any) =>
                    sm?.moduleKey === "clinic_stock_purchase_orders"
                  );
                }
              }

              if (modulePermission) {
                const actions = modulePermission.actions || {};

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

    // For agent/doctorStaff tokens, check permissions using agent permissions API
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

    // Only check permissions for agent/doctorStaff roles
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log(
            "Fetching Agent/Staff Permissions for clinic_stock_purchase_orders...",
          );
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_stock_purchase_orders" },
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

          console.log("Final Agent/Staff Permissions:", newPerms);
          setPermissions(newPerms);
        } catch (err: any) {
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
  }, [clinicToken, doctorToken, agentToken, staffToken, userToken]);

  // Toggle row expansion for showing items
  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Use sample data if API is not working
  const displayData = purchaseOrders.length > 0 ? purchaseOrders : [];

  const handleAddPurchaseOrder = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleConvertPurchaseRequest = useCallback(() => {
    setIsConvertModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((purchaseOrder: PurchaseRecord) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!purchaseOrderToDelete) return;

    try {
      const token = getTokenByPath();
      setIsDeleting(true);
      const response = await axios.delete(
        `/api/stocks/purchase-records/delete-purchase-record/${purchaseOrderToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        // Refresh the list
        const updatedPurchaseOrders = purchaseOrders.filter(
          (po) => po._id !== purchaseOrderToDelete._id,
        );
        setPurchaseOrders(updatedPurchaseOrders);
        setIsDeleteModalOpen(false);
        setPurchaseOrderToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      alert("Failed to delete purchase order");
    } finally {
      setIsDeleting(false);
    }
  }, [
    purchaseOrderToDelete,
    fetchPurchaseOrders,
    pagination.currentPage,
    searchTerm,
    filterData,
  ]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setPurchaseOrderToDelete(null);
  }, []);

  const handleEditClick = useCallback((purchaseOrder: PurchaseRecord) => {
    setPurchaseOrderToEdit(purchaseOrder);
    setIsEditModalOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setPurchaseOrderToEdit(null);
  }, []);

  const handleDetailClick = useCallback((purchaseOrder: PurchaseRecord) => {
    setPurchaseOrderForDetail(purchaseOrder);
    setIsDetailModalOpen(true);
  }, []);

  const handleDetailCancel = useCallback(() => {
    setIsDetailModalOpen(false);
    setPurchaseOrderForDetail(null);
  }, []);

  // Show access denied message if no read permission (but still allow create if permitted)
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-400 mb-4">
            You do not have permission to view purchase orders. Please contact your administrator.
          </p>
          {/* Show create buttons even if read is denied but create is allowed */}
          {permissions.canCreate && (
            <div className="flex flex-col gap-2 mt-4">
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleConvertPurchaseRequest}
              >
                <FileText className="h-5 w-5" />
                Convert Purchase Request
              </button>
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleAddPurchaseOrder}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Purchase Order
              </button>
            </div>
          )}
        </div>
        {/* Modals for create functionality even when read is denied */}
        <ConvertPurchaseRequestModal
          token={token || ""}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSuccess={(_purchaseOrderData: PurchaseRecord) => {
            setIsConvertModalOpen(false);
          }}
        />
        <AddPurchaseOrderModal
          token={token || ""}
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(_purchaseOrderData: PurchaseRecord) => {
            setIsAddModalOpen(false);
          }}
        />
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
                Purchase Orders
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Manage your purchase orders and procurement workflow
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter className="h-5 w-5" />
                Advanced Filter
              </button>
              {permissions.canCreate && (
                <>
                  <button
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                    onClick={handleConvertPurchaseRequest}
                  >
                    <FileText className="h-5 w-5" />
                    Convert Purchase Request
                  </button>
                  <button
                    className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                    onClick={handleAddPurchaseOrder}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Purchase Order
                  </button>
                </>
              )}
            </div>

            {/* Convert Purchase Request Modal */}
            <ConvertPurchaseRequestModal
              token={token || ""}
              isOpen={isConvertModalOpen}
              onClose={() => setIsConvertModalOpen(false)}
              onSuccess={(purchaseOrderData: PurchaseRecord) => {
                setPurchaseOrders((prev) => [...prev, purchaseOrderData]);
                fetchPurchaseOrders(
                  pagination.currentPage,
                  searchTerm,
                  filterData,
                );
              }}
            />

            {/* Add Purchase Order Modal */}
            <AddPurchaseOrderModal
              token={token || ""}
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSuccess={(purchaseOrderData: PurchaseRecord) => {
                setPurchaseOrders((prev) => [...prev, purchaseOrderData]);
                fetchPurchaseOrders(
                  pagination.currentPage,
                  searchTerm,
                  filterData,
                );
              }}
            />

            {/* Delete Purchase Order Modal */}
            <DeletePurchaseOrderModal
              isOpen={isDeleteModalOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              purchaseOrderName={purchaseOrderToDelete?.orderNo}
              loading={isDeleting}
            />

            {/* Edit Purchase Order Modal */}
            <EditPurchaseOrderModal
              token={token || ""}
              isOpen={isEditModalOpen}
              onClose={handleEditCancel}
              purchaseOrderData={purchaseOrderToEdit}
              onSuccess={(purchaseOrderData: any) => {
                const updatedPurchaseOrders = purchaseOrders.map((po) =>
                  po._id === purchaseOrderData._id ? purchaseOrderData : po,
                );
                setPurchaseOrders(updatedPurchaseOrders);
              }}
            />

            {/* Purchase Order Detail Modal */}
            <PurchaseOrderDetailModal
              isOpen={isDetailModalOpen}
              onClose={handleDetailCancel}
              purchaseOrder={purchaseOrderForDetail}
            />
          </div>

          {/* Advanced Filter Form */}
          {/* Filter Modal */}
          <FilterModal
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={(filters) => {
              fetchPurchaseOrders(1, searchTerm, filters);
            }}
            filterData={filterData}
            setFilterData={setFilterData}
            title="Advanced Filter - Purchase Orders"
          />
        </div>
      </div>

      {/* <AddStockItemModal
        token={token || ""}
        clinicId={"clinicId"}
        isOpen={true}
        onClose={() => {
          // setIsModalOpen(false)
        }}
        onSuccess={(newStockItem) => {
          // Handle successful creation
          console.log("New stock item created:", newStockItem);
        }}
      /> */}

      {/* Enhanced Stats Cards */}
      <div className="max-w-9xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Purchase Orders Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">PO</span>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Orders
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.totalRecords || displayData.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Active purchase orders
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
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
              <div className="text-xs text-gray-500">Items ordered</div>
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
                Purchase Orders
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
              <p className="text-gray-600">Loading purchase orders...</p>
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
                No purchase orders found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first purchase order.
              </p>
              <button
                onClick={handleAddPurchaseOrder}
                className="cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold"
                disabled={!permissions.canCreate}
                title={!permissions.canCreate ? "You do not have permission to add purchase orders" : ""}
              >
                <ShoppingCart className="h-5 w-5" />
                Add First Order
              </button>
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
                  {displayData.map((order: any, index: number) => (
                    <React.Fragment key={order._id}>
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {order.orderNo.charAt(order.orderNo.length - 2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderNo}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {order._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.supplier?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.branch?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.items.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          AED{" "}
                          {order.items
                            .reduce(
                              (sum: number, item: any) => sum + item.totalPrice,
                              0,
                            )
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
                                order.status as
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
                                  order.status as
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
                            {order.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
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
                                // Toggle dropdown menu for this order
                                const currentMenuState = document
                                  .getElementById(`menu-${order._id}`)
                                  ?.classList.contains("block");
                                // Close all other menus
                                document
                                  .querySelectorAll("[id^=menu-]")
                                  .forEach((el) => {
                                    if (el.id !== `menu-${order._id}`) {
                                      el.classList.remove("block");
                                      el.classList.add("hidden");
                                    }
                                  });
                                // Toggle current menu
                                const menuEl = document.getElementById(
                                  `menu-${order._id}`,
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
                              id={`menu-${order._id}`}
                              className={`hidden absolute ${
                                index >= displayData?.length - 2 && index >= 1
                                  ? "bottom-0 right-0"
                                  : "right-0"
                              } z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none`}
                            >
                              <div className="py-1" role="none">
                                {![
                                  "Allocated",
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
                                ]?.includes(order.status) && (
                                  <button
                                    onClick={() => {
                                      handleEditClick(order);
                                      // Close the dropdown after clicking
                                      const menuEl = document.getElementById(
                                        `menu-${order._id}`,
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
                                    const printUrl = `/clinic/stocks/purchase-orders/print-purchase-order?poId=${order?._id}`;
                                    window.open(
                                      printUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                    // Close the dropdown after clicking
                                    const menuEl = document.getElementById(
                                      `menu-${order._id}`,
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
                                    handleDetailClick(order);
                                    // Close the dropdown after clicking
                                    const menuEl = document.getElementById(
                                      `menu-${order._id}`,
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
                                    toggleRowExpansion(order._id);
                                    // Close the dropdown after clicking
                                    const menuEl = document.getElementById(
                                      `menu-${order._id}`,
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
                                    {expandedRows[order._id]
                                      ? "Hide Items"
                                      : "Show Items"}
                                  </div>
                                </button>
                                {permissions.canDelete && (
                                  <button
                                    onClick={() => {
                                      handleDeleteClick(order);
                                      // Close the dropdown after clicking
                                      const menuEl = document.getElementById(
                                        `menu-${order._id}`,
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

                      {/* Expanded row for items */}
                      {expandedRows[order._id] && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200"
                          >
                            <div className="ml-8 mr-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                  <svg
                                    className="w-5 h-5 text-blue-600 mr-2"
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
                                  Items in Order #{order.orderNo}
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
                                    <span>{order.items.length} items</span>
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
                                      AED{" "}
                                      {order.items
                                        .reduce(
                                          (sum: number, item: any) =>
                                            sum + item.totalPrice,
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
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                                              />
                                            </svg>
                                            Item
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                              />
                                            </svg>
                                            Description
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                              />
                                            </svg>
                                            Qty
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                                              />
                                            </svg>
                                            UOM
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
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
                                            Unit Price
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
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
                                            Total
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                                              />
                                            </svg>
                                            Discount
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                                              />
                                            </svg>
                                            Net Price
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                                              />
                                            </svg>
                                            VAT %
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            VAT
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
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
                                            Net + VAT
                                          </div>
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          <div className="flex items-center">
                                            <svg
                                              className="w-4 h-4 mr-2 text-gray-500"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                              />
                                            </svg>
                                            Free Qty
                                          </div>
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {order.items.map(
                                        (item: any, itemIndex: number) => (
                                          <tr
                                            key={itemIndex}
                                            className="hover:bg-blue-50 transition-colors duration-150"
                                          >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                                  <span className="text-white text-xs font-bold">
                                                    {item.name.charAt(0)}
                                                  </span>
                                                </div>
                                                <div className="ml-3">
                                                  <div className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3">
                                              <div className="text-sm text-gray-600 max-w-xs truncate">
                                                {item.description || (
                                                  <span className="text-gray-400 italic">
                                                    No description
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                  {item.quantity}
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
                                                  AED
                                                </span>
                                                {item.unitPrice.toFixed(2)}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                              <div className="flex items-center">
                                                <span className="text-green-600 mr-1">
                                                  AED
                                                </span>
                                                {item.totalPrice.toFixed(2)}
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
                                                  AED
                                                </span>
                                                {(
                                                  item.netPrice ||
                                                  item.totalPrice
                                                ).toFixed(2)}
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
                                                  AED
                                                </span>
                                                {(item.vatAmount || 0).toFixed(
                                                  2,
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                              <div className="flex items-center">
                                                <span className="text-purple-600 mr-1">
                                                  AED
                                                </span>
                                                {(
                                                  item.netPlusVat ||
                                                  (item.netPrice ||
                                                    item.totalPrice) +
                                                    (item.vatAmount || 0)
                                                ).toFixed(2)}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                              <div className="flex items-center">
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                                        ),
                                      )}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td
                                          colSpan={5}
                                          className="px-4 py-3 text-sm font-medium text-gray-700 text-right"
                                        >
                                          Order Totals:
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="text-green-600 mr-1">
                                              AED
                                            </span>
                                            {order.items
                                              .reduce(
                                                (sum: number, item: any) =>
                                                  sum + item.totalPrice,
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
                                              AED
                                            </span>
                                            {order.items
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
                                              AED
                                            </span>
                                            {order.items
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
                                              AED
                                            </span>
                                            {order.items
                                              .reduce(
                                                (sum: number, item: any) =>
                                                  sum +
                                                  (item.netPlusVat ||
                                                    (item.netPrice ||
                                                      item.totalPrice) +
                                                      (item.vatAmount || 0)),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                          <div className="flex items-center justify-end">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              {order.items.reduce(
                                                (sum: number, item: any) =>
                                                  sum +
                                                  (item.freeQuantity || 0),
                                                0,
                                              )}{" "}
                                              free
                                            </span>
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
                  {[...Array(Math.min(5, pagination.totalPages))].map(
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            pageNum === pagination.currentPage
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
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
PurchaseOrdersPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedPurchaseOrdersPage = withClinicAuth(
  PurchaseOrdersPage,
) as NextPageWithLayout;
ProtectedPurchaseOrdersPage.getLayout = PurchaseOrdersPage.getLayout;

export default ProtectedPurchaseOrdersPage;
