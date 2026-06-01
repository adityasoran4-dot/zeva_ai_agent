"use client";
import React, { useState, useEffect } from "react";
import Head from "next/head";
import axios from "axios";
import { 
  PhoneOff, 
  UserCheck, 
  AlertTriangle, 
  Timer, 
  Bell, 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  ArrowRight,
  Star,
  TrendingUp,
  TrendingDown,
  XCircle,
  Users,
  BarChart3,
  Plug,
  Workflow,
  DollarSign,
  Zap,
  Loader2
} from "lucide-react";

/* ─────────────────────────────── CUSTOM ICONS ─────────────────────────────── */

const CheckCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

/* ─────────────────────────────── NAVBAR ─────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white/95 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between h-20">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-extrabold text-base">Z</span>
          </div>
          <span className="font-extrabold text-2xl text-[#0B5FFF]">
            ZEVA <span className="font-normal text-gray-500 text-base">CRM</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-10">
          <button 
            onClick={() => scrollToSection('features')}
            className="text-gray-600 hover:text-[#0B5FFF] transition-colors font-medium text-base cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('results')}
            className="text-gray-600 hover:text-[#0B5FFF] transition-colors font-medium text-base cursor-pointer"
          >
            Results
          </button>
          <button 
            onClick={() => scrollToSection('reviews')}
            className="text-gray-600 hover:text-[#0B5FFF] transition-colors font-medium text-base cursor-pointer"
          >
            Reviews
          </button>
        </div>

        {/* CTA buttons */}
        <div className="flex items-center gap-4">
          <a
            href="https://wa.me/971502983757"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#25D366] text-[#25D366] text-sm font-medium hover:bg-[#25D366] hover:text-white transition-all"
          >
            <span className="w-4 h-4 text-[#25D366] hover:text-white transition-colors duration-200">
              <MessageCircle className="w-4 h-4" />
            </span>
            WhatsApp
          </a>
          <a
            href="#audit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B5FFF] text-white text-sm font-medium hover:bg-[#0B5FFF]/90 transition-all"
          >
            Free Audit
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────── HERO ─────────────────────────────── */
function HeroSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-100 bg-blue-50 text-sm font-medium text-blue-700">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Trusted by 100+ Clinics Across World
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              You&apos;re Losing{" "}
              <span className="text-[#0B5FFF] relative">
                20–40%
                <span className="absolute -bottom-1 left-0 right-0 h-2 bg-blue-100 rounded-full -z-10" />
              </span>{" "}
              of Your Patients Without Realizing It
            </h1>

            <p className="text-lg md:text-xl text-gray-600">
              Discover where your clinic is losing revenue and fix it in 7 days with automation
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 group">
              <a
                href="#audit"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0B5FFF] hover:bg-[#0B5FFF]/90 text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-base"
              >
                Get Free Clinic Growth Audit
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/971502983757"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-[#25D366] text-[#25D366] hover:text-white font-semibold rounded-lg border border-[#25D366] transition-all duration-200 hover:shadow-md text-base"
              >
                <span className="w-5 h-5 text-[#25D366] group-hover:text-white transition-colors duration-200">
                  <MessageCircle className="w-5 h-5" />
                </span>
                Chat on WhatsApp
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Setup in 5 Minutes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancel Anytime
              </span>
            </div>
          </div>

          {/* Right - Hero visual */}
          <div className="relative hidden md:block">
            {/* Main image area */}
            <div className="rounded-2xl shadow-2xl overflow-hidden border-8 border-white relative w-full h-auto">
              <img 
                src="/la.jpg"
                alt="ZEVA CRM Dashboard" 
                className="w-full h-auto object-cover min-h-[400px]"
              />
              
              {/* Notification card - top right */}
              <div className="absolute -top-4 -right-4 z-10 bg-white rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-[240px]">
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Patient Reminder Sent</div>
                  <div className="text-sm text-gray-500">Appointment in 24 hours</div>
                </div>
              </div>

              {/* Bottom notification */}
              <div className="absolute -bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-[260px]">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Missed Call → Auto Follow-up Sent</div>
                    <div className="text-sm text-gray-500 mt-0.5">Patient reminded via WhatsApp</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── REALITY CHECK ─────────────────────────────── */
function RealityCheckSection() {
  const problems = [
    {
      icon: <PhoneOff className="w-6 h-6" />,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      title: "Missed Calls → Lost Patients",
      desc: "Every missed call is a patient choosing your competitor. You're losing 5-10 patients daily.",
      highlighted: false,
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      title: "No Follow-ups → No Repeat Visits",
      desc: "Without automated reminders, 40% of patients never return for their next appointment.",
      highlighted: true,
    },
    {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: "bg-yellow-50",
      iconColor: "text-yellow-500",
      title: "Staff Overload → Mistakes & Delays",
      desc: "Your staff is drowning in manual tasks, leading to booking errors and frustrated patients.",
      highlighted: false,
    },
    {
      icon: <Timer className="w-6 h-6" />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      title: "Manual Work → Wasted Time",
      desc: "3-5 hours daily spent on tasks that could be automated. That's ₹50,000+ in lost productivity monthly.",
      highlighted: false,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-red-50 text-red-500 text-sm font-semibold tracking-wide mb-6">
          The Reality Check
        </div>
        <h2 className="text-4xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          Where Your Clinic is{" "}
          <span className="text-red-600">Losing Money</span>
          <br />Every Day
        </h2>
        <p className="text-gray-500 text-lg mb-14 max-w-2xl mx-auto">
          Most clinic owners don't realize these silent profit killers are costing them lakhs in revenue
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 text-left transition-all duration-300 bg-white border hover:border-[#0B5FFF] hover:shadow-2xl hover:-translate-y-1  "border-[#0B5FFF] shadow-md" : "border-gray-100"}`}
              
            >
              <div className={`w-12 h-12 rounded-xl ${p.iconBg} ${p.iconColor} flex items-center justify-center mb-6`}>
                {p.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-3">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-gray-700 font-medium text-lg">
          Sound familiar? You&apos;re not alone.{" "}
          <span className="text-blue-600 font-semibold">But there&apos;s a solution.</span>
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────── SOLUTION ─────────────────────────────── */
function SolutionSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Auto WhatsApp Follow-ups",
      desc: "Never miss a patient. Automated reminders and follow-ups sent instantly via WhatsApp.",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Appointment Reminders",
      desc: "Reduce no-shows by 40% with smart, timely appointment reminders that patients actually see.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Lead Tracking Dashboard",
      desc: "See exactly where patients come from and which marketing channels actually work.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Staff Task Automation",
      desc: "Free up 3-5 hours daily. Let ZEVA handle the repetitive work while staff focus on patients.",
      highlighted: true,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white" id="solution">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-6">
          The ZEVA Solution
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-5 leading-tight">
          One System to Fix{" "}
          <span className="text-blue-600">Everything</span>
          <br />Automatically
        </h2>
        <p className="text-gray-500 text-lg mb-16 max-w-2xl mx-auto">
          ZEVA automates your front desk, follow-ups, and entire patient journey so you can focus on what matters—providing excellent care
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => setActiveFeature(i)}
              className={`relative rounded-2xl p-8 text-left cursor-pointer transition-all duration-300 bg-white border hover:border-[#0B5FFF] hover:shadow-xl hover:-translate-y-1  "border-[#0D47A1] shadow-md" : "border-gray-100"}`}
              
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-6 text-white">
                {f.icon}
              </div>
              <h3
                className={`font-bold text-lg mb-3 ${
                  activeFeature === i || f.highlighted ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-10">
          {features.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveFeature(i)}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                activeFeature === i ? "bg-blue-600 w-8" : "bg-gray-300 w-2.5"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── RESULTS ─────────────────────────────── */
function ResultsSection() {
  const stats = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      iconBg: "bg-green-500",
      value: "+30%",
      valueColor: "text-green-500",
      label: "Increase in Bookings",
      desc: "More patients booking appointments every month",
      highlighted: true,
      hoverBorder: "hover:border-green-400",
      hoverShadow: "rgba(34,197,94,0.15)",
      activeBg: "bg-green-50/60",
      activeBorder: "border-green-300",
      bottomBar: "bg-green-500",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      iconBg: "bg-blue-500",
      value: "-40%",
      valueColor: "text-blue-500",
      label: "No-Show Reduction",
      desc: "Fewer missed appointments means more revenue",
      highlighted: false,
      hoverBorder: "hover:border-blue-400",
      hoverShadow: "rgba(59,130,246,0.15)",
      activeBg: "bg-blue-50/60",
      activeBorder: "border-blue-300",
      bottomBar: "bg-blue-500",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      iconBg: "bg-purple-500",
      value: "3-5hrs",
      valueColor: "text-purple-500",
      label: "Save Daily",
      desc: "Free up your staff for patient care, not admin work",
      highlighted: false,
      hoverBorder: "hover:border-purple-400",
      hoverShadow: "rgba(168,85,247,0.15)",
      activeBg: "bg-purple-50/60",
      activeBorder: "border-purple-300",
      bottomBar: "bg-purple-500",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      iconBg: "bg-orange-500",
      value: "2-3x",
      valueColor: "text-orange-500",
      label: "Increase Monthly Revenue",
      desc: "Average clinics see 2-3x ROI within first 3 months",
      highlighted: false,
      hoverBorder: "hover:border-orange-400",
      hoverShadow: "rgba(249,115,22,0.15)",
      activeBg: "bg-orange-50/60",
      activeBorder: "border-orange-300",
      bottomBar: "bg-orange-500",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white" id="results">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-sm font-semibold tracking-wide mb-6">
          Proven Results
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
          Real Results <span className="text-blue-600">Clinics Are Seeing</span>
        </h2>
        <p className="text-gray-500 text-lg mb-14 max-w-2xl mx-auto">
          Don't just take our word for it—these are the actual results our clinic partners are achieving
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl p-6 text-left transition-all duration-300 ease-out bg-white border overflow-hidden
                ${s.highlighted
                  ? `${s.activeBorder} ${s.activeBg} shadow-md`
                  : "border-gray-100"
                }
                ${s.hoverBorder} hover:-translate-y-2 hover:shadow-xl`}
              style={{
                boxShadow: s.highlighted
                  ? `0 4px 20px ${s.hoverShadow}`
                  : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center mb-5 text-white`}>
                {s.icon}
              </div>

              {/* Value */}
              <div className={`text-4xl font-extrabold mb-2 ${s.valueColor}`}>{s.value}</div>

              {/* Label */}
              <div className="font-bold text-gray-900 text-base mb-2">{s.label}</div>

              {/* Description */}
              <div className="text-gray-500 text-sm leading-relaxed">{s.desc}</div>

              {/* Bottom color bar — always visible on highlighted, appears on hover for others */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 ${s.bottomBar} transition-all duration-300 rounded-b-2xl
                  ${s.highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              />
            </div>
          ))}
        </div>

        {/* Testimonial quote */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 max-w-3xl mx-auto">
          <p className="text-gray-800 font-medium text-xl leading-relaxed mb-7">
            "ZEVA paid for itself in the first month. We're now seeing 25 more patients weekly without hiring extra staff."
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">
              DR
            </div>
            <div className="text-left">
              <div className="font-bold text-gray-900 text-base">Dr. Rajesh Kumar</div>
              <div className="text-gray-500 text-sm">Dental Clinic, Mumbai</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── ROI / COMPARISON ─────────────────────────────── */
function ROISection() {
  return (
    <section className="py-24 bg-gradient-to-b from-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-600 text-sm font-bold uppercase tracking-wide mb-6">
          Clear ROI
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5">
          ZEVA Doesn't Cost You Money
          <br />
          <span className="text-green-500">— It Makes You Money</span>
        </h2>
        <p className="text-gray-500 text-lg mb-14 max-w-2xl mx-auto">
          See the difference automation makes in your clinic's daily operations and bottom line
        </p>

        {/* Comparison table */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          {/* Without ZEVA */}
          <div className="rounded-2xl bg-red-50/40 p-8 text-left" style={{ boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Without ZEVA</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Missed patient calls go unanswered",
                "Manual appointment reminders (if any)",
                "No tracking of patient sources",
                "Staff overwhelmed with admin tasks",
                "20-40% revenue leakage monthly",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-base text-gray-600">
                  <XCircle className="w-5 h-5 text-red-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-red-200">
              <span className="text-red-500 font-semibold text-base">Result: Revenue Leakage &amp; Missed Opportunities</span>
            </div>
          </div>

          {/* With ZEVA */}
          <div className="rounded-2xl bg-blue-600 p-8 text-left">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg">With ZEVA</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Every call automatically followed up via WhatsApp",
                "Automated reminders 24hrs before appointment",
                "Complete visibility on where patients come from",
                "Staff focuses on patient care, not paperwork",
                "Capture every opportunity, maximize bookings",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-base text-blue-100">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-blue-500">
              <span className="text-white font-semibold text-base">Result: Maximum Revenue &amp; Growth 🚀</span>
            </div>
          </div>
        </div>

        {/* Economics */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-10">
          <h3 className="font-bold text-gray-900 text-xl mb-8">Average Clinic Economics with ZEVA</h3>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Monthly Investment</div>
              <div className="text-3xl font-extrabold text-gray-900">₹3,500</div>
              <div className="text-sm text-gray-400 mt-1">ZEVA subscription</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Additional Revenue</div>
              <div className="text-3xl font-extrabold text-green-600">₹35,000</div>
              <div className="text-sm text-gray-400 mt-1">From recovered patients</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">Net Profit Increase</div>
              <div className="text-3xl font-extrabold text-blue-600">2-3x ROI</div>
              <div className="text-sm text-gray-400 mt-1">Within 3 months</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── WHATSAPP CTA ─────────────────────────────── */
function WhatsAppCTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-[#25D366] to-[#1DA851] relative overflow-hidden">
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
      />

      <div className="relative max-w-4xl mx-auto px-6 sm:px-10 text-center">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-7 shadow-lg">
          <div className="text-green-500 scale-150">
            <MessageCircle className="w-10 h-10" />
          </div>
        </div>

        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">
          Want to See How This Works for Your Clinic?
        </h2>
        <p className="text-green-100 text-lg mb-10">
          Chat with us on WhatsApp right now. Get instant answers and see a live demo of ZEVA in action.
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {["Instant Response", "No Obligation", "Free Consultation"].map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/30 bg-white/10 text-white text-base font-medium"
            >
              <Zap className="w-4 h-4" />
              {tag}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/971502983757"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-green-50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-base"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp Now →
          </a>
          <a
            href="#audit"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-200 text-base"
          >
            Get Free Audit
          </a>
        </div>

        <p className="mt-7 text-green-100 text-sm flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          Over 100+ clinic owners have already reached out this month
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────── HOW IT WORKS ─────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      num: 1,
      icon: <Plug className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-blue-500 to-[#0B5FFF]",
      title: "Connect Your Clinic",
      desc: "Simple 5-minute setup. No technical knowledge required. We'll guide you through everything.",
      dot: "bg-blue-400",
    },
    {
      num: 2,
      icon: <Workflow className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-purple-500 to-pink-500",
      title: "ZEVA Automates Everything",
      desc: "Our AI takes over repetitive tasks—follow-ups, reminders, lead tracking. All on autopilot.",
      dot: "bg-purple-400",
    },
    {
      num: 3,
      icon: <TrendingUp className="w-8 h-8 text-white" />,
      bg: "bg-gradient-to-br from-green-500 to-emerald-500",
      title: "You Get More Patients",
      desc: "Watch your bookings increase, no-shows drop, and revenue grow. It's that simple.",
      dot: "bg-green-400",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-6">
          Simple Process
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
          How It Works in{" "}
          <span className="bg-gradient-to-r from-blue-600 to-[#0B5FFF] bg-clip-text text-transparent">3 Simple Steps</span>
        </h2>
        <p className="text-gray-500 text-lg mb-16">
          From setup to success in less time than it takes to see one patient
        </p>

        <div className="space-y-0 relative">
          {/* Vertical line */}
          <div className="absolute left-[44px] top-16 bottom-16 w-0.5 bg-gray-200 hidden sm:block" />

          {steps.map((step, i) => (
            <div 
              key={i} 
              className="group relative flex items-start gap-8 text-left pb-12 last:pb-0"
            >
              {/* Step icon */}
              <div className="relative flex-shrink-0 transform transition-all duration-500 ease-out group-hover:translate-x-2">
                <div className={`w-[80px] h-[80px] rounded-2xl ${step.bg} flex items-center justify-center shadow-xl z-10 relative`}>
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gray-200 rounded-full text-sm font-bold text-gray-700 flex items-center justify-center z-20 shadow-sm">
                  {step.num}
                </span>
              </div>

              {/* Content */}
              <div className="pt-4 flex-1 transform transition-all duration-500 ease-out group-hover:translate-x-2">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{step.desc}</p>
              </div>

              {/* Dot */}
              <div className={`absolute right-0 top-9 w-3.5 h-3.5 ${step.dot} rounded-full hidden sm:block transition-transform duration-300 group-hover:scale-125`} />
            </div>
          ))}
        </div>

        <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full text-sm font-medium text-gray-700 border border-blue-100">
          <Zap className="w-4 h-4 text-blue-600" />
          Most clinics are fully operational within 24 hours
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── REVIEWS / TESTIMONIALS ─────────────────────────────── */
function ReviewsSection() {
  const testimonials = [
    {
      stars: 5,
      quote:
        "We were losing so many patients to missed calls. ZEVA's automated WhatsApp follow-ups recovered 30+ patients in the first month alone. Best investment we've made.",
      metric: "30+ patients recovered",
      name: "Dr. Priya Sharma",
      role: "Pediatric Clinic Owner, Bangalore",
      image: "/doctor1.jpg", // Replace with actual doctor photo
      featured: false,
    },
    {
      stars: 5,
      quote:
        "Our no-show rate dropped from 35% to 12% in just 6 weeks. The automated reminders work like magic. My staff now has time to actually care for patients.",
      metric: "65% reduction in no-shows",
      name: "Dr. Arun Patel",
      role: "Multi-Specialty Clinic, Mumbai",
      image: "/doctor2.jpg", // Replace with actual doctor photo
      featured: true,
    },
    {
      stars: 5,
      quote:
        "The dashboard gives me complete visibility of where my patients come from. I cut 40% of wasted marketing spend and doubled down on what works. ROI is insane.",
      metric: "2.5x ROI in 3 months",
      name: "Dr. Vikram Reddy",
      role: "Dental Practice, Hyderabad",
      image: "/doctor3.jpg", // Replace with actual doctor photo
      featured: false,
    },
  ];

  return (
    <section className="py-24 bg-gray-50" id="reviews">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full bg-yellow-50 text-yellow-600 text-sm font-semibold tracking-wide mb-6">
          Success Stories
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-tight">
          Trusted by{" "}
          <span className="text-blue-600">Leading Clinics</span>
          <br />Across World
        </h2>
        <p className="text-gray-500 text-lg mb-14 max-w-2xl mx-auto">
          Real doctors, real results. See what clinic owners are saying about ZEVA
        </p>

        {/* Testimonial cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl p-8 text-left transition-all duration-300 overflow-hidden bg-white
                ${t.featured ? "border border-[#0B5FFF] shadow-md" : "border border-gray-200"}
                hover:border-[#0B5FFF] hover:shadow-xl`}
              style={{ boxShadow: t.featured ? undefined : "0 1px 3px rgba(0,0,0,0.06)" }}
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Large decorative quote mark - top right */}
              <div className="absolute top-4 right-4 text-6xl font-serif text-blue-200 group-hover:text-[#0B5FFF] group-hover:opacity-20 transition-all duration-300 select-none pointer-events-none">
                &rdquo;
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-5 relative z-10">
                {Array.from({ length: t.stars }).map((_, si) => (
                  <Star key={si} className="w-5 h-5" fill="#FBBF24" color="#FBBF24" />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-gray-700 text-base leading-relaxed mb-6 relative z-10">
                {t.quote}
              </blockquote>

              {/* Metric badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold mb-6 relative z-10">
                <TrendingUp className="w-4 h-4" />
                {t.metric}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100 relative z-10">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm relative">
                  {/* Use this when you have actual images */}
                  {/* <img src={t.image} alt={t.name} className="w-full h-full object-cover" /> */}
                  {/* Placeholder until images are added */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-base">{t.name}</div>
                  <div className="text-gray-500 text-sm">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Before / After stats */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-10 text-white">
          <h3 className="font-bold text-xl mb-8">Average Results Across 100+ Clinics</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-xl bg-white/10 p-6 text-left">
              <div className="font-bold text-base mb-4 text-blue-100">Before ZEVA</div>
              <ul className="space-y-3">
                {["35-40% no-show rate", "20-30 patients monthly loss", "5+ hours daily on admin"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-base text-red-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white/10 p-6 text-left">
              <div className="font-bold text-base mb-4 text-green-200">After ZEVA</div>
              <ul className="space-y-3">
                {["12-15% no-show rate", "25+ new patients monthly", "Less than 1 hour on admin"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-base text-green-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── FINAL CTA / HERO CTA ─────────────────────────────── */
function FinalCTASection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#0B5FFF] via-[#0846B3] to-[#062f8a] relative overflow-hidden">
      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-6 sm:px-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-9">
          <Zap className="w-4 h-4" />
          Limited Time Offer
        </div>

        <h2 className="text-5xl sm:text-6xl font-extrabold text-white mb-7 leading-tight">
          Stop Losing Patients.
          <br />
          <span className="text-yellow-400">Start Growing Your Clinic.</span>
        </h2>

        <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
          Get your free clinic growth audit and discover exactly how much revenue you're leaving on the table
        </p>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200 font-medium mb-10">
          <span className="flex items-center gap-2"><Zap className="w-4 h-4" />100% Secure</span>
          <span className="flex items-center gap-2"><Zap className="w-4 h-4" />5-Min Setup</span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4" />Cancel Anytime</span>
        </div>

        <a
          href="#audit"
          className="inline-flex items-center gap-2 px-10 py-5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 text-lg"
        >
          Get Free Clinic Growth Audit →
        </a>

        {/* Scarcity */}
        <div className="mt-6">
          <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-400 text-gray-900 font-bold text-base">
            <Zap className="w-5 h-5" />
            Only 15 Free Audits Available This Week
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-3 gap-8 border-t border-white/20 pt-12">
          <div>
            <div className="text-4xl font-extrabold text-white">100+</div>
            <div className="text-blue-200 text-base mt-1">Active Clinics</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">5000+</div>
            <div className="text-blue-200 text-base mt-1">Patients Recovered</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-white">2-3x</div>
            <div className="text-blue-200 text-base mt-1">Average ROI</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── AUDIT FORM ─────────────────────────────── */
function AuditFormSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", clinic: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.post("/api/zeva-leads", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        clinicName: form.clinic,
        source: "India Landing Page - Audit Form",
      });
      
      if (data.success) {
        setSubmitted(true);
        setForm({ name: "", email: "", phone: "", clinic: "" });
      } else {
        setError(data.message || "Failed to submit request.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden" id="audit">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block px-5 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-6">
            Free Audit - No Credit Card Required
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Get Your Free{" "}
            <span className="text-blue-600">Clinic Growth Audit</span>
          </h2>
          <p className="text-gray-500 text-lg mb-12 max-w-xl mx-auto">
            Fill in your details and we&apos;ll analyze exactly where your clinic is losing revenue
          </p>

          <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-xl p-8 md:p-10 text-left">
            {submitted ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Audit Request Received!</h3>
                <p className="text-gray-500 text-base leading-relaxed">We&apos;ll reach out to you on WhatsApp within 24 hours with your personalized clinic growth audit.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="Dr. Amit Kumar"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-800 placeholder-gray-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <input
                      required
                      type="email"
                      placeholder="doctor@clinic.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-800 placeholder-gray-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-800 placeholder-gray-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">
                    Clinic Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="Apollo Dental Clinic"
                      value={form.clinic}
                      onChange={(e) => setForm({ ...form, clinic: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-800 placeholder-gray-400 transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Trust chips */}
                <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-xl bg-blue-50/60 border border-blue-100">
                  {["Secure & Private", "Quick Setup"].map((item) => (
                    <span key={item} className="flex items-center gap-1.5 text-sm text-green-700 font-semibold">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </span>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-10 rounded-md px-6 has-[>svg]:px-4 w-full bg-[#0B5FFF] hover:bg-[#0952CC] text-white py-6 text-lg font-semibold group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Get My Free Audit 
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-3 text-xs text-red-500 font-medium text-center">
                    {error}
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 leading-relaxed">
                  By submitting, you agree to receive communications from ZEVA. We respect your privacy and never share your data.
                </p>
              </form>
            )}
          </div>

          {/* Social proof below form */}
          <div className="mt-10 text-center">
            <p className="text-base text-gray-600 font-medium mb-3">Join 100+ clinic owners who have already grown with ZEVA</p>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5" fill="#FBBF24" color="#FBBF24" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── FOOTER ─────────────────────────────── */
function Footer() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid sm:grid-cols-3 gap-12 pb-12 border-b border-gray-800">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-extrabold text-base">Z</span>
              </div>
              <span className="font-extrabold text-white text-xl">
                ZEVA <span className="font-normal text-gray-400 text-base">CRM</span>
              </span>
            </div>
            <p className="text-base leading-relaxed mb-6">
              India&apos;s #1 healthcare CRM platform helping clinics automate their operations, recover lost patients, and grow their revenue effortlessly.
            </p>
            <div className="flex gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-900/50 text-green-400 text-sm font-semibold border border-green-800">
                <CheckCircleIcon className="w-4 h-4" />100% Secure
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/50 text-blue-400 text-sm font-semibold border border-blue-800">
                <CheckCircleIcon className="w-4 h-4" />ISO Certified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-base mb-5">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollToSection('features')} className="text-base hover:text-white transition-colors cursor-pointer">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('results')} className="text-base hover:text-white transition-colors cursor-pointer">
                  Results
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('reviews')} className="text-base hover:text-white transition-colors cursor-pointer">
                  Success Stories
                </button>
              </li>
              <li>
                <a href="#audit" className="text-base hover:text-white transition-colors">
                  Free Audit
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold text-base mb-5">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-base">
                <MessageCircle className="w-5 h-5" />
                <a href="https://wa.me/971502983757" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-3 text-base">
                <MailIcon />
                <a href="mailto:support@zeva.com" className="hover:text-white transition-colors">
                  support@zeva.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-base">
                <MapPinIcon />
                <span>Mumbai, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; 2026 ZEVA CRM. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="/refund" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────── FLOATING WHATSAPP ─────────────────────────────── */
function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/971502983757"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}

/* ─────────────────────────────── EXIT INTENT POPUP ─────────────────────────────── */
function ExitIntentPopup() {
  const [_isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup immediately on page load for demo
    // In production, you might want to show it on exit intent or after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000); // Show after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Popup disabled - returning null
  return null;
}

/* ─────────────────────────────── PAGE ─────────────────────────────── */
export default function ClinicLanding() {
  return (
    <>
      <Head>
        <title>ZEVA CRM – Stop Losing Patients. Start Growing Your Clinic.</title>
        <meta name="description" content="ZEVA helps clinics automate follow-ups, reduce no-shows by 40%, and grow revenue with intelligent automation. Get your free clinic growth audit today." />
        {/* NO INDEX - this is a landing page not for search engines */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="font-sans antialiased bg-white overflow-x-hidden">
        <Navbar />
        <main>
          <HeroSection />
          <RealityCheckSection />
          <SolutionSection />
          <ResultsSection />
          <ROISection />
          <WhatsAppCTASection />
          <HowItWorksSection />
          <ReviewsSection />
          <FinalCTASection />
          <AuditFormSection />
        </main>
        <Footer />
        <FloatingWhatsApp />
        <ExitIntentPopup />
      </div>
    </>
  );
}
