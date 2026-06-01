"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle, Loader2, AlertCircle, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-hot-toast";

const MessageBanner = ({ type = "success", text }) => {
  if (!text) return null;

  const styles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  const Icon = type === "error" ? AlertCircle : CheckCircle;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${styles[type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{text}</p>
    </div>
  );
};

const DoctorTreatmentModal = ({ isOpen, onClose, doctorStaffId, doctorStaffName, token, useClinicTreatments = false }) => {
  const [baseTreatments, setBaseTreatments] = useState([]);
  const [doctorTreatments, setDoctorTreatments] = useState([]);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "info", text: "" });
  const [activeTab, setActiveTab] = useState("department"); // "existing", "custom", or "department"
  const [customTreatmentName, setCustomTreatmentName] = useState("");
  const [customSubTreatments, setCustomSubTreatments] = useState([
    { id: Date.now(), name: "", price: "" },
  ]);
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [doctorDepartments, setDoctorDepartments] = useState([]);
  const [doctorDepartmentsLoading, setDoctorDepartmentsLoading] = useState(false);
  const [clinicDepartments, setClinicDepartments] = useState([]);
  const [clinicDepartmentsLoading, setClinicDepartmentsLoading] = useState(false);
  const [customDepartmentId, setCustomDepartmentId] = useState("");
  const [selectedClinicDepartmentId, setSelectedClinicDepartmentId] = useState("");
  const [addingDepartment, setAddingDepartment] = useState(false);

  const selectedTreatment = useMemo(
    () => baseTreatments.find((t) => t._id === selectedTreatmentId),
    [baseTreatments, selectedTreatmentId]
  );

  const getAuthHeaders = () => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  const loadBaseTreatments = async () => {
    try {
      let res;
      if (useClinicTreatments) {
        // Fetch treatments from Clinic model
        // When useClinicTreatments is true (from create-agent page), check clinic_create_agent permissions
        res = await axios.get("/api/clinic/treatments?module=clinic_create_agent", {
          headers: getAuthHeaders(),
        });
        if (res.data.success) {
          // Transform clinic treatments format to match expected format
          const clinicTreatments = res.data.clinic?.treatments || [];
          const allTreatments = [];
          
          clinicTreatments.forEach((tr) => {
            // Generate a unique ID for the main treatment
            const mainTreatmentId = tr.mainTreatmentSlug || tr.mainTreatment?.toLowerCase().replace(/\s+/g, '-') || `treatment-${Date.now()}-${Math.random()}`;
            
            // Add main treatment with subcategories (mapped from subTreatments)
            allTreatments.push({
              _id: mainTreatmentId,
              name: tr.mainTreatment,
              slug: tr.mainTreatmentSlug || tr.mainTreatment?.toLowerCase().replace(/\s+/g, '-'),
              subcategories: (tr.subTreatments || []).map((sub) => ({
                _id: sub.slug || `sub-${sub.name?.toLowerCase().replace(/\s+/g, '-')}`,
                name: sub.name,
                slug: sub.slug,
                price: sub.price || 0,
              })),
            });
          });
          
          setBaseTreatments(allTreatments);
        } else {
          setMessage({ type: "error", text: res.data.message || "Unable to load treatments" });
        }
      } else {
        // Fetch treatments from staff/available-treatments (original behavior)
        res = await axios.get("/api/staff/available-treatments", {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setBaseTreatments(res.data.treatments || []);
      } else {
        setMessage({ type: "error", text: res.data.message || "Unable to load treatments" });
        }
      }
    } catch (error) {
      console.error("Error loading treatments", error);
      setMessage({ type: "error", text: "Unable to load treatments" });
    }
  };


  const loadDoctorTreatments = async () => {
    if (!doctorStaffId) return;
    try {
      // When useClinicTreatments is true (from create-agent page), check clinic_create_agent permissions
      const moduleParam = useClinicTreatments ? "clinic_create_agent" : "clinic_Appointment";
      const res = await axios.get(`/api/clinic/doctor-treatments?doctorStaffId=${doctorStaffId}&module=${moduleParam}`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        // Ensure treatments is always an array
        const treatments = Array.isArray(res.data.treatments) ? res.data.treatments : [];
        setDoctorTreatments(treatments);
      } else {
        setMessage({ type: "error", text: res.data.message || "Unable to load treatments" });
      }
    } catch (error) {
      console.error("Error loading doctor treatments", error);
      setMessage({ type: "error", text: "Unable to load treatments" });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen && doctorStaffId) {
      setFetching(true);
      setMessage({ type: "info", text: "" });
      Promise.all([loadBaseTreatments(), loadDoctorTreatments()]).finally(() => setFetching(false));
    }
  }, [isOpen, doctorStaffId]);

  const toggleSubcategory = (slug) => {
    setSelectedSubcategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const resetForm = () => {
    setSelectedTreatmentId("");
    setSelectedSubcategories([]);
  };

  const resetCustomForm = () => {
    setCustomTreatmentName("");
    setCustomSubTreatments([{ id: Date.now(), name: "", price: "" }]);
    setCustomDepartmentId("");
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
      // When useClinicTreatments is true (from create-agent page), check clinic_create_agent permissions
      const moduleParam = useClinicTreatments ? "clinic_create_agent" : "clinic_Appointment";
      const payload = {
        doctorStaffId,
        treatmentId: selectedTreatmentId,
        subcategoryIds: selectedSubcategories,
        department: null,
        module: moduleParam,
      };

      const res = await axios.post("/api/clinic/doctor-treatments", payload, {
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
      });

      if (res.data && res.data.success) {
        setDoctorTreatments(res.data.treatments || []);
        setMessage({ type: "success", text: res.data.message || "Treatment assigned successfully" });
        resetForm();
      } else {
        setMessage({ type: "error", text: res.data?.message || "Failed to assign treatment" });
      }
    } catch (error) {
      // Prevent error from propagating
      console.error("Error assigning treatment", error);
      setMessage({ type: "error", text: "Failed to assign treatment. Please try again." });
      return;
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
        price: sub.price === "" ? 0 : Number(sub.price) || 0,
      }));

    const hasInvalidSubPrice = preparedSubTreatments.some(
      (sub) => sub.price !== null && Number.isNaN(sub.price)
    );
    if (hasInvalidSubPrice) {
      setMessage({ type: "error", text: "Sub treatment price must be a number" });
      return;
    }

    setCustomSubmitting(true);
    setMessage({ type: "info", text: "" });

    try {
      if (useClinicTreatments) {
        // When creating from create-agent, save to both Clinic and Treatment models
        const payload = {
          treatmentName: customTreatmentName.trim(),
          subTreatments: preparedSubTreatments,
          doctorStaffId,
        };

        const res = await axios.post("/api/clinic/add-clinic-treatment", payload, {
          headers: getAuthHeaders(),
          validateStatus: (status) => status < 500, // Don't throw for 4xx errors
        });

        if (res.data && res.data.success) {
          // Ensure treatments is always an array
          const treatments = Array.isArray(res.data.treatments) ? res.data.treatments : [];
          setDoctorTreatments(treatments);
          setMessage({ type: "success", text: res.data.message || "Custom treatment created and added to clinic" });
          resetCustomForm();
          loadBaseTreatments();
        } else {
          setMessage({ type: "error", text: res.data?.message || "Failed to create treatment" });
        }
      } else {
        // Original behavior - save to doctor-treatments only
      const payload = {
        doctorStaffId,
        treatmentName: customTreatmentName.trim(),
        subTreatments: preparedSubTreatments,
      };

      const res = await axios.post("/api/clinic/doctor-treatments", payload, {
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
      });

      if (res.data && res.data.success) {
          // Ensure treatments is always an array
          const treatments = Array.isArray(res.data.treatments) ? res.data.treatments : [];
          setDoctorTreatments(treatments);
        setMessage({ type: "success", text: res.data.message || "Custom treatment created" });
        resetCustomForm();
        loadBaseTreatments();
      } else {
        setMessage({ type: "error", text: res.data?.message || "Failed to create treatment" });
        }
      }
    } catch (error) {
      // Prevent error from propagating
      console.error("Error creating custom treatment", error);
      setMessage({ type: "error", text: "Failed to create treatment. Please try again." });
      return;
    } finally {
      setCustomSubmitting(false);
    }
  };

  const addSubTreatmentRow = () => {
    setCustomSubTreatments([...customSubTreatments, { id: Date.now(), name: "", price: "" }]);
  };

  const removeSubTreatmentRow = (id) => {
    setCustomSubTreatments(customSubTreatments.filter((sub) => sub.id !== id));
  };

  const updateSubTreatment = (id, field, value) => {
    setCustomSubTreatments(
      customSubTreatments.map((sub) => (sub.id === id ? { ...sub, [field]: value } : sub))
    );
  };

  const loadDoctorDepartments = async () => {
    if (!doctorStaffId) return;
    try {
      setDoctorDepartmentsLoading(true);
      const res = await axios.get(`/api/clinic/doctor-departments?doctorStaffId=${doctorStaffId}`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setDoctorDepartments(res.data.departments || []);
      } else {
        console.error("Error loading doctor departments:", res.data.message);
      }
    } catch (error) {
      console.error("Error loading doctor departments", error);
    } finally {
      setDoctorDepartmentsLoading(false);
    }
  };

  const loadClinicDepartments = async () => {
    try {
      setClinicDepartmentsLoading(true);
      // When useClinicTreatments is true (from create-agent page), check clinic_create_agent permissions
      const moduleParam = useClinicTreatments ? "clinic_create_agent" : "clinic_addRoom";
      const res = await axios.get(`/api/clinic/departments?module=${moduleParam}`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setClinicDepartments(res.data.departments || []);
      } else {
        console.error("Error loading clinic departments:", res.data.message);
      }
    } catch (error) {
      console.error("Error loading clinic departments", error);
    } finally {
      setClinicDepartmentsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && doctorStaffId) {
      loadDoctorDepartments();
    }
  }, [isOpen, doctorStaffId]);

  useEffect(() => {
    if (isOpen && doctorStaffId && activeTab === "department") {
      loadClinicDepartments();
    }
  }, [isOpen, doctorStaffId, activeTab]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!selectedClinicDepartmentId) {
      setMessage({ type: "error", text: "Please select a department" });
      return;
    }

    const selectedDepartment = clinicDepartments.find((dept) => dept._id === selectedClinicDepartmentId);
    if (!selectedDepartment) {
      setMessage({ type: "error", text: "Selected department not found" });
      return;
    }

    setAddingDepartment(true);
    setMessage({ type: "info", text: "" });

    try {
      const res = await axios.post(
        "/api/clinic/doctor-departments",
        {
          doctorStaffId,
          clinicDepartmentId: selectedClinicDepartmentId,
          name: selectedDepartment.name,
        },
        {
          headers: getAuthHeaders(),
          validateStatus: (status) => status < 500, // Don't throw for 4xx errors
        }
      );

      if (res.data && res.data.success) {
        setMessage({ type: "success", text: res.data.message || "Department added successfully" });
        toast.success("Department added successfully");
        setSelectedClinicDepartmentId("");
        await loadDoctorDepartments();
      } else {
        const errorMessage = res.data?.message || "Failed to add department";
        setMessage({ type: "error", text: errorMessage });
        // Show user-friendly toast message
        if (errorMessage.toLowerCase().includes("already exists")) {
          toast.error("This department has already been added to this doctor");
        } else {
          toast.error("Failed to add department. Please try again.");
        }
      }
    } catch (error) {
      // Prevent error from propagating
      console.error("Error adding department", error);
      setMessage({ type: "error", text: "Failed to add department. Please try again." });
      toast.error("Failed to add department. Please try again.");
      // Return early to prevent any further error propagation
      return;
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    try {
      const res = await axios.delete(`/api/clinic/doctor-departments?departmentId=${departmentId}`, {
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500, // Don't throw for 4xx errors
      });

      if (res.data && res.data.success) {
        setMessage({ type: "success", text: res.data.message || "Department deleted successfully" });
        await loadDoctorDepartments();
      } else {
        setMessage({ type: "error", text: res.data?.message || "Failed to delete department" });
      }
    } catch (error) {
      // Prevent error from propagating
      console.error("Error deleting department", error);
      setMessage({ type: "error", text: "Failed to delete department. Please try again." });
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Clean Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 sm:px-6 py-4 flex justify-between items-center z-10">
          <div className="flex-1 min-w-0 pr-2">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Treatments</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">For: {doctorStaffName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <MessageBanner type={message.type} text={message.text} />

            {/* Clean Tabs - Only Department */}
            <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab("department")}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "department"
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Department
              </button>
            </div>

          {/* Existing Treatments Tab */}
          {activeTab === "existing" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTreatmentId}
                  onChange={(e) => {
                    setSelectedTreatmentId(e.target.value);
                    setSelectedSubcategories([]);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
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
                      Sub Treatments <span className="text-gray-500 font-normal">(optional)</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                      onClick={() =>
                        setSelectedSubcategories(
                          selectedTreatment.subcategories.map((sub) => sub.slug || sub.name)
                        )
                      }
                    >
                      Select all
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {selectedTreatment.subcategories.map((sub) => {
                      const value = sub.slug || sub.name;
                      return (
                        <label
                          key={value}
                          className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                            selectedSubcategories.includes(value)
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-gray-900 rounded focus:ring-2 focus:ring-gray-900 flex-shrink-0"
                            checked={selectedSubcategories.includes(value)}
                            onChange={() => toggleSubcategory(value)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{sub.name}</p>
                            {sub.price ? (
                              <p className="text-xs text-gray-500 mt-0.5">Default ₹{sub.price}</p>
                            ) : null}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Assigning..." : "Assign Treatment"}
                </button>
              </div>
            </form>
          )}

          {/* Custom Treatment Tab */}
          {activeTab === "custom" && (
            <form onSubmit={handleCreateCustomTreatment} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customTreatmentName}
                  onChange={(e) => setCustomTreatmentName(e.target.value)}
                  placeholder="Enter treatment name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Sub Treatments <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addSubTreatmentRow}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Sub Treatment
                  </button>
                </div>
                <div className="space-y-3">
                  {customSubTreatments.map((sub) => (
                    <div key={sub.id} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => updateSubTreatment(sub.id, "name", e.target.value)}
                          placeholder="Sub treatment name"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                        />
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={sub.price}
                            onChange={(e) => updateSubTreatment(sub.id, "price", e.target.value)}
                            placeholder="Price"
                            className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                          />
                        </div>
                      </div>
                      {customSubTreatments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubTreatmentRow(sub.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={customSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {customSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {customSubmitting ? "Creating..." : "Create & Assign Treatment"}
                </button>
              </div>
            </form>
          )}

          {/* Department Tab */}
          {activeTab === "department" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Manage Departments</h3>
                <p className="text-sm text-gray-600">
                  Add departments for this doctor. Departments will be available for all treatments.
                </p>
              </div>

              {/* Add Department Form */}
              <form onSubmit={handleAddDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Department <span className="text-red-500">*</span>
                  </label>
                  {clinicDepartmentsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading departments...
                    </div>
                  ) : clinicDepartments.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      No clinic departments found. Please create departments from the clinic settings page first.
                    </div>
                  ) : (
                    <select
                      value={selectedClinicDepartmentId}
                      onChange={(e) => setSelectedClinicDepartmentId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all bg-white"
                      required
                    >
                      <option value="">Choose a department</option>
                      {clinicDepartments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addingDepartment || clinicDepartments.length === 0 || clinicDepartmentsLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {addingDepartment && <Loader2 className="w-4 h-4 animate-spin" />}
                  {addingDepartment ? "Adding..." : "Add Department"}
                </button>
              </form>

              {/* All Departments List */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">All Departments</h3>
                  {doctorDepartments.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {doctorDepartments.length} {doctorDepartments.length === 1 ? 'department' : 'departments'}
                    </span>
                  )}
                </div>
                {doctorDepartmentsLoading ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="text-sm">Loading departments...</span>
                  </div>
                ) : doctorDepartments.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">No departments added yet.</p>
                    <p className="text-xs text-gray-500 mt-1">Use the form above to add your first department.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {doctorDepartments.map((dept) => (
                      <div
                        key={dept._id}
                        className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 hover:bg-gray-50 transition-colors bg-white"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{dept.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Added {new Date(dept.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteDepartment(dept._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Delete department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Existing Treatments List - Only show when NOT on Department tab */}
          {activeTab !== "department" && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Treatments</h3>
              {fetching ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading treatments...
                </div>
              ) : doctorTreatments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No treatments assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctorTreatments.map((item) => (
                    <div
                      key={item._id}
                      className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="text-base font-semibold text-gray-900">{item.treatmentName}</h4>
                          {item.departmentName && (
                            <p className="text-sm text-gray-600 font-medium">
                              Department: {item.departmentName}
                            </p>
                          )}
                          {item.price && (
                            <p className="text-sm text-gray-600 font-medium">
                              Custom Treatment Price: ₹{item.price}
                            </p>
                          )}
                          {!item.price && (
                            <p className="text-sm text-gray-500">Using default clinic pricing</p>
                          )}
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
                                {sub.price !== null && sub.price !== undefined ? (
                                  <span className="text-sm font-semibold text-blue-600">
                                    ₹{sub.price}
                                  </span>
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
                      {(!item.subcategories || item.subcategories.length === 0) && (
                        <p className="text-xs text-gray-500 italic">No sub-treatments selected</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorTreatmentModal;

