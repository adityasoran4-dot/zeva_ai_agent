import React, { useMemo, useState, useEffect } from "react";
import ClinicLayout from "../../components/ClinicLayout";
import withClinicAuth from "../../components/withClinicAuth";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import axios from "axios";
import Loader from "../../components/Loader";
import { FileText } from "lucide-react";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";

const TOKEN_PRIORITY = [
  "clinicToken",
  "doctorToken",
  "agentToken",
  "staffToken",
  "userToken",
];

const DepartmentReport = dynamic(() => import("../../components/reports/DepartmentReport"), { ssr: false });
const PackageReport = dynamic(() => import("../../components/reports/PackageReport"), { ssr: false });
const MembershipReport = dynamic(() => import("../../components/reports/MembershipReport"), { ssr: false });
const AppointmentReport = dynamic(() => import("../../components/reports/AppointmentReport"), { ssr: false });
const PatientReport = dynamic(() => import("../../components/reports/PatientReport"), { ssr: false });
const LeadReport = dynamic(() => import("../../components/reports/LeadReport"), { ssr: false });
const DoctorStaffReport = dynamic(() => import("../../components/reports/DoctorStaffReport"), { ssr: false });
const RevenueReport = dynamic(() => import("../../components/reports/RevenueReport"), { ssr: false });
const RoomResourceReport = dynamic(() => import("../../components/reports/RoomResourceReport"), { ssr: false });
const StockReport = dynamic(() => import("../../components/reports/StockReport"), { ssr: false });
const OfferTrackReport = dynamic(() => import("../../components/reports/OfferTrackReport"), { ssr: false });

const TAB_CONFIG = {
  department: { label: "Department", color: "bg-teal-800 hover:bg-teal-900" },
  package: { label: "Package", color: "bg-teal-800 hover:bg-teal-900" },
  membership: { label: "Membership", color: "bg-teal-800 hover:bg-teal-900" },
  appointment: { label: "Appointment", color: "bg-teal-800 hover:bg-teal-900" },
  patient: { label: "Patient", color: "bg-teal-800 hover:bg-teal-900" },
  lead: { label: "Lead", color: "bg-teal-800 hover:bg-teal-900" },
  doctorStaff: { label: "Doctor Staff", color: "bg-teal-800 hover:bg-teal-900" },
  revenue: { label: "Revenue", color: "bg-teal-800 hover:bg-teal-900" },
  rooms: { label: "Rooms", color: "bg-teal-800 hover:bg-teal-900" },
  stock: { label: "Stock", color: "bg-teal-800 hover:bg-teal-900" },
  offerTrack: { label: "Offer Track", color: "bg-teal-800 hover:bg-teal-900" },
};

