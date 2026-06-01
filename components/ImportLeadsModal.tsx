import { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import CustomAsyncSelect, { OptionType } from "./shared/CustomAsyncSelect";
import { loadSegmentOptions } from "@/lib/helper";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  token: string;
}

interface ColumnMapping {
  [key: string]: string; // Excel column name -> Our field name
}

interface PreviewLead {
  name: string;
  phone: string;
  gender: string;
  age: string;
  followUpDate?: string;
  [key: string]: any;
}

export default function ImportLeadsModal({
  isOpen,
  onClose,
  onImported,
  token,
}: Props) {
  const [step, setStep] = useState<"upload" | "map" | "additional">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<PreviewLead[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
  });

  // Additional fields state
  const [treatments, setTreatments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [activeOffers, setActiveOffers] = useState<any[]>([]);
  const [additionalData, setAdditionalData] = useState({
    treatments: [] as Array<{ treatment: string; subTreatment: string | null }>,
    source: "Instagram",
    offerTag: "",
    status: "New",
    notes: [] as Array<{ text: string }>,
    customSource: "",
    customStatus: "",
    followUps: [] as Array<{ date: string }>,
    assignedTo: [] as string[],
  });
  const [noteType, setNoteType] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<OptionType | null>(
    null
  );

  // Validation state
  const [validationStats, setValidationStats] = useState({
    validRows: 0,
    invalidRows: 0,
    missingName: 0,
    missingPhone: 0,
    invalidGender: 0,
    invalidFollowUpDate: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mappable fields including followUpDate
  const mappableFields = [
    { id: "name", label: "Name", required: true },
    { id: "phone", label: "Phone", required: true },
    { id: "email", label: "Email", required: true },
    { id: "gender", label: "Gender", required: false },
    { id: "age", label: "Age", required: false },
    { id: "followUpDate", label: "Follow-up Date", required: false },
  ];

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === "additional") {
      fetchAdditionalData();
    }
  }, [isOpen, step, token]);

  // Update preview when mapping changes
  useEffect(() => {
    if (step === "map" && rawData.length > 0) {
      generatePreview();
      updateValidationStats();
    }
  }, [columnMapping, step]);

  const fetchAdditionalData = async () => {
    try {
      const [treatmentsRes, agentsRes, offersRes] = await Promise.all([
        axios.get("/api/lead-ms/get-clinic-treatment", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/lead-ms/assign-lead", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/lead-ms/get-create-offer", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setTreatments(
        Array.isArray(treatmentsRes.data?.treatments)
          ? treatmentsRes.data.treatments
          : []
      );
      setAgents(agentsRes.data?.users || []);
      const list = Array.isArray(offersRes.data?.offers)
        ? offersRes.data.offers
        : [];
      setActiveOffers(list.filter((o: any) => o.status === "active"));
    } catch (err) {
      console.error("Error fetching additional data:", err);
    }
  };

  const resetModal = () => {
    setStep("upload");
    setFile(null);
    setRawData([]);
    setPreviewData([]);
    setColumnMapping({});
    setAvailableColumns([]);
    setImportStats({ total: 0, success: 0, failed: 0 });
    setValidationStats({
      validRows: 0,
      invalidRows: 0,
      missingName: 0,
      missingPhone: 0,
      invalidGender: 0,
      invalidFollowUpDate: 0,
    });
    setAdditionalData({
      treatments: [],
      source: "Instagram",
      offerTag: "",
      status: "New",
      notes: [],
      customSource: "",
      customStatus: "",
      followUps: [],
      assignedTo: [],
    });
    setNoteType("");
    setCustomNote("");
    setFollowUpDate("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // ✅ Check file size (max 5MB = 5 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (uploadedFile.size > MAX_FILE_SIZE) {
      alert(
        `File size too large. Maximum allowed size is 5MB. Your file is ${(
          uploadedFile.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`
      );
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // ✅ Check file extension
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const fileExt = uploadedFile.name
      .toLowerCase()
      .substring(uploadedFile.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExt)) {
      alert("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFile(uploadedFile);
    setLoading(true);

    try {
      if (
        uploadedFile.name.endsWith(".xlsx") ||
        uploadedFile.name.endsWith(".xls")
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const workbook = XLSX.read(event.target?.result, {
              type: "binary",
            });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            let data: any[] = [];
            if (jsonData.length > 0) {
              const headers = jsonData[0] as string[];
              const rows = jsonData.slice(1);

              data = rows
                .map((row: any) => {
                  const obj: any = {};
                  headers.forEach((header, index) => {
                    if (header && row[index] !== undefined) {
                      obj[header] = row[index];
                    }
                  });
                  return obj;
                })
                .filter((row) => Object.keys(row).length > 0);
            }

            processUploadedData(data, uploadedFile.name);
          } catch (error) {
            console.error("Error parsing Excel:", error);
            alert("Error parsing Excel file. Please check the format.");
            setLoading(false);
          }
        };
        reader.readAsBinaryString(uploadedFile);
      } else if (uploadedFile.name.endsWith(".csv")) {
        Papa.parse(uploadedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            processUploadedData(results.data, uploadedFile.name);
          },
          error: (error) => {
            console.error("Error parsing CSV:", error);
            alert("Error parsing CSV file. Please check the format.");
            setLoading(false);
          },
        });
      } else {
        alert("Please upload a CSV or Excel file.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error processing file. Please try again.");
      setLoading(false);
    }
  };

  const processUploadedData = (data: any[], _fileName: string) => {
    if (!data || data.length === 0) {
      alert("No data found in the file.");
      setLoading(false);
      return;
    }

    const columns = Object.keys(data[0]).filter(
      (col) => col && col.trim() !== ""
    );

    if (columns.length === 0) {
      alert("No valid columns found in the file.");
      setLoading(false);
      return;
    }

    setRawData(data);
    setAvailableColumns(columns);

    // Auto-detect common column names including follow-up date
    const autoMapping: ColumnMapping = {};
    columns.forEach((col) => {
      const colLower = col.toLowerCase().trim();

      if (
        colLower.includes("name") ||
        colLower.includes("fullname") ||
        colLower.includes("full name")
      ) {
        autoMapping[col] = "name";
      } else if (
        colLower.includes("phone") ||
        colLower.includes("mobile") ||
        colLower.includes("contact")
      ) {
        autoMapping[col] = "phone";
      } else if (colLower.includes("gender") || colLower.includes("sex")) {
        autoMapping[col] = "gender";
      } else if (colLower.includes("age") || colLower.includes("year")) {
        autoMapping[col] = "age";
      } else if (
        colLower.includes("follow") ||
        colLower.includes("followup") ||
        colLower.includes("follow-up") ||
        colLower.includes("date") ||
        colLower.includes("followup_date") ||
        colLower.includes("next_followup")
      ) {
        autoMapping[col] = "followUpDate";
      }
    });

    setColumnMapping(autoMapping);
    setLoading(false);
    setStep("map");
  };

  const handleMappingChange = (excelColumn: string, ourField: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };

      // Remove any existing mapping for this ourField
      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key] === ourField) {
          delete newMapping[key];
        }
      });

      if (ourField) {
        newMapping[excelColumn] = ourField;
      } else {
        delete newMapping[excelColumn];
      }

      return newMapping;
    });
  };

  const generatePreview = () => {
    if (rawData.length === 0) return;

    const preview = rawData.slice(0, 5).map((row) => {
      const previewRow: PreviewLead = {
        name: "",
        phone: "",
        gender: "Male", // Default
        age: "",
      };

      // Apply mappings
      Object.entries(columnMapping).forEach(([excelCol, ourField]) => {
        if (row[excelCol] !== undefined && row[excelCol] !== null) {
          const value = String(row[excelCol]).trim();

          if (ourField === "followUpDate") {
            // Try to parse date
            const date = parseDate(value);
            previewRow[ourField] = date
              ? date.toISOString().slice(0, 16)
              : value;
          } else {
            previewRow[ourField as keyof PreviewLead] = value;
          }
        }
      });

      // Keep unmapped columns for display
      Object.keys(row).forEach((col) => {
        if (!columnMapping[col] && row[col] !== undefined) {
          previewRow[col] = String(row[col]).trim();
        }
      });

      return previewRow;
    });

    setPreviewData(preview);
  };

  const updateValidationStats = () => {
    if (rawData.length === 0) return;

    let validRows = 0;
    let invalidRows = 0;
    let missingName = 0;
    let missingPhone = 0;
    let invalidGender = 0;
    let invalidFollowUpDate = 0;

    rawData.forEach((row) => {
      const nameCol = Object.entries(columnMapping).find(
        ([_, field]) => field === "name"
      )?.[0];
      const phoneCol = Object.entries(columnMapping).find(
        ([_, field]) => field === "phone"
      )?.[0];
      const genderCol = Object.entries(columnMapping).find(
        ([_, field]) => field === "gender"
      )?.[0];
      const followUpCol = Object.entries(columnMapping).find(
        ([_, field]) => field === "followUpDate"
      )?.[0];

      const hasName = nameCol && row[nameCol] && String(row[nameCol]).trim();
      const hasPhone =
        phoneCol && row[phoneCol] && String(row[phoneCol]).trim();

      if (!hasName) missingName++;
      if (!hasPhone) missingPhone++;

      // Validate gender
      if (genderCol && row[genderCol]) {
        const gender = String(row[genderCol]).trim().toLowerCase();
        if (!["male", "female", "other"].includes(gender)) {
          invalidGender++;
        }
      }

      // Validate follow-up date
      if (followUpCol && row[followUpCol]) {
        const dateStr = String(row[followUpCol]).trim();
        const date = parseDate(dateStr);
        if (!date) {
          invalidFollowUpDate++;
        }
      }

      if (hasName && hasPhone) {
        validRows++;
      } else {
        invalidRows++;
      }
    });

    setValidationStats({
      validRows,
      invalidRows,
      missingName,
      missingPhone,
      invalidGender,
      invalidFollowUpDate,
    });
  };

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Try different date formats
    const formats = [
      // ISO format
      () => new Date(dateStr),
      // DD/MM/YYYY
      () => {
        const parts = dateStr.split(/[/-]/);
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        }
        return null;
      },
      // MM/DD/YYYY
      () => {
        const parts = dateStr.split(/[/-]/);
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1;
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          return new Date(year, month, day);
        }
        return null;
      },
      // Timestamp
      () => {
        const timestamp = parseInt(dateStr);
        if (!isNaN(timestamp)) {
          return new Date(timestamp);
        }
        return null;
      },
    ];

    for (const format of formats) {
      try {
        const date = format();
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // Continue to next format
      }
    }

    return null;
  };

  const validateMapping = () => {
    const requiredMappings = mappableFields.filter((f) => f.required);
    const missing = requiredMappings.filter(
      (f) => !Object.values(columnMapping).includes(f.id)
    );

    if (missing.length > 0) {
      alert(
        `Please map the following required fields: ${missing
          .map((m) => m.label)
          .join(", ")}`
      );
      return false;
    }

    return true;
  };

  // Additional fields handlers
  const handleAdditionalChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setAdditionalData({ ...additionalData, [e.target.name]: e.target.value });
  };

  const handleTreatmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes("::")) {
      const [mainName, subName] = value.split("::");
      setAdditionalData((prev) => {
        const exists = prev.treatments.some(
          (t) => t.treatment === mainName && t.subTreatment === subName
        );
        return {
          ...prev,
          treatments: exists
            ? prev.treatments.filter(
                (t) => !(t.treatment === mainName && t.subTreatment === subName)
              )
            : [
                ...prev.treatments,
                { treatment: mainName, subTreatment: subName },
              ],
        };
      });
      return;
    }
    const mainName = value;
    setAdditionalData((prev) => {
      const exists = prev.treatments.some(
        (t) => t.treatment === mainName && !t.subTreatment
      );
      return {
        ...prev,
        treatments: exists
          ? prev.treatments.filter(
              (t) => !(t.treatment === mainName && !t.subTreatment)
            )
          : [...prev.treatments, { treatment: mainName, subTreatment: null }],
      };
    });
  };

  const handleImport = async () => {
    if (!validateMapping()) return;

    setImporting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file!);

      // Add additional data as JSON string
      const additionalDataToSend = {
        treatments: additionalData.treatments,
        source:
          additionalData.source === "Other"
            ? additionalData.customSource
            : additionalData.source,
        customSource: additionalData.customSource || "",
        offerTag: additionalData.offerTag || "",
        status:
          additionalData.status === "Other"
            ? additionalData.customStatus
            : additionalData.status,
        customStatus: additionalData.customStatus || "",
        note: noteType === "Custom" ? customNote.trim() : noteType,
        followUpDate: followUpDate || "",
        assignedTo: additionalData.assignedTo,
        columnMapping: columnMapping, // Send mapping to API
        segmentId: selectedSegment?.value,
      };

      formData.append("data", JSON.stringify(additionalDataToSend));

      // Single API call with file
      const response = await axios.post("/api/lead-ms/import-leads", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const { data: result } = response;

      setImportStats({
        total: result.data?.total || rawData.length,
        success: result.data?.imported || 0,
        failed: result.data?.failed || 0,
      });

      if (result.data?.failed === 0) {
        alert(
          `${result.data?.total} leads uploaded successfully.\n` +
            `The import process has started and may take a few minutes for large files.`
        );
        onImported();
        onClose();
      } else {
        alert(
          `${result.data?.total} leads uploaded.\n` +
            `${result.data?.failed} rows could not be processed.\n` +
            `The remaining leads are now being imported in the background.`
        );
      }
    } catch (error: any) {
      console.error("Error importing leads:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Error importing leads. Please check the data format.";
      alert(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    try {
      const date = parseDate(dateStr);
      if (date) {
        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Compact Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Import Leads from File
            </h2>
            <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
              {step === "upload" && "Upload CSV or Excel file"}
              {step === "map" && "Map columns to lead fields"}
              {step === "additional" &&
                "Set additional information for all leads"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            disabled={importing}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex border-b border-gray-200">
          {["upload", "map", "additional"].map((s, index) => (
            <button
              key={s}
              className={`flex-1 py-3 text-xs sm:text-sm font-medium transition-colors ${
                step === s
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                if (index < ["upload", "map", "additional"].indexOf(step)) {
                  setStep(s as any);
                }
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    step === s
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="hidden sm:inline">
                  {s === "upload" && "Upload File"}
                  {s === "map" && "Map Columns"}
                  {s === "additional" && "Additional Info"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Step 1: Upload */}
            {step === "upload" && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Upload Leads File
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                    Upload a CSV or Excel file containing lead information. Only
                    Name, Phone, Gender, Age, and Follow-up Date will be
                    imported from the file.
                  </p>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-md mx-auto bg-gray-50 hover:bg-gray-100 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="mb-3">
                        <svg
                          className="w-10 h-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 font-medium mb-1">
                        {file ? file.name : "Choose a file"}
                      </span>
                      <span className="text-gray-500 text-sm">
                        or drag and drop here
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 px-6 py-2 w-full cursor-pointer bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
                    >
                      Browse Files
                    </button>
                  </div>

                  {file && (
                    <div className="mt-6 max-w-md mx-auto">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-blue-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-sm text-blue-800">
                            File selected: {file.name} (
                            {Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="mt-2 text-red-600 text-sm hover:text-red-800"
                        >
                          Remove file
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 text-left max-w-md mx-auto">
                    <h4 className="font-bold text-gray-900 mb-2">
                      File Requirements:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>
                          File must contain at least <strong>Name</strong> and{" "}
                          <strong>Phone</strong> columns
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>
                          Gender should be Male/Female/Other (case-insensitive)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>
                          Follow-up date should be in valid date format
                          (DD/MM/YYYY, MM/DD/YYYY, or ISO)
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Maximum file size: 5 MB</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>First row should contain column headers</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Map Columns */}
            {step === "map" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-bold text-blue-800 mb-1">
                        Map Your Columns
                      </h4>
                      <p className="text-blue-700 text-sm">
                        Match the columns from your file to the lead fields.
                        <strong className="text-red-600">
                          {" "}
                          Name and Phone are required.
                        </strong>
                        You'll set additional information in the next step.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Validation Badges */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      validationStats.validRows > 0
                        ? "bg-green-50 border border-green-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900">
                      {validationStats.validRows}
                    </div>
                    <div className="text-xs text-gray-600">Valid Rows</div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      validationStats.missingName > 0
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900">
                      {validationStats.missingName}
                    </div>
                    <div className="text-xs text-gray-600">Missing Name</div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      validationStats.missingPhone > 0
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900">
                      {validationStats.missingPhone}
                    </div>
                    <div className="text-xs text-gray-600">Missing Phone</div>
                  </div>
                  {validationStats.invalidGender > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-lg font-bold text-gray-900">
                        {validationStats.invalidGender}
                      </div>
                      <div className="text-xs text-gray-600">
                        Invalid Gender
                      </div>
                    </div>
                  )}
                  {validationStats.invalidFollowUpDate > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="text-lg font-bold text-gray-900">
                        {validationStats.invalidFollowUpDate}
                      </div>
                      <div className="text-xs text-gray-600">Invalid Dates</div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700">
                          Excel Column
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700">
                          Map to Lead Field
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700">
                          Sample Data
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableColumns.map((column, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="border border-gray-200 px-3 py-2 text-sm">
                            <span className="font-medium text-gray-900">
                              {column}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            <select
                              value={columnMapping[column] || ""}
                              onChange={(e) =>
                                handleMappingChange(column, e.target.value)
                              }
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                            >
                              <option value="">Don't import</option>
                              {mappableFields.map((field) => (
                                <option key={field.id} value={field.id}>
                                  {field.label}{" "}
                                  {field.required && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-sm text-gray-600">
                            {rawData[0]?.[column] ? (
                              columnMapping[column] === "followUpDate" ? (
                                <div>
                                  <div>
                                    {String(rawData[0][column]).substring(
                                      0,
                                      50
                                    )}
                                  </div>
                                  {parseDate(String(rawData[0][column])) && (
                                    <div className="text-green-600 text-xs mt-1">
                                      ✓ Valid date
                                    </div>
                                  )}
                                </div>
                              ) : (
                                String(rawData[0][column]).substring(0, 50)
                              )
                            ) : (
                              "No data"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-gray-900 mb-2">
                    Preview (First 5 rows)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          {mappableFields.map((field) => (
                            <th
                              key={field.id}
                              className="border border-gray-200 px-2 py-1 text-left text-xs font-medium text-gray-700"
                            >
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.length > 0 ? (
                          previewData.map((lead, index) => (
                            <tr
                              key={index}
                              className={
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              {mappableFields.map((field) => (
                                <td
                                  key={field.id}
                                  className="border border-gray-200 px-2 py-1 text-xs"
                                >
                                  {lead[field.id] ? (
                                    field.id === "followUpDate" ? (
                                      <div>
                                        <div>
                                          {formatDateForDisplay(
                                            lead[field?.id as string]
                                          )}
                                        </div>
                                        {parseDate(
                                          lead[field?.id as string]
                                        ) && (
                                          <div className="text-green-600 text-xs">
                                            ✓ Valid
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      lead[field.id]
                                    )
                                  ) : (
                                    <span className="text-gray-400 italic">
                                      Not mapped
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={mappableFields.length}
                              className="border border-gray-200 px-2 py-4 text-center text-sm text-gray-500"
                            >
                              Map columns to see preview
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    <span className="text-red-500">*</span> Required fields
                  </p>
                  <p className="mt-1">
                    Found {rawData.length} leads in the file.{" "}
                    {Object.values(columnMapping).filter((v) => v).length}{" "}
                    fields mapped.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Additional Information */}
            {step === "additional" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-bold text-green-800 mb-1">
                        Set Additional Information
                      </h4>
                      <p className="text-green-700 text-sm">
                        These settings will be applied to all {rawData.length}{" "}
                        leads. Review the basic information below.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Info Preview */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">
                    Basic Information (from file)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-2xl font-bold text-gray-900">
                        {rawData.length}
                      </div>
                      <div className="text-xs text-gray-600">Total Leads</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.values(columnMapping).filter((v) => v).length}
                      </div>
                      <div className="text-xs text-gray-600">Fields Mapped</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-2xl font-bold text-green-600">
                        {validationStats.validRows}
                      </div>
                      <div className="text-xs text-gray-600">Valid Leads</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded border">
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationStats.invalidFollowUpDate}
                      </div>
                      <div className="text-xs text-gray-600">Date Warnings</div>
                    </div>
                  </div>
                </div>

                {/* Treatments Section */}
                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                    Treatments
                  </h3>
                  <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50 max-h-56 overflow-y-auto">
                    {treatments.length === 0 ? (
                      <p className="text-gray-500 text-center py-2 text-xs sm:text-sm">
                        No treatments available
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {treatments.map((t: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white rounded-lg p-2.5 shadow-sm"
                          >
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={t.mainTreatment}
                                checked={additionalData.treatments.some(
                                  (tr) =>
                                    tr.treatment === t.mainTreatment &&
                                    !tr.subTreatment
                                )}
                                onChange={handleTreatmentChange}
                                className="w-3.5 h-3.5 text-gray-800 rounded focus:ring-gray-800"
                              />
                              <span className="font-medium text-gray-900 text-xs sm:text-sm">
                                {t.mainTreatment}
                              </span>
                            </label>
                            {t.subTreatments?.length > 0 && (
                              <div className="ml-5 mt-1.5 space-y-1">
                                {t.subTreatments.map((sub: any, j: number) => {
                                  const val = `${t.mainTreatment}::${sub.name}`;
                                  return (
                                    <label
                                      key={j}
                                      className="flex items-center space-x-2 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        value={val}
                                        checked={additionalData.treatments.some(
                                          (tr) =>
                                            tr.treatment === t.mainTreatment &&
                                            tr.subTreatment === sub.name
                                        )}
                                        onChange={handleTreatmentChange}
                                        className="w-3 h-3 text-gray-800 rounded focus:ring-gray-800"
                                      />
                                      <span className="text-[10px] sm:text-xs text-gray-600">
                                        {sub.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Lead Details Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                    Lead Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <select
                        name="source"
                        value={additionalData.source}
                        onChange={handleAdditionalChange}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Google">Google</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {additionalData.source === "Other" && (
                      <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                          Custom Source
                        </label>
                        <input
                          type="text"
                          name="customSource"
                          value={additionalData.customSource}
                          onChange={handleAdditionalChange}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                          placeholder="Enter source"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={additionalData.status}
                        onChange={handleAdditionalChange}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Booked">Booked</option>
                        <option value="Visited">Visited</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {additionalData.status === "Other" && (
                      <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                          Custom Status
                        </label>
                        <input
                          type="text"
                          name="customStatus"
                          value={additionalData.customStatus}
                          onChange={handleAdditionalChange}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                          placeholder="Enter status"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Offer Tag
                    </label>
                    <select
                      name="offerTag"
                      value={additionalData.offerTag}
                      onChange={handleAdditionalChange}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    >
                      <option value="">No offer</option>
                      {activeOffers.map((o) => (
                        <option key={o._id} value={o.title}>
                          {o.title} —{" "}
                          {o.type === "percentage"
                            ? `${o.value}%`
                            : `₹${o.value}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1.5">
                    Additional Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                        Note
                      </label>
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                      >
                        <option value="">Select Note</option>
                        <option value="Interested">Interested</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    {noteType === "Custom" && (
                      <div>
                        <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                          Custom Note
                        </label>
                        <input
                          type="text"
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                          placeholder="Type a note"
                        />
                      </div>
                    )}
                  </div>

                  {/* <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">Additional Follow-up Date</label>
                    <input
                      type="datetime-local"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    />
                  </div> */}

                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Assign To
                    </label>
                    <select
                      value={additionalData.assignedTo[0] || ""}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setAdditionalData((prev) => ({
                          ...prev,
                          assignedTo: selectedId ? [selectedId] : [],
                        }));
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all text-xs sm:text-sm"
                    >
                      <option value="">Select agent</option>
                      {agents.map((agent) => (
                        <option key={agent._id} value={agent._id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <CustomAsyncSelect
                    label="Segment"
                    name="chooseSegment"
                    loadOptions={(inputValue) =>
                      loadSegmentOptions(inputValue, token)
                    }
                    value={selectedSegment}
                    onChange={(value) => setSelectedSegment(value as any)}
                    placeholder="Select a segment..."
                  />
                </div>

                {/* Import Results (if any) */}
                {importStats.total > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-2">
                      Import Results
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white rounded border border-blue-200">
                        <div className="text-2xl font-bold text-green-600">
                          {importStats.success}
                        </div>
                        <div className="text-xs text-gray-600">
                          Successfully Imported
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded border border-blue-200">
                        <div className="text-2xl font-bold text-red-600">
                          {importStats.failed}
                        </div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gray-50 px-4 py-3 flex justify-between gap-2">
            <div>
              {step === "map" && (
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Back to Upload
                </button>
              )}
              {step === "additional" && (
                <button
                  type="button"
                  onClick={() => setStep("map")}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Back to Mapping
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                disabled={importing}
              >
                Cancel
              </button>

              {step === "upload" && (
                <button
                  type="button"
                  onClick={() => file && setStep("map")}
                  disabled={!file || loading}
                  className="px-4 py-2 rounded-lg cursor-pointer bg-gray-800 text-white text-xs sm:text-sm font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Processing..." : "Next: Map Columns"}
                </button>
              )}

              {step === "map" && (
                <button
                  type="button"
                  onClick={() => {
                    if (validateMapping()) {
                      setStep("additional");
                    }
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg cursor-pointer bg-gray-800 text-white text-xs sm:text-sm font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Next: Additional Info
                </button>
              )}

              {step === "additional" && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="px-4 py-2 rounded-lg cursor-pointer bg-green-600 text-white text-xs sm:text-sm font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                >
                  {importing
                    ? "Importing..."
                    : `Import ${rawData.length} Leads`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
