"use client";
import React, { useState, useEffect } from 'react';
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";
import JobManagement from "../../components/all-posted-jobs";
import ApplicationsDashboard from "../../components/job-applicants";
import CreateJobModal from "../../components/CreateJobModal";
import { PlusCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

type TabType = 'jobs' | 'applicants';

function DoctorJobPostingPage() {
  const tokenKey = "doctorToken";

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem(tokenKey) ||
      sessionStorage.getItem(tokenKey) ||
      null
    );
  };
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Permission state - For doctors, grant full access by default
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    canReadApplicants: true,
    canUpdateApplicants: true,
    canDeleteApplicants: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Fetch doctor permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = getToken();
        if (!token) {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            canReadApplicants: false,
            canUpdateApplicants: false,
            canDeleteApplicants: false,
          });
          setPermissionsLoaded(true);
          return;
        }

        // For doctors, grant full access (bypass permission checks)
        // Try to get role from token or localStorage
        let userRole: string | null = null;
        try {
          userRole = localStorage.getItem('role') || sessionStorage.getItem('role') || 
                     localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
          
          if (!userRole && token) {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userRole = payload?.role || payload?.userRole;
            }
          }
        } catch (e) {
          console.error('Error getting user role:', e);
        }
        
        if (["doctor", "admin"].includes(userRole || "")) {
          setPermissions({
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true,
            canReadApplicants: true,
            canUpdateApplicants: true,
            canDeleteApplicants: true,
          });
          setPermissionsLoaded(true);
          return;
        }

        // If no explicit role found, still grant access for doctors (backward compatibility)
        setPermissions({
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canReadApplicants: true,
          canUpdateApplicants: true,
          canDeleteApplicants: true,
        });
        setPermissionsLoaded(true);
      } catch (err: any) {
        console.error("Error fetching permissions:", err);
        // On error, grant access (doctor should have access to their own jobs)
        setPermissions({
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canReadApplicants: true,
          canUpdateApplicants: true,
          canDeleteApplicants: true,
        });
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, [tokenKey]);

  const handleJobCreated = () => {
    setRefreshKey(prev => prev + 1);
    setIsCreateModalOpen(false);
  };

  const handleCreateJobClick = () => {
    if (!permissions.canCreate) {
      return;
    }
    setIsCreateModalOpen(true);
  };

  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
        }}
      />
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Job Management</h1>
              <p className="text-xs sm:text-sm text-gray-700 mt-0.5">Manage your job postings and applications</p>
            </div>
            {permissions.canCreate && (
              <button
                onClick={handleCreateJobClick}
                className="inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create New Job</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Tabs */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-1 mb-3 inline-flex">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-gray-800 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            My All Jobs
          </button>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'applicants'
                ? 'bg-gray-800 text-white'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Job Applicants
          </button>
        </div>

        {/* Compact Tab Content */}
        <div className="mt-3">
          {activeTab === 'jobs' ? (
            !permissions.canRead ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  You do not have permission to view job postings.
                </p>
                <p className="text-[10px] sm:text-xs text-gray-700">
                  Please contact your administrator to request access to the Jobs module.
                </p>
              </div>
            ) : (
              <JobManagement 
                role="doctor" 
                config={{
                  title: 'My Job Postings',
                  subtitle: 'Manage and review all your job listings posted as a doctor',
                  tokenKey,
                  primaryColor: '#1f2937',
                  emptyStateTitle: 'No Job Postings Yet',
                  emptyStateDescription: 'Start posting job opportunities to find new candidates.',
                  emptyStateButtonText: 'Post a New Job'
                }}
                key={refreshKey}
                permissions={permissions}
              />
            )
          ) : (
            !permissions.canReadApplicants ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-3">
                  You do not have permission to view job applicants.
                </p>
                <p className="text-[10px] sm:text-xs text-gray-700">
                  Please contact your administrator to request access to the Job Applicants module.
                </p>
              </div>
            ) : (
              <ApplicationsDashboard 
                tokenKey={tokenKey}
                permissions={permissions}
              />
            )
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onJobCreated={handleJobCreated}
        canCreate={permissions.canCreate}
        role="doctor"
      />
    </div>
  );
}

DoctorJobPostingPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

export const DoctorJobPostingPageBase = DoctorJobPostingPage;

const ProtectedDoctorJobPage: NextPageWithLayout = withDoctorAuth(DoctorJobPostingPage);
ProtectedDoctorJobPage.getLayout = DoctorJobPostingPage.getLayout;

export default ProtectedDoctorJobPage;
