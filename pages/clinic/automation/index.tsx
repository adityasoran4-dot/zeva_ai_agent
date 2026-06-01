import { useState, ReactElement, useEffect, useCallback } from "react";
import {
  Zap,
  Plus,
  Search,
  Filter,
  Clock,
  Activity,
  Users,
  Calendar,
  FileText,
  Settings,
  LayoutGrid,
  List,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { NextPageWithLayout } from "@/pages/_app";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import Loader from "@/components/Loader";
import AddWorkflow from "./_components/AddWorkflow";
import DeleteWorkflowConfirmModal from "./_components/DeleteWorkflowConfirmModal";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { Workflow } from "@/types/workflows";
import { useRouter } from "next/router";

const AUTOMATION_MODULE_KEY = "Clinic_Automation";

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
      localStorage.getItem(key) || sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const isTruthy = (val: unknown) =>
  val === true || val === "true" || String(val || "").toLowerCase() === "true";

const getUserInfo = (): { role: string | null; id: string | null } => {
  if (typeof window === "undefined") return { role: null, id: null };
  try {
    for (const key of TOKEN_PRIORITY) {
      const token = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (!token) continue;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        );
        const decoded = JSON.parse(jsonPayload);
        return {
          role: decoded.role || decoded.userRole || null,
          id: decoded.userId || decoded.id || null,
        };
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error("Error getting user info:", error);
  }
  return { role: null, id: null };
};

const getUserRole = () => getUserInfo().role;

const findAutomationModule = (permissionsList: any[]) =>
  permissionsList.find((p: any) => {
    if (!p?.module) return false;
    const mod = String(p.module).toLowerCase();
    return (
      mod === "clinic_automation" ||
      mod === "automation" ||
      mod === "clinic_automations"
    );
  });

const parsePermissionActions = (actions: Record<string, unknown> = {}) => {
  const moduleAll = isTruthy(actions.all);
  return {
    canRead: moduleAll || isTruthy(actions.read),
    canCreate: moduleAll || isTruthy(actions.create),
    canUpdate: moduleAll || isTruthy(actions.update),
    canDelete: moduleAll || isTruthy(actions.delete),
  };
};

const statusColors = {
  Active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  Inactive: "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20",
};

const entityColors = {
  Patient: "bg-blue-50 text-blue-700",
  Appointment: "bg-purple-50 text-purple-700",
  Invoice: "bg-amber-50 text-amber-700",
  Lead: "bg-rose-50 text-rose-700",
};

const gradientColors = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  amber: "from-amber-500 to-amber-600",
  indigo: "from-indigo-500 to-indigo-600",
  rose: "from-rose-500 to-rose-600",
};

const entityIcons = {
  Patient: Users,
  Appointment: Calendar,
  Invoice: FileText,
  Lead: Users, // Or a more specific icon for leads
  Message: MessageSquare,
  Webhook: Zap,
};

const AutomationPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
    null,
  );
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkflows, setTotalWorkflows] = useState(0);
  const [stats, setStats] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [itemsPerPage] = useState(9);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  // Clinic-level (sidebar-permissions) + agent/doctorStaff-level (get-module-permissions)
  useEffect(() => {
    let isMounted = true;

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
    const authToken = getStoredToken();

    if (userRole === "admin") {
      if (!isMounted) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          const clinicAuthToken = clinicToken || doctorToken || authToken;
          if (!clinicAuthToken) {
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
            headers: { Authorization: `Bearer ${clinicAuthToken}` },
          });

          if (!isMounted) return;

          if (res.data.success) {
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              const modulePermission = findAutomationModule(res.data.permissions);
              if (modulePermission) {
                setPermissions(
                  parsePermissionActions(modulePermission.actions || {}),
                );
              } else {
                setPermissions({
                  canRead: true,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                });
              }
            }
          } else {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } catch (err) {
          console.error("Error fetching clinic sidebar permissions:", err);
          if (isMounted) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchClinicPermissions();
      return () => {
        isMounted = false;
      };
    }

    const agentStaffToken = getStoredToken();
    if (!agentStaffToken) {
      setPermissions({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      });
      setPermissionsLoaded(true);
      return () => {
        isMounted = false;
      };
    }

    if (
      agentToken ||
      staffToken ||
      userToken ||
      userRole === "agent" ||
      userRole === "doctorStaff" ||
      userRole === "staff"
    ) {
      const fetchAgentPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          let permissionToken = agentStaffToken;
          if (userRole === "agent") {
            permissionToken = agentToken || agentStaffToken;
          } else if (userRole === "doctorStaff" || userRole === "staff") {
            permissionToken = userToken || staffToken || agentStaffToken;
          }

          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: AUTOMATION_MODULE_KEY },
            headers: { Authorization: `Bearer ${permissionToken}` },
          });

          if (!isMounted) return;

          if (
            !res.data?.permissions &&
            res.data?.error?.includes("not found in agent permissions")
          ) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            });
            return;
          }

          if (res.data?.success && res.data?.permissions) {
            setPermissions(
              parsePermissionActions(res.data.permissions.actions || {}),
            );
          } else {
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            });
          }
        } finally {
          if (isMounted) setPermissionsLoaded(true);
        }
      };

      fetchAgentPermissions();
    } else {
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      });
      setPermissionsLoaded(true);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (!permissions.canRead) {
      setWorkflows([]);
      setLoading(false);
      setError(null);
      setIsDeleteModalOpen(false);
      setWorkflowToDelete(null);
    }
  }, [permissionsLoaded, permissions.canRead]);

  const canViewData = permissions.canRead;
  const canCreateActions = permissions.canCreate;
  const canUpdateActions = permissions.canRead && permissions.canUpdate;
  const canDeleteActions = permissions.canRead && permissions.canDelete;

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get("/api/workflows", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          status: filterStatus === "all" ? "" : filterStatus,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setWorkflows(data.data.workflows);
        setTotalPages(data.data.pagination.totalPages);
        setTotalWorkflows(data.data.pagination.totalResults);
        if (data.data.stats) {
          setStats(data.data.stats);
        }
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "An error occurred while fetching workflows.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, filterStatus]);

  useEffect(() => {
    if (!permissionsLoaded || !canViewData) return;
    fetchWorkflows();
  }, [fetchWorkflows, permissionsLoaded, canViewData]);

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (!canDeleteActions) return;
    setWorkflowToDelete(workflow);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteWorkflow = async () => {
    if (!canDeleteActions) return;
    if (!workflowToDelete) return;

    try {
      const token = getTokenByPath();
      const { data } = await axios.delete(
        `/api/workflows/${workflowToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        fetchWorkflows();
        setIsDeleteModalOpen(false);
        setWorkflowToDelete(null);
      } else {
        throw new Error(data.message || "Failed to delete workflow");
      }
    } catch (err: any) {
      console.error("Error deleting workflow:", err);
      throw new Error(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete workflow",
      );
    }
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Loader />
      </div>
    );
  }

  if (!canViewData && !canCreateActions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-700">
            You do not have permission to view automation workflows. Please contact
            your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  Automation Center
                </h1>
              </div>
              <p className="text-lg text-blue-100 max-w-2xl">
                Streamline your clinic's operations with intelligent workflows.
              </p>
            </div>
            {canCreateActions && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative px-6 py-3.5 bg-white text-blue-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Workflow
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {!canViewData && (
          <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Access Denied</h3>
            <p className="mt-2 text-sm text-gray-700">
              You do not have permission to view automation workflows. You can still
              create new workflows if permitted.
            </p>
          </div>
        )}

        {canViewData && (
        <>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Workflows
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalWorkflows}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Active and Inactive</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Workflows
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeWorkflows}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-emerald-600 font-medium">Running</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Executions
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalExecutions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-purple-600 font-medium">Lifetime runs</span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/60 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchWorkflows()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 text-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 text-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-300">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={fetchWorkflows}
                className="px-4 py-2.5 border border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 text-red-600">
            {error}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workflows.map((workflow) => {
                  const Icon =
                    entityIcons[workflow.entity as keyof typeof entityIcons] ||
                    Settings;

                  // Deterministic color based on ID for consistency
                  const colorKeys = Object.keys(gradientColors) as Array<
                    keyof typeof gradientColors
                  >;
                  const color =
                    colorKeys[
                      workflow._id.charCodeAt(workflow._id.length - 1) %
                        colorKeys.length
                    ];

                  const triggerNode = workflow?.nodes?.find(
                    (node) => node.type === "trigger",
                  );

                  return (
                    <div
                      key={workflow._id}
                      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/60 hover:border-transparent transition-all duration-300 overflow-hidden"
                    >
                      <div
                        className={`h-2 bg-gradient-to-r ${gradientColors[color]}`}
                      />
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-3 rounded-xl bg-gradient-to-br ${gradientColors[color]} shadow-sm`}
                            >
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3
                                onClick={() =>
                                  router.push(
                                    `/clinic/automation/${workflow._id}`,
                                  )
                                }
                                className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                {workflow.name?.length > 17
                                  ? `${workflow.name?.substring(0, 17)}...`
                                  : workflow.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {(workflow?.description || "")?.length > 30
                                  ? `${workflow.description?.substring(0, 30)}...`
                                  : workflow.description ||
                                    "No description provided"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {canDeleteActions && (
                              <button
                                onClick={() => handleDeleteWorkflow(workflow)}
                                className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete Workflow"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                            {canUpdateActions && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/clinic/automation/${workflow._id}`,
                                  )
                                }
                                className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Workflow Settings"
                              >
                                <Settings className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-4">
                          <strong>Trigger:</strong>{" "}
                          {triggerNode?.data?.label || "Not set"}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[workflow.status as keyof typeof statusColors]}`}
                          >
                            {workflow.status}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${entityColors[workflow.entity as keyof typeof entityColors] || "bg-gray-100 text-gray-700"}`}
                          >
                            {workflow.entity}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Total Runs
                            </p>
                            <p className="text-lg font-semibold text-gray-900">
                              {(workflow.runs || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Success Rate
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold text-gray-900">
                                {workflow.successRate || 0}%
                              </p>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${gradientColors[color]}`}
                                  style={{
                                    width: `${workflow.successRate || 0}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>
                              Created{" "}
                              {new Date(
                                workflow.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              router.push(`/clinic/automation/${workflow._id}`)
                            }
                            className="px-3 py-1.5 text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Workflow
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Trigger
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Entity
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Stats
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workflows.map((workflow) => {
                        const Icon =
                          entityIcons[
                            workflow.entity as keyof typeof entityIcons
                          ] || Settings;
                        const triggerNode = workflow?.nodes?.find(
                          (node) => node.type === "trigger",
                        );
                        return (
                          <tr
                            key={workflow._id}
                            className="group hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <p
                                    onClick={() =>
                                      router.push(
                                        `/clinic/automation/${workflow._id}`,
                                      )
                                    }
                                    className="text-sm font-bold text-gray-900 group-hover:text-blue-600 cursor-pointer transition-colors"
                                  >
                                    {workflow.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Created on{" "}
                                    {new Date(
                                      workflow.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 font-medium">
                                {triggerNode?.data?.label || "Not set"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-tight ${statusColors[workflow.status as keyof typeof statusColors]}`}
                              >
                                {workflow.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-tight ${entityColors[workflow.entity as keyof typeof entityColors] || "bg-gray-100 text-gray-700"}`}
                              >
                                {workflow.entity}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <p className="text-xs font-bold text-gray-700">
                                  {workflow.runs || 0} runs
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500"
                                      style={{
                                        width: `${workflow.successRate || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-500">
                                    {workflow.successRate || 0}%
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                {canUpdateActions && (
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/clinic/automation/${workflow._id}`,
                                      )
                                    }
                                    className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                                    title="Workflow Settings"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                )}

                                {canDeleteActions && (
                                  <button
                                    onClick={() => handleDeleteWorkflow(workflow)}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                                    title="Delete Workflow"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {totalWorkflows === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  No workflows found
                </h3>
                <p className="text-gray-500">
                  Create a new workflow to get started.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalWorkflows > itemsPerPage && (
              <div className="mt-12 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalWorkflows)} of{" "}
                  {totalWorkflows} workflows
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      currentPage === 1
                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => paginate(index + 1)}
                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${
                          currentPage === index + 1
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "text-gray-600 border border-transparent hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl border transition-all ${
                      currentPage === totalPages
                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>
      {canCreateActions && (
        <AddWorkflow
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onWorkflowCreated={() => {
            if (canViewData) fetchWorkflows();
          }}
        />
      )}
      <DeleteWorkflowConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setWorkflowToDelete(null);
        }}
        onConfirm={confirmDeleteWorkflow}
        workflowName={workflowToDelete?.name || ""}
      />
    </div>
  );
};

// Layout configuration
AutomationPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedAutomationPage = withClinicAuth(
  AutomationPage,
) as NextPageWithLayout;
ProtectedAutomationPage.getLayout = AutomationPage.getLayout;

export default ProtectedAutomationPage;
