import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { Filter, Printer, Package } from "lucide-react";
import AddAdjustmentModal from "./_components/AddAdjustmentModal";
import EditAdjustmentModal from "./_components/EditAdjustmentModal";
import DeleteAdjustmentModal from "./_components/DeleteAdjustmentModal";
import FilterModal from "./_components/FilterModal";
import AdjustmentDetailModal from "./_components/AdjustmentDetailModal";
import debounce from "lodash.debounce";

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

const MODULE_KEY = "clinic_stock_qty_adjustment";

const StockQtyAdjustmentPage: NextPageWithLayout = () => {
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
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalItems: 0,
    uniqueBranchesCount: 0,
    totalValue: 0,
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    branch: "",
    fromDate: "",
    toDate: "",
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
        if (filters.status) params.append("status", filters.status);
        if (filters.fromDate) params.append("startDate", filters.fromDate);
        if (filters.toDate) params.append("endDate", filters.toDate);

        const res = await axios.get(
          `/api/stocks/stock-qty-adjustment?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data?.success) {
          const data = res.data.data || [];
          setRecords(data);
          const pg = res.data.pagination || res.data.data?.pagination || {};
          setPagination((prev) => ({
            ...prev,
            totalResults: pg.total || res.data.pagination?.total || data.length,
            totalPages: pg.totalPages || res.data.pagination?.totalPages || 1,
            currentPage: page,
          }));

          const totalItems =
            data.reduce(
              (sum: number, r: any) => sum + (r.items?.length || 0),
              0,
            ) || 0;

          const totalValue = data.reduce(
            (sum: number, r: any) =>
              sum +
              (r.items?.reduce(
                (itemSum: number, item: any) =>
                  itemSum + (item.totalPrice || 0),
                0,
              ) || 0),
            0,
          );

          setStats({
            totalRecords: pg.total || data.length,
            totalItems,
            uniqueBranchesCount: (res.data.filters?.branches || []).length || 0,
            totalValue,
          });
        } else {
          setRecords([]);
        }
      } catch (err) {
        console.error("Error fetching adjustments:", err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [pagination.limit],
  );

  // Permission handling useEffect
  useEffect(() => {
    let isMounted = true;
    const userRole = getUserRole();
    
    const clinicToken = typeof window !== "undefined" ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken") : null;
    const doctorToken = typeof window !== "undefined" ? localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken") : null;
    const agentToken = typeof window !== "undefined" ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken") : null;
    const staffToken = typeof window !== "undefined" ? localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken") : null;
    const userToken = typeof window !== "undefined" ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken") : null;
    const authToken = clinicToken || doctorToken || agentToken || staffToken || userToken;


    // Admin gets full access
    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
      setPermissionsLoaded(true);
      return;
    }

    // Clinic and doctor roles - fetch from sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!authToken) {
            if (!isMounted) return;
            setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
            setPermissionsLoaded(true);
            return;
          }
          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (!isMounted) return;
          if (res.data.success) {
            if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
              setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
            } else {
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                if (p.module === "clinic_stock_qty_adjustment") return true;
                if (p.module === "qty_adjustment") return true;
                if (p.module === "stock_qty_adjustment") return true;
                return false;
              });
              // Check parent module subModules
              if (!modulePermission) {
                const parentStockModule = res.data.permissions.find((p: any) =>
                  p?.module === "clinic_stock" && Array.isArray(p.subModules)
                );
                if (parentStockModule) {
                  modulePermission = parentStockModule.subModules.find((sm: any) =>
                    sm?.moduleKey === "clinic_stock_qty_adjustment"
                  );
                }
              }
              if (modulePermission) {
                const actions = modulePermission.actions || {};
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
                setPermissions({ canRead: true, canCreate: false, canUpdate: false, canDelete: false });
              }
            }
          } else {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
          if (isMounted) setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };
      fetchClinicPermissions();
      return;
    }

    // Agent/doctorStaff tokens - check via agent permissions API
    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
      setPermissionsLoaded(true);
      return;
    }
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: MODULE_KEY },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          const data = res.data;
          if (!isMounted) return;
          if (!data?.permissions && data?.error?.includes("not found in agent permissions")) {
            setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
            return;
          }
          const actions = data?.permissions?.actions || data?.data?.moduleActions || {};
          const isTrue = (val: any) => val === true || val === "true" || String(val || "").toLowerCase() === "true";
          const canAll = isTrue(actions.all);
          setPermissions({
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          });
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          setPermissions({ canRead: false, canCreate: false, canUpdate: false, canDelete: false });
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };
      fetchPermissions();
    } else {
      setPermissions({ canRead: true, canCreate: true, canUpdate: true, canDelete: true });
      setPermissionsLoaded(true);
    }
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (_permissionsLoaded) fetchRecords(1, "", filterData);
  }, [_permissionsLoaded, filterData]);


  useEffect(() => {
    if (_permissionsLoaded) fetchRecords(1, searchTerm, filterData);
  }, [searchTerm, filterData, fetchRecords, _permissionsLoaded]);

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

  const displayData = records;

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchRecords(newPage, searchTerm, filterData);
      }
    },
    [fetchRecords, searchTerm, filterData, pagination.totalPages],
  );

  const handleAdd = () => {
    setIsAddOpen(true);
  };

  const handleEdit = (record: any) => {
    setRecordToEdit(record);
    setIsEditOpen(true);
  };

  const handleDelete = (record: any) => {
    setRecordToDelete(record);
    setIsDeleteOpen(true);
  };

  const handleDetail = (record: any) => {
    setRecordToDetail(record);
    setIsDetailOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete?._id) return;
    try {
      setIsDeleting(true);
      const token = getTokenByPath();
      const res = await axios.delete(
        `/api/stocks/stock-qty-adjustment/delete/${recordToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        setIsDeleteOpen(false);
        setRecordToDelete(null);
        fetchRecords(pagination.currentPage, searchTerm, filterData);
      }
    } catch (err) {
      console.error("Error deleting adjustment:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRowExpansion = (recordId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Deleted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500";
      case "Completed":
        return "bg-green-500";
      case "Cancelled":
        return "bg-red-500";
      case "Deleted":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };


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
            You do not have permission to view stock quantity adjustments. Please contact your administrator.
          </p>
          {permissions.canCreate && (
            <button
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium mt-4"
              onClick={handleAdd}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Adjustment
            </button>
          )}
        </div>
        <AddAdjustmentModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            setIsAddOpen(false);
          }}
        />
      </div>
    );
  }
  return (
    <div>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Stock Quantity Adjustments
            </h1>
            <p className="text-indigo-100 mt-2">
              Track and manage stock quantity adjustments
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            {permissions.canCreate && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                New Adjustment
              </button>
            )}

            {/* Add Adjustment Modal */}
            {permissions.canCreate && (
              <AddAdjustmentModal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                onSuccess={() =>
                  fetchRecords(pagination.currentPage, searchTerm, filterData)
                }
              />
            )}

            {/* Edit Adjustment Modal */}
            <EditAdjustmentModal
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

            {/* Delete Adjustment Modal */}
            <DeleteAdjustmentModal
              isOpen={isDeleteOpen}
              onClose={() => {
                setIsDeleteOpen(false);
                setRecordToDelete(null);
              }}
              onConfirm={handleDeleteConfirm}
              adjustmentNo={
                recordToDelete?.adjustmentNo ||
                `ADJ-${recordToDelete?._id?.slice(-6)}`
              }
              loading={isDeleting}
            />

            {/* Adjustment Detail Modal */}
            <AdjustmentDetailModal
              isOpen={isDetailOpen}
              onClose={() => {
                setIsDetailOpen(false);
                setRecordToDetail(null);
              }}
              record={recordToDetail}
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
          fetchRecords(1, searchTerm, filters);
        }}
        filterData={filterData}
        setFilterData={setFilterData}
        title="Filter Stock Adjustments"
      />

      {/* Enhanced Stats Cards */}
      <div className="max-w-9xl mx-auto mb-8 px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Adjustments Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">SQA</span>
              </div>
              <div className="ml-5">
                <div className="text-sm font-medium text-gray-500 uppercase">
                  Total Adjustments
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {stats?.totalRecords || displayData.length}
                </div>
              </div>
            </div>
          </div>

          {/* Total Items Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
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

          {/* Branches Card */}
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
        </div>
      </div>

      {/* Enhanced Data Table Section */}
      <div className="max-w-9xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Stock Quantity Adjustments
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
                placeholder="Search by adjustment number, post a/c or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20"
              />
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">Loading stock adjustments...</p>
            </div>
          ) : displayData.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No adjustments found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first stock quantity adjustment.
              </p>
              {permissions.canCreate && (
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 rounded-xl"
                >
                  <PlusIcon className="h-5 w-5" /> Create Adjustment
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
                      Adjustment No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post A/c
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
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
                  {displayData.map((record: any, index: number) => (
                    <React.Fragment key={record._id}>
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {(
                                  record.adjustmentNo ||
                                  `SQA-${record._id.slice(-6)}`
                                )
                                  .toString()
                                  .slice(-2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {record.adjustmentNo ||
                                  `SQA-${record._id.slice(-6)}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {record._id?.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(
                            record.date || record.createdAt,
                          ).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.branch?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.postAc || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {record.items?.length || 0} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCurrencySymbol(clinicCurrency)}{" "}
                          {record.items
                            ?.reduce(
                              (sum: number, item: any) =>
                                sum + (item.totalPrice || 0),
                              0,
                            )
                            .toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                              record.status || "New",
                            )}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full mr-2 ${getStatusDotColor(
                                record.status || "New",
                              )}`}
                            />
                            {record.status || "New"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => {
                                const currentMenuState = document
                                  .getElementById(`menu-${record._id}`)
                                  ?.classList.contains("block");
                                document
                                  .querySelectorAll("[id^=menu-]")
                                  .forEach((el) => {
                                    if (el.id !== `menu-${record._id}`) {
                                      el.classList.remove("block");
                                      el.classList.add("hidden");
                                    }
                                  });
                                const menuEl = document.getElementById(
                                  `menu-${record._id}`,
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
                              id={`menu-${record._id}`}
                              className={`hidden absolute ${
                                index >= displayData?.length - 2
                                  ? "bottom-0 right-0"
                                  : "right-0"
                              } z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none`}
                            >
                              <div className="py-1" role="none">
                                {permissions.canUpdate && (
                                  <button
                                    onClick={() => {
                                      handleEdit(record);
                                      const menuEl = document.getElementById(
                                        `menu-${record._id}`,
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
                                    const printUrl = `/clinic/stocks/stock-qty-adjustment/print-stock-qty-adjustment/?sqaId=${record._id}`;
                                    window.open(
                                      printUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                    const menuEl = document.getElementById(
                                      `menu-${record._id}`,
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
                                    handleDetail(record);
                                    const menuEl = document.getElementById(
                                      `menu-${record._id}`,
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
                                    Details
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    toggleRowExpansion(record._id);
                                    const menuEl = document.getElementById(
                                      `menu-${record._id}`,
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
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                    {expandedRows[record._id]
                                      ? "Hide Items"
                                      : "Show Items"}
                                  </div>
                                </button>
                                <button
                                  onClick={() => {
                                    handleDelete(record);
                                    const menuEl = document.getElementById(
                                      `menu-${record._id}`,
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
                                {permissions.canDelete && (
                                  <button
                                    onClick={() => {
                                      handleDelete(record);
                                      const menuEl = document.getElementById(
                                        `menu-${record._id}`,
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
                      {expandedRows[record._id] && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200"
                          >
                            <div className="ml-8 mr-4">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-900 flex items-center">
                                  <svg
                                    className="w-5 h-5 text-indigo-600 mr-2"
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
                                  Items in Adjustment #
                                  {record.adjustmentNo ||
                                    `SQA-${record._id.slice(-6)}`}
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
                                      {record.items?.length || 0} items
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
                                      {record.items
                                        ?.reduce(
                                          (sum: number, item: any) =>
                                            sum + (item.totalPrice || 0),
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
                                          Code
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Qty
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          UOM
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Expiry
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Cost Price
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {record.items?.map(
                                        (item: any, itemIndex: number) => (
                                          <tr
                                            key={itemIndex}
                                            className="hover:bg-indigo-50 transition-colors duration-150"
                                          >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                                  <span className="text-white text-xs font-bold">
                                                    {item.name?.charAt(0) ||
                                                      "?"}
                                                  </span>
                                                </div>
                                                <div className="ml-3">
                                                  <div className="text-sm font-medium text-gray-900">
                                                    {item.name || "N/A"}
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    {item.description ||
                                                      "No description"}
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                              {item.code || "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {item.quantity || 0}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                              {item.uom || "N/A"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                              {item.expiryDate
                                                ? new Date(
                                                    item.expiryDate,
                                                  ).toLocaleDateString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                              {getCurrencySymbol(clinicCurrency)}{" "}
                                              {(item.costPrice || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                              {getCurrencySymbol(clinicCurrency)}{" "}
                                              {(item.totalPrice || 0).toFixed(
                                                2,
                                              )}
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                    <tfoot className="bg-gray-50">
                                      <tr>
                                        <td
                                          colSpan={6}
                                          className="px-4 py-3 text-sm font-medium text-gray-700 text-right"
                                        >
                                          Adjustment Total:
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                          {getCurrencySymbol(clinicCurrency)}{" "}
                                          {record.items
                                            ?.reduce(
                                              (sum: number, item: any) =>
                                                sum + (item.totalPrice || 0),
                                              0,
                                            )
                                            .toFixed(2)}
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
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            pageNum === pagination.currentPage
                              ? "bg-indigo-600 text-white"
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
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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

StockQtyAdjustmentPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

const ProtectedStockQtyAdjustmentPage = withClinicAuth(
  StockQtyAdjustmentPage,
) as NextPageWithLayout;
ProtectedStockQtyAdjustmentPage.getLayout = StockQtyAdjustmentPage.getLayout;

export default ProtectedStockQtyAdjustmentPage;
