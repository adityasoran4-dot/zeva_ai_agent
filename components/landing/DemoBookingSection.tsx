import React, { useState } from "react";
import {
  FileText,
  Users,
  ShieldCheck,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";

export default function DemoBookingSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/zeva-leads", {
        name,
        email,
        phone,
        clinicName,
        source: "Booking Section Form",
      });
      if (data.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setClinicName("");
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

  const bullets = [
    { icon: FileText, text: "See Zeva in action with your clinic's workflow" },
    { icon: Clock, text: "30-minute personalized demo session" },
    { icon: ShieldCheck, text: "Dedicated onboarding specialist" },
    { icon: Users, text: "No commitment required" },
  ];

  return (
    <section
      className="w-full py-20"
      style={{
        background:
          "radial-gradient(1000px 600px at 15% 20%, rgba(238,242,247,0.9), transparent 55%), radial-gradient(900px 500px at 85% 30%, rgba(238,242,247,0.7), transparent 60%), #ffffff",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border text-xs shadow-sm bg-[#F5E9C9] border-[#E8D9B6] text-[#0b2b4a]">
              <span className="w-2 h-2 rounded-full bg-[#E2BE4C]" />
              <span className="font-semibold">Limited Slots Available</span>
            </div>
            <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-wide">
              <span className="text-[#0b2b4a]">See How Zeva Can </span>
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#F0D98C] bg-clip-text text-transparent">
                Transform Your Clinic
              </span>
            </h2>
            <p className="mt-3 text-sm md:text-base text-gray-700">
              Book a free personalized demo and discover how top Dubai clinics
              are scaling their operations, increasing revenue, and delighting
              patients with Zeva.
            </p>

            <div className="mt-6 space-y-4">
              {bullets.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-[10px] flex-shrink-0"
                    style={{ backgroundColor: "#0b2b4a" }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#f5ca3a" }} />
                  </div>
                  <div className="text-sm text-gray-800">{text}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4 p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-sm">
              <div className="flex items-center -space-x-3">
                {["A", "B", "C", "D"].map((a) => (
                  <div
                    key={a}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#F0D98C] ring-2 ring-white text-[#0A1F44] font-bold text-xs"
                  >
                    {a}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-bold text-[#0b2b4a]">
                  Join 500+ clinics
                </div>
                <div className="text-[11px] text-gray-600">
                  who chose Zeva this month
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="relative rounded-3xl bg-white p-7 shadow-2xl border-2 border-gray-200">
              <div className="absolute top-0 right-0 w-40 h-40 md:w-56 md:h-56 bg-gradient-to-br from-[#D4AF37]/20 to-transparent rounded-bl-full pointer-events-none" />
              <div className="text-lg font-semibold text-[#0b2b4a]">
                Book Your Free Demo
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Fill out the form below and we’ll contact you within 2 hours.
              </div>

              {success ? (
                <div className="mt-8 py-10 text-center animate-in fade-in duration-500">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A1F44] mb-2">
                    Request Received!
                  </h3>
                  <p className="text-gray-600">
                    Our team will contact you within 2 hours to schedule your
                    demo.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-8 text-sm font-semibold text-[#0b2b4a] hover:underline underline-offset-4"
                  >
                    Send another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-[#0b2b4a] mb-2">
                        Full Name *
                      </div>
                      <input
                        type="text"
                        placeholder="Dr. Ahmed Hassan"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#0b2b4a] mb-2">
                        Email Address *
                      </div>
                      <input
                        type="email"
                        placeholder="you@yourclinic.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#0b2b4a] mb-2">
                        Phone Number *
                      </div>
                      <input
                        type="tel"
                        placeholder="+971 XX XXX XXXX"
                        required
                        value={phone}
                        onChange={(e) =>
                          setPhone(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#0b2b4a] mb-2">
                        Clinic Name *
                      </div>
                      <input
                        type="text"
                        placeholder="Your Clinic Name"
                        required
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 text-gray-900"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-3 text-xs text-red-500 font-medium">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F0D98C] text-[#0A1F44] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-300 w-full h-14 text-lg font-bold disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Book My Free Demo Now
                  </button>

                  

                  <p className="mt-3 text-xs text-gray-500 text-center">
                    By submitting, you agree to our Terms of Service and Privacy
                    Policy. We will only contact you about your demo.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
