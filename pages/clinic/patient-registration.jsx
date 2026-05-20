import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import PatientRegistration from "../staff/patient-registration";
import { PatientInformation } from "../staff/patient-information";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import { X, UserPlus, Upload, Download, FileText, AlertCircle, CheckCircle, XCircle, Edit, AlertCircle as AlertCircleIcon } from "lucide-react";
import PatientUpdateForm from "../../components/patient/PatientUpdateForm";
import axios from "axios";
import csv from "csvtojson";
import * as XLSX from "xlsx";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";

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
    try {
      const value =
        window.localStorage.getItem(key) ||
        window.sessionStorage.getItem(key);
      if (value) return value;
    } catch (error) {
      console.warn(`Unable to read ${key} from storage`, error);
    }
  }
  return null;
};

const getAuthHeaders = (routeContext) => {
  let token = null;

  if (routeContext === "agent") {
    token =
      localStorage.getItem("agentToken") ||
      sessionStorage.getItem("agentToken") ||
      localStorage.getItem("staffToken") ||
      sessionStorage.getItem("staffToken") ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken");
  } else {
    token =
      localStorage.getItem("clinicToken") ||
      sessionStorage.getItem("clinicToken");
  }

  if (!token) {
    token =
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken");
  }

  return token ? { Authorization: `Bearer ${token}` } : null;
};

