import React from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import parse from "html-react-parser";
import { Hash } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";

type Blog = {
  _id: string;
  title: string;
  content: string;
  postedBy: { name: string };
  role: string;
  createdAt: string;
  image?: string;
  likes?: string[];       // ✅ needed for your includes check
  likesCount?: number;
  commentsCount?: number;
  liked?: boolean;
  paramlink?: string;
  slugLocked?: boolean;
};

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const blogsPerPage = 15;

  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Helper: convert text to URL-friendly slug
  const textToSlug = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces -> hyphen
      .replace(/-+/g, "-"); // collapse multiple hyphens
  };

  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );

  // Action retry refs
  const pendingLikeBlogId = useRef<string | null>(null);
  const pendingComment = useRef<{ blogId: string; text: string } | null>(null);

  // Track if page has been initialized
  const hasInitialized = useRef(false);

  // On first load, clear URL and start fresh
  useEffect(() => {
    if (!router.isReady) return;
    if (hasInitialized.current) return;

    console.log("🚀 Initial load - starting fresh (clearing URL parameters)");
    
    // Clear URL parameters on refresh
    if (Object.keys(router.query).length > 0) {
      console.log("🧹 Clearing URL parameters");
      router.replace(router.pathname, undefined, { shallow: true });
    }
    
    // Reset search to empty
    setSearchTerm("");
    hasInitialized.current = true;
  }, [router.isReady]);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch("/api/blog/getAllBlogs", {
          headers: {
            ...(isAuthenticated && localStorage.getItem("token") && {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            }),
          },
        });

        const json = await res.json();
        if (res.ok && json.success) {
          let blogData = json.blogs || json.data;

          if (isAuthenticated && user?._id) {
            blogData = blogData.map((b: Blog): Blog => ({
              ...b,
              liked: b.likes?.includes(user._id) ?? false,
            }));
          } else {
            blogData = blogData.map((b: Blog): Blog => ({ ...b, liked: false }));
          }

          setBlogs(blogData);
          setFilteredBlogs(blogData);
        } else {
          setError(json.error || "Failed to fetch blogs");
        }
      } catch {
        setError("Network error");
      }
    }
    fetchBlogs();
  }, [isAuthenticated, user?._id]); // 👈 depend on user._id too

  // State for search input (separate from actual search term used for filtering)
  const [searchInput, setSearchInput] = useState<string>("");

  // Apply search and sorting - only when search button is clicked or sort changes
  const applySearchAndSort = () => {
    let filtered = blogs;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = blogs.filter((blog) =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.postedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === "popular") {
      filtered = [...filtered].sort((a, b) => {
        const aPopularity = (a.likesCount || 0) + (a.commentsCount || 0);
        const bPopularity = (b.likesCount || 0) + (b.commentsCount || 0);
        return bPopularity - aPopularity;
      });
    } else {
      // Sort by latest (default)
      filtered = [...filtered].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    setFilteredBlogs(filtered);
    // Reset to first page when search or sort changes
    setCurrentPage(1);
  };

  // Apply search when searchTerm or sortBy changes (triggered by button click or sort change)
  useEffect(() => {
    applySearchAndSort();
  }, [searchTerm, blogs, sortBy]);

  // Handle search button click
  const handleSearchSubmit = () => {
    console.log("🔘 Search button clicked!");
    console.log("📝 Current search input:", searchInput);
    
    // Update search term which triggers filtering
    setSearchTerm(searchInput);
    
    // Update URL with search term
    const params = new URLSearchParams();
    if (searchInput.trim()) {
      params.set("search", textToSlug(searchInput.trim()));
    }
    const newUrl = params.toString()
      ? `${router.pathname}?${params.toString()}`
      : router.pathname;
    router.replace(newUrl, undefined, { shallow: true });
  };

  // Retry pending actions after login
  useEffect(() => {
    if (isAuthenticated) {
      if (pendingLikeBlogId.current) {
        handleLike(pendingLikeBlogId.current);
        pendingLikeBlogId.current = null;
      }
      if (pendingComment.current) {
        handleComment(
          pendingComment.current.blogId,
          pendingComment.current.text
        );
        pendingComment.current = null;
      }
    }
  }, [isAuthenticated]);

  const handleLike = async (blogId: string) => {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      pendingLikeBlogId.current = blogId;
      return;
    }

    try {
      const res = await fetch("/api/blog/likeBlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ blogId }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === blogId
              ? {
                ...blog,
                likesCount: json.likesCount,
                liked: json.liked,
              }
              : blog
          )
        );
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleComment = async (blogId: string, text: string) => {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      pendingComment.current = { blogId, text };
      return;
    }

    try {
      const res = await fetch("/api/blog/commentBlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ blogId, text }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setBlogs((prev) =>
          prev.map((blog) =>
            blog._id === blogId
              ? { ...blog, commentsCount: json.commentsCount }
              : blog
          )
        );
      } else {
        console.error("Failed to post comment:", json.error);
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchInput("");
    setCurrentPage(1);
    // Clear URL search parameter
    if (router.isReady) {
      router.replace(router.pathname, undefined, { shallow: true });
    }
  };

  // Helper: create SEO-friendly slug from blog title with full ID
  // Format: blog-title-abc12345def67890 (title slug + full 24-char ID)
  const createBlogSlug = (blog: Blog): string => {
    // Use database paramlink if available and locked, otherwise generate from title
    if (blog.paramlink && blog.slugLocked) {
      return blog.paramlink;
    }
    
    // Fallback: generate slug from title and ID
    const blogTitle = blog.title || '';
    const blogId = blog._id || '';
    if (!blogTitle) return blogId; // Fallback to ID if no title
    
    const titleSlug = blogTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // spaces -> hyphen
      .replace(/-+/g, "-") // collapse multiple hyphens
      .substring(0, 60); // limit length for SEO (leaving room for ID)
    
    // Append full ID for direct database lookup (optimized approach)
    return `${titleSlug}-${blogId}`;
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const startIndex = (currentPage - 1) * blogsPerPage;
  const endIndex = startIndex + blogsPerPage;
  const currentBlogs = filteredBlogs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) return <p>Error: {error}</p>;

  // Helper function to extract only image URLs from HTML content (excluding videos)
  const extractImageOnly = (htmlContent: string): string | null => {
    // Match img tags that are not YouTube videos or Drive videos
    const imgRegex = /<img[^>]+src="([^">]+)"/gi;
    let match;

    while ((match = imgRegex.exec(htmlContent)) !== null) {
      const src = match[1];
      // Skip YouTube thumbnails, Drive video previews, and any video-related content
      if (!src.includes('youtube.com') &&
        !src.includes('youtu.be') &&
        !src.includes('drive.google.com') &&
        !src.includes('googleapis.com') &&
        !src.includes('ytimg.com') &&
        !src.includes('video')) {
        return src;
      }
    }
    return null;
  };

  // Helper function to remove all images, videos, and their containers from HTML content
  const removeImagesFromContent = (htmlContent: string): string => {
    let cleanContent = htmlContent;

    // Remove YouTube iframes and embed codes
    cleanContent = cleanContent.replace(/<iframe[^>]*youtube[^>]*>.*?<\/iframe>/gi, '');
    cleanContent = cleanContent.replace(/<iframe[^>]*youtu\.be[^>]*>.*?<\/iframe>/gi, '');

    // Remove video elements
    cleanContent = cleanContent.replace(/<video[^>]*>.*?<\/video>/gi, '');

    // Remove img tags and their common containers
    cleanContent = cleanContent.replace(/<figure[^>]*>.*?<\/figure>/gi, '');
    cleanContent = cleanContent.replace(/<div[^>]*class="[^"]*image[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanContent = cleanContent.replace(/<div[^>]*class="[^"]*video[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<img[^>]*>\s*<\/p>/gi, '');
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<iframe[^>]*>\s*<\/p>/gi, '');
    cleanContent = cleanContent.replace(/<img[^>]*>/gi, '');

    // Remove empty paragraphs that might be left behind
    cleanContent = cleanContent.replace(/<p[^>]*>\s*<\/p>/gi, '');
    cleanContent = cleanContent.replace(/<div[^>]*>\s*<\/div>/gi, '');

    return cleanContent;
  };

  // Extract hashtags/topics from content
  const extractTopics = (content: string | undefined): string[] => {
    if (!content || typeof content !== 'string') return [];
    // Remove HTML tags to get plain text, then extract hashtags
    const textContent = content.replace(/<[^>]*>/g, ' ');
    // Extract hashtags from content - matches #hashtag pattern (word characters only)
    const hashtagRegex = /#(\w+)/g;
    const matches = textContent.match(hashtagRegex);
    return matches ? [...new Set(matches.map(m => m.substring(1)))] : []; // Remove duplicates
  };

