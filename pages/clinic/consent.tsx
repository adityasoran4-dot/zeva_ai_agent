// pages/clinic/consent.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import axios from "axios";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  Trash2,
  Eye,
  Globe,
  PenLine,
  Layers,
  Send,
  ClipboardList,
  Check,
  AlertCircle,
  Calendar,
} from "lucide-react";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";
import { toast } from "react-hot-toast";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];
const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const v = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (v) return v;
  }
  return null;
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Department {
  _id: string;
  name: string;
}

interface Service {
  _id: string;
  name: string;
  price?: number;
  durationMinutes?: number;
}

interface ConsentForm {
  _id: string;
  formName: string;
  departmentIds?: { _id: string; name: string }[];
  language: string;
  version: string;
  description: string;
  serviceIds: { _id: string; name: string }[];
  enableDigitalSignature: boolean;
  requireNameConfirmation: boolean;
  status: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  createdAt: string;
}

const LANGUAGES = ["English", "Spanish", "French", "Arabic", "Hindi"];

const STEPS = [
  { id: 1, label: "Upload\nFile", icon: Upload },
  { id: 2, label: "Form\nDetails", icon: FileText },
  { id: 3, label: "Service\nMapping", icon: Layers },
  { id: 4, label: "Signature\nSettings", icon: PenLine },
  { id: 5, label: "Publish", icon: Send },
];

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadConsentModalProps {
  onClose: () => void;
  onSuccess: (consent: ConsentForm) => void;
}

