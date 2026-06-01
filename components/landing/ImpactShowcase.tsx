import React from "react";
import { TrendingUp, Users, DollarSign, Clock } from "lucide-react";

export default function ImpactShowcase() {
  return (
    <section className="w-full bg-gradient-to-br from-[#0b2b4a] via-[#0a3258] to-[#0a2040] py-16 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/10 shadow-sm text-sm text-blue-100 backdrop-blur">
            <span>Results</span>
          </div>
          <h2 className="mt-5 text-3xl md:text-4xl font-extrabold">
            See What’s Possible with <span className="text-yellow-300">Zeva</span>
          </h2>
          <p className="text-sm md:text-base text-blue-100 mt-2">
           Case Study: How Premier Aesthetic Clinic transformed their practice
          </p>
        </div>

        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8 shadow-lg shadow-black/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-yellow-300 text-gray-900 font-bold text-xs">
              PAC
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Premier Aesthetic Clinic</div>
              <div className="text-blue-200 text-xs">Dubai, UAE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/20">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-white">+165%</div>
              <div className="text-xs text-blue-100">Revenue Growth</div>
              <div className="text-[10px] text-blue-200/80">In 6 months</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/20">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 mb-4">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-white">+240%</div>
              <div className="text-xs text-blue-100">New Patients</div>
              <div className="text-[10px] text-blue-200/80">Year over year</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/20">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 mb-4">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-white">92%</div>
              <div className="text-xs text-blue-100">Retention Rate</div>
              <div className="text-[10px] text-blue-200/80">Up from 68%</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-[#D4AF37]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#D4AF37]/20">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 mb-4">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold text-white">15hrs</div>
              <div className="text-xs text-blue-100">Time Saved</div>
              <div className="text-[10px] text-blue-200/80">Per week</div>
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-5 mb-6">
            <div className="mb-2">
              {/* <Quote className="w-5 h-5 text-yellow-300" /> */}
            </div>
            <div className="text-white/90 italic text-sm leading-relaxed">
              <span className="text-yellow-300 font-bold">“</span> Zeva didn’t just improve our operations—it transformed our business model. We went from struggling with manual bookings to becoming the most booked clinic in our area. <span className="text-yellow-300 font-bold">”</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-300" />
              <div>
                <div className="text-sm font-semibold text-white">Dr. Layla Hassan</div>
                <div className="text-xs text-white/60">Medical Director, Premier Aesthetic Clinic</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-blue-100 text-sm">Ready to achieve similar results for your clinic?</div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new Event("zeva:open-demo-popup"));
              }}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-yellow-300 text-gray-900 font-semibold text-sm hover:bg-yellow-400 transition-all"
            >
              Get Your Free Strategy Session
            </a>
            <div className="text-[11px] text-white/60">30-minute consultation • No obligation • Personalized roadmap</div>
          </div>
        </div>
      </div>
    </section>
  );
}
