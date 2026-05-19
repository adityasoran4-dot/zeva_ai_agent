import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import { X, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from "lucide-react";

const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];
const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const v = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (v) return v;
  }
  return null;
};
const getAuthHeaders = () => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
};

function ClinicReferralPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    referralPercent: 0,
    addExpense: false,
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      referralPercent: 0,
      addExpense: false,
    });
    setErrors({});
    setEditing(null);
  }, []);

  const validate = useCallback(() => {
    const e = {};
    if (!String(form.firstName).trim()) e.firstName = "Required";
    if (!String(form.phone).trim()) e.phone = "Required";
    const pct = Number(form.referralPercent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) e.referralPercent = "0-100 required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const load = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/clinic/referrals", { headers });
      if (res.data.success) {
        setItems(res.data.referrals || []);
      }
    } catch (err) {
      showToast("Failed to load referrals", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "addExpense") {
      const checked = e.target.checked;
      setForm((prev) => ({ ...prev, addExpense: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: name === "referralPercent" ? value : value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast("Fix validation errors", "error");
      return;
    }
    const headers = getAuthHeaders();
    if (!headers) {
      showToast("Authentication required", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await axios.put(
          "/api/clinic/referrals",
          {
            id: editing._id,
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            email: form.email,
            referralPercent: Number(form.referralPercent),
            addExpense: form.addExpense,
          },
          { headers }
        );
        if (res.data.success) {
          showToast("Referral updated", "success");
          setShowModal(false);
          resetForm();
          load();
        } else {
          showToast(res.data.message || "Update failed", "error");
        }
      } else {
        const res = await axios.post(
          "/api/clinic/referrals",
          {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            email: form.email,
            referralPercent: Number(form.referralPercent),
            addExpense: form.addExpense,
          },
          { headers }
        );
        if (res.data.success) {
          showToast("Referral created", "success");
          setShowModal(false);
          resetForm();
          load();
        } else {
          showToast(res.data.message || "Create failed", "error");
        }
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm({
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      phone: item.phone || "",
      email: item.email || "",
      referralPercent: item.referralPercent ?? 0,
      addExpense: !!item.addExpense,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const headers = getAuthHeaders();
    if (!headers) {
      showToast("Authentication required", "error");
      return;
    }
    try {
      const res = await axios.delete("/api/clinic/referrals", {
        data: { id },
        headers,
      });
      if (res.data.success) {
        showToast("Referral deleted", "success");
        load();
      } else {
        showToast(res.data.message || "Delete failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white shadow-lg flex items-center gap-2 ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm">{toast.message}</span>
          <button className="hover:bg-white/10 rounded p-1" onClick={() => setToast(null)}>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-teal-900">Referral Management</h2>
              <p className="text-[10px] sm:text-xs text-teal-700">Create, update, and delete referral contacts</p>
            </div>
            <button
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-md flex items-center gap-1"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          <div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-teal-900">Referrals</h3>
                <button className="px-2 py-1 text-[10px] border border-gray-300 rounded-md" onClick={load}>
                  Refresh
                </button>
              </div>
              {loading ? (
                <div className="text-xs text-gray-700">Loading...</div>
              ) : items.length === 0 ? (
                <div className="text-xs text-gray-700">No referrals</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[10px]">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="px-2 py-1">Name</th>
                        <th className="px-2 py-1">Phone</th>
                        <th className="px-2 py-1">Email</th>
                        <th className="px-2 py-1">Referral %</th>
                        <th className="px-2 py-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it._id} className="border-t">
                          <td className="px-2 py-1">{[it.firstName, it.lastName].filter(Boolean).join(" ")}</td>
                          <td className="px-2 py-1">{it.phone}</td>
                          <td className="px-2 py-1">{it.email || "—"}</td>
                          <td className="px-2 py-1">{it.referralPercent ?? 0}</td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-2">
                              <button className="p-1 rounded hover:bg-teal-100" onClick={() => startEdit(it)} title="Edit">
                                <Edit2 className="w-3 h-3 text-teal-700" />
                              </button>
                              <button className="p-1 rounded hover:bg-red-100" onClick={() => handleDelete(it._id)} title="Delete">
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-[500px] max-h-[98vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-teal-900 truncate">
                  {editing ? "Edit Referral" : "Create Referral"}
                </h3>
              </div>
              <button 
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 ml-2"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-3 overflow-y-auto flex-1">
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">First Name <span className="text-red-500">*</span></label>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className={`w-full px-2 py-1 text-[10px] border rounded-md ${errors.firstName ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.firstName && <p className="text-red-500 text-[9px] mt-0.5">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Last Name</label>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Phone <span className="text-red-500">*</span></label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`w-full px-2 py-1 text-[10px] border rounded-md ${errors.phone ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.phone && <p className="text-red-500 text-[9px] mt-0.5">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Referral %</label>
                  <input
                    type="number"
                    name="referralPercent"
                    value={form.referralPercent}
                    onChange={handleChange}
                    min={0}
                    max={100}
                    className={`w-full px-2 py-1 text-[10px] border rounded-md ${errors.referralPercent ? "border-red-500 bg-red-50" : "border-gray-300"}`}
                  />
                  {errors.referralPercent && <p className="text-red-500 text-[9px] mt-0.5">{errors.referralPercent}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <div className="mr-auto flex items-center gap-2">
                    <input
                      id="addExpense"
                      type="checkbox"
                      name="addExpense"
                      checked={!!form.addExpense}
                      onChange={handleChange}
                      className="h-3 w-3 border-gray-300 rounded"
                    />
                    <label htmlFor="addExpense" className="text-[10px] text-gray-700">
                      Add an expense
                    </label>
                  </div>
                  <button 
                    className="px-3 py-1 border border-gray-300 rounded-md text-[10px]"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-3 py-1 text-[10px] rounded-md text-white ${saving ? "bg-gray-500" : "bg-teal-600 hover:bg-teal-700"}`}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {editing ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ClinicReferralPage.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicReferralPage = withClinicAuth(ClinicReferralPage);
ProtectedClinicReferralPage.getLayout = ClinicReferralPage.getLayout;

export default ProtectedClinicReferralPage;

