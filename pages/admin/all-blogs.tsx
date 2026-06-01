import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/router";
import { createPortal } from "react-dom";
import withAdminAuth from "../../components/withAdminAuth";
import AdminLayout from "../../components/AdminLayout";
import type { NextPageWithLayout } from "../_app";
import { useAgentPermissions } from "../../hooks/useAgentPermissions";
import { toast } from "react-hot-toast";
import {
  DocumentTextIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

// Blog interface
interface Blog {
  _id: string;
  title: string;
  content?: string;
  status: string;
  paramlink: string;
  postedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: string;
  likes: Array<{ _id: string; user: string }>;
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      name: string;
      email: string;
    };
    username: string;
    text: string;
    createdAt: string;
    replies?: Array<{
      _id: string;
      user: string;
      username: string;
      text: string;
      createdAt: string;
    }>;
  }>;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  image?: string;
  youtubeUrl?: string;
}


const AdminBlogs = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReadMoreModal, setShowReadMoreModal] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const blogsPerPage = 6;

  // Toast helper function using react-hot-toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast(message, { icon: '⚠️' });
        break;
      default:
        toast(message);
    }
  }, []);

  // Check if user is an admin or agent
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      if (isAgentRoute && agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_all_blogs" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  // MODIFIED: Memoize processBlogs to prevent unnecessary re-renders and dependency changes
  const processBlogs = useCallback((blogs: Blog[]) => {
    return blogs.map(blog => ({
      ...blog,
      likesCount: blog.likes?.length || 0,
      commentsCount: blog.comments?.length || 0
    }));
  }, []);

  const fetchBlogs = useCallback(async () => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
    const token = adminToken || agentToken;

    if (!token) {
      console.error("No token found");
      setLoading(false);
      showToast('No authentication token found', 'error');
      return;
    }

    // MODIFIED: Prevent multiple simultaneous calls
    setLoading(true);
    try {
      const res = await axios.get<{ blogs: Blog[]; pagination?: any }>("/api/admin/get-blogs", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: blogsPerPage }
      });
      const processedBlogs = processBlogs(res.data.blogs);
      setBlogs(processedBlogs);
      setFilteredBlogs(processedBlogs);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages);
        setTotalBlogs(res.data.pagination.totalBlogs);
      }
    } catch (err: any) {
      console.error("Error fetching blogs:", err);
      showToast('Failed to load blogs', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, processBlogs]);

  // MODIFIED: Use ref to prevent multiple simultaneous calls - prevents loader from appearing multiple times
  const fetchingRef = React.useRef(false);
  
  useEffect(() => {
    // Don't fetch if already fetching
    if (fetchingRef.current) return;
    
    if (isAdmin || !isAgent || !permissionsLoading) {
      fetchingRef.current = true;
      fetchBlogs().finally(() => {
        fetchingRef.current = false;
      });
    }
  }, [isAdmin, isAgent, permissionsLoading, currentPage, fetchBlogs]);

  // MODIFIED: Hide duplicate toaster containers - ensure only one toaster shows
  // Optimized to run less frequently to avoid performance issues
  useEffect(() => {
    let processedContainers = new Set<HTMLElement>();
    
    const hideDuplicateToasters = () => {
      // Find all react-hot-toast containers
      const toasterContainers: HTMLElement[] = [];
      const allDivs = Array.from(document.querySelectorAll('body > div'));
      
      allDivs.forEach((div) => {
        const el = div as HTMLElement;
        // Check if this is a react-hot-toast container
        const hasToastContent = 
          el.querySelector('[class*="react-hot-toast"]') !== null ||
          Array.from(el.children).some(child => {
            const childEl = child as HTMLElement;
            return childEl.getAttribute('class')?.includes('react-hot-toast') ||
                   childEl.querySelector('[class*="react-hot-toast"]') !== null;
          }) ||
          el.getAttribute('class')?.includes('react-hot-toast');
        
        if (hasToastContent && el.offsetParent !== null && !processedContainers.has(el)) {
          toasterContainers.push(el);
          processedContainers.add(el);
        }
      });

      // If we have more than one visible toaster, keep only the first one and hide the rest
      if (toasterContainers.length > 1) {
        // Keep the first one (from withAgentAuth wrapper), hide all others
        for (let i = 1; i < toasterContainers.length; i++) {
          const container = toasterContainers[i];
          container.style.display = 'none';
          container.style.visibility = 'hidden';
        }
      }
    };

    // Run after a short delay to allow DOM to settle
    const timeout = setTimeout(hideDuplicateToasters, 200);
    
    // Set up observer with throttling to avoid excessive calls
    let observerTimeout: NodeJS.Timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(hideDuplicateToasters, 500); // Throttle to max once per 500ms
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: false // Only watch direct children, not entire subtree
    });
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(observerTimeout);
      observer.disconnect();
      processedContainers.clear();
    };
  }, []);


  // Search functionality
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);

    if (term.trim() === "") {
      setFilteredBlogs(blogs);
    } else {
      const filtered = blogs.filter(blog =>
        blog.title.toLowerCase().includes(term.toLowerCase()) ||
        (blog.postedBy?.name && blog.postedBy.name.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredBlogs(filtered);
      if (filtered.length === 0) {
        showToast('No blogs found matching your search', 'info');
      }
    }
  };

  const deleteBlog = async (id: string) => {
    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canDelete && !agentPermissions.canAll) {
      showToast("You do not have permission to delete blogs", 'error');
      setShowDeleteModal(false);
      setSelectedBlog(null);
      return;
    }

    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
    const token = adminToken || agentToken;

    if (!token) {
      showToast("No token found. Please login again.", 'error');
      setShowDeleteModal(false);
      setSelectedBlog(null);
      return;
    }

    try {
      await axios.delete(`/api/admin/deleteBlog/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedBlogs = blogs.filter((b) => b._id !== id);
      setBlogs(updatedBlogs);
      const updatedFilteredBlogs = filteredBlogs.filter((b) => b._id !== id);
      setFilteredBlogs(updatedFilteredBlogs);
      showToast('Blog deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedBlog(null);
    } catch (err: any) {
      console.error("Error deleting blog:", err);
      showToast(err.response?.data?.message || "Failed to delete blog", 'error');
    }
  };

  const handleDeleteClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowDeleteModal(true);
  };

  const handleReadMoreClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setShowReadMoreModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowReadMoreModal(false);
    setSelectedBlog(null);
  };

  // Pagination logic - use backend pagination
  const currentBlogs = filteredBlogs;


  // Helper function to extract text from HTML
  const extractTextFromHTML = (html: string, maxLength: number = 150) => {
    if (typeof window === 'undefined') return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // Helper to extract ALL images from HTML content
  const getAllImagesFromContent = (html?: string): string[] => {
    if (!html || typeof window === 'undefined') return [];
    const div = document.createElement('div');
    div.innerHTML = html;
    const imgs = div.querySelectorAll('img');
    const imageUrls: string[] = [];
    imgs.forEach(img => {
      if (img.src) {
        imageUrls.push(img.src);
      }
    });
    return imageUrls;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* MODIFIED: Removed Toaster from here - withAgentAuth already provides one with position="top-right" */}
      
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-800 p-2 rounded-lg">
                <DocumentTextIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-blue-800">Published Blogs</h1>
                <p className="text-xs text-blue-600">Manage and view all blog posts</p>
              </div>
            </div>
          
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-700" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800"
            />
          </div>
        </div>

        {/* Blog Count */}
        <div className="text-xs text-blue-800">
          Showing {filteredBlogs.length === 0 ? 0 : (currentPage - 1) * blogsPerPage + 1}-{Math.min(currentPage * blogsPerPage, totalBlogs)} of {totalBlogs} blogs
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-700">Loading blogs...</p>
            </div>
          </div>
        ) : (
          <>
            {/* No Results */}
            {filteredBlogs.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-700 mb-2">No blogs found</p>
                {searchTerm && (
                  <button
                    onClick={() => handleSearch("")}
                    className="text-xs text-gray-700 hover:text-gray-900 underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Blog Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {currentBlogs.map((blog) => {
                const contentImages = getAllImagesFromContent(blog.content);
                const allImages = blog.image ? [blog.image, ...contentImages] : contentImages;
                
                return (
                  <div
                    key={blog._id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Blog Images Gallery */}
                    {allImages.length > 0 ? (
                      <div className="w-full min-h-48 bg-gray-100 relative flex items-center justify-center">
                        {allImages.length === 1 ? (
                          <div className="relative w-full h-48 flex items-center justify-center">
                            <Image
                              src={allImages[0]}
                              alt={blog.title}
                              width={400}
                              height={200}
                              className="object-contain max-w-full max-h-48 w-auto h-auto"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 w-full h-48 gap-1 p-1">
                            {allImages.slice(0, 4).map((img, idx) => (
                              <div key={idx} className="relative bg-white flex items-center justify-center overflow-hidden">
                                <Image
                                  src={img}
                                  alt={`${blog.title} - Image ${idx + 1}`}
                                  width={200}
                                  height={200}
                                  className="object-contain max-w-full max-h-full w-auto h-auto"
                                  sizes="(max-width: 768px) 50vw, 33vw"
                                />
                                {idx === 3 && allImages.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                      +{allImages.length - 4} more
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : blog.youtubeUrl ? (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white font-bold text-lg">▶</span>
                          </div>
                          <p className="text-xs text-gray-700">YouTube Video</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Blog Details */}
                    <div className="p-4">
                      <h2 className="text-sm font-semibold text-blue-800 mb-2 line-clamp-2">
                        {blog.title}
                      </h2>

                      {blog.content && (
                        <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                          {extractTextFromHTML(blog.content, 100)}
                        </p>
                      )}

                      <div className="text-xs text-gray-600 mb-3 space-y-1">
                        <p>By: {blog.postedBy?.name || "Unknown"}</p>
                        <p>{new Date(blog.createdAt).toLocaleDateString()}</p>
                        <p>Likes: {blog.likesCount ?? 0} | Comments: {blog.commentsCount ?? 0}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleReadMoreClick(blog)}
                          className="flex-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <EyeIcon className="w-3 h-3" />
                          View
                        </button>
                        {(() => {
                          const canDelete = isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canDelete || agentPermissions.canAll));
                          
                          if (canDelete) {
                            return (
                              <button
                                onClick={() => handleDeleteClick(blog)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                              >
                                <TrashIcon className="w-3 h-3" />
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalBlogs > blogsPerPage && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Previous
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
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedBlog && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
            <div className="bg-white rounded-lg shadow-xl p-5 max-w-sm w-full">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Delete Blog?
                </h3>
                <p className="text-xs text-gray-700 mb-3">
                  This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    &quot;{selectedBlog.title}&quot;
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeModals}
                  className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteBlog(selectedBlog._id)}
                  className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Read More Modal with All Images */}
        {showReadMoreModal && selectedBlog && typeof window !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[99999] p-4" style={{ zIndex: 99999 }}>
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 pr-4 flex-1 min-w-0 line-clamp-2 break-words">
                  {selectedBlog.title}
                </h3>
                <button
                  onClick={closeModals}
                  className="text-gray-700 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {/* All Blog Images Gallery */}
                {(() => {
                  const contentImages = getAllImagesFromContent(selectedBlog.content);
                  const allImages = selectedBlog.image ? [selectedBlog.image, ...contentImages] : contentImages;
                  
                  if (allImages.length > 0) {
                    return (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Images ({allImages.length})</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {allImages.map((img, idx) => (
                            <div key={idx} className="relative min-h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center p-2">
                              <Image
                                src={img}
                                alt={`${selectedBlog.title} - Image ${idx + 1}`}
                                width={300}
                                height={200}
                                className="object-contain max-w-full max-h-48 w-auto h-auto rounded-lg"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  if (selectedBlog.youtubeUrl) {
                    return (
                      <div className="mb-4">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <iframe
                            className="w-full h-full"
                            src={selectedBlog.youtubeUrl.replace('watch?v=', 'embed/')}
                            title="YouTube Video"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}

                {/* Blog Content */}
                {selectedBlog.content && (
                  <div
                    className="text-sm text-gray-700 prose prose-sm max-w-none mb-4
                      [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2
                      [&_video]:max-w-full [&_video]:h-auto [&_video]:rounded-lg [&_video]:my-2
                      [&_iframe]:max-w-full [&_iframe]:h-auto [&_iframe]:rounded-lg [&_iframe]:my-2"
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                  />
                )}

                {/* Meta Info */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Posted by: {selectedBlog.postedBy?.name || "Unknown"} ({selectedBlog.role})</p>
                    <p>{new Date(selectedBlog.createdAt).toLocaleString()}</p>
                    <p>Likes: {selectedBlog.likesCount ?? 0} | Comments: {selectedBlog.commentsCount ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

AdminBlogs.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AdminBlogs);
ProtectedDashboard.getLayout = AdminBlogs.getLayout;

export default ProtectedDashboard;
