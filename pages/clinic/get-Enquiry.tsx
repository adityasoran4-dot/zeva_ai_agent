"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Search,
  User,
  Calendar,
  Mail,
  MessageSquare,
  X,
  Inbox,
  CalendarDays,
  Bell,
  Filter,
} from "lucide-react";
import ClinicLayout from "../../components/ClinicLayout";
import type { NextPageWithLayout } from "../_app";
import withClinicAuth from "../../components/withClinicAuth";
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import { Toaster} from 'react-hot-toast';
import Loader from '../../components/Loader';

interface Enquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}

interface EnquiriesResponse {
  enquiries: Enquiry[];
}

const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
  "adminToken",
];

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_PRIORITY) {
    const value =
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

function ClinicEnquiries({ contextOverride = null }: { contextOverride?: "clinic" | "agent" | null }) {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "today" | "7d" | "30d">(
    "all"
  );
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [permissions, setPermissions] = useState({
    canRead: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

  const [routeContext, setRouteContext] = useState<"clinic" | "agent">(
    contextOverride || "clinic"
  );

  // Detect agent route and token
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      setHasAgentToken(Boolean(localStorage.getItem("agentToken")));
    };
    syncTokens();
    window.addEventListener("storage", syncTokens);
    return () => window.removeEventListener("storage", syncTokens);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const agentPath =
      router?.pathname?.startsWith("/agent/") ||
      window.location.pathname?.startsWith("/agent/");
    setIsAgentRoute(agentPath && hasAgentToken);
  }, [router.pathname, hasAgentToken]);

  useEffect(() => {
    if (contextOverride) {
      setRouteContext(contextOverride);
      return;
    }
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname || "";
    if (currentPath.startsWith("/agent/")) {
      setRouteContext("agent");
    } else {
      setRouteContext("clinic");
    }
  }, [contextOverride]);

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(isAgentRoute ? "clinic_enquiry" : null);
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;
    
    // For agent routes, we check read, update, and delete permissions
    const newPermissions = {
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
    };
    
    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Handle clinic permissions - clinic, doctor, and staff have full access by default
  useEffect(() => {
    if (isAgentRoute) return;
    let isMounted = true;
    
    // Check which token type is being used
    const clinicToken = typeof window !== "undefined" ? 
      (localStorage.getItem("clinicToken") || sessionStorage.getItem("clinicToken")) : null;
    const doctorToken = typeof window !== "undefined" ? 
      (localStorage.getItem("doctorToken") || sessionStorage.getItem("doctorToken")) : null;
    const agentToken = typeof window !== "undefined" ? 
      (localStorage.getItem("agentToken") || sessionStorage.getItem("agentToken")) : null;
    const staffToken = typeof window !== "undefined" ? 
      (localStorage.getItem("staffToken") || sessionStorage.getItem("staffToken")) : null;

    // ✅ For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (clinicToken || doctorToken) {
      const fetchClinicPermissions = async () => {
        try {
          const token = getStoredToken();
          if (!token) {
            if (!isMounted) return;
            setPermissions({ canRead: false, canUpdate: false, canDelete: false });
            setPermissionsLoaded(true);
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            // Check if permissions array exists and is not null
            // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
            if (res.data.permissions === null || !Array.isArray(res.data.permissions) || res.data.permissions.length === 0) {
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the clinic_enquiry module or as submodule of clinic_marketing
              let actions: { all?: boolean | string; read?: boolean | string; update?: boolean | string; delete?: boolean | string } = {};
              
              // First, check if clinic_enquiry is a top-level module
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                return p.module === "clinic_enquiry" || p.module === "enquiry";
              });

              if (modulePermission) {
                actions = modulePermission.actions || {};
              } else {
                // If not top-level, check as submodule of clinic_marketing
                const marketingModule = res.data.permissions.find((p: any) => p?.module === "clinic_marketing");
                if (marketingModule && Array.isArray(marketingModule.subModules)) {
                  const enquirySubModule = marketingModule.subModules.find((sub: any) => 
                    sub.name === "Enquiry" || sub.moduleKey === "clinic_enquiry"
                  );
                  if (enquirySubModule) {
                    actions = enquirySubModule.actions || {};
                  } else {
                    // Check marketing module's top-level actions if submodule not found
                    actions = marketingModule.actions || {};
                  }
                }
              }

              // Check if "all" is true, which grants all permissions
              const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
              const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
              const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
              const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

              setPermissions({
                canRead: moduleAll || moduleRead,
                canUpdate: moduleAll || moduleUpdate,
                canDelete: moduleAll || moduleDelete,
              });
            }
          } else {
            // API response indicates failure, default to full access (backward compatibility)
            setPermissions({
              canRead: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err: any) {
          console.error("Error fetching clinic sidebar permissions:", err);
          // On error, default to full access (backward compatibility)
          if (isMounted) {
            setPermissions({
              canRead: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchClinicPermissions();
      return;
    }

    // ✅ Staff role has full access by default - skip permission check
    if (staffToken) {
      if (!isMounted) return;
      setPermissions({ canRead: true, canUpdate: true, canDelete: true });
      setPermissionsLoaded(true);
      return;
    }

    // For agent/doctorStaff tokens (when not on agent route), check permissions
    const token = getStoredToken();
    if (!token) {
      setPermissions({ canRead: false, canUpdate: false, canDelete: false });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    if (agentToken) {
      const fetchPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_enquiry" },
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = res.data;
          
          if (!isMounted) return;
          if (data.success && data.data) {
            const moduleActions = data.data.moduleActions || {};
            setPermissions({
              canRead: Boolean(moduleActions.all || moduleActions.read),
              canUpdate: Boolean(moduleActions.all || moduleActions.update),
              canDelete: Boolean(moduleActions.all || moduleActions.delete),
            });
          } else {
            setPermissions({ canRead: false, canUpdate: false, canDelete: false });
          }
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          setPermissions({ canRead: false, canUpdate: false, canDelete: false });
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchPermissions();
    } else {
      // Unknown token type - default to read-only for safety
      if (!isMounted) return;
      setPermissions({ canRead: true, canUpdate: false, canDelete: false });
      setPermissionsLoaded(true);
    }

    return () => { isMounted = false; };
  }, [isAgentRoute]);

  // Fetch enquiries only if permissions are loaded and user has read permission
  useEffect(() => {
    if (!permissionsLoaded) return;
    
    // ✅ Only fetch enquiries if user has read permission
    if (!permissions.canRead) {
      setEnquiries([]);
      setFilteredEnquiries([]);
      setLoading(false);
      return;
    }

    const fetchEnquiries = async () => {
      try {
        if (typeof window === "undefined") return;
        const token = getStoredToken();
        if (!token) {
          setEnquiries([]);
          setFilteredEnquiries([]);
          setLoading(false);
          return;
        }

        const res = await axios.get<EnquiriesResponse>(
          routeContext === "agent"
            ? "/api/clinics/getEnquiries?scope=clinic"
            : "/api/clinics/getEnquiries",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setEnquiries(res.data.enquiries || []);
        setFilteredEnquiries(res.data.enquiries || []);
      } catch (err: any) {
        // Gracefully handle permission denials without surfacing axios errors
        if (err.response?.status === 403) {
          setPermissions({ canRead: false, canUpdate: false, canDelete: false });
          setEnquiries([]);
          setFilteredEnquiries([]);
        } else {
          console.error("Error fetching enquiries:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, [routeContext, permissionsLoaded, permissions.canRead]);

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isWithinLastDays = (dateString: string, days: number) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff =
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  };

  useEffect(() => {
    let filtered = [...enquiries];

    if (timeFilter === "today") {
      filtered = filtered.filter((enquiry) => isToday(enquiry.createdAt));
    } else if (timeFilter === "7d") {
      filtered = filtered.filter((enquiry) =>
        isWithinLastDays(enquiry.createdAt, 7)
      );
    } else if (timeFilter === "30d") {
      filtered = filtered.filter((enquiry) =>
        isWithinLastDays(enquiry.createdAt, 30)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (enquiry) =>
          enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          enquiry.phone.includes(searchTerm)
      );
    }

    filtered.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    setFilteredEnquiries(filtered);
  }, [enquiries, searchTerm, timeFilter, sortOrder]);

  const totalEnquiries = enquiries.length;
  const todaysEnquiries = enquiries.filter((enquiry) =>
    isToday(enquiry.createdAt)
  ).length;
  const unreadEnquiries = enquiries.length;
  const lastEnquiryDate =
    enquiries.length > 0
      ? new Date(
          Math.max(
            ...enquiries.map((enquiry) =>
              new Date(enquiry.createdAt).getTime()
            )
          )
        ).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "No enquiries yet";



  if (loading || !permissionsLoaded || (isAgentRoute && agentPermissionsLoading)) {
    return <Loader />;
  }

  // Show access denied message if no permission
  if (permissionsLoaded && !permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
          <p className="text-sm text-teal-700 mb-4">
            You do not have permission to view clinic enquiries.
          </p>
          <p className="text-xs text-teal-600">
            Please contact your administrator to request access to the Enquiries module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
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
      {/* Compact Unique Header */}
      <div className="bg-white dark:bg-teal-800 rounded-lg border border-teal-200 dark:border-teal-700 shadow-sm mb-4 sm:mb-6">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between mb-4">
            {/* Left: Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-800 dark:bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-teal-900 dark:text-teal-100">
                  Patient Enquiries
                </h1>
                <p className="text-[10px] sm:text-xs text-teal-700 dark:text-teal-400">
                  {enquiries.length} total enquiries
                </p>
              </div>
            </div>

            {/* Right: Count Badge */}
            <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-700 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-600">
              <div className="text-lg sm:text-xl font-bold text-teal-900 dark:text-teal-100">
                {enquiries.length}
              </div>
              <div className="text-[10px] sm:text-xs text-teal-700 dark:text-teal-300 font-medium">Total</div>
            </div>
          </div>
          
          {/* Compact Stats Grid - Unique Card Style with teal Theme */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-teal-50 dark:bg-teal-700/50 border-l-4 border-teal-800 dark:border-teal-500 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-teal-800 dark:bg-teal-600 rounded-lg flex items-center justify-center">
                  <Inbox className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] uppercase text-teal-700 dark:text-teal-300 tracking-wide font-semibold">
                  Total
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-teal-900 dark:text-teal-100">
                {totalEnquiries}
              </p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-700/50 border-l-4 border-teal-700 dark:border-teal-600 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-teal-700 dark:bg-teal-500 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] uppercase text-teal-700 dark:text-teal-300 tracking-wide font-semibold">
                  Today
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-teal-900 dark:text-teal-100">
                {todaysEnquiries}
              </p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-700/50 border-l-4 border-teal-600 dark:border-teal-400 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-teal-600 dark:bg-teal-400 rounded-lg flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] uppercase text-teal-700 dark:text-teal-300 tracking-wide font-semibold">
                  Pending
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-teal-900 dark:text-teal-100">
                {unreadEnquiries}
              </p>
            </div>
            <div className="bg-teal-50 dark:bg-teal-700/50 border-l-4 border-teal-500 dark:border-teal-300 rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-teal-500 dark:bg-teal-300 rounded-lg flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] uppercase text-teal-700 dark:text-teal-300 tracking-wide font-semibold">
                  Last
                </p>
              </div>
              <p className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-100 truncate">
                {lastEnquiryDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6">
        {/* Compact Search Bar & Controls - Unique Style */}
        <div className="bg-white dark:bg-teal-800 rounded-lg shadow-sm border border-teal-200 dark:border-teal-700 p-4 sm:p-5 mb-4 sm:mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-teal-900 dark:text-teal-100 w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-teal-200 dark:border-teal-600 rounded-lg focus:ring-2 focus:ring-teal-800/20 dark:focus:ring-teal-500/50 focus:border-teal-800 dark:focus:border-teal-500 outline-none transition-all bg-white dark:bg-teal-700 placeholder-teal-400 dark:placeholder-teal-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-teal-100 dark:hover:bg-teal-600 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <select
                value={timeFilter}
                onChange={(e) =>
                  setTimeFilter(e.target.value as "all" | "today" | "7d" | "30d")
                }
                className="border border-teal-200 dark:border-teal-600 rounded-lg px-2.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-800/20 dark:focus:ring-teal-500/50 focus:border-teal-800 dark:focus:border-teal-500 bg-white dark:bg-teal-700 text-teal-900 dark:text-teal-100"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as "newest" | "oldest")
                }
                className="border border-teal-200 dark:border-teal-600 rounded-lg px-2.5 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-teal-800/20 dark:focus:ring-teal-500/50 focus:border-teal-800 dark:focus:border-teal-500 bg-white dark:bg-teal-700 text-teal-900 dark:text-teal-100"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {searchTerm && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs text-teal-700 dark:text-teal-300 pt-2 border-t border-teal-100 dark:border-teal-700">
              <span className="font-medium">Results for:</span>
              <span className="bg-teal-100 dark:bg-teal-700 text-teal-800 dark:text-teal-200 px-2 py-0.5 rounded-md font-medium break-all">
                &quot;{searchTerm}&quot;
              </span>
              <span className="text-teal-700 dark:text-teal-300">({filteredEnquiries.length} found)</span>
            </div>
          )}
        </div>

        {/* Enquiries List - Unique Card Design */}
        <div className="space-y-3 sm:space-y-4">
          {filteredEnquiries.length === 0 ? (
            <div className="bg-white dark:bg-teal-800 rounded-lg shadow-sm border border-teal-200 dark:border-teal-700 p-8 sm:p-10 text-center">
              <div className="bg-teal-100 dark:bg-teal-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-teal-800 dark:text-teal-200" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-teal-900 dark:text-teal-100 mb-2">
                {searchTerm ? "No results found" : "No enquiries yet"}
              </h3>
              <p className="text-xs sm:text-sm text-teal-700 dark:text-teal-400 mb-4">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "Patient enquiries will appear here when they contact your clinic."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="bg-teal-800 dark:bg-teal-600 text-white px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-teal-900 dark:hover:bg-teal-700 transition-colors font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredEnquiries.map((enquiry) => {
              const isTodayEnquiry = isToday(enquiry.createdAt);
              const isRecent = isWithinLastDays(enquiry.createdAt, 7);
              
              return (
                <div
                  key={enquiry._id}
                  className="bg-white dark:bg-teal-800 rounded-lg shadow-sm border-l-4 border-teal-800 dark:border-teal-500 hover:shadow-lg hover:border-teal-900 dark:hover:border-teal-400 transition-all duration-200 group"
                >
                  {/* Unique Card Design */}
                  <div className="p-4 sm:p-5">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Avatar with teal theme */}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
                          isTodayEnquiry 
                            ? 'bg-teal-800 dark:bg-teal-600' 
                            : isRecent 
                            ? 'bg-teal-700 dark:bg-teal-500'
                            : 'bg-teal-600 dark:bg-teal-400'
                        }`}>
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm sm:text-base font-bold text-teal-900 dark:text-teal-100 truncate">
                              {enquiry.name}
                            </h3>
                            {isTodayEnquiry && (
                              <span className="px-1.5 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-[10px] font-semibold rounded-md border border-teal-200 dark:border-teal-700">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <a
                              href={`mailto:${enquiry.email}`}
                              className="flex items-center gap-1 text-teal-800 dark:text-teal-200 hover:text-teal-900 dark:hover:text-teal-100 transition-colors text-[10px] sm:text-xs break-all font-medium"
                            >
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{enquiry.email}</span>
                            </a>
                            {enquiry.phone && (
                              <span className="text-teal-400 dark:text-teal-500 text-[10px]">•</span>
                            )}
                            {enquiry.phone && (
                              <span className="text-teal-700 dark:text-teal-300 text-[10px] sm:text-xs">
                                {enquiry.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Date Badge */}
                      <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-700 px-2 py-1 rounded-md flex-shrink-0">
                        <Calendar className="w-3 h-3 text-teal-500 dark:text-teal-400" />
                        <span className="text-[10px] sm:text-xs text-teal-700 dark:text-teal-300 whitespace-nowrap">
                          {new Date(enquiry.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Message Box - teal Theme */}
                    <div className="mt-3 bg-teal-50 dark:bg-teal-700/50 rounded-lg p-3 sm:p-4 border border-teal-200 dark:border-teal-600">
                      <div className="flex items-start gap-2 mb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-800 dark:text-teal-200 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold text-teal-900 dark:text-teal-100 text-xs sm:text-sm">
                          Message:
                        </span>
                      </div>
                      <p className="text-teal-700 dark:text-teal-300 leading-relaxed pl-5 text-xs sm:text-sm break-words italic">
                        &quot;{enquiry.message}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

ClinicEnquiries.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

export const ClinicEnquiriesBase = ClinicEnquiries;

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(ClinicEnquiries);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicEnquiries.getLayout;

export default ProtectedDashboard;
