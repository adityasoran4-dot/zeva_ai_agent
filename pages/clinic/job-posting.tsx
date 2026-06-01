"use client";
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import type { NextPageWithLayout } from "../_app";
import JobManagement from "../../components/all-posted-jobs";
import ApplicationsDashboard from "../../components/job-applicants";
import CreateJobModal from "../../components/CreateJobModal";
import axios from 'axios';
import { PlusCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import Loader from '../../components/Loader';


type TabType = 'jobs' | 'applicants';
type RouteContext = "clinic" | "agent";

function ClinicJobPostingPage({ contextOverride = null }: { contextOverride?: RouteContext | null }) {
  const [routeContext, setRouteContext] = useState<RouteContext>(contextOverride || "clinic");
  useEffect(() => {
    if (contextOverride) {
      setRouteContext(contextOverride);
      return;
    }
    if (typeof window === "undefined") return;
    const isAgentRoute = window.location.pathname?.startsWith("/agent/") ?? false;
    setRouteContext(isAgentRoute ? "agent" : "clinic");
  }, [contextOverride]);
  const tokenKey = routeContext === "agent" ? "agentToken" : "clinicToken";
  const isAgentRoute = routeContext === "agent";

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem(tokenKey) ||
      sessionStorage.getItem(tokenKey) ||
      null
    );
  };

  const getUserRole = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "staffToken", "userToken", "adminToken"];
      for (const key of TOKEN_PRIORITY) {
        const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role || null;
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user role:", error);
    }
    return null;
  };
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [clinicCurrency, setClinicCurrency] = useState<string>('INR');

  // Fetch clinic currency
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const token = getToken();
        if (!token) return;
        
        const res = await axios.get('/api/clinics/myallClinic', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.data.success && res.data.clinic?.currency) {
          setClinicCurrency(res.data.clinic.currency);
        }
      } catch (err) {
        console.error('Error fetching clinic currency:', err);
      }
    };
    
    fetchClinicCurrency();
  }, []);

  // ✅ Use useAgentPermissions hook for agent routes
  const agentPermissionsResult: any = useAgentPermissions(isAgentRoute ? "job_posting" : null);
  const agentPermissions = agentPermissionsResult?.permissions || {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canPrint: false,
    canExport: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsResult?.loading || false;

  // Permission state
  const [permissions, setPermissions] = useState({
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canReadApplicants: false,
    canUpdateApplicants: false,
    canDeleteApplicants: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // ✅ Handle agent permissions from useAgentPermissions hook
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;
    
    // ✅ Ensure permissions are properly set from hook response
    const newPermissions = {
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canReadApplicants: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canUpdateApplicants: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDeleteApplicants: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
    };
    
    console.log('[Job Posting] Setting permissions from agentPermissions:', {
      agentPermissions,
      newPermissions,
      hasAnyPermission: newPermissions.canCreate || newPermissions.canRead || newPermissions.canUpdate || newPermissions.canDelete
    });
    
    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // ✅ Fetch clinic permissions for clinic routes
  useEffect(() => {
    if (isAgentRoute) return; // Skip if agent route (handled by useAgentPermissions hook)
    
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

        const userRole = getUserRole();
        
        // ✅ For admin role, grant full access (bypass permission checks)
        if (userRole === "admin") {
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
          return; // Skip API calls for admin role
        }

        // ✅ For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
        if (userRole === "clinic" || userRole === "doctor") {
          try {
            const res = await axios.get("/api/clinic/sidebar-permissions", {
          headers: { Authorization: `Bearer ${token}` },
        });

            if (res.data.success) {
              // Check if permissions array exists and is not null
              // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
              if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
                // No admin restrictions set yet - default to full access for backward compatibility
                setPermissions({
                  canCreate: true,
                  canRead: true,
                  canUpdate: true,
                  canDelete: true,
                  canReadApplicants: true,
                  canUpdateApplicants: true,
                  canDeleteApplicants: true,
                });
              } else {
                // Admin has set permissions - check the clinic_job_posting module
                const modulePermission = res.data.permissions.find((p: any) => {
            if (!p?.module) return false;
                  // Check for clinic_job_posting module
                  if (p.module === "clinic_job_posting") return true;
                  if (p.module === "job_posting") return true;
                  if (p.module === "jobs") return true;
                  return false;
                });

          if (modulePermission) {
            const actions = modulePermission.actions || {};
            
                  // Check if "all" is true, which grants all permissions
                  const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
                  const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
                  const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
                  const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
                  const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

            setPermissions({
              canCreate: moduleAll || moduleCreate,
              canRead: moduleAll || moduleRead,
              canUpdate: moduleAll || moduleUpdate,
              canDelete: moduleAll || moduleDelete,
              canReadApplicants: moduleAll || moduleRead,
              canUpdateApplicants: moduleAll || moduleUpdate,
              canDeleteApplicants: moduleAll || moduleDelete,
            });
          } else {
                  // Module permission not found in the permissions array - default to read-only
                  setPermissions({
                    canCreate: false,
                    canRead: true, // Clinic/doctor can always read their own data
                    canUpdate: false,
                    canDelete: false,
                    canReadApplicants: true,
                    canUpdateApplicants: false,
                    canDeleteApplicants: false,
                  });
                }
              }
            } else {
              // API response doesn't have permissions, default to full access (backward compatibility)
              setPermissions({
                canCreate: true,
                canRead: true,
                canUpdate: true,
                canDelete: true,
                canReadApplicants: true,
                canUpdateApplicants: true,
                canDeleteApplicants: true,
              });
            }
          } catch (err: any) {
            console.error("Error fetching clinic sidebar permissions:", err);
            // On error, default to full access (backward compatibility)
            setPermissions({
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              canReadApplicants: true,
              canUpdateApplicants: true,
              canDeleteApplicants: true,
            });
          }
          setPermissionsLoaded(true);
          return;
        }

        // For other roles (agent, staff, doctorStaff), use existing agent permissions logic
        // This should not happen in clinic route, but handle it gracefully
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
      } catch (err: any) {
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
      }
    };

    fetchPermissions();
  }, [isAgentRoute, tokenKey]);

  const handleJobCreated = () => {
    setRefreshKey(prev => prev + 1);
    setIsCreateModalOpen(false);
    // The JobManagement component will refresh automatically via its useEffect
  };

  const handleCreateJobClick = () => {
    if (!permissions.canCreate) {
      // Toast will be handled by the component
      return;
    }
    setIsCreateModalOpen(true);
  };

  if (!permissionsLoaded) {
    return <Loader />;
  }

  // Show access denied message if no read or create permission
  if (!permissions.canRead && !permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
          <p className="text-sm text-teal-700 mb-4">
            You do not have permission to view or manage job postings.
          </p>
          <p className="text-xs text-teal-600">
            Please contact your administrator to request access to the Job Posting module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        {/* Schema Markup - Job Posting */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Careers at ZEVA",
              "url": "https://zeva360.com/job-listings",
              "description": "Explore exciting career opportunities at ZEVA. Discover job openings for healthcare professionals, IT specialists, and wellness experts across multiple locations. Apply for full-time, part-time, or remote positions with transparent salary information.",
              "hiringOrganization": {
                "@type": "Organization",
                "name": "ZEVA",
                "sameAs": "https://zeva360.com",
                "logo": "https://zeva360.com/logo.png"
              },
              "jobLocation": {
                "@type": "Place",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Abu Dhabi, UAE",
                  "addressLocality": "Abu Dhabi",
                  "addressCountry": "AE"
                }
              },
              "datePosted": "2025-12-18",
              "employmentType": "FULL_TIME",
              "validThrough": "2026-12-31T23:59",
              "baseSalary": {
                "@type": "MonetaryAmount",
                "currency": "AED",
                "value": {
                  "@type": "QuantitativeValue",
                  "value": "70000",
                  "unitText": "YEAR"
                }
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50 p-1 sm:p-2 overflow-x-hidden">
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
      <div className="max-w-9xl mx-auto px-1 sm:px-2 mb-2">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-teal-900">Job Management</h1>
              <p className="text-xs sm:text-sm text-teal-700 mt-0.5">Manage your job postings and applications</p>
            </div>
            {(() => {
              console.log('[Job Posting] Button render check - canCreate:', permissions.canCreate, 'permissionsLoaded:', permissionsLoaded);
              return permissions.canCreate && (
                <button
                  onClick={handleCreateJobClick}
                  className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create New Job</span>
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Compact Tabs */}
      <div className="w-full px-1 sm:px-2">
        <div className="bg-white rounded-lg border mt-1  border-gray-200 p-2 mb-1 inline-flex">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-1 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-teal-600 text-white'
                : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
            }`}
          >
            My All Jobs
          </button>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'applicants'
                ? 'bg-teal-600 text-white'
                : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
            }`}
          >
            Job Applicants
          </button>
        </div>

        {/* Compact Tab Content */}
        <div className="mt-1 w-full">
          {activeTab === 'jobs' ? (
            !permissions.canRead ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                {permissions.canCreate ? (
                  <>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-2">Read Permission Required</h3>
                    <p className="text-xs sm:text-sm text-teal-700 mb-3">
                      You only have permission to create job postings. You cannot view, update, or delete job postings.
                    </p>
                    <p className="text-[10px] sm:text-xs text-teal-700">
                      Contact your administrator to request read permissions for the Job Posting module.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.001" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-2">Access Denied</h3>
                    <p className="text-xs sm:text-sm text-teal-700 mb-3">
                      You do not have permission to view job postings.
                    </p>
                    <p className="text-[10px] sm:text-xs text-teal-700">
                      Please contact your administrator to request access to the Jobs module.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <JobManagement 
                role="clinic" 
                config={{
                  title: 'My Job Postings',
                  subtitle: 'Manage and review all your job listings posted as a clinic',
                  tokenKey,
                  primaryColor: '#2D9AA5',
                  emptyStateTitle: 'No Job Postings Yet',
                  emptyStateDescription: 'Start posting job opportunities to find new candidates.',
                  emptyStateButtonText: 'Post a New Job'
                }}
                key={refreshKey}
                permissions={permissions}
                currency={clinicCurrency}
              />
            )
          ) : (
            !permissions.canReadApplicants ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                {permissions.canCreate ? (
                  <>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-2">Read Permission Required</h3>
                    <p className="text-xs sm:text-sm text-teal-700 mb-3">
                      You only have permission to create job postings. You cannot view job applicants.
                    </p>
                    <p className="text-[10px] sm:text-xs text-teal-700">
                      Contact your administrator to request read permissions for the Job Posting module.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-teal-900 mb-2">Access Denied</h3>
                    <p className="text-xs sm:text-sm text-teal-700 mb-3">
                      You do not have permission to view job applicants.
                    </p>
                    <p className="text-[10px] sm:text-xs text-teal-700">
                      Please contact your administrator to request access to the Job Applicants module.
                    </p>
                  </>
                )}
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
      />
    </div>
    </>
  );
}

ClinicJobPostingPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export const ClinicJobPostingPageBase = ClinicJobPostingPage;

const ProtectedClinicJobPage: NextPageWithLayout = withClinicAuth(ClinicJobPostingPage);
ProtectedClinicJobPage.getLayout = ClinicJobPostingPage.getLayout;

export default ProtectedClinicJobPage;