const getUserInfo = () => {
  if (typeof window === "undefined") return { role: null, id: null };
  try {
    for (const key of TOKEN_PRIORITY) {
      const token =
        window.localStorage.getItem(key) ||
        window.sessionStorage.getItem(key);
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(
                (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
              )
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
};

const getUserRole = () => {
  return getUserInfo().role;
};

function ClinicPatientRegistration({
  contextOverride = null,
}) {
  const router = useRouter();
  const [routeContext, setRouteContext] = useState(
    contextOverride || "clinic",
  );
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editPatientId, setEditPatientId] = useState(null);
  const [showSavePopup, setShowSavePopup] = useState(false);

  useEffect(() => {
    if (contextOverride) {
      setRouteContext(contextOverride);
      return;
    }
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname || "";
    if (currentPath.startsWith("/agent/")) {
      setRouteContext("agent");
    } else {
      setRouteContext("clinic");
    }
  }, [contextOverride]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const hasAgent =
        Boolean(
          localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken"),
        ) ||
        Boolean(
          localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken"),
        ) ||
        Boolean(
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken"),
        );
      setHasAgentToken(hasAgent);
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const agentPath =
      router?.pathname?.startsWith("/agent/") ||
      window.location.pathname?.startsWith("/agent/");
    setIsAgentRoute(agentPath && hasAgentToken);
  }, [router.pathname, hasAgentToken]);

  const agentPermissionsHook = useAgentPermissions(
    isAgentRoute ? "clinic_patient_registration" : null,
  );
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

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

  useEffect(() => {
    if (isAgentRoute) return;
    let isMounted = true;

    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken")
        : null;
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken")
        : null;

    const userRole = getUserRole();
    const authToken =
      clinicToken || doctorToken || agentToken || staffToken || userToken;

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
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              const modulePermission = res.data.permissions.find((p) => {
                if (!p?.module) return false;
                if (p.module === "clinic_patient_registration") return true;
                if (p.module === "patient_registration") return true;
                return false;
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};

                const moduleAll =
                  actions.all === true ||
                  actions.all === "true" ||
                  String(actions.all).toLowerCase() === "true";
                const moduleCreate =
                  actions.create === true ||
                  actions.create === "true" ||
                  String(actions.create).toLowerCase() === "true";
                const moduleRead =
                  actions.read === true ||
                  actions.read === "true" ||
                  String(actions.read).toLowerCase() === "true";
                const moduleUpdate =
                  actions.update === true ||
                  actions.update === "true" ||
                  String(actions.update).toLowerCase() === "true";
                const moduleDelete =
                  actions.delete === true ||
                  actions.delete === "true" ||
                  String(actions.delete).toLowerCase() === "true";

                setPermissions({
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                });
              } else {
                setPermissions({
                  canRead: true,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            setPermissions({
              canRead: true,
              canUpdate: true,
              canDelete: true,
              canCreate: true,
            });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
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

    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log(
            "Fetching Agent/Staff Permissions for clinic_patient_registration...",
          );
          setPermissionsLoaded(false);
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_patient_registration" },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          const data = res.data;
          console.log("Agent Permissions API Response:", data);

          if (!isMounted) return;

          if (
            !data?.permissions &&
            data?.error?.includes("not found in agent permissions")
          ) {
            console.log(
              "Module not found in permissions, granting full access by default",
            );
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            setPermissionsLoaded(true);
            return;
          }

          const actions =
            data?.permissions?.actions || data?.data?.moduleActions || {};
          const isTrue = (val) =>
            val === true ||
            val === "true" ||
            String(val || "").toLowerCase() === "true";

          const canAll = isTrue(actions.all);

          const newPerms = {
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          };
          setPermissions(newPerms);
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          setPermissions({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canRead: false,
          });
        } finally {
          setPermissionsLoaded(true);
        }
      };

      fetchPermissions();
      return;
    }

    setPermissions({
      canRead: false,
      canUpdate: false,
      canDelete: false,
      canCreate: false,
    });
    setPermissionsLoaded(true);
  }, [isAgentRoute, routeContext]);

  useEffect(() => {
    if (showSavePopup) {
      const t = setTimeout(() => setShowSavePopup(false), 2500);
      return () => clearTimeout(t);
    }
  }, [showSavePopup]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRegistrationSuccess = () => {
    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
    setShowSavePopup(true);
  };

  const handleOpenEditModal = (patientId) => {
    setEditPatientId(patientId);
  };

  const handleCloseEditModal = (shouldRefresh = false) => {
    setEditPatientId(null);
    if (shouldRefresh) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  const handleImportSuccess = () => {
    setIsImportModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-teal-600"></div>
      </div>
    );
  }

  if (!permissions.canRead && !permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
          <p className="text-sm text-teal-700 mb-4">
            You do not have permission to view or register patients.
          </p>
          <p className="text-xs text-teal-600">
            Please contact your administrator to request access to the Patient Registration module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="w-full space-y-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Patient Management</h1>
              <p className="text-gray-700 text-xs mt-1">View and manage all patient records and information</p>
            </div>
            {permissions.canCreate && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenImportModal}
                  className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white border border-white/30 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium backdrop-blur-sm"
                >
                  <Upload className="h-4 w-4"/>
                  <span>Import Patients</span>
                </button>
                <button
                  onClick={handleOpenModal}
                  className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
                >
                  <UserPlus className="h-4 w-4"/>
                  <span>Register Patient</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {!permissions.canRead ? (
          <div className="bg-white rounded-lg p-6 sm:p-8 border border-gray-200 shadow-sm">
            <div className="text-center max-w-md mx-auto">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <AlertCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-teal-900 mb-2">
                Access Denied
              </h3>
              <p className="text-sm text-teal-700 mb-3">
                You do not have permission to view patient information.
              </p>
              <p className="text-xs text-teal-600">
                Please contact your administrator to request access to view patients.
              </p>
            </div>
          </div>
        ) : (
          <PatientInformation key={refreshKey} hideHeader={true} onEditPatient={handleOpenEditModal} permissions={permissions} routeContext={routeContext} />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 z-20 p-2 rounded-lg bg-white/90 hover:bg-white shadow-sm border border-gray-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-gray-50 rounded-2xl shadow-2xl border border-gray-200 p-0">
              <div className="p-4 sm:p-6">
                <PatientRegistrationWrapper 
                  onSuccess={handleRegistrationSuccess}
                  onCancel={handleCloseModal}
                  isCompact={false}
                  routeContext={routeContext}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <PatientImportModal
          onClose={handleCloseImportModal}
          onSuccess={handleImportSuccess}
          routeContext={routeContext}
        />
      )}

      {editPatientId && (
        <PatientUpdateForm
          patientId={editPatientId}
          embedded={true}
          onClose={() => handleCloseEditModal(true)}
          onUpdated={() => setRefreshKey((prev) => prev + 1)}
        />
      )}

      {showSavePopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl min-h-[220px] p-6 border border-gray-200">
            <div className="flex flex-col items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 text-center">Patient Saved Successfully</h3>
            </div>
            <p className="text-base text-gray-700 text-center mb-6">
              Patient registration has been saved successfully.
            </p>
            <div className="flex">
              <button
                type="button"
                onClick={() => setShowSavePopup(false)}
                className="w-full px-6 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PatientRegistrationWrapper = ({ onSuccess, onCancel, isCompact, routeContext }) => {
  return <PatientRegistration onSuccess={onSuccess} onCancel={onCancel} isCompact={!!isCompact} routeContext={routeContext} />;
};

function PatientImportModal({ onClose, onSuccess, routeContext }) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [step, setStep] = useState(1);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const fieldLabels = {
    invoiceNumber: "Invoice Number (Auto-generated - will be ignored)",
    firstName: "First Name *",
    lastName: "Last Name",
    gender: "Gender",
    email: "Email",
    mobileNumber: "Mobile Number *",
    emrNumber: "EMR Number (Auto-generated - will be ignored)",
    referredBy: "Referred By",
    patientType: "Patient Type (New/Old)",
    insurance: "Insurance (Yes/No)",
    insuranceType: "Insurance Type (Paid/Advance)",
    advanceGivenAmount: "Advance Given Amount",
    coPayPercent: "Co-Pay Percent",
    advanceClaimStatus: "Advance Claim Status",
    advanceClaimReleasedBy: "Advance Claim Released By",
    notes: "Notes",
  };

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadResult(null);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const fileName = selectedFile.name.toLowerCase();
      let jsonArray = [];

      if (fileName.endsWith(".csv")) {
        const text = new TextDecoder().decode(fileBuffer);
        jsonArray = await csv().fromString(text);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const workbook = XLSX.read(fileBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        jsonArray = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      if (jsonArray && jsonArray.length > 0) {
        const columns = Object.keys(jsonArray[0]);
        setAvailableColumns(columns);
        setFilePreview(jsonArray.slice(0, 5));

        const autoMapping = {};
        
        const commonMappings = {
          'name': 'firstName',
          'patient name': 'firstName',
          'full name': 'firstName',
          'first name': 'firstName',
          'phone': 'mobileNumber',
          'mobile': 'mobileNumber',
          'mobile number': 'mobileNumber',
          'phone number': 'mobileNumber',
          'contact': 'mobileNumber',
          'contact number': 'mobileNumber',
          'email': 'email',
          'email address': 'email',
          'gender': 'gender',
          'sex': 'gender',
          'last name': 'lastName',
          'surname': 'lastName',
        };
        
        columns.forEach((col) => {
          const colLower = col.toLowerCase().trim();
          
          if (commonMappings[colLower]) {
            if (!autoMapping[col]) {
              autoMapping[col] = commonMappings[colLower];
            }
          } else {
            Object.keys(fieldLabels).forEach((field) => {
              const fieldWithSpaces = field.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
              if (colLower === field.toLowerCase() || 
                  colLower === fieldWithSpaces ||
                  colLower.includes(field.toLowerCase()) ||
                  field.toLowerCase().includes(colLower)) {
                if (!autoMapping[col]) {
                  autoMapping[col] = field;
                }
              }
            });
          }
        });
        setColumnMapping(autoMapping);
        setStep(2);
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      setUploadResult({
        success: false,
        message: "Failed to parse file. Please check the file format.",
      });
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        "First Name": "John",
        "Last Name": "Doe",
        "Gender": "Male",
        "Email": "john.doe@example.com",
        "Mobile Number": "9876543210",
        "Referred By": "Dr. Smith",
        "Patient Type": "New",
        "Insurance": "No",
        "Insurance Type": "Paid",
        "Advance Given Amount": "0",
        "Co-Pay Percent": "0",
        "Notes": "Sample patient data"
      },
      {
        "First Name": "Jane",
        "Last Name": "Smith",
        "Gender": "Female",
        "Email": "jane.smith@example.com",
        "Mobile Number": "9876543211",
        "Referred By": "",
        "Patient Type": "Old",
        "Insurance": "Yes",
        "Insurance Type": "Advance",
        "Advance Given Amount": "5000",
        "Co-Pay Percent": "10",
        "Notes": ""
      }
    ];

    const csvContent = [
      Object.keys(sampleData[0]).join(","),
      ...sampleData.map(row => 
        Object.values(row).map(val => `"${val}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "patient-import-sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (!file) {
      setUploadResult({
        success: false,
        message: "Please select a file first",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("columnMapping", JSON.stringify(columnMapping));

      const authHeaders = getAuthHeaders(routeContext);
      const response = await axios.post("/api/clinic/import-patients", formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setUploadResult({
          success: true,
          message: response.data.message,
          data: response.data.data,
        });
        setStep(3);
        if (response.data.data && response.data.data.errors && response.data.data.errors.length > 0) {
          setShowErrorModal(true);
        } else if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setUploadResult({
          success: false,
          message: response.data.message || "Import failed",
          data: response.data.data,
        });
        setStep(3);
        if (response.data.data && response.data.data.errors && response.data.data.errors.length > 0) {
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      setUploadResult({
        success: false,
        message: error.response?.data?.message || "Failed to import patients",
        data: error.response?.data?.data,
      });
      setStep(3);
      if (error.response?.data?.data && error.response?.data?.data.errors && error.response?.data?.data.errors.length > 0) {
        setShowErrorModal(true);
      } else {
        setShowErrorModal(true);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleErrorModalOk = () => {
    setShowErrorModal(false);
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-2 sm:px-3 py-2 flex items-center justify-between z-10">
          <h2 className="text-sm sm:text-base font-bold text-teal-900">Import Patients</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-teal-100 rounded-lg text-teal-500 hover:text-teal-700 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-2 sm:p-3 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Import Instructions</h3>
                    <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                      <li>Upload a CSV or Excel file (.csv, .xlsx, .xls)</li>
                      <li>Maximum file size: 5MB</li>
                      <li>Required fields: First Name and Mobile Number</li>
                      <li>Optional fields: Email, Gender, and all other fields</li>
                      <li>Duplicate patients (same mobile number or email within your clinic) will be skipped</li>
                      <li>Same patient can exist across different clinics</li>
                      <li>EMR Number and Invoice Number are automatically generated sequentially (ignore any values in your file)</li>
                      <li>Download the sample file to see the correct format</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Sample CSV
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-teal-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-teal-700">Choose file to upload</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-teal-500 mt-2">CSV or Excel files only</p>
                {file && (
                  <p className="text-xs text-green-600 mt-2 font-medium">{file.name}</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-900 mb-1">Map Your Columns</h3>
                    <p className="text-xs text-yellow-800">
                      Match your file columns to the patient fields. Fields marked with * (First Name and Mobile Number) are required. All other fields are optional.
                    </p>
                  </div>
                </div>
              </div>

              {filePreview && filePreview.length > 0 && (
                <div className="bg-teal-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-teal-700 mb-2">File Preview (first 5 rows):</p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-200">
                      <thead>
                        <tr className="bg-teal-100">
                          {availableColumns.map((col) => (
                            <th key={col} className="px-2 py-1 border border-gray-300 text-left font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filePreview.map((row, idx) => (
                          <tr key={idx}>
                            {availableColumns.map((col) => (
                              <td key={col} className="px-2 py-1 border border-gray-300">
                                {String(row[col] || "").substring(0, 20)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(fieldLabels).map(([field, label]) => {
                  const mappedColumn = Object.keys(columnMapping).find(
                    (col) => columnMapping[col] === field
                  ) || "";
                  
                  return (
                    <div key={field} className="flex items-center gap-3">
                      <label className="flex-1 text-xs font-medium text-teal-700 min-w-[200px]">
                        {label}
                      </label>
                      <select
                        value={mappedColumn}
                        onChange={(e) => {
                          const newMapping = { ...columnMapping };
                          Object.keys(newMapping).forEach((key) => {
                            if (newMapping[key] === field) {
                              delete newMapping[key];
                            }
                          });
                          if (e.target.value) {
                            newMapping[e.target.value] = field;
                          }
                          setColumnMapping(newMapping);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Column --</option>
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-medium text-teal-700 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Importing..." : "Import Patients"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && uploadResult && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${
                uploadResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}>
                <div className="flex items-start gap-3">
                  {uploadResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold mb-1 ${
                      uploadResult.success ? "text-green-900" : "text-red-900"
                    }`}>
                      {uploadResult.success ? "Import Successful" : "Import Failed"}
                    </h3>
                    <p className={`text-xs ${
                      uploadResult.success ? "text-green-800" : "text-red-800"
                    }`}>
                      {uploadResult.message}
                    </p>
                    {uploadResult.data && (
                      <div className="mt-3 text-xs">
                        <p className={uploadResult.success ? "text-green-800" : "text-red-800"}>
                          Total: {uploadResult.data.total} | 
                          Imported: {uploadResult.data.imported} | 
                          Failed: {uploadResult.data.failed}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {uploadResult.data && uploadResult.data.errors && uploadResult.data.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-red-900 mb-2">Errors:</h4>
                  <ul className="space-y-1">
                    {uploadResult.data.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-xs text-red-800">{error}</li>
                    ))}
                    {uploadResult.data.errors.length > 10 && (
                      <li className="text-xs text-red-600 italic">
                        ... and {uploadResult.data.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showErrorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Import Errors</h2>
              </div>
              <button
                onClick={() => setShowErrorModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">
                  {uploadResult?.data?.failed || 0} patient(s) could not be imported. Please review the errors below and fix them in your CSV file.
                </p>
                {uploadResult?.data && (
                  <div className="text-xs text-red-700">
                    <p>
                      Total: {uploadResult.data.total} | 
                      Imported: {uploadResult.data.imported || 0} | 
                      Failed: {uploadResult.data.failed || 0}
                    </p>
                  </div>
                )}
              </div>

              {uploadResult?.data?.errors && uploadResult.data.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Error Details:</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <ul className="space-y-2">
                      {uploadResult.data.errors.map((error, idx) => (
                        <li key={idx} className="text-xs sm:text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {uploadResult?.message && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-yellow-800">{uploadResult.message}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={handleErrorModalOk}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ClinicPatientRegistration.getLayout = function PageLayout(page) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const ProtectedClinicPatientRegistration = withClinicAuth(ClinicPatientRegistration);
ProtectedClinicPatientRegistration.getLayout = ClinicPatientRegistration.getLayout;

export { ClinicPatientRegistration };
export default ProtectedClinicPatientRegistration;