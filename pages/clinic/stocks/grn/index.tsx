import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { ShoppingCart, Filter, Printer } from "lucide-react";
import { PurchaseRecord } from "@/types/stocks";
import debounce from "lodash.debounce";
import AddGRNModal from "./_components/AddGRNModal";
import DeleteGRNModal from "./_components/DeleteGRNModal";
import EditGRNModal from "./_components/EditGRNModal";
import FilterModal from "./_components/FilterModal";

const MODULE_KEY = "clinic_stock_grn";

const GRNPage: NextPageWithLayout = () => {
  const [grnRecords, setGrnRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  // Permission state
  const [permissions, setPermissions] = useState({
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [_role, setRole] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [grnToDelete, setGrnToDelete] = useState<PurchaseRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [grnToEdit, setGrnToEdit] = useState<PurchaseRecord | null>(null);
  const [clinicCurrency, setClinicCurrency] = useState<string>("INR");
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
    grnNo: "",
    orderCode: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
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

  // Fetch GRN records with proper error handling
  const fetchGRNRecords = useCallback(
    debounce(
      async (page: number = 1, search: string = "", filters: any = {}) => {
        try {
          setLoading(true);

          const token = getTokenByPath();
          // Build query parameters
          const params = new URLSearchParams();
          params.append("page", page.toString());
          params.append("limit", pagination.limit.toString());
          if (search) {
            params.append("search", encodeURIComponent(search));
          }

          // Add filter parameters
          if (filters.branch) params.append("branch", filters.branch);
          if (filters.supplier)
            params.append("supplierInvoiceNo", filters.supplier);
          if (filters.grnNo) params.append("grnNo", filters.grnNo);
          if (filters.orderCode)
            params.append("purchasedOrder", filters.orderCode);
          const response = await axios.get(
            `/api/stocks/grns?${params.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.data?.success) {
            const records = response.data.data?.records || [];

            // Enrich records with full purchase order details (items & totals)
            const poIds: string[] = Array.from(
              new Set(
                records
                  .map((r: any) => r.purchasedOrder?._id || r.purchasedOrder)
                  .filter(Boolean),
              ),
            );

            const poMap: Record<string, any> = {};
            if (poIds.length > 0) {
              await Promise.all(
                poIds.map(async (id: string) => {
                  try {
                    const poRes = await axios.get(
                      `/api/stocks/purchase-records/get-purchase-record/${id}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      },
                    );
                    if (poRes.data?.success) {
                      poMap[id] = poRes.data.data;
                    }
                  } catch (err) {
                    // ignore individual PO fetch errors
                    console.warn("Failed to fetch PO", id, err);
                  }
                }),
              );
            }

            // Merge purchase details into grn records for table rendering
            const enriched = records.map((r: any) => {
              const poId = r.purchasedOrder?._id || r.purchasedOrder;
              return {
                ...r,
                purchaseDetails: poId ? poMap[poId] : null,
              };
            });

            setGrnRecords(enriched);
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
          console.error("Error fetching GRN records:", error);
          setGrnRecords([]);
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
    fetchGRNRecords(1, "", filterData);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      fetchGRNRecords(page, searchTerm, filterData);
    },
    [fetchGRNRecords, searchTerm, filterData],
  );

  useEffect(() => {
    fetchGRNRecords(1, searchTerm, filterData);
  }, [searchTerm, filterData, fetchGRNRecords]);

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

  // Permission fetching
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = getTokenByPath();
        if (!token) {
          setPermissionsLoaded(true);
          return;
        }

        // Decode JWT to get role
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setRole(decoded.role);

        if (
          decoded.role === "agent" ||
          decoded.role === "staff" ||
          decoded.role === "doctorstaff"
        ) {
          // Agent/Staff/DoctorStaff permissions
          console.log("Fetching Agent/Staff Permissions for clinic_stock_grn...");
          setPermissionsLoaded(false);
          const agentRes = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: MODULE_KEY },
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = agentRes.data;
          console.log("Agent Permissions API Response (GRN):", data);

          // Default to true if module not found in permissions (matches backend logic)
          if (
            !data?.permissions &&
            data?.error?.includes("No permissions found for module")
          ) {
            console.log("Module not found in permissions, granting full access by default (GRN)");
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          } else if (agentRes.data.success) {
            const actions = data?.permissions?.actions || {};
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
            console.log("Setting permissions (GRN):", newPerms);
            setPermissions(newPerms);
          }
        } else {
          // Clinic/Doctor permissions
          const clinicRes = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (clinicRes.data.success) {
            console.log("Clinic Sidebar Permissions Response (GRN):", clinicRes.data);
            if (
              clinicRes.data.permissions === null ||
              !Array.isArray(clinicRes.data.permissions) ||
              clinicRes.data.permissions.length === 0
            ) {
              console.log("No permissions set, granting full access (GRN)");
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              let modulePermission = clinicRes.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                if (p.module === "clinic_stock_grn") return true;
                return false;
              });

              console.log("Direct module permission found (GRN):", modulePermission);

              if (!modulePermission) {
                const parentStockModule = clinicRes.data.permissions.find((p: any) => 
                  p?.module === "clinic_stock" && Array.isArray(p.subModules)
                );
                
                console.log("Parent stock module found (GRN):", parentStockModule);
                
                if (parentStockModule) {
                  modulePermission = parentStockModule.subModules.find((sm: any) => 
                    sm?.moduleKey === "clinic_stock_grn"
                  );
                  console.log("Submodule permission found (GRN):", modulePermission);
                }
              }

              if (modulePermission) {
                const actions = modulePermission.actions || {};
                console.log("Module permission actions (GRN):", actions);

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
                console.log("Setting permissions (GRN):", newPermissions);
                setPermissions(newPermissions);
              } else {
                setPermissions({
                  canRead: true,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching permissions (GRN):", err);
      } finally {
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, []);

  // Toggle row expansion for showing items
  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const displayData = grnRecords.length > 0 ? grnRecords : [];

  // ALL HOOKS MUST BE DECLARED BEFORE CONDITIONAL RETURNS
  // Move useCallback hooks here after permission check
  const handleAddGRN = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((grn: PurchaseRecord) => {
    setGrnToDelete(grn);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!grnToDelete) return;

    try {
      const token = getTokenByPath();
      setIsDeleting(true);
      const response = await axios.delete(
        `/api/stocks/grns/delete-grn/${grnToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        const updatedGrnRecords = grnRecords.filter(
          (grn) => grn._id !== grnToDelete._id,
        );
        setGrnRecords(updatedGrnRecords);
        setIsDeleteModalOpen(false);
        setGrnToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting GRN:", error);
      alert("Failed to delete GRN");
    } finally {
      setIsDeleting(false);
    }
  }, [
    grnToDelete,
    fetchGRNRecords,
    pagination.currentPage,
    searchTerm,
    filterData,
    grnRecords,
  ]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setGrnToDelete(null);
  }, []);

  const handleEditClick = useCallback((grn: PurchaseRecord) => {
    setGrnToEdit(grn);
    setIsEditModalOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setGrnToEdit(null);
  }, []);

  // Now place conditional returns AFTER all hooks
  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Access Denied - when both canRead and canCreate are false
  if (!permissions.canRead && !permissions.canCreate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view GRN records.</p>
        </div>
      </div>
    );
  }

  // Create-only view - when canRead is false but canCreate is true
  if (!permissions.canRead && permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="mb-8">
          <div className="max-w-9xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Goods Received Notes
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Manage your goods received notes and inventory receiveds
                </p>
              </div>
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleAddGRN}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add GRN
              </button>
            </div>
          </div>
        </div>
        {/* Add GRN Modal */}
        <AddGRNModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddGRN={(_grnData: PurchaseRecord) => {
            // Refresh or handle post-creation
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
                Goods Received Notes
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Manage your goods received notes and inventory receiveds
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permissions.canRead && (
                <button
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <Filter className="h-5 w-5" />
                  Advanced Filter
                </button>
              )}
              {permissions.canCreate && (
                <button
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                  onClick={handleAddGRN}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add GRN
                </button>
              )}
            </div>

            {/* Add GRN Modal */}
            <AddGRNModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onAddGRN={(_grnData: PurchaseRecord) => {
                fetchGRNRecords(pagination.currentPage, searchTerm, filterData);
              }}
            />

            {/* Delete GRN Modal */}
            <DeleteGRNModal
              isOpen={isDeleteModalOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              grnName={(grnToDelete as any)?.grnNo || ""}
              loading={isDeleting}
            />

            {/* Edit GRN Modal */}
            <EditGRNModal
              isOpen={isEditModalOpen}
              onClose={handleEditCancel}
              grnData={grnToEdit}
              onEditGRN={(_grnData: any) => {
                fetchGRNRecords(pagination.currentPage, searchTerm, filterData);
              }}
            />
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={(filters) => {
          setFilterData(filters);
          fetchGRNRecords(1, searchTerm, filters);
        }}
        filterData={filterData}
        setFilterData={setFilterData}
        title="Advanced Filter"
      />

      {/* Enhanced Stats Cards */}
      <div className="max-w-9xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total GRNs Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xl font-bold">GRN</span>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total GRNs
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.totalRecords || displayData.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Active Receiveds</div>
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
              <div className="text-xs text-gray-500">Items received</div>
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
                Goods Received Notes
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
                  placeholder="Search by GRN number, supplier or items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
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
              <p className="text-gray-600">Loading GRNs...</p>
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
                No GRNs found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first goods Received note.
              </p>
              {permissions.canCreate && (
                <button
                  onClick={handleAddGRN}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add First GRN
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
                      GRN No
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
                      Suppliers
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Disc.
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Net
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      VAT
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Net + VAT
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
                  {displayData.map((grn: any, index: number) => {
                    // Calculate totals from items
                    const items = grn.purchaseDetails?.items || grn.items || [];
                    let totalAmount = 0;
                    let discountAmount = 0;
                    let vatAmount = 0;
                    let netAmount = 0;
                    let netPlusVat = 0;

                    items.forEach((item: any) => {
                      totalAmount += item.totalPrice || 0;
                      discountAmount += item.discountAmount || 0;
                      vatAmount += item.vatAmount || 0;
                      netAmount += item.netPrice || item.totalPrice || 0;
                      netPlusVat +=
                        item.netPlusVat ||
                        (item.netPrice || item.totalPrice || 0) +
                          (item.vatAmount || 0);
                    });

                    return (
                      <React.Fragment key={grn._id}>
                        <tr className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {(() => {
                                    const s = (
                                      grn.purchasedOrder?.purchaseNo ||
                                      grn.grnNo ||
                                      ""
                                    ).toString();
                                    return (
                                      s.charAt(Math.max(0, s.length - 2)) ||
                                      s.charAt(0)
                                    );
                                  })()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {grn.grnNo}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {grn._id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {grn.branch?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(
                              grn.grnDate || grn.date,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {grn.purchasedOrder?.orderNo ||
                              grn.purchasedOrder?.poNo ||
                              (grn.purchasedOrder?._id
                                ? grn.purchasedOrder._id.substring(0, 8) + "..."
                                : "N/A")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {grn.purchaseDetails?.supplier?.name ||
                              grn.purchasedOrder?.supplier?.name ||
                              grn.supplier?.name ||
                              grn.suppplier?.name ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getCurrencySymbol(clinicCurrency)} {totalAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {getCurrencySymbol(clinicCurrency)} {discountAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {getCurrencySymbol(clinicCurrency)} {netAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            {getCurrencySymbol(clinicCurrency)} {vatAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                            {getCurrencySymbol(clinicCurrency)} {netPlusVat.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                (
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
                                  } as any
                                )[grn.status] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full mr-2 ${
                                  (
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
                                    } as any
                                  )[grn.status] || "bg-gray-500"
                                }`}
                              />
                              {grn.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => {
                                  // Toggle dropdown menu for this GRN
                                  const menuEl = document.getElementById(
                                    `menu-${grn._id}`,
                                  );
                                  if (menuEl) {
                                    const isHidden =
                                      menuEl.classList.contains("hidden");
                                    // Close all other menus
                                    document
                                      .querySelectorAll("[id^=menu-]")
                                      .forEach((el) => {
                                        el.classList.add("hidden");
                                        el.classList.remove("block");
                                      });
                                    // Toggle current menu
                                    if (isHidden) {
                                      menuEl.classList.remove("hidden");
                                      menuEl.classList.add("block");
                                    } else {
                                      menuEl.classList.add("hidden");
                                      menuEl.classList.remove("block");
                                    }
                                  }
                                }}
                                className="text-gray-500 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200"
                                title="More options"
                              >
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </button>
                              <div
                                id={`menu-${grn._id}`}
                                className={`hidden absolute ${
                                  index >= displayData.length - 2
                                    ? "bottom-0 right-0"
                                    : "right-0"
                                } z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none`}
                              >
                                <div className="py-1" role="none">
                                  {permissions.canUpdate && ![
                                    "Partly_Invoiced",
                                    "Invoiced",
                                    "Partly_Paid",
                                    "Paid",
                                    "Deleted",
                                  ].includes(grn.status) && (
                                    <button
                                      onClick={() => {
                                        handleEditClick(grn);
                                        document
                                          .getElementById(`menu-${grn._id}`)
                                          ?.classList.add("hidden");
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
                                      const printUrl = `/clinic/stocks/grn/print-good-received-note?grnId=${grn?._id}`;
                                      window.open(
                                        printUrl,
                                        "_blank",
                                        "noopener,noreferrer",
                                      );
                                      document
                                        .getElementById(`menu-${grn._id}`)
                                        ?.classList.add("hidden");
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
                                      toggleRowExpansion(grn._id);
                                      document
                                        .getElementById(`menu-${grn._id}`)
                                        ?.classList.add("hidden");
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
                                      {expandedRows[grn._id]
                                        ? "Hide Items"
                                        : "Show Items"}
                                    </div>
                                  </button>
                                  {permissions.canDelete && (
                                    <button
                                      onClick={() => {
                                        handleDeleteClick(grn);
                                        document
                                          .getElementById(`menu-${grn._id}`)
                                          ?.classList.add("hidden");
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
                        {expandedRows[grn._id] && (
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
                                    Items in GRN #{grn.grnNo}
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
                                      <span>{items.length} items</span>
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
                                        {getCurrencySymbol(clinicCurrency)} {totalAmount.toFixed(2)} total
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
                                        {items.map(
                                          (item: any, itemIndex: number) => (
                                            <tr
                                              key={itemIndex}
                                              className="hover:bg-purple-50 transition-colors duration-150"
                                            >
                                              <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                  <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                      {(
                                                        item.name || "?"
                                                      ).charAt(0)}
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
                                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
                                                    {getCurrencySymbol(clinicCurrency)}
                                                  </span>
                                                  {(
                                                    item.unitPrice || 0
                                                  ).toFixed(2)}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                                <div className="flex items-center">
                                                  <span className="text-green-600 mr-1">
                                                    {getCurrencySymbol(clinicCurrency)}
                                                  </span>
                                                  {(
                                                    item.totalPrice || 0
                                                  ).toFixed(2)}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                <div className="flex items-center space-x-1">
                                                  <span>
                                                    {item.discount || 0}
                                                    {item.discountType ===
                                                    "Percentage"
                                                      ? "%"
                                                      : item.discountType ===
                                                          "Amount"
                                                        ? ` ${getCurrencySymbol(clinicCurrency)}`
                                                        : ""}
                                                  </span>
                                                  {(item.discount || 0) > 0 &&
                                                    item.discountType && (
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
                                                    {getCurrencySymbol(clinicCurrency)}
                                                  </span>
                                                  {(
                                                    item.vatAmount || 0
                                                  ).toFixed(2)}
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
                                                      item.totalPrice ||
                                                      0) + (item.vatAmount || 0)
                                                  ).toFixed(2)}
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                                <div className="flex items-center">
                                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {item.freeQuantity || 0}
                                                  </span>
                                                  {(item.freeQuantity || 0) >
                                                    0 &&
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
                                            GRN Totals:
                                          </td>
                                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                            <div className="flex items-center">
                                              <span className="text-green-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {totalAmount.toFixed(2)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-700">
                                            <span className="text-gray-500">
                                              Discounts:
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            <div className="flex items-center">
                                              <span className="text-blue-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {discountAmount.toFixed(2)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-700">
                                            <span className="text-gray-500">
                                              VAT:
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            <div className="flex items-center">
                                              <span className="text-orange-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {vatAmount.toFixed(2)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                            <div className="flex items-center">
                                              <span className="text-purple-600 mr-1">
                                                {getCurrencySymbol(clinicCurrency)}
                                              </span>
                                              {netPlusVat.toFixed(2)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-700">
                                            <div className="flex items-center">
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {items.reduce(
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
                    );
                  })}
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
GRNPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedGRNPage = withClinicAuth(GRNPage) as NextPageWithLayout;
ProtectedGRNPage.getLayout = GRNPage.getLayout;

export default ProtectedGRNPage;
