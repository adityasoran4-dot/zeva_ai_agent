import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Loader2 } from "lucide-react";
import ClinicLayout from "../../components/staffLayout";
import withClinicAuth from "../../components/withStaffAuth";

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
    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const getAuthHeaders = () => {
  const token = getStoredToken();
  if (!token) {
    return null;
  }
  return { Authorization: `Bearer ${token}` };
};

const MembershipModal = ({ isOpen, onClose, permissions = { canCreate: true }, isClinicContext = false }) => {
  const [emrNumber, setEmrNumber] = useState("");
  const [fetching, setFetching] = useState(false);
  const [patient, setPatient] = useState(null);
  const [doctorList, setDoctorList] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");
  const [lines, setLines] = useState([]); // { treatmentName, unitCount, unitPrice, lineTotal }
  const [packageDurationMonths, setPackageDurationMonths] = useState("");
  const [packageStartDate, setPackageStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [packageEndDate, setPackageEndDate] = useState("");
  // EMR autocomplete state
  const [emrSuggestions, setEmrSuggestions] = useState([]);
  const [emrSuggesting, setEmrSuggesting] = useState(false);
  const emrInputRef = useRef(null);
  const [emrDropdownRect, setEmrDropdownRect] = useState(null);
  const totalConsumed = useMemo(() => lines.reduce((s, l) => s + (Number(l.lineTotal) || 0), 0), [lines]);
  const packageAmount = useMemo(() => {
    if (!selectedPackage) return 0;
    const p = packages.find(p => p.name === selectedPackage);
    return p && typeof p.price === 'number' ? p.price : 0;
  }, [selectedPackage, packages]);
  const remaining = useMemo(() => Math.max(0, Number(packageAmount || 0) - Number(totalConsumed || 0)), [packageAmount, totalConsumed]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paidAmount, setPaidAmount] = useState("");

  const token = getStoredToken();

  // Reset modal state each time it opens so EMR field shows again
  useEffect(() => {
    if (isOpen) {
      setPatient(null);
      setEmrNumber("");
      setEmrSuggestions([]);
      setSelectedPackage("");
      setSelectedTreatment("");
      setSelectedPrice("");
      setLines([]);
      setPackageDurationMonths("");
      setPackageStartDate(new Date().toISOString().split('T')[0]);
      setPackageEndDate("");
      setPaymentMethod("");
      setPaidAmount("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/get-all-doctor-staff")
      .then(res => res.json())
      .then(json => json.success && setDoctorList(json.data))
      .catch(() => { });

    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreatments(data.data.filter(i => i.treatment).map(i => ({ name: i.treatment, price: i.treatmentPrice })));
          setPackages(data.data.filter(i => i.package).map(i => ({ name: i.package, price: i.packagePrice })));
        }
      })
      .catch(() => { });
  }, [isOpen]);

  const fetchByEmr = useCallback(async (overrideEmr) => {
    const emrToFetch = (overrideEmr ?? emrNumber).trim();
    if (!emrToFetch) return;
    try {
      setFetching(true);
      const headers = getAuthHeaders();
      if (!headers) {
        alert("Authentication required. Please login again.");
        return;
      }
      const res = await fetch(`/api/staff/patient-registration/${emrToFetch}`, {
        headers
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatient(data.data);
        // Clear EMR field and suggestions once we have a patient, and hide the search UI
        setEmrSuggestions([]);
        setEmrNumber("");
      } else {
        setPatient(null);
        alert(data.message || "Patient not found");
      }
    } catch {
      setPatient(null);
      alert("Failed to fetch patient");
    } finally {
      setFetching(false);
    }
  }, [emrNumber, token]);

  useEffect(() => {
    if (selectedTreatment) {
      const t = treatments.find(t => t.name === selectedTreatment);
      if (t && typeof t.price === "number") {
        setSelectedPrice(t.price.toFixed(2));
        return;
      }
    }
    setSelectedPrice("");
  }, [selectedTreatment, treatments]);

  // Calculate package end date when duration changes
  useEffect(() => {
    if (packageDurationMonths && packageStartDate) {
      const startDate = new Date(packageStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(packageDurationMonths));
      setPackageEndDate(endDate.toISOString().split('T')[0]);
    }
  }, [packageDurationMonths, packageStartDate]);

  // EMR autocomplete (debounced)
  useEffect(() => {
    let handle;
    const q = emrNumber.trim();
    if (!isOpen) { setEmrSuggestions([]); return; }
    if (q.length < 2) { setEmrSuggestions([]); return; }
    setEmrSuggesting(true);
    handle = setTimeout(async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) {
          setEmrSuggestions([]);
          return;
        }
        const res = await fetch(`/api/staff/emr-search?q=${encodeURIComponent(q)}`, {
          headers
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setEmrSuggestions(json.data || []);
          // measure input position for dropdown placement
          if (emrInputRef.current) {
            const rect = emrInputRef.current.getBoundingClientRect();
            setEmrDropdownRect({
              top: rect.bottom + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width
            });
          }
        } else {
          setEmrSuggestions([]);
        }
      } catch {
        setEmrSuggestions([]);
      } finally {
        setEmrSuggesting(false);
      }
    }, 250);
    return () => { if (handle) clearTimeout(handle); };
  }, [emrNumber, isOpen, token]);

  // Keep dropdown aligned on resize/scroll
  useEffect(() => {
    const updateRect = () => {
      if (emrInputRef.current) {
        const rect = emrInputRef.current.getBoundingClientRect();
        setEmrDropdownRect({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    };
    if (emrSuggestions && emrSuggestions.length > 0) {
      updateRect();
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect, true);
      return () => {
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect, true);
      };
    }
  }, [emrSuggestions]);

  const addLine = () => {
    const name = selectedTreatment || "";
    const unitPrice = (() => {
      if (selectedTreatment) {
        const t = treatments.find(t => t.name === selectedTreatment);
        if (t && typeof t.price === "number") return t.price;
      }
      return 0;
    })();
    if (!name || unitPrice <= 0) return;
    const unitCount = 1;
    const lineTotal = unitCount * unitPrice;
    setLines(prev => [...prev, { treatmentName: name, unitCount, unitPrice, lineTotal }]);
  };

  const updateLine = (idx, key, value) => {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, [key]: key === 'unitCount' || key === 'unitPrice' ? Number(value) : value };
      next.lineTotal = Number(next.unitCount || 0) * Number(next.unitPrice || 0);
      return next;
    }));
  };

  const removeLine = (idx) => setLines(prev => prev.filter((_, i) => i !== idx));

  const saveMembership = async () => {
    // Check clinic permissions
    if (isClinicContext && !permissions.canCreate) {
      alert("You do not have permission to create memberships");
      return;
    }
    
    if (!patient || !selectedPackage || !packageDurationMonths) {
      alert("Select package, enter duration and fetch a patient first");
      return;
    }
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        alert("Authentication required. Please login again.");
        return;
      }
      const res = await fetch('/api/staff/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          emrNumber: patient.emrNumber,
          patientId: patient._id,
          packageName: selectedPackage,
          packageAmount,
          packageStartDate,
          packageEndDate,
          packageDurationMonths: parseInt(packageDurationMonths),
          paymentMethod,
          paidAmount: Number(paidAmount) || 0,
          treatments: lines.map(l => ({ treatmentName: l.treatmentName, unitCount: l.unitCount, unitPrice: l.unitPrice })),
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed');
      alert('Membership saved');
      setLines([]);
      setPaymentMethod("");
      setPaidAmount("");
      setPackageDurationMonths("");
      setPackageStartDate(new Date().toISOString().split('T')[0]);
      setPackageEndDate("");
    } catch (e) {
      alert(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Add Membership</h3>
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 rounded-md text-gray-800 hover:bg-gray-200">Close</button>
        </div>

        <div className="p-4 space-y-6">
          {!patient && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-800 mb-1">EMR Number</label>
                <input ref={emrInputRef} value={emrNumber} onChange={e => setEmrNumber(e.target.value)} placeholder="Enter EMR Number" className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" />
                {(emrSuggesting || (emrSuggestions && emrSuggestions.length > 0)) && emrNumber.trim().length >= 2 && emrDropdownRect && (
                  <div
                    className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-auto"
                    style={{
                      top: emrDropdownRect.top + 4,
                      left: emrDropdownRect.left,
                      width: Math.min(Math.max(emrDropdownRect.width, 360), window.innerWidth - emrDropdownRect.left - 16)
                    }}
                  >
                    {emrSuggesting && <div className="px-3 py-2 text-sm text-gray-600">Searching...</div>}
                    {!emrSuggesting && emrSuggestions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-600">No matches</div>
                    )}
                    {!emrSuggesting && emrSuggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => { setEmrSuggestions([]); fetchByEmr(s.emrNumber || ""); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-900"
                      >
                        <div className="font-medium truncate">{s.emrNumber}</div>
                        <div className="text-xs text-gray-600 truncate">{[s.firstName, s.lastName].filter(Boolean).join(" ")}{s.mobileNumber ? ` · ${s.mobileNumber}` : ''}</div>
                      </button>
                    ))}
            </div>
                )}
          </div>
              <button onClick={() => fetchByEmr()} disabled={fetching || !emrNumber.trim()} className={`px-5 py-2 rounded-md text-white ${fetching || !emrNumber.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>{fetching ? 'Fetching...' : 'Fetch'}</button>
            </div>
          )}

          {patient && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Info label="EMR Number" value={patient.emrNumber} />
                  <Info label="First Name" value={patient.firstName} />
                  <Info label="Last Name" value={patient.lastName} />
                  <Info label="Email" value={patient.email} />
                  <Info label="Mobile (Restricted)" value={patient.mobileNumber} />
                  <Info label="Gender" value={patient.gender} />
                  <Info label="Patient Type" value={patient.patientType} />
                  <Info label="Referred By" value={patient.referredBy} />
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Medical Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Doctor</label>
                    <select value={patient.doctor || ""} disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Doctor</option>
                      {doctorList.map(d => (
                        <option key={d._id} value={d._id}>{d.name} ({d.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Service</label>
                    <select value={patient.service || ""} disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Service</option>
                      <option value="Package">Package</option>
                      <option value="Treatment">Treatment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Referred By</label>
                    <input value={patient.referredBy || ""} disabled className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Add Membership</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package</label>
                    <select value={selectedPackage} onChange={e => { setSelectedPackage(e.target.value); setSelectedTreatment(""); }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Package</option>
                      {packages.map(p => (
                        <option key={p.name} value={p.name}>{p.name}{typeof p.price === 'number' ? ` - د.إ${p.price.toFixed(2)}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package Duration (Months) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={packageDurationMonths}
                      onChange={e => setPackageDurationMonths(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                      placeholder="e.g., 6"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package Start Date</label>
                    <input
                      type="date"
                      value={packageStartDate}
                      onChange={e => setPackageStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Package End Date</label>
                    <input
                      type="date"
                      value={packageEndDate}
                      readOnly
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Treatment</label>
                    <select value={selectedTreatment} onChange={e => { setSelectedTreatment(e.target.value); }} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                      <option value="">Select Treatment</option>
                      {treatments.map(t => (
                        <option key={t.name} value={t.name}>{t.name}{typeof t.price === 'number' ? ` - د.إ${t.price.toFixed(2)}` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Price</label>
                    <div className="flex gap-2">
                      <input value={selectedPrice ? `د.إ ${selectedPrice}` : ""} readOnly className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-gray-50" />
                      <button onClick={addLine} disabled={!selectedTreatment || !selectedPrice} className={`px-4 py-2 rounded-md text-white ${(!selectedTreatment || !selectedPrice) ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>Add</button>
                    </div>
                  </div>
                </div>
                

                {selectedPackage && (
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 text-gray-700">
                    <div className="lg:col-span-2">
                      <table className="w-full text-sm border rounded-md overflow-hidden">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2 text-left">Treatment</th>
                            <th className="p-2 text-right">Unit Price</th>
                            <th className="p-2 text-right">Units</th>
                            <th className="p-2 text-right">Line Total</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((l, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">{l.treatmentName}</td>
                              <td className="p-2 text-right">د.إ {Number(l.unitPrice).toFixed(2)}</td>
                              <td className="p-2 text-right">
                                <input type="number" min={1} value={l.unitCount} onChange={e => updateLine(idx, 'unitCount', e.target.value)} className="w-20 border border-gray-300 rounded px-2 py-1 text-right" />
                              </td>
                              <td className="p-2 text-right">د.إ {Number(l.lineTotal).toFixed(2)}</td>
                              <td className="p-2 text-right">
                                <button onClick={() => removeLine(idx)} className="text-red-600 hover:underline">Remove</button>
                              </td>
                            </tr>
                          ))}
                          {lines.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-gray-700">No treatments added yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 border rounded-md p-3 h-max">
                      <div className="flex justify-between text-sm mb-2"><span>Package Total</span><span className="font-semibold">د.إ {Number(packageAmount).toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm mb-2"><span>Consumed</span><span className="font-semibold">د.إ {Number(totalConsumed).toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm mb-2"><span>Remaining</span><span className="font-semibold">د.إ {Number(remaining).toFixed(2)}</span></div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-800 mb-1">Payment Method</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                          <option value="">Select Method</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="BT">BT</option>
                          <option value="Tabby">Tabby</option>
                          <option value="Tamara">Tamara</option>
                        </select>
                      </div>
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-800 mb-1">Paid Amount</label>
                        <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder="0.00" step="0.01" />
                      </div>

                      <button onClick={saveMembership} disabled={!selectedPackage} className={`mt-3 w-full py-2 rounded-md text-white ${!selectedPackage ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>Save Membership</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-600 mb-1">{label}</div>
    <div className="text-sm font-medium text-gray-900">{value || "-"}</div>
  </div>
);

// Helper function to calculate remaining days
const calculateRemainingDays = (endDate) => {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to get validity status
const getValidityStatus = (endDate) => {
  const remainingDays = calculateRemainingDays(endDate);
  if (remainingDays < 0) {
    return { text: "Expired", color: "text-red-600", bg: "bg-red-50" };
  } else if (remainingDays <= 7) {
    return { text: `${remainingDays} day${remainingDays !== 1 ? 's' : ''} left`, color: "text-orange-600", bg: "bg-orange-50" };
  } else if (remainingDays <= 30) {
    return { text: `${remainingDays} days left`, color: "text-yellow-600", bg: "bg-yellow-50" };
  } else {
    return { text: `${remainingDays} days left`, color: "text-green-600", bg: "bg-green-50" };
  }
};

function MembershipPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateItem, setUpdateItem] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferItem, setTransferItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);

  const token = getStoredToken();

  // Check if we're in clinic context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setIsClinicContext(path.startsWith("/clinic/"));
    } else if (router?.pathname) {
      setIsClinicContext(router.pathname.startsWith("/clinic/"));
    }
  }, [router?.pathname]);

  // Fetch permissions for clinic context
  const fetchClinicPermissions = useCallback(async () => {
    if (!isClinicContext) {
      setPermissionsLoaded(true);
      return;
    }

    try {
      setPermissionsLoaded(false);
      const token = getStoredToken();
      if (!token) {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
        setPermissionsLoaded(true);
        return;
      }

      const res = await axios.get("/api/clinic/permissions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      if (data.success && data.data) {
        // Find clinic_staff_management module
        const modulePermission = data.data.permissions?.find((p) => {
          if (!p?.module) return false;
          const normalized = p.module.startsWith("clinic_")
            ? p.module.slice(7)
            : p.module.startsWith("admin_")
            ? p.module.slice(6)
            : p.module;
          return normalized === "clinic_staff_management" || normalized === "staff_management";
        });

        if (modulePermission) {
          const actions = modulePermission.actions || {};
          const moduleAll = actions.all === true || 
                           actions.all === "true" || 
                           String(actions.all).toLowerCase() === "true";

          // Find "Membership" submodule
          const membershipSubModule = modulePermission.subModules?.find(
            (sm) => {
              const subModuleName = (sm?.name || "").trim();
              const subModulePath = (sm?.path || "").trim();
              const nameMatch = subModuleName === "Membership" || 
                               subModuleName.toLowerCase().includes("membership");
              const pathMatch = subModulePath.includes("/membership");
              return nameMatch || pathMatch;
            }
          );

          if (membershipSubModule) {
            const subModuleActions = membershipSubModule.actions || {};
            const subModuleAll = subModuleActions.all === true || 
                                subModuleActions.all === "true" || 
                                String(subModuleActions.all).toLowerCase() === "true";

            const checkPermission = (actionName) => {
              if (subModuleActions && subModuleActions.hasOwnProperty(actionName)) {
                const actionValue = subModuleActions[actionName];
                if (actionValue === true || actionValue === "true" || String(actionValue).toLowerCase() === "true") {
                  return true;
                }
                if (actionValue === false || actionValue === "false" || String(actionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              if (subModuleAll) return true;
              if (actions && actions.hasOwnProperty(actionName)) {
                const moduleActionValue = actions[actionName];
                if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                  return true;
                }
                if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                  return false;
                }
              }
              if (moduleAll) return true;
              return false;
            };

            setPermissions({
              canCreate: checkPermission("create"),
              canRead: checkPermission("read"),
              canUpdate: checkPermission("update"),
              canDelete: checkPermission("delete"),
            });
          } else {
            const checkPermission = (actionName) => {
              if (moduleAll) return true;
              const moduleActionValue = actions[actionName];
              if (moduleActionValue === true || moduleActionValue === "true" || String(moduleActionValue).toLowerCase() === "true") {
                return true;
              }
              if (moduleActionValue === false || moduleActionValue === "false" || String(moduleActionValue).toLowerCase() === "false") {
                return false;
              }
              return false;
            };

            setPermissions({
              canCreate: checkPermission("create"),
              canRead: checkPermission("read"),
              canUpdate: checkPermission("update"),
              canDelete: checkPermission("delete"),
            });
          }
        } else {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
        }
      } else {
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
      }
    } catch (error) {
      console.error("Error fetching clinic permissions for Membership:", error);
      setPermissions({
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
      });
    } finally {
      setPermissionsLoaded(true);
    }
  }, [isClinicContext]);

  useEffect(() => {
    fetchClinicPermissions();
  }, [fetchClinicPermissions]);

  const fetchMemberships = useCallback(async () => {
    if (isClinicContext && !permissionsLoaded) {
      return;
    }
    if (isClinicContext && !permissions.canRead) {
      setList([]);
      return;
    }
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        return;
      }
      const res = await fetch('/api/staff/members', {
        headers
      });
      const json = await res.json();
      if (res.ok && json.success) setList(json.data || []);
    } catch { }
  }, [token, isClinicContext, permissionsLoaded, permissions.canRead]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  const filteredList = list.filter(item =>
    item.emrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state while checking permissions
  if (isClinicContext && !permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-sm text-gray-700">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied if no read permission
  if (isClinicContext && permissionsLoaded && !permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl">
            !
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to view or manage memberships. Please contact your administrator if you believe this is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Memberships</h1>
              <p className="text-gray-600 text-sm mt-1">Manage member packages and benefits</p>
            </div>
            {(!isClinicContext || permissions.canCreate) && (
              <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                + Add Membership
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by EMR or package name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-black w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
                </div>

        {/* Memberships Grid */}
        {filteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map(item => {
              const validityStatus = item.packageEndDate ? getValidityStatus(item.packageEndDate) : null;
              const utilization = (item.totalConsumedAmount / item.packageAmount) * 100;

              return (
                <div key={item._id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.packageName}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.emrNumber}</p>
                </div>
                    {validityStatus && (
                      <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${validityStatus.bg} ${validityStatus.color}`}>
                        {validityStatus.text}
                </div>
                    )}
                </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">PACKAGE</p>
                      <p className="text-sm font-semibold text-gray-900">د.إ{Number(item.packageAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">CONSUMED</p>
                      <p className="text-sm font-semibold text-gray-900">د.إ{Number(item.totalConsumedAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium mb-1">REMAINING</p>
                      <p className={`text-sm font-semibold ${item.remainingBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        د.إ{Number(Math.abs(item.remainingBalance || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Utilization</span>
                      <span className="text-xs font-medium text-gray-900">{Math.min(utilization, 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>
                  </div>

                  {/* Validity Period */}
                  {item.packageStartDate && item.packageEndDate && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Valid Until</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(item.packageEndDate).toLocaleDateString()}
                      </p>
                </div>
              )}

                  {/* Transfer History */}
                  {item.transferHistory && item.transferHistory.length > 0 && (
                    <div className="mb-4 p-2.5 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium">📤 {item.transferHistory.length} Transfer(s)</p>
                </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {(!isClinicContext || permissions.canRead) && (
                      <button onClick={() => { setViewItem(item); setViewOpen(true); }} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors">
                        View
                      </button>
                    )}
                    {(!isClinicContext || permissions.canUpdate) && (
                      <button onClick={() => { setUpdateItem(item); setUpdateOpen(true); }} className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm hover:bg-green-100 transition-colors">
                        Edit
                      </button>
                    )}
                    {(!isClinicContext || permissions.canUpdate) && (
                      <button onClick={() => { setTransferItem(item); setTransferOpen(true); }} className="flex-1 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg font-medium text-sm hover:bg-amber-100 transition-colors">
                        Transfer
                      </button>
                    )}
                    {isClinicContext && !permissions.canRead && !permissions.canUpdate && (
                      <span className="text-xs text-gray-400 text-center w-full py-2">No actions available</span>
                    )}
              </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 text-lg font-medium">No memberships found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search</p>
          </div>
        )}

        {/* Modals */}
        <MembershipModal isOpen={open} onClose={() => { setOpen(false); fetchMemberships(); }} permissions={permissions} isClinicContext={isClinicContext} />

        {/* View Modal */}
        {viewOpen && viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Membership Details</h3>
                <button onClick={() => { setViewOpen(false); setViewItem(null); }} className="p-1 hover:bg-blue-500 rounded transition-colors">✕</button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'EMR Number', value: viewItem.emrNumber },
                    { label: 'Package', value: viewItem.packageName },
                    { label: 'Amount', value: `د.إ${Number(viewItem.packageAmount || 0).toLocaleString()}` },
                    { label: 'Paid', value: `د.إ${Number(viewItem.paidAmount || 0).toLocaleString()}` },
                    { label: 'Consumed', value: `د.إ${Number(viewItem.totalConsumedAmount || 0).toLocaleString()}` },
                    { label: 'Remaining', value: `د.إ${Number(viewItem.remainingBalance || 0).toLocaleString()}` },
                  ].map((info, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-1">{info.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{info.value}</p>
                </div>
                  ))}
                </div>

                {viewItem.treatments && viewItem.treatments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Treatments Included</h4>
                    <div className="space-y-2">
                      {viewItem.treatments.map((t, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.treatmentName}</p>
                            <p className="text-xs text-gray-600">{t.unitCount} units × د.إ{Number(t.unitPrice).toLocaleString()}</p>
                          </div>
                          <p className="font-semibold text-gray-900">د.إ{Number(t.lineTotal).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewItem.transferHistory && viewItem.transferHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Transfer History</h4>
                    <div className="space-y-2">
                      {viewItem.transferHistory.map((t, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900">{t.fromEmr} → {t.toEmr}{t.toName ? ` (${t.toName})` : ''}</p>
                            <p className="text-sm font-semibold text-blue-600">د.إ{t.transferredAmount.toLocaleString()}</p>
                </div>
                          <p className="text-xs text-gray-600">{new Date(t.transferredAt).toLocaleDateString()}</p>
                          {t.note && <p className="text-xs text-gray-700 mt-1">Note: {t.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {updateOpen && updateItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Update Membership</h3>
                <button onClick={() => { setUpdateOpen(false); setUpdateItem(null); }} className="p-1 hover:bg-green-500 rounded transition-colors">✕</button>
              </div>
              <UpdateMembershipBody item={updateItem} onClose={() => { setUpdateOpen(false); setUpdateItem(null); fetchMemberships(); }} permissions={permissions} isClinicContext={isClinicContext} />
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {transferOpen && transferItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
              <TransferMembershipBody item={transferItem} onClose={() => { setTransferOpen(false); setTransferItem(null); fetchMemberships(); }} permissions={permissions} isClinicContext={isClinicContext} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MembershipPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const Protected = withClinicAuth(MembershipPage);
Protected.getLayout = MembershipPage.getLayout;

export default Protected;



// Inline component for update body
function UpdateMembershipBody({ item, onClose, permissions = { canUpdate: true }, isClinicContext = false }) {
  const [treatmentsList, setTreatmentsList] = useState([]);
  const [selectedTreatment, setSelectedTreatment] = useState("");
  const [price, setPrice] = useState("");
  const [rows, setRows] = useState([]);
  const [updatePaymentMethod, setUpdatePaymentMethod] = useState("");
  const [updatePaidAmount, setUpdatePaidAmount] = useState("");

  useEffect(() => {
    fetch("/api/admin/staff-treatments")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTreatmentsList(data.data.filter(i => i.treatment).map(i => ({ name: i.treatment, price: i.treatmentPrice })));
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!selectedTreatment) { setPrice(""); return; }
    const t = treatmentsList.find(t => t.name === selectedTreatment);
    setPrice(t && typeof t.price === 'number' ? t.price.toFixed(2) : "");
  }, [selectedTreatment, treatmentsList]);

  const addRow = () => {
    if (!selectedTreatment || !price) return;
    const unitPrice = Number(price);
    setRows(prev => [...prev, { treatmentName: selectedTreatment, unitCount: 1, unitPrice, lineTotal: unitPrice }]);
  };

  const updateRow = (idx, key, value) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;
      const next = { ...r, [key]: key === 'unitCount' || key === 'unitPrice' ? Number(value) : value };
      next.lineTotal = Number(next.unitCount || 0) * Number(next.unitPrice || 0);
      return next;
    }));
  };

  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const remainingAfterNew = useMemo(() => {
    const added = rows.reduce((s, r) => s + (r.lineTotal || 0), 0);
    return Math.max(0, Number(item.packageAmount || 0) - Number(item.totalConsumedAmount || 0) - added);
  }, [rows, item]);
  const pendingAfterNew = useMemo(() => {
    const added = rows.reduce((s, r) => s + (r.lineTotal || 0), 0);
    return Math.max(0, (Number(item.totalConsumedAmount || 0) + added) - Number(item.packageAmount || 0));
  }, [rows, item]);
  const addedAmount = useMemo(() => rows.reduce((s, r) => s + (r.lineTotal || 0), 0), [rows]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

  const saveUpdate = async () => {
    if (rows.length === 0) { onClose(); return; }
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        alert("Authentication required. Please login again.");
        return;
      }
      const res = await fetch('/api/staff/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          membershipId: item._id,
          treatments: rows.map(r => ({ treatmentName: r.treatmentName, unitCount: r.unitCount, unitPrice: r.unitPrice })),
          paymentMethod: updatePaymentMethod || undefined,
          paidAmount: updatePaidAmount ? Number(updatePaidAmount) : undefined
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update');
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Key Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs font-medium text-blue-600 mb-1">EMR NUMBER</p>
          <p className="text-lg font-semibold text-gray-900">{item.emrNumber}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs font-medium text-purple-600 mb-1">PACKAGE</p>
          <p className="text-lg font-semibold text-gray-900">{item.packageName}</p>
          <p className="text-xs text-gray-600 mt-1">د.إ{Number(item.packageAmount || 0).toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs font-medium text-green-600 mb-1">REMAINING</p>
          <p className={`text-lg font-semibold ${item.remainingBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
            د.إ{Number(item.remainingBalance || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-xs font-medium text-orange-600 mb-1">CONSUMED</p>
          <p className="text-lg font-semibold text-gray-900">د.إ{Number(item.totalConsumedAmount || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Past Treatments Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Past Treatments</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Treatment</th>
                <th className="p-3 text-right font-semibold text-gray-700">Unit Price</th>
                <th className="p-3 text-right font-semibold text-gray-700">Units</th>
                <th className="p-3 text-right font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {(item.treatments || []).length > 0 ? (
                (item.treatments || []).map((t, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-gray-900">{t.treatmentName}</td>
                    <td className="p-3 text-right text-gray-600">د.إ{Number(t.unitPrice || 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-gray-600">{Number(t.unitCount || 0)}</td>
                    <td className="p-3 text-right font-medium text-gray-900">د.إ{Number(t.lineTotal || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">No past treatments</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Treatments Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Add New Treatments</h4>
        </div>
        <div className="p-4">
          {/* Input Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-6">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Treatment</label>
              <select
                value={selectedTreatment}
                onChange={e => setSelectedTreatment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a treatment...</option>
              {treatmentsList.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name} {typeof t.price === 'number' ? `• د.إ${Number(t.price).toLocaleString()}` : ''}
                  </option>
              ))}
            </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price</label>
              <input
                value={price ? `د.إ${Number(price).toLocaleString()}` : ""}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-gray-50 cursor-not-allowed"
              />
          </div>
            <button
              onClick={addRow}
              disabled={!selectedTreatment || !price}
              className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${!selectedTreatment || !price
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              Add Treatment
            </button>
        </div>

          {/* New Treatments Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">Treatment</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Unit Price</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Units</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Total</th>
                      <th className="p-3 text-center font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                    {rows.length > 0 ? (
                      rows.map((r, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="p-3 text-gray-900 font-medium">{r.treatmentName}</td>
                          <td className="p-3 text-right text-gray-600">د.إ{Number(r.unitPrice).toLocaleString()}</td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min={1}
                              value={r.unitCount}
                              onChange={e => updateRow(idx, 'unitCount', e.target.value)}
                              className="w-16 border border-gray-300 rounded px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                    </td>
                          <td className="p-3 text-right font-semibold text-gray-900">د.إ{Number(r.lineTotal).toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeRow(idx)}
                              className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded font-medium transition-colors"
                            >
                              Remove
                            </button>
                    </td>
                  </tr>
                      ))
                    ) : (
                  <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">No new treatments added yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4 h-max sticky top-0">
              <h5 className="font-semibold text-gray-900 mb-4">Summary</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Package Total</span>
                  <span className="font-semibold text-gray-900">د.إ{Number(item.packageAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Already Consumed</span>
                  <span className="font-semibold text-gray-900">د.إ{Number(item.totalConsumedAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Added Amount</span>
                  <span className="font-semibold text-gray-900">د.إ{Number(addedAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Consumed</span>
                  <span className="font-semibold text-gray-900">د.إ{Number((Number(item.totalConsumedAmount || 0) + Number(addedAmount || 0))).toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
            {Number(remainingAfterNew) > 0 ? (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-green-700">Remaining (after add)</span>
                      <span className="font-semibold text-green-700">د.إ{Number(remainingAfterNew).toLocaleString()}</span>
                    </div>
            ) : (
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-red-700">Pending (after add)</span>
                      <span className="font-semibold text-red-700">د.إ{Number(pendingAfterNew).toLocaleString()}</span>
                    </div>
            )}
          </div>
        </div>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Payment Method</label>
                  <select value={updatePaymentMethod} onChange={e => setUpdatePaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900">
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="BT">BT</option>
                    <option value="Tabby">Tabby</option>
                    <option value="Tamara">Tamara</option>
                  </select>
                  {updatePaymentMethod === "Cash" && rows.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-700">
                        💰 Treatment amounts will be automatically added to Petty Cash system
                      </p>
      </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Paid Amount</label>
                  <input type="number" value={updatePaidAmount} onChange={e => setUpdatePaidAmount(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder="0.00" step="0.01" />
                </div>
                <button
                  onClick={saveUpdate}
                  className="w-full py-2.5 rounded-lg text-white font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  Collect Payment & Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransferMembershipBody({ item, onClose, permissions = { canUpdate: true }, isClinicContext = false }) {
  const [toEmr, setToEmr] = useState("");
  const [toName, setToName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

  const remaining = Number(item.remainingBalance || 0);

  const submit = async () => {
    if (!toEmr.trim()) {
      alert('Target EMR is required');
      return;
    }
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        alert("Authentication required. Please login again.");
        return;
      }
      const res = await fetch('/api/staff/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          membershipId: item._id,
          toEmrNumber: toEmr,
          toName,
          amount: Number(amount) || 0,
          note
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to transfer');
      alert('Transfer recorded');
      onClose();
    } catch (e) {
      alert(e.message);
    }
  };

return (
  <div className="p-4 sm:p-5 max-w-3xl mx-auto">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white text-lg sm:text-xl">↔</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">Transfer Membership</h3>
      </div>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="From EMR" value={item.emrNumber} />
          <Info label="Package" value={`${item.packageName} (د.إ ${Number(item.packageAmount || 0).toFixed(2)})`} />
          <Info label="Remaining" value={`د.إ ${Number(item.remainingBalance || 0).toFixed(2)}`} />
        </div>
        <div className="flex justify-between sm:flex-col">
          <span className="text-gray-500 font-medium">Package</span>
          <span className="font-semibold text-gray-800">{item.packageName}</span>
        </div>
        <div className="flex justify-between sm:flex-col">
          <span className="text-gray-500 font-medium">Balance</span>
          <span className="font-bold text-indigo-600">₹{Number(item.remainingBalance || 0).toFixed(2)}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Transferred Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" placeholder={`0.00 (Max: د.إ ${remaining.toFixed(2)})`} step="0.01" max={remaining} />
          <div className="text-xs text-gray-600 mt-1">
            • Leave empty or 0 for full transfer (د.إ{remaining.toFixed(2)})<br />
            • Enter amount for partial transfer (will deduct from balance)
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900" rows={3} placeholder="Reason or details" />
        </div>
        <button onClick={submit} className="w-full py-2 rounded-md text-white bg-yellow-600 hover:bg-yellow-700">Confirm Transfer</button>
      </div>
    </div>

    {/* Form Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
      {/* To EMR */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          To EMR <span className="text-red-500">*</span>
        </label>
        <input 
          value={toEmr} 
          onChange={e => setToEmr(e.target.value)} 
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" 
          placeholder="Enter EMR number" 
        />
      </div>

      {/* Recipient Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Recipient Name
        </label>
        <input 
          value={toName} 
          onChange={e => setToName(e.target.value)} 
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" 
          placeholder="Full name (optional)" 
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" 
            placeholder={`0.00 (Max: ${remaining.toFixed(2)})`}
            step="0.01" 
            max={remaining} 
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Empty = full transfer (₹{remaining.toFixed(2)})</p>
      </div>

      {/* Note */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Note
        </label>
        <textarea 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none" 
          rows={2} 
          placeholder="Transfer reason or details..." 
        />
      </div>
    </div>

    {/* Action Button */}
    <button 
      onClick={submit} 
      className="w-full py-2.5 rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 font-semibold text-sm shadow-md hover:shadow-lg transition-all"
    >
      Confirm Transfer
    </button>
  </div>
);
}