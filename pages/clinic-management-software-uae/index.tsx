import React from "react";
import Head from "next/head";
import { CircleCheck, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import LandingLayout from "../../components/landing/LandingLayout";
import PremiumModules from "../../components/landing/PremiumModules";
import ImpactShowcase from "../../components/landing/ImpactShowcase";
import ClientsTestimonials from "../../components/landing/ClientsTestimonials";
import FeaturesGrid from "../../components/landing/FeaturesGrid";
import PricingPlans from "../../components/landing/PricingPlans";
import DemoBookingSection from "../../components/landing/DemoBookingSection";
import DemoFAQ from "../../components/landing/DemoFAQ";

const LandingPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Zeva — Healthcare Management Platform</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <LandingLayout>
        <section className="relative bg-gradient-to-br from-[#0A1F44] via-[#0D2951] to-[#0A1F44] text-white pb-44 md:pb-52">
          <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-sm font-semibold">Limited Offer</span>
                  <span className="opacity-80">
                    3 Months Free for Early Adopters
                  </span>
                </div>
                <h1 className="mt-10 text-4xl md:text-5xl  lg:text-6xl font-bold mb-6 leading-[1.33]">
                  Transform Your Clinic{"\u00A0"}
                  <span className="text-transparent bg-clip-text  bg-gradient-to-r from-[#D4AF37] to-[#F0D98C]">
                    Operations & Growth
                  </span>
                  {"\u00A0"}with Zeva
                </h1>
                <p className="mt-5 text-lg md:text-xl text-gray-300 max-w-2xl">
                  Join 500+ Dubai clinics who increased revenue by 60% and
                  patient satisfaction by 40% in their first 90 days with{" "}
                  <span className="text-yellow-300">
                    Zeva Clinic Management System
                  </span>
                  .
                </p>
                <ul className="mt-8 space-y-5 text-sm">
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-5 h-5 text-yellow-400 shrink-0" />
                    <span>
                      Set up in 24 hours • Start accepting bookings tomorrow
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-5 h-5 text-yellow-400  shrink-0" />
                    <span>Zero learning curve • Your team will love it</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CircleCheck className="w-5 h-5 text-yellow-400 shrink-0" />
                    <span>
                      ROI guaranteed • Pay for itself in 30 days or money back
                    </span>
                  </li>
                </ul>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new Event("zeva:open-demo-popup"));
                    }}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-primary/90 rounded-md has-[>svg]:px-4 bg-gradient-to-r from-[#D4AF37] to-[#F0D98C] text-[#0A1F44] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-300 h-11 px-6 text-sm font-bold"
                  >
                    Get Started Free • No Credit Card
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-blue-100">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="w-4 h-4 text-emerald-400" />
                    <span>No setup fees</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CircleCheck className="w-4 h-4 text-emerald-400" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative rounded-2xl bg-white text-gray-900 shadow-2xl p-5 border border-blue-100">
                  <div className="absolute -top-6 -right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm animate-[bounce_1.9s_ease-in-out_infinite]">
                    ✓ Live Now
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="w-3 h-3 rounded-full bg-yellow-400" />
                      <span className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-md h-8 px-3 flex items-center text-xs text-gray-600">
                        app.zeva.ae/dashboard
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="border border-gray-200 rounded-md p-3">
                      <div className="text-[10px] text-gray-500">Today</div>
                      <div className="text-lg font-bold">48</div>
                    </div>
                    <div className="border border-gray-200 rounded-md p-3">
                      <div className="text-[10px] text-gray-500">Revenue</div>
                      <div className="text-lg font-bold">AED 12K</div>
                    </div>
                    <div className="border border-gray-200 rounded-md p-3">
                      <div className="text-[10px] text-gray-500">Patients</div>
                      <div className="text-lg font-bold">156</div>
                    </div>
                  </div>
                  <div className="mt-4 h-28 bg-gray-50 border border-gray-200 rounded-md flex items-end gap-2 px-3 pb-3">
                    {[24, 36, 32, 48, 56].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-yellow-300 to-yellow-200 rounded-sm"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 border border-gray-200 rounded-md p-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-yellow-100" />
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded w-5/6" />
                          <div className="mt-2 h-2 bg-gray-100 rounded w-4/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute -bottom-4 left-4 animate-[bounce_1.8s_ease-in-out_infinite]">
                    <div className="rounded-xl bg-white/95 backdrop-blur shadow-2xl border-2 border-[#F0D98C] px-4 py-3">
                      <div className="text-[11px] text-gray-600">
                        Monthly Revenue
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-green-600 font-extrabold text-lg">
                          +60%
                        </span>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-sky-500 shadow">
                          <TrendingUp className="w-3.5 h-3.5 text-white" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-0 right-0 bottom-24 md:bottom-20 z-10">
            <div className="max-w-5xl mx-auto px-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-1">
                    500+
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Active Clinics
                  </div>
                  <div className="text-xs text-gray-400 mt-1">and growing</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-1">
                    99.9%
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Uptime SLA
                  </div>
                  <div className="text-xs text-gray-400 mt-1">guaranteed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-1">
                    2M+
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Appointments
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    booked monthly
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-1">
                    &lt;2hrs
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Setup Time
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    avg. onboarding
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none">
            <svg
              viewBox="0 0 1440 120"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full block h-32 md:h-36"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0 120 C 240 110 480 85 720 75 C 960 65 1200 80 1440 90 L1440 120 L0 120 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </section>
        <PremiumModules />
        <ImpactShowcase />
        <ClientsTestimonials />
        <FeaturesGrid />
        <PricingPlans />
        <DemoBookingSection />
        <DemoFAQ />
      </LandingLayout>
    </>
  );
};

// @ts-expect-error - getLayout added dynamically
LandingPage.getLayout = (page: React.ReactNode) => page;

export default LandingPage;
