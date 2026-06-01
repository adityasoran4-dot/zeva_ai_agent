"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { createPortal } from "react-dom";
import AdminLayout from "../../components/AdminLayout";
import withAdminAuth from "../../components/withAdminAuth";
import type { NextPageWithLayout } from "../_app";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import {
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

interface Clinic {
  _id: string;
  name: string;
  address: string;
  pricing: string;
  timings: string | {
    isOpen?: boolean;
    openingTime?: string;
    closingTime?: string;
    breakStart?: string;
    breakEnd?: string;
    [key: string]: any;
  };
  treatments: Array<{
    mainTreatment: string;
    mainTreatmentSlug: string;
    subTreatments: Array<{
      name: string;
      slug: string;
    }>;
  }>;
  photos: string[];
  owner: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  plus_code?: {
    global_code: string;
  };
}

function AdminClinicApproval() {
  const [clinics, setClinics] = useState<{
    pending: Clinic[];
    approved: Clinic[];
    declined: Clinic[];
  }>({
    pending: [],
    approved: [],
    declined: [],
  });
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "declined"
  >("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    show: boolean;
    type: string;
    clinicId: string | null;
  }>({
    show: false,
    type: "",
    clinicId: null,
  });
  const [plusCode, setPlusCode] = useState<string | null>(null);
  const [addressSummary, setAddressSummary] = useState<string | null>(null);
  const [selectedClinicForTreatments, setSelectedClinicForTreatments] = useState<Clinic | null>(null);

  const router = useRouter();
  
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  // MODIFIED: Check if we're on an agent route synchronously (router.pathname is available immediately)
  // This allows permissions to start loading on first render for agent routes
  const isAgentRoute = router.pathname?.startsWith('/agent/') || 
                       (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname, isAgentRoute]);
  
  // MODIFIED: Start fetching permissions immediately if on agent route (check route synchronously)
  // This ensures permissions start loading before isAgent state is set, preventing premature access denied
  const shouldCheckPermissions = isAgentRoute || (typeof window !== 'undefined' && !!localStorage.getItem('agentToken'));
  
  const agentPermissionsData: any = useAgentPermissions(shouldCheckPermissions ? "admin_approval_clinic" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  // MODIFIED: Also show loading if we're on agent route but haven't determined if user is agent yet
  const permissionsLoading = shouldCheckPermissions ? agentPermissionsData?.loading : false;

  const itemsPerPage = 9;

  useEffect(() => {
    if (isAdmin) {
      fetchClinics();
    } else if (isAgent && !permissionsLoading) {
      if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
        fetchClinics();
      }
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      const [pending, approved, declined] = await Promise.all([
        axios.get<{ clinics: Clinic[] }>("/api/admin/pending-clinics", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response?.status === 403) {
            return { data: { clinics: [] } };
          }
          throw err;
        }),
        axios.get<{ clinics: Clinic[] }>("/api/admin/approved-clinics", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response?.status === 403) {
            return { data: { clinics: [] } };
          }
          throw err;
        }),
        axios.get<{ clinics: Clinic[] }>("/api/admin/declined-clinics", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          if (err.response?.status === 403) {
            return { data: { clinics: [] } };
          }
          throw err;
        }),
      ]);

      setClinics({
        pending: pending.data.clinics || [],
        approved: approved.data.clinics || [],
        declined: declined.data.clinics || [],
      });
    } catch (error: any) {
      console.error("Failed to fetch clinics:", error);
      if (error.response?.status === 403) {
        setClinics({
          pending: [],
          approved: [],
          declined: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: string, clinicId: string) => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions) {
      if ((type === "approve" || type === "decline") && agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
        alert("You do not have permission to approve/decline clinics");
        return;
      }
      if (type === "delete" && agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
        alert("You do not have permission to delete clinics");
        return;
      }
    }

    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      if (!token) {
        alert("No token found. Please login again.");
        return;
      }

      const endpoints = {
        approve: "/api/admin/update-approve",
        decline: "/api/admin/update-decline",
        delete: "/api/admin/delete-clinic",
      };

      if (type === "delete") {
        await axios.request({
          url: endpoints[type as keyof typeof endpoints],
          method: 'DELETE',
          data: { clinicId },
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(endpoints[type as keyof typeof endpoints], {
          clinicId,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchClinics();
    } catch (error: any) {
      console.error(`Failed to ${type} clinic:`, error);
      alert(error.response?.data?.message || `Failed to ${type} clinic`);
    }
  };

  const handleAddressClick = async (address: string) => {
    try {
      const response = await axios.get<GeocodeResponse>(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: { address, key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY },
        }
      );

      const location = response.data.results[0]?.geometry?.location;
      if (location) {
        setSelectedLocation({ ...location, address });
        setMapVisible(true);
      } else {
        // Fallback: show map with address string if geocoding fails
        setSelectedLocation({ lat: 0, lng: 0, address });
        setMapVisible(true);
      }
    } catch (err) {
      console.error("Map fetch failed:", err);
      // Fallback: show map with address string on error
      setSelectedLocation({ lat: 0, lng: 0, address });
      setMapVisible(true);
    }
  };

  const currentClinics = clinics[activeTab];
  const filteredClinics = currentClinics.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.owner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClinics.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClinics = filteredClinics.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getTabActions = (tab: string) => {
    const allActions = {
      pending: ["approve", "decline", "delete"],
      approved: ["decline", "delete"],
      declined: ["approve", "delete"],
    };
    
    const availableActions = allActions[tab as keyof typeof allActions] || [];
    
    if (isAgent && !permissionsLoading && agentPermissions) {
      return availableActions.filter(action => {
        if (action === "approve" || action === "decline") {
          return agentPermissions.canApprove || agentPermissions.canAll;
        }
        if (action === "delete") {
          return agentPermissions.canDelete || agentPermissions.canAll;
        }
        return true;
      });
    }
    
    return availableActions;
  };

  const [detailClinic, setDetailClinic] = useState<Clinic | null>(null);

  const ClinicCard = ({ clinic }: { clinic: Clinic }) => {
    const actions = getTabActions(activeTab);
    const statusStyles: Record<
      "pending" | "approved" | "declined",
      string
    > = {
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      declined: "bg-rose-50 text-rose-700 border-rose-100",
    };

    const actionStyles: Record<string, string> = {
      approve: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
      decline: "border-amber-200 text-amber-700 hover:bg-amber-50",
      delete: "border-rose-200 text-rose-700 hover:bg-rose-50",
    };

    const statusLabel =
      activeTab === "pending"
        ? "Awaiting review"
        : activeTab === "approved"
        ? "Approved"
        : "Declined";

    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition hover:shadow-md">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 truncate">
                {clinic.name}
              </h3>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                statusStyles[activeTab]
              }`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Owner: {clinic.owner?.name || "N/A"}</span>
            <button
              onClick={() => setDetailClinic(clinic)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              View info
            </button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() =>
                  setConfirmAction({
                    show: true,
                    type: action,
                    clinicId: clinic._id,
                  })
                }
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${actionStyles[action] || "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  function convertToDMS(lat: number, lng: number) {
    function toDMS(deg: number, pos: string, neg: string) {
      const absolute = Math.abs(deg);
      const degrees = Math.floor(absolute);
      const minutesNotTruncated = (absolute - degrees) * 60;
      const minutes = Math.floor(minutesNotTruncated);
      const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
      return `${degrees}°${minutes}'${seconds}\"${deg >= 0 ? pos : neg}`;
    }
    return `${toDMS(lat, "N", "S")} ${toDMS(lng, "E", "W")}`;
  }

  useEffect(() => {
    if (selectedLocation) {
      axios
        .get<GeocodeResponse>("https://maps.googleapis.com/maps/api/geocode/json", {
          params: {
            latlng: `${selectedLocation.lat},${selectedLocation.lng}`,
            key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          },
        })
        .then((res) => {
          const plus = res.data.plus_code?.global_code || null;
          setPlusCode(plus);
          const summary = res.data.results?.[0]?.formatted_address || null;
          setAddressSummary(summary);
        })
        .catch(() => {
          setPlusCode(null);
          setAddressSummary(null);
        });
    }
  }, [selectedLocation]);

  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // MODIFIED: Show loading if data is loading OR permissions are loading
  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-700">
            {(isAgent && permissionsLoading) ? 'Loading permissions...' : 'Loading clinics...'}
          </p>
        </div>
      </div>
    );
  }

  // MODIFIED: Only show access denied if permissions have finished loading and user doesn't have permission
  if (isAgent && !permissionsLoading && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-700">
            You do not have permission to view clinic approvals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-2 sm:pt-3 lg:pt-4 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white/90 mb-5 border border-slate-200 rounded-2xl shadow-sm p-6 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              {/* <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Clinic Approvals
              </p> */}
              <h1 className="text-xl font-semibold text-blue-800 mt-2">
                Clinic Management
              </h1>
              <p className="text-sm text-blue-600 mt-1">
                Review incoming clinics, keep owners informed, and curate a trusted network.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
              {/* <button
                onClick={fetchClinics}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button> */}
             
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          {[
            {
              title: "Pending",
              value: clinics.pending.length,
              icon: ClockIcon,
              accent: "bg-amber-50 text-amber-600",
              border: "border-amber-100",
              subtitle: "Awaiting review",
            },
            {
              title: "Approved",
              value: clinics.approved.length,
              icon: CheckCircleIcon,
              accent: "bg-emerald-50 text-emerald-600",
              border: "border-emerald-100",
              subtitle: "Live on platform",
            },
            {
              title: "Declined",
              value: clinics.declined.length,
              icon: XCircleIcon,
              accent: "bg-rose-50 text-rose-600",
              border: "border-rose-100",
              subtitle: "Need follow-up",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`rounded-xl border ${stat.border} bg-white/85 p-3 shadow-sm`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {stat.title}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.accent}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Review Workspace */}
        <div className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            {[
              { key: "pending", label: "Pending", count: clinics.pending.length },
              { key: "approved", label: "Approved", count: clinics.approved.length },
              { key: "declined", label: "Declined", count: clinics.declined.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as "pending" | "approved" | "declined");
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "border-slate-800 bg-blue-800 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeTab === tab.key ? "bg-white/20" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search clinics, owners, addresses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">View</span>
              {[
                { key: "grid", icon: "grid" },
                { key: "list", icon: "list" },
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => setViewMode(view.key as "grid" | "list")}
                  className={`rounded-xl border px-3 py-2 transition ${
                    viewMode === view.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                  aria-label={`Show as ${view.key}`}
                >
                  {view.icon === "grid" ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4V4H4v2zm6 0h4V4h-4v2zm6 0h4V4h-4v2zM4 12h4v-2H4v2zm6 0h4v-2h-4v2zm6 0h4v-2h-4v2zM4 18h4v-2H4v2zm6 0h4v-2h-4v2zm6 0h4v-2h-4v2z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredClinics.length)} of {filteredClinics.length} clinics
          </div>

          {paginatedClinics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <HomeIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No clinics found</h3>
              <p className="text-sm text-slate-500">Try adjusting filters or search keywords.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {paginatedClinics.map((clinic) => (
                <ClinicCard key={clinic._id} clinic={clinic} />
              ))}
              {/* Empty placeholder cards to maintain grid structure */}
              {viewMode === "grid" && paginatedClinics.length < itemsPerPage && 
                Array.from({ length: itemsPerPage - paginatedClinics.length }).map((_, index) => (
                  <div key={`empty-${index}`} className="rounded-2xl border border-transparent bg-transparent" aria-hidden="true" />
                ))
              }
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmAction.show && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center">
                {confirmAction.type === "approve" && (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  </div>
                )}
                {confirmAction.type === "decline" && (
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <ClockIcon className="w-8 h-8 text-yellow-600" />
                  </div>
                )}
                {confirmAction.type === "delete" && (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircleIcon className="w-8 h-8 text-red-600" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                Confirm {confirmAction.type}
              </h2>
              <p className="text-gray-700 mb-8">
                Are you sure you want to {confirmAction.type} this clinic?
                {confirmAction.type === "delete" && (
                  <span className="block mt-2 text-red-600 font-medium">
                    This action cannot be undone.
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmAction({ show: false, type: "", clinicId: null })
                  }
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (confirmAction.clinicId) {
                      await handleAction(
                        confirmAction.type,
                        confirmAction.clinicId
                      );
                    }
                    setConfirmAction({ show: false, type: "", clinicId: null });
                  }}
                  className={`flex-1 text-white px-6 py-3 rounded-lg font-medium transition-colors ${
                    confirmAction.type === "approve"
                      ? "bg-gray-800 hover:bg-gray-700"
                      : confirmAction.type === "decline"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {confirmAction.type === "approve"
                    ? "Approve"
                    : confirmAction.type === "decline"
                    ? "Decline"
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Map Modal */}
      {mapVisible && selectedLocation && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-blue-600" />
                <span>Clinic Location</span>
              </h3>
              <button
                onClick={() => setMapVisible(false)}
                className="text-gray-700 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Close map"
              >
                <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
              {(selectedLocation.lat !== 0 || selectedLocation.lng !== 0) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex-shrink-0">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-sm text-gray-700">
                      {convertToDMS(selectedLocation.lat, selectedLocation.lng)}
                    </span>
                    {plusCode && (
                      <span className="text-sm text-gray-700">
                        {plusCode} {addressSummary}
                      </span>
                    )}
                    {selectedLocation.address && (
                      <span className="text-sm text-gray-700">
                        {selectedLocation.address}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 mt-3">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.lat},${selectedLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium underline"
                    >
                      Directions
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium underline"
                    >
                      View larger map
                    </a>
                  </div>
                </div>
              )}
              <div className="w-full flex-1 min-h-[400px]">
                {selectedLocation.lat !== 0 && selectedLocation.lng !== 0 ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={selectedLocation}
                    zoom={15}
                  >
                    <Marker position={selectedLocation} />
                  </GoogleMap>
                ) : (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, borderRadius: "8px" }}
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      selectedLocation.address || ""
                    )}&z=16&output=embed`}
                    allowFullScreen
                  />
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Treatments Modal */}
      {selectedClinicForTreatments && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                <BeakerIcon className="w-5 h-5 text-indigo-600" />
                <span>Available Treatments</span>
              </h2>
              <button
                onClick={() => setSelectedClinicForTreatments(null)}
                className="text-gray-700 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Close treatments"
              >
                <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="space-y-4">
                {selectedClinicForTreatments.treatments.map((treatment, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">{treatment.mainTreatment}</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      {treatment.subTreatments.map((subTreatment, subIndex) => (
                        <li key={subIndex} className="text-sm text-gray-700">
                          {subTreatment.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedClinicForTreatments(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {detailClinic && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-[9999] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <HomeIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  {detailClinic.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailClinic(null)}
                className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0"
                aria-label="Close details"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Compact Content */}
            <div className="p-4 sm:p-6 space-y-3 overflow-y-auto flex-1">
              {/* Owner */}
              <div className="flex items-start gap-3 text-sm">
                <UserGroupIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-700 font-medium">{detailClinic.owner?.name || "N/A"}</div>
                  {detailClinic.owner?.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                      <EnvelopeIcon className="w-3 h-3" />
                      {detailClinic.owner.email}
                    </div>
                  )}
                  {detailClinic.owner?.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
                      <PhoneIcon className="w-3 h-3" />
                      {detailClinic.owner.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 text-sm">
                <MapPinIcon className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700">{detailClinic.address || 'N/A'}</p>
                  {detailClinic.address && (
                    <button
                      onClick={() => handleAddressClick(detailClinic.address)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                    >
                      View on map →
                    </button>
                  )}
                </div>
              </div>

              {/* Pricing & Timings - Side by side */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-semibold text-slate-900">د.إ</span>
                    <span className="font-semibold text-slate-900">{detailClinic.pricing || 'N/A'}</span>
                    <span className="text-xs text-slate-500">AED</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-slate-700">
                    {(() => {
                      if (!detailClinic.timings) return 'N/A';
                      if (typeof detailClinic.timings === 'string') return detailClinic.timings;
                      // It's an object
                      const t = detailClinic.timings as any;
                      if (t.openingTime && t.closingTime) {
                        return `${t.openingTime} - ${t.closingTime}`;
                      }
                      return 'N/A';
                    })()}
                  </span>
                </div>
              </div>

              {/* Treatments */}
              <div className="flex items-start gap-3 text-sm">
                <BeakerIcon className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500 mb-1.5">Treatments ({detailClinic.treatments?.length || 0})</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detailClinic.treatments && detailClinic.treatments.length > 0 ? (
                      detailClinic.treatments.map((treat, idx) => (
                        <span
                          key={treat.mainTreatmentSlug || idx}
                          className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                        >
                          <BeakerIcon className="w-3 h-3 text-indigo-500" />
                          {treat.mainTreatment || 'Unknown'}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No treatments</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 p-3 sm:p-4 bg-slate-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setDetailClinic(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

AdminClinicApproval.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout =
  withAdminAuth(AdminClinicApproval);
ProtectedDashboard.getLayout = AdminClinicApproval.getLayout;

export default ProtectedDashboard;
