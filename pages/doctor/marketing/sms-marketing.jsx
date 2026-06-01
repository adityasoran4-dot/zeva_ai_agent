// pages/doctor/marketing/sms-marketing.jsx
import { useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import DOMPurify from "dompurify";
import DoctorLayout from "../../../components/DoctorLayout";
import withDoctorAuth from "../../../components/withDoctorAuth";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Helper to strip HTML tags
const stripHtml = (html) => {
  return html.replace(/<[^>]*>?/gm, "").trim();
};

const SmsSender = () => {
  const [mode, setMode] = useState("single");
  const [singleNumber, setSingleNumber] = useState("");
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
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
      const cleanDescription = stripHtml(DOMPurify.sanitize(description));

      // Get token if needed
      const token = typeof window !== "undefined" ? localStorage.getItem("doctorToken") : null;
      if (!token) {
        setStatus("❌ No authentication token found");
        setLoading(false);
        return;
      }

      const recipients =
        mode === "single"
          ? [singleNumber]
          : bulkNumbers
              .split(",")
              .map((num) => num.trim())
              .filter((num) => /^\+?\d{10,15}$/.test(num));

      if (recipients.length === 0) {
        setStatus("❌ No valid recipient numbers provided");
        setLoading(false);
        return;
      }

      const payload = {
        body: cleanDescription,
        title: title || "Special Offer",
        validUntil: validUntil || undefined,
        mediaUrl: imageUrl || undefined,
        to: recipients,
      };

      const res = await axios.post("/api/marketing/sms-send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setStatus(`✅ Messages sent successfully!`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">SMS Marketing Campaign</h1>
              <p className="text-slate-600 mt-1">Create and send engaging SMS messages to your customers</p>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Mode Toggle */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">Campaign Type</label>
            <div className="inline-flex rounded-xl bg-white shadow-sm border border-slate-200 p-1">
              <button
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  mode === "single"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setMode("single")}
              >
                Single Recipient
              </button>
              <button
                className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  mode === "bulk"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setMode("bulk")}
              >
                Bulk Campaign
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {mode === "single" ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Recipient Number</label>
                    <input
                      type="text"
                      placeholder="+919876543210"
                      value={singleNumber}
                      onChange={(e) => setSingleNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Recipient Numbers <span className="text-slate-500 font-normal ml-2">(comma separated)</span>
                    </label>
                    <textarea
                      placeholder="+919876543210, +919812345678"
                      value={bulkNumbers}
                      onChange={(e) => setBulkNumbers(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                      rows={4}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Summer Special Discount"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Valid Until</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Message Content</label>
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <ReactQuill
                      value={description}
                      onChange={setDescription}
                      modules={{ toolbar: [["bold", "italic"], ["link"]] }}
                      theme="snow"
                      placeholder="Write your promotional message here..."
                      className="h-40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Image</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full" />
                  {imageUrl && <img src={imageUrl} alt="Uploaded" className="mt-2 w-full h-48 object-cover rounded-lg" />}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? "Sending Messages..." : "Send SMS Campaign"}
              </button>
            </div>

            {/* Status */}
            {status && (
              <div className={`mt-6 p-4 rounded-xl ${status.includes("✅") ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <p className={`${status.includes("✅") ? "text-green-800" : "text-red-800"}`}>{status}</p>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="mt-6 bg-slate-50 rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Delivery Report</h3>
                <div className="space-y-2">
                  {results.map((r, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between">
                      <span className="font-mono text-sm">{r.to}</span>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${r.status === "success" || r.status === "queued" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.status}
                      </span>
                      {r.error && <span className="text-xs text-red-600">({r.error})</span>}
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
SmsSender.getLayout = (page) => <DoctorLayout>{page}</DoctorLayout>;

// Protect and preserve layout
const ProtectedSmsSender = withDoctorAuth(SmsSender);
ProtectedSmsSender.getLayout = SmsSender.getLayout;

export default ProtectedSmsSender;

