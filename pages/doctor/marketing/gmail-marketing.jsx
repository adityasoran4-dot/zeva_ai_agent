// pages/doctor/marketing/gmail-marketing.jsx
import { useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import DOMPurify from "dompurify";
import DoctorLayout from "../../../components/DoctorLayout";
import withDoctorAuth from "../../../components/withDoctorAuth";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Helper to strip HTML tags
const stripHtml = (html) => html.replace(/<[^>]*>?/gm, "").trim();

const GmailSender = () => {
  const [mode, setMode] = useState("single");
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);

  const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  // Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setImageUrl(data.secure_url);
        setStatus("✅ Image uploaded successfully!");
      } else {
        setStatus("❌ Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      setStatus("❌ Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    setLoading(true);
    setStatus("");
    setResults([]);

    try {
      const cleanBody = stripHtml(DOMPurify.sanitize(body));

      const recipients =
        mode === "single"
          ? [singleEmail]
          : bulkEmails
              .split(",")
              .map((email) => email.trim())
              .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      if (recipients.length === 0) {
        setStatus("❌ No valid recipient emails provided");
        setLoading(false);
        return;
      }

      // Get auth token
      const token = localStorage.getItem("doctorToken") || localStorage.getItem("userToken") || localStorage.getItem("adminToken");
      
      if (!token) {
        setStatus("❌ Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const payload = {
        subject: subject || "Special Offer",
        body: cleanBody,
        mediaUrl: imageUrl || undefined,
        to: recipients,
      };

      const res = await axios.post("/api/marketing/gmail-send", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        setStatus(`✅ Emails sent successfully!`);
        setResults(res.data.data);
      } else {
        setStatus("❌ Failed: " + (res.data.error || "Unknown error"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatus("❌ Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8M21 8L12 15 3 8" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Gmail Marketing Campaign</h1>
              <p className="text-slate-600 mt-1">Create and send promotional emails to your customers</p>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Mode Toggle */}
          <div className="bg-gradient-to-r from-slate-50 to-red-50 border-b border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Campaign Type</label>
            <div className="inline-flex rounded-xl bg-white shadow-sm border border-slate-200 p-1">
              <button
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${mode === "single" ? "bg-gradient-to-r from-red-600 to-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setMode("single")}
              >
                Single Recipient
              </button>
              <button
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${mode === "bulk" ? "bg-gradient-to-r from-red-600 to-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setMode("bulk")}
              >
                Bulk Campaign
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-6">
              {mode === "single" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Email</label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Recipient Emails <span className="text-slate-500 font-normal ml-2">(comma separated)</span>
                  </label>
                  <textarea
                    placeholder="example1@gmail.com, example2@gmail.com"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all resize-none"
                    rows={4}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Subject</label>
                <input
                  type="text"
                  placeholder="Special Offer"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 transition-all"
                />
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Body</label>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <ReactQuill
                    value={body}
                    onChange={setBody}
                    modules={{ toolbar: [["bold", "italic"], ["link"]] }}
                    theme="snow"
                    placeholder="Write your promotional email here..."
                    className="h-40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Image</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-red-400 transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" id="image-upload" />
                  <label htmlFor="image-upload" className={`flex flex-col items-center justify-center cursor-pointer ${uploading ? "opacity-50" : ""}`}>
                    {!imageUrl ? (
                      <>
                        <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium text-slate-700">{uploading ? "Uploading..." : "Click to upload image"}</span>
                        <span className="text-xs text-slate-500 mt-1">PNG, JPG up to 10MB</span>
                      </>
                    ) : (
                      <img src={imageUrl} alt="Uploaded" className="w-full h-48 object-cover rounded-lg shadow-md" />
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-8 col-span-full">
              <button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="w-full bg-gradient-to-r from-red-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? "Sending Emails..." : "Send Gmail Campaign"}
              </button>
            </div>

            {/* Status */}
            {status && (
              <div className={`mt-6 p-4 rounded-xl ${status.includes("✅") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className={`text-sm font-medium ${status.includes("✅") ? "text-green-800" : "text-red-800"}`}>{status}</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-6 col-span-full">
                <h3 className="font-semibold text-slate-800 mb-4">Delivery Report</h3>
                <div className="space-y-2">
                  {results.map((r, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-700">{r.to}</span>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${r.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout
GmailSender.getLayout = (page) => <DoctorLayout>{page}</DoctorLayout>;

// Protect and preserve layout
const ProtectedGmailSender = withDoctorAuth(GmailSender);
ProtectedGmailSender.getLayout = GmailSender.getLayout;

export default ProtectedGmailSender;

