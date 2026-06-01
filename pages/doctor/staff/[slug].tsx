// Dynamic doctor staff route handler
// Converts /doctor/staff/[slug] to render staff pages with DoctorLayout
'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import DoctorLayout from '../../../components/DoctorLayout';
import withDoctorAuth from '../../../components/withDoctorAuth';

// Map of doctor staff routes to their corresponding staff pages
const routeMap: { [key: string]: () => Promise<any> } = {
  // Staff routes
  'staff-dashboard': () => import('../../staff/staff-dashboard'),
  'add-service': () => import('../../staff/add-service'),
  'patient-registration': () => import('../../clinic/patient-registration'),
  'patient-information': () => import('../../clinic/patient-information'),
  'eodNotes': () => import('../../staff/eodNotes'),
  'AddPettyCashForm': () => import('../../staff/AddPettyCashForm'),
  'add-vendor': () => import('../../staff/add-vendor'),
  'membership': () => import('../../staff/membership'),
  'contract': () => import('../../staff/contract'),
  'pending-claims': () => import('../../staff/pending-claims'),
  'cancelled-claims': () => import('../../staff/cancelled-claims'),
  'all-claims': () => import('../../staff/all-claims'),
  'booked-appointments': () => import('../../staff/booked-appointments'),
  'add-treatment': () => import('../../staff/add-treatment'),
};

const DoctorStaffDynamicPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [PageComponent, setPageComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') {
      setLoading(false);
      return;
    }

    const loadPage = async () => {
      try {
        const pageLoader = routeMap[slug];
        if (!pageLoader) {
          setError(`Page not found: /doctor/staff/${slug}`);
          setLoading(false);
          return;
        }

        const module = await pageLoader();
        // Get the default export (the page component)
        const ExportedComponent = module.default;
        
        // Create a wrapper that renders the component
        const WrappedComponent = (props: any) => {
          return <ExportedComponent {...props} />;
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

  return <PageComponent />;
};

// Use DoctorLayout instead of StaffLayout
DoctorStaffDynamicPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const ProtectedDoctorStaffDynamicPage = withDoctorAuth(DoctorStaffDynamicPage);
// @ts-ignore - getLayout is added dynamically
ProtectedDoctorStaffDynamicPage.getLayout = DoctorStaffDynamicPage.getLayout;

export default ProtectedDoctorStaffDynamicPage;