return (
  <>
    <Head>
      {/* Schema Markup - ZEVA Health Blog */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "ZEVA Health Blog",
            "url": "https://zeva360.com/blogs/viewBlogs",
            "description": "Read the latest health and wellness articles on ZEVA. Get expert insights on Ayurveda treatments, fitness, nutrition, mental health, and lifestyle tips to improve your overall well-being.",
            "publisher": {
              "@type": "Organization",
              "name": "ZEVA",
              "url": "https://zeva360.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://zeva360.com/logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://zeva360.com/blog"
            }
          })
        }}
      />
    </Head>
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          {/* Compact Heading */}
          <h1 className="text-xl mt-5 sm:text-2xl md:text-3xl font-bold text-center mb-3 sm:mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {searchTerm ? `Search Results` : sortBy === "popular" ? "Popular Articles" : "Latest Articles"}
          </h1>

          {searchTerm && (
            <div className="text-center mb-3 sm:mb-4">
              <span className="text-sm sm:text-base text-gray-600">
                for <span className="text-indigo-600 font-semibold">{searchTerm}</span>
              </span>
            </div>
          )}

          {/* Compact Search Section */}
          <div className="mb-4 sm:mb-6">
            <div className="relative max-w-4xl mx-auto mb-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full pl-10 sm:pl-11 pr-24 sm:pr-28 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                      handleClearSearch();
                    }}
                    className="flex items-center text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={handleSearchSubmit}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all text-xs font-medium flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>

            {/* Compact Filter Buttons */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setSortBy("latest")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all ${sortBy === "latest"
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Latest
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all ${sortBy === "popular"
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Popular
              </button>
            </div>
          </div>

          {/* Compact Statistics */}
          {(searchTerm || totalPages > 1) && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {searchTerm ? (
                  <span>Found {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''}</span>
                ) : (
                  <span>Page {currentPage} of {totalPages}</span>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {!blogs.length ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-gray-200 border-l-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading articles...</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg mx-auto max-w-xl">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No articles found</h3>
              <p className="text-gray-600 mb-4 text-sm">No articles match your search.</p>
              <button
                onClick={handleClearSearch}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-all text-sm"
              >
                View All Articles
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">     
                {currentBlogs.map((blog) => {
                  const contentWithoutImages = removeImagesFromContent(blog.content);
                  const paragraphs = contentWithoutImages.split("</p>").slice(0, 2).join("</p>") + "</p>";
                  const blogImage = extractImageOnly(blog.content) ||
                    (blog.image &&
                      !blog.image.includes('youtube') &&
                      !blog.image.includes('youtu.be') &&
                      !blog.image.includes('drive.google') &&
                      !blog.image.includes('ytimg.com') &&
                      !blog.image.includes('video') ? blog.image : null);

                  return (
                    <article
                      key={blog._id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-200"
                    >
                      <div className="flex flex-col sm:flex-row gap-0 sm:gap-4">
                        {/* Compact Image Section */}
                        <div className="w-full sm:w-48 sm:flex-shrink-0 p-3 sm:p-4 pb-0 sm:pb-4">
                          {blogImage ? (
                            <div className="w-full h-36 sm:h-32 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                              <img
                                src={blogImage}
                                alt={blog.title}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-36 sm:h-32 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-8 h-8 text-white mx-auto opacity-80 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <p className="text-white text-xs font-semibold">ZEVA</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Compact Content Section */}
                        <div className="flex-1 p-3 sm:p-4 pt-2 sm:pt-4">
                          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
                            {blog.title}
                          </h2>

                          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                            <div className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span className="truncate max-w-[100px]">{blog.postedBy?.name || "Unknown"}</span>
                            </div>
                            <span className="text-gray-500">
                              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {/* Hashtags/Topics */}
                          {extractTopics(blog.content).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {extractTopics(blog.content).slice(0, 3).map((topic) => (
                                <span
                                  key={topic}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium"
                                >
                                  <Hash className="w-2.5 h-2.5" />
                                  {topic}
                                </span>
                              ))}
                              {extractTopics(blog.content).length > 3 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 text-purple-600 text-xs font-medium">
                                  +{extractTopics(blog.content).length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Compact Content preview */}
                          <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {parse(paragraphs)}
                          </div>

                          {/* Compact Action buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleLike(blog._id);
                                }}
                                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                                  blog.liked ? "text-red-600" : "text-gray-500 hover:text-red-500"
                                }`}
                              >
                                <svg
                                  className={`w-4 h-4 ${blog.liked ? "text-red-500" : "text-gray-400 group-hover:text-red-500"}`}
                                  fill={blog.liked ? "currentColor" : "none"}
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                  />
                                </svg>
                                <span className="tabular-nums">{blog.likesCount ?? 0}</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  router.push(`/blogs/${createBlogSlug(blog)}`);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
                              >
                                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
                                  <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                                    fill="currentColor" />
                                </svg>
                                <span>{blog.commentsCount ?? 0}</span>
                              </button>
                            </div>

                            <Link href={`/blogs/${createBlogSlug(blog)}`}>
                              <button className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-all text-xs cursor-pointer">
                                Read
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                              </button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Compact Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white border border-gray-300 text-gray-600 font-medium text-xs rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden xs:inline">Prev</span>
                  </button>

                  <div className="flex gap-1">
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 bg-white border border-gray-300 text-gray-600 font-medium text-xs rounded-md hover:bg-gray-50"
                        >
                          1
                        </button>
                        {currentPage > 4 && (
                          <span className="flex items-center px-1 text-gray-400 text-xs">⋯</span>
                        )}
                      </>
                    )}

                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .filter(page => {
                        if (currentPage <= 3) return page <= 5;
                        if (currentPage >= totalPages - 2) return page >= totalPages - 4;
                        return Math.abs(page - currentPage) <= 2;
                      })
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 font-medium text-xs rounded-md transition-all ${currentPage === page
                            ? 'bg-indigo-600 text-white border border-indigo-600'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      ))}

                    {currentPage < totalPages - 2 && totalPages > 5 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="flex items-center px-1 text-gray-400 text-xs">⋯</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 bg-white border border-gray-300 text-gray-600 font-medium text-xs rounded-md hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-white border border-gray-300 text-gray-600 font-medium text-xs rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Auth Modal */}
          {showAuthModal && (
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onSuccess={() => {
                setShowAuthModal(false);
              }}
              initialMode={authModalMode}
            />
          )}
        </div>

        {/* Compact Right Sidebar */}
        <div className="lg:w-72 space-y-4">
          {/* Trending Now Section */}
          <div className="bg-white mt-4 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-bold text-gray-900">Trending Now</h3>
            </div>

            <div className="space-y-3">
              {blogs.slice(0, 3).map((trendingBlog) => {
                const trendingImage = extractImageOnly(trendingBlog.content) ||
                  (trendingBlog.image &&
                    !trendingBlog.image.includes('youtube') &&
                    !trendingBlog.image.includes('youtu.be') &&
                    !trendingBlog.image.includes('drive.google') &&
                    !trendingBlog.image.includes('ytimg.com') &&
                    !trendingBlog.image.includes('video') ? trendingBlog.image : null);

                return (
                  <Link key={trendingBlog._id} href={`/blogs/${createBlogSlug(trendingBlog)}`}>
                    <div className="flex gap-3 group cursor-pointer">
                      <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        {trendingImage ? (
                          <img
                            src={trendingImage}
                            alt={trendingBlog.title}
                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-1">
                          {trendingBlog.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="truncate">{trendingBlog.postedBy?.name || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Why Read ZEVA Blogs Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Why You Should Read ZEVA Blogs</h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Expert Insights</h4>
                  <p className="text-xs text-gray-600">Quality content from professionals</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Latest Trends</h4>
                  <p className="text-xs text-gray-600">Stay updated with tech</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Practical Guides</h4>
                  <p className="text-xs text-gray-600">Actionable tips and tutorials</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-0.5">Community Driven</h4>
                  <p className="text-xs text-gray-600">Join discussions and share</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style jsx>{`
      @media (min-width: 475px) {
        .xs\\:flex-row {
          flex-direction: row;
        }
        .xs\\:items-center {
          align-items: center;
        }
        .xs\\:inline {
          display: inline;
        }
      }
    `}</style>
  </div>
  </>
);
}