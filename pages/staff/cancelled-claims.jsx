import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  AlertCircle, User, Calendar, DollarSign, FileText, Phone, Mail, 
  RefreshCw, Filter, Search, ChevronDown, ChevronLeft, ChevronRight, X
} from "lucide-react";
import ClinicLayout from '../../components/staffLayout';
import withClinicAuth from '../../components/withStaffAuth';
import { jwtDecode } from "jwt-decode";

const ITEMS_PER_PAGE = 15;

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-lg text-gray-800 font-medium">Loading cancelled claims...</p>
    </div>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
    <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <p className="text-lg text-red-600 font-semibold mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
          Try Again
        </button>
      )}
    </div>
  </div>
);

const ClaimCard = ({ claim, onView, onEdit }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold truncate">{claim.patientName}</h3>
              <p className="text-red-100 text-sm truncate">INV: {claim.invoiceNumber}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 whitespace-nowrap flex-shrink-0">
            {claim.cancellationType}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600 text-xs mb-0.5">Doctor</p>
            <p className="text-gray-900 font-medium truncate">{claim.doctor}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-0.5">Service</p>
            <p className="text-gray-900 font-medium truncate">{claim.service}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-0.5">Total Amount</p>
            <p className="text-gray-900 font-bold">د.إ{claim.amount?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-gray-600 text-xs mb-0.5">Pending</p>
            <p className="text-red-600 font-bold">د.إ{claim.pending?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
          <p className="text-xs text-gray-600 mb-0.5">Cancellation Reason</p>
          <p className="text-gray-900 text-sm line-clamp-2">{claim.cancellationReason || 'No reason provided'}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => onView(claim)} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all">
            View Details
          </button>
          <button onClick={() => onEdit(claim)} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
            Edit & Approve
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewModal = ({ claim, onClose }) => {
  if (!claim) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex-shrink-0">
          <div>
            <h3 className="text-lg sm:text-xl font-bold">{claim.patientName}</h3>
            <p className="text-sm text-indigo-100">Invoice: {claim.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Patient Info
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">EMR Number</p>
                  <p className="text-gray-900 font-medium">{claim.emrNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Email</p>
                  <p className="text-gray-900 font-medium break-all">{claim.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Mobile</p>
                  <p className="text-gray-900 font-medium">{claim.mobileNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Medical Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Doctor</p>
                  <p className="text-gray-900 font-medium">{claim.doctor}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Service</p>
                  <p className="text-gray-900 font-medium">{claim.service}</p>
                </div>
                {claim.package && (
                  <div>
                    <p className="text-gray-600 text-xs">Package</p>
                    <p className="text-gray-900 font-medium">{claim.package}</p>
                  </div>
                )}
                {claim.treatment && (
                  <div>
                    <p className="text-gray-600 text-xs">Treatment</p>
                    <p className="text-gray-900 font-medium">{claim.treatment}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                Financial Details
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Total Amount</p>
                  <p className="text-gray-900 font-bold text-base">د.إ{claim.amount?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Amount Paid</p>
                  <p className="text-green-600 font-medium">د.إ{claim.paid?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Advance</p>
                  <p className="text-blue-600 font-medium">د.إ{claim.advance?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Pending</p>
                  <p className="text-red-600 font-medium">د.إ{claim.pending?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-base sm:text-lg font-semibold text-red-900 flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5" />
              Cancellation Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-red-700 text-xs mb-0.5">Type</p>
                <p className="text-red-900 font-medium">{claim.cancellationType}</p>
              </div>
              <div>
                <p className="text-red-700 text-xs mb-0.5">Date</p>
                <p className="text-red-900 font-medium">{new Date(claim.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            {claim.cancellationReason && (
              <div className="mt-3">
                <p className="text-red-700 text-xs mb-1">Reason</p>
                <div className="bg-white border border-red-200 rounded-lg p-2.5">
                  <p className="text-red-900 text-sm">{claim.cancellationReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Timeline</h5>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Date:</span>
                    <span className="text-gray-900">{claim.invoicedDate ? new Date(claim.invoicedDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{new Date(claim.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span className="text-gray-900">{new Date(claim.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Status</h5>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment:</span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">{claim.status || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Advance:</span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">{claim.advanceClaimStatus || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ claim, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    firstName: claim?.firstName || "",
    lastName: claim?.lastName || "",
    email: claim?.email || "",
    mobileNumber: claim?.mobileNumber || "",
    referredBy: claim?.referredBy || "",
    service: claim?.service || "",
    treatment: claim?.treatment || "",
    package: claim?.package || "",
    notes: claim?.notes || "",
  });

  const [showConfirm, setShowConfirm] = useState(false);

  // Ensure all fields are prefilled: derive first/last from patientName if missing
  useEffect(() => {
    if (!claim) return;
    const patientName = (claim.patientName || "").trim();
    let derivedFirst = form.firstName;
    let derivedLast = form.lastName;
    if ((!derivedFirst || !derivedLast) && patientName) {
      const parts = patientName.split(/\s+/);
      derivedFirst = derivedFirst || parts[0] || "";
      derivedLast = derivedLast || (parts.slice(1).join(" ") || "");
    }

    setForm({
      firstName: claim.firstName || derivedFirst || "",
      lastName: claim.lastName || derivedLast || "",
      email: claim.email || "",
      mobileNumber: claim.mobileNumber || "",
      referredBy: claim.referredBy || "",
      service: claim.service || "",
      treatment: claim.treatment || "",
      package: claim.package || "",
      notes: claim.notes || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim]);

  const handleSubmit = () => {
    setShowConfirm(true);
  };

  const confirmSave = () => {
    onSave(form);
    setShowConfirm(false);
  };

  if (!claim) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
        <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold">Edit Patient & Approve</h3>
              <p className="text-xs text-blue-100 mt-1">{claim.patientName} (INV: {claim.invoiceNumber})</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "First Name", key: "firstName" },
                { label: "Last Name", key: "lastName" },
                { label: "Email", key: "email" },
                { label: "Mobile Number", key: "mobileNumber" },
                { label: "Referred By", key: "referredBy" },
                { label: "Service", key: "service" },
                { label: "Treatment", key: "treatment" },
                { label: "Package", key: "package" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-800 mb-1">{label}</label>
                  <input 
                    value={form[key]} 
                    onChange={(e) => setForm({...form, [key]: e.target.value})} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-800 mb-1">Notes</label>
                <textarea 
                  rows={3} 
                  value={form.notes} 
                  onChange={(e) => setForm({...form, notes: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-gray-200 flex justify-end gap-2 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : 'Save & Approve'}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Approval</h3>
              <p className="text-gray-600 text-sm mb-6">Are you sure you want to save changes and approve this claim?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-300 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={confirmSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    let prev;
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) rangeWithDots.push(prev + 1);
        else if (i - prev !== 1) rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all text-gray-800">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {getPageNumbers().map((page, idx) => (
        page === '...' ? (
          <span key={`dot-${idx}`} className="px-3 py-2 text-gray-600">...</span>
        ) : (
          <button key={page} onClick={() => onPageChange(page)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-800 hover:bg-gray-50'}`}>
            {page}
          </button>
        )
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all text-gray-800">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const CancelledClaimsPage = () => {
  const router = useRouter();
  const [cancelledClaims, setCancelledClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [userRole, setUserRole] = useState(null);
  const [doctorName, setDoctorName] = useState(null);
  const [viewClaim, setViewClaim] = useState(null);
  const [editClaim, setEditClaim] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
        setDoctorName(decoded.name);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const fetchCancelledClaims = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("userToken");
      if (!token) throw new Error("No authentication token found");

      const response = await fetch('/api/staff/cancelled-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 403) throw new Error("Access denied. Only doctorStaff can view cancelled claims.");
        if (response.status === 401) throw new Error("Authentication failed. Please login again.");
        throw new Error("Failed to fetch cancelled claims");
      }

      const data = await response.json();
      setCancelledClaims(data.data || []);
      if (data.doctorName) setDoctorName(data.doctorName);
    } catch (err) {
      console.error("Error fetching cancelled claims:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === "doctorStaff") {
      fetchCancelledClaims();
    } else if (userRole && userRole !== "doctorStaff") {
      setError("Access denied. Only doctorStaff can view rejected claims.");
      setLoading(false);
    }
  }, [userRole]);

  const handleSaveEdit = async (form) => {
    if (!editClaim) return;
    setSavingEdit(true);
    try {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`/api/doctor/update-patient/${editClaim._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");

      setCancelledClaims((prev) => prev.filter((c) => c._id !== editClaim._id));
      setEditClaim(null);
    } catch (err) {
      alert(err.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredClaims = cancelledClaims.filter(claim => {
    const matchesSearch = claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || 
                         (filterType === "payment" && (claim.status === "Cancelled" || claim.status === "Rejected")) ||
                         (filterType === "advance" && claim.advanceClaimStatus === "Cancelled");
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredClaims.length / ITEMS_PER_PAGE);
  const paginatedClaims = filteredClaims.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCancelledClaims} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
                <span>Cancelled Claims</span>
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {doctorName ? `Dr. ${doctorName}` : 'View cancelled patient claims'}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={fetchCancelledClaims} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{filteredClaims.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="text-gray-900 w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-gray-800 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm">
                <option value="all">All Types</option>
                <option value="payment">Payment Cancelled</option>
                <option value="advance">Advance Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 sm:p-12 text-center">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Cancelled Claims Found</h3>
            <p className="text-gray-600 text-sm">
              {searchTerm || filterType !== "all" 
                ? "No claims match your search criteria."
                : doctorName 
                  ? `No cancelled claims for Dr. ${doctorName}.`
                  : "No cancelled claims available."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              {paginatedClaims.map((claim) => (
                <ClaimCard key={claim._id} claim={claim} onView={setViewClaim} onEdit={setEditClaim} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                <p className="text-center text-sm text-gray-600 mt-3">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredClaims.length)} of {filteredClaims.length} claims
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {viewClaim && <ViewModal claim={viewClaim} onClose={() => setViewClaim(null)} />}
      {editClaim && <EditModal claim={editClaim} onClose={() => setEditClaim(null)} onSave={handleSaveEdit} saving={savingEdit} />}
    </div>
  );
};

CancelledClaimsPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedCancelledClaimsPage = withClinicAuth(CancelledClaimsPage);
ProtectedCancelledClaimsPage.getLayout = CancelledClaimsPage.getLayout;

export default ProtectedCancelledClaimsPage;