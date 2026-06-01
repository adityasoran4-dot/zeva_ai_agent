"use client";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { Check } from "lucide-react";
import AuthModal from "./AuthModal";

export default function GetStartedCTA() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleCreateAccount = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    router.push('/agent/clinic-all-appointment');
  };

  return (
    <section className="w-full mt-1 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-3xl mt-9  bg-gradient-to-r from-blue-700 via-teal-700 to-blue-800 p-12 md:p-16 flex flex-col lg:flex-row gap-12">

          {/* LEFT CONTENT */}
          <div className="flex-1 text-white">
            <h2 className="text-3xl md:text-4xl font-semibold">
              Ready to Get Started?
            </h2>

            <p className="mt-4 text-base text-white/90 max-w-md">
              Join thousands of users managing their healthcare with ZEVA.
              It's free, secure, and takes less than 2 minutes.
            </p>

            <ul className="mt-5 space-y-4">
              {[
                "No credit card required",
                "HIPAA compliant security",
                "Cancel anytime",
                "24/7 customer support",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </span>
                  <span className="text-white text-sm">{item}</span>
                </li>
              ))}
            </ul>


            <button 
              onClick={handleCreateAccount}
              className="mt-6 inline-flex font-semibold items-center gap-3 bg-yellow-400 hover:bg-yellow-500 transition text-white font-medium px-8 py-4 rounded-xl cursor-pointer"
            >
              Create Free Account
              <span className="text-lg">→</span>
            </button>
          </div>

          {/* RIGHT STATS */}
          <div className="flex-1 grid grid-cols-1 gap-6">
            {[
              { value: "₹0", label: "Free Forever" },
              { value: "2 min", label: "Setup Time" },
              { value: "2M+", label: "Users Trust Us" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur px-8 py-4"
              >
                <div className="text-3xl font-semibold text-yellow-400">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-white/90">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Auth Modal for Registration */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode="register"
      />
    </section>
  );
}
