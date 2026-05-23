import React from "react";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Search, Star, Filter, Calendar, User, TrendingUp, MessageSquare, Activity, BarChart3 } from "lucide-react";
import ClinicLayout from '../../components/ClinicLayout';
import withClinicAuth from '../../components/withClinicAuth';
import type { NextPageWithLayout } from '../_app';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import Loader from '../../components/Loader';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// TypeScript interfaces
interface User {
  name?: string;
  _id?: string;
}

interface Review {
  _id: string;
  userId?: User;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  reviews: Review[];
  message?: string;
}

interface RatingStats {
  [key: number]: number;
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

function ClinicReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 30;
  const [showModal, setShowModal] = useState(false);
  const [modalComment, setModalComment] = useState("");
  const [permissions, setPermissions] = useState({
    canRead: false,
    canUpdate: false,
    canDelete: false,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [hasAgentToken, setHasAgentToken] = useState(false);
  const [isAgentRoute, setIsAgentRoute] = useState(false);

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
    // Check both router pathname and actual window location
    const currentPath = window.location.pathname || router?.pathname || "";
    const agentPath = currentPath.startsWith("/agent/");
    setIsAgentRoute(agentPath && hasAgentToken);
  }, [router.pathname, hasAgentToken]);

  // Use agent permissions hook for agent routes
  const agentPermissionsHook: any = useAgentPermissions(isAgentRoute ? "clinic_review" : null);
  const agentPermissions = agentPermissionsHook?.permissions || {
    canRead: false,
    canAll: false,
  };
  const agentPermissionsLoading = agentPermissionsHook?.loading || false;

