"use client";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { NextPageWithLayout } from "@/pages/_app";
import React, { ReactElement, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Loader2, Building2 } from "lucide-react";
import AddLocationModal from "./_components/AddLocationModal";
import DeleteLocationModal from "./_components/DeleteLocationModal";
import EditLocationModal from "./_components/EditLocationModal";
import { StockLocation } from "@/types/stocks";
import { useRouter } from "next/router";
import { useAgentPermissions } from "@/hooks/useAgentPermissions";

interface ApiResponse {
  success: boolean;
  message: string;
  locations: StockLocation[];
  pagination: {
    totalResults: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasMore: boolean;
  };
}

const MODULE_KEY = "clinic_stock_locations";

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

const StockLocationPage: NextPageWithLayout = ({
  contextOverride = null,
}: {
  contextOverride?: "clinic" | "agent" | null;
}) => {
  const router = useRouter();
  const [_routeContext, setRouteContext] = useState<"clinic" | "agent">(
    contextOverride || "clinic",
  );
  const [permissions, setPermissions] = useState({
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalResults: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 20,
    hasMore: false,
  });

  // Initialize with sample data
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] =
    useState<StockLocation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<StockLocation | null>(
    null,
  );

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
  const agentPermissionsHook: any = useAgentPermissions(
    isAgentRoute ? MODULE_KEY : null,
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
      canCreate: Boolean(
        agentPermissions.canAll || agentPermissions.canCreate,
      ),
      canUpdate: Boolean(
        agentPermissions.canAll || agentPermissions.canUpdate,
      ),
      canDelete: Boolean(
        agentPermissions.canAll || agentPermissions.canDelete,
      ),
    };

    setPermissions(newPermissions);
    setPermissionsLoaded(true);
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

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
                  (c) =>
                    "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
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
            console.log("Clinic Sidebar Permissions Response:", res.data);
            // Check if permissions array exists and is not null
            // If permissions is null, admin hasn't set any restrictions yet - allow full access (backward compatibility)
            if (
              res.data.permissions === null ||
              !Array.isArray(res.data.permissions) ||
              res.data.permissions.length === 0
            ) {
              console.log("No permissions set, granting full access");
              // No admin restrictions set yet - default to full access for backward compatibility
              setPermissions({
                canRead: true,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
              });
            } else {
              // Admin has set permissions - check the clinic_stock_locations module OR parent clinic_stock module's subModules
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for clinic_stock_locations module variations
                if (p.module === "clinic_stock_locations") return true;
                if (p.module === "clinic_stock_locations") return true;
                if (p.module === "stock_locations") return true;
                return false;
              });

              console.log("Direct module permission found:", modulePermission);

              // If not found as direct module, check parent clinic_stock module's subModules
              if (!modulePermission) {
                const parentStockModule = res.data.permissions.find((p: any) => 
                  p?.module === "clinic_stock" && Array.isArray(p.subModules)
                );
                
                console.log("Parent stock module found:", parentStockModule);
                
                if (parentStockModule) {
                  modulePermission = parentStockModule.subModules.find((sm: any) => 
                    sm?.moduleKey === "clinic_stock_locations"
                  );
                  console.log("Submodule permission found:", modulePermission);
                }
              }

              if (modulePermission) {
                const actions = modulePermission.actions || {};
                console.log("Module permission actions:", actions);

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

                const newPermissions = {
                  canRead: moduleAll || moduleRead,
                  canCreate: moduleAll || moduleCreate,
                  canUpdate: moduleAll || moduleUpdate,
                  canDelete: moduleAll || moduleDelete,
                };
                console.log("Setting permissions:", newPermissions);
                setPermissions(newPermissions);
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
            "Fetching Agent/Staff Permissions for clinic_stock_locations...",
          );
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: MODULE_KEY },
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
          console.log("Setting permissions:", newPerms);
        } catch (err: any) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            // Default to full access on error (backward compatibility)
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

      fetchPermissions();
      return;
    }

    // Default to full access for other cases
    setPermissions({
      canRead: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    });
    setPermissionsLoaded(true);
  }, [isAgentRoute]);

  // Fetch stock locations
  const fetchLocations = useCallback(
    async (page: number = 1, search: string = "") => {
      try {
        setLoading(true);

        const token = getTokenByPath();
        const response = await axios.get<ApiResponse>(
          `/api/stocks/locations?page=${page}&limit=${pagination.limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          // If API returns empty array, keep sample data, otherwise use API data
          if (
            response.data?.locations &&
            response.data?.locations?.length > 0
          ) {
            setLocations(response.data?.locations || []);
          }
          setPagination((prev) => ({
            ...prev,
            ...response.data.pagination,
          }));
        }
      } catch (error) {
        console.error("Error fetching stock locations:", error);
        // Keep sample data if there's an error
        setLocations([]); // Comment out to keep samples on error
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit],
  );

  useEffect(() => {
    // Only fetch locations if permissions are loaded and canRead is true
    if (permissionsLoaded && permissions.canRead) {
      fetchLocations();
    } else if (permissionsLoaded) {
      // If canRead is false, don't fetch anything
      setLoading(false);
    }
  }, [permissionsLoaded, permissions.canRead, fetchLocations]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchLocations(page);
    },
    [fetchLocations],
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      fetchLocations(1, searchTerm);
    },
    [fetchLocations],
  );

  // Action handlers
  const handleAddLocation = useCallback(() => {
    if (!permissions.canCreate) return;
    setIsAddModalOpen(true);
  }, [permissions.canCreate]);

  const handleAddLocationSubmit = useCallback(
    async (locationData: { location: string; status: string }) => {
      if (!permissions.canCreate) return;
      try {
        const token = getTokenByPath();
        const response = await axios.post<ApiResponse>(
          `/api/stocks/locations`,
          {
            location: locationData.location,
            status: locationData.status,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data?.success) {
          // Refresh the list
          fetchLocations(pagination.currentPage, "");
          setIsAddModalOpen(false);
        }
      } catch (error) {
        console.error("Error adding location:", error);
        alert("Failed to add location");
      }
    },
    [fetchLocations, pagination.currentPage, permissions.canCreate],
  );

  const handleDeleteClick = useCallback((location: StockLocation) => {
    if (!permissions.canDelete) return;
    setLocationToDelete(location);
    setIsDeleteModalOpen(true);
  }, [permissions.canDelete]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!locationToDelete || !permissions.canDelete) return;

    try {
      const token = getTokenByPath();
      const response = await axios.delete(
        `/api/stocks/locations/delete-location/${locationToDelete._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        // Refresh the list
        fetchLocations(pagination.currentPage, "");
        setIsDeleteModalOpen(false);
        setLocationToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      alert("Failed to delete location");
    }
  }, [locationToDelete, fetchLocations, pagination.currentPage, permissions.canDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteModalOpen(false);
    setLocationToDelete(null);
  }, []);

  const handleEditClick = useCallback((location: StockLocation) => {
    if (!permissions.canUpdate) return;
    setLocationToEdit(location);
    setIsEditModalOpen(true);
  }, [permissions.canUpdate]);

  const handleEditSubmit = useCallback(
    async (locationData: { location: string; status: string }) => {
      if (!locationToEdit || !permissions.canUpdate) return;

      try {
        const token = getTokenByPath();
        const response = await axios.put<ApiResponse>(
          `/api/stocks/locations/update-location/${locationToEdit._id}`,
          {
            location: locationData.location,
            status: locationData.status,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          // Refresh the list
          fetchLocations(pagination.currentPage, "");
          setIsEditModalOpen(false);
          setLocationToEdit(null);
        }
      } catch (error) {
        console.error("Error updating location:", error);
        alert("Failed to update location");
      }
    },
    [locationToEdit, fetchLocations, pagination.currentPage, permissions.canUpdate],
  );

  const handleEditCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setLocationToEdit(null);
  }, []);

  // If permissions are not loaded yet, show loading spinner
  if (!permissionsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-center text-gray-700">
          <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
          <p className="text-xs sm:text-sm">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  // If canRead is false, show access denied
  if (!permissions.canRead && !permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-700 mb-4">
            You do not have permission to view stock locations.
          </p>
          <p className="text-xs text-gray-600">
            Please contact your administrator to request access to the Stock Locations module.
          </p>
        </div>
      </div>
    );
  }

  // If canRead is false but canCreate is true, show only add button
  if (!permissions.canRead && permissions.canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="max-w-9xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Stock Locations
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Manage storage locations for your clinic inventory
                </p>
              </div>
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleAddLocation}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Location
              </button>

              {/* Add Location Modal */}
              <AddLocationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddLocation={handleAddLocationSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="max-w-9xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Stock Locations
              </h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Manage storage locations for your clinic inventory
              </p>
            </div>
            {permissions.canCreate && (
              <button
                className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                onClick={handleAddLocation}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Location
              </button>
            )}

            {/* Add Location Modal */}
            {permissions.canCreate && (
              <AddLocationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddLocation={handleAddLocationSubmit}
              />
            )}

            {/* Delete Location Modal */}
            {permissions.canDelete && (
              <DeleteLocationModal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                locationName={locationToDelete?.location}
              />
            )}

            {/* Edit Location Modal */}
            {permissions.canUpdate && (
              <EditLocationModal
                isOpen={isEditModalOpen}
                onClose={handleEditCancel}
                onEditLocation={handleEditSubmit}
                locationData={locationToEdit || undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-9xl mx-auto mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H9a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 9h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Locations
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {locations.length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Active storage areas</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Active
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {locations.filter((loc) => loc.status === "Active").length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Currently operational</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.669 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div className="ml-5 flex-1">
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Maintenance
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {locations.filter((loc) => loc.status !== "Active").length}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="text-xs text-gray-500">Needs attention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-9xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Stock Locations
              </h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search locations..."
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              <p className="text-gray-600">Loading stock locations...</p>
            </div>
          ) : locations.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No locations found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first storage location.
              </p>
              {permissions.canCreate && (
                <button
                  onClick={handleAddLocation}
                  className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add First Location
                </button>
              )}
            </div>
          ) : (
            /* Data Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => (
                    <tr
                      key={location._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {location.location.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {location.location}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {location._id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            location.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : location.status === "Inactive"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full mr-2 ${
                              location.status === "Active"
                                ? "bg-green-500"
                                : location.status === "Inactive"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                            }`}
                          />
                          {location.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(location.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {permissions.canUpdate && (
                            <button
                              onClick={() => handleEditClick(location)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                          {permissions.canDelete && (
                            <button
                              onClick={() => handleDeleteClick(location)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                              title="Delete"
                            >
                              <TrashIcon className="h-5 w-5" />
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalResults,
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium">{pagination.totalResults}</span>{" "}
                results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map(
                    (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            pagination.currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Layout configuration
StockLocationPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedStockLocationPage = withClinicAuth(
  StockLocationPage,
) as NextPageWithLayout;
ProtectedStockLocationPage.getLayout = StockLocationPage.getLayout;

export default ProtectedStockLocationPage;
