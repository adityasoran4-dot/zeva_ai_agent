"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { X, Upload, CheckCircle, AlertCircle, Loader2, Download, Info, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { ModalPortal } from "../lib/modalPortal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: (importedDates?: string[]) => void;
  doctorStaff: Array<{ _id: string; name: string; email?: string }>;
  rooms: Array<{ _id: string; name: string }>;
  getAuthHeaders: () => Record<string, string>;
}

interface ColumnMapping {
  [key: string]: string; // Excel column name -> Our field name
}

interface PreviewAppointment {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientGender?: string;
  doctorName: string;
  roomName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  followType: string;
  notes?: string;
  [key: string]: any;
}

// Required fields for appointment import
const REQUIRED_FIELDS = [
  { id: "patientName", label: "Patient Name", required: true, description: "Full name of the patient" },
  { id: "patientPhone", label: "Patient Phone", required: true, description: "Contact number (10 digits minimum)" },
  { id: "doctorName", label: "Doctor Name", required: true, description: "Must match an existing doctor in the system" },
  { id: "roomName", label: "Room Name", required: true, description: "Must match an existing room in the system" },
  { id: "appointmentDate", label: "Appointment Date", required: true, description: "Format: YYYY-MM-DD or DD/MM/YYYY" },
  { id: "startTime", label: "Start Time", required: true, description: "Format: HH:MM (24-hour) or HH:MM AM/PM" },
  { id: "endTime", label: "End Time", required: true, description: "Format: HH:MM (24-hour) or HH:MM AM/PM" },
];

