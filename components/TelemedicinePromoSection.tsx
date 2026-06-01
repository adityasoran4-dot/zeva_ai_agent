import React from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Lock, Users, Video } from "lucide-react";

const TelemedicinePromoSection: React.FC = () => {
  return (
    <section className="relative w-screen left-1/2 right-1/2 -translate-x-1/2 mt-10">
      {/* FULL WIDTH BACKGROUND */}
      <div className="bg-gradient-to-r from-blue-700 via-teal-800 to-blue-700">
        
        {/* CONTENT CONTAINER */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* LEFT */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden bg-white/10 border border-white/15 shadow-2xl">
                <img
                  src="/doctor.jpg"
                  alt="Telemedicine"
                  className="w-full h-[260px] sm:h-[320px] object-cover"
                />
              </div>

              {/* 24/7 Badge */}
              <div className="absolute top-2 right-2 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">24/7 Available</p>
                  <p className="text-[11px] text-gray-500">Always here for you</p>
                </div>
              </div>

              {/* Doctors Online */}
              <div className="absolute -bottom-5 right-5 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-800 to-blue-800 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-500">15K+</p>
                  <p className="text-xs text-gray-700">Doctors Online</p>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="text-white">
              <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold">
                Telemedicine Services
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold mt-4">
                Consult Doctors Online — Anytime, Anywhere
              </h2>

              <p className="text-white/85 mt-3">
                Get expert medical advice from certified doctors through secure video
                consultations. No waiting rooms, no travel time—healthcare at your convenience.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {[
                  "No waiting time",
                  "Available 24/7",
                  "Specialist doctors",
                  "Instant prescriptions",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-amber-300">✓</span> {item}
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-7">
                <Feature icon={<Video />} title="Instant Video Consult" desc="Connect with doctors in minutes" />
                <Feature icon={<FileText />} title="Secure Prescriptions" desc="Get digital prescriptions instantly" />
                <Feature icon={<FileText />} title="Digital Reports" desc="Access all reports in one place" />
                <Feature icon={<Lock />} title="Private & Secure" desc="Safe & compliant consultations" />
              </div>

              <Link
                href="/telemedicine"
                className="inline-flex mt-8 px-6 py-3 rounded-2xl bg-amber-300 text-gray-900 font-semibold hover:bg-amber-200"
              >
                Start Online Consultation →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Feature = ({ icon, title, desc }: any) => (
  <div className="rounded-2xl border border-white/20 bg-white/10 p-4 flex gap-3">
    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-white/80 mt-1">{desc}</p>
    </div>
  </div>
);

export default TelemedicinePromoSection;
