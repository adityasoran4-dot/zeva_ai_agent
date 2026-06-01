'use client';

import React, { useState, useEffect } from 'react';
import { normalizeImagePath } from '../lib/utils';

interface DoctorHeaderProps {
  handleToggleDesktop?: () => void;
  handleToggleMobile?: () => void;
  isDesktopHidden?: boolean;
  isMobileOpen?: boolean;
}

const DoctorHeader: React.FC<DoctorHeaderProps> = ({
  handleToggleDesktop: _handleToggleDesktop,
  handleToggleMobile,
  isDesktopHidden: _isDesktopHidden = false,
  isMobileOpen = false,
}) => {
  const [doctorUser, setDoctorUser] = useState<{ name: string; email: string; photo?: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData =
        localStorage.getItem('doctorUser') || sessionStorage.getItem('doctorUser');

      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          if (parsed.name && parsed.email) {
            setDoctorUser(parsed);
          }
        } catch {
          // console.error('Invalid doctorUser data:', err);
        }
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem('doctorToken') ||
        sessionStorage.getItem('doctorToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('doctorToken');
      localStorage.removeItem('doctorUser');
      sessionStorage.removeItem('doctorToken');
      sessionStorage.removeItem('doctorEmailForReset');
      window.location.href = '/doctor/login';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 shadow-sm z-[49] backdrop-blur-sm bg-white/95">
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          {/* Left: Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-[2.5rem] relative z-[51]">
            {handleToggleMobile && (
              <button
                onClick={handleToggleMobile}
                className="lg:hidden p-2 rounded-lg bg-white hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200 flex-shrink-0"
                aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isMobileOpen ? (
                  <svg
                    className="w-5 h-5 text-gray-700 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-700 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Right: User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0 ml-auto">
            {/* Profile Text - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:block text-right min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate max-w-[140px] lg:max-w-[180px]">
                {doctorUser?.name || 'Doctor'}
              </div>
              <div className="text-xs text-gray-600 truncate max-w-[140px] lg:max-w-[180px]">
                {doctorUser?.email || 'Loading...'}
              </div>
            </div>

            {/* Avatar - Always visible */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-[#2D9AA5] rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {doctorUser?.photo ? (
                <img
                  src={normalizeImagePath(doctorUser.photo)}
                  alt={doctorUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-medium text-xs sm:text-sm">
                  {doctorUser ? getInitials(doctorUser.name) : 'D'}
                </span>
              )}
            </div>

            {/* Logout Button - Icon only on mobile, text on larger screens */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:px-3 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-200 flex-shrink-0"
              aria-label="Logout"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline">Logout</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DoctorHeader;