function ReportPage() {
  const [activeTab, setActiveTab] = useState<
    "department" | "package" | "membership" | "appointment" | "patient" | "lead" | "doctorStaff" | "rooms" | "revenue" | "stock" | "offerTrack"
  >("department");
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("clinicToken") ||
        sessionStorage.getItem("clinicToken") ||
        localStorage.getItem("agentToken") ||
        sessionStorage.getItem("agentToken") ||
        localStorage.getItem("userToken") ||
        sessionStorage.getItem("userToken")
      : "";

  const headers = useMemo(
    () => ({
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    }),
    [token]
  );

  // Determine if we're on an agent route
  const isAgentRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/agent/");

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(
    isAgentRoute ? "clinic_Report" : null,
  );
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

  // Helper function to get user info from token
  const getUserInfo = (): { role: string | null; id: string | null } => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      for (const key of TOKEN_PRIORITY) {
        const token =
          window.localStorage.getItem(key) ||
          window.sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(""),
            );
            const decoded = JSON.parse(jsonPayload);
            return {
              role: decoded.role || decoded.userRole || null,
              id: decoded.userId || decoded.id || null,
            };
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return { role: null, id: null };
  };

  // Helper function to get user role from token
  const getUserRole = (): string | null => {
    return getUserInfo().role;
  };

  // Helper function to get stored token
  const getStoredToken = (): string | null => {
    if (typeof window === "undefined") return null;
    for (const key of TOKEN_PRIORITY) {
      const token =
        window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
      if (token) return token;
    }
    return null;
  };

  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;

    const newPermissions = {
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    if (isAgentRoute) return;
    let isMounted = true;

    // Check which token type is being used
    const clinicToken =
      typeof window !== "undefined"
        ? localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken")
        : null;
    const doctorToken =
      typeof window !== "undefined"
        ? localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken")
        : null;
    const agentToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken")
        : null;
    const staffToken =
      typeof window !== "undefined"
        ? localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken")
        : null;
    const userToken =
      typeof window !== "undefined"
        ? localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken")
        : null;

    const userRole = getUserRole();
    const authToken =
      clinicToken || doctorToken || agentToken || staffToken || userToken;

    // For admin role, grant full access (bypass permission checks)
    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return;
    }

    // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!authToken) {
            if (!isMounted) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
            setPermissionsLoaded(true);
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            // Check if permissions array exists and is not null
            // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the clinic_Report module
              const modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for clinic_Report module variations
                if (p.module === "clinic_Report") return true;
                if (p.module === "clinic_report") return true;
                if (p.module === "report") return true;
                return false;
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};

                // Check if "all" is true, which grants all permissions
                const moduleAll =
                  actions.all === true ||
                  actions.all === "true" ||
                  String(actions.all).toLowerCase() === "true";
                const moduleCreate =
                  actions.create === true ||
                  actions.create === "true" ||
                  String(actions.create).toLowerCase() === "true";
                const moduleRead =
                  actions.read === true ||
                  actions.read === "true" ||
                  String(actions.read).toLowerCase() === "true";
                const moduleUpdate =
                  actions.update === true ||
                  actions.update === "true" ||
                  String(actions.update).toLowerCase() === "true";
                const moduleDelete =
                  actions.delete === true ||
                  actions.delete === "true" ||
                  String(actions.delete).toLowerCase() === "true";

                setPermissions({
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                });
              } else {
                // Module permission not found in the permissions array - default to read-only
                setPermissions({
                  canRead: true, // Clinic/doctor can always read their own data
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            // API response doesn't have permissions, default to full access (backward compatibility)
            setPermissions({
              canRead: true,
              canCreate: true,
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
              canCreate: true,
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

    // For agent/doctorStaff tokens (when not on agent route), check permissions
    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log(
            "Fetching Agent/Staff Permissions for clinic_Report...",
          );
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_Report" },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          const data = res.data;
          console.log("Agent Permissions API Response:", data);

          if (!isMounted) return;

          // Default to true if module not found in permissions (matches backend logic)
          if (
            !data?.permissions &&
            data?.error?.includes("not found in agent permissions")
          ) {
            console.log(
              "Module not found in permissions, granting full access by default",
            );
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          const actions =
            data?.permissions?.actions || data?.data?.moduleActions || {};
          const isTrue = (val: any) =>
            val === true ||
            val === "true" ||
            String(val || "").toLowerCase() === "true";

          const canAll = isTrue(actions.all);

          const newPerms = {
            canRead: canAll || isTrue(actions.read),
            canCreate: canAll || isTrue(actions.create),
            canUpdate: canAll || isTrue(actions.update),
            canDelete: canAll || isTrue(actions.delete),
          };

          console.log("Final Agent/Staff Permissions:", newPerms);
          setPermissions(newPerms);
        } catch (err: any) {
          console.error("Error fetching agent permissions:", err);
          // Swallow agent permission errors; they will just result in no extra access
          setPermissions({
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          });
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchPermissions();
      return;
    }

    // Default: no token, no permissions
    if (!authToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
    }
  }, [isAgentRoute]);

  // Show loading while permissions are being fetched
  if (!permissionsLoaded) return <Loader />;

  // Show access denied message if no permission
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-700">
            You do not have permission to view reports. Please contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section - Responsive */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[90%] sm:max-w-9xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">View detailed performance metrics and insights</p>
            </div>
            <div className="bg-blue-50 rounded-lg px-3 sm:px-4 py-2 border border-blue-100 w-full sm:w-auto">
              <div className="text-xs text-gray-600 font-medium">Date Range</div>
              <div className="text-xs sm:text-sm font-semibold text-gray-900">
                {dayjs(startDate).format("MMM DD, YYYY")} - {dayjs(endDate).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[90%] sm:max-w-9xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Date Filter & Tabs Container - Responsive */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-4 sm:mb-6 overflow-hidden">
          {/* Tabs Navigation - Scrollable on Mobile */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-3 sm:px-6 py-2 sm:py-3">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                {Object.entries(TAB_CONFIG).map(([key, config]) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key as any)}
                      className={`group px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? `${config.color} text-white shadow-md`
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date Range Selector - Stacked on Mobile */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 italic w-full sm:w-auto text-center sm:text-left">
                Select date range to view analytics
              </div>
            </div>
          </div>
        </div>

        {/* Report Content - Responsive */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-3 sm:p-6 min-h-[500px] sm:min-h-[600px] overflow-x-auto">
          {activeTab === "department" && <DepartmentReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "package" && <PackageReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "membership" && <MembershipReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "appointment" && <AppointmentReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "patient" && <PatientReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "lead" && <LeadReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "doctorStaff" && <DoctorStaffReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "revenue" && <RevenueReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "rooms" && <RoomResourceReport startDate={startDate} endDate={endDate} headers={headers} />}
          {activeTab === "stock" && <StockReport startDate={startDate} endDate={endDate} headers={headers} />}
                    {activeTab === "offerTrack" && <OfferTrackReport startDate={startDate} endDate={endDate} headers={headers} canUpdate={permissions.canUpdate} />}
        </div>
      </div>
    </div>
  );
}

ReportPage.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

const Protected = withClinicAuth(ReportPage as any);
(Protected as any).getLayout = ReportPage.getLayout;

export default Protected;
