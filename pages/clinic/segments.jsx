import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Plus,
    Users,
    Calendar,
    Edit,
    Trash2,
    Eye,
    ChevronRight,
    Tag,
    TrendingUp,
    Download,
    X,
    Grid,
    List,
} from "lucide-react";
import clsx from "clsx";
import axios from "axios";
import CreateSegmentModal from "@/components/modals/CreateSegmentModal";
import toast from "react-hot-toast";
import DeleteSegmentModal from "@/components/modals/DeleteSegmentModal";
import SegmentModal from "@/components/modals/SegmentModal";
import { useRouter } from "next/router";
import Link from "next/link";

const SegmentsPage = () => {
    const router = useRouter()
    const [segments, setSegments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteSegmentModal, setShowDeleteSegmentModal] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileDetails, setShowMobileDetails] = useState(false);
    const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
    const [permissionsLoaded, setPermissionsLoaded] = useState(false);
    const [permissions, setPermissions] = useState({
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canRead: true,
        canAssign: true,
    });
    const [filters, setFilters] = useState({
        status: "",
        name: "",
        startDate: "",
        endDate: "",
    });
    const [filterStatus, setFilterStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSegments, setTotalSegments] = useState(0);
    const [loading, setLoading] = useState(false);
    const [deleteSegmentLoading, setDeleteSegmentLoading] = useState(false)
    const segmentsPerPage = 10;
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicToken") : null;

    // Predefined colors for segments
    const segmentColors = [
        "bg-blue-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-purple-500",
        "bg-rose-500",
        "bg-indigo-500",
        "bg-cyan-500",
        "bg-pink-500",
        "bg-teal-500",
        "bg-orange-500",
    ];

    // Check screen size for mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) {
                setShowMobileDetails(false);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Fetch permissions
    const fetchPermissions = async () => {
        if (!token) return;
        try {
            // TODO: Implement actual permission fetch
            const res = await axios.get("/api/clinic/permissions", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = res.data;
            //   if (data.success && data.data) {
            //     // Find "create_lead" module permission (not submodule)
            //     const modulePermission = data.data.permissions?.find(
            //       (p) => {
            //         const moduleKey = p.module || "";
            //         // Check for "create_lead" module (with or without prefix)
            //         const normalizedModule = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, "");
            //         return normalizedModule === "create_lead" || moduleKey === "create_lead" ||
            //           moduleKey === "clinic_create_lead" || moduleKey === "doctor_create_lead";
            //       }
            //     );

            //     if (modulePermission) {
            //       const actions = modulePermission.actions || {};
            //       console.log('[create-lead] Module permission found:', {
            //         module: modulePermission.module,
            //         actions: actions,
            //       });

            //       // Helper function to check if a permission value is true (handles boolean and string)
            //       const isTrue = (value) => {
            //         if (value === true) return true;
            //         if (value === "true") return true;
            //         if (String(value).toLowerCase() === "true") return true;
            //         return false;
            //       };

            //       // Module-level permissions - check each action independently
            //       // If user only has "create", they can ONLY create, not read/update/delete
            //       const moduleAll = isTrue(actions.all);
            //       const moduleCreate = isTrue(actions.create);
            //       const moduleUpdate = isTrue(actions.update);
            //       const moduleDelete = isTrue(actions.delete);
            //       const moduleRead = isTrue(actions.read);

            //       console.log('[create-lead] Permission checks:', {
            //         moduleAll,
            //         moduleRead,
            //         moduleCreate,
            //         moduleUpdate,
            //         moduleDelete
            //       });

            //       // CRUD permissions based on module-level actions
            //       // If "all" is true, grant everything
            //       // Otherwise, check each action independently
            //       setPermissions({
            //         // Create: Module "all" OR module "create"
            //         canCreate: moduleAll || moduleCreate,
            //         // Update: Module "all" OR module "update" (independent of create)
            //         canUpdate: moduleAll || moduleUpdate,
            //         // Delete: Module "all" OR module "delete" (independent of create)
            //         canDelete: moduleAll || moduleDelete,
            //         // Read: Module "all" OR module "read" (independent of create)
            //         canRead: moduleAll || moduleRead,
            //         // Assign: Module "all" OR module "update" (assigning is an update operation)
            //         canAssign: moduleAll || moduleUpdate,
            //       });
            //     } else {
            //       // No permissions found for create_lead module
            //       console.log('[create-lead] No create_lead module permission found. Available modules:',
            //         data.data.permissions?.map(p => p.module) || []
            //       );
            //       // If no permissions are set up at all, allow access (backward compatibility)
            //       // Otherwise, deny access
            //       const hasAnyPermissions = data.data.permissions && data.data.permissions.length > 0;
            //       setPermissions({
            //         canCreate: !hasAnyPermissions, // Allow if no permissions set up
            //         canUpdate: !hasAnyPermissions,
            //         canDelete: !hasAnyPermissions,
            //         canRead: !hasAnyPermissions, // Allow if no permissions set up
            //         canAssign: !hasAnyPermissions,
            //       });
            //     }
            //   } else {
            //     // API failed, default to false
            //     setPermissions({
            //       canCreate: false,
            //       canUpdate: false,
            //       canDelete: false,
            //       canRead: false,
            //       canAssign: false,
            //     });
            //   }
            setPermissionsLoaded(true);
            setPermissions({
                canCreate: true,
                canUpdate: true,
                canDelete: true,
                canRead: true,
                canAssign: true,
            });
        } catch (error) {
            console.error("Error fetching permissions:", error);
            setPermissionsLoaded(true);
        }
    };

    // Helper function to get random color for segment
    const getRandomColor = (segmentId) => {
        if (!segmentId) return segmentColors[0];
        const hash = segmentId.toString().split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        return segmentColors[Math.abs(hash) % segmentColors.length];
    };

    // Helper function to get icon based on segment name/keywords
    const getSegmentIcon = (segmentName) => {
        const name = segmentName.toLowerCase();

        if (
            name.includes("high") ||
            name.includes("vip") ||
            name.includes("premium")
        ) {
            return "💎";
        }
        if (
            name.includes("warm") ||
            name.includes("hot") ||
            name.includes("active")
        ) {
            return "🔥";
        }
        if (
            name.includes("cold") ||
            name.includes("inactive") ||
            name.includes("old")
        ) {
            return "❄️";
        }
        if (
            name.includes("new") ||
            name.includes("recent") ||
            name.includes("fresh")
        ) {
            return "🆕";
        }
        if (
            name.includes("customer") ||
            name.includes("client") ||
            name.includes("repeat")
        ) {
            return "👥";
        }
        if (
            name.includes("prospect") ||
            name.includes("lead") ||
            name.includes("potential")
        ) {
            return "🎯";
        }
        if (
            name.includes("trial") ||
            name.includes("demo") ||
            name.includes("free")
        ) {
            return "🆓";
        }
        if (
            name.includes("paid") ||
            name.includes("subscriber") ||
            name.includes("member")
        ) {
            return "💰";
        }
        if (
            name.includes("email") ||
            name.includes("newsletter") ||
            name.includes("subscriber")
        ) {
            return "📧";
        }
        if (
            name.includes("website") ||
            name.includes("visitor") ||
            name.includes("organic")
        ) {
            return "🌐";
        }

        return "📋";
    };

    // Fetch segments
    const fetchSegments = async () => {

        if (!token) return;

        // Wait for permissions to load
        if (!permissionsLoaded) return;

        // Check if user has read permission
        if (permissions.canRead === false) {
            setSegments([]);
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get("/api/segments/get-segments", {
                params: {
                    ...filters,
                    page: currentPage,
                    limit: segmentsPerPage,
                    status: filterStatus === "all" ? "" : filterStatus,
                },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data.success) {
                const segmentsWithEnrichment = res.data?.segments?.map(segment => ({
                    ...segment,
                    leadCount: segment.leads?.length || 0,
                    conversionRate: 0, // You'll need to calculate this based on your logic
                    color: getRandomColor(segment._id),
                    icon: getSegmentIcon(segment.name),
                    lastUpdated: formatRelativeTime(segment.updatedAt || segment.createdAt)
                })) || [];

                setSegments(segmentsWithEnrichment);
                setTotalPages(res?.data?.pagination?.totalPages || 1);
                setTotalSegments(res?.data?.pagination?.totalSegments || 0);
            } else {
                // If permission denied, clear segments
                if (res.data?.message && res.data?.message.includes("permission")) {
                    setSegments([]);
                }
            }
        } catch (error) {
            console.log('Error in fetch segments: ', error?.response?.data || error?.message);
            toast.error(error?.response?.data?.message || "Failed to fetch segments");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format relative time
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));

        if (diffDays > 7) {
            return formatDate(dateString);
        } else if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            return "Just now";
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: "numeric", month: "short", day: "numeric" };
        return new Date(dateString).toLocaleDateString("en-US", options);
    };

    // Get conversion rate color
    const getConversionColor = (rate) => {
        if (rate >= 50) return "text-emerald-600";
        if (rate >= 25) return "text-amber-600";
        return "text-rose-600";
    };

    // Get conversion rate background color
    const getConversionBgColor = (rate) => {
        if (rate >= 50) return "bg-emerald-100";
        if (rate >= 25) return "bg-amber-100";
        return "bg-rose-100";
    };

    // Handle deleting segment
    const handleDeleteSegment = async (segmentId) => {

        if (!segmentId) {
            toast.error("No selected segment")
            return
        }

        try {
            setDeleteSegmentLoading(true)
            const response = await axios.delete(`/api/segments/delete-segment/${segmentId}`, {
                data: { segmentId },
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                toast.success("Segment deleted successfully");
                setSegments(segments.filter((segment) => segment._id !== segmentId));
                setTotalSegments(prev => prev - 1)
                if (selectedSegment?._id === segmentId) {
                    setSelectedSegment(null);
                    if (isMobile) setShowMobileDetails(false);
                }
                setShowDeleteSegmentModal(false)
            } else {
                toast.error(response.data.message || "Failed to delete segment");
            }
        } catch (error) {
            console.error("Error deleting segment:", error);
            toast.error(error?.response?.data?.message || "Failed to delete segment");
        }
        finally {
            setDeleteSegmentLoading(false)
        }
    };

    // Handle segment selection
    const handleSelectSegment = (segment) => {
        setSelectedSegment(segment);
        if (isMobile) {
            setShowMobileDetails(true);
        }
    };


    // Handle search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSegments();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, filterStatus]);

    useEffect(() => {
        fetchPermissions();
    }, [token]);

    useEffect(() => {
        // Fetch segments after permissions are loaded
        if (permissionsLoaded) {
            fetchSegments();
        }
    }, [permissionsLoaded, permissions.canRead, filters, currentPage, filterStatus]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="py-4 px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl mx-auto">
                {/* Mobile Back Button for Details View */}
                {isMobile && showMobileDetails && (
                    <button
                        onClick={() => setShowMobileDetails(false)}
                        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180 mr-2" />
                        Back to Segments
                    </button>
                )}

                {/* Mobile Details View */}
                {isMobile && showMobileDetails ? (
                    <MobileSegmentDetails
                        segment={selectedSegment}
                        onBack={() => setShowMobileDetails(false)}
                        formatDate={formatDate}
                        getConversionColor={getConversionColor}
                        onViewLeads={() => {
                            if (selectedSegment?._id) {
                                // Navigate to leads page with segment filter
                                router.push({
                                    pathname: '/clinic/create-lead',
                                    query: { segment: selectedSegment._id }
                                });
                            }
                        }}
                        formatRelativeTime={formatRelativeTime}
                    />
                ) : (
                    <>
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1
                                        className="text-xl sm:text-2xl font-bold text-gray-900"
                                    >
                                        Lead Segments
                                    </h1>
                                    <p
                                        className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                                        Organize and manage your lead segments for better targeting
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    {permissions.canCreate && (
                                        <Link
                                            href="/clinic/create-lead"
                                            className="inline-flex items-center justify-center cursor-pointer gap-1.5 border border-gray-800 text-gray-800 bg-transparent hover:bg-gray-800 hover:text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                                        >
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>Manage Lead</span>
                                        </Link>
                                    )}
                                    {permissions.canCreate && (
                                        <button
                                            onClick={() => setShowCreateModal(true)}
                                            className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                                            <span className="hidden sm:inline">Create New Segment</span>
                                            <span className="sm:hidden">New Segment</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards - Responsive Grid */}
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
                            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">
                                            Total Segments
                                        </p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                                            {totalSegments}
                                        </p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                                        <Tag className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-emerald-600">
                                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{segments.length} loaded</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">
                                            Total Leads
                                        </p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                                            {segments
                                                .reduce((sum, segment) => sum + (segment.leads?.length || 0), 0)
                                                .toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg">
                                        <Users className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">
                                            Active Segments
                                        </p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                                            {segments?.filter((s) => s.status === "active").length}
                                        </p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                                        <Tag className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600">
                                            Archived Segments
                                        </p>
                                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">
                                            {segments?.filter((s) => s.status === "archived").length}
                                        </p>
                                    </div>
                                    <div className="p-2 sm:p-3 bg-slate-100 rounded-lg">
                                        <Tag className="w-4 h-4 sm:w-6 sm:h-6 text-slate-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:grid lg:grid-cols-3 lg:gap-6 xl:gap-8">
                            {/* Left Column - Segments List */}
                            <div
                                className={clsx(
                                    isMobile ? "block" : "lg:col-span-2",
                                    !isMobile && "lg:block"
                                )}
                            >
                                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
                                    {/* Search and Filter Bar */}
                                    <div className="p-4 sm:p-6 border-b border-gray-200">
                                        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search segments..."
                                                        value={filters.name}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                {/* Status Filter */}
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-xs sm:text-sm text-gray-600">
                                                        Status:
                                                    </span>
                                                    <select
                                                        value={filterStatus}
                                                        onChange={(e) => setFilterStatus(e.target.value)}
                                                        className="px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="all">All</option>
                                                        <option value="active">Active</option>
                                                        <option value="archived">Archived</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end space-x-2">
                                                {/* View Mode Toggle */}
                                                <div className="flex items-center space-x-1">
                                                    <button
                                                        onClick={() => setViewMode("list")}
                                                        className={clsx(
                                                            "p-2 rounded-lg",
                                                            viewMode === "list"
                                                                ? "bg-blue-100 text-blue-600"
                                                                : "text-gray-600 hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <List className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode("grid")}
                                                        className={clsx(
                                                            "p-2 rounded-lg",
                                                            viewMode === "grid"
                                                                ? "bg-blue-100 text-blue-600"
                                                                : "text-gray-600 hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <Grid className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Segments List */}
                                    <div className="p-4 sm:p-6">
                                        {loading ? (
                                            <div className="text-center py-12">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                                                <p className="mt-4 text-gray-600">Loading segments...</p>
                                            </div>
                                        ) : segments.length === 0 ? (
                                            <div className="text-center py-8 sm:py-12">
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                                    <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                                                    No segments found
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Try adjusting your search or create a new segment
                                                </p>
                                            </div>
                                        ) : viewMode === "grid" ? (
                                            // Grid View
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {segments.map((segment) => (
                                                    <div
                                                        key={segment._id}
                                                        onClick={() => handleSelectSegment(segment)}
                                                        className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                                                    >
                                                        <div className="p-4">
                                                            <div className="flex items-start space-x-3">
                                                                <div
                                                                    className={clsx(
                                                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0",
                                                                        segment.color || getRandomColor(segment._id)
                                                                    )}
                                                                >
                                                                    <span className="text-lg sm:text-xl">
                                                                        {segment.icon || getSegmentIcon(segment.name)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between">
                                                                        <h3 className="font-medium text-gray-900 truncate">
                                                                            {segment.name}
                                                                        </h3>
                                                                        <span
                                                                            className={clsx(
                                                                                "ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                                                                                segment.status === "active"
                                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                                    : "bg-slate-100 text-slate-800"
                                                                            )}
                                                                        >
                                                                            {segment.status === "active"
                                                                                ? "Active"
                                                                                : "Archived"}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                        {segment.description || "No description"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center text-xs text-gray-600">
                                                                        <Users className="w-3 h-3 mr-1" />
                                                                        <span>{segment.leads?.length || 0} leads</span>
                                                                    </div>
                                                                    <div
                                                                        className={clsx(
                                                                            "px-2 py-1 rounded text-xs font-medium",
                                                                            getConversionBgColor(segment.conversionRate),
                                                                            getConversionColor(segment.conversionRate)
                                                                        )}
                                                                    >
                                                                        {segment.conversionRate || 0}%
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center text-xs text-gray-500">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    <span>
                                                                        Updated {formatRelativeTime(segment.updatedAt)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // List View
                                            <div className="space-y-3 sm:space-y-4">
                                                {segments.map((segment) => (
                                                    <div
                                                        key={segment._id}
                                                        onClick={() => handleSelectSegment(segment)}
                                                        className={clsx(
                                                            "p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200",
                                                            selectedSegment?._id === segment._id && !isMobile
                                                                ? "bg-blue-50 border-blue-200 shadow-sm"
                                                                : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                                                                <div
                                                                    className={clsx(
                                                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0",
                                                                        segment.color || getRandomColor(segment._id)
                                                                    )}
                                                                >
                                                                    <span className="text-lg sm:text-xl">
                                                                        {segment.icon || getSegmentIcon(segment.name)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                                                            {segment.name}
                                                                        </h3>
                                                                        <span
                                                                            className={clsx(
                                                                                "ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
                                                                                segment.status === "active"
                                                                                    ? "bg-emerald-100 text-emerald-800"
                                                                                    : "bg-slate-100 text-slate-800"
                                                                            )}
                                                                        >
                                                                            {segment.status === "active"
                                                                                ? "Active"
                                                                                : "Archived"}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                                                                        {segment.description || "No description"}
                                                                    </p>

                                                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                                                                        <div className="flex items-center text-gray-600">
                                                                            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" />
                                                                            <span className="font-medium">
                                                                                {segment.leads?.length || 0} leads
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center">
                                                                            <span
                                                                                className={clsx(
                                                                                    "font-medium",
                                                                                    getConversionColor(segment.conversionRate)
                                                                                )}
                                                                            >
                                                                                {segment.conversionRate || 0}% conversion
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center text-gray-600">
                                                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" />
                                                                            <span>
                                                                                Updated {formatRelativeTime(segment.updatedAt)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                                                                {permissions.canUpdate && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedSegment(segment)
                                                                            setShowEditModal(true)
                                                                        }}
                                                                        className="p-1 sm:p-2 cursor-pointer text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                                    >
                                                                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    </button>
                                                                )}
                                                                {permissions.canDelete && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedSegment(segment)
                                                                            setShowDeleteSegmentModal(true)
                                                                        }}
                                                                        className="p-1 sm:p-2 cursor-pointer text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                    >
                                                                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                    </button>
                                                                )}
                                                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination */}
                                    {permissions.canRead && totalPages > 1 && (
                                        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-700">
                                                    Showing {(currentPage - 1) * segmentsPerPage + 1}-{currentPage * segmentsPerPage} of {totalSegments} segment{totalSegments === 1 ? "" : "s"}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <button
                                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                        className="rounded-lg cursor-pointer border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Previous
                                                    </button>
                                                    <span className="text-gray-600">
                                                        Page {currentPage} of {totalPages}
                                                    </span>
                                                    <button
                                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="rounded-lg cursor-pointer border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Segment Details (Desktop Only) */}
                            {!isMobile && (
                                <div className="hidden lg:block lg:col-span-1">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
                                        <div className="p-6 border-b border-gray-200">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                Segment Details
                                            </h2>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {selectedSegment
                                                    ? "View and manage segment details"
                                                    : "Select a segment to view details"}
                                            </p>
                                        </div>

                                        <div className="p-6">
                                            {selectedSegment ? (
                                                <DesktopSegmentDetails
                                                    segment={selectedSegment}
                                                    formatDate={formatDate}
                                                    getConversionColor={getConversionColor}
                                                    onViewLeads={() => {
                                                        if (selectedSegment?._id) {
                                                            // Navigate to leads page with segment filter
                                                            router.push({
                                                                pathname: '/clinic/create-lead',
                                                                query: { segment: selectedSegment._id }
                                                            });
                                                        }
                                                    }}
                                                    formatRelativeTime={formatRelativeTime}
                                                    getRandomColor={getRandomColor}
                                                />
                                            ) : (
                                                <NoSegmentSelected
                                                    onCreate={() => setShowCreateModal(true)}
                                                    canCreate={permissions.canCreate}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>


            {/* For Create Segment */}
            <SegmentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onComplete={(segment) => {
                    // Handle newly created segment
                    if (segment) {
                        const enrichedSegment = {
                            ...segment,
                            leadCount: segment.leads?.length || 0,
                            conversionRate: 0,
                            color: getRandomColor(segment._id),
                            icon: getSegmentIcon(segment.name),
                            lastUpdated: "Just now"
                        };
                        setSegments(prev => [enrichedSegment, ...prev]);
                        setTotalSegments(prev => prev + 1)
                        toast.success("Segment created successfully");
                    }
                }}
                token={token}
                mode="create"
            />

            {/* For Edit Segment */}
            <SegmentModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onComplete={(updatedSegment) => {
                    // Handle updated segment
                    setSegments(prev => prev.map(s =>
                        s._id === updatedSegment._id ? updatedSegment : s
                    ));
                }}
                token={token}
                segment={selectedSegment} // Pass the segment to edit
                mode="edit"
            />

            {/* Delete Segment Modal */}
            <DeleteSegmentModal
                isOpen={showDeleteSegmentModal}
                onClose={() => setShowDeleteSegmentModal(false)}
                onConfirm={() => handleDeleteSegment(selectedSegment?._id)}
                segmentName={selectedSegment?.name || ""}
                leadCount={selectedSegment?.leads?.length || 0}
                loading={deleteSegmentLoading}
            />
        </div>
    );
};

// Mobile Segment Details Component
const MobileSegmentDetails = ({
    segment,
    onBack,
    formatDate,
    getConversionColor,
    onViewLeads,
    formatRelativeTime,
}) => {
    if (!segment) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Segment Details
                    </h2>
                </div>
            </div>

            <div className="p-4">
                <div className="space-y-6">
                    {/* Segment Header */}
                    <div className="flex items-center space-x-4">
                        <div
                            className={clsx(
                                "w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white",
                                segment.color || "bg-blue-500"
                            )}
                        >
                            <span className="text-2xl">{segment.icon || "📋"}</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {segment.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {segment.description || "No description"}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span
                                    className={clsx(
                                        "px-3 py-1 rounded-full text-xs font-medium",
                                        segment.status === "active"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-slate-100 text-slate-800"
                                    )}
                                >
                                    {segment.status === "active" ? "Active" : "Archived"}
                                </span>
                                <span className="text-sm text-gray-500">
                                    Updated {formatRelativeTime(segment.updatedAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-600">Total Leads</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {segment.leads?.length || 0}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-gray-600">
                                Created Date
                            </p>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                                {formatDate(segment.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Segment Info */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Segment Information
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status</span>
                                    <span
                                        className={clsx(
                                            "font-medium",
                                            segment.status === "active"
                                                ? "text-emerald-600"
                                                : "text-slate-600"
                                        )}
                                    >
                                        {segment.status === "active" ? "Active" : "Archived"}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Last Updated</span>
                                    <span className="font-medium text-gray-900">
                                        {formatRelativeTime(segment.updatedAt)}
                                    </span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="flex space-x-3">
                            <button
                                onClick={onViewLeads}
                                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View Leads</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Desktop Segment Details Component
const DesktopSegmentDetails = ({
    segment,
    formatDate,
    getConversionColor,
    onViewLeads,
    formatRelativeTime,
    getRandomColor,
}) => {
    if (!segment) return null;

    return (
        <div className="space-y-6">
            {/* Segment Header */}
            <div className="flex items-center space-x-4">
                <div
                    className={clsx(
                        "w-16 h-16 rounded-xl flex items-center justify-center text-white",
                        segment.color || getRandomColor(segment._id)
                    )}
                >
                    <span className="text-2xl">{segment.icon || "📋"}</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{segment.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{segment.description || "No description"}</p>
                    <div className="flex items-center space-x-2 mt-2">
                        <span
                            className={clsx(
                                "px-3 py-1 rounded-full text-xs font-medium",
                                segment.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-100 text-slate-800"
                            )}
                        >
                            {segment.status === "active" ? "Active" : "Archived"}
                        </span>
                        <span className="text-sm text-gray-500">
                            Updated {formatRelativeTime(segment.updatedAt)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        {segment.leads?.length || 0}
                    </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Created Date</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatDate(segment.createdAt)}
                    </p>
                </div>
            </div>

            {/* Segment Info */}
            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Segment Information
                    </h4>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status</span>
                            <span
                                className={clsx(
                                    "font-medium",
                                    segment.status === "active"
                                        ? "text-emerald-600"
                                        : "text-slate-600"
                                )}
                            >
                                {segment.status === "active" ? "Active" : "Archived"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Last Updated</span>
                            <span className="font-medium text-gray-900">
                                {formatRelativeTime(segment.updatedAt)}
                            </span>
                        </div>

                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                    {/* View Leads */}
                    <button
                        onClick={onViewLeads}
                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View Leads
                    </button>
                </div>
            </div>
        </div>
    );
};

// No Segment Selected Component
const NoSegmentSelected = ({ onCreate, canCreate }) => {
    return (
        <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Tag className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">
                No Segment Selected
            </h3>
            <p className="text-sm text-gray-600 mb-6">
                Select a segment from the list to view details and manage settings
            </p>

            {canCreate && (
                <button
                    onClick={onCreate}
                    className="inline-flex items-center cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Segment
                </button>
            )}
        </div>
    );
};

// Preserve layout across navigation
SegmentsPage.getLayout = function getLayout(page) {
    return (
        <ClinicLayout hideSidebar={false} hideHeader={false}>
            {page}
        </ClinicLayout>
    );
};

// Wrap page with auth HOC
const ProtectedSegmentsPage = withClinicAuth(SegmentsPage);

// Re-attach layout to wrapped component
ProtectedSegmentsPage.getLayout = SegmentsPage.getLayout;

export default ProtectedSegmentsPage;