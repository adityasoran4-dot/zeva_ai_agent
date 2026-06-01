"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Search, ChevronLeft, ChevronRight, Eye, X, User, Wallet } from "lucide-react"
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

const AdminEodNotes = () => {
  const router = useRouter();
  
  const [notes, setNotes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [doctorStaffList, setDoctorStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedDoctorStaff, setSelectedDoctorStaff] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNotes, setExpandedNotes] = useState({});
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('GetAllEodNotes - Initial Token Check:', { 
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
  // This page is under Staff Management -> View EOD Report submodule
  const agentPermissionsData = useAgentPermissions(isAgent ? "admin_staff_management" : null, isAgent ? "View EOD Report" : null);
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const fetchAllNotes = async (date = "", staff = "") => {
    try {
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      const query = [];
      if (date) query.push(`date=${date}`);
      if (staff) query.push(`staffName=${encodeURIComponent(staff)}`);

      const url = `/api/admin/getAllEodNotes${query.length ? `?${query.join("&")}` : ""}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotes(res.data.eodNotes || []);
      setStaffList(res.data.staffList || []);
      setDoctorStaffList(res.data.doctorStaffList || []);
    } catch (err) {
      console.error(err);
      // Handle 403 permission denied errors
      if (err.response?.status === 403) {
        setNotes([]);
        setStaffList([]);
        setDoctorStaffList([]);
        alert(err.response?.data?.message || "Permission denied");
      } else {
        alert(err.response?.data?.message || "Error fetching notes");
      }
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllNotes();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchAllNotes();
        }
      }
    } else {
      // Neither admin nor agent - don't fetch
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const handleFilterChange = () => {
    fetchAllNotes(selectedDate, selectedStaff);
  };

  const handleClear = () => {
    setSelectedDate("");
    setSelectedStaff("");
    setSelectedDoctorStaff("");
    setSelectedRole("");
    setSearchQuery("");
    fetchAllNotes();
  };

  const toggleExpand = (index) => {
    setExpandedNotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const truncateText = (text, lines = 4) => {
    const textLines = text.split('\n');
    if (textLines.length <= lines) return text;
    return textLines.slice(0, lines).join('\n');
  };

  const shouldShowViewMore = (text) => {
    return text.split('\n').length > 4;
  };

  const filteredNotes = notes.filter(note => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!note.staffName.toLowerCase().includes(query) && 
          !note.note.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Role filter
    if (selectedRole && note.staffRole !== selectedRole) {
      return false;
    }
    
    // Staff name filter
    if (selectedStaff && note.staffName !== selectedStaff) {
      return false;
    }
    
    // Doctor staff name filter
    if (selectedDoctorStaff && note.staffName !== selectedDoctorStaff) {
      return false;
    }
    
    return true;
  });

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (isAgent && permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm sm:text-base text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if agent doesn't have read permission
  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-4">
          <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-4">
            You do not have permission to view EOD notes. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-3 md:p-4 lg:p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-blue-800">
                EOD Notes Dashboard
              </h2>
              <p className="text-xs text-blue-600 mt-0.5">Admin View - All Staff Reports</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by staff name or note content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Staff Name
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => {
                  setSelectedStaff(e.target.value);
                  setSelectedDoctorStaff(""); // Clear doctor staff when staff is selected
                }}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">All Staff</option>
                {staffList.map((name, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Doctor Name
              </label>
              <select
                value={selectedDoctorStaff}
                onChange={(e) => {
                  setSelectedDoctorStaff(e.target.value);
                  setSelectedStaff(""); // Clear staff when doctor staff is selected
                }}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">All Doctors</option>
                {doctorStaffList.map((name, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all outline-none"
              >
                <option value="">All Roles</option>
                <option value="staff">Staff</option>
                <option value="doctorStaff">Doctor Staff</option>
              </select>
            </div>

            <button
              onClick={handleFilterChange}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-sm hover:shadow-md transition-all text-xs"
            >
              Apply Filter
            </button>

            <button
              onClick={handleClear}
              className="bg-gray-200 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-300 font-medium shadow-sm hover:shadow-md transition-all text-xs"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Notes Display */}
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">No Notes Found</h3>
              <p className="text-xs text-gray-500">Try adjusting your filters or search query</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {filteredNotes.map((n, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200"
              >
                <div className="p-3">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                        {n.staffName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-gray-800 truncate">{n.staffName}</h3>
                        <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 ${
                          n.staffRole === 'doctorStaff' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {n.staffRole === 'doctorStaff' ? 'Doctor Staff' : 'Staff Member'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">{new Date(n.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-2.5">
                    <p className="text-gray-800 whitespace-pre-wrap text-xs leading-relaxed">
                      {expandedNotes[i] ? n.note : truncateText(n.note)}
                    </p>
                    
                    {shouldShowViewMore(n.note) && (
                      <button
                        onClick={() => toggleExpand(i)}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-xs flex items-center gap-1 transition-colors"
                      >
                        {expandedNotes[i] ? (
                          <>
                            Show Less
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            View Full Note
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Stats */}
        {filteredNotes.length > 0 && (
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Notes</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800">{filteredNotes.length}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Showing {filteredNotes.length} of {notes.length} notes
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

AdminEodNotes.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminEodNotes);
ProtectedDashboard.getLayout = AdminEodNotes.getLayout;

export default ProtectedDashboard;