  // Handle agent permissions
  useEffect(() => {
    if (!isAgentRoute) return;
    if (agentPermissionsLoading) return;
    
    // Check if permissions are actually available
    const hasReadPermission = Boolean(
      agentPermissions?.canAll === true || 
      agentPermissions?.canRead === true
    );
    const hasUpdatePermission = Boolean(
      agentPermissions?.canAll === true || 
      agentPermissions?.canUpdate === true
    );
    const hasDeletePermission = Boolean(
      agentPermissions?.canAll === true || 
      agentPermissions?.canDelete === true
    );
    
    const newPermissions = {
      canRead: hasReadPermission,
      canUpdate: hasUpdatePermission,
      canDelete: hasDeletePermission,
    };
    
    setPermissions(newPermissions);
    setPermissionsLoaded(true);
    
    // Debug logging
    console.log('Agent Route Permissions:', {
      isAgentRoute,
      agentPermissions,
      hasReadPermission,
      canAll: agentPermissions?.canAll,
      canRead: agentPermissions?.canRead
    });
  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);

  // Handle clinic permissions - clinic and doctor have full access by default
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
              // Admin has set permissions - check the clinic_review module or as submodule of clinic_marketing
              let actions: { all?: boolean | string; read?: boolean | string; update?: boolean | string; delete?: boolean | string } = {};
              
              // First, check if clinic_review is a top-level module
              let modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                return p.module === "clinic_review" || p.module === "review";
              });

              if (modulePermission) {
                actions = modulePermission.actions || {};
              } else {
                // If not top-level, check as submodule of clinic_marketing
                const marketingModule = res.data.permissions.find((p: any) => p?.module === "clinic_marketing");
                if (marketingModule && Array.isArray(marketingModule.subModules)) {
                  const reviewSubModule = marketingModule.subModules.find((sub: any) => 
                    sub.name === "Review" || sub.moduleKey === "clinic_review"
                  );
                  if (reviewSubModule) {
                    actions = reviewSubModule.actions || {};
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
    // Note: doctorStaff typically uses agentToken, so checking agentToken covers both
    const token = getStoredToken();
    if (!token) {
      setPermissions({ canRead: false, canUpdate: false, canDelete: false });
      setPermissionsLoaded(true);
      return;
    }

    // Only check permissions for agent/doctorStaff roles when not on agent route
    // doctorStaff is handled by agent route logic when on /agent/ routes
    // Here we handle agent/doctorStaff when accessing /clinic/ routes
    if (agentToken) {
      const fetchPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_review" },
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = res.data;
          
          if (!isMounted) return;
          
          // Fix: Use correct response structure - data.permissions.actions, not data.data.moduleActions
          if (data.success && data.permissions) {
            const moduleActions = data.permissions.actions || {};
            const hasReadPermission = Boolean(
              moduleActions.all === true || 
              moduleActions.read === true
            );
            const hasUpdatePermission = Boolean(
              moduleActions.all === true || 
              moduleActions.update === true
            );
            const hasDeletePermission = Boolean(
              moduleActions.all === true || 
              moduleActions.delete === true
            );
            
            setPermissions({
              canRead: hasReadPermission,
              canUpdate: hasUpdatePermission,
              canDelete: hasDeletePermission,
            });
            
            // Debug logging
            console.log('Non-Agent Route Permissions:', {
              success: data.success,
              permissions: data.permissions,
              moduleActions,
              hasReadPermission,
              all: moduleActions.all,
              read: moduleActions.read
            });
          } else {
            console.warn('No permissions found in response:', data);
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

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Fetch reviews only if permissions are loaded and user has read permission
  useEffect(() => {
    if (!permissionsLoaded) return;
    
    // ✅ Only fetch reviews if user has read permission
    // Clear any previous error first
    if (!permissions.canRead) {
      setError("You do not have permission to view clinic reviews");
      setLoading(false);
      setReviews([]);
      setFilteredReviews([]);
      return;
    }
    
    // Clear error if permission is granted
    if (permissions.canRead && error === "You do not have permission to view clinic reviews") {
      setError("");
    }

    const fetchReviews = async () => {
      try {
        const token = getStoredToken();

        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/clinics/getReview", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data: ApiResponse = await response.json();

        if (data.success) {
          setReviews(data.reviews || []);
          setFilteredReviews(data.reviews || []);
        } else {
          setError(data.message || "Failed to fetch reviews");
        }
      } catch (error: unknown) {
        console.error(error);
        const err = error as { response?: { data?: { message?: string } }, message?: string };
        setError(
          err?.response?.data?.message || err?.message || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [permissionsLoaded, permissions.canRead]);

  useEffect(() => {
    let filtered = reviews;

    // Filter by rating
    if (selectedRating !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(selectedRating)
      );
    }

    // Filter by search term - Fixed the error by adding null checks
    if (searchTerm) {
      filtered = filtered.filter((review) => {
        const comment = review.comment || "";
        const userName = review.userId?.name || "Anonymous";

        return (
          comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredReviews(filtered);
  }, [reviews, searchTerm, selectedRating]);

  const getRatingStats = (): RatingStats => {
    const stats: RatingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        stats[review.rating] = (stats[review.rating] || 0) + 1;
      }
    });
    return stats;
  };

  const getAverageRating = (): string => {
    if (reviews.length === 0) return "0.0";
    const total = reviews.reduce(
      (sum, review) => sum + (review.rating || 0),
      0
    );
    return (total / reviews.length).toFixed(1);
  };

  // Calculate monthly trend data
  const monthlyTrendData = useMemo(() => {
    const monthlyData: { [key: string]: { month: string; monthKey: string; avgRating: number; reviewCount: number; totalRating: number } } = {};
    
    reviews.forEach((review) => {
      const date = new Date(review.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, monthKey, avgRating: 0, reviewCount: 0, totalRating: 0 };
      }
      
      monthlyData[monthKey].reviewCount += 1;
      monthlyData[monthKey].totalRating += review.rating;
    });

    // Calculate averages and sort by date
    const sortedData = Object.values(monthlyData)
      .map(item => ({
        month: item.month,
        avgRating: Number((item.totalRating / item.reviewCount).toFixed(2)),
        reviewCount: item.reviewCount,
        monthKey: item.monthKey
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    return sortedData.slice(-12); // Last 12 months
  }, [reviews]);

  // Calculate sentiment distribution
  const sentimentData = useMemo(() => {
    const positive = reviews.filter(r => r.rating >= 4).length;
    const neutral = reviews.filter(r => r.rating === 3).length;
    const negative = reviews.filter(r => r.rating <= 2).length;
    const total = reviews.length;

    if (total === 0) {
      return [
        { name: 'Positive', value: 0, percentage: 0, color: '#10b981' },
        { name: 'Neutral', value: 0, percentage: 0, color: '#f59e0b' },
        { name: 'Negative', value: 0, percentage: 0, color: '#ef4444' }
      ];
    }

    return [
      { 
        name: 'Positive (4-5★)', 
        value: positive, 
        percentage: Math.round((positive / total) * 100),
        color: '#10b981' 
      },
      { 
        name: 'Neutral (3★)', 
        value: neutral, 
        percentage: Math.round((neutral / total) * 100),
        color: '#f59e0b' 
      },
      { 
        name: 'Negative (1-2★)', 
        value: negative, 
        percentage: Math.round((negative / total) * 100),
        color: '#ef4444' 
      }
    ];
  }, [reviews]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${index < rating ? "fill-yellow-400 text-yellow-400" : "text-teal-300"
          }`}
      />
    ));
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const stats = getRatingStats();

  // Show loading state
  if (loading || !permissionsLoaded || (isAgentRoute && agentPermissionsLoading)) {
    return <Loader />;
  }

  // Show full-page access denied message when read permission is false
  if (permissionsLoaded && !permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-teal-900 mb-2">Access Denied</h2>
          <p className="text-sm text-teal-700 mb-4">
            You do not have permission to view clinic reviews.
          </p>
          <p className="text-xs text-teal-600">
            Please contact your administrator to request access to the Reviews module.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-3 overflow-x-auto bg-gray-50 min-h-screen p-3 sm:p-4">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm border border-teal-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-teal-900">Patient Reviews</h1>
              <p className="text-[10px] sm:text-xs text-teal-500 mt-0.5">Monitor and manage feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
          <p className="text-xs sm:text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Compact Stats Grid */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-teal-200">
            <div className="flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-teal-800" />
              <p className="text-[10px] sm:text-xs text-teal-600 font-medium">Total</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-teal-900">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-teal-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <p className="text-[10px] sm:text-xs text-teal-600 font-medium">Average</p>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-lg sm:text-xl font-bold text-teal-900">{getAverageRating()}</p>
              <div className="flex gap-0.5">
                {renderStars(Math.round(parseFloat(getAverageRating())))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-teal-200">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-800" />
              <p className="text-[10px] sm:text-xs text-teal-600 font-medium">5★</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-teal-900">{stats[5] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-2.5 sm:p-3 border border-teal-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-teal-800" />
              <p className="text-[10px] sm:text-xs text-teal-600 font-medium">This Month</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-teal-900">
              {reviews.filter((r) => {
                const d = new Date(r.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      )}

      {/* Compact Search + Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-teal-200 p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-teal-600" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-teal-900 w-full pl-8 pr-2.5 py-1.5 border border-teal-200 rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 transition-all bg-white"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-teal-800" />
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="text-teal-900 border border-teal-200 rounded-md px-2.5 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-teal-800/20 focus:border-teal-800 bg-white transition-all"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r}★
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-teal-200 text-center">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <User className="w-5 h-5 text-teal-800" />
          </div>
          <p className="text-teal-700 font-medium text-xs sm:text-sm">No reviews found</p>
          <p className="text-teal-500 text-[10px] sm:text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
          {paginatedReviews.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-lg shadow-sm border border-teal-200 p-2.5 sm:p-3 hover:shadow-md transition-all duration-200 hover:border-teal-800 hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              {/* User name and rating */}
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-6 h-6 bg-teal-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <p className="font-semibold text-teal-800 truncate text-[10px] sm:text-xs">
                    {r.userId?.name || "Anonymous"}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {renderStars(r.rating)}
                  </div>
                  <span className="ml-0.5 text-[10px] sm:text-xs font-bold text-teal-800">
                    {r.rating}
                  </span>
                </div>
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-1 mb-2">
                <Calendar className="w-2.5 h-2.5 text-teal-400" />
                <p className="text-[10px] sm:text-xs text-teal-500">
                  {formatDate(r.createdAt)}
                </p>
              </div>

              {/* Read Comment button */}
              <div className="mt-auto">
                {r.comment ? (
                  <button
                    className="w-full bg-teal-800 text-white text-[10px] sm:text-xs font-medium py-1.5 px-2 rounded-md hover:bg-teal-900 transition-all duration-200 shadow-sm hover:shadow"
                    onClick={() => {
                      setModalComment(r.comment || "");
                      setShowModal(true);
                    }}
                  >
                    View Comment
                  </button>
                ) : (
                  <div className="w-full bg-teal-50 text-teal-400 text-[10px] sm:text-xs font-medium py-1.5 px-2 rounded-md text-center border border-teal-200">
                    No comment
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Compact Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-3">
            <button
              className="px-2.5 py-1.5 rounded-md border border-teal-200 bg-white text-teal-700 disabled:opacity-50 hover:bg-teal-800 hover:text-white hover:border-teal-800 transition-all duration-200 text-xs sm:text-sm font-medium"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (currentPage <= 4) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = currentPage - 3 + i;
              }
              return (
                <button
                  key={i}
                  className={`px-2.5 py-1.5 rounded-md border text-xs sm:text-sm font-medium transition-all duration-200 ${
                    currentPage === pageNum 
                      ? 'bg-teal-800 text-white border-teal-800 shadow-sm' 
                      : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-800 hover:text-white hover:border-teal-800'
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-2.5 py-1.5 rounded-md border border-teal-200 bg-white text-teal-700 disabled:opacity-50 hover:bg-teal-800 hover:text-white hover:border-teal-800 transition-all duration-200 text-xs sm:text-sm font-medium"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        
        {/* Compact Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-teal-200">
              <div className="p-3 sm:p-4 border-b border-teal-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-teal-800 rounded-lg flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-teal-900">Patient Comment</h3>
                  </div>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-teal-100 text-teal-500 hover:text-teal-700 transition-colors text-sm"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-3 sm:p-4">
                <div className="text-teal-700 break-words whitespace-pre-line max-h-96 overflow-y-auto leading-relaxed bg-teal-50 rounded-md p-2.5 sm:p-3 border border-teal-200 text-xs sm:text-sm">
                  {modalComment}
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}

      {/* Charts Section - moved below reviews so feedback lists show first */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Trend Graph - Ratings Over Time */}
          <div className="bg-white rounded-lg shadow-sm border border-teal-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-teal-800" />
              <h3 className="text-xs sm:text-sm font-semibold text-teal-900">Ratings Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
                <defs>
                  <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f2937" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1f2937" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#6b7280" 
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Rating', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '10px' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280" 
                  fontSize={10}
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Count', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '10px' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '11px',
                    padding: '6px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgRating" 
                  stroke="#1f2937" 
                  fillOpacity={1} 
                  fill="url(#colorRating)"
                  name="Avg Rating"
                  strokeWidth={2}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="reviewCount" 
                  stroke="#6b7280" 
                  fillOpacity={1} 
                  fill="url(#colorCount)"
                  name="Reviews"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment Distribution - Donut Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-teal-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-teal-800" />
              <h3 className="text-xs sm:text-sm font-semibold text-teal-900">Sentiment Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${Math.round((percent || 0) * 100)}%`}
                  labelLine={false}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                  formatter={(value, name, props) => [
                    `${value} (${props?.payload?.percentage ?? 0}%)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-3 mt-2 text-[10px] sm:text-xs">
              {sentimentData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-teal-600">{item.name.split(' ')[0]}</span>
                  <span className="font-semibold text-teal-900">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ClinicReviews.getLayout = function PageLayout(page: React.ReactNode) {
  return <ClinicLayout>{page}</ClinicLayout>;
};

// ✅ Apply HOC and assign correct type
const ProtectedDashboard: NextPageWithLayout = withClinicAuth(ClinicReviews);

// ✅ Reassign layout (TS-safe now)
ProtectedDashboard.getLayout = ClinicReviews.getLayout;

export default ProtectedDashboard;
