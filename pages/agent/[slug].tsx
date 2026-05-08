// Dynamic agent route handler
// Converts /agent/[slug] to render admin/clinic/doctor/staff pages with AgentLayout
// Handles token context (clinicToken, doctorToken, agentToken) based on route type
'use client';

import { useRouter } from 'next/router';
import { useEffect, useState, createContext, useContext } from 'react';
import AgentLayout from '../../components/AgentLayout';
import withAgentAuth from '../../components/withAgentAuth';
import { jwtDecode } from 'jwt-decode';

// Token context to provide appropriate tokens to loaded components
const TokenContext = createContext<{
  agentToken: string | null;
  clinicToken: string | null;
  doctorToken: string | null;
  userRole: string | null;
  userInfo: any;
}>({
  agentToken: null,
  clinicToken: null,
  doctorToken: null,
  userRole: null,
  userInfo: null,
});

// Hook to use token context
export const useTokenContext = () => useContext(TokenContext);

// Helper to determine route type and required token
const getRouteInfo = (slug: string) => {
  if (
    slug.startsWith('clinic-') ||
    slug.startsWith('clinic-staff-') ||
    slug.startsWith('lead-') ||
    slug.startsWith('marketingalltype-')
  ) {
    return { type: 'clinic', tokenKey: 'clinicToken' };
  }
  if (slug.startsWith('doctor-') || slug.startsWith('doctor-staff-')) {
    return { type: 'doctor', tokenKey: 'doctorToken' };
  }
  if (slug.startsWith('lead-')) {
    return { type: 'agent', tokenKey: 'agentToken' };
  }
  if (slug.startsWith('admin-') || ['AdminClinicApproval', 'approve-doctors', 'add-treatment', 'all-blogs', 'analytics', 'get-in-touch', 'job-manage', 'manage-clinic-permissions', 'create-agent', 'create-staff', 'admin-add-service', 'admin-create-vendor', 'getAllEodNotes', 'patient-report', 'track-expenses', 'contracters', 'dashboard-admin', 'seed-navigation', 'all-clinic', 'register-clinic'].includes(slug)) {
    return { type: 'admin', tokenKey: 'adminToken' };
  }
  return { type: 'unknown', tokenKey: null };
};

