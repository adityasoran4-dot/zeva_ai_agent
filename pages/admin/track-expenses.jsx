import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Search, ChevronLeft, ChevronRight, Eye, X, User, Wallet } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

function AllPettyCashAdmin() {
  const router = useRouter();
  
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [globalAmounts, setGlobalAmounts] = useState({ globalTotalAmount: 0, globalSpentAmount: 0, globalRemainingAmount: 0 });
  const [filters, setFilters] = useState({ staff: "", start: "", end: "", search: "" });
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const perPage = 20;
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Track Expenses - Initial Token Check:', { 
        adminToken, 
        agentToken, 
        isAgentRoute,
        pathname: router.pathname,
        locationPath: window.location.pathname
      });
      
      // CRITICAL: If on agent route, prioritize agentToken over adminToken
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  // Always call the hook (React rules), but only use it if isAgent is true
  // This page is under Staff Management -> Track Expenses submodule
  const agentPermissionsData = useAgentPermissions(isAgent ? "admin_staff_management" : null, isAgent ? "Track Expenses" : null);
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getToday = () => new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { staff, start, end } = filters;
      let s = start, e = end;

      if (!s && !e) {
        s = e = getToday();
        setFilters(prev => ({ ...prev, start: s, end: e }));
      } else if (s && !e) {
        e = s;
        setFilters(prev => ({ ...prev, end: s }));
      } else if (!s && e) {
        s = e;
        setFilters(prev => ({ ...prev, start: e }));
      }

      const params = new URLSearchParams({ startDate: s, endDate: e });
      if (staff) params.append("staffName", staff);

      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      const res = await fetch(`/api/admin/getAllPettyCash?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        // Handle 403 permission denied errors
        if (res.status === 403) {
          setData([]);
          setFiltered([]);
          setGlobalAmounts({ globalTotalAmount: 0, globalSpentAmount: 0, globalRemainingAmount: 0 });
          showToast("Permission denied", "error");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();

      setData(json.data || []);
      setFiltered(json.data || []);
      if (json.staffList && !staffList.length) setStaffList(json.staffList);
      if (json.globalAmounts) setGlobalAmounts(json.globalAmounts);
      showToast("Data loaded", "success");
    } catch (err) {
      showToast(err.message || "Error loading data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      const today = getToday();
      setFilters({ staff: "", start: today, end: today, search: "" });
      fetchData();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          const today = getToday();
          setFilters({ staff: "", start: today, end: today, search: "" });
          fetchData();
        } else {
          setLoading(false); // Agent doesn't have read permission - stop loading
        }
      }
    } else {
      setLoading(false); // Neither admin nor agent - stop loading
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  useEffect(() => {
    const result = data.filter(item =>
      filters.search === "" ||
      item.staff.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.staff.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      item.patients.some(p =>
        p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        p.phone.includes(filters.search)
      )
    );
    setFiltered(result);
    setPage(1);
  }, [filters.search, data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const currentData = filtered.slice((page - 1) * perPage, page * perPage);

  const isImage = (url) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = (url) => /\.pdf$/i.test(url);
  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm sm:text-base text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if agent doesn't have read permission
  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view track expenses. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 lg:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <h1 className="text-lg sm:text-xl font-bold text-blue-800 mb-4 sm:mb-6">Petty Cash Records</h1>

      {/* Global Totals */}
      <div className="bg-white rounded shadow p-4 sm:p-5 mb-5 sm:mb-6">
        <h2 className="text-base sm:text-md font-bold text-blue-800 mb-3 sm:mb-4">Global Petty Cash Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold text-green-600">د.إ{globalAmounts.globalTotalAmount}</div>
            <div className="text-sm text-green-800">Total Amount</div>
            <div className="text-xs text-green-600 mt-1">All staff combined</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold text-red-600">د.إ{globalAmounts.globalSpentAmount}</div>
            <div className="text-sm text-red-800">Total Spent</div>
            <div className="text-xs text-red-600 mt-1">All expenses combined</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
            <div className="text-lg sm:text-xl font-bold text-blue-600">د.إ{globalAmounts.globalRemainingAmount}</div>
            <div className="text-sm text-blue-800">Remaining Balance</div>
            <div className="text-xs text-blue-600 mt-1">Available for use</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded shadow p-4 sm:p-5 mb-5 sm:mb-6 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-3 text-gray-900 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff or patient..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
            />
          </div>
          
          <div className="relative w-full dropdown-container">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm bg-white text-left flex items-center justify-between"
            >
              <span>{filters.staff || "All Staff"}</span>
              <svg 
                className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                ></div>
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[200px] sm:max-h-60 overflow-y-auto overscroll-contain">
                  <button
                    type="button"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, staff: "" }));
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                      filters.staff === "" ? "bg-blue-50 text-blue-600" : "text-gray-900"
                    }`}
                  >
                    All Staff
                  </button>
                  {staffList.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({ ...prev, staff: name }));
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                        filters.staff === name ? "bg-blue-50 text-blue-600" : "text-gray-900"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <input
            type="date"
            value={filters.start}
            onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
            className="w-full px-2 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
          />

          <input
            type="date"
            value={filters.end}
            onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))}
            className="w-full px-2 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
          />
        </div>

        <button
          onClick={fetchData}
          className="mt-3 bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 w-full sm:w-auto text-sm font-medium"
        >
          Apply
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : currentData.length > 0 ? (
        <>
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-5 sm:mb-6">
            {currentData.map(item => (
              <div key={item.staff._id} className="bg-white rounded shadow">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 sm:p-5 flex items-center gap-3">
                  <User className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">{item.staff.name}</h3>
                    <p className="text-xs sm:text-sm opacity-90 break-all">{item.staff.email}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-50 text-center">
                  {item.totalAllocated > 0 && (
                    <div>
                      <p className="text-xs text-gray-800">Allocated</p>
                      <p className="font-bold text-gray-900 text-sm sm:text-base">د.إ{item.totalAllocated}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-800">Spent</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">د.إ{item.totalSpent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-800">Balance</p>
                    <p className="font-bold text-gray-900 text-sm sm:text-base">د.إ{item.totalAmount}</p>
                  </div>
                </div>

                {/* Patients (only show those with allocated amounts) */}
                <div className="p-4 border-t">
                  {(() => {
                    const patientsWithAlloc = item.patients.filter(p => Array.isArray(p.allocatedAmounts) && p.allocatedAmounts.length > 0);
                    return (
                      <>
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Allocated ({patientsWithAlloc.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {patientsWithAlloc.map((p, i) => (
                            <div key={i} className="bg-gray-50 rounded p-2 text-sm">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">{p.name}</p>
                              <p className="text-gray-800 text-xs sm:text-sm">{p.phone} • {p.email}</p>
                              {p.allocatedAmounts.map((a, j) => (
                                <div key={j} className="flex justify-between items-center mt-1 pt-1 border-t gap-2">
                                  <span className="text-gray-900 text-xs sm:text-sm">د.إ{a.amount} • {formatDate(a.date)}</span>
                                  {a.receipts?.length > 0 && (
                                    <button
                                      onClick={() => { setReceipts(a.receipts); setShowModal(true); }}
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                                    >
                                      <Eye className="w-3 h-3" /> View
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}  
                </div>

                {/* Expenses */}
                {item.expenses.length > 0 && (
                  <div className="p-4 border-t">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Expenses ({item.expenses.length})</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {item.expenses.map((e, i) => (
                        <div key={i} className="bg-gray-50 rounded p-2 text-sm flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">{e.description}</p>
                            <p className="text-gray-800 text-xs sm:text-sm">د.إ{e.spentAmount} • {formatDate(e.date)}</p>
                          </div>
                          {e.receipts?.length > 0 && (
                            <button
                              onClick={() => { setReceipts(e.receipts); setShowModal(true); }}
                              className="text-blue-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                            >
                              <Eye className="w-3 h-3" /> View
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded shadow p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-sm text-gray-900">
                {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 rounded ${page === i + 1 ? 'bg-blue-600 text-white' : 'border text-gray-900'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded shadow p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-900 text-lg">No records found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Receipts</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-900 hover:text-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {receipts.map((file, i) => (
                <div key={i} className="border rounded p-3">
                  {isImage(file) ? (
                    <img src={file} alt={`Receipt ${i + 1}`} className="w-full max-h-80 object-contain" />
                  ) : isPDF(file) ? (
                    <iframe src={file} title={`Receipt ${i + 1}`} className="w-full h-80" />
                  ) : (
                    <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Open File {i + 1}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
AllPettyCashAdmin.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AllPettyCashAdmin);
ProtectedDashboard.getLayout = AllPettyCashAdmin.getLayout;

export default ProtectedDashboard;
