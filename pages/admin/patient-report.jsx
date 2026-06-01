"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";
import { Search, FileText, FileSpreadsheet, X, ChevronLeft, ChevronRight, Users, ClipboardList, DollarSign, Calendar, CheckCircle, XCircle, Clock, CreditCard, TrendingUp } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

const AdminPatientClaims = () => {
  const router = useRouter();
  
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 20;
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Patient Report - Initial Token Check:', { 
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
  // This page is under Staff Management -> Patient Report submodule
  const agentPermissionsData = useAgentPermissions(isAgent ? "admin_staff_management" : null, isAgent ? "Patient Report" : null);
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const fetchPatients = async (status = "") => {
    try {
      setLoading(true);
      
      // Get token - check for adminToken first, then agentToken (for agents accessing via /agent route)
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      const url = `/api/admin/getPatientClaims${status ? `?statusFilter=${status}` : ""}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        // Handle 403 permission denied errors
        if (res.status === 403) {
          setPatients([]);
          setFilteredPatients([]);
          setSummary({});
          throw new Error(errorData.message || 'Permission denied');
        }
        throw new Error(errorData.message || 'Failed to fetch patient claims');
      }

      const data = await res.json();
      const patientsData = data.patients || [];
      setPatients(patientsData);
      setFilteredPatients(patientsData);
      setSummary(data.summary || {});
    } catch (err) {
      console.error(err);
      alert(err.message || "Error fetching patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPatients();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchPatients();
        } else {
          setLoading(false); // Agent doesn't have read permission - stop loading
        }
      }
    } else {
      setLoading(false); // Neither admin nor agent - stop loading
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const handleFilterChange = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
    setSearchQuery("");
    setCurrentPage(1);
    fetchPatients(status);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);

    if (query === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.mobileNumber?.toLowerCase().includes(query) ||
        p.invoiceNumber?.toLowerCase().includes(query) ||
        p.emrNumber?.toLowerCase().includes(query) ||
        p.service?.toLowerCase().includes(query) ||
        p.treatment?.toLowerCase().includes(query) ||
        p.package?.toLowerCase().includes(query)
      );
      setFilteredPatients(filtered);
    }
  };

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const downloadCSV = () => {
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canExport !== true && agentPermissions.canAll !== true) {
      alert("You do not have permission to export patient reports");
      return;
    }
    
    if (filteredPatients.length === 0) {
      alert("No data to download");
      return;
    }

    const headers = [
      "Invoice Number", "EMR Number", "First Name", "Last Name", "Gender", "Email", "Mobile",
      "Referred By", "Patient Type", "Doctor", "Service", "Treatment", "Package",
      "Amount", "Paid", "Advance", "Pending", "Payment Method",
      "Insurance", "Advance Given Amount", "Co-pay %", "Need To Pay",
      "Advance Claim Status", "Status", "Invoiced Date", "Created At"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredPatients.map(p => [
        `"${p.invoiceNumber || ''}"`,
        `"${p.emrNumber || ''}"`,
        `"${p.firstName || ''}"`,
        `"${p.lastName || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.email || ''}"`,
        `"${p.mobileNumber || ''}"`,
        `"${p.referredBy || ''}"`,
        `"${p.patientType || ''}"`,
        `"${p.doctor?.name || p.doctor || ''}"`,
        `"${p.service || ''}"`,
        `"${p.treatment || ''}"`,
        `"${p.package || ''}"`,
        `"${p.amount || ''}"`,
        `"${p.paid || ''}"`,
        `"${p.advance || ''}"`,
        `"${p.pending || ''}"`,
        `"${p.paymentMethod || ''}"`,
        `"${p.insurance || ''}"`,
        `"${p.advanceGivenAmount || ''}"`,
        `"${p.coPayPercent || ''}"`,
        `"${p.needToPay || ''}"`,
        `"${p.advanceClaimStatus || ''}"`,
        `"${p.status || ''}"`,
        `"${p.invoicedDate || ''}"`,
        `"${p.createdAt || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `patient_claims_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    // CRITICAL: Check route and tokens to determine if user is admin or agent
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    // Check permissions only for agents - admins bypass all checks
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canPrint !== true && agentPermissions.canAll !== true) {
      alert("You do not have permission to print patient reports");
      return;
    }
    
    if (filteredPatients.length === 0) {
      alert("No data to download");
      return;
    }

    const printWindow = window.open("", "_blank");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Patient Claims Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; text-align: center; margin-bottom: 10px; }
          .report-date { text-align: center; color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #3b82f6; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          @media print {
            body { padding: 10px; }
            table { font-size: 8px; }
            th, td { padding: 4px; }
          }
        </style>
      </head>
      <body>
        <h1>📋 Patient Claims Report</h1>
        <div class="report-date">Generated on ${new Date().toLocaleString()}</div>
        <p><strong>Total Records:</strong> ${filteredPatients.length}</p>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>EMR</th>
              <th>Patient Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Treatment</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Pending</th>
              <th>Advance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPatients.map(p => `
              <tr>
                <td>${p.invoiceNumber || ''}</td>
                <td>${p.emrNumber || ''}</td>
                <td>${p.firstName || ''} ${p.lastName || ''}</td>
                <td>${p.email || ''}</td>
                <td>${p.mobileNumber || ''}</td>
                <td>${p.treatment || p.package || ''}</td>
                <td>د.إ${p.amount || ''}</td>
                <td>د.إ${p.paid || ''}</td>
                <td>د.إ${p.pending || ''}</td>
                <td>د.إ${p.advance || ''}</td>
                <td>${p.advanceClaimStatus || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-gray-100 text-gray-800 border-gray-800",
      Released: "bg-green-100 text-green-800 border-green-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
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
            You do not have permission to view patient reports. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 p-2 sm:p-3 md:p-4 lg:p-5">
      <div className="w-full max-w-[1600px] mx-auto">

        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                  <ClipboardList className="w-5 h-5 text-blue-800" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-blue-800 truncate">
                    Patient Claims Dashboard
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-600 mt-0.5">
                    Manage and monitor patient claims
                  </p>
                </div>
              </div>

              {/* Filter Dropdown */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                <label className="font-medium text-gray-700 text-xs whitespace-nowrap">
                  Filter by Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={handleFilterChange}
                  className="text-blue-800 w-full xs:w-auto min-w-[140px] border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm hover:border-gray-400"
                >
                  <option value="">All Claims</option>
                  <option value="Pending">Pending</option>
                  <option value="Released">Released</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="co-pay">Co-pay</option>
                  <option value="advance">Advance</option>
                </select>
              </div>
            </div>

            {/* Search Bar and Export Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, mobile, invoice, EMR, service..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="text-gray-800 w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-2">
                {/* Download CSV button: Only show for admins OR agents with explicit export permission */}
                {(() => {
                  const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                  const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                  const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                  
                  // Admin always sees button - but ONLY if NOT on agent route
                  if (!isAgentRoute && adminTokenExists && isAdmin) {
                    return (
                      <>
                        <button
                          onClick={downloadCSV}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Download CSV"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span className="hidden xs:inline">CSV</span>
                        </button>
                        <button
                          onClick={downloadPDF}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden xs:inline">PDF</span>
                        </button>
                      </>
                    );
                  }
                  
                  // For agents: Only show if permissions are loaded AND export/print permission is explicitly true
                  if ((isAgentRoute || isAgent) && agentTokenExists) {
                    if (permissionsLoading || !agentPermissions) {
                      return null;
                    }
                    
                    const hasExportPermission = agentPermissions.canExport === true || agentPermissions.canAll === true;
                    const hasPrintPermission = agentPermissions.canPrint === true || agentPermissions.canAll === true;
                    
                    return (
                      <>
                        {hasExportPermission && (
                          <button
                            onClick={downloadCSV}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                            title="Download CSV"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span className="hidden xs:inline">CSV</span>
                          </button>
                        )}
                        {hasPrintPermission && (
                          <button
                            onClick={downloadPDF}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                            title="Download PDF"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="hidden xs:inline">PDF</span>
                          </button>
                        )}
                      </>
                    );
                  }
                  
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 text-blue-800 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {[
            { label: "Pending", value: summary.pending || 0, icon: Clock },
            { label: "Released", value: summary.released || 0, icon: CheckCircle },
            { label: "Cancelled", value: summary.cancelled || 0, icon: XCircle },
            { label: "Co-pay", value: summary.copay || 0, icon: CreditCard },
            { label: "Advance", value: summary.advance || 0, icon: DollarSign },
            { label: "Total", value: summary.total || 0, icon: TrendingUp },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 border border-blue-200 hover:border-gray-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <Icon className="w-4 h-4 text-gray-800" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                  {item.value}
                </div>
                <div className="text-xs text-gray-500 font-medium mt-1 truncate">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Patient List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                <Users className="w-4 h-4 text-gray-800" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800">
                Patient Records
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              {filteredPatients.length} {filteredPatients.length === 1 ? "record" : "records"} found
              {searchQuery && ` (filtered from ${patients.length} total)`}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-3 text-sm">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200">
                <Users className="w-6 h-6 text-gray-800" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {searchQuery ? "No matching patients found" : "No patients found"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {searchQuery ? "Try a different search term" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <>
              {/* Patient Cards Grid - 3 cards per row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
                {currentPatients.map((patient, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-gray-900 truncate">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">{patient.emrNumber}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ml-2 ${getStatusColor(patient.advanceClaimStatus)}`}>
                        {patient.advanceClaimStatus}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Treatment:</span>
                        <span className="font-medium text-gray-900 truncate ml-2 text-right" title={patient.treatment || patient.package}>
                          {patient.treatment || patient.package || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium text-gray-900">د.إ{patient.amount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium text-green-600">د.إ{patient.paid?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-medium text-red-600">د.إ{patient.pending?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Advance:</span>
                        <span className="font-medium text-blue-600">د.إ{patient.advance?.toLocaleString() || 0}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="w-full py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                    >
                      See Full Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-3 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="flex gap-1">
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2.5 py-1 text-sm rounded-lg transition-all shadow-sm ${currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Patient Detail Modal with Blurred Background */}
      {selectedPatient && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm bg-black/20" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Patient Details</span>
              </h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-900 flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Personal Information */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1.5">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-sm"><span className="text-gray-600">Invoice Number:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.invoiceNumber || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">EMR Number:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.emrNumber || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">First Name:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.firstName || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Last Name:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.lastName || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Gender:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.gender || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Email:</span> <span className="font-medium text-gray-900 ml-2 break-words">{selectedPatient.email || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Mobile:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.mobileNumber || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Patient Type:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.patientType || '-'}</span></div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1.5">Medical Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-sm"><span className="text-gray-600">Doctor:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.doctor?.name || selectedPatient.doctor || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Service:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.service || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Treatment:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.treatment || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Package:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.package || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Referred By:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.referredBy || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Insurance:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.insurance || '-'}</span></div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1.5">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-sm"><span className="text-gray-600">Total Amount:</span> <span className="font-medium text-gray-900 ml-2">د.إ{selectedPatient.amount?.toLocaleString() || 0}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Paid Amount:</span> <span className="font-medium text-green-600 ml-2">د.إ{selectedPatient.paid?.toLocaleString() || 0}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Pending Amount:</span> <span className="font-medium text-red-600 ml-2">د.إ{selectedPatient.pending?.toLocaleString() || 0}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Advance:</span> <span className="font-medium text-blue-600 ml-2">د.إ{selectedPatient.advance?.toLocaleString() || 0}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Advance Given:</span> <span className="font-medium text-gray-900 ml-2">د.إ{selectedPatient.advanceGivenAmount?.toLocaleString() || 0}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Co-pay %:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.coPayPercent || 0}%</span></div>
                  <div className="text-sm"><span className="text-gray-600">Need to Pay:</span> <span className="font-medium text-gray-900 ml-2">د.إ{selectedPatient.needToPay?.toLocaleString() || 0}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Payment Method:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.paymentMethod || '-'}</span></div>
                </div>
              </div>

              {/* Claim Status */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1.5">Claim Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="text-sm"><span className="text-gray-600">Claim Status:</span> <span className={`font-medium ml-2 ${selectedPatient.advanceClaimStatus === 'Pending' ? 'text-gray-600' :
                      selectedPatient.advanceClaimStatus === 'Released' ? 'text-green-600' :
                        'text-red-600'
                    }`}>{selectedPatient.advanceClaimStatus || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Patient Status:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.status || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Invoiced By:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.invoicedBy || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Released By:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.advanceClaimReleasedBy || '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Invoice Date:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.invoicedDate ? new Date(selectedPatient.invoicedDate).toLocaleDateString() : '-'}</span></div>
                  <div className="text-sm"><span className="text-gray-600">Created At:</span> <span className="font-medium text-gray-900 ml-2">{selectedPatient.createdAt ? new Date(selectedPatient.createdAt).toLocaleString() : '-'}</span></div>
                </div>
              </div>

              {/* Payment History */}
              {selectedPatient.paymentHistory && selectedPatient.paymentHistory.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1.5">Payment History</h3>
                  <div className="space-y-2">
                    {selectedPatient.paymentHistory.map((payment, idx) => (
                      <div key={idx} className="bg-gray-50 p-2.5 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="text-xs text-gray-800 font-medium">Payment #{idx + 1}</span>
                          <p className="text-xs text-gray-600">{payment.date ? new Date(payment.date).toLocaleString() : '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-600">د.إ{payment.amount?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-700">{payment.method || '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

AdminPatientClaims.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard = withAdminAuth(AdminPatientClaims);
ProtectedDashboard.getLayout = AdminPatientClaims.getLayout;

export default ProtectedDashboard;