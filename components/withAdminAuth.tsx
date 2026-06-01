import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ComponentType } from 'react';

// Define proper TypeScript types for the HOC
export default function withAdminAuth<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  return function WithAdminAuth(props: P) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const checkAuth = async () => {
        // Check if we're on an agent route - if so, allow agent tokens
        const isAgentRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/agent/');
        
        let token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        
        // If on agent route and no adminToken, try agentToken
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

        if (!token) {
          if (!isAgentRoute) {
            router.replace('/admin');
          }
          setIsLoading(false);
          return;
        }

        try {
          // For admin routes, verify admin token
          // For agent routes with adminToken, verify admin token
          const verifyEndpoint = isAgentRoute && token === localStorage.getItem('agentToken') 
            ? '/api/agent/verify-token' 
            : '/api/admin/verify-token';
            
          const response = await fetch(verifyEndpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.valid) {
            setIsAuthenticated(true);
          } else {
            // Show alert if token expired
            if (data.message === 'Token expired') {
              alert('Session expired. Please login again.');
            }

            if (!isAgentRoute) {
              localStorage.removeItem('adminToken');
              router.replace('/admin');
            }
          }
        } catch (error) {
          console.error('Authentication verification failed:', error);
          if (!isAgentRoute) {
            localStorage.removeItem('adminToken');
            router.replace('/admin');
          }
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
            {/* Simple spinner */}
            <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2D9AA5] rounded-full animate-spin mx-auto mb-4"></div>

            {/* Clean text */}
            <div className="text-lg text-gray-700 font-medium">
              Verifying authentication...
            </div>
          </div>
        </div>
      );
    }

    // Only render the protected component if authenticated
    return isAuthenticated ? <WrappedComponent {...props} /> : null;

  };
}
