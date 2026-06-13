import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import React, { ReactElement, useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { NextPageWithLayout } from "../../_app";
import AvatarComponent from "@/components/shared/AvatarComponent";
import AiAgentChat from "@/components/AiAgentChat";
import {
  Search,
  Filter,
  Send,
  ChevronDown,
  ChevronLeft,
  Phone,
  Plus,
  User,
  Mail,
  X,
  MoreHorizontal,
  Smile,
  Timer,
  MoreVertical,
  MapPin,
  Archive,
  MessageCircle,
  XCircle,
  Trash2,
  Edit2,
  Check,
  Loader2,
} from "lucide-react";
import { useAgentPermissions } from "../../../hooks/useAgentPermissions";
import CreateNewConversation from "./_components/CreateNewConversation";
import Conversation from "./_components/Conversation";
import useInbox, { getTagColor } from "@/hooks/useInbox";
import NoSelectedConversation from "@/components/NoSelectedConversation";
import CustomDropdown from "@/components/shared/CustomDropdown";
import { FaWhatsapp } from "react-icons/fa";
import TemplatesModal from "./_components/TemplatesModal";
import Message from "./_components/Message";
import AttachmentModal from "@/components/shared/AttachmentModal";
import {
  capitalize,
  getFormatedTime,
  getTokenByPath,
  maskEmail,
  maskPhoneNumber,
  maskSensitiveInfo,
} from "@/lib/helper";
import WhatsappTimer from "./_components/WhatsappTimer";
import EmojiPickerModal from "@/components/shared/EmojiPickerModal";
import CollapsibleWrapper from "@/components/shared/CollapsibleWrapper";
import AddTagModal from "@/components/modals/AddTagModal";
import DeleteConversationModal from "./_components/DeleteConversationModal";
import AssignConversation from "./_components/AssignConversation";
import ScheduleMessage from "./_components/ScheduleMessage";
import ConversationSkeleton from "./_components/ConversationSkeleton";
import MessageSkeleton from "./_components/MessageSkeleton";
import FilterModal from "./_components/FilterModal";
import AppointmentBookingModal from "@/components/AppointmentBookingModal";
import LocationPickerModal from "./_components/LocationPickerModal";

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
      window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return null;
};

const InboxPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [_routeContext, setRouteContext] = useState<"clinic" | "agent">(
    "clinic",
  );
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

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

  // Memoized getAuthHeaders to prevent infinite loops
  // const getAuthHeaders = useCallback((): Record<string, string> => {
  //   if (typeof window === "undefined") return {};
  //   let token = null;

  //   // Check tokens based on route context first
  //   if (routeContext === "agent") {
  //     token =
  //       localStorage.getItem("agentToken") ||
  //       sessionStorage.getItem("agentToken") ||
  //       localStorage.getItem("staffToken") ||
  //       sessionStorage.getItem("staffToken") ||
  //       localStorage.getItem("userToken") ||
  //       sessionStorage.getItem("userToken");
  //   } else {
  //     token =
  //       localStorage.getItem("clinicToken") ||
  //       sessionStorage.getItem("clinicToken");
  //   }

  //   // Fallback to userToken if no token found
  //   if (!token) {
  //     token =
  //       localStorage.getItem("userToken") ||
  //       sessionStorage.getItem("userToken");
  //   }

  //   if (!token) return {};
  //   return { Authorization: `Bearer ${token}` };
  // }, [routeContext]);

  // Detect agent route and token
  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncTokens = () => {
      const hasAgent =
        Boolean(
          localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken"),
        ) ||
        Boolean(
          localStorage.getItem("staffToken") ||
          sessionStorage.getItem("staffToken"),
        ) ||
        Boolean(
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken"),
        );
      setHasAgentToken(hasAgent);
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
    if (typeof window === "undefined") return;
    const currentPath = window.location.pathname || "";
    if (currentPath.startsWith("/agent/")) {
      setRouteContext("agent");
    } else {
      setRouteContext("clinic");
    }
  }, []);

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(
    isAgentRoute ? "clinic_inbox" : null,
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

    // ✅ For admin role, grant full access (bypass permission checks)
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

    // ✅ For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
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
              // Admin has set permissions - check the clinic_inbox module in top-level and subModules
              let modulePermission = null;
              // Check top-level modules first
              modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module && !p?.moduleKey) return false;
                if (p.module === "clinic_inbox") return true;
                if (p.moduleKey === "clinic_inbox") return true;
                if (p.module === "inbox") return true;
                return false;
              });
              // If not found in top-level, check subModules of each module
              if (!modulePermission) {
                for (const p of res.data.permissions) {
                  if (p.subModules && Array.isArray(p.subModules)) {
                    const subPerm = p.subModules.find((sub: any) => {
                      if (!sub?.module && !sub?.moduleKey) return false;
                      if (sub.module === "clinic_inbox") return true;
                      if (sub.moduleKey === "clinic_inbox") return true;
                      if (sub.module === "inbox") return true;
                      return false;
                    });
                    if (subPerm) {
                      modulePermission = subPerm;
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
          console.log("Fetching Agent/Staff Permissions for clinic_inbox...");
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_inbox" },
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

          setPermissions(newPerms);
        } catch (err: any) {
          console.error("Error fetching agent module permissions:", err);
          // On error, default to full access
          setPermissions({
            canRead: true,
            canCreate: true,
            canUpdate: true,
            canDelete: true,
          });
        } finally {
          if (isMounted) {
            setPermissionsLoaded(true);
          }
        }
      };

      fetchPermissions();
    }

    return () => {
      isMounted = false;
    };
  }, [isAgentRoute]);

  const {
    state,
    setSearchConvInput,
    setConversations,
    setSelectedConversation,
    setSelectedProvider,
    setAttachedFile,
    setAttachedFiles,
    setSelectedTemplate,
    setSubject,
    setMessage,
    setMediaType,
    setBodyParameters,
    setHeaderParameters,
    setSelectedMessage,
    setConversationStatusOptions,
    setFilters,
    setShowStatusDropdown,
    setIsAddTagModalOpen,
    setIsDeleteConversationModalOpen,
    setIsScheduleModalOpen,
    setIsFilterModalOpen,
    setIsProfileView,
    setIsOpenBookAppointmentModal,
    setIsLocationPickerOpen,
    handleSendMessage,
    handleScheduleMessage,
    handleConvScroll,
    handleScrollMessages,
    handleScrollMsgsToBottom,
    handleDeleteConversation,
    handleUpdateConversationStatus,
    handleAddTagToConversation,
    handleRemoveTagFromConversation,
    handleAgentSelect,
    handleAgentFilterChange,
    handleApplyFilters,
    handleRemoveTemplate,
    handleEditLead,
    cancelEditLead,
    handleUpdateLead,
    setEditValue,
  } = useInbox();
  const {
    user,
    conversationRef,
    searchConvInput,
    conversations,
    selectedConversation,
    selectedProvider,
    // hasMoreConversations,
    fetchConvLoading,
    totalConversations,
    providers,
    templates,
    attachedFile,
    attachedFiles,
    selectedTemplate,
    message,
    // mediaType,
    // bodyParameters,
    // headerParameters,
    textAreaRef,
    sendMsgLoading,
    fetchMsgsLoading,
    messages,
    isScrolledToBottom,
    messagesEndRef,
    whatsappRemainingTime,
    selectedMessage,
    conversationStatusOptions,
    filters,
    showStatusDropdown,
    statusDropdownRef,
    statusBtnRef,
    currentConvPage,
    isMobileView,
    isProfileView,
    isAddTagModalOpen,
    isDeleteConversationModalOpen,
    isDeletingConversation,
    isAddingTag,
    canSend,
    canSchedule,
    agents,
    selectedAgent,
    agentFetchLoading,
    isScheduleModalOpen,
    isFilterModalOpen,
    mediaUrl,
    scrollMsgsRef,
    isOpenBookAppointmentModal,
    isLocationPickerOpen,
    rooms,
    doctors,
    patient,

    // tags
    tags,
    tagsLoading,

    // Lead Editing
    editingField,
    editValue,
    isUpdatingLead,
  } = state;

  // Auto-expand textarea as user types
  React.useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      const newHeight = Math.min(textAreaRef.current.scrollHeight, 300); // Limit max height to 300px
      textAreaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  if (!permissionsLoaded) {
    return (
      <div className="flex h-[92vh] items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!permissions.canRead) {
    return (
      <div className="flex h-[92vh] items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[92vh] bg-gray-50 text-gray-800">
      {/* Left Sidebar - Conversations List */}
      <div
        className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col bg-white shadow-sm ${
          (isMobileView && selectedConversation) || isProfileView
            ? "hidden"
            : ""
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                All customer chats
              </h2>
              <span className="text-gray-600 py-1 text-sm font-medium">
                {totalConversations} chats
              </span>
            </div>

            {permissions.canCreate && (
              <CreateNewConversation
                conversations={conversations}
                setConversations={setConversations}
                setSelectedConversation={setSelectedConversation}
              />
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full text-sm pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-800 focus:border-transparent transition-all"
                value={searchConvInput}
                onChange={(e) => setSearchConvInput(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`relative p-2.5 border ${
                filters?.agentId
                  ? "bg-blue-100 text-blue-500 border-blue-500"
                  : "bg-white text-gray-600 border-gray-300"
              } rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-sm`}
            >
              <Filter className="h-5 w-5" />

              {filters?.agentId && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white w-4 h-4 text-xs flex items-center justify-center rounded-full">
                  1
                </span>
              )}
            </button>
          </div>

          {/* conversation status filter */}
          {permissions.canUpdate && (
            <div className="relative flex items-center">
              <div className="flex items-center">
                {conversationStatusOptions?.slice(0, 4)?.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: option.value }))
                    }
                    className={`px-3 py-1.5 mr-2 mb-2 rounded-full text-sm font-medium transition-all ${
                      filters.status === option.value
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <button
                  ref={statusBtnRef}
                  onClick={() => setShowStatusDropdown((s) => !s)}
                  aria-expanded={showStatusDropdown}
                  className={`px-3 py-1.5 mr-2 mb-2 rounded-full text-sm font-medium transition-all ${
                    showStatusDropdown
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {showStatusDropdown &&
                  conversationStatusOptions?.length > 4 && (
                    <div
                      ref={statusDropdownRef}
                      role="menu"
                      className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
                    >
                      {conversationStatusOptions.slice(4).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              status: opt.value,
                            }));
                            setConversationStatusOptions((prev) => {
                              const selIndex = prev.findIndex(
                                (o) => o.value === opt.value,
                              );
                              if (selIndex === -1) return prev;
                              const selectedOption = prev[selIndex];

                              // Keep reference to original 4th item (index 3)
                              const originalThird = prev[3];

                              // Remove selected from list
                              const withoutSelected = prev.filter(
                                (o) => o.value !== opt.value,
                              );

                              // Insert selectedOption at index 3 (4th position)
                              const insertIndex = Math.min(
                                3,
                                withoutSelected.length,
                              );
                              let updatedOptions = [
                                ...withoutSelected.slice(0, insertIndex),
                                selectedOption,
                                ...withoutSelected.slice(insertIndex),
                              ];

                              // If there was an original 3rd item (and it's not the selected one), move it to the end
                              if (
                                originalThird &&
                                originalThird.value !== opt.value
                              ) {
                                const idx = updatedOptions.findIndex(
                                  (o) => o.value === originalThird.value,
                                );
                                if (idx > -1) {
                                  updatedOptions.splice(idx, 1);
                                  updatedOptions.push(originalThird);
                                }
                              }

                              return updatedOptions;
                            });
                            setShowStatusDropdown(false);
                          }}
                          role="menuitem"
                          className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 text-gray-700`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div
          ref={conversationRef}
          onScroll={handleConvScroll}
          className="flex-1 overflow-y-auto"
        >
          {conversations?.length === 0 && !fetchConvLoading ? (
            <div className="text-center py-3">
              <span className="text-sm text-gray-500 text-center block">
                No Conversations
              </span>
            </div>
          ) : fetchConvLoading && currentConvPage === 1 ? (
            <></>
          ) : (
            conversations.map((conv) => (
              <Conversation
                key={conv._id}
                conversation={conv}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
              />
            ))
          )}
          {fetchConvLoading && (
            <>
              {Array(6)
                .fill(0)
                .map((_, index) => (
                  <ConversationSkeleton key={index} />
                ))}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          (!selectedConversation && isMobileView) || isProfileView
            ? "hidden"
            : "flex-1 flex"
        } flex-col bg-white relative`}
      >
        {!selectedConversation ? (
          <NoSelectedConversation canCreate={permissions.canCreate} />
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
              <div className="flex items-center space-x-3">
                {isMobileView && (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <AvatarComponent
                  name={selectedConversation?.leadId?.name || ""}
                  size="md"
                />
                <div>
                  <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                    {selectedConversation?.leadId?.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm sm:text-sm text-gray-500">
                    <span>
                      Last seen{" "}
                      {getFormatedTime(
                        selectedConversation?.recentMessage?.createdAt,
                      ) || "recently"}
                    </span>
                  </div>
                </div>
              </div>

              {!isMobileView ? (
                <div className="flex items-center gap-2">
                  <WhatsappTimer
                    selectedProvider={selectedProvider}
                    whatsappRemainingTime={whatsappRemainingTime}
                  />
                  <AssignConversation
                    agents={agents}
                    selectedAgent={selectedAgent}
                    onAgentSelect={(agent) =>
                      handleAgentSelect(agent, selectedConversation?._id)
                    }
                    loading={agentFetchLoading}
                    placeholder="Assign to agent..."
                  />

                  {/* <button className="p-2.5 text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors hover:shadow-sm">
                  <Info className="h-5 w-5" />
                </button>
                <button className="p-2.5 text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors hover:shadow-sm">
                  <MoreVertical className="h-5 w-5" />
                </button> */}
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setIsProfileView(true)}
                    className="text-gray-600 hover:bg-white hover:text-gray-800 rounded-lg transition-colors hover:shadow-sm"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div
              ref={scrollMsgsRef}
              onScroll={handleScrollMessages}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 bg-gradient-to-b from-gray-50 to-gray-100"
            >
              {fetchMsgsLoading && (
                <>
                  <MessageSkeleton />
                </>
              )}
              {/* Messages */}
              {messages.map((item, parentIndex: number) => {
                return (
                  <div key={parentIndex?.toString()}>
                    <div className="flex items-center my-5">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <p className="mx-3 text-sm text-gray-600">{item?.date}</p>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                    {item?.messages?.map((msg, childIndex: number) => {
                      return parentIndex === messages?.length - 1 &&
                        childIndex === item?.messages?.length - 1 ? (
                        <div key={msg?._id} ref={messagesEndRef}>
                          <Message
                            message={msg}
                            onSelectMessage={(msg) => setSelectedMessage(msg)}
                          />
                        </div>
                      ) : (
                        <Message
                          key={msg?._id}
                          message={msg}
                          onSelectMessage={(msg) => setSelectedMessage(msg)}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button (positioned relative to chat column, not the scrollable list) */}
            {isScrolledToBottom && !selectedMessage && (
              <button
                onClick={handleScrollMsgsToBottom}
                className="absolute right-6 bottom-40 cursor-pointer bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all hover:scale-105 hover:shadow-xl z-10"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}

            {/* Message Input */}
            {permissions.canCreate && (
              <div className="border-t border-gray-200 bg-white shadow-lg">
                {selectedMessage && (
                  <div
                    className={`m-2.5 p-3 bg-gray-50 border-l-4 ${selectedMessage?.channel === "whatsapp" ? "border-l-green-500" : selectedMessage?.channel === "email" ? "border-l-gray-500" : ""} rounded-lg flex justify-between items-start space-x-4`}
                  >
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">
                        Replying to{" "}
                        {selectedMessage?.direction === "incoming"
                          ? selectedMessage?.recipientId?.name
                          : selectedMessage?.senderId?.name ||
                            "Customer Support"}
                      </div>
                      <div className="text-sm text-gray-800">
                        {selectedMessage?.content &&
                        selectedMessage?.content?.length > 90
                          ? selectedMessage?.content?.substring(0, 90) + "..."
                          : selectedMessage?.content || "Media message"}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {selectedProvider?.type?.includes("email") && (
                  <div className="p-2.5 border-b border-gray-100">
                    <input
                      type="text"
                      value={state.subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full text-sm font-medium border-none outline-none focus:ring-0 placeholder:text-gray-400"
                    />
                  </div>
                )}
                <div className="flex space-x-3 p-2.5">
                  <textarea
                    ref={textAreaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 text-sm border-none outline-none resize-none overflow-y-auto min-h-[60px]"
                  />
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CustomDropdown
                      position="top-left"
                      align="start"
                      offset={2}
                      autoPosition={true}
                      trigger={
                        <button
                          title="Choose Provider"
                          className="group flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 hover:border-gray-400 hover:shadow-md rounded-lg transition-all duration-200 focus:outline-none"
                        >
                          <div className="flex items-center gap-2">
                            {selectedProvider ? (
                              <>
                                {selectedProvider?.type?.includes("sms") ? (
                                  <Phone className="h-5 w-5 text-blue-500" />
                                ) : selectedProvider?.type?.includes(
                                    "whatsapp",
                                  ) ? (
                                  <FaWhatsapp className="h-5 w-5 text-green-600" />
                                ) : selectedProvider?.type?.includes(
                                    "email",
                                  ) ? (
                                  <Mail className="h-5 w-5 text-red-500" />
                                ) : (
                                  <User className="h-5 w-5" />
                                )}
                                <div className="text-left">
                                  <span className="font-semibold text-gray-800 text-sm block leading-tight">
                                    {selectedProvider.label ||
                                      selectedProvider?.phone ||
                                      selectedProvider?.email ||
                                      "Unknown Provider"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <User className="h-5 w-5" />
                                {/* <span className="font-medium text-gray-600">
                                Select Provider
                              </span> */}
                              </>
                            )}
                          </div>
                          <ChevronDown
                            className={`h-4 w-4 text-gray-700 transition-transform duration-300`}
                          />
                        </button>
                      }
                      maxHeight="50vh"
                      dropdownClassName="bg-white border border-gray-200 rounded-xl shadow-xl py-2 backdrop-blur-sm bg-white/95"
                      closeOnSelect={true}
                    >
                      <div className="w-[320px]">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="font-semibold text-gray-800 text-sm">
                            Select Provider
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Choose a communication provider
                          </p>
                        </div>

                        {/* Providers List */}
                        <div className="max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-2">
                          {providers.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <div className="inline-flex p-3 rounded-full bg-gray-100 mb-3">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-sm">
                                No providers available
                              </p>
                            </div>
                          ) : (
                            providers.map((provider) => {
                              const isSelected =
                                selectedProvider?._id === provider._id;

                              // Determine icon and colors based on provider type
                              const getIcon = () => {
                                if (provider?.type?.includes("sms")) {
                                  return <Phone className="h-4 w-4" />;
                                } else if (
                                  provider?.type?.includes("whatsapp")
                                ) {
                                  return <FaWhatsapp className="h-4 w-4" />;
                                } else if (provider?.type?.includes("email")) {
                                  return <Mail className="h-4 w-4" />;
                                }
                                return <User className="h-4 w-4" />;
                              };

                              const getBgColor = () => {
                                if (provider?.type?.includes("sms"))
                                  return "bg-blue-100";
                                if (provider?.type?.includes("whatsapp"))
                                  return "bg-green-100";
                                if (provider?.type?.includes("email"))
                                  return "bg-red-100";
                                return "bg-purple-100";
                              };

                              const getTextColor = () => {
                                if (provider?.type?.includes("sms"))
                                  return "text-blue-600";
                                if (provider?.type?.includes("whatsapp"))
                                  return "text-green-600";
                                if (provider?.type?.includes("email"))
                                  return "text-red-600";
                                return "text-purple-600";
                              };

                              const getTypeLabel = () => {
                                if (provider?.type?.includes("sms"))
                                  return "SMS";
                                if (provider?.type?.includes("whatsapp"))
                                  return "WhatsApp";
                                if (provider?.type?.includes("email"))
                                  return "Email";
                                return "Provider";
                              };

                              const getStatusColor = () => {
                                const status = provider.status?.toLowerCase();
                                if (status === "approved")
                                  return "bg-green-100 text-green-700";
                                if (status === "rejected")
                                  return "bg-red-100 text-red-700";
                                if (status === "pending")
                                  return "bg-yellow-100 text-yellow-700";
                                return "bg-gray-100 text-gray-800";
                              };

                              return (
                                <div
                                  key={provider._id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setSelectedProvider(provider);
                                  }}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    setSelectedProvider(provider)
                                  }
                                  className={`mx-2 my-1 px-3 py-3 cursor-pointer rounded-xl transition-all duration-200 ${
                                    isSelected
                                      ? "bg-gradient-to-r from-blue-50 to-blue-50/50 border border-blue-200 shadow-sm"
                                      : "hover:bg-gray-50 active:bg-gray-100 border border-transparent hover:border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`relative p-2.5 rounded-xl ${getBgColor()} ${getTextColor()} shadow-sm`}
                                      >
                                        {getIcon()}
                                        {provider.status === "approved" && (
                                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-green-500 rounded-full border border-white"></span>
                                        )}
                                      </div>
                                      <div className="text-left">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-gray-800 text-sm">
                                            {provider.label ||
                                              provider?.phone ||
                                              provider?.email ||
                                              "Unknown Provider"}
                                          </span>
                                          {/* {provider.default && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Default
                        </span>
                      )} */}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          {provider.status && (
                                            <span
                                              className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor()}`}
                                            >
                                              {capitalize(provider.status)}
                                            </span>
                                          )}
                                          <span className="text-xs text-gray-500">
                                            {getTypeLabel()}
                                          </span>
                                        </div>
                                        {(provider.phone || provider.email) && (
                                          <p className="text-xs text-gray-600 mt-1 truncate max-w-[180px]">
                                            {provider.phone || provider.email}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Selection indicator */}
                                    <div className="flex items-center">
                                      <div
                                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                          isSelected
                                            ? "border-blue-500 bg-blue-500"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {isSelected && (
                                          <svg
                                            className="h-2.5 w-2.5 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="3"
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Footer with Add New Provider button */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                          <button
                            onClick={() => {
                              // Add your add provider logic here
                              console.log("Add new provider");
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Add New Provider
                          </button>
                        </div>
                      </div>
                    </CustomDropdown>

                    <TemplatesModal
                      templates={templates}
                      attachedFile={attachedFile}
                      selectedTemplate={selectedTemplate}
                      selectedProvider={selectedProvider}
                      setSelectedTemplate={setSelectedTemplate}
                      setAttachedFile={setAttachedFile}
                      setMessage={setMessage}
                      setMediaType={setMediaType}
                      setBodyParameters={setBodyParameters}
                      setHeaderParameters={setHeaderParameters}
                      handleRemoveTemplate={handleRemoveTemplate}
                    />

                    {!isMobileView && (
                      <>
                        <AttachmentModal
                          attachedFile={attachedFile}
                          setAttachedFile={setAttachedFile}
                          attachedFiles={state.attachedFiles}
                          setAttachedFiles={setAttachedFiles}
                          mediaUrl={mediaUrl}
                        />

                        <EmojiPickerModal
                          inputRef={textAreaRef as any}
                          triggerButton={
                            <button className="border border-gray-300 cursor-pointer rounded-md p-2.5">
                              <Smile
                                size={20}
                                className="text-muted-foreground transition-transform duration-200"
                              />
                            </button>
                          }
                          position="top-left"
                          align="start"
                          setValue={setMessage}
                        />

                        {/* Location Sharing Button - Only for WhatsApp */}
                        {selectedProvider?.type?.includes("whatsapp") && (
                          <button
                            onClick={() => setIsLocationPickerOpen(true)}
                            className="border border-gray-300 cursor-pointer rounded-md p-2.5 hover:bg-gray-50 transition-colors"
                            title="Share Location"
                          >
                            <MapPin
                              size={20}
                              className="transition-transform duration-200"
                            />
                          </button>
                        )}
                      </>
                    )}
                    <div className="relative">
                      <button
                        onClick={() => setIsAiChatOpen((prev) => !prev)}
                        className="bg-white text-gray-700 border border-gray-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed p-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:shadow-md"
                      >
                        Talk to an AI Agent
                      </button>
                      <AiAgentChat
                        isOpen={isAiChatOpen}
                        onClose={() => setIsAiChatOpen(false)}
                        conversationId={selectedConversation?._id ?? null} // 👈 add this
                      />
                    </div>

                    {/* <EmojiPickerModal
                    triggerButton={
                      <button className="border border-gray-300 rounded-md p-2.5">
                        <Smile
                          size={20}
                          className="text-muted-foreground transition-transform duration-200"
                        />
                      </button>
                    }
                    position="top-left"
                    align="start"
                    setValue={(val) => setMessage((prev) => `${prev} ${val}`)}
                  /> */}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      disabled={!canSchedule}
                      className="bg-white text-gray-700 border border-gray-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed p-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:shadow-md"
                    >
                      <Timer className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={sendMsgLoading || !canSend}
                      className="bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed p-2.5 rounded-xl font-semibold flex items-center space-x-2 transition-all hover:shadow-md"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar - Conversation Info */}
      {selectedConversation && (!isMobileView || isProfileView) && (
        <div className="w-full md:w-1/4 lg:w-1/4 border-l border-gray-200 bg-white flex flex-col">
          <div className="p-4 flex items-center space-x-3 border-b border-gray-200">
            {isMobileView && (
              <button
                onClick={() => setIsProfileView(false)}
                className="text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-semibold">
                Conversation Info
              </h3>
              <p className="text-sm sm:text-sm text-gray-500">
                Details about the selected conversation
              </p>
            </div>
          </div>
          <CollapsibleWrapper headerTitle="Lead Details">
            <div className="space-y-6 py-2.5">
              <div className="flex items-center space-x-3">
                <AvatarComponent
                  name={selectedConversation?.leadId?.name || ""}
                  size="lg"
                />
                <div className="flex-1">
                  {editingField === "name" ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateLead}
                        disabled={isUpdatingLead}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditLead}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <div className="font-semibold text-gray-800">
                        {selectedConversation?.leadId?.name}
                      </div>
                      <button
                        onClick={() =>
                          handleEditLead(
                            "name",
                            selectedConversation?.leadId?.name || "",
                          )
                        }
                        className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      MozUserSelect: "none",
                      msUserSelect: "none",
                    }}
                    onCopy={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    className="text-sm text-gray-500 select-none"
                  >
                    {user?.role === "agent"
                      ? maskSensitiveInfo(
                          selectedConversation?.leadId?.phone ||
                            selectedConversation?.leadId?.email ||
                            "",
                        )
                      : selectedConversation?.leadId?.phone ||
                        selectedConversation?.leadId?.email}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col text-sm text-gray-500">
                  <div className="flex items-center gap-2 group">
                    <div className="flex items-center gap-2">Phone</div>
                    {editingField !== "phone" && (
                      <button
                        onClick={() =>
                          handleEditLead(
                            "phone",
                            selectedConversation?.leadId?.phone || "",
                          )
                        }
                        className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {editingField === "phone" ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateLead}
                        disabled={isUpdatingLead}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditLead}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                      }}
                      onCopy={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="font-medium text-gray-800 select-none"
                    >
                      {user?.role === "agent"
                        ? maskPhoneNumber(selectedConversation?.leadId?.phone)
                        : selectedConversation?.leadId?.phone || "—"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col text-sm text-gray-500">
                  <div className="flex items-center gap-2 group">
                    <div className="flex items-center gap-2">Email</div>
                    {editingField !== "email" && (
                      <button
                        onClick={() =>
                          handleEditLead(
                            "email",
                            selectedConversation?.leadId?.email || "",
                          )
                        }
                        className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {editingField === "email" ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none font-medium text-gray-800"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateLead}
                        disabled={isUpdatingLead}
                        className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEditLead}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                      }}
                      onCopy={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="font-medium text-gray-800 select-none"
                    >
                      {user?.role === "agent"
                        ? maskEmail(
                            selectedConversation?.leadId?.email ||
                              "bajuddinkhan0786@gmail.com",
                          )
                        : selectedConversation?.leadId?.email || "—"}
                    </div>
                  )}
                </div>
              </div>

              {/* <div>
                <h4 className="text-sm font-semibold text-gray-700">
                  Conversation Meta
                </h4>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>Messages: {messages.length}</li>
                  <li>
                    Provider:{" "}
                    {selectedProvider?.label || selectedProvider?.phone || "—"}
                  </li>
                  <li>Status: {selectedConversation?.status || "open"}</li>
                </ul>
              </div> */}
            </div>
          </CollapsibleWrapper>

          {/* Tags */}
          <CollapsibleWrapper
            headerTitle="Tags"
            rightActionButton={
              <button
                onClick={() => {
                  // Add tag logic
                  setIsAddTagModalOpen(true);
                }}
                className="text-sm cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
              >
                Add
              </button>
            }
            loading={tagsLoading}
          >
            <div className="flex flex-wrap gap-2">
              {tags?.length === 0 && (
                <span className="text-sm text-gray-500">No tags added.</span>
              )}
              {tags?.length > 0 &&
                tags.map((tag: string, index: number) => {
                  const colorClass = getTagColor(tag);

                  return (
                    <div
                      key={index.toString()}
                      className={`
                ${colorClass}
                inline-flex items-center gap-1.5 
                px-3 py-1.5 
                rounded-full 
                border 
                transition-all 
                duration-200 
                group
              `}
                    >
                      <span className="text-xs font-medium">
                        {capitalize(tag)}
                      </span>

                      {/* Remove button */}
                      <button
                        onClick={() =>
                          handleRemoveTagFromConversation(
                            selectedConversation?.leadId?._id,
                            tag,
                          )
                        }
                        className={`
                  opacity-0 hidden group-hover:opacity-100
                  group-hover:inline-flex
                  transition-opacity duration-200
                  p-0.5
                  rounded-full
                  hover:bg-white/50
                  cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-current
                `}
                        aria-label={`Remove ${tag} tag`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
            </div>
          </CollapsibleWrapper>

          {/* Action Buttons */}
          <div className="p-3 space-y-2">
            {/* Status Change Buttons - Update Permission */}
            {permissions.canUpdate && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    handleUpdateConversationStatus(
                      selectedConversation?._id!,
                      "open",
                    )
                  }
                  disabled={selectedConversation?.status === "open"}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open
                </button>
                <button
                  onClick={() =>
                    handleUpdateConversationStatus(
                      selectedConversation?._id!,
                      "archived",
                    )
                  }
                  disabled={selectedConversation?.status === "archived"}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
                <button
                  onClick={() =>
                    handleUpdateConversationStatus(
                      selectedConversation?._id!,
                      "closed",
                    )
                  }
                  disabled={selectedConversation?.status === "closed"}
                  className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  Close
                </button>
              </div>
            )}

            {permissions.canCreate && (
              <button
                onClick={() => setIsOpenBookAppointmentModal(true)}
                className="group relative w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl cursor-pointer py-2.5 px-4 text-center transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] active:shadow-md border border-blue-400/20 text-sm flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4 mb-0.5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Book Appointment
              </button>
            )}

            {/* Delete Permission */}
            {permissions.canDelete && (
              <button
                onClick={() => setIsDeleteConversationModalOpen(true)}
                className="group relative w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-xl cursor-pointer py-2.5 px-4 text-center transition-all duration-300 ease-in-out shadow-md hover:shadow-lg hover:shadow-red-200 active:scale-[0.98] active:shadow-md border border-red-400/20 text-sm flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                Move to Trash
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Tag modal */}
      <AddTagModal
        isOpen={isAddTagModalOpen}
        onClose={() => setIsAddTagModalOpen(false)}
        conversationId={selectedConversation?._id!}
        leadId={selectedConversation?.leadId?._id!}
        conversationTitle={selectedConversation?.leadId?.name || ""}
        conversationType="conversational"
        existingTags={selectedConversation?.tags || []}
        handleAddTagToConversation={handleAddTagToConversation}
        loading={isAddingTag}
      />

      {/* Delete Conversation Modal */}
      <DeleteConversationModal
        isOpen={isDeleteConversationModalOpen}
        onClose={() => setIsDeleteConversationModalOpen(false)}
        onConfirm={() => handleDeleteConversation(selectedConversation?._id!)}
        conversation={selectedConversation!}
        loading={isDeletingConversation}
      />

      {/* schedule message modal */}
      <ScheduleMessage
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        conversationId={selectedConversation?._id}
        conversationTitle={selectedConversation?.leadId?.name || ""}
        onSchedule={handleScheduleMessage}
        message={message}
        attachedFiles={
          attachedFiles?.length > 0
            ? attachedFiles
            : attachedFile
              ? [attachedFile]
              : []
        }
        loading={sendMsgLoading}
      />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        agents={agents}
        selectedAgentId={filters.agentId || null}
        onAgentSelect={handleAgentFilterChange}
        onApplyFilters={handleApplyFilters}
      />

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={isOpenBookAppointmentModal}
        onClose={() => setIsOpenBookAppointmentModal(false)}
        onSuccess={() => {}}
        doctorId={""}
        doctorName={""}
        defaultRoomId={""}
        slotTime={""}
        slotDisplayTime={""}
        defaultDate={""}
        bookedFrom={"doctor"}
        fromTime={""}
        toTime={""}
        rooms={
          rooms?.map((room) => ({
            _id: room._id,
            name: room.name,
          })) || []
        }
        doctorStaff={
          doctors?.map((doctor) => ({
            _id: doctor._id,
            name: doctor.name,
          })) || []
        }
        getAuthHeaders={() => ({
          "Content-Type": "application/json",
          Authorization: `Bearer ${getTokenByPath()}`,
        })}
        preSelectedPatient={patient || null}
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelectLocation={async (location) => {
          // The modal handles sending internally
          console.log("Location selected:", location);
        }}
        selectedConversation={selectedConversation}
        handleSendMessage={handleSendMessage}
      />
    </div>
  );
};

// ✅ Correctly typed getLayout
InboxPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// ✅ Wrap page with auth HOC
const ProtectedInboxPage = withClinicAuth(InboxPage) as NextPageWithLayout;

// ✅ Re-attach layout
ProtectedInboxPage.getLayout = InboxPage.getLayout;

export default ProtectedInboxPage;
