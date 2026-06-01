"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Star,
  Filter,
  Calendar,
  User,
  TrendingUp,
  MessageSquare,
  Activity,
  BarChart3,
} from "lucide-react";
import DoctorLayout from "../../components/DoctorLayout";
import withDoctorAuth from "../../components/withDoctorAuth";
import type { NextPageWithLayout } from "../_app";
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

function DoctorReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 30;
  const [showModal, setShowModal] = useState(false);
  const [modalComment, setModalComment] = useState("");

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token =
          localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken");

        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch("/api/doctor/getReviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: ApiResponse = await response.json();

        if (data.success) {
          setReviews(data.reviews || []);
          setFilteredReviews(data.reviews || []);
        } else {
          setError("Failed to fetch reviews");
        }
      } catch (err) {
        console.error(err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    let filtered = reviews;

    if (selectedRating !== "all") {
      filtered = filtered.filter(
        (review) => review.rating === parseInt(selectedRating)
      );
    }

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

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));

  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="w-full p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-200 rounded-full animate-spin mx-auto" style={{ borderTopColor: '#3b82f6' }}></div>
          <p className="text-gray-600 mt-3 text-sm animate-pulse">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-4 overflow-x-auto bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/20 min-h-screen p-4">
      {/* Compact Header */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Patient Reviews</h1>
              <p className="text-xs text-gray-500 mt-0.5">Monitor and manage feedback</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Compact Stats Grid */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-600 font-medium">Total</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <p className="text-xs text-gray-600 font-medium">Average</p>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-bold text-gray-900">{getAverageRating()}</p>
              <div className="flex gap-0.5">
                {renderStars(Math.round(parseFloat(getAverageRating())))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-gray-600 font-medium">5★</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats[5] || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-3 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <p className="text-xs text-gray-600 font-medium">This Month</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {reviews.filter((r) => {
                const d = new Date(r.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      )}

      {/* Charts Section - Compact Grid */}
      {reviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trend Graph - Ratings Over Time */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Ratings Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#6b7280" 
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Rating', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '11px' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280" 
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Count', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '11px' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgRating" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRating)"
                  name="Avg Rating"
                  strokeWidth={2}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="reviewCount" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorCount)"
                  name="Reviews"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sentiment Distribution - Donut Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Sentiment Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => (percent && percent > 0 && name) ? `${String(name).split(' ')[0]}: ${Math.round(percent * 100)}%` : ''}
                  labelLine={true}
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
                    fontSize: '12px'
                  }}
                  formatter={(value, name, props) => [
                    `${value} (${props?.payload?.percentage ?? 0}%)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
              {sentimentData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name.split(' ')[0]}</span>
                  <span className="font-semibold text-gray-900">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compact Search + Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-blue-600" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-gray-900 w-full pl-9 pr-3 py-2 border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="text-gray-900 border border-blue-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-700 font-medium text-sm">No reviews found</p>
          <p className="text-gray-500 text-xs mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {paginatedReviews.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-lg shadow-sm border border-blue-100 p-3 hover:shadow-md transition-all duration-200 hover:border-blue-300 hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              {/* User name and rating */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="font-semibold text-gray-800 truncate text-xs">
                    {r.userId?.name || "Anonymous"}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <div className="flex gap-0.5">
                    {renderStars(r.rating)}
                  </div>
                  <span className="ml-1 text-xs font-bold text-blue-600">
                    {r.rating}
                  </span>
                </div>
              </div>
              
              {/* Date */}
              <div className="flex items-center gap-1.5 mb-2.5">
                <Calendar className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">
                  {formatDate(r.createdAt)}
                </p>
              </div>

              {/* Read Comment button */}
              <div className="mt-auto">
                {r.comment ? (
                  <button
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-medium py-1.5 px-2.5 rounded-md hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-sm hover:shadow"
                    onClick={() => {
                      setModalComment(r.comment || "");
                      setShowModal(true);
                    }}
                  >
                    View Comment
                  </button>
                ) : (
                  <div className="w-full bg-gray-50 text-gray-400 text-xs font-medium py-1.5 px-2.5 rounded-md text-center border border-gray-100">
                    No comment
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Compact Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            <button
              className="px-3 py-1.5 rounded-md border border-blue-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 text-sm font-medium"
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
                  className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200 ${
                    currentPage === pageNum 
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-white text-gray-700 border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                  }`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              className="px-3 py-1.5 rounded-md border border-blue-200 bg-white text-gray-700 disabled:opacity-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-200 text-sm font-medium"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        
        {/* Compact Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full border border-blue-100">
              <div className="p-4 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center shadow-sm">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Patient Comment</h3>
                  </div>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="text-gray-700 break-words whitespace-pre-line max-h-96 overflow-y-auto leading-relaxed bg-gray-50 rounded-md p-3 border border-gray-200 text-sm">
                  {modalComment}
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}

DoctorReviews.getLayout = function PageLayout(page: React.ReactNode) {
  return <DoctorLayout>{page}</DoctorLayout>;
};

const Protected: NextPageWithLayout = withDoctorAuth(DoctorReviews);
Protected.getLayout = DoctorReviews.getLayout;
export default Protected;
