import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import {
  PlusIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { FileText, Filter, PencilIcon, Printer } from "lucide-react";
import debounce from "lodash.debounce";
import AddPurchaseInvoiceModal from "./_components/AddPurchaseInvoiceModal";
import DeletePurchaseInvoiceModal from "./_components/DeletePurchaseInvoiceModal";
import EditPurchaseInvoiceModal from "./_components/EditPurchaseInvoiceModal";
import PurchaseInvoiceDetailModal from "./_components/PurchaseInvoiceDetailModal";
import FilterModal from "./_components/FilterModal";

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

const MODULE_KEY = "clinic_stock_purchase_invoices";

const PurchaseInvoicesPage: NextPageWithLayout = () => {
  const token = getTokenByPath();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [recordForDetail, setRecordForDetail] = useState<any | null>(null);
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
    uniqueSuppliersCount: 0,
    uniqueBranchesCount: 0,
    totalGrns: 0,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    branch: "",
    supplier: "",
    invoiceNo: "",
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

  const fetchPurchaseInvoices = useCallback(
    debounce(
      async (page: number = 1, search: string = "", filters: any = {}) => {
        try {
          setLoading(true);
          const token = getTokenByPath();
          const params = new URLSearchParams();
          params.append("page", page.toString());
          params.append("limit", pagination.limit.toString());
          if (search) {
            params.append("search", encodeURIComponent(search));
          }
          if (filters.branch) params.append("branch", filters.branch);
          if (filters.supplier) params.append("supplier", filters.supplier);
          if (filters.invoiceNo) params.append("invoiceNo", filters.invoiceNo);
          if (filters.fromDate) params.append("startDate", filters.fromDate);
          if (filters.toDate) params.append("endDate", filters.toDate);
          if (filters.status) params.append("status", filters.status);
          const response = await axios.get(
            `/api/stocks/purchase-invoices?${params.toString()}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (response.data?.success) {
            const data = response.data?.data || [];
            setRecords(data);
            setPagination((prev) => ({
              ...prev,
              totalResults: response.data.pagination?.total || data.length,
              totalPages: response.data.pagination?.totalPages || 1,
              currentPage: response.data.pagination?.page || 1,
              limit: response.data.pagination?.limit || prev.limit,
              hasMore:
                (response.data.pagination?.page || 1) *
                  (response.data.pagination?.limit || prev.limit) <
                (response.data.pagination?.total || data.length),
            }));
            const uniqueSuppliers = new Set(
              data
                .map((r: any) =>
                  typeof r.supplier === "object" ? r.supplier?._id : r.supplier,
                )
                .filter(Boolean),
            );
            const uniqueBranches = new Set(
              data
                .map((r: any) =>
                  typeof r.branch === "object" ? r.branch?._id : r.branch,
                )
                .filter(Boolean),
            );
            const totalGrns =
              data.reduce(
                (sum: number, r: any) =>
                  sum + (Array.isArray(r.grns) ? r.grns.length : r.grn ? 1 : 0),
                0,
              ) || 0;
            setStats({
              totalRecords: response.data.pagination?.total || data.length,
              uniqueSuppliersCount: uniqueSuppliers.size,
              uniqueBranchesCount: uniqueBranches.size,
              totalGrns,
            });
          }
        } catch (error) {
          setRecords([]);
        } finally {
          setLoading(false);
        }
      },
      300,
    ),
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
                if (p.module === "clinic_stock_purchase_invoices") return true;
                if (p.module === "purchase_invoices") return true;
                if (p.module === "stock_purchase_invoices") return true;
                return false;
              });
              // Check parent module subModules
              if (!modulePermission) {
                const parentStockModule = res.data.permissions.find((p: any) =>
                  p?.module === "clinic_stock" && Array.isArray(p.subModules)
                );
                if (parentStockModule) {
                  modulePermission = parentStockModule.subModules.find((sm: any) =>
                    sm?.moduleKey === "clinic_stock_purchase_invoices"
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
    if (_permissionsLoaded) fetchPurchaseInvoices(1, "", filterData);
  }, [_permissionsLoaded, filterData]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchPurchaseInvoices(page, searchTerm, filterData);
    },
    [fetchPurchaseInvoices, searchTerm, filterData],
  );

  useEffect(() => {
    if (_permissionsLoaded) fetchPurchaseInvoices(1, searchTerm, filterData);
  }, [searchTerm, filterData, _permissionsLoaded]);

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

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const displayData = records.length > 0 ? records : [];

  const handleAdd = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((r: any) => {
    setRecordToDelete(r);
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!recordToDelete) return;
    try {
      const token = getTokenByPath();
      setIsDeleting(true);
      const response = await axios.delete(
        `/api/stocks/purchase-invoices/delete/${recordToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.data.success) {
        const updated = records.filter((po) => po._id !== recordToDelete._id);
        setRecords(updated);
        setIsDeleteModalOpen(false);
        setRecordToDelete(null);
      }
    } catch (error) {
      alert("Failed to delete purchase invoice");
    } finally {
      setIsDeleting(false);
    }
  }, [recordToDelete, records]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setRecordToDelete(null);
  }, []);

  const handleEditClick = useCallback((r: any) => {
    setRecordToEdit(r);
    setIsEditModalOpen(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setRecordToEdit(null);
  }, []);

  const handleDetailClick = useCallback((r: any) => {
    setRecordForDetail(r);
    setIsDetailModalOpen(true);
  }, []);

  const handleDetailCancel = useCallback(() => {
    setIsDetailModalOpen(false);
    setRecordForDetail(null);
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
            You do not have permission to view purchase invoices. Please contact your administrator.
          </p>
          {/* Show create button even if read is denied but create is allowed */}
          {permissions.canCreate && (
            <button
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium mt-4"
              onClick={handleAdd}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Purchase Invoice
            </button>
          )}
        </div>
        {/* Modal for create functionality even when read is denied */}
        <AddPurchaseInvoiceModal
          token={token || ""}
          isOpen={isAddModalOpen}


          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(_invoiceData: any) => {
            setIsAddModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="mb-8">
        <div className="max-w-9xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Purchase Invoices
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Manage your purchase invoices
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
                <button
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                  onClick={handleAdd}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Purchase Invoice
                </button>
              )}
            </div>

            <AddPurchaseInvoiceModal
              token={token || ""}
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSuccess={(data: any) => {
                setRecords((prev) => [data, ...prev]);
                fetchPurchaseInvoices(
                  pagination.currentPage,
                  searchTerm,
                  filterData,
                );
              }}
            />
            <DeletePurchaseInvoiceModal
              isOpen={isDeleteModalOpen}
              onClose={handleDeleteCancel}
              onConfirm={handleDeleteConfirm}
              name={recordToDelete?.invoiceNo}
              loading={isDeleting}
            />
            <EditPurchaseInvoiceModal
              token={token || ""}
              isOpen={isEditModalOpen}
              onClose={handleEditCancel}
              data={recordToEdit}
              onSuccess={(_updated: any) => {
                fetchPurchaseInvoices();
              }}
            />
            <PurchaseInvoiceDetailModal
              isOpen={isDetailModalOpen}
              onClose={handleDetailCancel}
              record={recordForDetail}
            />

            <FilterModal
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              onApply={(filters) => {
                setFilterData(filters);
                fetchPurchaseInvoices(1, searchTerm, filters);
              }}
              filterData={filterData}
              setFilterData={setFilterData}
              title="Advanced Filter - Purchase Invoices"
            />
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">PI</span>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Invoices
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.totalRecords || displayData.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                Active purchase invoices
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
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
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
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
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Linked GRNs
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {stats?.totalGrns?.toLocaleString() || "0"}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">GRNs linked</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Purchase Invoices
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
                  placeholder="Search by invoice number or supplier"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-600">Loading purchase invoices...</p>
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No purchase invoices found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first purchase invoice.
              </p>
              <button
                onClick={handleAdd}
                className="cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm font-semibold"
              >
                <FileText className="h-5 w-5" />
                Add First Invoice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
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
                      GRNs Linked
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount (AED)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid Amount (AED)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Amount (AED)
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
                  {displayData.map((r: any) => {
                    let totalAmount = 0;
                    let paidAmount = r?.paidAmount || 0;
                    let remainingAmount = r?.remainingAmount || 0;

                    r?.grns?.forEach((grn: any) => {
                      grn?.items?.forEach((item: any) => {
                        totalAmount += item?.netPlusVat || 0;
                      });
                    });
                    return (
                      <React.Fragment key={r._id}>
                        <tr className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {(r.invoiceNo || "").slice(-2) || "PI"}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {r.invoiceNo || r._id}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {r._id.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {r.date
                              ? new Date(r.date).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {r.supplier?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {r.branch?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Array.isArray(r.grns)
                              ? r.grns.length
                              : r.grn
                                ? 1
                                : 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {totalAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {paidAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {remainingAmount?.toFixed(2) || "0.00"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                {
                                  New: "bg-blue-100 text-blue-800",
                                  Approved: "bg-green-100 text-green-800",
                                  Invoiced: "bg-emerald-100 text-emerald-800",
                                  Rejected: "bg-red-100 text-red-800",
                                  Cancelled: "bg-gray-100 text-gray-800",
                                  Deleted: "bg-gray-100 text-gray-800",
                                  Paid: "bg-green-100 text-green-600",
                                  Partly_Paid: "bg-green-100 text-green-600",
                                }[
                                  r.status as
                                    | "New"
                                    | "Approved"
                                    | "Invoiced"
                                    | "Rejected"
                                    | "Cancelled"
                                    | "Deleted"
                                    | "Paid"
                                    | "Partly_Paid"
                                ] || "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full mr-2 ${
                                  {
                                    New: "bg-blue-500",
                                    Approved: "bg-green-500",
                                    Invoiced: "bg-emerald-500",
                                    Rejected: "bg-red-500",
                                    Cancelled: "bg-gray-500",
                                    Deleted: "bg-gray-500",
                                    Paid: "bg-green-500 text-green-500",
                                    Partly_Paid: "bg-green-500 text-green-500",
                                  }[
                                    r.status as
                                      | "New"
                                      | "Approved"
                                      | "Invoiced"
                                      | "Rejected"
                                      | "Cancelled"
                                      | "Deleted"
                                      | "Paid"
                                      | "Partly_Paid"
                                  ] || "bg-gray-500"
                                }`}
                              />
                              {(r.status || "").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {r.createdAt
                              ? new Date(r.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => {
                                  const currentMenuState = document
                                    .getElementById(`menu-${r._id}`)
                                    ?.classList.contains("block");
                                  document
                                    .querySelectorAll("[id^=menu-]")
                                    .forEach((el) => {
                                      if (el.id !== `menu-${r._id}`) {
                                        el.classList.remove("block");
                                        el.classList.add("hidden");
                                      }
                                    });
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
                                className="hidden origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleDetailClick(r);
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
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
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
                                        ? "Hide GRNs"
                                        : "Show GRNs"}
                                    </div>
                                  </button>
                                  {permissions.canUpdate && (
                                    <button
                                      onClick={() => {
                                        handleEditClick(r);
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
                                      const printUrl = `/clinic/stocks/purchase-invoices/print-purchase-invoice?pinvId=${r?._id}`;
                                      window.open(
                                        printUrl,
                                        "_blank",
                                        "noopener,noreferrer",
                                      );
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
                                      <Printer className="h-4 w-4 mr-2" />
                                      Print
                                    </div>
                                  </button>
                                  {permissions.canDelete && (
                                    <button
                                      onClick={() => {
                                        handleDeleteClick(r);
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
                              colSpan={11}
                              className="px-6 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200"
                            >
                              <div className="w-full">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg font-bold text-gray-900">
                                    Linked GRNs
                                  </h4>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            GRN No
                                          </th>
                                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Created Date
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {(Array.isArray(r.grns)
                                          ? r.grns
                                          : r.grn
                                            ? [r.grn]
                                            : []
                                        ).map((g: any, idx: number) => {
                                          const grn: any = g || {};

                                          return (
                                            <tr key={idx}>
                                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                {grn?.grnNo ||
                                                  (typeof g === "string"
                                                    ? g
                                                    : "N/A")}
                                              </td>
                                              <td className="px-4 py-3 text-sm text-gray-600">
                                                {grn?.createdAt
                                                  ? new Date(
                                                      grn.createdAt,
                                                    ).toLocaleDateString(
                                                      "en-GB",
                                                    )
                                                  : "N/A"}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
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

PurchaseInvoicesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

const ProtectedPurchaseInvoicesPage = withClinicAuth(
  PurchaseInvoicesPage,
) as NextPageWithLayout;
ProtectedPurchaseInvoicesPage.getLayout = PurchaseInvoicesPage.getLayout;

export default ProtectedPurchaseInvoicesPage;
