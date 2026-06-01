import React, { useEffect, useState } from "react";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";

export default function DemoQuickPopup() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (router.pathname === "/clinic-management-software-uae") {
      setOpen(true);
      setModal(false);
    }
    // Auto-detect region from URL
    if (router.pathname.includes('india')) {
      setOpen(true);
      setModal(false);
    }
    const handler = () => {
      setOpen(true);
      setModal(true);
    };
    window.addEventListener("zeva:open-demo-popup", handler as EventListener);
    return () =>
      window.removeEventListener(
        "zeva:open-demo-popup",
        handler as EventListener,
      );
  }, [router.pathname]);

  

  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Full name is required.";
    if (!/^[A-Za-z ]{2,50}$/.test(trimmed)) return "Only letters and spaces (2–50 chars).";
    return null;
  };

  const validatePhone = (digits: string) => {
    if (!digits) return "Phone number is required.";
    if (!/^\d{7,12}$/.test(digits)) return "Enter 7–12 digit number.";
    return null;
  };

  const blockNameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const k = e.key;
    // Block digits and most punctuation; allow letters, space, control keys
    const allow =
      k.length > 1 || // Control keys like Backspace, Tab, Arrow keys
      /[A-Za-z ]/.test(k);
    if (!allow) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const nErr = validateName(name);
    const pErr = validatePhone(phone);
    setNameError(nErr);
    setPhoneError(pErr);
    if (nErr || pErr) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.post("/api/zeva-leads", {
        name,
        email,
        phone,
        clinicName,
        source: modal ? "Floating Modal" : "Fixed Popup",
      });
      if (data.success) {
        setSuccess(true);
        // Determine region based on current path
        const isIndia = router.pathname.includes('india');
        const region = isIndia ? 'india' : 'uae';
        
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setName("");
          setEmail("");
          setPhone("");
          setClinicName("");
          // Redirect to thank you page
          router.push(`/demo-thank-you?region=${region}`);
        }, 1500);
      } else {
        setError(data.message || "Failed to submit request.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  if (modal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        <div className="relative w-[560px] max-w-[92vw] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
          <div className="bg-blue-500 text-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <div className="font-bold">Book Your Demo</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            </div>
          <div className="px-6 py-5">
            {success ? (
              <div className="py-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Request Received!
                </h3>
                <p className="text-gray-600">
                  Our team will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] border-gray-300 dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400 ${nameError ? "border-red-400 focus:ring-red-400" : ""}`}
                        inputMode="text"
                        autoComplete="name"
                        pattern="[A-Za-z ]{2,50}"
                        maxLength={50}
                        onKeyDown={blockNameKey}
                        value={name}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^A-Za-z ]+/g, " ");
                          setName(v);
                          setNameError(validateName(v));
                        }}
                        required
                      />
                      {nameError && <p className="mt-1 text-[11px] text-red-500">{nameError}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="you@clinic.com"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 XX XXX XXXX"
                        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] border-gray-300 dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400 ${phoneError ? "border-red-400 focus:ring-red-400" : ""}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          setPhone(digits);
                          setPhoneError(validatePhone(digits));
                        }}
                        maxLength={15}
                        required
                      />
                      {phoneError && <p className="mt-1 text-[11px] text-red-500">{phoneError}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                        Clinic Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your clinic name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-xs text-red-500 font-medium">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !!nameError || !!phoneError}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 text-white font-semibold px-4 py-2 disabled:opacity-50 transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Request Demo
                  </button>
                </form>
                
                <div className="mt-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                  We'll contact you within 24 hours
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[90vw]">
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
        <div className="bg-blue-500 text-white px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <div className="font-bold">Book Your Demo</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          {success ? (
            <div className="py-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0A1F44] mb-1">Sent!</h3>
              <p className="text-xs text-gray-600">We'll contact you soon.</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] border-gray-300 dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400 ${nameError ? "border-red-400 focus:ring-red-400" : ""}`}
                    inputMode="text"
                    autoComplete="name"
                    pattern="[A-Za-z ]{2,50}"
                    maxLength={50}
                    onKeyDown={blockNameKey}
                    value={name}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^A-Za-z ]+/g, " ");
                      setName(v);
                      setNameError(validateName(v));
                    }}
                    required
                  />
                  {nameError && <p className="mt-1 text-[11px] text-red-500">{nameError}</p>}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@clinic.com"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 XX XXX XXXX"
                      className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] border-gray-300 dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400 ${phoneError ? "border-red-400 focus:ring-red-400" : ""}`}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setPhone(digits);
                        setPhoneError(validatePhone(digits));
                      }}
                      maxLength={15}
                      required
                    />
                    {phoneError && <p className="mt-1 text-[11px] text-red-500">{phoneError}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A1F44] mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your clinic name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] dark:bg-white dark:text-gray-900 dark:border-gray-300 placeholder-gray-400 dark:placeholder-gray-400"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-500 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !!nameError || !!phoneError}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 text-white font-semibold px-4 py-2 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Request Demo
                </button>
              </form>
              
              <div className="mt-3 text-center text-[11px] text-gray-500 dark:text-gray-400">We'll contact you within 24 hours</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
