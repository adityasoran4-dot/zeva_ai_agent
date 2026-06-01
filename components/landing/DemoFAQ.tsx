import React, { useState } from "react";
import { Plus, Minus, Mail } from "lucide-react";
import { WhatsAppIcon } from "./LandingHeader";

const faqs = [
  { q: "How quickly can we start using Zeva?", a: "Most clinics are up and running within 24 hours. Our onboarding team will migrate your data, set up your system, and train your staff. You can start accepting bookings the very next day." },
  { q: "Do we need to install any software?", a: "No installation required! Zeva is 100% cloud-based. Access it from any device with a web browser - desktop, tablet, or mobile. Your data is automatically synced and backed up." },
  { q: "What if my team isn’t tech‑savvy?", a: "Zeva is designed to be incredibly intuitive. Most staff members become proficient within 30 minutes. We also provide free training sessions, video tutorials, and 24/7 support to ensure your team feels confident." },
  { q: "Can I migrate my existing patient data?", a: "Absolutely! We'll help you migrate all your patient records, appointment history, and clinic data at no extra cost. Our team handles the entire process securely and accurately." },
  { q: "Is my patient data secure and compliant?", a: "Yes. Zeva is HIPAA compliant and ISO certified. We use bank-level encryption, regular security audits, and maintain strict compliance with UAE healthcare data regulations. Your data is stored on secure servers in the UAE." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards, bank transfers, and UAE local payment methods. For the platform itself, we support integration with all major payment gateways including Network International, PayTabs, and more." },
  { q: "Can I cancel my subscription anytime?", a: "Yes, absolutely. There are no long-term contracts. You can cancel anytime with 30 days' notice. We also offer a 30-day money-back guarantee if you're not satisfied." },
  { q: "Do you offer customer support in Arabic?", a: "Yes! Our support team is fluent in both English and Arabic. We also offer phone, email, and WhatsApp support 24/7 to ensure you always get help when you need it." },
];

export default function DemoFAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="max-w-3xl mx-auto px-4 py-14 bg-white">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs shadow-sm bg-[#F5E9C9] border-[#E8D9B6] text-[#0b2b4a]">
          Got Questions?
        </span>
      </div>
      <h2 className="mt-4 text-center text-3xl md:text-4xl font-extrabold tracking-wide">
        <span className="text-[#0b2b4a]">Frequently Asked </span>
        <span className="bg-gradient-to-r from-[#D4AF37] to-[#F0D98C] bg-clip-text text-transparent">Questions</span>
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">Everything you need to know about Zeva</p>

      <div className="mt-8 space-y-3">
        {faqs.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-colors duration-300 bg-white"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className={`w-full flex items-center justify-between p-6 text-left transition-all duration-300 bg-gradient-to-t from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:shadow-2xl hover:shadow-[#D4AF37]/20`}
              >
                <span className="flex-1 text-left text-lg font-bold text-[#0A1F44] pr-8">{item.q}</span>
                <span className="w-9 h-9 rounded-full flex items-center justify-center bg-[#F0D98C] text-[#0A1F44]">
                  {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: isOpen ? 200 : 0, opacity: isOpen ? 1 : 0 }}
              >
                <div className="px-6 pb-6 text-sm text-gray-600">
                  {item.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center p-6 md:p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200">
        <h3 className="text-lg md:text-xl font-bold text-[#0A1F44] mb-2">Still have questions?</h3>
        <p className="text-sm md:text-base text-gray-600 mb-6 px-2">Our team is here to help. Get in touch and we'll answer all your questions.</p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-stretch sm:items-center">
          <a
            href="https://wa.me/971502983757"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F0D98C] text-[#0A1F44] font-semibold shadow transition-transform hover:scale-105 active:scale-95 text-sm md:text-base"
          >
            <WhatsAppIcon className="w-4 h-4 flex-shrink-0" />
            <span>WhatsApp: +971 50 298 3757</span>
          </a>
          <a
            href="mailto:sales@zeva360.com?subject=Inquiry%20from%20Website&body=Hello%20Zeva%20Team,%0A%0AI%20would%20like%20to%20learn%20more%20about%20your%20clinic%20management%20platform.%0A%0AThanks,%0A[Your%20Name]"
            className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-3 rounded-xl bg-[#0A1F44] text-white font-semibold shadow transition-transform hover:scale-105 active:scale-95 text-sm md:text-base"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>Email: sales@zeva360.com</span>
          </a>
        </div>
      </div>
    </section>
  );
}