// Map of agent routes to their corresponding admin/clinic/doctor/staff pages
const routeMap: { [key: string]: () => Promise<any> } = {
  // Admin routes
  'AdminClinicApproval': () => import('../admin/AdminClinicApproval'),
  'approve-doctors': () => import('../admin/approve-doctors'),
  'add-treatment': () => import('../admin/add-treatment'),
  'all-blogs': () => import('../admin/all-blogs'),
  'analytics': () => import('../admin/analytics'),
  'get-in-touch': () => import('../admin/get-in-touch'),
  'job-manage': () => import('../admin/job-manage'),
  'manage-clinic-permissions': () => import('../admin/manage-clinic-permissions'),
  'create-agent': () => import('../admin/create-agent'),
  'create-staff': () => import('../admin/create-staff'),
  'admin-add-service': () => import('../admin/admin-add-service'),
  'admin-create-vendor': () => import('../admin/admin-create-vendor'),
  'getAllEodNotes': () => import('../admin/getAllEodNotes'),
  'patient-report': () => import('../admin/patient-report'),
  'track-expenses': () => import('../admin/track-expenses'),
  'contracters': () => import('../admin/contractor'),
  'dashboard-admin': () => import('../admin/dashboard-admin'),
  'seed-navigation': () => import('../admin/seed-navigation'),
  'all-clinic': () => import('../admin/all-clinic'),
  'register-clinic': () => import('../admin/register-clinic'),
  
  // Clinic routes
  'myallClinic': () => import('../clinic/myallClinic'),
  'clinic-myallClinic': () => import('../clinic/myallClinic'),
  'clinic-dashboard': () => import('../clinic/clinic-dashboard'),
  'clinic-clinic-dashboard': () => import('../clinic/clinic-dashboard'), // Handle double-prefixed route from path conversion
  'clinic-BlogForm': () => import('../clinic/BlogForm'),
  'job-posting': () => import('../clinic/job-posting'),
  'clinic-published-blogs': () => import('../clinic/published-blogs'),
  'clinic-my-jobs': () => import('../clinic/my-jobs'),
  'clinic-job-applicants': () => import('../clinic/job-applicants'),
  'clinic-getAuthorCommentsAndLikes': () => import('../clinic/getAuthorCommentsAndLikes'),
  'clinic-add-room': () => import('./clinic-add-room'),
  'clinic-assigned-leads': () => import('./clinic-assigned-leads'),
  'clinic-get-Enquiry': () => import('./clinic-get-Enquiry'),
  'clinic-appointment': () => import('./clinic-appointment'),
  'clinic-job-posting': () => import('./clinic-job-posting'),
  'clinic-all-appointment': () => import('./clinic-all-appointment'),
  'lead-create-lead': () => import('./lead-create-lead'),
  'getAllReview': () => import('../clinic/getAllReview'),
  'clinic-getAllReview': () => import('../clinic/getAllReview'),
  'get-Enquiry': () => import('../clinic/get-Enquiry'),
  'enquiry-form': () => import('../clinic/enquiry-form'),
  'review-form': () => import('../clinic/review-form'),
  'clinic-seed-navigation': () => import('../clinic/seed-navigation'),
  // Staff routes for clinic
  'clinic-staff-dashboard': () => import('../staff/staff-dashboard'),
  'clinic-add-service': () => import('../staff/add-service'),
  'clinic-patient-registration': () => import('../clinic/patient-registration'),
  'clinic-patient-information': () => import('../clinic/patient-information'),
  'clinic-eodNotes': () => import('../staff/eodNotes'),
  'clinic-AddPettyCashForm': () => import('../staff/AddPettyCashForm'),
  'clinic-add-vendor': () => import('../staff/add-vendor'),
  'clinic-membership': () => import('../staff/membership'),
  'clinic-contract': () => import('../staff/contract'),
  'clinic-pending-claims': () => import('../staff/pending-claims'),
  'clinic-cancelled-claims': () => import('../staff/cancelled-claims'),
  'clinic-all-claims': () => import('../staff/all-claims'),
  'clinic-booked-appointments': () => import('../staff/booked-appointments'),
  'clinic-staff-add-treatment': () => import('../staff/add-treatment'),
  
  // Marketing routes
  'marketingalltype-sms-marketing': () => import('../marketingalltype/sms-marketing'),
  'marketingalltype-whatsapp-marketing': () => import('../marketingalltype/whatsapp-marketing'),
  'marketingalltype-gmail-marketing': () => import('../marketingalltype/gmail-marketing'),
  
  // Doctor routes
  'doctor-dashboard': () => import('../doctor/doctor-dashboard'),
  'manageDoctor': () => import('../doctor/manageDoctor'),
  'getReview': () => import('../doctor/getReview'),
  'doctor-BlogForm': () => import('../doctor/BlogForm'),
  'doctor-published-blogs': () => import('../doctor/published-blogs'),
  'doctor-getAuthorCommentsAndLikes': () => import('../doctor/getAuthorCommentsAndLikes'),
  'create-job': () => import('../doctor/create-job'),
  'doctor-my-jobs': () => import('../doctor/my-jobs'),
  'doctor-job-applicants': () => import('../doctor/job-applicants'),
  'prescription-requests': () => import('../doctor/prescription-requests'),
  'doctor-seed-navigation': () => import('../doctor/seed-navigation'),
  // Staff routes for doctor
  'doctor-staff-dashboard': () => import('../staff/staff-dashboard'),
  'doctor-add-service': () => import('../staff/add-service'),
  'doctor-patient-registration': () => import('../clinic/patient-registration'),
  'doctor-patient-information': () => import('../clinic/patient-information'),
  'doctor-eodNotes': () => import('../staff/eodNotes'),
  'doctor-AddPettyCashForm': () => import('../staff/AddPettyCashForm'),
  'doctor-add-vendor': () => import('../staff/add-vendor'),
  'doctor-membership': () => import('../staff/membership'),
  'doctor-contract': () => import('../staff/contract'),
  'doctor-pending-claims': () => import('../staff/pending-claims'),
  'doctor-cancelled-claims': () => import('../staff/cancelled-claims'),
  'doctor-all-claims': () => import('../staff/all-claims'),
  'doctor-booked-appointments': () => import('../staff/booked-appointments'),
  'doctor-staff-add-treatment': () => import('../staff/add-treatment'),
};

const AgentDynamicPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [PageComponent, setPageComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenContext, setTokenContext] = useState<{
    agentToken: string | null;
    clinicToken: string | null;
    doctorToken: string | null;
    userRole: string | null;
    userInfo: any;
  }>({
    agentToken: null,
    clinicToken: null,
    doctorToken: null,
    userRole: null,
    userInfo: null,
  });

  useEffect(() => {
    if (!slug || typeof slug !== 'string') {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        // Get agent token and user info - check multiple token types
        let agentToken = typeof window !== 'undefined'
          ? (localStorage.getItem('agentToken') || sessionStorage.getItem('agentToken'))
          : null;

        // Fallback to userToken if agentToken not found
        if (!agentToken && typeof window !== 'undefined') {
          agentToken = localStorage.getItem('userToken') || sessionStorage.getItem('userToken');
        }

        if (!agentToken) {
          setError('Agent token not found');
          setLoading(false);
          return;
        }

        // Decode token to get user info
        let userInfo: any = null;
        let userRole: string | null = null;
        try {
          const decoded: any = jwtDecode(agentToken);
          userInfo = decoded;
          userRole = decoded.role || null;
        } catch (err) {
          console.error('Error decoding token:', err);
        }

        // Get route info to determine token type needed
        const routeInfo = getRouteInfo(slug);
        
        // Set up token context based on route type
        // For clinic routes, temporarily set clinicToken (using agentToken/userToken, backend will handle it)
        // For doctor routes, temporarily set doctorToken (using agentToken/userToken, backend will handle it)
        let clinicToken: string | null = null;
        let doctorToken: string | null = null;

        if (routeInfo.type === 'clinic') {
          // For clinic routes, use agentToken/userToken as clinicToken (API will validate role)
          clinicToken = agentToken;
        } else if (routeInfo.type === 'doctor') {
          // For doctor routes, use agentToken/userToken as doctorToken (API will validate role)
          doctorToken = agentToken;
        }

        setTokenContext({
          agentToken,
          clinicToken,
          doctorToken,
          userRole,
          userInfo,
        });

        // Temporarily set tokens in localStorage for components that check them
        // This allows components to work without modification
        // Note: agentToken may be userToken if agentToken was not found
        if (routeInfo.type === 'clinic' && typeof window !== 'undefined') {
          const originalClinicToken = localStorage.getItem('clinicToken');
          localStorage.setItem('clinicToken', agentToken);
          // Store original to restore later if needed
          if (originalClinicToken) {
            sessionStorage.setItem('_originalClinicToken', originalClinicToken);
          }
        } else if (routeInfo.type === 'doctor' && typeof window !== 'undefined') {
          const originalDoctorToken = localStorage.getItem('doctorToken');
          localStorage.setItem('doctorToken', agentToken);
          // Store original to restore later if needed
          if (originalDoctorToken) {
            sessionStorage.setItem('_originalDoctorToken', originalDoctorToken);
          }
        }

        const pageLoader = routeMap[slug];
        if (!pageLoader) {
          setError(`Page not found: /agent/${slug}`);
          setLoading(false);
          return;
        }

        const module = await pageLoader();
        const ExportedComponent = module.default;
        
        // Create a wrapper that provides token context
        const WrappedComponent = (props: any) => {
          return (
            <TokenContext.Provider value={tokenContext}>
              <ExportedComponent {...props} />
            </TokenContext.Provider>
          );
        };
        
        setPageComponent(() => WrappedComponent);
      } catch (err: any) {
        console.error('Error loading page:', err);
        setError(`Failed to load page: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadPage();

    // Cleanup: restore original tokens when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        const originalClinicToken = sessionStorage.getItem('_originalClinicToken');
        const originalDoctorToken = sessionStorage.getItem('_originalDoctorToken');
        
        if (originalClinicToken) {
          localStorage.setItem('clinicToken', originalClinicToken);
          sessionStorage.removeItem('_originalClinicToken');
        } else if (slug && typeof slug === 'string' && getRouteInfo(slug).type === 'clinic') {
          // Only remove if we set it (not if it was already there)
          localStorage.removeItem('clinicToken');
        }
        
        if (originalDoctorToken) {
          localStorage.setItem('doctorToken', originalDoctorToken);
          sessionStorage.removeItem('_originalDoctorToken');
        } else if (slug && typeof slug === 'string' && getRouteInfo(slug).type === 'doctor') {
          // Only remove if we set it (not if it was already there)
          localStorage.removeItem('doctorToken');
        }
      }
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!PageComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Page not found</div>
      </div>
    );
  }

  return (
    <TokenContext.Provider value={tokenContext}>
      <PageComponent />
    </TokenContext.Provider>
  );
};

// Use AgentLayout instead of AdminLayout/ClinicLayout/DoctorLayout
AgentDynamicPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <AgentLayout>{page}</AgentLayout>;
};

const ProtectedAgentDynamicPage = withAgentAuth(AgentDynamicPage);
// @ts-ignore - getLayout is added dynamically
ProtectedAgentDynamicPage.getLayout = AgentDynamicPage.getLayout;

export default ProtectedAgentDynamicPage;

