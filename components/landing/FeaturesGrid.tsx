import React from "react";
import {
  Clock,
  Bell,
  BarChart2,
  ShieldCheck,
  Smartphone,
  Zap,
  Globe,
  Headset,
  FileText,
  TrendingUp,
  Users2,
  DollarSign,
} from "lucide-react";

export default function FeaturesGrid() {
  const features = [
    { title: "24/7 Online Booking", desc: "Let patients book appointments anytime, anywhere", Icon: Clock },
    { title: "Smart Reminders", desc: "Automated SMS & email reminders reduce no-shows by 70%", Icon: Bell },
    { title: "Advanced Analytics", desc: "Real-time insights from revenue, bookings, and performance", Icon: BarChart2 },
    { title: "HIPAA Compliant", desc: "Enterprise-grade security for patient data protection", Icon: ShieldCheck },
    { title: "Mobile App", desc: "Manage your clinic on-the-go with iOS & Android apps", Icon: Smartphone },
    { title: "Lightning Fast", desc: "Optimized performance with sub-second load times", Icon: Zap },
    { title: "Multi-Language", desc: "Support for Arabic, English, and 10+ languages", Icon: Globe },
    { title: "Priority Support", desc: "Dedicated UAE-based support team available 24/7", Icon: Headset },
    { title: "Digital Records", desc: "Paperless clinic with secure cloud-based records", Icon: FileText },
    { title: "Growth Tools", desc: "Marketing automation and patient retention features", Icon: TrendingUp },
    { title: "Team Management", desc: "Role-based access and staff scheduling tools", Icon: Users2 },
    { title: "Payment Integration", desc: "Accept all major cards, Apple Pay, and local payment methods", Icon: DollarSign },
  ];

  return (
    <section id="features" className="w-full bg-white py-16 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-xs text-gray-700">
            Complete Feature Set
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold">
            <span className="text-[#0b2b4a]">Powerful Features for </span>
            <span className="text-yellow-500">Modern Clinics</span>
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Everything you need to run a successful healthcare practice in the UAE
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {features.map(({ title, desc, Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm"
            >
              <div className="flex flex-col">
                <div className="flex items-center justify-center w-11 h-11 rounded-[10px] mb-3" style={{ backgroundColor: "#0b2b4a" }}>
                  <Icon className="w-5 h-5" style={{ color: "#f5ca3a" }} />
                </div>
                <div className="text-sm font-bold text-gray-900">{title}</div>
                <div className="mt-1 text-xs text-gray-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <div className="text-xs text-gray-600">Ready to transform your clinic operations?</div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new Event("zeva:open-demo-popup"));
            }}
            className="mt-3 inline-flex items-center justify-center px-5 py-2 rounded-xl bg-yellow-300 text-gray-900 font-semibold text-sm hover:bg-yellow-400 transition-all"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </section>
  );
}
