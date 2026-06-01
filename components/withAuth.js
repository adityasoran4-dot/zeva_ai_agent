// components/withAuth.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import jwt from 'jsonwebtoken';

const withAuth = (WrappedComponent, allowedRoles = ['agent', 'doctor', 'doctorStaff']) => {
  const WithAuth = (props) => {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
      const checkAuth = () => {
        if (typeof window === 'undefined') return;

        // Check all possible tokens
        const token = 
          localStorage.getItem('agentToken') ||
          localStorage.getItem('doctorToken') ||
          localStorage.getItem('doctorStaffToken') ||
          localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        try {
          // Verify token
          const decoded = jwt.decode(token);
          
          if (!decoded) {
            router.push('/login');
            return;
          }

          // Check if role is allowed
          const role = decoded.role;
          if (!allowedRoles.includes(role)) {
            router.push('/unauthorized');
            return;
          }

          setUserRole(role);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth error:', error);
          router.push('/login');
        }
      };

      checkAuth();
    }, [router]);

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300">Checking authentication...</p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} userRole={userRole} />;
  };

  // Copy getInitialProps if it exists
  if (WrappedComponent.getInitialProps) {
    WithAuth.getInitialProps = WrappedComponent.getInitialProps;
  }

  return WithAuth;
};

export default withAuth;