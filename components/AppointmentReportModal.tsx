"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { X, Heart, ClipboardList, Trash2, Loader2, AlertCircle } from "lucide-react";

interface AppointmentLite {
  _id: string;
  patientName: string;
  patientId: string;
  emrNumber?: string;
  gender?: string;
  doctorName: string;
  doctorEmail?: string;
  startDate?: string;
  fromTime?: string;
  toTime?: string;
  status?: string;
}

interface PatientReportSummary {
  reportId?: string;
  appointmentId: string;
  temperatureCelsius: number;
  pulseBpm: number;
  systolicBp: number;
  diastolicBp: number;
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  respiratoryRate?: number;
  spo2Percent?: number;
  hipCircumference?: number;
  headCircumference?: number;
  bmi?: number;
  sugar?: string;
  urinalysis?: string;
  otherDetails?: string;
  updatedAt: string;
  createdAt: string;
  doctorName?: string;
  doctorEmail?: string;
  startDate?: string;
  fromTime?: string;
  toTime?: string;
}

interface AppointmentReportModalProps {
  isOpen: boolean;
  appointment: AppointmentLite | null;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  onSuccess?: () => void;
}

interface ReportData {
  temperatureCelsius: number | "";
  pulseBpm: number | "";
  systolicBp: number | "";
  diastolicBp: number | "";
  heightCm: number | "";
  weightKg: number | "";
  waistCm: number | "";
  respiratoryRate: number | "";
  spo2Percent: number | "";
  hipCircumference: number | "";
  headCircumference: number | "";
  bmi: number | "";
  sugar: string;
  urinalysis: string;
  otherDetails: string;
}

const defaultReport: ReportData = {
  temperatureCelsius: "",
  pulseBpm: "",
  systolicBp: "",
  diastolicBp: "",
  heightCm: "",
  weightKg: "",
  waistCm: "",
  respiratoryRate: "",
  spo2Percent: "",
  hipCircumference: "",
  headCircumference: "",
  bmi: "",
  sugar: "",
  urinalysis: "",
  otherDetails: "",
};

const fieldGroups = [
  {
    title: "Vital Signs",
    fields: [
      { name: "temperatureCelsius", label: "Temperature (°C)", type: "number", required: true },
      { name: "pulseBpm", label: "Pulse (BPM)", type: "number", required: true },
      { name: "systolicBp", label: "BP Systolic (mmHg)", type: "number", required: true },
      { name: "diastolicBp", label: "BP Diastolic (mmHg)", type: "number", required: true },
    ],
  },
  {
    title: "Body Measurements",
    fields: [
      { name: "heightCm", label: "Height (cm)", type: "number", required: false },
      { name: "weightKg", label: "Weight (kg)", type: "number", required: false },
      { name: "waistCm", label: "Waist (cm)", type: "number", required: false },
      { name: "hipCircumference", label: "Hip (cm)", type: "number", required: false },
      { name: "headCircumference", label: "Head Circumference (cm)", type: "number", required: false },
      { name: "bmi", label: "BMI", type: "number", required: false, readonly: true },
    ],
  },
  {
    title: "Lab Readings",
    fields: [
      { name: "sugar", label: "Sugar", type: "text", required: false },
      { name: "urinalysis", label: "Urinalysis", type: "text", required: false },
    ],
  },
  {
    title: "Additional Vitals",
    fields: [
      { name: "respiratoryRate", label: "Respiratory", type: "number", required: false },
      { name: "spo2Percent", label: "SpO₂ (%)", type: "number", required: false },
    ],
  },
];