const OPTIONAL_FIELDS = [
  { id: "patientEmail", label: "Patient Email", required: false, description: "Email address (optional)" },
  { id: "patientGender", label: "Patient Gender", required: false, description: "Male, Female, or Other" },
  { id: "status", label: "Status", required: false, description: "booked, enquiry, Arrived, Consultation, etc." },
  { id: "followType", label: "Follow Type", required: false, description: "first time, follow up, or repeat" },
  { id: "notes", label: "Notes", required: false, description: "Additional notes about the appointment" },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

export default function ImportAppointmentsModal({
  isOpen,
  onClose,
  onImported,
  doctorStaff,
  rooms,
  getAuthHeaders,
}: Props) {
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<PreviewAppointment[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    errors: [] as string[],
  });

  // Validation state
  const [validationStats, setValidationStats] = useState({
    validRows: 0,
    invalidRows: 0,
    missingRequired: 0,
    invalidDoctor: 0,
    invalidRoom: 0,
    invalidDate: 0,
    invalidTime: 0,
    overlapping: 0,
  });


  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  // Auto-map columns based on similarity
  useEffect(() => {
    if (step === "map" && availableColumns.length > 0 && Object.keys(columnMapping).length === 0) {
      autoMapColumns();
    }
  }, [step, availableColumns]);

  // Update preview when mapping changes
  useEffect(() => {
    if (step === "map" && rawData.length > 0) {
      generatePreview();
      updateValidationStats();
    }
  }, [columnMapping, step, doctorStaff, rooms]);

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setRawData([]);
    setPreviewData([]);
    setColumnMapping({});
    setAvailableColumns([]);
    setImportStats({ total: 0, success: 0, failed: 0, errors: [] });
    setValidationStats({
      validRows: 0,
      invalidRows: 0,
      missingRequired: 0,
      invalidDoctor: 0,
      invalidRoom: 0,
      invalidDate: 0,
      invalidTime: 0,
      overlapping: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const autoMapColumns = () => {
    const mapping: ColumnMapping = {};

    ALL_FIELDS.forEach((field) => {
      const fieldLower = field.label.toLowerCase();
      // Try exact match first
      const exactMatch = availableColumns.find(
        (col) => col.toLowerCase().trim() === fieldLower
      );
      if (exactMatch) {
        mapping[exactMatch] = field.id;
        return;
      }

      // Try partial match
      const partialMatch = availableColumns.find((col) => {
        const colLower = col.toLowerCase().trim();
        return (
          colLower.includes(fieldLower) ||
          fieldLower.includes(colLower) ||
          colLower.replace(/\s+/g, "") === fieldLower.replace(/\s+/g, "")
        );
      });
      if (partialMatch && !Object.values(mapping).includes(field.id)) {
        mapping[partialMatch] = field.id;
      }
    });

    setColumnMapping(mapping);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Check file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (uploadedFile.size > MAX_FILE_SIZE) {
      toast.error(
        `File size too large. Maximum allowed size is 5MB. Your file is ${(
          uploadedFile.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check file extension
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExt = uploadedFile.name
      .toLowerCase()
      .substring(uploadedFile.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExt)) {
      toast.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      let data: any[] = [];

      if (fileExt === ".csv") {
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            data = results.data as any[];
            processFileData(data);
          },
          error: (error) => {
            toast.error(`Error parsing CSV: ${error.message}`);
            setLoading(false);
          },
        });
      } else {
        // Excel file
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
        processFileData(data);
      }
    } catch (error: any) {
      toast.error(`Error reading file: ${error.message}`);
      setLoading(false);
    }
  };

  const processFileData = (data: any[]) => {
    if (data.length === 0) {
      toast.error("File is empty or has no data");
      setLoading(false);
      return;
    }

    setRawData(data);
    setAvailableColumns(Object.keys(data[0]));
    setStep("map");
    setLoading(false);
    toast.success(`File loaded successfully. Found ${data.length} rows.`);
  };

  const generatePreview = () => {
    if (rawData.length === 0) return;

    const preview: PreviewAppointment[] = [];
    const doctorMap: Record<string, string> = {};
    const roomMap: Record<string, string> = {};

    // Build doctor and room name maps
    doctorStaff.forEach((doc) => {
      doctorMap[doc.name.toLowerCase()] = doc._id;
    });
    rooms.forEach((room) => {
      roomMap[room.name.toLowerCase()] = room._id;
    });

    rawData.slice(0, 10).forEach((row) => {
      const mapped: any = {};
      Object.entries(columnMapping).forEach(([excelCol, ourField]) => {
        mapped[ourField] = row[excelCol];
      });

      // Try to find doctor by name
      if (mapped.doctorName) {
        const doctorId = doctorMap[mapped.doctorName.toLowerCase()];
        if (doctorId) {
          mapped.doctorId = doctorId;
        }
      }

      // Try to find room by name
      if (mapped.roomName) {
        const roomId = roomMap[mapped.roomName.toLowerCase()];
        if (roomId) {
          mapped.roomId = roomId;
        }
      }

      preview.push(mapped as PreviewAppointment);
    });

    setPreviewData(preview);
  };

  const updateValidationStats = () => {
    if (rawData.length === 0) return;

    const stats = {
      validRows: 0,
      invalidRows: 0,
      missingRequired: 0,
      invalidDoctor: 0,
      invalidRoom: 0,
      invalidDate: 0,
      invalidTime: 0,
      overlapping: 0,
    };

    const doctorMap: Record<string, string> = {};
    const roomMap: Record<string, string> = {};

    doctorStaff.forEach((doc) => {
      doctorMap[doc.name.toLowerCase()] = doc._id;
    });
    rooms.forEach((room) => {
      roomMap[room.name.toLowerCase()] = room._id;
    });

    rawData.forEach((row) => {
      const mapped: any = {};
      Object.entries(columnMapping).forEach(([excelCol, ourField]) => {
        mapped[ourField] = row[excelCol];
      });

      let isValid = true;
      let hasMissingRequired = false;
      let hasInvalidDoctor = false;
      let hasInvalidRoom = false;
      let hasInvalidDate = false;
      let hasInvalidTime = false;

      // Check required fields
      REQUIRED_FIELDS.forEach((field) => {
        if (!mapped[field.id] || String(mapped[field.id]).trim() === "") {
          hasMissingRequired = true;
          isValid = false;
        }
      });

      // Validate doctor
      if (mapped.doctorName) {
        const doctorId = doctorMap[String(mapped.doctorName).toLowerCase()];
        if (!doctorId) {
          hasInvalidDoctor = true;
          isValid = false;
        }
      }

      // Validate room
      if (mapped.roomName) {
        const roomId = roomMap[String(mapped.roomName).toLowerCase()];
        if (!roomId) {
          hasInvalidRoom = true;
          isValid = false;
        }
      }

      // Validate date
      if (mapped.appointmentDate) {
        const dateStr = String(mapped.appointmentDate);
        const date = parseDate(dateStr);
        if (!date || isNaN(date.getTime())) {
          hasInvalidDate = true;
          isValid = false;
        }
      }

      // Validate time
      if (mapped.startTime && mapped.endTime) {
        const startTime = parseTime(String(mapped.startTime));
        const endTime = parseTime(String(mapped.endTime));
        if (!startTime || !endTime || startTime >= endTime) {
          hasInvalidTime = true;
          isValid = false;
        }
      }

      if (isValid) {
        stats.validRows++;
      } else {
        stats.invalidRows++;
        if (hasMissingRequired) stats.missingRequired++;
        if (hasInvalidDoctor) stats.invalidDoctor++;
        if (hasInvalidRoom) stats.invalidRoom++;
        if (hasInvalidDate) stats.invalidDate++;
        if (hasInvalidTime) stats.invalidTime++;
      }
    });

    setValidationStats(stats);
  };

  const parseDate = (dateStr: string): Date | null => {
    // Try various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    ];

    for (const format of formats) {
      if (format.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try direct parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  };

  const parseTime = (timeStr: string): string | null => {
    // Remove whitespace
    timeStr = timeStr.trim();

    // Try 24-hour format (HH:MM)
    const time24Match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (time24Match) {
      const hours = parseInt(time24Match[1]);
      const minutes = parseInt(time24Match[2]);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }
    }

    // Try 12-hour format (HH:MM AM/PM)
    const time12Match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (time12Match) {
      let hours = parseInt(time12Match[1]);
      const minutes = parseInt(time12Match[2]);
      const period = time12Match[3].toUpperCase();

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
      }
    }

    return null;
  };

  const validateMapping = (): boolean => {
    // Check if all required fields are mapped
    const mappedFields = Object.values(columnMapping);
    const requiredFieldIds = REQUIRED_FIELDS.map((f) => f.id);

    for (const requiredId of requiredFieldIds) {
      if (!mappedFields.includes(requiredId)) {
        toast.error(`Please map the "${REQUIRED_FIELDS.find((f) => f.id === requiredId)?.label}" field`);
        return false;
      }
    }

    return true;
  };

  const handleImport = async () => {
    if (!validateMapping()) return;

    setImporting(true);
    setStep("importing");

    try {
      const formData = new FormData();
      formData.append("file", file!);
      formData.append("columnMapping", JSON.stringify(columnMapping));

      const response = await axios.post("/api/clinic/import-appointments", formData, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      const { data: result } = response;

      setImportStats({
        total: result.data?.total || rawData.length,
        success: result.data?.imported || 0,
        failed: result.data?.failed || 0,
        errors: result.data?.errors || [],
      });

      const importedDates = result.data?.importedDates || [];
      
      if (result.data?.failed === 0) {
        if (importedDates.length > 0) {
          const datesStr = importedDates.length === 1 
            ? new Date(importedDates[0]).toLocaleDateString()
            : `${importedDates.length} different dates`;
          toast.success(
            `Successfully imported ${result.data?.imported || 0} appointments for ${datesStr}!`,
            { duration: 4000 }
          );
        } else {
          toast.success(`Successfully imported ${result.data?.imported || 0} appointments!`);
        }
        setTimeout(() => {
          onImported(importedDates);
          onClose();
        }, 2000);
      } else {
        // Show detailed error message
        const errorCount = result.data?.failed || 0;
        const successCount = result.data?.imported || 0;
        
        let errorMsg = `Imported ${successCount} appointments. ${errorCount} failed.`;
        if (importedDates.length > 0) {
          const datesStr = importedDates.length === 1 
            ? new Date(importedDates[0]).toLocaleDateString()
            : `${importedDates.length} different dates`;
          errorMsg += ` Appointments are for ${datesStr}.`;
        }
        
        // Show summary toast
        toast.error(errorMsg, { duration: 6000 });
        
        // Keep modal open to show errors
        setStep("importing");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to import appointments";
      toast.error(errorMsg);
      setImportStats({
        total: rawData.length,
        success: 0,
        failed: rawData.length,
        errors: [errorMsg],
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = ALL_FIELDS.map((f) => f.label);
    const sampleRow = [
      "John Doe",
      "1234567890",
      "john@example.com",
      "Male",
      "Dr. Smith",
      "Room 1",
      "2024-01-15",
      "09:00",
      "09:30",
      "booked",
      "first time",
      "Initial consultation",
    ];

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "appointment_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Appointments</h2>
            <p className="text-sm text-gray-600 mt-1">Upload and import appointment data from CSV or Excel</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "upload" && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Required Information</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Patient Name and Phone (required)</li>
                      <li>Doctor Name (must match existing doctor)</li>
                      <li>Room Name (must match existing room)</li>
                      <li>Appointment Date (YYYY-MM-DD or DD/MM/YYYY)</li>
                      <li>Start Time and End Time (HH:MM format)</li>
                    </ul>
                    <button
                      onClick={downloadTemplate}
                      className="mt-3 inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download CSV Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      CSV or Excel files (Max 5MB)
                    </p>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">File selected</span>
                    </div>
                  )}
                </label>
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing file...</span>
                </div>
              )}
            </div>
          )}

          {step === "map" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Map Columns</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Match your file columns to the appointment fields
                  </p>
                </div>
                <button
                  onClick={() => setStep("upload")}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>

              {/* Column Mapping */}
              <div className="space-y-4">
                {ALL_FIELDS.map((field) => (
                  <div
                    key={field.id}
                    className={`p-4 rounded-lg border ${
                      field.required
                        ? "border-blue-200 bg-blue-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="font-semibold text-gray-900">
                            {field.label}
                          </label>
                          {field.required && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                      </div>
                      <select
                        value={Object.keys(columnMapping).find((k) => columnMapping[k] === field.id) || ""}
                        onChange={(e) => {
                          const newMapping = { ...columnMapping };
                          // Remove old mapping for this field
                          Object.keys(newMapping).forEach((key) => {
                            if (newMapping[key] === field.id) {
                              delete newMapping[key];
                            }
                          });
                          // Add new mapping
                          if (e.target.value) {
                            newMapping[e.target.value] = field.id;
                          }
                          setColumnMapping(newMapping);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Select Column --</option>
                        {availableColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Validation Stats */}
              {rawData.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Validation Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Rows</p>
                      <p className="text-lg font-bold text-gray-900">{rawData.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Valid</p>
                      <p className="text-lg font-bold text-green-600">{validationStats.validRows}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Invalid</p>
                      <p className="text-lg font-bold text-red-600">{validationStats.invalidRows}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Success Rate</p>
                      <p className="text-lg font-bold text-blue-600">
                        {rawData.length > 0
                          ? Math.round((validationStats.validRows / rawData.length) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                  {validationStats.invalidRows > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Issues Found:</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        {validationStats.missingRequired > 0 && (
                          <p>• {validationStats.missingRequired} rows missing required fields</p>
                        )}
                        {validationStats.invalidDoctor > 0 && (
                          <p>• {validationStats.invalidDoctor} rows with invalid doctor names</p>
                        )}
                        {validationStats.invalidRoom > 0 && (
                          <p>• {validationStats.invalidRoom} rows with invalid room names</p>
                        )}
                        {validationStats.invalidDate > 0 && (
                          <p>• {validationStats.invalidDate} rows with invalid dates</p>
                        )}
                        {validationStats.invalidTime > 0 && (
                          <p>• {validationStats.invalidTime} rows with invalid times</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
              {previewData.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Preview (First 10 Rows)</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Patient
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Doctor
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Room
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Date
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Time
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-900">
                                  {row.patientName || "-"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {row.patientPhone || "-"}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {row.doctorName || "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {row.roomName || "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {row.appointmentDate || "-"}
                              </td>
                              <td className="px-3 py-2 text-gray-700">
                                {row.startTime && row.endTime
                                  ? `${row.startTime} - ${row.endTime}`
                                  : "-"}
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  {row.status || "booked"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-lg font-semibold text-gray-900">Importing Appointments...</p>
              <p className="text-sm text-gray-600 mt-2">Please wait while we process your data</p>
              {importStats.total > 0 && (
                <div className="mt-6 w-full max-w-md">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {importStats.success + importStats.failed} / {importStats.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (importStats.success + importStats.failed) / importStats.total * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
              {importStats.errors.length > 0 && (
                <div className="mt-6 w-full max-w-2xl">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Import Errors ({importStats.errors.length})
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {importStats.errors.map((error, idx) => (
                        <div key={idx} className="text-sm text-red-800 bg-white rounded p-2 border border-red-100">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {step === "map" && (
              <span>
                {validationStats.validRows} of {rawData.length} rows ready to import
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {step === "map" && (
              <button
                onClick={handleImport}
                disabled={validationStats.validRows === 0 || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {validationStats.validRows} Appointments
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
            {step === "importing" && importStats.errors.length > 0 && (
              <button
                onClick={() => {
                  if (importStats.success > 0) {
                    onImported();
                  }
                  onClose();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                {importStats.success > 0 ? "Close & Refresh" : "Close"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}

