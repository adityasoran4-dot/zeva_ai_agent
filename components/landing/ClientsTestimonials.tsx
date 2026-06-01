import React from "react";
import { Star, Award, ShieldCheck } from "lucide-react";

export default function ClientsTestimonials() {
  const badges = [
    { top: "Dubai", bottom: "Healthcare City" },
    { top: "Aesthetic", bottom: "Clinic" },
    { top: "Wellness", bottom: "Center" },
    { top: "Medical", bottom: "Spa" },
    { top: "Derma", bottom: "Clinic" },
  ];
  const testimonials = [
    {
      text:
        "Zeva transformed our clinic operations. We’ve seen a 40% increase in patient satisfaction and our booking efficiency has doubled.",
      name: "Dr. Sarah Ahmed",
      role: "Medical Director",
      clinic: "Elite Wellness Clinic, Dubai",
    },
    {
      text:
        "The membership and package features are game-changers. Our recurring revenue has grown by 60% in just 3 months.",
      name: "Mohammed Al-Rashid",
      role: "Clinic Manager",
      clinic: "Premium Aesthetics, JBR",
    },
    {
      text:
        "Best investment we’ve made. The system is intuitive, elegant, and the support team is exceptional. Highly recommended.",
      name: "Dr. Fatima Khan",
      role: "Founder & CEO",
      clinic: "HealthPlus Medical Center",
    },
  ];

  const highlights = [
    { icon: Award, title: "Best SaaS 2025", subtitle: "Dubai Tech Awards" },
    { icon: ShieldCheck, title: "ISO Certified", subtitle: "Healthcare Standards" },
    { icon: Star, title: "Top Rated", subtitle: "G2 Reviews" },
  ];

  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <div className="text-[11px] md:text-xs font-semibold tracking-widest uppercase text-[#2c5b7a] mb-4">
            TRUSTED BY LEADING DUBAI CLINICS
          </div>
          <div className="flex flex-wrap items-center justify-center gap-9 mb-10">
            {badges.map((b) => (
              <div
                key={`${b.top}-${b.bottom}`}
                className="grid place-items-center rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm"
              >
                <div className="text-center text-[11px] md:text-xs font-medium text-gray-500 leading-tight">
                  <span className="block">{b.top}</span>
                  <span className="block">{b.bottom}</span>
                </div>
              </div>
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">What Our Clients Say</h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">Join hundreds of satisfied healthcare providers across the UAE</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-800 leading-relaxed italic">“{t.text}”</p>
              <div className="mt-5 h-px w-full bg-gray-200" />
              <div className="mt-4">
                <div className="font-semibold text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-600">{t.role}</div>
                <div className="text-sm text-[#D4AF37] mt-1">{t.clinic}</div>
              </div>
            </div>
          ))}
          
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {highlights.map((h, i) => (
            <div key={i} className="inline-flex items-center gap-3 rounded-xl bg-[#0b2b4a] text-white px-5 py-3 shadow-sm">
              <h.icon className="w-5 h-5 text-yellow-300" />
              <div>
                <div className="text-sm font-semibold">{h.title}</div>
                <div className="text-[11px] text-blue-200">{h.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