const AppointmentReportModal: React.FC<AppointmentReportModalProps> = ({
  isOpen,
  appointment,
  onClose,
  getAuthHeaders,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [reportValues, setReportValues] = useState<ReportData>(defaultReport);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [patientReports, setPatientReports] = useState<PatientReportSummary[]>([]);
  const [patientDetails, setPatientDetails] = useState<{
    patientName: string;
    emrNumber?: string;
    gender?: string;
    doctorName: string;
    doctorEmail?: string;
    startDate?: string;
    fromTime?: string;
    toTime?: string;
    mobileNumber?: string;
    email?: string;
  } | null>(null);

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatTimeRange = useMemo(() => {
    if (!patientDetails?.fromTime || !patientDetails?.toTime) return "";
    return `${patientDetails.fromTime} – ${patientDetails.toTime}`;
  }, [patientDetails?.fromTime, patientDetails?.toTime]);

  useEffect(() => {
    if (!isOpen || !appointment) {
      setReportValues(defaultReport);
      setPatientDetails(null);
      setLastUpdated(null);
      setPatientReports([]);
      setError("");
      return;
    }

    const fetchReport = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = getAuthHeaders();
        const response = await axios.get("/api/clinic/appointment-reports", {
          headers,
          params: { appointmentId: appointment._id },
        });

        if (response.data.success) {
          const apptDetails = response.data.appointment;
          setPatientDetails({
            patientName: apptDetails.patientName || appointment.patientName,
            emrNumber: apptDetails.emrNumber || appointment.emrNumber,
            gender: apptDetails.gender || appointment.gender,
            doctorName: apptDetails.doctorName || appointment.doctorName,
            doctorEmail: apptDetails.doctorEmail || appointment.doctorEmail,
            startDate: apptDetails.startDate,
            fromTime: apptDetails.fromTime,
            toTime: apptDetails.toTime,
            mobileNumber: apptDetails.mobileNumber,
            email: apptDetails.email,
          });

          if (response.data.report) {
            setReportValues({
              temperatureCelsius: response.data.report.temperatureCelsius ?? "",
              pulseBpm: response.data.report.pulseBpm ?? "",
              systolicBp: response.data.report.systolicBp ?? "",
              diastolicBp: response.data.report.diastolicBp ?? "",
              heightCm: response.data.report.heightCm ?? "",
              weightKg: response.data.report.weightKg ?? "",
              waistCm: response.data.report.waistCm ?? "",
              respiratoryRate: response.data.report.respiratoryRate ?? "",
              spo2Percent: response.data.report.spo2Percent ?? "",
              hipCircumference: response.data.report.hipCircumference ?? "",
              headCircumference: response.data.report.headCircumference ?? "",
              bmi: response.data.report.bmi ?? "",
              sugar: response.data.report.sugar ?? "",
              urinalysis: response.data.report.urinalysis ?? "",
              otherDetails: response.data.report.otherDetails ?? "",
            });
            setLastUpdated(response.data.report.updatedAt);
          } else {
            setReportValues(defaultReport);
            setLastUpdated(null);
          }

          if (Array.isArray(response.data.patientReports)) {
            setPatientReports(response.data.patientReports);
          } else {
            setPatientReports([]);
          }
        } else {
          setError(response.data.message || "Failed to load report data");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [isOpen, appointment, getAuthHeaders]);

  const handleChange = (field: keyof ReportData, value: string) => {
    setReportValues((prev) => {
      const updated = {
        ...prev,
        [field]: value === "" ? "" : value,
      };
      if (field === "heightCm" || field === "weightKg") {
        if (updated.heightCm && updated.weightKg) {
          const heightMeters = Number(updated.heightCm) / 100;
          if (heightMeters > 0) {
            updated.bmi = Number(
              (Number(updated.weightKg) / (heightMeters * heightMeters)).toFixed(1)
            );
          }
        } else {
          updated.bmi = "";
        }
      }
      return updated;
    });
  };

  const refreshPatientReports = async () => {
    if (!appointment) return;
    try {
      const headers = getAuthHeaders();
      const response = await axios.get("/api/clinic/appointment-reports", {
        headers,
        params: { appointmentId: appointment._id },
      });
      if (response.data.success) {
        setPatientReports(response.data.patientReports || []);
      }
    } catch (error) {
      console.error("Failed to refresh reports", error);
    }
  };

  const deleteReport = async (reportId?: string) => {
    if (!reportId) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete("/api/clinic/appointment-reports", {
        headers,
        params: { reportId },
      });
      await refreshPatientReports();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete report");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!appointment) return;

    if (
      reportValues.temperatureCelsius === "" ||
      reportValues.pulseBpm === "" ||
      reportValues.systolicBp === "" ||
      reportValues.diastolicBp === ""
    ) {
      setError("Temperature, pulse, and blood pressure fields are mandatory.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      await axios.post(
        "/api/clinic/appointment-reports",
        {
          appointmentId: appointment._id,
          temperatureCelsius: reportValues.temperatureCelsius,
          pulseBpm: reportValues.pulseBpm,
          systolicBp: reportValues.systolicBp,
          diastolicBp: reportValues.diastolicBp,
          heightCm: reportValues.heightCm === "" ? undefined : reportValues.heightCm,
          weightKg: reportValues.weightKg === "" ? undefined : reportValues.weightKg,
          waistCm: reportValues.waistCm === "" ? undefined : reportValues.waistCm,
          respiratoryRate: reportValues.respiratoryRate === "" ? undefined : reportValues.respiratoryRate,
          spo2Percent: reportValues.spo2Percent === "" ? undefined : reportValues.spo2Percent,
          hipCircumference: reportValues.hipCircumference === "" ? undefined : reportValues.hipCircumference,
          headCircumference: reportValues.headCircumference === "" ? undefined : reportValues.headCircumference,
          sugar: reportValues.sugar,
          urinalysis: reportValues.urinalysis,
          otherDetails: reportValues.otherDetails,
        },
        { headers }
      );

      setLastUpdated(new Date().toISOString());
      await refreshPatientReports();
      setReportValues(defaultReport);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save report");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !appointment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-1 sm:p-2 bg-black/50 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="bg-white dark:bg-gray-50 w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[98vh] sm:max-h-[95vh] transform transition-all duration-300 scale-100 opacity-100 animate-in slide-in-from-bottom-4 zoom-in-95">
        <div className="sticky top-0 bg-gray-800 dark:bg-gray-700 border-b border-gray-700 dark:border-gray-600 px-2 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between z-10 shadow">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-0.5 sm:p-1 bg-gray-700 dark:bg-gray-600 rounded">
              <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
            <div>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-wide text-gray-300">Patient Report</p>
              <h3 className="text-xs sm:text-sm font-bold text-white">{appointment.patientName}</h3>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {appointment.emrNumber && (
                  <span className="px-1 py-0.5 bg-gray-700 dark:bg-gray-600 text-gray-200 rounded text-[7px] sm:text-[8px] font-medium">EMR: {appointment.emrNumber}</span>
                )}
                {appointment.gender && (
                  <span className="px-1 py-0.5 bg-gray-700 dark:bg-gray-600 text-gray-200 rounded text-[7px] sm:text-[8px] font-medium capitalize">
                    {appointment.gender}
                  </span>
                )}
                <span className="px-1 py-0.5 bg-gray-700 dark:bg-gray-600 text-gray-200 rounded text-[7px] sm:text-[8px] font-medium">
                  Dr. {appointment.doctorName}
                </span>
                {patientDetails?.startDate && (
                  <span className="px-1 py-0.5 bg-gray-700 dark:bg-gray-600 text-gray-200 rounded text-[7px] sm:text-[8px] font-medium">
                    {formatDate(patientDetails.startDate)} {formatTimeRange && `• ${formatTimeRange}`}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            className="p-0.5 sm:p-1 hover:bg-gray-700 dark:hover:bg-gray-600 rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-500 text-white"
            onClick={() => {
              onClose();
            }}
            aria-label="Close modal"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        <div className="px-2 sm:px-3 py-2 overflow-y-auto flex-1">
          {error && (
            <div className="mb-2 rounded border-l-2 border-red-500 bg-red-50 dark:bg-red-100 px-1.5 sm:px-2 py-1 flex items-start gap-1 text-red-700 dark:text-red-900 shadow-sm animate-in slide-in-from-top-2 fade-in" role="alert">
              <AlertCircle className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 animate-pulse" />
              <p className="text-[9px] sm:text-[10px] font-medium">{error}</p>
            </div>
          )}

          {lastUpdated && (
            <div className="mb-2 rounded border-l-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-100 px-1.5 sm:px-2 py-1 flex items-center gap-1 text-emerald-700 dark:text-emerald-900 shadow-sm animate-in slide-in-from-top-2 fade-in">
              <ClipboardList className="w-2.5 h-2.5 flex-shrink-0" />
              <p className="text-[9px] sm:text-[10px] font-medium">Last updated {new Date(lastUpdated).toLocaleString()}</p>
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto mb-1.5" />
              <p className="text-[9px] sm:text-[10px] text-gray-500">Loading report...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              {fieldGroups.map((group, groupIdx) => {
                // Special handling for Body Measurements - all in one line
                const isBodyMeasurements = group.title === "Body Measurements";
                return (
                <div key={group.title} className="rounded border border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100 p-1.5 sm:p-2 shadow-sm transition-all duration-300" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                  <h4 className="text-[8px] sm:text-[9px] font-bold text-gray-800 dark:text-gray-900 mb-1 uppercase tracking-wider flex items-center gap-1">
                    <div className="w-0.5 h-3 bg-gray-600 dark:bg-gray-700 rounded-full"></div>
                    {group.title}
                  </h4>
                  {isBodyMeasurements ? (
                    <div className="grid grid-cols-6 gap-1">
                      {group.fields.map((field) => (
                        <label key={field.name} className="text-[8px] sm:text-[9px] font-medium text-gray-700 dark:text-gray-800 flex flex-col gap-0.5">
                          <span className="flex items-center gap-0.5">
                            {field.label.replace(" (cm)", "").replace(" (kg)", "").replace("Head Circumference", "Head")}
                            {field.required && <span className="text-red-500">*</span>}
                          </span>
                          <input
                            type={field.type}
                            value={reportValues[field.name as keyof ReportData] ?? ""}
                            onChange={(e) => handleChange(field.name as keyof ReportData, e.target.value)}
                            required={field.required}
                            min={field.type === "number" ? "0" : undefined}
                            readOnly={Boolean(field.readonly)}
                            className={`rounded border border-gray-300 dark:border-gray-300 px-1 py-0.5 text-[8px] sm:text-[9px] bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-600 focus:border-gray-500 dark:focus:border-gray-600 transition-all outline-none ${
                              field.readonly ? "bg-gray-100 dark:bg-gray-200 text-gray-500 dark:text-gray-600 cursor-not-allowed" : ""
                            }`}
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
                      {group.fields.map((field) => (
                        <label key={field.name} className="text-[8px] sm:text-[9px] font-medium text-gray-700 dark:text-gray-800 flex flex-col gap-0.5">
                          <span className="flex items-center gap-0.5">
                            {field.label}
                            {field.required && <span className="text-red-500">*</span>}
                          </span>
                          <input
                            type={field.type}
                            value={reportValues[field.name as keyof ReportData] ?? ""}
                            onChange={(e) => handleChange(field.name as keyof ReportData, e.target.value)}
                            required={field.required}
                            min={field.type === "number" ? "0" : undefined}
                            readOnly={Boolean(field.readonly)}
                            className={`rounded border border-gray-300 dark:border-gray-300 px-1 py-0.5 text-[8px] sm:text-[9px] bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-600 focus:border-gray-500 dark:focus:border-gray-600 transition-all outline-none ${
                              field.readonly ? "bg-gray-100 dark:bg-gray-200 text-gray-500 dark:text-gray-600 cursor-not-allowed" : ""
                            }`}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )})}

              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded border border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100 p-1.5 shadow-sm transition-all duration-300">
                  <label className="text-[8px] sm:text-[9px] font-medium text-gray-700 dark:text-gray-800 flex flex-col gap-0.5">
                    Sugar Details
                    <textarea
                      value={reportValues.sugar}
                      onChange={(e) => handleChange("sugar", e.target.value)}
                      className="rounded border border-gray-300 dark:border-gray-300 px-1 py-0.5 text-[8px] sm:text-[9px] bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-600 focus:border-gray-500 dark:focus:border-gray-600 transition-all outline-none resize-none"
                      rows={1.5}
                      placeholder="Enter sugar level..."
                    />
                  </label>
                </div>
                <div className="rounded border border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100 p-1.5 shadow-sm transition-all duration-300">
                  <label className="text-[8px] sm:text-[9px] font-medium text-gray-700 dark:text-gray-800 flex flex-col gap-0.5">
                    Urinalysis
                    <textarea
                      value={reportValues.urinalysis}
                      onChange={(e) => handleChange("urinalysis", e.target.value)}
                      className="rounded border border-gray-300 dark:border-gray-300 px-1 py-0.5 text-[8px] sm:text-[9px] bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-600 focus:border-gray-500 dark:focus:border-gray-600 transition-all outline-none resize-none"
                      rows={1.5}
                      placeholder="Enter urinalysis..."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded border border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100 p-1.5 shadow-sm transition-all duration-300">
                <label className="text-[8px] sm:text-[9px] font-medium text-gray-700 dark:text-gray-800 flex flex-col gap-0.5">
                  Other Notes
                  <textarea
                    value={reportValues.otherDetails}
                    onChange={(e) => handleChange("otherDetails", e.target.value)}
                    className="rounded border border-gray-300 dark:border-gray-300 px-1 py-0.5 text-[8px] sm:text-[9px] bg-white dark:bg-gray-50 text-gray-900 dark:text-gray-900 focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-600 focus:border-gray-500 dark:focus:border-gray-600 transition-all outline-none resize-none"
                    rows={1.5}
                    placeholder="Add additional observations..."
                  />
                </label>
              </div>

              {patientReports.length > 0 && (
                <div className="rounded border border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100 p-1.5 sm:p-2 shadow-sm transition-all duration-300">
                  <h4 className="text-[8px] sm:text-[9px] font-bold text-gray-800 dark:text-gray-900 mb-1.5 flex items-center gap-1 uppercase tracking-wider">
                    <ClipboardList className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-600 dark:text-gray-700" />
                    Previous Reports ({patientReports.length})
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {patientReports.map((report, idx) => (
                      <div
                        key={`${report.appointmentId}-${idx}`}
                        className="rounded border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-50 p-1.5 shadow-sm hover:shadow transition-all duration-200"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="font-semibold text-[8px] sm:text-[9px] text-gray-700 dark:text-gray-900">
                            {new Date(report.updatedAt).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {report.doctorName && (
                              <span className="text-[7px] sm:text-[8px] text-gray-600 dark:text-gray-700 px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded">Dr. {report.doctorName}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteReport(report.reportId)}
                              className="rounded border border-red-300 dark:border-red-400 p-0.5 text-red-600 dark:text-red-700 hover:bg-red-50 dark:hover:bg-red-100 transition-all duration-200"
                              title="Delete report"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[8px] sm:text-[9px] text-gray-600 dark:text-gray-700">
                          <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded font-medium">Temp: {report.temperatureCelsius}°C</span>
                          <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded font-medium">Pulse: {report.pulseBpm} BPM</span>
                          <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded font-medium">BP: {report.systolicBp}/{report.diastolicBp}</span>
                          {report.weightKg && <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded font-medium">Wt: {report.weightKg}kg</span>}
                          {report.heightCm && <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded font-medium">Ht: {report.heightCm}cm</span>}
                          {report.waistCm && <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-200 rounded font-medium">Waist: {report.waistCm}cm</span>}
                        </div>
                        {(report.sugar || report.urinalysis || report.otherDetails) && (
                          <div className="mt-1 space-y-0.5 text-gray-600 dark:text-gray-700 text-[8px] sm:text-[9px] border-t border-gray-200 dark:border-gray-300 pt-1">
                            {report.sugar && <p className="font-medium">Sugar: <span className="font-normal">{report.sugar}</span></p>}
                            {report.urinalysis && <p className="font-medium">Urinalysis: <span className="font-normal">{report.urinalysis}</span></p>}
                            {report.otherDetails && <p className="font-medium">Notes: <span className="font-normal">{report.otherDetails}</span></p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 left-0 right-0 z-30 pt-1.5 pb-1.5 px-2 border-t border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-50 shadow-[0_-1px_2px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_2px_-1px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="px-2 py-1 border border-gray-300 dark:border-gray-400 rounded text-[9px] sm:text-[10px] font-medium text-gray-700 dark:text-gray-900 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 transition-all duration-200"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded bg-gray-800 dark:bg-gray-700 text-[9px] sm:text-[10px] font-semibold text-white transition-all duration-200 hover:bg-gray-900 dark:hover:bg-gray-800 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Heart className="w-2.5 h-2.5" />
                        Save Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentReportModal;


