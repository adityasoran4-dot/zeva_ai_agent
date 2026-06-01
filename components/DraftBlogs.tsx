import React, { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { 
  Search, 
  Edit2, 
  Trash2, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Edit3, 
  Save, 
  AlertCircle,
  Filter,
  Calendar,
  Clock,
  Settings,
  Sparkles,
  Eye,
  Copy,
  TrendingUp,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  Tag,
  Hash,
  Link as LinkIcon,
  Archive
} from "lucide-react";

type Blog = {
  _id: string;
  title: string;
  content: string;
  paramlink: string;
  createdAt: string;
  updatedAt?: string;
  status?: "draft" | "published" | "scheduled" | "archived";
  scheduledDate?: string;
};

interface DraftBlogsProps {
  tokenKey: "clinicToken" | "doctorToken" | "agentToken";
  permissions?: {
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
  searchQuery?: string;
  viewMode?: 'grid' | 'list';
  onEditBlog?: (blogId: string, type: 'published' | 'drafts') => void;
}

const ITEMS_PER_PAGE = 10;
const PRIMARY_COLOR = "#2D9AA5";

const DraftBlogs: React.FC<DraftBlogsProps> = ({ 
  onEditBlog, 
  tokenKey,
  permissions = {
    canRead: true,
    canUpdate: true,
    canDelete: true,
  },
  searchQuery = "",
  viewMode = 'grid'
}) => {
  const [drafts, setDrafts] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editParamlink, setEditParamlink] = useState<string>("");
  const [editError, setEditError] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState<string>(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, title: string} | null>(null);
  
  // Filter and sort states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSearchSettings, setShowSearchSettings] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'scheduled' | 'archived'>('all');

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem(tokenKey);
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [tokenKey]);

  // Sync external searchQuery with local state
  useEffect(() => {
    setLocalSearchTerm(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    async function loadDrafts() {
      if (!permissions.canRead) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const draftRes = await axios.get("/api/blog/draft", {
          ...getAuthHeaders(),
          validateStatus: (status) => status === 200 || status === 403,
        });

        if (draftRes.status === 403) {
          setDrafts([]);
          return;
        }

        const draftsData = draftRes.data?.drafts || draftRes.data || [];
        setDrafts(Array.isArray(draftsData) ? draftsData : []);
      } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
          setError(e.message || "Failed to load drafts");
        } else {
          setError("Failed to load drafts");
        }
      } finally {
        setLoading(false);
      }
    }
    loadDrafts();
  }, [tokenKey, getAuthHeaders, permissions.canRead]);

  // Combined search term (external + local)
  const effectiveSearchTerm = useMemo(() => {
    return localSearchTerm || searchQuery || "";
  }, [localSearchTerm, searchQuery]);

  // Filter and sort blogs
  const filteredAndSortedBlogs = useMemo(() => {
    let filtered = [...drafts];

    // Apply search filter
    if (effectiveSearchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        blog.paramlink.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
        (blog.content && blog.content.replace(/<[^>]+>/g, "").toLowerCase().includes(effectiveSearchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(blog => blog.status === statusFilter);
    }

    // Apply date filter
    const now = new Date();
    switch (dateFilter) {
      case "today":
        filtered = filtered.filter((blog) => {
          const blogDate = new Date(blog.createdAt);
          return blogDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (blog) => new Date(blog.createdAt) >= weekAgo
        );
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (blog) => new Date(blog.createdAt) >= monthAgo
        );
        break;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(
          (blog) => new Date(blog.createdAt) >= yearAgo
        );
        break;
      case "custom":
        if (customDateStart && customDateEnd) {
          const start = new Date(customDateStart);
          const end = new Date(customDateEnd);
          end.setHours(23, 59, 59, 999);
          filtered = filtered.filter(
            (blog) => {
              const blogDate = new Date(blog.createdAt);
              return blogDate >= start && blogDate <= end;
            }
          );
        }
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "title-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return filtered;
  }, [drafts, effectiveSearchTerm, dateFilter, customDateStart, customDateEnd, sortBy, statusFilter]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedBlogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedBlogs, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedBlogs.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearchTerm, dateFilter, customDateStart, customDateEnd, sortBy, statusFilter]);

  const slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  const handleEdit = (blog: Blog) => {
    setEditId(blog._id);
    setEditTitle(blog.title);
    setEditParamlink(blog.paramlink || "");
    setEditError("");
    setShowEditModal(true);
  };

  const handleSave = async (blog: Blog) => {
    if (!editTitle || !editParamlink) {
      setEditError("Title and paramlink are required");
      return;
    }
    setEditError("");
    try {
      await axios.put(
        `/api/blog/draft?id=${blog._id}`,
        { title: editTitle, paramlink: editParamlink, content: blog.content },
        getAuthHeaders()
      );
      setDrafts((prev) =>
        prev.map((b) =>
          b._id === blog._id ? { ...b, title: editTitle, paramlink: editParamlink } : b
        )
      );
      handleCancel();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.message?.includes("Paramlink already exists")) {
        setEditError("Paramlink already exists. Please choose another.");
      } else {
        setEditError("Failed to update draft");
      }
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setEditTitle("");
    setEditParamlink("");
    setEditError("");
    setShowEditModal(false);
  };

  const handleDelete = (blogId: string) => {
    const blog = drafts.find(b => b._id === blogId);
    const blogTitle = blog?.title || 'this draft';
    setDeleteTarget({ id: blogId, title: blogTitle });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      await axios.delete(`/api/blog/draft?id=${deleteTarget.id}`, getAuthHeaders());
      setDrafts(prev => prev.filter(x => x._id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete the draft. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleEditBlog = (blog: Blog) => {
    if (onEditBlog) {
      onEditBlog(blog._id, 'drafts');
    } else {
      // Fallback to old behavior if callback not provided
      const path = `/${tokenKey === "clinicToken" ? "clinic" : "doctor"}/BlogForm`;
      window.location.href = `${path}?draftId=${blog._id}`;
    }
  };

  const currentEditingBlog = useMemo(() => {
    return drafts.find((b) => b._id === editId);
  }, [drafts, editId]);

  // Don't render content if no read permission
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You do not have permission to view drafts.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator to request access to the Blogs module.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drafts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg">
          <p className="font-semibold">Error loading drafts</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const BlogCard = ({ blog }: { blog: Blog }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    };

    const getStatusConfig = (status?: string) => {
      switch (status) {
        case 'scheduled':
          return {
            icon: Calendar,
            bg: 'bg-gradient-to-r from-purple-100 to-pink-100',
            text: 'text-purple-700',
            border: 'border-purple-200',
            glow: 'shadow-purple-200/50'
          };
        case 'archived':
          return {
            icon: Archive,
            bg: 'bg-gradient-to-r from-slate-100 to-gray-100',
            text: 'text-slate-700',
            border: 'border-slate-200',
            glow: 'shadow-slate-200/50'
          };
        default:
          return {
            icon: FileText,
            bg: 'bg-gradient-to-r from-amber-100 to-orange-100',
            text: 'text-amber-700',
            border: 'border-amber-200',
            glow: 'shadow-amber-200/50'
          };
      }
    };

    const statusConfig = getStatusConfig(blog.status);

    if (viewMode === 'list') {
      return (
        <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 rounded-2xl border border-amber-200/60 p-6 hover:shadow-xl hover:shadow-amber-200/20 hover:border-amber-300/80 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 via-transparent to-orange-50/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4 mb-3">
                {/* Icon with gradient background */}
                <div className={`p-3 rounded-xl ${statusConfig.bg} ${statusConfig.border} border-2 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {React.createElement(statusConfig.icon, { className: `w-5 h-5 ${statusConfig.text}` })}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-amber-700 transition-colors">
                    {blog.title || 'Untitled Draft'}
                  </h3>
                  
                  {/* Metadata with icons */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded-lg border border-slate-200/60">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-medium">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {blog.updatedAt && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded-lg border border-slate-200/60">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="font-medium">
                          Updated {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    {blog.status && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusConfig.bg} ${statusConfig.border} ${statusConfig.text}`}>
                        {React.createElement(statusConfig.icon, { className: "w-3.5 h-3.5" })}
                        <span className="font-semibold capitalize">{blog.status}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* URL with copy button */}
                  {blog.paramlink && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60 group/link hover:bg-amber-50 hover:border-amber-300/60 transition-all">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-amber-600" />
                        <span className="text-xs text-slate-600 font-mono truncate max-w-[200px]">
                          {blog.paramlink}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(blog.paramlink)}
                        className="p-1.5 rounded-lg bg-white/60 hover:bg-amber-100 border border-slate-200/60 hover:border-amber-300/60 transition-all group/copy"
                        title="Copy URL"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/copy:text-amber-600" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons with modern design */}
            <div className="flex flex-wrap items-center gap-2">
              {permissions.canUpdate && (
                <>
                  <button
                    onClick={() => handleEdit(blog)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{ 
                      background: 'linear-gradient(135deg, #2D9AA5 0%, #267a83 100%)',
                      boxShadow: '0 4px 14px 0 rgba(45, 154, 165, 0.3)'
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Details</span>
                  </button>
                  <button
                    onClick={() => handleEditBlog(blog)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                </>
              )}

              {permissions.canDelete && (
                <button
                  onClick={() => handleDelete(blog._id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200/60 hover:border-red-300 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Grid view - completely redesigned
    return (
      <div className="group relative bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 rounded-2xl border border-amber-200/60 p-6 hover:shadow-2xl hover:shadow-amber-200/30 hover:border-amber-300/80 transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm overflow-hidden">
        {/* Animated gradient background on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/0 via-orange-100/0 to-yellow-100/0 group-hover:from-amber-100/20 group-hover:via-orange-100/20 group-hover:to-yellow-100/20 transition-all duration-500 rounded-2xl" />
        
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex flex-col h-full">
          {/* Header with status badge */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${statusConfig.bg} ${statusConfig.border} border-2 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
              {React.createElement(statusConfig.icon, { className: `w-5 h-5 ${statusConfig.text}` })}
            </div>
            {blog.status && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border} shadow-sm`}>
                {blog.status}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 mb-4">
            <h3 className="font-bold text-slate-900 text-lg mb-3 line-clamp-2 group-hover:text-amber-700 transition-colors leading-tight">
              {blog.title || 'Untitled Draft'}
            </h3>
            
            {/* Metadata with icons */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="p-1.5 rounded-lg bg-white/60 border border-slate-200/60">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="font-medium">
                  {new Date(blog.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {blog.updatedAt && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="p-1.5 rounded-lg bg-white/60 border border-slate-200/60">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="font-medium">
                    Updated {new Date(blog.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
            
            {/* URL with copy */}
            {blog.paramlink && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200/60 group/link hover:bg-amber-50 hover:border-amber-300/60 transition-all">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-amber-600 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-mono truncate">
                    {blog.paramlink}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(blog.paramlink)}
                  className="p-1.5 rounded-lg bg-white/60 hover:bg-amber-100 border border-slate-200/60 hover:border-amber-300/60 transition-all group/copy"
                  title="Copy URL"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/copy:text-amber-600" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-amber-200/60">
            {permissions.canUpdate && (
              <>
                <button
                  onClick={() => handleEditBlog(blog)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/60 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleEdit(blog)}
                  className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(135deg, #2D9AA5 0%, #267a83 100%)',
                    boxShadow: '0 4px 14px 0 rgba(45, 154, 165, 0.3)'
                  }}
                  title="Edit Details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}

            {permissions.canDelete && (
              <button
                onClick={() => handleDelete(blog._id)}
                className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200/60 hover:border-red-300 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-50/30 via-orange-50/20 to-yellow-50/10">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Modern Stats Cards with Icons and Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {/* Total Drafts Card */}
          <div className="group relative bg-gradient-to-br from-white via-amber-50/50 to-orange-50/30 rounded-2xl border border-amber-200/60 p-5 lg:p-6 hover:shadow-xl hover:shadow-amber-200/30 hover:border-amber-300/80 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-200/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200/60 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1 uppercase tracking-wide">Total Drafts</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                  {drafts.length}
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* Filtered Card */}
          <div className="group relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-200/60 p-5 lg:p-6 hover:shadow-xl hover:shadow-blue-200/30 hover:border-blue-300/80 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-200/60 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1 uppercase tracking-wide">Filtered</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  {filteredAndSortedBlogs.length}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* Showing Card */}
          <div className="group relative bg-gradient-to-br from-white via-purple-50/50 to-pink-50/30 rounded-2xl border border-purple-200/60 p-5 lg:p-6 hover:shadow-xl hover:shadow-purple-200/30 hover:border-purple-300/80 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200/60 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Layers className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1 uppercase tracking-wide">Showing</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                  {paginatedData.length}
                </p>
              </div>
              <Eye className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
        </div>

        {/* Modern Search and Filter Bar */}
        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-amber-500 transition-colors z-10">
              <Search className="w-full h-full" />
            </div>
            <input
              type="text"
              placeholder="Search drafts by title, content, or URL..."
              value={effectiveSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="text-slate-700 w-full pl-12 pr-12 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-amber-200/60 rounded-2xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400/80 transition-all duration-200 placeholder:text-slate-400 hover:border-amber-300/80 shadow-sm hover:shadow-md"
            />
            {effectiveSearchTerm && (
              <button
                onClick={() => setLocalSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className={`relative px-4 sm:px-5 py-3.5 border-2 rounded-2xl transition-all duration-200 flex items-center gap-2 font-semibold text-sm hover:scale-105 active:scale-95 ${
                (dateFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest')
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300/80 text-blue-700 shadow-md shadow-blue-200/30'
                  : 'bg-white/80 backdrop-blur-sm border-amber-200/60 text-slate-700 hover:bg-amber-50/50 hover:border-amber-300/80 hover:shadow-md'
              }`}
            >
              <Filter className={`w-5 h-5 ${(dateFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest') ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Filters</span>
              {(dateFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'newest') && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSearchSettings(!showSearchSettings)}
              className="px-4 sm:px-5 py-3.5 bg-white/80 backdrop-blur-sm border-2 border-amber-200/60 rounded-2xl text-slate-700 hover:bg-amber-50/50 hover:border-amber-300/80 hover:shadow-md transition-all duration-200 flex items-center gap-2 font-semibold text-sm hover:scale-105 active:scale-95"
            >
              <Settings className="w-5 h-5 text-slate-500" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Modern Filter Modal */}
        {showFilterModal && (
          <div className="mb-6 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 rounded-2xl shadow-xl border-2 border-blue-200/60 p-6 lg:p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-200/60">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Filter & Sort</h3>
                  <p className="text-xs text-slate-500">Refine your draft search</p>
                </div>
              </div>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Tag className="w-4 h-4 text-blue-500" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400/80 transition-all duration-200 text-slate-700 font-medium hover:border-slate-300/80"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400/80 transition-all duration-200 text-slate-700 font-medium hover:border-slate-300/80"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ArrowUpRight className="w-4 h-4 text-amber-500" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-400/80 transition-all duration-200 text-slate-700 font-medium hover:border-slate-300/80"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title-asc">Title (A-Z)</option>
                  <option value="title-desc">Title (Z-A)</option>
                </select>
              </div>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/60 rounded-xl border border-slate-200/60">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400/80 transition-all duration-200 text-slate-700 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-400/80 transition-all duration-200 text-slate-700 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Clear Filters */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setDateFilter('all');
                  setStatusFilter('all');
                  setSortBy('newest');
                  setCustomDateStart('');
                  setCustomDateEnd('');
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white/80 hover:bg-red-50 hover:text-red-600 border-2 border-slate-200/60 hover:border-red-300/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Modern Search Settings */}
        {showSearchSettings && (
          <div className="mb-6 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 rounded-2xl shadow-xl border-2 border-amber-200/60 p-6 lg:p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-amber-200/60">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Search Settings</h3>
                  <p className="text-xs text-slate-500">Configure your search preferences</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchSettings(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/60 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-3 mb-2">
                  <Search className="w-5 h-5 text-blue-500" />
                  <label className="text-sm font-semibold text-slate-700">
                    Search in: Title, Content, URL
                  </label>
                </div>
                <p className="text-sm text-slate-600 ml-8">
                  Your search will look through blog titles, content (HTML stripped), and URL slugs.
                </p>
              </div>
              <div className="p-4 bg-white/60 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-3 mb-2">
                  <Hash className="w-5 h-5 text-purple-500" />
                  <label className="text-sm font-semibold text-slate-700">
                    Case Sensitive: Off
                  </label>
                </div>
                <p className="text-sm text-slate-600 ml-8">
                  Searches are case-insensitive for better results.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {paginatedData.length === 0 ? (
          <div className="text-center py-16 lg:py-20 bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 rounded-2xl shadow-lg border-2 border-amber-200/60 backdrop-blur-sm">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-200/40 to-orange-200/40 rounded-full blur-2xl opacity-50 animate-pulse" />
              <div className="relative p-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border-2 border-amber-200/60">
                <FileText className="w-16 h-16 text-amber-600 mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {effectiveSearchTerm || dateFilter !== 'all' || statusFilter !== 'all'
                ? 'No drafts match your search'
                : 'No drafts yet'}
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {effectiveSearchTerm || dateFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms to find what you\'re looking for.'
                : 'Start creating your first draft to get started with your blog journey!'}
            </p>
            {(effectiveSearchTerm || dateFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setLocalSearchTerm('');
                  setDateFilter('all');
                  setStatusFilter('all');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'
              : 'space-y-4 lg:space-y-6'
            }>
              {paginatedData.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>

            {/* Modern Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8 lg:mt-10">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-xl border-2 border-slate-200/60 bg-white/80 backdrop-blur-sm hover:bg-amber-50 hover:border-amber-300/80 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/80 disabled:hover:border-slate-200/60 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>

                <div className="px-6 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200/60 shadow-sm">
                  <span className="text-sm font-bold text-slate-700">
                    Page <span className="text-amber-700">{currentPage}</span> of <span className="text-amber-700">{totalPages}</span>
                  </span>
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-xl border-2 border-slate-200/60 bg-white/80 backdrop-blur-sm hover:bg-amber-50 hover:border-amber-300/80 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/80 disabled:hover:border-slate-200/60 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && currentEditingBlog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-gray-100">
            <div className="relative p-6 border-b border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: PRIMARY_COLOR }}></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: PRIMARY_COLOR }}>
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Edit Draft</h3>
                    <p className="text-sm text-gray-500">Update your draft details</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-xl flex items-center justify-center transition-all duration-200 group"
                >
                  <X className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Draft Title
                </label>
                <input
                  className="text-black w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white focus:ring-teal-500 focus:border-teal-500"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter your draft title..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Draft URL Slug
                </label>
                <input
                  className="text-black w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-white focus:ring-teal-500 focus:border-teal-500"
                  value={editParamlink}
                  onChange={(e) => setEditParamlink(slugify(e.target.value))}
                  placeholder="draft-url-slug"
                />
                {editError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mt-2 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4" />
                    {editError}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => handleSave(currentEditingBlog)}
                className="flex-1 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                <Save className="w-5 h-5" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-100">
            <div className="relative p-6 border-b border-gray-100">
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Draft</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={cancelDelete}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-gray-900 font-semibold mb-2">
                  Are you sure you want to delete this draft?
                </p>
                <p className="text-gray-600 mb-4">
                  &quot;<span className="font-medium">{deleteTarget.title}</span>&quot;
                </p>
                <p className="text-sm text-gray-500">
                  This action cannot be undone and the draft will be permanently removed.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Delete Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftBlogs;

