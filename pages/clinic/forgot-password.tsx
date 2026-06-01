// components/ClinicForgotPassword.tsx
'use client';
import { useState } from 'react';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase'; // 🔁 Extract config
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import React from 'react';
import Link from 'next/link';

export default function ClinicForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    // Get base URL dynamically - use current origin (localhost in dev, production URL in prod)
    const getBaseUrl = () => {
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      // Fallback for SSR
      return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    };
    
    const baseUrl = getBaseUrl();
    
    // When handleCodeInApp: true, Firebase redirects to /auth/action on the current origin
    // The url parameter is where Firebase redirects AFTER the action is completed
    // IMPORTANT: Use the current origin explicitly to override Firebase console Action URL
    const actionCodeSettings = {
      url: `${baseUrl}/clinic/reset-password?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
      // Explicitly set the domain to current origin to override Firebase console settings
      dynamicLinkDomain: undefined, // Let Firebase use current origin
    };

    try {
      // First, check if email exists with clinic role
      const checkEmailResponse = await axios.post('/api/clinics/check-email', { email });
      
      if (checkEmailResponse.status === 200) {
        // Email exists with clinic role, proceed with Firebase verification
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        
        // Log for debugging
        console.log('Sending password reset email from:', baseUrl);
        console.log('Action code settings:', actionCodeSettings);
        
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('clinicEmailForReset', email);
        setMessage('Verification email sent! Check your inbox.');
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      setError(err.message || 'An error occurred');
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Clinic Password Reset</h2>
            <p className="text-gray-600">Enter your clinic email to receive a password reset link</p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSendVerification} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Clinic Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="clinic@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg  focus:border-emerald-500 transition-all duration-200 text-gray-900 placeholder-gray-500"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Verification Link
                    </div>
                  )}
                </button>
              </form>

              {/* Success Message */}
              {message && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-emerald-800">{message}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
              <div className="flex items-center justify-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Remember your password?{' '}
                <Link href="/clinic/login-clinic" className="text-emerald-600 hover:text-emerald-500 font-medium ml-1">
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Having trouble? Contact{' '}
              <a href="mailto:support@example.com" className="text-emerald-600 hover:text-emerald-500 font-medium">
                support
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

ClinicForgotPassword.getLayout = function PageLayout(page: React.ReactNode) {
  return page; // No layout
};