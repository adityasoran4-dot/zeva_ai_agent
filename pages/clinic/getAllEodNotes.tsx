"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";

const ClinicEodNotes: NextPageWithLayout = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [staffList, setStaffList] = useState<string[]>([]);
  const [doctorStaffList, setDoctorStaffList] = useState<string[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedDoctorStaff, setSelectedDoctorStaff] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("clinicToken") ||
      sessionStorage.getItem("clinicToken") ||
      localStorage.getItem("agentToken") ||
      sessionStorage.getItem("agentToken") ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchAllNotes = useCallback(async (date = "", staff = "") => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        setLoading(false);
        return;
      }
      
      const query = [];
      if (date) query.push(`date=${date}`);
      if (staff) query.push(`staffName=${encodeURIComponent(staff)}`);

      const url = `/api/clinic/getAllEodNotes${query.length ? `?${query.join("&")}` : ""}`;

      const res = await axios.get(url, { headers });

      setNotes(res.data.eodNotes || []);
      setStaffList(res.data.staffList || []);
      setDoctorStaffList(res.data.doctorStaffList || []);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setNotes([]);
        setStaffList([]);
        setDoctorStaffList([]);
        alert(err.response?.data?.message || "Permission denied");
      } else {
        alert(err.response?.data?.message || "Error fetching notes");
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchAllNotes();
  }, [fetchAllNotes]);

  const handleFilterChange = () => {
    fetchAllNotes(selectedDate, selectedStaff || selectedDoctorStaff);
  };

  const handleClear = () => {
    setSelectedDate("");
    setSelectedStaff("");
    setSelectedDoctorStaff("");
    setSelectedRole("");
    setSearchQuery("");
    fetchAllNotes();
  };

  const toggleExpand = (index: number) => {
    setExpandedNotes(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const truncateText = (text: string, lines = 4) => {
    const textLines = text.split('\n');
    if (textLines.length <= lines) return text;
    return textLines.slice(0, lines).join('\n');
  };

  const shouldShowViewMore = (text: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-sm sm:text-base text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                EOD Notes Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Clinic View - Your Staff Reports</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Search by staff name or note content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              >
                <option value="">All Staff</option>
                {staffList.map((name, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              >
                <option value="">All Doctors</option>
                {doctorStaffList.map((name, i) => (
                  <option key={i} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg p-2.5 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
              >
                <option value="">All Roles</option>
                <option value="staff">Staff</option>
                <option value="agent">Agent</option>
                <option value="doctorStaff">Doctor Staff</option>
              </select>
            </div>

            <button
              onClick={handleFilterChange}
              className="sm:col-span-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 mt-7 text-sm"
            >
              Apply Filter
            </button>

            <button
              onClick={handleClear}
              className="sm:col-span-1 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105 mt-7 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Notes Display */}
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Notes Found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {filteredNotes.map((n, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
                        {n.staffName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-gray-800">{n.staffName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          n.staffRole === 'doctorStaff' 
                            ? 'bg-blue-100 text-blue-700' 
                            : n.staffRole === 'agent'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {n.staffRole === 'doctorStaff' ? 'Doctor Staff' : n.staffRole === 'agent' ? 'Agent' : 'Staff Member'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(n.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 sm:p-5">
                    <p className="text-gray-800 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {expandedNotes[i] ? n.note : truncateText(n.note)}
                    </p>
                    
                    {shouldShowViewMore(n.note) && (
                      <button
                        onClick={() => toggleExpand(i)}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 transition-colors"
                      >
                        {expandedNotes[i] ? (
                          <>
                            Show Less
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            View Full Note
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Notes</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-800">{filteredNotes.length}</p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Showing {filteredNotes.length} of {notes.length} notes
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ClinicEodNotes.getLayout = function PageLayout(page: React.ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

const ProtectedClinicEodNotes = withClinicAuth(ClinicEodNotes) as NextPageWithLayout;
ProtectedClinicEodNotes.getLayout = ClinicEodNotes.getLayout;

export default ProtectedClinicEodNotes;

