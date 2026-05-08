"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ClinicLogin() {
  interface ClinicLoginForm {
    email: string;
    password: string;
  }

  const [form, setForm] = useState<ClinicLoginForm>({
    email: "",
    password: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialInfo, setTrialInfo] = useState<{
    isExpired: boolean;
    daysRemaining: number;
    trialEndDate: string;
    accountCreatedAt: string;
  } | null>(null);

  // Check if redirected due to trial expiration
  useEffect(() => {
    if (router.query.trialExpired === 'true') {
      setShowTrialPopup(true);
      // Set trial info for the popup
      setTrialInfo({
        isExpired: true,
        daysRemaining: 0,
        trialEndDate: new Date().toISOString(),
        accountCreatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }, [router.query.trialExpired]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    // Basic validation
    if (!form.email.trim()) {
      setErr("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (!form.password) {
      setErr("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/clinics/clinic-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token and user info
      localStorage.setItem("clinicToken", data.token);
      localStorage.setItem("clinicUser", JSON.stringify(data.user));

      console.log("clinicUser", localStorage.getItem("clinicUser"));
      console.log("clinicToken", localStorage.getItem("clinicToken"));
      console.log("Login successful:", data);

      // Store trial info in sessionStorage for sidebar countdown timer
      if (data.trial) {
        // Only apply trial logic for new users (not legacy users)
        if (!data.trial.isLegacyUser) {
          setTrialInfo(data.trial);
          
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('clinicTrialInfo', JSON.stringify(data.trial));
          }
          
          if (data.trial.isExpired) {
            // Show trial expired popup
            setShowTrialPopup(true);
            return; // Don't redirect
          }
        } else {
          console.log('Legacy user - skipping trial validation');
        }
      }

      // Show success toast
      setToastMessage(data.message || "Login successful!");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        router.push("/clinic/clinic-dashboard");
      }, 2000);
    } catch (error: unknown) {
      const fetchError = error as Error;
      setErr(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-white text-gray-800 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border border-gray-200">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Trial Expired Popup */}
      {showTrialPopup && trialInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-fade-in">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Free Trial Expired
            </h3>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              Your 30-day free trial has expired. To continue accessing your healthcare dashboard and all features, please upgrade to a premium plan.
            </p>

            {/* Trial Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Created:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(trialInfo.accountCreatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trial Ended:</span>
                  <span className="font-semibold text-red-600">
                    {new Date(trialInfo.trialEndDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => router.push("/clinic/upgrade-plan")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => {
                  setShowTrialPopup(false);
                  // Clear token and redirect to home
                  localStorage.removeItem("clinicToken");
                  localStorage.removeItem("clinicUser");
                  router.push("/");
                }}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Return to Home
              </button>
            </div>

            {/* Contact Support */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <a href="mailto:support@zeva360.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 flex-col justify-center relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 left-20 w-32 h-32 border border-white rounded-full"></div>
            <div className="absolute bottom-40 right-32 w-24 h-24 border border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-40 h-40 border border-white rounded-full"></div>
          </div>

          <div className="relative z-10 max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ZEVA</h1>
                <p className="text-slate-400 text-sm font-medium">Healthcare Management</p>
              </div>
            </div>

            {/* Main Content */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                Modern Healthcare Management System
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed mb-12">
                Streamline your clinic operations with our comprehensive healthcare platform. Secure, efficient, and designed for modern medical practices.
              </p>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-slate-200 font-medium">HIPAA Compliant & Secure</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-slate-200 font-medium">Real-time Patient Records</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-slate-200 font-medium">24/7 Technical Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ZEVA</h1>
                <p className="text-slate-600 text-xs">Healthcare Portal</p>
              </div>
            </div>

            {/* Login Card */}
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
                <p className="text-slate-600">Sign in to access your healthcare dashboard</p>
              </div>

              {err && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 text-sm font-medium">{err}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400 bg-white"
                    placeholder="your.email@clinic.com"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 placeholder-slate-400 bg-white"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-slate-700">
                      Remember me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/clinic/forgot-password")}
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              {/* Footer Link */}
              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <Link
                  href="/"
                  className="text-sm text-slate-600 hover:text-emerald-600 font-medium inline-flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              </div>
            </div>

            {/* Security Notice */}
            <p className="mt-8 text-center text-xs text-slate-500">
              © 2024 ZEVA Healthcare. All rights reserved. Your data is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ❌ Do NOT put this inside the return above
ClinicLogin.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};
