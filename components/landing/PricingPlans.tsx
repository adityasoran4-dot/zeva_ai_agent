import React from "react";
import { Zap, Crown, Building2, CheckCircle, Check } from "lucide-react";

export default function PricingPlans() {
  const starterFeatures = [
    "Up to 200 appointments/month",
    "1 clinic location",
    "3 staff accounts",
    "Patient profiles & history",
    "Online booking widget",
    "SMS & email reminders",
    "Basic reporting",
    "Email support",
  ];

  const professionalFeatures = [
    "Unlimited appointments",
    "Up to 3 locations",
    "10 staff accounts",
    "Memberships & packages",
    "Advanced analytics",
    "Marketing automation",
    "WhatsApp integration",
    "Custom branding",
    "Priority support",
    "Free onboarding",
  ];

  const enterpriseFeatures = [
    "Unlimited everything",
    "Unlimited locations",
    "Unlimited staff",
    "Dedicated account manager",
    "Custom integrations",
    "API access",
    "24/7 phone support",
    "SLA guarantee",
  ];

  return (
    <section id="pricing" className="w-full bg-white py-16 scroll-mt-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-xs text-gray-700">
            Transparent Pricing
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold">
            <span className="text-[#0b2b4a]">Plans That Grow </span>
            <span className="text-yellow-500">With Your Clinic</span>
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            No hidden fees. No setup costs. Cancel anytime.
          </p>
          <div className="mt-4 inline-flex items-center rounded-full bg-emerald-600 text-white text-xs px-4 py-2">
            Limited Time: Get 3 Months Free on Annual Plans
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6" style={{ backgroundColor: "#0b2b4a" }}>
              <Zap className="w-6 h-6" style={{ color: "#f5ca3a" }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
            <p className="text-sm text-gray-500 mb-6">Perfect for solo practitioners and small clinics</p>
            <div className="text-3xl font-extrabold text-gray-900">AED 499<span className="text-sm font-semibold text-gray-600"> /month</span></div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event("zeva:open-demo-popup"));
              }}
              className="mt-4 inline-flex w-full items-center justify-center px-5 py-2 rounded-xl bg-[#0b2b4a] text-white font-semibold text-sm hover:opacity-90 transition-all"
            >
              Start Free Trial
            </a>
            <ul className="mt-5 space-y-2">
              {starterFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-[2px]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-3xl p-8 bg-gradient-to-br from-[#0A1F44] to-[#0D2951] text-white shadow-2xl border-2 border-[#D4AF37]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#F0D98C] text-[#0A1F44] text-xs font-semibold px-4 py-1 shadow">
              Most Popular
            </div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 mb-6">
              <Crown className="w-6 h-6 text-[#F0D98C]" />
            </div>
            <h3 className="text-2xl font-bold text-white">Professional</h3>
            <p className="text-sm text-blue-200/80 mb-6">Most popular for growing aesthetic clinics</p>
            <div className="text-3xl font-extrabold text-white">AED 999<span className="text-sm font-semibold text-blue-200"> /month</span></div>
            <div className="mt-1 text-xs font-semibold text-[#F0D98C]">Save AED 1,200/year</div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event("zeva:open-demo-popup"));
              }}
              className="mt-4 inline-flex w-full items-center justify-center px-5 py-3 rounded-lg bg-[#F0D98C] text-[#0A1F44] font-bold text-sm hover:brightness-105 transition-all gap-2"
            >
              Start Free Trial <span>→</span>
            </a>
            <ul className="mt-5 space-y-2">
              {professionalFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                  <CheckCircle className="w-4 h-4 text-[#F0D98C] mt-[2px]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6" style={{ backgroundColor: "#0b2b4a" }}>
              <Building2 className="w-6 h-6" style={{ color: "#f5ca3a" }} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
            <p className="text-sm text-gray-500 mb-6">For multi-location clinics and franchises</p>
            <div className="text-3xl font-extrabold text-gray-900">Custom</div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event("zeva:open-demo-popup"));
              }}
              className="mt-4 inline-flex w-full items-center justify-center px-5 py-2 rounded-xl bg-[#0b2b4a] text-white font-semibold text-sm hover:opacity-90 transition-all">
              Contact Sales
            </a>
            
            <ul className="mt-5 space-y-2">
              {enterpriseFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-[2px]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-emerald-200 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xl md:text-2xl font-extrabold text-[#0A1F44]">
                30-Day Money-Back Guarantee
              </div>
              <div className="text-sm text-gray-600">
                Not satisfied? Get a full refund, no questions asked.
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
           We're so confident you'll love Zeva that we offer a 30-day money-back guarantee. If you're not completely satisfied, we'll refund every penny.
          </p>
        </div>
      </div>
    </section>
  );
}
