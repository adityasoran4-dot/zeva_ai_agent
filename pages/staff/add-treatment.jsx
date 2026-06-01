"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StaffLayout from "../../components/staffLayout";
import withStaffAuth from "../../components/withStaffAuth";
import { CheckCircle, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";

const MessageBanner = ({ type = "success", text }) => {
  if (!text) return null;

  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
  };

  const Icon = type === "error" ? AlertCircle : CheckCircle;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles[type]}`}>
      <Icon className="w-5 h-5" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
};

function getAuthHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("userToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const AddTreatmentPage = () => {
  const [baseTreatments, setBaseTreatments] = useState([]);
  const [doctorTreatments, setDoctorTreatments] = useState([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [price, setPrice] = useState("");
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });
  const [customTreatmentName, setCustomTreatmentName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customSubTreatments, setCustomSubTreatments] = useState([
    { id: Date.now(), name: "", price: "" },
  ]);
  const [customSubmitting, setCustomSubmitting] = useState(false);

  const selectedTreatment = useMemo(
    () => baseTreatments.find((t) => t._id === selectedTreatmentId),
    [baseTreatments, selectedTreatmentId]
  );

  const loadBaseTreatments = async () => {
    try {
      const res = await axios.get("/api/staff/available-treatments", {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setBaseTreatments(res.data.treatments || []);
      } else {
        setMessage({ type: "error", text: res.data.message || "Unable to load treatments" });
      }
    } catch (error) {
      console.error("Error loading treatments", error);
      setMessage({ type: "error", text: "Unable to load treatments" });
    }
  };

  const loadDoctorTreatments = async () => {
    try {
      const res = await axios.get("/api/staff/doctor-treatments", {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setDoctorTreatments(res.data.treatments || []);
      } else {
        setMessage({ type: "error", text: res.data.message || "Unable to load your treatments" });
      }
    } catch (error) {
      console.error("Error loading doctor treatments", error);
      setMessage({ type: "error", text: "Unable to load your treatments" });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    setFetching(true);
    Promise.all([loadBaseTreatments(), loadDoctorTreatments()]).finally(() => setFetching(false));
  }, []);

  const toggleSubcategory = (slug) => {
    setSelectedSubcategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const resetForm = () => {
    setSelectedTreatmentId("");
    setSelectedSubcategories([]);
    setPrice("");
  };

  const resetCustomForm = () => {
    setCustomTreatmentName("");
    setCustomPrice("");
    setCustomSubTreatments([{ id: Date.now(), name: "", price: "" }]);
  };

  const addCustomSubTreatment = () => {
    setCustomSubTreatments((prev) => [...prev, { id: Date.now(), name: "", price: "" }]);
  };

  const updateCustomSubTreatment = (id, field, value) => {
    setCustomSubTreatments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeCustomSubTreatment = (id) => {
    setCustomSubTreatments((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTreatmentId) {
      setMessage({ type: "error", text: "Select a treatment first" });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "info", text: "" });

    try {
      const payload = {
        treatmentId: selectedTreatmentId,
        subcategoryIds: selectedSubcategories,
        price: price === "" ? null : price,
      };

      const res = await axios.post("/api/staff/doctor-treatments", payload, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setDoctorTreatments(res.data.treatments || []);
        setMessage({ type: "success", text: res.data.message || "Treatment saved" });
        resetForm();
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to save treatment" });
      }
    } catch (error) {
      console.error("Error saving treatment", error);
      const errorMessage = error.response?.data?.message || "Failed to save treatment";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomTreatment = async (e) => {
    e.preventDefault();

    if (!customTreatmentName.trim()) {
      setMessage({ type: "error", text: "Please enter a treatment name" });
      return;
    }

    const preparedSubTreatments = customSubTreatments
      .filter((sub) => sub.name && sub.name.trim())
      .map((sub) => ({
        name: sub.name.trim(),
        price: sub.price === "" ? null : Number(sub.price),
      }));

    const hasInvalidSubPrice = preparedSubTreatments.some(
      (sub) => sub.price !== null && Number.isNaN(sub.price)
    );
    if (hasInvalidSubPrice) {
      setMessage({ type: "error", text: "Sub treatment price must be a number" });
      return;
    }

    const parsedCustomPrice = customPrice === "" ? null : Number(customPrice);
    if (parsedCustomPrice !== null && Number.isNaN(parsedCustomPrice)) {
      setMessage({ type: "error", text: "Custom price must be a number" });
      return;
    }

    setCustomSubmitting(true);
    setMessage({ type: "info", text: "" });

    try {
      const payload = {
        treatmentName: customTreatmentName.trim(),
        price: parsedCustomPrice,
        subTreatments: preparedSubTreatments,
      };

      const res = await axios.post("/api/staff/custom-treatment", payload, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setDoctorTreatments(res.data.treatments || []);
        setMessage({ type: "success", text: res.data.message || "Custom treatment created" });
        resetCustomForm();
        loadBaseTreatments();
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to create treatment" });
      }
    } catch (error) {
      console.error("Error creating custom treatment", error);
      const errorMessage = error.response?.data?.message || "Failed to create treatment";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setCustomSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Add Treatment</h1>
          <p className="text-sm text-gray-500">
            Assign clinic treatments to your doctor profile and override prices if needed.
          </p>
        </div>

        <MessageBanner type={message.type} text={message.text} />

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Treatment</label>
            <select
              value={selectedTreatmentId}
              onChange={(e) => {
                setSelectedTreatmentId(e.target.value);
                setSelectedSubcategories([]);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a treatment</option>
              {baseTreatments.map((treatment) => (
                <option key={treatment._id} value={treatment._id}>
                  {treatment.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTreatment?.subcategories?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Sub Treatments (optional)
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setSelectedSubcategories(selectedTreatment.subcategories.map((sub) => sub.slug || sub.name))}
                >
                  Select all
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedTreatment.subcategories.map((sub) => {
                  const value = sub.slug || sub.name;
                  return (
                    <label
                      key={value}
                      className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition ${
                        selectedSubcategories.includes(value)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                        checked={selectedSubcategories.includes(value)}
                        onChange={() => toggleSubcategory(value)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                        {sub.price !== null && sub.price !== undefined && sub.price !== 0 ? (
                          <p className="text-xs font-semibold text-blue-600">₹{sub.price}</p>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom price (optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter price override"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use the default treatment pricing.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Saving..." : "Save treatment"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Custom Treatment</h2>
          <p className="text-sm text-gray-500">
            Add a brand-new treatment with optional sub treatments. Newly created entries become
            available immediately for this doctor.
          </p>
        </div>

        <form onSubmit={handleCreateCustomTreatment} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customTreatmentName}
              onChange={(e) => setCustomTreatmentName(e.target.value)}
              placeholder="Eg. Premium wellness therapy"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Sub treatments (optional)
              </label>
              <button
                type="button"
                onClick={addCustomSubTreatment}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Add sub treatment
              </button>
            </div>
            <div className="space-y-3">
              {customSubTreatments.map((sub) => (
                <div
                  key={sub.id}
                  className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_auto]"
                >
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => updateCustomSubTreatment(sub.id, "name", e.target.value)}
                    placeholder="Sub treatment name"
                    className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sub.price}
                      onChange={(e) => updateCustomSubTreatment(sub.id, "price", e.target.value)}
                      placeholder="Price"
                      className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomSubTreatment(sub.id)}
                    className="inline-flex items-center justify-center text-gray-400 hover:text-rose-500"
                    disabled={customSubTreatments.length === 1}
                    aria-label="Remove sub treatment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Leave blank if this treatment does not have sub treatments.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default price (optional)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Enter base price"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={resetCustomForm}
              className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={customSubmitting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {customSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {customSubmitting ? "Creating..." : "Create custom treatment"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Treatments</h2>
            <p className="text-sm text-gray-500">
              All treatments currently attached to your profile.
            </p>
          </div>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading treatments...
          </div>
        ) : doctorTreatments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
              ⚕️
            </div>
            <p className="text-gray-600">No treatments added yet.</p>
            <p className="text-sm text-gray-500 mt-2">Use the form above to add your first one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doctorTreatments.map((item) => (
              <div
                key={item._id}
                className="border border-gray-200 rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.treatmentName}</h3>
                    <p className="text-sm text-gray-500">
                      {item.price ? `Custom price: ₹${item.price}` : "Default clinic pricing"}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {item.subcategories && item.subcategories.length > 0 && (
                  <div className="mt-2 border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">Sub Treatments:</p>
                    <div className="space-y-2">
                      {item.subcategories.map((sub, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                        >
                          <span className="text-sm text-gray-900 font-medium">{sub.name}</span>
                          {sub.price !== null && sub.price !== undefined && sub.price !== 0 ? (
                            <span className="text-sm font-semibold text-blue-600">₹{sub.price}</span>
                          ) : item.price ? (
                            <span className="text-sm text-gray-500">Uses treatment price</span>
                          ) : (
                            <span className="text-sm text-gray-500">Default pricing</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(!item.subcategories || item.subcategories.length === 0) && item.subcategoryIds?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Sub treatments (IDs)</p>
                    <div className="flex flex-wrap gap-2">
                      {item.subcategoryIds.map((sub) => (
                        <span
                          key={sub}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white border border-gray-200 text-gray-700"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

AddTreatmentPage.getLayout = function PageLayout(page) {
  return <StaffLayout>{page}</StaffLayout>;
};

const ProtectedAddTreatment = withStaffAuth(AddTreatmentPage);
ProtectedAddTreatment.getLayout = AddTreatmentPage.getLayout;

export default ProtectedAddTreatment;


