import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import { NextPageWithLayout } from "../../_app";
import {
  Search,
  Plus,
  Mail,
  MessageSquare,
  Check,
  X,
  Clock,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Grid,
  List,
  RefreshCcw,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { Template } from "@/types/templates";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import DeleteTemplateModal from "./_components/DeleteTemplateModal";
import { useRouter } from "next/router";
import { getTokenByPath } from "@/lib/helper";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";
import Loader from "@/components/Loader";

const TEMPLATE_MODULE_KEY = "clinic_templates";

const TemplatesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  const [permissions, setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
    canAssign: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalTemplates, setTotalTemplates] = useState<number>(0);
  const [_loading, setLoading] = useState<boolean>(false);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] =
    useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [deleteTemplateLoading, setDeleteTemplateLoading] =
    useState<boolean>(false);
  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  const templatesPerPage = 10;

  const token = getTokenByPath();

  // Check if on agent route
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const isAgentRoute = currentPath.startsWith("/agent/");

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(
    isAgentRoute ? TEMPLATE_MODULE_KEY : null,
  );
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;

    const newPermissions = {
      canRead: Boolean(agentPermissions.canAll || agentPermissions.canRead),
      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),
      canUpdate: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),
      canDelete: Boolean(agentPermissions.canAll || agentPermissions.canDelete),
      canAssign: Boolean(agentPermissions.canAll),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Helper function to get user info from token
  const getUserInfo = (): { role: string | null; id: string | null } => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      const TOKEN_PRIORITY = [
        "clinicToken",
        "doctorToken",
        "agentToken",
        "staffToken",
        "userToken",
      ];
      for (const key of TOKEN_PRIORITY) {
        const tokenVal =
          localStorage.getItem(key) || sessionStorage.getItem(key);
        if (tokenVal) {
          try {
            const base64Url = tokenVal.split(".")[1];
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
    return (
      localStorage.getItem("agentToken") ||
      sessionStorage.getItem("agentToken") ||
      localStorage.getItem("staffToken") ||
      sessionStorage.getItem("staffToken") ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      null
    );
  };

  // Handle clinic permissions - clinic, doctor have admin-level permissions; agent/doctorStaff need checks
  useEffect(() => {
    if (isAgentRoute) return;
    if (!isMounted) return;
    let isMountedFlag = true;

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
      if (!isMountedFlag) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canAssign: true,
      });
      setPermissionsLoaded(true);
      return;
    }

    // For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!authToken) {
            if (!isMountedFlag) return;
            setPermissions({
              canRead: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canAssign: false,
            });
            setPermissionsLoaded(true);
            return;
          }

          const res = await axios.get("/api/clinic/sidebar-permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (!isMountedFlag) return;

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
                canAssign: true,
              });
            } else {
              // Admin has set permissions - check the clinic_templates module
              // First check top-level permissions
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module && !p?.moduleKey) return false;
                // Check for clinic_templates module variations
                if (p.module === "clinic_templates") return true;
                if (p.module === "clinic_Templates") return true;
                if (p.module === "templates") return true;
                if (p.moduleKey === "clinic_templates") return true;
                if (p.moduleKey === "clinic_Templates") return true;
                if (p.moduleKey === "templates") return true;
                return false;
              });

              // If not found at top level, check in subModules of parent modules
              if (!modulePermission) {
                for (const parentModule of res.data.permissions) {
                  if (
                    parentModule.subModules &&
                    parentModule.subModules.length > 0
                  ) {
                    const foundInSubModule = parentModule.subModules.find(
                      (sm: any) => {
                        if (sm.moduleKey === "clinic_templates") return true;
                        if (sm.moduleKey === "clinic_Templates") return true;
                        if (sm.moduleKey === "templates") return true;
                        return false;
                      },
                    );
                    if (foundInSubModule) {
                      modulePermission = { actions: foundInSubModule.actions };
                      break;
                    }
                  }
                }
              }

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
                  canAssign: moduleAll,
                });
              } else {
                // Module permission not found in the permissions array - default to read-only
                setPermissions({
                  canRead: true, // Clinic/doctor can always read their own data
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                  canAssign: false,
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
              canAssign: true,
            });
          }
        } catch (err: any) {
          console.error("Error fetching clinic sidebar permissions:", err);
          // On error, default to full access (backward compatibility)
          if (isMountedFlag) {
            setPermissions({
              canRead: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
              canAssign: true,
            });
          }
        } finally {
          if (isMountedFlag) {
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
        canAssign: false,
      });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    if (agentToken || staffToken || userToken) {
      const fetchPermissions = async () => {
        try {
          console.log(
            "Fetching Agent/Staff Permissions for",
            TEMPLATE_MODULE_KEY,
            "...",
          );
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: TEMPLATE_MODULE_KEY },
            headers: { Authorization: `Bearer ${agentStaffToken}` },
          });
          const data = res.data;
          console.log("Agent Permissions API Response:", data);

          if (!isMountedFlag) return;

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
              canAssign: true,
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
            canAssign: canAll,
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
            canAssign: false,
          });
        } finally {
          if (isMountedFlag) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchPermissions();
    } else {
      // Unknown token type - default to full access (likely clinic/doctor)
      if (!isMountedFlag) return;
      setPermissions({
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canAssign: true,
      });
      setPermissionsLoaded(true);
    }

    return () => {
      isMountedFlag = false;
    };
  }, [isAgentRoute, isMounted]);

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await axios.get("/api/all-templates", {
        params: {
          page: currentPage,
          limit: templatesPerPage,
          search: searchQuery,
          statuses: JSON.stringify(
            filterStatus === "all" ? [] : [filterStatus],
          ),
          types: JSON.stringify(filterType === "all" ? [] : [filterType]),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res?.data?.success) {
        setTemplates(res?.data?.templates || []);
        setTotalPages(res?.data?.pagination?.totalPages || 1);
        setTotalTemplates(res?.data?.pagination?.totalResults || 0);
      } else {
        // If permission denied, clear templates
        if (res.data?.message && res.data?.message.includes("permission")) {
          setTemplates([]);
        }
      }
    } catch (error) {
      console.log("Error fetching templates: ", error);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    filterStatus,
    filterType,
    searchQuery,
    token,
    templatesPerPage,
  ]);

  const handleSyncTemplates = async () => {
    const token = getTokenByPath();
    console.log("Syncing templates...", { token });
    if (!token) return;
    try {
      setIsSyncing(true);
      const res = await axios.post(
        "/api/all-templates/sync-templates",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res?.data?.success) {
        fetchTemplates();
      }
    } catch (error) {
      console.log("Error syncing templates: ", error);
    }
  };

  // Get template type icon
  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case "whatsapp":
        return <FaWhatsapp className="h-4 w-4 text-green-600" />;
      case "email":
        return <Mail className="h-4 w-4 text-red-500" />;
      case "sms":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { color: string; bg: string; icon: React.ReactNode }
    > = {
      approved: {
        color: "text-green-700",
        bg: "bg-green-50 border-green-100",
        icon: <Check className="h-3 w-3" />,
      },
      active: {
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-100",
        icon: <Check className="h-3 w-3" />,
      },
      pending: {
        color: "text-yellow-700",
        bg: "bg-yellow-50 border-yellow-100",
        icon: <Clock className="h-3 w-3" />,
      },
      inactive: {
        color: "text-gray-700",
        bg: "bg-gray-50 border-gray-100",
        icon: <X className="h-3 w-3" />,
      },
      rejected: {
        color: "text-red-700",
        bg: "bg-red-50 border-red-100",
        icon: <X className="h-3 w-3" />,
      },
    };

    const { color, bg, icon } = config[status] || {
      color: "text-gray-700",
      bg: "bg-gray-50",
      icon: <FileText className="h-3 w-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${color}`}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    if (category === "undefined") return null;
    const colors: Record<string, string> = {
      Healthcare: "bg-purple-50 text-purple-700 border-purple-100",
      Onboarding: "bg-blue-50 text-blue-700 border-blue-100",
      Billing: "bg-rose-50 text-rose-700 border-rose-100",
      Feedback: "bg-amber-50 text-amber-700 border-amber-100",
      Pharmacy: "bg-emerald-50 text-emerald-700 border-emerald-100",
      Administrative: "bg-gray-50 text-gray-700 border-gray-100",
    };

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
          colors[category] || "bg-gray-50 text-gray-700"
        }`}
      >
        {category}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle template actions
  const handleTemplateAction = (action: string, templateId: string) => {
    console.log(`${action} template ${templateId}`);
    // Implement actual actions here
    if (action === "edit") {
      router.push(`/clinic/all-templates/${templateId}`);
      return;
    }

    if (action === "preview") {
      const tmpl = templates.find((t) => t._id === templateId) || null;
      if (tmpl) {
        setPreviewTemplate(tmpl);
        setShowPreviewModal(true);
      }
      return;
    }
  };

  const handleDeleteTemplate = async (templateId: string | undefined) => {
    if (!token || !templateId) return;
    try {
      setDeleteTemplateLoading(true);
      const res = await axios.delete(
        `/api/all-templates/delete-template/${templateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res?.data?.success) {
        const filteredTemplates = templates.filter((t) => t._id !== templateId);
        setTemplates(filteredTemplates);
        setShowDeleteTemplateModal(false);
      }
    } catch (error) {
      console.log("Error deleting template: ", error);
    } finally {
      setDeleteTemplateLoading(false);
    }
  };

  // Fetch templates only when permissions are loaded and user has read permission
  useEffect(() => {
    if (!permissionsLoaded) return;

    // Only fetch template data if user has read permission
    if (!permissions.canRead) {
      return;
    }

    fetchTemplates();
  }, [
    currentPage,
    filterStatus,
    filterType,
    searchQuery,
    token,
    templatesPerPage,
    permissionsLoaded,
    permissions.canRead,
    fetchTemplates,
  ]);

  // Show loading while permissions are being fetched
  if (!permissionsLoaded) {
    return <Loader />;
  }

  // Show access denied message if no permission
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You do not have permission to view templates. Please contact your
            administrator if you believe this is an error.
          </p>
          {permissions.canCreate && (
            <Link href="/clinic/all-templates/new">
              <button className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium">
                <Plus className="h-5 w-5" />
                Create Template
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Templates
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Manage your communication templates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncTemplates}
              className={`inline-flex items-center justify-center cursor-pointer gap-1.5 ${
                !isSyncing ? "bg-white" : "bg-gray-200"
              } border border-gray-200 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium`}
            >
              <RefreshCcw className="h-5 w-5" />
              {!isSyncing ? "Sync Templates" : "Syncing..."}
            </button>
            {permissions.canCreate && (
              <Link href="/clinic/all-templates/new">
                <button className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium">
                  <Plus className="h-5 w-5" />
                  Create Template
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {templates.length}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved Templates</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {templates.filter((t) => t.status === "approved").length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {templates.filter((t) => t.status === "pending").length}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">WhatsApp Templates</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {templates.filter((t) => t.templateType === "whatsapp").length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search templates by name, category, or content..."
              className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid" ? "bg-white shadow" : "hover:bg-gray-100"
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list" ? "bg-white shadow" : "hover:bg-gray-100"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              className="bg-white border border-gray-300 text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="bg-white border border-gray-300 text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {templates?.map((template) => (
            <div
              key={template._id}
              className="flex flex-col justify-between bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div>
                {/* Template Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg">
                        {getTemplateTypeIcon(template.templateType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 truncate">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          ID: {template.templateId || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusBadge(template.status)}
                    </div>
                  </div>

                  {/* Category and Language */}
                  <div className="flex items-center gap-2 mt-3">
                    {template.category && getCategoryBadge(template.category)}
                    {template?.language && (
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded">
                        {template.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Template Content Preview */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {template.content}
                  </p>

                  {/* Variables */}
                  {template.variables.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Variables
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.slice(0, 3).map((variable, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {variable}
                          </span>
                        ))}
                        {template.variables.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                            +{template.variables.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  {template.templateButtons.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Buttons ({template.templateButtons.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.templateButtons
                          .slice(0, 2)
                          .map((btn, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-800 text-white text-xs rounded"
                            >
                              {btn.type.split("_").join(" ")}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Updated {formatDate(template.updatedAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    {permissions.canUpdate && (
                      <button
                        onClick={() =>
                          handleTemplateAction("edit", template._id)
                        }
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleTemplateAction("preview", template._id)
                      }
                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {permissions.canDelete && (
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowDeleteTemplateModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates?.map((template) => (
                <tr key={template._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                        {getTemplateTypeIcon(template.templateType)}
                      </div>
                      <div>
                        <div className="text-base font-medium text-gray-800">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-md">
                          {template.content}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-sm text-gray-700">
                        {template.templateType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getCategoryBadge(template.category || "N/A")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(template.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(template.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          handleTemplateAction("preview", template._id)
                        }
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {permissions.canUpdate && (
                        <button
                          onClick={() =>
                            handleTemplateAction("edit", template._id)
                          }
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      {permissions.canDelete && (
                        <button
                          onClick={() =>
                            handleTemplateAction("delete", template._id)
                          }
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {templates?.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || filterType !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Get started by creating your first communication template."}
          </p>
          {permissions.canCreate && (
            <Link href="/clinic/all-templates/new">
              <button className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium">
                <Plus className="h-5 w-5" />
                Create Template
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {permissions.canRead && totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {(currentPage - 1) * templatesPerPage + 1}-
            {currentPage * templatesPerPage} of {totalTemplates} lead
            {totalTemplates === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPreviewModal(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-5xl">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div
                className={`bg-gradient-to-r ${previewTemplate?.templateType === "whatsapp" ? "from-green-600 to-green-700" : previewTemplate?.templateType === "sms" ? "from-blue-600 to-blue-700" : previewTemplate?.templateType === "email" ? "from-red-600 to-red-700" : ""} text-white px-6 py-4 flex justify-between items-center`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white backdrop-blur-sm rounded-lg">
                    {getTemplateTypeIcon(previewTemplate.templateType)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-white/80 text-sm">
                      Preview Template •{" "}
                      {previewTemplate.uniqueName || previewTemplate.templateId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content */}
              <div className="max-h-[75vh] overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Preview Content (Left - 2/3 width) */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Header Preview */}
                    {previewTemplate?.isHeader && (
                      <div className="relative">
                        {previewTemplate?.headerType === "text" &&
                          previewTemplate?.headerText && (
                            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg">
                              <div className="font-medium text-sm">
                                {previewTemplate.headerText}
                              </div>
                            </div>
                          )}

                        {previewTemplate?.headerType !== "text" &&
                          previewTemplate?.headerFileUrl && (
                            <div className="relative rounded-t-lg overflow-hidden bg-gray-100">
                              {previewTemplate.headerType === "image" ? (
                                <img
                                  src={previewTemplate.headerFileUrl}
                                  alt="Template header"
                                  className="w-full h-48 object-cover"
                                />
                              ) : previewTemplate.headerType === "video" ? (
                                <div className="relative h-48 bg-black">
                                  <video
                                    className="w-full h-full object-cover"
                                    controls
                                  >
                                    <source
                                      src={previewTemplate.headerFileUrl}
                                      type={`video/${previewTemplate.headerType}`}
                                    />
                                  </video>
                                </div>
                              ) : (
                                <div className="h-48 flex flex-col items-center justify-center p-6 bg-gray-50">
                                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                                    <svg
                                      className="w-8 h-8 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                      />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-medium text-gray-900">
                                      Document Attachment
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      File will be sent with message
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    )}

                    {/* Message Body Preview */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-4">
                        {/* Variable Placeholders */}
                        {previewTemplate?.variables &&
                          previewTemplate.variables.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-medium text-gray-500 mb-2">
                                Variables will appear as:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {previewTemplate?.variables?.map(
                                  (variable: string, index: number) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                                    >
                                      {variable}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                        {previewTemplate?.subject && (
                          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            <span className="font-semibold text-gray-900">
                              Subject
                            </span>{" "}
                            : {previewTemplate?.subject}
                          </div>
                        )}
                        {previewTemplate?.preheader && (
                          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                            <span className="font-semibold text-gray-900">
                              Preheader
                            </span>{" "}
                            : {previewTemplate?.preheader}
                          </div>
                        )}

                        {/* Content Preview */}
                        <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                          {previewTemplate?.content}
                        </div>
                      </div>

                      {/* Footer Preview */}
                      {previewTemplate?.isFooter && previewTemplate?.footer && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <div className="text-sm text-gray-600">
                            {previewTemplate.footer}
                          </div>
                        </div>
                      )}

                      {/* Buttons Preview */}
                      {previewTemplate?.isButton &&
                        previewTemplate?.templateButtons?.length > 0 && (
                          <div className="border-t border-gray-100">
                            {previewTemplate?.templateButtons
                              ?.slice(0, 2)
                              .map((button, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center gap-3 px-4 py-3 ${
                                    index > 0 ? "border-t border-gray-100" : ""
                                  } hover:bg-gray-50 transition-colors`}
                                >
                                  {button?.type === "QUICK_REPLY" && (
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-green-600"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
                                      </svg>
                                    </div>
                                  )}
                                  {button?.type === "URL" && (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                  {button?.type === "PHONE_NUMBER" && (
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {button?.text}
                                    </div>
                                    {button?.type === "URL" && (
                                      <div className="text-xs text-gray-500">
                                        Tap to open link
                                      </div>
                                    )}
                                    {button?.type === "PHONE_NUMBER" && (
                                      <div className="text-xs text-gray-500">
                                        Call phone number
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}

                            {previewTemplate?.templateButtons &&
                              previewTemplate.templateButtons.length >= 3 && (
                                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                                  <div className="flex items-center gap-3 text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <svg
                                        className="w-4 h-4 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 6h16M4 12h16M4 18h16"
                                        />
                                      </svg>
                                    </div>
                                    <div className="text-sm font-medium">
                                      +
                                      {previewTemplate?.templateButtons
                                        ?.length! - 2}{" "}
                                      more options
                                    </div>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Template Info (Right - 1/3 width) */}
                  <div className="lg:col-span-1 space-y-4">
                    {/* Template Details Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Template Details
                      </h4>

                      <div className="space-y-4">
                        {/* Template ID */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Template ID
                          </div>
                          <div className="text-gray-500 text-xs">
                            {previewTemplate?.templateId ||
                              previewTemplate?._id}
                          </div>
                        </div>
                        {/* Status */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Status
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(previewTemplate.status)}
                            <span className="text-xs text-gray-500">
                              {previewTemplate.status === "approved"
                                ? "✓ Ready to send"
                                : previewTemplate.status === "pending"
                                  ? "⏳ Awaiting review"
                                  : previewTemplate.status === "rejected"
                                    ? "✗ Needs revision"
                                    : ""}
                            </span>
                          </div>
                        </div>

                        {/* Category */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Category
                          </div>
                          {previewTemplate.category ? (
                            <div className="flex items-center gap-2">
                              {getCategoryBadge(previewTemplate.category)}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">
                              Not categorized
                            </div>
                          )}
                        </div>

                        {/* Language */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Language
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {previewTemplate.language.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({previewTemplate.language})
                            </span>
                          </div>
                        </div>

                        {/* Template Type */}
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            Template Type
                          </div>
                          <div className="flex items-center gap-2">
                            {previewTemplate.templateType === "email" && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                                Email
                              </span>
                            )}
                            {previewTemplate.templateType === "sms" && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                SMS
                              </span>
                            )}
                            {previewTemplate.templateType === "whatsapp" && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Variables Card */}
                    {previewTemplate?.variables &&
                      previewTemplate.variables.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-lg p-4">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-blue-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            Variables ({previewTemplate.variables.length})
                          </h4>
                          <div className="space-y-2">
                            {previewTemplate.variables.map((v, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-700">
                                      {i + 1}
                                    </span>
                                  </div>
                                  <span className="text-gray-700 font-medium">
                                    {v}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Required
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-100">
                            <p className="text-xs text-gray-600">
                              These variables must be provided when sending this
                              template.
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Buttons Card */}
                    {previewTemplate?.templateButtons &&
                      previewTemplate.templateButtons.length > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-lg p-4">
                          <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-green-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16m-7 6h7"
                              />
                            </svg>
                            Buttons ({previewTemplate.templateButtons.length})
                          </h4>
                          <div className="space-y-4">
                            {previewTemplate.templateButtons.map((b, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-6 h-6 rounded flex items-center justify-center ${
                                      b.type === "QUICK_REPLY"
                                        ? "bg-green-100"
                                        : b.type === "URL"
                                          ? "bg-blue-100"
                                          : b.type === "PHONE_NUMBER"
                                            ? "bg-purple-100"
                                            : "bg-gray-100"
                                    }`}
                                  >
                                    <span className="text-xs font-bold text-gray-700">
                                      {i + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-gray-700 font-medium">
                                      {b.text}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {b.type.replace("_", " ").toLowerCase()}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {b.type === "URL"
                                    ? "Link"
                                    : b.type === "PHONE_NUMBER"
                                      ? "Phone"
                                      : "Quick Reply"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <DeleteTemplateModal
        isOpen={showDeleteTemplateModal}
        onClose={() => setShowDeleteTemplateModal(false)}
        onConfirm={() => handleDeleteTemplate(selectedTemplate?._id)}
        usageCount={2}
        loading={deleteTemplateLoading}
      />
    </div>
  );
};

// ✅ Correctly typed getLayout
TemplatesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// ✅ Wrap page with auth HOC
const ProtectedTemplatesPage = withClinicAuth(
  TemplatesPage,
) as NextPageWithLayout;

// ✅ Re-attach layout
ProtectedTemplatesPage.getLayout = TemplatesPage.getLayout;

export default ProtectedTemplatesPage;
