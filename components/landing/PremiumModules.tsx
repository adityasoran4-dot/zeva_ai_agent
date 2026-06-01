import React from "react";
import { Calendar, UserCircle2, CreditCard, Package } from "lucide-react";

export default function PremiumModules() {
  return (
    <section className="w-full bg-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="flex justify-center mt-2 mb-4">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-gray-200 bg-white shadow-sm text-sm text-yellow-700">
              <span>Premium Modules</span>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0b2b4a]">
            Everything You Need in{" "}
            <span className="text-yellow-400">One Platform</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Powerful features designed specifically for UAE healthcare practices
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-[#0b2b4a] font-semibold">Smart Appointments</div>
            <div className="text-sm text-gray-600 mt-2 leading-relaxed">
              Automated scheduling, reminders, and calendar sync with real-time availability
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserCircle2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-[#0b2b4a] font-semibold">Patient Profiles</div>
            <div className="text-sm text-gray-600 mt-2 leading-relaxed">
              Comprehensive patient records, history tracking, and intelligent insights
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="text-[#0b2b4a] font-semibold">Memberships</div>
            <div className="text-sm text-gray-600 mt-2 leading-relaxed">
              Flexible membership plans, recurring billing, and loyalty rewards management
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
            <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 mb-6 group-hover:scale-110 transition-transform duration-300">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="text-[#0b2b4a] font-semibold">Treatment Packages</div>
            <div className="text-sm text-gray-600 mt-2 leading-relaxed">
              Customizable packages, bundle pricing, and automated package tracking
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
