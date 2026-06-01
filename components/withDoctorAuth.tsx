'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';
import { toast, Toaster } from 'react-hot-toast'; // 👈 import toast and Toaster

export default function withDoctorAuth<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithDoctorAuth(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const clearStorage = () => {
        // Remove generic and doctor-specific keys from both storages
        const keys = ['token', 'doctorToken', 'doctorUser'];
        keys.forEach((k) => {
          try { localStorage.removeItem(k); } catch {}
          try { sessionStorage.removeItem(k); } catch {}
        });
      };

      const checkAuth = async () => {
        // Check if we're on an agent route - if so, allow agent tokens
        const isAgentRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/agent/');
        
        let token = typeof window !== 'undefined'
          ? (localStorage.getItem('doctorToken') || sessionStorage.getItem('doctorToken') || localStorage.getItem('token') || sessionStorage.getItem('token'))
          : null;
        let user = typeof window !== 'undefined'
          ? (localStorage.getItem('doctorUser') || sessionStorage.getItem('doctorUser'))
          : null;
        
        // If on agent route and no doctorToken, try agentToken
        if (isAgentRoute && !token) {
          token = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
          
          if (token) {
            // Verify agent token instead
            try {
              const response = await fetch('/api/agent/verify-token', {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              const data = await response.json();

              if (response.ok && data.valid) {
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error('Agent token verification failed:', error);
            }
          }
        }

        if (!token || (!user && !isAgentRoute)) {
          if (!isAgentRoute) {
            console.warn('Missing token or user data. Token:', !!token, 'User:', !!user);
            toast.error('Please login to continue');
            clearStorage();
            router.replace('/doctor/login');
          }
          setIsLoading(false);
          return;
        }

        try {
          // For agent routes with agentToken, verify agent token
          // For doctor routes with doctorToken, verify doctor token
          const verifyEndpoint = isAgentRoute && token === (localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken'))
            ? '/api/agent/verify-token' 
            : '/api/doctor/verify-token';
            
          const response = await fetch(verifyEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            setIsAuthenticated(true);
            setIsLoading(false);
          } else {
            if (!isAgentRoute) {
              console.error('Token verification failed:', data);
              const errorMessage = data.message || 'Authentication failed';
              if (data.message === 'Token expired') {
                toast.error('Session expired. Please login again.');
              } else {
                toast.error(errorMessage);
              }
              clearStorage();
              router.replace('/doctor/login');
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          if (!isAgentRoute) {
            toast.error('Network error. Please check your connection.');
            clearStorage();
            router.replace('/doctor/login');
          }
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
  <div className="text-center">
    {/* Simple spinner */}
    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2D9AA5] rounded-full animate-spin mx-auto mb-4"></div>
    
    {/* Clean text */}
    <div className="text-lg text-gray-700 font-medium">
      Verifying doctor authentication...
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