
import React from "react";

export default function BottomStats() {
  return (
    <>
      <div className="absolute left-0 right-0 bottom-8 md:bottom-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-yellow-300">500+</div>
              <div className="text-xs text-white">Active Clinics</div>
              <div className="text-[10px] text-blue-200">and growing</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-yellow-300">99.9%</div>
              <div className="text-xs text-white">Uptime SLA</div>
              <div className="text-[10px] text-blue-200">guaranteed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-yellow-300">2M+</div>
              <div className="text-xs text-white">Appointments</div>
              <div className="text-[10px] text-blue-200">booked monthly</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-yellow-300">&lt;2hrs</div>
              <div className="text-xs text-white">Setup Time</div>
              <div className="text-[10px] text-blue-200">avg. onboarding</div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-24">
          <path d="M0,40 C240,120 480,-20 720,40 C960,100 1200,60 1440,100 L1440,120 L0,120 Z" fill="#ffffff" />
        </svg>
      </div>
    </>
  );
}
