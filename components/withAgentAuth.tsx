'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';
import { toast, Toaster } from 'react-hot-toast'; // 👈 import toast and Toaster

export default function withAgentAuth<P extends object>(
  WrappedComponent: ComponentType<P & { user?: any }>
) {
  return function WithAgentAuth(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        // Check for both agentToken (for staff role) and userToken (for doctorStaff role)
        const agentToken = typeof window !== 'undefined'
          ? (localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken'))
          : null;
        const doctorToken = typeof window !== 'undefined'
          ? (localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken'))
          : null;
        const userToken = typeof window !== 'undefined'
          ? (localStorage.getItem('userToken') || sessionStorage.getItem('userToken'))
          : null;

        const token = agentToken || doctorToken || userToken;

        if (!token) {
          // No token found - check if there are other tokens we should preserve
          // Don't clear storage unless we've confirmed token invalidity from API
          setIsLoading(false);
          router.replace('/staff');
          return;
        }

        try {
          // Decode token to get role
          let decoded = null;
          try {
            const payload = token.split('.')[1];
            if (payload) {
              decoded = JSON.parse(atob(payload));
            }
          } catch (e) {
            console.error('Error decoding token:', e);
          }

          // Use appropriate verify-token API based on role
          let verifyEndpoint = '/api/agent/verify-token';
          if (decoded?.role === 'doctor' || decoded?.role === 'doctorStaff') {
            verifyEndpoint = '/api/doctor/verify-token';
          }

          const response = await fetch(verifyEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          // Only clear tokens that are confirmed invalid by API (not due to network errors)
          const clearSpecificToken = (tokenToRemove: string) => {
            const keys = ['agentToken', 'doctorToken', 'userToken'];
            keys.forEach((k) => {
              const stored = localStorage.getItem(k) || sessionStorage.getItem(k);
              if (stored === tokenToRemove) {
                try { localStorage.removeItem(k); } catch {}
                try { sessionStorage.removeItem(k); } catch {}
              }
            });
          };

          if (response.ok && data.valid) {
            setIsAuthenticated(true);
            setUserData(data.user || decoded);
          } else {
            // Token is confirmed invalid by API - clear only this specific token
            clearSpecificToken(token);
            const message = data.message === 'Token expired'
              ? 'Session expired. Please login again.'
              : data.message || 'Authentication failed. Please login again.';
            toast.error(message);
            router.replace('/staff');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Network error - don't clear tokens, just redirect
          // The next page load will re-verify the token
          router.replace('/staff');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Verifying authentication...</div>
        </div>
      );
    }

    return (
      <>
        {/* MODIFIED: Set position to top-right with proper toast options to match other pages */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#f9fafb",
              fontSize: "12px",
              padding: "8px 12px",
              borderRadius: "6px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#fff",
              },
              style: {
                background: "#10b981",
                color: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
              style: {
                background: "#ef4444",
                color: "#fff",
              },
            },
          }}
        />
        {isAuthenticated ? <WrappedComponent {...props} user={userData} /> : null}
      </>
    );
  };
}