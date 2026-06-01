// pages/patients.js
"use client";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DoctorLayout from '../../components/DoctorLayout';
import withDoctorAuth from '../../components/withDoctorAuth';

const CHECKLIST_FIELDS = [
  { key: "appointment", label: "Appointment" },
  { key: "personalDetails", label: "Personal details" },
  { key: "treatment", label: "Treatment" },
  { key: "amount", label: "Amount" },
  { key: "complains", label: "Complains" },
  { key: "vitalSign", label: "Vital sign" },
  { key: "consentForm", label: "Consent form" },
  { key: "allergy", label: "Allergy" },
  { key: "invoiceDate", label: "Invoice date" },
  { key: "familyDetails", label: "Family details" },
  { key: "diagnosis", label: "Diagnosis" },
  { key: "startDate", label: "Start date" },
];

const ITEMS_PER_PAGE = 6;

function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUser, setCurrentUser] = useState({ role: "", _id: "" });
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  useEffect(() => {
    // Fetch current user and doctor list
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    axios.get("/api/doctor/patient-registration", { headers })
      .then(res => {
        if (res.data?.success) setCurrentUser(res.data.data);
      })
      .catch(() => {});
    axios.get("/api/admin/get-all-doctor-staff")
      .then(res => { if (res.data?.success) setDoctorList(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [selectedDoctorId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const getAuthHeader = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null;
    return { Authorization: `Bearer ${token}` };
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {};
      // For staff/admin/clinic, require a doctor filter; for doctorStaff, API will infer
      if (selectedDoctorId) params.doctorId = selectedDoctorId;
      const res = await axios.get("/api/doctor/pending-claims", { headers: getAuthHeader(), params });
      setPatients(res.data.data || []);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => p.advanceClaimStatus === activeTab)
      .filter((p) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          p.firstName?.toLowerCase().includes(term) ||
          p.lastName?.toLowerCase().includes(term) ||
          p.emrNumber?.toLowerCase().includes(term) ||
          p.doctor?.toLowerCase().includes(term)
        );
      });
  }, [patients, activeTab, searchTerm]);

  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  const totalPages = Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);

  const openModal = (patient) => {
    const init = {};
    CHECKLIST_FIELDS.forEach((f) => (init[f.key] = false));
    setChecklist(init);
    setSelectedPatient(patient);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPatient(null);
  };

  const submitRelease = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      const missed = CHECKLIST_FIELDS.filter((f) => !checklist[f.key]);
      if (missed.length > 0) {
        setErrorMsg("Please complete all checklist items.");
        setSaving(false);
        return;
      }

      const body = { id: selectedPatient._id, action: "release", checklist };
      const res = await axios.patch("/api/doctor/pending-claims", body, { headers: getAuthHeader() });
      setPatients((prev) => prev.map((p) => (p._id === res.data.data._id ? res.data.data : p)));
      closeModal();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Release failed");
    } finally {
      setSaving(false);
    }
  };

  const [cancelConfirm, setCancelConfirm] = useState(null);

  const doCancel = async (patient) => {
    setCancelConfirm(patient);
  };

  const confirmCancel = async () => {
    if (!cancelConfirm) return;
    try {
      const body = { id: cancelConfirm._id, action: "cancel" };
      const res = await axios.patch("/api/doctor/pending-claims", body, { headers: getAuthHeader() });
      setPatients((prev) => prev.map((p) => (p._id === res.data.data._id ? res.data.data : p)));
      setCancelConfirm(null);
    } catch (err) {
      alert(err.response?.data?.message || "Cancel failed");
      setCancelConfirm(null);
    }
  };

  const tabs = ["Pending", "Approved by doctor", "Released", "Cancelled"];
  const tabCounts = {
    Pending: patients.filter((p) => p.advanceClaimStatus === "Pending").length,
    "Approved by doctor": patients.filter((p) => p.advanceClaimStatus === "Approved by doctor").length,
    Released: patients.filter((p) => p.advanceClaimStatus === "Released").length,
    Cancelled: patients.filter((p) => p.advanceClaimStatus === "Cancelled").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-4 sm:p-6 ${(isModalOpen || cancelConfirm) ? 'overflow-hidden' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Patient Claims</h1>
          <p className="text-sm text-gray-600 mt-1">Manage patient claim statuses</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-1 mb-6 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab ? "bg-blue-500" : "bg-gray-200 text-gray-700"
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(currentUser.role === "staff" || currentUser.role === "admin" || currentUser.role === "clinic") && (
            <div>
              <label className="block text-sm text-gray-700 mb-2">Doctor</label>
              <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                <option value="">Select Doctor</option>
                {doctorList.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.role})</option>
                ))}
              </select>
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, EMR, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-11 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Patient Cards */}
        <div className="space-y-4">
          {paginatedPatients.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm">
              <div className="text-gray-400 mb-3">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No {activeTab.toLowerCase()} claims found</p>
            </div>
          ) : (
            paginatedPatients.map((p) => (
              <div key={p._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {p.firstName} {p.lastName}
                        </h3>
                        <span className="text-xs text-gray-500">{p.gender}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 block text-xs">EMR</span>
                        <span className="text-gray-800 font-medium">{p.emrNumber || "-"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-xs">Doctor</span>
                        <span className="text-gray-800 font-medium truncate block">{p.doctor}</span>
                      </div>
                      {activeTab === "Pending" && (
                        <>
                          <div>
                            <span className="text-gray-500 block text-xs">Pending Amount</span>
                            <span className="text-blue-600 font-semibold">د.إ{p.pending}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Invoice Date</span>
                            <span className="text-gray-800 font-medium">{new Date(p.invoicedDate).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                      {activeTab === "Approved by doctor" && (
                        <>
                          <div>
                            <span className="text-gray-500 block text-xs">Approved On</span>
                            <span className="text-gray-800 font-medium">{p.advanceClaimReleaseDate ? new Date(p.advanceClaimReleaseDate).toLocaleDateString() : "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Approved By</span>
                            <span className="text-gray-800 font-medium truncate block">{p.advanceClaimReleasedBy || "-"}</span>
                          </div>
                        </>
                      )}
                      {activeTab === "Released" && (
                        <>
                          <div>
                            <span className="text-gray-500 block text-xs">Released On</span>
                            <span className="text-gray-800 font-medium">{p.advanceClaimReleaseDate ? new Date(p.advanceClaimReleaseDate).toLocaleDateString() : "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Released By</span>
                            <span className="text-gray-800 font-medium truncate block">{p.advanceClaimReleasedBy || "-"}</span>
                          </div>
                        </>
                      )}
                      {activeTab === "Cancelled" && (
                        <div>
                          <span className="text-gray-500 block text-xs">Updated At</span>
                          <span className="text-gray-800 font-medium">{new Date(p.updatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col">
                    {activeTab === "Pending" && (
                      <>
                        <button
                          onClick={() => openModal(p)}
                          className="flex-1 sm:flex-initial bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Process
                        </button>
                        <button
                          onClick={() => doCancel(p)}
                          className="flex-1 sm:flex-initial border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {activeTab === "Approved by doctor" && (
                      <button
                        onClick={() => doCancel(p)}
                        className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {activeTab === "Released" && (
                      <button
                        onClick={() => doCancel(p)}
                        className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    {activeTab === "Cancelled" && (
                      <button
                        onClick={() => openModal(p)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Re-release
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)} of {filteredPatients.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Release Claim</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHECKLIST_FIELDS.map((f) => (
                  <label
                    key={f.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      checklist[f.key]
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checklist[f.key]}
                      onChange={() => setChecklist((s) => ({ ...s, [f.key]: !s[f.key] }))}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{f.label}</span>
                  </label>
                ))}
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errorMsg}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={submitRelease}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Releasing..." : "Release Claim"}
              </button>
              <button
                onClick={closeModal}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-white/30">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Cancel Claim</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to cancel the claim for <span className="font-semibold text-gray-800">{cancelConfirm.firstName} {cancelConfirm.lastName}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelConfirm(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  No, Keep It
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

PatientsPage.getLayout = function PageLayout(page) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDashboard = withDoctorAuth(PatientsPage);
ProtectedDashboard.getLayout = PatientsPage.getLayout;

export default ProtectedDashboard;