function UploadConsentModal({ onClose, onSuccess }: UploadConsentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 – File
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 – Form Details
  const [formName, setFormName] = useState("");
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [version, setVersion] = useState("1.0");
  const [description, setDescription] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  // Step 3 – Service Mapping
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");

  // Step 4 – Signature Settings
  const [enableDigitalSignature, setEnableDigitalSignature] = useState(false);
  const [requireNameConfirmation, setRequireNameConfirmation] = useState(false);

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("clinicToken") ||
        sessionStorage.getItem("clinicToken") ||
        localStorage.getItem("agentToken") ||
        sessionStorage.getItem("agentToken") ||
        ""
      : "";

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      setLoadingDepts(true);
      try {
        const token = getToken();
        const { data } = await axios.get("/api/clinic/departments?module=clinic_consent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setDepartments(data.departments || []);
      } catch {
        // silently fail – departments may not be set up
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  // Fetch services when reaching step 3
  useEffect(() => {
    if (currentStep === 3 && services.length === 0) {
      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const token = getToken();
          const { data } = await axios.get("/api/clinic/services", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data.success) setServices(data.services || []);
        } catch {
          // silently fail
        } finally {
          setLoadingServices(false);
        }
      };
      fetchServices();
    }
  }, [currentStep, services.length]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s._id));

  const canProceed = () => {
    if (currentStep === 2) return formName.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 2 && !formName.trim()) {
      toast.error("Form name is required");
      return;
    }
    if (currentStep < 5) setCurrentStep((p) => p + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((p) => p - 1);
  };

  const handlePublish = async () => {
    if (!formName.trim()) {
      toast.error("Form name is required");
      return;
    }
    setSubmitting(true);
    
    let uploadedFileUrl = null;
    let uploadedFileName = null;
    let uploadedFileSize = null;

    // Upload file to Cloudinary if exists
    if (uploadedFile) {
      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        
        const token = getToken();
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        
        if (uploadResponse.ok && uploadData.success) {
          uploadedFileUrl = uploadData.url;
          uploadedFileName = uploadedFile.name;
          uploadedFileSize = uploadedFile.size;
        } else {
          console.error("Upload failed:", uploadData);
          toast.error(uploadData?.message || "File upload failed");
          setSubmitting(false);
          return;
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        const errorMessage = error?.response?.data?.message || error?.message || "Failed to upload file";
        toast.error(`Upload failed: ${errorMessage}`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const token = getToken();
      const payload = {
        formName,
        departmentIds: selectedDeptIds,
        language,
        version,
        description,
        serviceIds: selectedServiceIds,
        enableDigitalSignature,
        requireNameConfirmation,
        fileUrl: uploadedFileUrl,
        fileName: uploadedFileName,
        fileSize: uploadedFileSize,
        status: "published",
      };
      const { data } = await axios.post("/api/clinic/consent", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Consent form published successfully!");
        onSuccess(data.consent);
        onClose();
      } else {
        toast.error(data.message || "Failed to publish");
      }
    } catch (err: any) {
      console.error("Create consent error:", err);
      toast.error(err?.response?.data?.message || "Failed to publish consent form");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 pt-7 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Upload Consent Form</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Follow the steps to upload and configure your form
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mt-5">
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : isCompleted
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check size={14} /> : step.id}
                    </div>
                    <span
                      className={`text-xs mt-1 text-center whitespace-pre-line leading-tight font-medium ${
                        isActive ? "text-blue-600" : isCompleted ? "text-blue-500" : "text-gray-400"
                      }`}
                      style={{ maxWidth: 56 }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition-all ${
                        currentStep > step.id ? "bg-blue-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* ── Step 1: Upload File ── */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">
                Upload Your Consent Form
              </h3>
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !uploadedFile && fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[220px] flex flex-col items-center justify-center gap-3 ${
                  uploadedFile
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {uploadedFile ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
                      <FileText size={24} className="text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Change File
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      Drag &amp; drop your file here
                    </p>
                    <p className="text-xs text-gray-400">or click to browse (PDF, DOC, DOCX)</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Form Details ── */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800 mb-2">Form Details</h3>

              {/* Form Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Patient Consent for Surgery"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Department */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  {!loadingDepts && departments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDeptIds.length === departments.length) {
                          setSelectedDeptIds([]);
                        } else {
                          setSelectedDeptIds(departments.map(d => d._id));
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {selectedDeptIds.length === departments.length ? "Deselect All" : "Select All Departments"}
                    </button>
                  )}
                </div>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 bg-white">
                  {loadingDepts ? (
                    <p className="text-xs text-gray-500">Loading...</p>
                  ) : departments.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No departments available</p>
                  ) : (
                    departments.map((d) => (
                      <label key={d._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedDeptIds.includes(d._id)}
                          onChange={() => {
                            setSelectedDeptIds(prev => 
                              prev.includes(d._id) ? prev.filter(id => id !== d._id) : [...prev, d._id]
                            );
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{d.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        language === lang
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. 1.0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description of this consent form..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {/* ── Step 3: Service Mapping ── */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Service Mapping</h3>
              <p className="text-xs text-gray-500 mb-4">
                Select services that require this consent form
              </p>

              {/* Search + Select All */}
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services..."
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!loadingServices && services.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedServiceIds.length === services.length) {
                        setSelectedServiceIds([]);
                      } else {
                        setSelectedServiceIds(services.map(s => s._id));
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                  >
                    {selectedServiceIds.length === services.length ? "Deselect All" : "Select All Services"}
                  </button>
                )}
              </div>

              {/* Service list */}
              {loadingServices ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <Layers size={28} className="mb-2" />
                  <p className="text-sm">No services found</p>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {filteredServices.map((svc) => {
                    const selected = selectedServiceIds.includes(svc._id);
                    return (
                      <label
                        key={svc._id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleService(svc._id)}
                          className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700 flex-1">{svc.name}</span>
                        {svc.price !== undefined && (
                          <span className="text-xs text-gray-400">
                            ${svc.price}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Selected chips */}
              {selectedServices.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Selected ({selectedServices.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((svc) => (
                      <span
                        key={svc._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                      >
                        {svc.name}
                        <button
                          type="button"
                          onClick={() => toggleService(svc._id)}
                          className="ml-0.5 hover:text-blue-900"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Signature Settings ── */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">Signature Settings</h3>
              <p className="text-xs text-gray-500 mb-5">
                Configure how patients will sign this consent form
              </p>

              <div className="space-y-4">
                {/* Option 1 */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    enableDigitalSignature
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={enableDigitalSignature}
                      onChange={(e) => setEnableDigitalSignature(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <PenLine size={16} className="text-blue-600" />
                      <p className="text-sm font-semibold text-gray-800">
                        Enable Digital Signature
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Allow patients to sign using touchscreen or mouse
                    </p>
                  </div>
                </label>

                {/* Option 2 */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    requireNameConfirmation
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={requireNameConfirmation}
                      onChange={(e) => setRequireNameConfirmation(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <ClipboardList size={16} className="text-blue-600" />
                      <p className="text-sm font-semibold text-gray-800">
                        Require Name Confirmation
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Patient must type their full name to confirm
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── Step 5: Publish ── */}
          {currentStep === 5 && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4">Review &amp; Publish</h3>

              <div className="space-y-4">
                {/* File */}
                {uploadedFile && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <FileText size={18} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Uploaded File</p>
                      <p className="text-sm font-semibold text-gray-800">{uploadedFile.name}</p>
                      <p className="text-xs text-gray-400">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                )}

                {/* Form Details */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Form Details
                    </p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-y-2.5 gap-x-4">
                    <ReviewRow label="Form Name" value={formName || "—"} />
                    <ReviewRow
                      label="Department"
                      value={
                        selectedDeptIds.length === 0
                          ? "Not selected"
                          : selectedDeptIds.length === departments.length
                          ? "All Departments"
                          : departments
                              .filter((d) => selectedDeptIds.includes(d._id))
                              .map((d) => d.name)
                              .join(", ")
                      }
                    />
                    <ReviewRow label="Language" value={language} />
                    <ReviewRow label="Version" value={version || "1.0"} />
                    {description && (
                      <div className="col-span-2">
                        <ReviewRow label="Description" value={description} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Mapping */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Service Mapping
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    {selectedServices.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No services selected</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedServices.map((svc) => (
                          <span
                            key={svc._id}
                            className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                          >
                            {svc.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Signature Settings */}
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Signature Settings
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <SignatureStatus
                      label="Digital Signature"
                      enabled={enableDigitalSignature}
                    />
                    <SignatureStatus
                      label="Name Confirmation"
                      enabled={requireNameConfirmation}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={15} />
            Back
          </button>

          <p className="text-xs text-gray-400 font-medium">
            Step {currentStep} of {STEPS.length}
          </p>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-200"
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-green-200"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Publish Form
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helper sub-components ────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 font-semibold">{value}</p>
    </div>
  );
}

function SignatureStatus({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center ${
          enabled ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        {enabled ? (
          <Check size={12} className="text-green-600" />
        ) : (
          <X size={12} className="text-gray-400" />
        )}
      </span>
      <span className={`text-sm font-medium ${enabled ? "text-gray-800" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

// ─── View Consent Modal ────────────────────────────────────────────────────────

interface ViewConsentModalProps {
  consent: ConsentForm | null;
  onClose: () => void;
}

function ViewConsentModal({ consent, onClose }: ViewConsentModalProps) {
  if (!consent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto ">
        {/* Header */}
        <div className="px-8 pt-7 pb-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">View Consent Form</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Detailed information about this consent form
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-4 space-y-6">
          {/* Document Preview Section */}
          {consent.fileUrl && (
            <div className="rounded-xl border border-gray-300 overflow-hidden bg-gray-50">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText size={16} />
                  Document Preview
                </h3>
              </div>
              <div className="p-4">
                {consent.fileUrl.toLowerCase().includes('.pdf') ? (
                  <div className="space-y-3">
                    <iframe
                      src={consent.fileUrl}
                      className="w-full h-96 border border-gray-300 rounded-lg"
                      title="Document Preview"
                    />
                    <div className="flex gap-3">
                      <a
                        href={consent.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                      >
                        <Upload size={14} />
                        Open in New Tab
                      </a>
                      <a
                        href={consent.fileUrl}
                        download={consent.fileName || 'consent-form.pdf'}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                      >
                        <CheckCircle size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText size={48} className="text-blue-600 mb-3" />
                    <p className="text-gray-600 font-medium mb-2">{consent.fileName}</p>
                    <p className="text-sm text-gray-500 mb-4">Preview not available for this file type</p>
                    <div className="flex gap-3">
                      <a
                        href={consent.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
                      >
                        <Upload size={14} />
                        Open File
                      </a>
                      <a
                        href={consent.fileUrl}
                        download={consent.fileName || 'file'}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                      >
                        <CheckCircle size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Details */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Form Details</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-xs text-gray-400 font-medium">Form Name</p>
                <p className="text-sm font-semibold text-gray-800">{consent.formName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Department</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {consent.departmentIds && consent.departmentIds.length > 0 ? (
                    consent.departmentIds.map((d) => (
                      <span key={d._id} className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                        {d.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-gray-800">Not assigned</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Language</p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                    <Globe size={10} />
                    {consent.language}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Version</p>
                <p className="text-sm font-semibold text-gray-800">v{consent.version}</p>
              </div>
              {consent.description && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 font-medium">Description</p>
                  <p className="text-sm text-gray-700 mt-1">{consent.description}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-xs text-gray-400 font-medium">Created At</p>
                <p className="text-sm font-medium text-gray-800">
                  {new Date(consent.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Service Mapping */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Service Mapping</h3>
            </div>
            <div className="p-4">
              {consent.serviceIds.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No services mapped</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {consent.serviceIds.map((svc) => (
                    <span
                      key={svc._id}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium"
                    >
                      {svc.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Signature Settings */}
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Signature Settings</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <PenLine size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Digital Signature</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    consent.enableDigitalSignature
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {consent.enableDigitalSignature ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Name Confirmation</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    consent.requireNameConfirmation
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {consent.requireNameConfirmation ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    consent.status === "published" ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">Current Status</span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  consent.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {consent.status === "published" ? (
                  <Check size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}
                {consent.status.charAt(0).toUpperCase() + consent.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Consent Page ────────────────────────────────────────────────────────

const ConsentPage: NextPageWithLayout = () => {
  // Permission states
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

  // Helper function to get user info from token
  const getUserInfo = useCallback(() => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      for (const key of TOKEN_PRIORITY) {
        const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
            );
            const decoded = JSON.parse(jsonPayload);
            return {
              role: decoded.role || decoded.userRole || null,
              id: decoded.userId || decoded.id || null,
            };
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return { role: null, id: null };
  }, []);

  // Helper function to get user role from token
  const getUserRole = useCallback(() => {
    return getUserInfo().role;
  }, [getUserInfo]);

  // Sync token state on mount and storage change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const agentTok = localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken");
      setHasAgentToken(!!agentTok);
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, []);

  // Determine if this is an agent route
  useEffect(() => {
    if (typeof window === "undefined") return;
    const agentPath = window.location.pathname?.startsWith("/agent/");
    setIsAgentRoute(agentPath && hasAgentToken);
  }, [hasAgentToken]);

  // Use agent permissions hook for agent routes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentPermissionsHook: any = useAgentPermissions(
    isAgentRoute ? "Clinic_consent_Form" : null,
  );
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;

    const newPermissions = {
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    if (isAgentRoute) return;
    let isMounted = true;

    // Check which token type is being used
    const clinicToken = typeof window !== "undefined" ? localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken") : null;
    const doctorToken = typeof window !== "undefined" ? localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken") : null;
    const agentToken = typeof window !== "undefined" ? localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken") : null;
    const staffToken = typeof window !== "undefined" ? localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken") : null;
    const userToken = typeof window !== "undefined" ? localStorage.getItem("userToken") || sessionStorage.getItem("userToken") : null;

    const userRole = getUserRole();
    const authToken = clinicToken || doctorToken || agentToken || staffToken || userToken;

    // For admin role, grant full access (bypass permission checks)
    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return;
    }

    // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!authToken) {
            if (!isMounted) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
            setPermissionsLoaded(true);
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            console.log("Sidebar permissions API response:", res.data);
            // Check if permissions array exists and is not null
            if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the Clinic_consent_Form module
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for Clinic_consent_Form module variations
                if (p.module === "Clinic_consent_Form") return true;
                if (p.module === "Clinic_consent_form") return true;
                if (p.module === "clinic_consent_Form") return true;
                if (p.module === "clinic_consent_form") return true;
                if (p.module === "consent_Form") return true;
                if (p.module === "consent_form") return true;
                if (p.module === "consent") return true;
                return false;
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};

                console.log("Found module permission:", modulePermission);
                console.log("Actions:", actions);

                // Check if "all" is true, which grants all permissions
                const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
                const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
                const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
                const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
                const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

                console.log("Parsed permissions - all:", moduleAll, "create:", moduleCreate, "read:", moduleRead, "update:", moduleUpdate, "delete:", moduleDelete);

                setPermissions({
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                });
              } else {
                // Module permission not found in the permissions array - default to read-only
                setPermissions({
                  canRead: true, // Clinic/doctor can always read their own data
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            // API response doesn't have permissions, default to full access (backward compatibility)
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
          // On error, default to full access (backward compatibility)
          if (isMounted) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchClinicPermissions();
      return;
    }

    // For agent/doctorStaff tokens (when not on agent route), check permissions
    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log("Fetching Agent/Staff Permissions for Clinic_consent_Form...");
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          // Try Clinic_consent_Form first (proper casing)
          let res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "Clinic_consent_Form" },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          let data = res.data;
          
          // If not found, try clinic_consent_Form (lowercase)
          if (!data?.permissions && data?.error?.includes("not found")) {
            res = await axios.get("/api/agent/get-module-permissions", {
              params: { moduleKey: "clinic_consent_Form" },
              headers: { Authorization: `Bearer ${agentStaffToken}` },
            });
            data = res.data;
          }
          
          // If still not found, try clinic_consent_form
          if (!data?.permissions && data?.error?.includes("not found")) {
            res = await axios.get("/api/agent/get-module-permissions", {
              params: { moduleKey: "clinic_consent_form" },
              headers: { Authorization: `Bearer ${agentStaffToken}` },
            });
            data = res.data;
          }
          
          console.log("Agent Permissions API Response:", data);

          if (!isMounted) return;

          // Default to true if module not found in permissions (matches backend logic)
          if (!data?.permissions && data?.error?.includes("not found in agent permissions")) {
            console.log("Module not found in permissions, granting full access by default");
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          const actions = data?.permissions?.actions || data?.data?.moduleActions || {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isTrue = (val: any) => val === true || val === "true" || String(val || "").toLowerCase() === "true";

          const canAll = isTrue(actions.all);

          const newPerms = {
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          };

          console.log("Final Agent/Staff Permissions:", newPerms);
          setPermissions(newPerms);
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          // Swallow agent permission errors; they will just result in no extra access
          setPermissions({
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          });
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchPermissions();
    } else {
      // Unknown token type - default to full access (likely clinic/doctor)
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isAgentRoute, getUserRole]);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<ConsentForm | null>(null);
  const [consents, setConsents] = useState<ConsentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("clinicToken") ||
        sessionStorage.getItem("clinicToken") ||
        localStorage.getItem("agentToken") ||
        sessionStorage.getItem("agentToken") ||
        ""
      : "";

  const fetchConsents = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const { data } = await axios.get("/api/clinic/consent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) setConsents(data.consents || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) return;
    fetchConsents();
  }, [fetchConsents, permissionsLoaded, permissions.canRead]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this consent form?")) return;
    try {
      const token = getToken();
      const { data } = await axios.delete(`/api/clinic/consent?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success("Consent form deleted");
        setConsents((prev) => prev.filter((c) => c._id !== id));
      }
    } catch {
      toast.error("Failed to delete consent form");
    }
  };

  const handleView = (consent: ConsentForm) => {
    setSelectedConsent(consent);
    setShowViewModal(true);
  };

  const filtered = consents.filter((c) =>
    c.formName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: consents.length,
    published: consents.filter((c) => c.status === "published").length,
    withSignature: consents.filter((c) => c.enableDigitalSignature).length,
  };

  // Show access denied message only if BOTH read and create are false
  if (!permissions.canRead && !permissions.canCreate) {
    console.log("Rendering Access Denied - permissions:", permissions);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-700">
            You do not have permission to view or upload consent forms. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Consent Forms | Zeva360</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consent Forms</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage patient consent forms for your clinic
            </p>
          </div>
          {permissions.canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
            >
              <Upload size={16} />
              Upload Consent Form
            </button>
          )}
        </div>

          {/* READ-ONLY SECTION: Stats, Search, and Table - Only shown when canRead is true */}
          {permissions.canRead && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Forms" value={stats.total} color="blue" icon={FileText} />
              <StatCard label="Published" value={stats.published} color="green" icon={CheckCircle} />
              <StatCard
                label="Digital Signature Enabled"
                value={stats.withSignature}
                color="purple"
                icon={PenLine}
              />
            </div>

            {/* Search + Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">All Consent Forms</h2>
            <div className="relative w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forms..."
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <FileText size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No consent forms found</p>
              <p className="text-xs mt-1">
                Click &quot;Upload Consent Form&quot; to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left">Form Name</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Language</th>
                    <th className="px-4 py-3 text-left">Version</th>
                    <th className="px-4 py-3 text-left">Services</th>
                    <th className="px-4 py-3 text-left">Signature</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((consent) => (
                    <tr key={consent._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-blue-200 transition-colors" onClick={() => handleView(consent)}>
                            <FileText size={13} className="text-blue-600" />
                          </div>
                          <span 
                            className="font-medium text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleView(consent)}
                          >
                            {consent.formName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {consent.departmentIds && consent.departmentIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {consent.departmentIds.slice(0, 2).map((d) => (
                              <span
                                key={d._id}
                                className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px]"
                              >
                                {d.name}
                              </span>
                            ))}
                            {consent.departmentIds.length > 2 && (
                              <span className="text-[10px] text-gray-400">
                                +{consent.departmentIds.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                          <Globe size={10} />
                          {consent.language}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">v{consent.version}</td>
                      <td className="px-4 py-3">
                        {consent.serviceIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {consent.serviceIds.slice(0, 2).map((s) => (
                              <span
                                key={s._id}
                                className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
                              >
                                {s.name}
                              </span>
                            ))}
                            {consent.serviceIds.length > 2 && (
                              <span className="text-xs text-gray-400">
                                +{consent.serviceIds.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {consent.enableDigitalSignature && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                              Digital
                            </span>
                          )}
                          {consent.requireNameConfirmation && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-medium">
                              Name
                            </span>
                          )}
                          {!consent.enableDigitalSignature && !consent.requireNameConfirmation && (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            consent.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {consent.status === "published" ? (
                            <Check size={10} />
                          ) : (
                            <AlertCircle size={10} />
                          )}
                          {consent.status.charAt(0).toUpperCase() + consent.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleView(consent)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          {permissions.canDelete && (
                            <button
                              onClick={() => handleDelete(consent._id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <UploadConsentModal
          onClose={() => setShowModal(false)}
          onSuccess={(consent) => {
            setConsents((prev) => [consent, ...prev]);
          }}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedConsent && (
        <ViewConsentModal
          consent={selectedConsent}
          onClose={() => {
            setShowViewModal(false);
            setSelectedConsent(null);
          }}
        />
      )}
    </>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "purple";
  icon: React.ElementType;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

ConsentPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export const ConsentPageBase = ConsentPage;

const ProtectedConsentPage: NextPageWithLayout = withClinicAuth(ConsentPage);
ProtectedConsentPage.getLayout = ConsentPage.getLayout;

export default ProtectedConsentPage;
