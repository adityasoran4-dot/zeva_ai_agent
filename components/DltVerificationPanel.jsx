import { useState } from "react";

export const REQUIRED_DLT_DOCS = [
  { id: "pan", label: "Company PAN Card" },
  { id: "gst", label: "Company GST Certificate" },
  { id: "signatory", label: "Authorized Signatory Aadhar & PAN" },
  { id: "address", label: "Company Address Proof" },
  { id: "loa", label: "Letter of Authorization (LOA)" },
  { id: "registration", label: "Business / Incorporation Certificate" },
];

const LOA_SAMPLE = `<<COMPANY LETTERHEAD>>

Date: __/__/____
Place: ______________________

To Whomsoever It May Concern,

Subject: Declaration of the Authorized Person

We, {REGISTERED COMPANY NAME}, would like to authorize {AUTHORIZED PERSON NAME}, {AUTHORIZED PERSON DESIGNATION} to sign on behalf of our company for telemarketer / enterprise related activities.

Contact Person Name: ________________________________
Contact Number: ____________________________________
Email ID: _________________________________________
ID Proof Type: ____________________________________
ID Proof Number: __________________________________

Yours sincerely,
{NAME}
{DESIGNATION}`;

export const buildInitialDocState = () =>
  REQUIRED_DLT_DOCS.reduce(
    (acc, doc) => ({
      ...acc,
      [doc.id]: { status: "idle", url: "", error: "" },
    }),
    {}
  );

const statusLabelMap = {
  idle: "Pending",
  uploading: "Uploading…",
  done: "Uploaded",
  error: "Failed",
};

const statusColorMap = {
  idle: "text-slate-500",
  uploading: "text-blue-600",
  done: "text-emerald-600",
  error: "text-rose-600",
};

const UploadStatusBadge = ({ status }) => (
  <span className={`text-[10px] font-semibold ${statusColorMap[status] || "text-slate-500"}`}>
    {statusLabelMap[status] || "Pending"}
  </span>
);

const AccordionSection = ({ id, title, isOpen, onToggle, children }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden">
    <button
      onClick={() => onToggle(isOpen ? "" : id)}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition"
    >
      <span>{title}</span>
      <span>{isOpen ? "−" : "+"}</span>
    </button>
    {isOpen ? <div className="px-4 py-3 bg-white text-xs text-slate-600">{children}</div> : null}
  </div>
);

export default function DltVerificationPanel({ open, onClose, docUploads, onUpload }) {
  const [openSection, setOpenSection] = useState("payment");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">DLT Registration</p>
            <h2 className="text-lg font-semibold text-slate-900 mt-1">Payment & Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 text-xs text-slate-600 max-h-[420px] overflow-y-auto">
          <AccordionSection
            id="payment"
            title="Payment Confirmation"
            isOpen={openSection === "payment"}
            onToggle={setOpenSection}
          >
            <ul className="space-y-1 text-emerald-700">
              <li>DLT Registration: ₹5,000</li>
              <li>GST (18%): ₹900</li>
              <li>Total Received: ₹5,900</li>
            </ul>
            <p className="mt-2 text-emerald-800">
              Payment confirmed. Registration completes in <strong>24h</strong>, then onboarding continues.
            </p>
          </AccordionSection>

          <AccordionSection
            id="documents"
            title="Required Documents"
            isOpen={openSection === "documents"}
            onToggle={setOpenSection}
          >
            <p className="mb-2 text-blue-700">
              Upload the required documents for <strong>Diglip7 Tech Pvt. Ltd.</strong>
            </p>
            <div className="space-y-3">
              {REQUIRED_DLT_DOCS.map((doc) => {
                const uploadState = docUploads[doc.id] || { status: "idle", url: "", error: "" };
                return (
                  <div key={doc.id} className="p-2 border border-slate-200 rounded-lg flex flex-col gap-1 bg-blue-50/50">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{doc.label}</span>
                      <UploadStatusBadge status={uploadState.status} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 bg-white hover:border-blue-400 hover:text-blue-600 transition cursor-pointer">
                        Upload
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => onUpload(doc.id, e.target.files?.[0] || null)}
                        />
                      </label>
                      {uploadState.url ? (
                        <a
                          href={uploadState.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 underline"
                        >
                          View document
                        </a>
                      ) : null}
                      {uploadState.error ? <p className="text-[10px] text-rose-600">{uploadState.error}</p> : null}
                    </div>
                    {doc.id === "loa" ? (
                      <div className="mt-2 space-y-2">
                        <p className="text-[11px] font-semibold text-slate-600">Sample LOA Format</p>
                        <textarea
                          readOnly
                          className="w-full rounded-lg border border-slate-300 bg-white text-[10px] text-slate-600 p-2"
                          rows={8}
                          value={LOA_SAMPLE}
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(LOA_SAMPLE)}
                          className="self-start text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Copy Sample Text
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </AccordionSection>

          <AccordionSection id="support" title="Need Assistance?" isOpen={openSection === "support"} onToggle={setOpenSection}>
            <p>
              Email:{" "}
              <a href="mailto:support@zeva.com" className="text-blue-600 font-semibold">
                support@zeva.com
              </a>
            </p>
            <p>
              Phone:{" "}
              <a href="tel:+15551239382" className="text-blue-600 font-semibold">
                +1 (555) 123-ZEVA
              </a>
            </p>
          </AccordionSection>
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


