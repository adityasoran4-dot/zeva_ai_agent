import type { ReactElement, ReactNode } from "react";
import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

import LandingContent from "./LandingContent";
import MarketplaceSection from "../../components/bussiness/MarketplaceSection";
import TeamSection from "../../components/bussiness/TeamSection";
import FinanceSection from "../../components/bussiness/FinanceSection";

/* ================= PAGE ================= */

export default function BussinessLandingPage(): ReactElement {
  /* ===== HEADER STATES ===== */
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
  const [isRegisterDropdownOpen, setIsRegisterDropdownOpen] = useState(false);

  const dashboardDropdownRef = useRef<HTMLDivElement>(null);
  const registerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dashboardDropdownRef.current &&
        !dashboardDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDashboardDropdownOpen(false);
      }
      if (
        registerDropdownRef.current &&
        !registerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsRegisterDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <Head>
        <title>ZEVA | Business Modules</title>
        <meta
          name="description"
          content="Pick and choose exactly what your business needs. All modules work together seamlessly."
        />
      </Head>

      {/* ================= BUSINESS HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                Z
              </div>
              <span className="text-sm font-bold text-gray-800">Zeva</span>
            </Link>

            {/* Right Side */}
            <div className="flex items-center gap-2">

              {/* Dashboard Dropdown */}
              <div className="relative" ref={dashboardDropdownRef}>
                <button
                  onClick={() =>
                    setIsDashboardDropdownOpen(!isDashboardDropdownOpen)
                  }
                  className="flex items-center gap-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-teal-700 hover:to-blue-700 transition shadow-md"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span>Dashboard</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isDashboardDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDashboardDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <Link
                      href="/clinic/login-clinic"
                      onClick={() => setIsDashboardDropdownOpen(false)}
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Health Center
                    </Link>
                    <Link
                      href="/doctor/login"
                      onClick={() => setIsDashboardDropdownOpen(false)}
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Doctor Login
                    </Link>
                  </div>
                )}
              </div>

              {/* Register Dropdown */}
              <div className="relative" ref={registerDropdownRef}>
                <button
                  onClick={() =>
                    setIsRegisterDropdownOpen(!isRegisterDropdownOpen)
                  }
                  className="flex items-center gap-1 border-2 border-yellow-400 text-yellow-600 px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-400 hover:text-white transition shadow-md"
                >
                  <div className="w-1.5 h-1.5 bg-current rounded-full" />
                  <span>Register</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isRegisterDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isRegisterDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <Link
                      href="/clinic/register-clinic"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Health Center
                    </Link>
                    <Link
                      href="/doctor/doctor-register"
                      onClick={() => setIsRegisterDropdownOpen(false)}
                      className="block px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Doctor
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* ================= PAGE CONTENT ================= */}
      <LandingContent includeHead={false} embedded />

      <MarketplaceSection />
      <TeamSection />
      <FinanceSection />
    </>
  );
}

BussinessLandingPage.getLayout = (page: ReactNode) => page;
