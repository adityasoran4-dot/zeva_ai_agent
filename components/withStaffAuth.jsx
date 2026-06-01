'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { toast, Toaster } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEYS = [
  'userToken',
  'staffToken',
  'clinicToken',
  'doctorToken',
  'agentToken',
  'adminToken',
];

const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  for (const key of TOKEN_KEYS) {
    const value =
      localStorage.getItem(key) ||
      sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const clearStoredTokens = () => {
  TOKEN_KEYS.forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  });
};

const getVerifyEndpoint = (role) => {
  switch (role) {
    case 'clinic':
      return '/api/clinics/verify-token';
    case 'doctor':
    case 'doctorStaff':
      return '/api/doctor/verify-token';
    case 'agent':
      return '/api/agent/verify-token';
    case 'staff':
      return '/api/staff/verify-token';
    case 'admin':
      return '/api/admin/verify-token';
    default:
      return '/api/doctor/verify-token';
  }
};

export default function withStaffAuth(WrappedComponent) {
  return function WithStaffAuth(props) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        const token = getStoredToken();

        if (!token) {
          toast.error('Please login to continue');
          clearStoredTokens();
          setTimeout(() => router.replace('/staff'), 3000);
          return;
        }

        let role = null;
        try {
          const decoded = jwtDecode(token);
          role = decoded?.role || null;
        } catch (err) {
          console.warn('Unable to decode staff token:', err);
        }

        const endpoint = getVerifyEndpoint(role);

        try {
          const response = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            setIsAuthenticated(true);
          } else {
            const message =
              data?.message === 'Token expired'
                ? 'Session expired. Logging out…'
                : data?.message || 'Authentication failed. Logging out…';
            toast.error(message);
            clearStoredTokens();
            setTimeout(() => router.replace('/staff'), 3000);
          }
        } catch (error) {
          console.error('Staff token verification failed:', error);
          toast.error('Something went wrong. Logging out…');
          clearStoredTokens();
          setTimeout(() => router.replace('/staff'), 3000);
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2D9AA5] rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg text-gray-700 font-medium">
              Verifying staff authentication...
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <Toaster />
        {isAuthenticated ? <WrappedComponent {...props} /> : null}
      </>
    );
  };
}
