// pages/marketingalltype/sms-marketing.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import { TrendingUp, FileCheck, Wallet } from "lucide-react";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import DltVerificationPanel, { buildInitialDocState } from "../../components/DltVerificationPanel";
import SmsRoiPanel from "../../components/marketing/SmsRoiPanel";
import SmsTopupPanel from "../../components/marketing/SmsTopupPanel";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const ADD_METHODS = [
  { id: "manual", label: "Enter Manually" },
  { id: "csv", label: "CSV File Upload" },
];

const MESSAGE_MODES = [
  { id: "manual", label: "Enter Message Manually" },
  { id: "template", label: "Use SMS Template", disabled: false },
];

const SmsSender = () => {
  const [addMethod, setAddMethod] = useState("manual");
  const [messageMode, setMessageMode] = useState("manual");
  const [numbersInput, setNumbersInput] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [language, setLanguage] = useState("english");
  const [senderId, setSenderId] = useState("776500");
  const [shortUrlEnabled, setShortUrlEnabled] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [csvMeta, setCsvMeta] = useState({ fileName: "", rows: 0, error: "" });
  const [showRoiModal, setShowRoiModal] = useState(false);
  const [showDltModal, setShowDltModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [docUploads, setDocUploads] = useState(buildInitialDocState());
  const [authToken, setAuthToken] = useState("");
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);

  // Check if we're in clinic context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setIsClinicContext(path.startsWith("/clinic/") || path.startsWith("/marketingalltype/"));
    }
  }, []);

  // Fetch permissions for clinic context
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isClinicContext) {
        setPermissionsLoaded(true);
        return;
      }

      try {
        setPermissionsLoaded(false);
        const token =
          localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken") ||
          localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken") ||
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken") ||
          localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken");

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

        const response = await axios.get("/api/clinic/permissions", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            moduleKey: "clinic_marketing",
            subModuleName: "SMS marketing",
          },
        });

        if (response.data.success) {
          setPermissions({
            canCreate: response.data.permissions?.create || false,
            canRead: response.data.permissions?.read || false,
            canUpdate: response.data.permissions?.update || false,
            canDelete: response.data.permissions?.delete || false,
          });
        } else {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
      } finally {
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, [isClinicContext]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored =
      localStorage.getItem("clinicToken") ||
      sessionStorage.getItem("clinicToken") ||
      localStorage.getItem("agentToken") ||
      sessionStorage.getItem("agentToken") ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      localStorage.getItem("doctorToken") ||
      sessionStorage.getItem("doctorToken");
    if (stored) {
      setAuthToken(stored);
    }
  }, []);

  // Fetch wallet balance on mount to check before sending
  useEffect(() => {
    if (!authToken) {
      setWalletLoading(false);
      return;
    }
    const fetchWallet = async () => {
      try {
        setWalletLoading(true);
        const res = await axios.get("/api/marketing/wallet/me", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setWallet(res.data?.data || null);
      } catch (error) {
        console.error("wallet fetch error", error);
        setWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, [authToken]);

  const charCount = useMemo(() => messageBody.length, [messageBody]);
  const recipientsPreview = useMemo(
    () =>
      numbersInput
        .split(/[\s,\n,]+/)
        .map((num) => num.trim())
        .filter((num) => /^\+?\d{10,15}$/.test(num)),
    [numbersInput]
  );
  const creditsPerRecipient = Math.max(1, Math.ceil(charCount / 160));
  const totalCreditsPreview = recipientsPreview.length * creditsPerRecipient;
  const lowBalanceThreshold = wallet?.lowBalanceThreshold ?? 50;
  const isWalletLow = wallet ? wallet.balance <= lowBalanceThreshold : false;
  const creditBadgeClass = walletLoading
    ? "border-slate-200 bg-slate-50 text-slate-500"
    : isWalletLow
      ? "border-rose-200 bg-rose-50 text-rose-700 animate-pulse"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const extractRecipients = () =>
    numbersInput
      .split(/[\s,\n,]+/)
      .map((num) => num.trim())
      .filter((num) => /^\+?\d{10,15}$/.test(num));

  const resetForm = () => {
    setNumbersInput("");
    setTemplateId("");
    setMessageBody("");
    setLanguage("english");
    setSenderId("776500");
    setShortUrlEnabled(false);
    setScheduleEnabled(false);
    setScheduleTime("");
    setStatus("");
    setResults([]);
    setCsvMeta({ fileName: "", rows: 0, error: "" });
    setDocUploads(buildInitialDocState());
  };

  const handleCsvUpload = async (file) => {
    if (!file) return;
    setCsvMeta({ fileName: file.name, rows: 0, error: "" });
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") {
          throw new Error("Unable to read file.");
        }
        const lines = text.split(/\r?\n/);
        const numbers = [];
        lines.forEach((line) => {
          line
            .split(/[,;]/)
            .map((token) => token.trim())
            .forEach((token) => {
              if (/^\+?\d{10,15}$/.test(token)) {
                numbers.push(token);
              }
            });
        });
        if (numbers.length === 0) {
          setCsvMeta({ fileName: file.name, rows: 0, error: "No valid numbers found in CSV." });
          return;
        }
        setNumbersInput(numbers.join(", "));
        setCsvMeta({ fileName: file.name, rows: numbers.length, error: "" });
      } catch (err) {
        setCsvMeta({
          fileName: file.name,
          rows: 0,
          error: err instanceof Error ? err.message : "Failed to parse CSV.",
        });
      }
    };
    reader.onerror = () => {
      setCsvMeta({ fileName: file.name, rows: 0, error: "Unable to read the file." });
    };
    reader.readAsText(file);
  };

  const handleDocumentUpload = async (docId, file) => {
    if (!file) return;
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      setDocUploads((prev) => ({
        ...prev,
        [docId]: { status: "error", url: "", error: "Cloudinary configuration missing" },
      }));
      return;
    }

    setDocUploads((prev) => ({
      ...prev,
      [docId]: { ...prev[docId], status: "uploading", error: "" },
    }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) {
        throw new Error(data.error?.message || "Upload failed");
      }
      setDocUploads((prev) => ({
        ...prev,
        [docId]: { status: "done", url: data.secure_url, error: "" },
      }));
    } catch (err) {
      setDocUploads((prev) => ({
        ...prev,
        [docId]: { status: "error", url: "", error: err instanceof Error ? err.message : "Upload failed" },
      }));
    }
  };


  const handleSubmit = async () => {
    setStatus("");
    setResults([]);

    // Check permissions for create action
    if (isClinicContext && !permissions.canCreate) {
      setStatus("❌ You do not have permission to send SMS.");
      return;
    }

    if (addMethod !== "manual") {
      setStatus("❌ This import method is not supported yet. Please enter numbers manually.");
      return;
    }

    const recipients = extractRecipients();
    if (recipients.length === 0) {
      setStatus("❌ Please enter at least one valid mobile number.");
      return;
    }

    if (!messageBody.trim()) {
      setStatus("❌ Message content cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const cleanBody = DOMPurify.sanitize(messageBody.trim());
      const creditsPerRecipientLocal = Math.max(1, Math.ceil(cleanBody.length / 160));
      const creditsNeeded = creditsPerRecipientLocal * recipients.length;
      if (wallet && wallet.balance < creditsNeeded) {
        setStatus(
          `❌ You need ${creditsNeeded} credits for this send, but only ${wallet.balance} are available. Please request a top-up.`
        );
        setLoading(false);
        return;
      }
      const token =
        authToken ||
        (typeof window !== "undefined" && (localStorage.getItem("clinicToken") || localStorage.getItem("doctorToken")));
      if (!token) {
        setStatus("❌ No authentication token found.");
        return;
      }

      const payload = {
        to: recipients,
        title: templateId || "SMS Campaign",
        body: cleanBody,
        meta: {
          language,
          senderId,
          shortUrlEnabled,
          schedule: scheduleEnabled ? scheduleTime : null,
        },
      };

      const res = await axios.post("/api/marketing/sms-send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setStatus("✅ Messages queued successfully.");
        setResults(res.data.data || []);
        // Update wallet balance locally
        setWallet((prev) =>
          prev
            ? {
              ...prev,
              balance: Math.max(prev.balance - creditsNeeded, 0),
              totalSent: (prev.totalSent || 0) + creditsNeeded,
            }
            : prev
        );
      } else {
        setStatus("❌ Failed: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      const statusCode = err?.response?.status;
      if (statusCode === 402) {
        setStatus(err?.response?.data?.message || "Insufficient SMS credits. Please request a top-up.");
      } else {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setStatus(`❌ Error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <div className="mx-auto max-w-7xl space-y-3">
        {/* Compact Header */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600">Send SMS</p>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">Assigned Leads Broadcast</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Share updates, offers or alerts with your customers in seconds.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="font-medium">Messaging IO Active</span>
              </span>
            </div>
          </div>
        </section>

        {/* Compact Quick Action Boxes */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setShowRoiModal(true)}
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md hover:border-gray-800 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">ROI Analytics</p>
                <p className="text-sm font-bold text-gray-900">View Performance</p>
                <p className="text-xs text-gray-600 mt-0.5">Track your SMS campaign ROI</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowDltModal(true)}
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md hover:border-gray-800 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">DLT Verification</p>
                <p className="text-sm font-bold text-gray-900">Registration</p>
                <p className="text-xs text-gray-600 mt-0.5">Complete DLT verification</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowTopupModal(true)}
            className="group bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md hover:border-gray-800 transition-all duration-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">SMS Wallet</p>
                <p className="text-sm font-bold text-gray-900">Top-up Credits</p>
                <p className="text-xs text-gray-600 mt-0.5">Manage your SMS balance</p>
              </div>
            </div>
          </button>
        </section>

        {/* Compact Form */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Add numbers */}
          <div className="border-b border-gray-200 px-3 sm:px-4 py-3 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Add numbers via</p>
                <div className="flex flex-wrap gap-2">
                  {ADD_METHODS.map(({ id, label, disabled }) => (
                    <button
                      key={id}
                      disabled={disabled}
                      onClick={() => setAddMethod(id)}
                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${addMethod === id
                          ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-800"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:text-sm font-semibold flex-shrink-0 ${creditBadgeClass}`}>
                <span className="uppercase tracking-wide whitespace-nowrap">Credits Left</span>
                <span className="text-base sm:text-lg font-bold">
                  {walletLoading ? "Loading..." : wallet ? wallet.balance.toLocaleString() : "N/A"}
                </span>
                {wallet && (
                  <span className="text-[10px] font-medium text-gray-600 whitespace-nowrap">
                    Threshold {lowBalanceThreshold.toLocaleString()}
                  </span>
                )}
                {isWalletLow && <span className="text-[10px] font-semibold whitespace-nowrap">Low balance</span>}
              </div>
            </div>
            <div className="w-full">
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                {addMethod === "csv" ? "Upload CSV File" : "Enter Mobile Numbers"}
              </label>
              {addMethod === "csv" ? (
                <div className="mt-2 space-y-3">
                  <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-center cursor-pointer hover:border-gray-800 transition">
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => handleCsvUpload(e.target.files?.[0] || null)}
                    />
                    <svg className="w-6 h-6 text-gray-800 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 12l4 4m0 0l4-4m-4 4V4" />
                    </svg>
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">Click to upload CSV</span>
                    <span className="text-[10px] sm:text-xs text-gray-600 mt-1">Each row should contain one mobile number</span>
                  </label>
                  {csvMeta.fileName && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs sm:text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">{csvMeta.fileName}</p>
                      <p>{csvMeta.rows} numbers detected</p>
                      {csvMeta.error && <p className="text-red-600 text-xs mt-1">{csvMeta.error}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    rows={3}
                    placeholder="Enter mobile numbers here 91123XXXXXX, 90182XXXXXX, 98102XXXXXX"
                    value={numbersInput}
                    onChange={(e) => setNumbersInput(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition"
                  />
                  {recipientsPreview.length === 0 && numbersInput.trim() && (
                    <p className="text-xs text-red-600 mt-1">Mobile numbers are required.</p>
                  )}
                  {recipientsPreview.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1">{recipientsPreview.length} valid number(s) detected</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-3 sm:px-4 py-3 space-y-4">
            {/* Compact Message composer */}
            <section className="grid gap-4 lg:grid-cols-[200px,1fr]">
              <div className="lg:sticky lg:top-4 lg:self-start">
                <p className="text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Message Mode</p>
                <div className="space-y-2">
                  {MESSAGE_MODES.map(({ id, label, disabled }) => (
                    <button
                      key={id}
                      disabled={disabled}
                      onClick={() => setMessageMode(id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${messageMode === id
                          ? "border-gray-800 bg-gray-800 text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-800"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 min-w-0">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold uppercase text-gray-700 tracking-wide mb-1.5">DLT Template ID</label>
                  <input
                    type="text"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="Enter template ID that is approved on DLT platform"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold uppercase text-gray-700 tracking-wide mb-1.5">Message Content</label>
                  <textarea
                    rows={5}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Enter message here..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition resize-none"
                  />
                  <div className="flex flex-col gap-1 text-xs text-gray-600 mt-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium">{charCount} characters</span>
                    <div className="text-right space-y-0.5 sm:space-y-0">
                      <span className="block">
                        {creditsPerRecipient} SMS credits per recipient
                      </span>
                      {recipientsPreview.length > 0 && (
                        <span className="block font-medium">
                          Total cost: {totalCreditsPreview.toLocaleString()}{" "}
                          {wallet
                            ? `• Projected remaining: ${Math.max(wallet.balance - totalCreditsPreview, 0).toLocaleString()}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Compact Meta settings */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold uppercase text-gray-700 tracking-wide mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="marathi">Marathi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-semibold uppercase text-gray-700 tracking-wide mb-1.5">From</label>
                  <input
                    type="text"
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-3 cursor-pointer select-none hover:border-gray-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={shortUrlEnabled}
                    onChange={(e) => setShortUrlEnabled(e.target.checked)}
                    className="h-4 w-4 mt-0.5 text-gray-800 focus:ring-gray-800"
                  />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Enable URL Shortener</p>
                    <p className="text-xs text-gray-600 mt-0.5">Shorten the URLs present in your SMS to reduce character count.</p>
                  </div>
                </label>

                <div className="rounded-lg border border-gray-200 px-3 py-3">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={scheduleEnabled}
                      onChange={(e) => setScheduleEnabled(e.target.checked)}
                      className="h-4 w-4 mt-0.5 text-gray-800 focus:ring-gray-800"
                    />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">Schedule</p>
                      <p className="text-xs text-gray-600 mt-0.5">Plan delivery of this message for the future.</p>
                    </div>
                  </label>
                  {scheduleEnabled && (
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Compact Actions */}
            <section className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-2 border-t border-gray-200">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
                onClick={resetForm}
              >
                Cancel
              </button>
              {(!isClinicContext || permissions.canCreate) ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-800 text-white text-xs sm:text-sm font-medium shadow-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Sending..." : "Review & Send"}
                </button>
              ) : (
                <div className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-100 text-gray-500 text-xs sm:text-sm font-medium text-center">
                  Permission Denied: You do not have permission to send SMS
                </div>
              )}
            </section>

            {/* Status & Results */}
            {status && (
              <div
                className={`border rounded-lg px-3 py-2.5 text-xs sm:text-sm ${status.includes("✅")
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                {status}
              </div>
            )}

            {results.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Delivery Report</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-mono text-xs">{item.to}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === "success" || item.status === "queued"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                            }`}
                        >
                          {item.status}
                        </span>
                        {item.error && <span className="text-xs text-red-600">({item.error})</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <SmsRoiPanel open={showRoiModal} onClose={() => setShowRoiModal(false)} />
      <DltVerificationPanel
        open={showDltModal}
        onClose={() => setShowDltModal(false)}
        docUploads={docUploads}
        onUpload={handleDocumentUpload}
      />
      <SmsTopupPanel
        open={showTopupModal}
        onClose={() => setShowTopupModal(false)}
        authToken={authToken}
        onBalanceUpdate={(updatedWallet) => setWallet(updatedWallet)}
      />
    </div>
  );
};

SmsSender.getLayout = function PageLayout(page) {
  // Wrap page in ClinicLayout for persistent layout
  // When getLayout is used, Next.js keeps the layout mounted and only swaps page content
  // This prevents sidebar and header from re-rendering on navigation
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};
const ProtectedSmsSender = withClinicAuth(SmsSender);
ProtectedSmsSender.getLayout = SmsSender.getLayout;

export default ProtectedSmsSender;


