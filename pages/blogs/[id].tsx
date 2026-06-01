import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { useEffect, useState, useRef } from "react";
import parse from "html-react-parser";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "../../components/AuthModal";
import SocialMediaShare from "../../components/SocialMediaShare";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import dbConnect from "../../lib/database";
import BlogModel from "../../models/Blog";

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

interface BlogDoc {
  _id: string;
  title: string;
  content: string;
  status: "draft" | "published";
  paramlink: string;
  slugLocked?: boolean;
  postedBy: {
    _id: string;
    name: string;
  };
  role: "clinic" | "doctor";
  likes: string[];
  comments: unknown[];
  createdAt: string;
  updatedAt: string;
  image?: string;
}

type BlogReply = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
  user?: string | null;
};

type BlogComment = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
  user?: string | null;
  replies?: BlogReply[];
};

type Blog = {
  _id: string;
  title: string;
  content: string;
  postedBy: { name: string; _id?: string | null };
  createdAt: string;
  image?: string;
  likesCount?: number;
  likes?: string[];
  liked?: boolean;
  comments: BlogComment[];
  paramlink?: string | null;
};

type SeoMeta = {
  title: string;
  description: string;
  image: string;
  url: string;
};

interface BlogDetailProps {
  initialBlog: Blog | null;
  seo: SeoMeta | null;
}

export default function BlogDetail({ initialBlog, seo }: BlogDetailProps) {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { user, isAuthenticated } = useAuth();

  const [blog, setBlog] = useState<Blog | null>(initialBlog);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register" | undefined>("login");
  const [replyTexts, setReplyTexts] = useState<{ [commentId: string]: string }>(
    {}
  );

  // Track pending actions after login
  const shouldLikeAfterLogin = useRef(false);
  const shouldCommentAfterLogin = useRef(false);
  const pendingComment = useRef("");
  const shouldReplyAfterLogin = useRef(false);
  const pendingReplyCommentId = useRef<string | null>(null);
  const pendingReplyText = useRef("");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedReplies, setExpandedReplies] = useState<{
    [commentId: string]: boolean;
  }>({});
  const [showReplyInput, setShowReplyInput] = useState<{
    [commentId: string]: boolean;
  }>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hero section animation
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Remove close buttons from images after content is rendered
  useEffect(() => {
    if (!blog?.content) return;
    
    const removeCloseButtons = () => {
      const blogContent = document.querySelector('.blog-content');
      if (!blogContent) return;

      // Find and remove close buttons near images
      const images = blogContent.querySelectorAll('img');
      images.forEach((img) => {
        // Find parent container
        const container = img.closest('figure, div, p, .image-wrapper, .ql-image');
        if (container) {
          // Find buttons in the container
          const buttons = container.querySelectorAll('button');
          buttons.forEach((button) => {
            // Check if button looks like a close button (has X icon or close-related classes)
            const buttonText = button.textContent || '';
            const buttonClasses = button.className || '';
            const hasCloseIcon = button.querySelector('svg path[d*="M6 18"], svg path[d*="M18 6"], svg path[d*="close"]');
            
            if (
              buttonText.includes('×') ||
              buttonText.includes('✕') ||
              buttonClasses.includes('close') ||
              buttonClasses.includes('cross') ||
              hasCloseIcon ||
              button.getAttribute('aria-label')?.toLowerCase().includes('close')
            ) {
              button.remove();
            }
          });
        }
      });

      // Also remove any absolutely positioned buttons in image containers
      const imageContainers = blogContent.querySelectorAll('figure, .image-wrapper, .ql-image, div:has(img)');
      imageContainers.forEach((container) => {
        const absoluteButtons = container.querySelectorAll('button[style*="position: absolute"], button[class*="absolute"]');
        absoluteButtons.forEach((btn) => {
          const isTopRight = btn.classList.contains('top-0') || btn.classList.contains('top-2') || 
                            btn.classList.contains('right-0') || btn.classList.contains('right-2');
          if (isTopRight) {
            btn.remove();
          }
        });
      });
    };

    // Run after a short delay to ensure content is rendered
    const timeoutId = setTimeout(removeCloseButtons, 100);
    
    // Also run on mutation to catch dynamically added elements
    const observer = new MutationObserver(removeCloseButtons);
    const blogContent = document.querySelector('.blog-content');
    if (blogContent) {
      observer.observe(blogContent, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [blog?.content]);

  // Utility to get base URL
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://zeva360.com";
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const isLongComment = (text: string) => {
    return text.split("\n").length > 4;
  };

  const truncateComment = (text: string, isExpanded: boolean) => {
    const lines = text.split("\n");
    if (!isExpanded && lines.length > 4) {
      return lines.slice(0, 4).join("\n");
    }
    return text;
  };

  // Compute share URL
  const shareUrl = blog
    ? `${getBaseUrl()}/blogs/${blog.paramlink || blog._id}`
    : "";

  // Helper: extract full MongoDB ObjectId from slug
  const extractBlogIdFromSlug = (slug: string): string | null => {
    if (!slug) return null;
    const objectIdPattern = /([a-f0-9]{24})$/i;
    const match = slug.match(objectIdPattern);
    return match ? match[1] : null;
  };


  // Client-side fetch only if not provided by SSR (shouldn't typically happen)
  useEffect(() => {
    if (blog || !id) return;
    
    // Extract ID from slug if it's a slug format
    const blogId = extractBlogIdFromSlug(id) || id;
    
    const token = localStorage.getItem("token");
    fetch(`/api/blog/getBlogById?id=${blogId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBlog(json.blog);
        else setError(json.error || "Failed to fetch blog");
      })
      .catch(() => {
        setError("Network error");
        toast.error("Network error while fetching blog");
      });
  }, [id, blog]);

  // Retry actions if user logged in after showing modal
  useEffect(() => {
    if (isAuthenticated) {
      if (shouldLikeAfterLogin.current) {
        shouldLikeAfterLogin.current = false;
        performToggleLike();
      }
      if (shouldCommentAfterLogin.current) {
        shouldCommentAfterLogin.current = false;
        setNewComment(pendingComment.current);
        performSubmitComment(pendingComment.current);
        pendingComment.current = "";
      }
      if (shouldReplyAfterLogin.current && pendingReplyCommentId.current) {
        shouldReplyAfterLogin.current = false;
        const commentId = pendingReplyCommentId.current;
        const replyText = pendingReplyText.current;
        pendingReplyCommentId.current = null;
        pendingReplyText.current = "";
        // Set the reply text and submit
        setReplyTexts((prev) => ({ ...prev, [commentId]: replyText }));
        // Small delay to ensure state is updated
        setTimeout(() => {
          handleReplySubmit(commentId);
        }, 100);
      }
    }
  }, [isAuthenticated]);

  // Lock body scroll when comment panel is open
  useEffect(() => {
    if (showCommentPanel) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position when panel closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showCommentPanel]);

  // Like handler with auth check
  async function toggleLike() {
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldLikeAfterLogin.current = true;
      toast("Please login to like this post", { icon: "🔐" });
      return;
    }

    await performToggleLike();
  }

  // Actual like functionality
  async function performToggleLike() {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog/likeBlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId: id }),
      });
      const json = await res.json();
      if (json.success && blog) {
        setBlog({
          ...blog,
          likesCount: json.likesCount,
          liked: json.liked,
        });
        if (json.liked) {
          toast.success("Added to likes");
        } else {
          toast("Removed like", { icon: "💔" });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update like");
    }
  }

  // Comment handler with auth check
  async function submitComment() {
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldCommentAfterLogin.current = true;
      pendingComment.current = newComment;
      toast("Please login to comment", { icon: "🔐" });
      return;
    }

    await performSubmitComment(newComment);
  }

  // Actual comment functionality
  async function performSubmitComment(commentText: string) {
    if (!id || !commentText.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog/addComment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId: id, text: commentText }),
      });
      const json = await res.json();
      if (json.success && json.comment && blog) {
        // Add the new comment to existing comments
        const newComment: BlogComment = {
          _id: json.comment._id,
          username: json.comment.username,
          text: json.comment.text,
          createdAt: json.comment.createdAt,
          user: json.comment.user,
          replies: json.comment.replies || [],
        };

        setBlog({
          ...blog,
          comments: [...blog.comments, newComment],
        });
        setNewComment("");
        toast.success("Comment posted");
      } else {
        console.error("Failed to add comment:", json.error);
        toast.error(json.error || "Failed to add comment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while adding comment");
    }
  }

  async function performDelete(commentId: string) {
    try {
      const token = localStorage.getItem("token");
      await toast.promise(
        fetch("/api/blog/deleteComment", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ blogId: blog?._id, commentId }),
        }).then((res) => res.json()),
        {
          loading: "Deleting...",
          success: (json) => {
            if (!json.success) throw new Error(json.error || "Failed to delete");
            setBlog((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                comments: prev.comments
                  .map((c) => {
                    if (c._id === commentId) return null;
                    return {
                      ...c,
                      replies: c.replies?.filter((r) => r._id !== commentId),
                    };
                  })
                  .filter(Boolean) as typeof prev.comments,
              };
            });
            return "Comment deleted";
          },
          error: (err) => err.message || "Failed to delete",
        }
      );
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDeleteId(null);
    }
  }

  // Handle reply submission
  async function handleReplySubmit(commentId: string) {
    const replyText = replyTexts[commentId];
    if (!replyText?.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    if (!blog?._id) {
      toast.error("Blog not found");
      return;
    }

    // Check authentication first
    if (!isAuthenticated) {
      setAuthModalMode("login");
      setShowAuthModal(true);
      shouldReplyAfterLogin.current = true;
      pendingReplyCommentId.current = commentId;
      pendingReplyText.current = replyText;
      toast("Please login to reply", { icon: "🔐" });
      return;
    }

    await performReplySubmit(commentId, replyText);
  }

  // Actual reply submission function
  async function performReplySubmit(commentId: string, replyText: string) {
    if (!blog?._id) {
      toast.error("Blog not found");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to reply");
        return;
      }

      const res = await fetch("/api/blog/addReply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogId: blog._id,
          commentId: commentId,
          text: replyText.trim(),
        }),
      });
      
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Failed to add reply");
      }

      // Fetch latest replies for this comment
      const res2 = await fetch(
        `/api/blog/getCommentReplies?blogId=${blog._id}&commentId=${commentId}`
      );
      const json2 = await res2.json();
      
      if (json2.success) {
        setBlog((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.map((comment) =>
              comment._id === commentId
                ? { ...comment, replies: json2.replies || [] }
                : comment
            ),
          };
        });
        setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
        setShowReplyInput((prev) => ({ ...prev, [commentId]: false }));
        setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
        toast.success("Reply added successfully");
      } else {
        throw new Error("Failed to fetch updated replies");
      }
    } catch (err: any) {
      console.error("Error submitting reply:", err);
      toast.error(err.message || "Failed to add reply");
    }
  }

  if (error) return <p>Error: {error}</p>;
  if (!blog) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="relative mb-8">
        {/* Animated circles */}
        <div className="flex space-x-2">
          <div
            className="w-4 h-4 rounded-full animate-bounce"
            style={{
              backgroundColor: '#2D9AA5',
              animationDelay: '0ms',
              animationDuration: '1200ms'
            }}
          ></div>
          <div
            className="w-4 h-4 rounded-full animate-bounce"
            style={{
              backgroundColor: '#2D9AA5',
              animationDelay: '200ms',
              animationDuration: '1200ms'
            }}
          ></div>
          <div
            className="w-4 h-4 rounded-full animate-bounce"
            style={{
              backgroundColor: '#2D9AA5',
              animationDelay: '400ms',
              animationDuration: '1200ms'
            }}
          ></div>
        </div>

        {/* Pulsing ring */}
        <div
          className="absolute -top-2 -left-2 w-8 h-8 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: '#2D9AA5' }}
        ></div>
      </div>

      {/* Loading text */}
      <div className="text-center">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: '#2D9AA5' }}
        >
          Loading Blog
        </h2>
        <p className="text-slate-600 animate-pulse">
          Getting your content ready...
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-right" gutter={8} />
      {seo && (
        <Head>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={seo.title} />
          <meta property="og:description" content={seo.description} />
          <meta property="og:image" content={seo.image} />
          <meta property="og:url" content={seo.url} />
          <meta property="og:site_name" content="Global Ayurveda" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seo.title} />
          <meta name="twitter:description" content={seo.description} />
          <meta name="twitter:image" content={seo.image} />
          <link rel="stylesheet" href="https://cdn.quilljs.com/1.3.6/quill.snow.css" />
        </Head>
      )}

      <style jsx global>{`
      .blog-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        line-height: 1.7;
        color: #2c3e50;
      }

      /* Images - Preserve structure, alignment, and add lazy loading */
      .blog-content img {
        display: block !important;
        max-width: 50% !important;
        width: auto !important;
        height: auto !important;
        margin: 1.5rem auto !important;
        border-radius: 12px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
        transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease !important;
        opacity: 1 !important;
        loading: lazy !important;
      }

      /* Hide any close/cross buttons on images */
      .blog-content img + button,
      .blog-content .image-wrapper button,
      .blog-content figure button,
      .blog-content .ql-image button,
      .blog-content img ~ button[class*="close"],
      .blog-content img ~ button[class*="cross"],
      .blog-content img ~ button[aria-label*="close"],
      .blog-content img ~ button[aria-label*="Close"],
      .blog-content * button[class*="close"],
      .blog-content * button[class*="cross"],
      .blog-content .relative button[class*="absolute"][class*="top"][class*="right"],
      .blog-content button[class*="absolute"][class*="top"][class*="right"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* Hide close buttons in image containers */
      .blog-content figure button,
      .blog-content .image-wrapper button,
      .blog-content .ql-image button,
      .blog-content div[class*="relative"] button[class*="absolute"],
      .blog-content div[class*="relative"]:has(img) button {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* Hide circular close buttons (common pattern: gray circle with X) */
      .blog-content button[class*="rounded-full"][class*="bg-gray"],
      .blog-content button[class*="rounded-full"]:has(svg path[d*="M6 18"]),
      .blog-content button[class*="rounded-full"]:has(svg path[d*="M18 6"]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* Lazy loading placeholder */
      .blog-content img[loading="lazy"] {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%) !important;
        background-size: 200% 100% !important;
        animation: shimmer 1.5s infinite !important;
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      .blog-content img:hover {
        transform: scale(1.01) !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
      }

      /* Preserve Quill alignment classes */
      .blog-content .ql-align-center,
      .blog-content p.ql-align-center,
      .blog-content div.ql-align-center {
        text-align: center !important;
      }

      .blog-content .ql-align-center img {
        margin-left: auto !important;
        margin-right: auto !important;
        display: block !important;
      }

      .blog-content .ql-align-right,
      .blog-content p.ql-align-right,
      .blog-content div.ql-align-right {
        text-align: right !important;
      }

      .blog-content .ql-align-right img {
        margin-left: auto !important;
        margin-right: 0 !important;
        display: block !important;
      }

      .blog-content .ql-align-left,
      .blog-content p.ql-align-left,
      .blog-content div.ql-align-left {
        text-align: left !important;
      }

      .blog-content .ql-align-left img {
        margin-left: 0 !important;
        margin-right: auto !important;
        display: block !important;
      }

      /* Block-based layout for content fragments */
      .blog-content > * {
        margin-bottom: 1.5rem !important;
      }

      .blog-content > *:last-child {
        margin-bottom: 0 !important;
      }

      /* Responsive image containers */
      .blog-content figure,
      .blog-content .image-wrapper,
      .blog-content .ql-image {
        margin: 1.5rem 0 !important;
        text-align: center !important;
      }

      .blog-content figure img,
      .blog-content .image-wrapper img,
      .blog-content .ql-image img {
        margin: 0 auto !important;
      }


      

      .blog-content iframe[src*="youtube"],
      .blog-content iframe[src*="youtu.be"],
      .blog-content iframe[src*="drive.google"],
      .blog-content iframe[src*="docs.google"],
      .blog-content iframe[src*="googleapis"],
      .blog-content iframe[src*="embed"],
      .blog-content iframe[title*="YouTube"],
      .blog-content iframe[title*="Google Drive"],
      .blog-content *[src*="youtube"],
      .blog-content *[src*="youtu.be"],
      .blog-content *[src*="drive.google"],
      .blog-content *[src*="docs.google"] {
        display: block !important;
        margin: 1.5rem auto !important;
        width: 100% !important;
        max-width: 100% !important;
        height: 500px !important;
        border-radius: 16px !important;
        border: none !important;
        box-shadow: 0 20px 60px rgba(59, 130, 246, 0.15), 0 8px 24px rgba(59, 130, 246, 0.08) !important;
        transition: all 0.4s ease !important;
      }

      .blog-content *:has(iframe[src*="youtube"]),
      .blog-content *:has(iframe[src*="youtu.be"]),
      .blog-content *:has(iframe[src*="drive.google"]),
      .blog-content *:has(iframe[src*="docs.google"]),
      .blog-content *:has(*[src*="youtube"]),
      .blog-content *:has(*[src*="youtu.be"]),
      .blog-content *:has(*[src*="drive.google"]) {
        text-align: center !important;
        display: block !important;
        width: 100% !important;
      }

      .blog-content .video-wrapper,
      .blog-content .embed-responsive,
      .blog-content .youtube-embed,
      .blog-content .video-embed,
      .blog-content .iframe-wrapper {
        text-align: center !important;
        display: block !important;
        width: 100% !important;
      }

      .blog-content .ql-align-center { text-align: center !important; }
      .blog-content .ql-align-right { text-align: right !important; }
      .blog-content .ql-align-justify { text-align: justify !important; }
      .blog-content .ql-align-left { text-align: left !important; }

      .blog-content p {
        margin-bottom: 1.25rem;
        font-size: 1.1rem;
        color: #374151;
        line-height: 1.75;
      }

      .blog-content h1,
      .blog-content h2,
      .blog-content h3,
      .blog-content h4 {
        color: #1f2937;
        font-weight: 700;
        margin-top: 2rem;
        margin-bottom: 1rem;
        line-height: 1.3;
        text-decoration: none !important;
      }
      
      .blog-content h1 u,
      .blog-content h2 u,
      .blog-content h3 u,
      .blog-content h4 u,
      .blog-content u {
        text-decoration: none !important;
      }
      
      /* Remove all underlines from blog content */
      .blog-content u,
      .blog-content * u {
        text-decoration: none !important;
        border-bottom: none !important;
      }

      .blog-content h1 { font-size: 2.5rem; }
      .blog-content h2 { font-size: 2rem; color: #2563eb; }
      .blog-content h3 { font-size: 1.5rem; }

      .blog-content blockquote {
        border-left: 4px solid #3b82f6;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        padding: 1.25rem 1.75rem;
        margin: 1.5rem 0;
        font-style: italic;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      }

      .blog-content ul,
      .blog-content ol {
        margin: 1.25rem 0;
        padding-left: 2rem;
        list-style-position: outside;
      }

      .blog-content li {
        margin-bottom: 0.5rem;
        color: #374151;
      }

      .blog-content ul { list-style-type: disc; }
      .blog-content ol { list-style-type: decimal; }
      .blog-content ul ul { list-style-type: circle; }
      .blog-content ul ul ul { list-style-type: square; }

      .blog-content .ql-size-small { font-size: 0.875rem; }
      .blog-content .ql-size-large { font-size: 1.5rem; }
      .blog-content .ql-size-huge { font-size: 2.25rem; }

      .blog-content .ql-font-serif { font-family: Georgia, Cambria, "Times New Roman", Times, serif; }
      .blog-content .ql-font-monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .blog-content .ql-font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif; }

      @media (max-width: 1024px) {
        .blog-content img {
          max-width: 60% !important;
          height: auto !important;
          border-radius: 8px !important;
        }
        .blog-content iframe[src*="youtube"],
        .blog-content iframe[src*="youtu.be"],
        .blog-content iframe[src*="drive.google"],
        .blog-content *[src*="youtube"],
        .blog-content *[src*="youtu.be"],
        .blog-content *[src*="drive.google"] {
          height: 400px !important;
        }
      }

      @media (max-width: 768px) {
        .blog-content img {
          max-width: 70% !important;
          height: auto !important;
          margin: 1rem auto !important;
          border-radius: 8px !important;
        }
        .blog-content iframe[src*="youtube"],
        .blog-content iframe[src*="youtu.be"],
        .blog-content iframe[src*="drive.google"],
        .blog-content *[src*="youtube"],
        .blog-content *[src*="youtu.be"],
        .blog-content *[src*="drive.google"] {
          max-width: 100% !important;
          height: 300px !important;
          margin: 1rem auto !important;
        }
        .blog-content p { 
          font-size: 1rem; 
          margin-bottom: 1rem;
        }
        .blog-content h1 { font-size: 1.75rem; }
        .blog-content h2 { font-size: 1.5rem; }
        .blog-content h3 { font-size: 1.25rem; }
        .blog-content blockquote {
          padding: 1rem 1.25rem;
          margin: 1rem 0;
        }
      }

      @media (max-width: 640px) {
        .blog-content img {
          max-width: 80% !important;
          height: auto !important;
          margin: 0.75rem auto !important;
          border-radius: 6px !important;
        }
        .blog-content iframe[src*="youtube"],
        .blog-content iframe[src*="youtu.be"],
        .blog-content iframe[src*="drive.google"],
        .blog-content *[src*="youtube"],
        .blog-content *[src*="youtu.be"],
        .blog-content *[src*="drive.google"] {
          height: 250px !important;
          margin: 0.75rem auto !important;
        }
        .blog-content p { 
          font-size: 0.9375rem; 
          line-height: 1.6;
        }
        .blog-content h1 { font-size: 1.5rem; }
        .blog-content h2 { font-size: 1.25rem; }
        .blog-content h3 { font-size: 1.125rem; }
        .blog-content ul,
        .blog-content ol {
          padding-left: 1.5rem;
        }
      }

      .blog-container::-webkit-scrollbar { width: 8px; }
      .blog-container::-webkit-scrollbar-track { background: #f8fafc; border-radius: 4px; }
      .blog-container::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); border-radius: 4px; }
      .blog-container::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%); }

      /* Comments scrollbar */
      .comments-scrollable::-webkit-scrollbar { width: 6px; }
      .comments-scrollable::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
      .comments-scrollable::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%); border-radius: 3px; }
      .comments-scrollable::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #2563eb 0%, #4f46e5 100%); }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-4px); }
      }

      .floating { animation: float 3s ease-in-out infinite; }

      @keyframes pulse-ring {
        0% { transform: scale(0.8); }
        40%, 50% { opacity: 0; }
        100% { opacity: 0; transform: scale(1.2); }
      }

      .pulse-ring::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: currentColor;
        opacity: 0.2;
        animation: pulse-ring 2s ease-out infinite;
      }
    `}</style>

      <div className="blog-container w-full">
        {/* Clean Header Section */}
        <header className="w-full bg-gradient-to-b from-slate-50 to-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                {blog.title}
              </h1>

              {/* Author & Date */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                    {blog.postedBy?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-base block">
                      {blog.postedBy?.name || "Author"}
                    </span>
                    <time className="text-sm text-gray-500">
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </div>

              {/* Social Engagement Bar */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={toggleLike}
                  className={`group inline-flex items-center gap-1.5 text-sm font-medium transition-colors
                    ${blog.liked
                      ? "text-red-600"
                      : "text-red-500 hover:text-red-500"
                    }`}
                >
                  <svg
                    className={`w-5 h-5 transition-colors ${blog.liked ? "text-red-500" : "text-red-400 group-hover:text-red-500"}`}
                    fill={blog.liked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span className="tabular-nums">{blog.likesCount}</span>
                </button>

                {blog && (
                  <SocialMediaShare
                    blogTitle={blog.title}
                    blogUrl={shareUrl}
                    blogDescription={blog.content.replace(/<[^>]+>/g, "").slice(0, 200)}
                    triggerClassName="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
                  />
                )}

                <button
                  onClick={() => setShowCommentPanel(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Comments ({blog.comments.length})</span>
                </button>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Blog Content Section - Block-based CMS Style */}
        <main className="w-full bg-white">
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="blog-content prose prose-lg max-w-none">
              {parse(blog.content)}
            </div>
          </article>
        </main>

       
       
      </div>

      {/* Side Comment Panel */}
      {showCommentPanel && (
        <div>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={() => setShowCommentPanel(false)}
          ></div>

          {/* Side Panel */}
          <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-96 lg:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
            showCommentPanel ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1 sm:gap-2 flex-1 min-w-0 pr-2 sm:pr-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="truncate">Comments</span>
                  <span className="text-base sm:text-lg font-normal text-gray-500 flex-shrink-0">({blog.comments.length})</span>
                </h2>
                <button
                  onClick={() => setShowCommentPanel(false)}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center group flex-shrink-0 ml-2"
                  aria-label="Close comments"
                >
                  <svg 
                    className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-gray-900 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </button>
              </div>

              {/* Comment Input Box */}
              <div className="p-1  sm:p-4 border-b-2 border-gray-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment here..."
                  rows={3}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm placeholder-gray-400"
                />
                <div className="flex justify-between items-center mt-1.5">
                  <div className="text-xs text-gray-400">
                    {newComment.length}/1000
                  </div>
                  <button
                    onClick={submitComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Comments List - Scrollable */}
              <div className="flex-1 overflow-y-auto comments-scrollable p-4 sm:p-6">
                <div className="space-y-4">
                {blog.comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  blog.comments.map((c) => {
                    const canDeleteComment =
                      user &&
                      (String(user._id) === String(c.user) ||
                        String(user._id) === String(blog.postedBy?._id));

                    const isExpanded = expandedComments[c._id];
                    const isLong = isLongComment(c.text);
                    const displayText = truncateComment(c.text, isExpanded);

                    return (
                      <div
                        key={c._id}
                        className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-blue-100"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                              {c.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {c.username}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="truncate">
                                  {new Date(c.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </p>
                            </div>
                          </div>

                          {canDeleteComment && (
                            <button
                              onClick={() => setConfirmDeleteId(c._id)}
                              className="text-gray-400 hover:text-red-500 transition-all duration-200 p-1.5 rounded-full hover:bg-red-50 flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="text-gray-700 leading-relaxed mb-3 text-sm">
                          <pre className="whitespace-pre-wrap font-sans">{displayText}</pre>
                          {isLong && (
                            <button
                              onClick={() => toggleCommentExpansion(c._id)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-xs mt-1 flex items-center transition-colors duration-200"
                            >
                              {isExpanded ? (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Show less
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Show more
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {c.replies && c.replies.length > 0 && (
                            <button
                              className="flex items-center text-gray-500 hover:text-blue-600 text-xs"
                              onClick={() =>
                                setExpandedReplies((prev) => ({
                                  ...prev,
                                  [c._id]: !prev[c._id],
                                }))
                              }
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h-6a2 2 0 00-2 2v0a2 2 0 002 2h6a2 2 0 002-2v0a2 2 0 00-2-2z" />
                              </svg>
                              {expandedReplies[c._id]
                                ? `Hide replies (${c.replies.length})`
                                : `Show replies (${c.replies.length})`}
                            </button>
                          )}
                          <button
                            className="text-blue-600 hover:underline text-xs font-medium"
                            onClick={() => {
                              if (!isAuthenticated) {
                                setAuthModalMode("login");
                                setShowAuthModal(true);
                                toast("Please login to reply", { icon: "🔐" });
                                return;
                              }
                              setShowReplyInput((prev) => ({
                                ...prev,
                                [c._id]: !prev[c._id],
                              }));
                            }}
                          >
                            Reply
                          </button>
                        </div>

                        {showReplyInput[c._id] && (
                          <div className="mt-2">
                            <div className="flex space-x-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {user?.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  placeholder={isAuthenticated ? "Reply to this comment..." : "Login to reply..."}
                                  value={replyTexts[c._id] || ""}
                                  onChange={(e) =>
                                    setReplyTexts((prev) => ({
                                      ...prev,
                                      [c._id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleReplySubmit(c._id);
                                    }
                                  }}
                                  disabled={!isAuthenticated}
                                  className="w-full border-2 border-blue-200 rounded-lg px-3 py-1.5 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleReplySubmit(c._id);
                                  }}
                                  disabled={!replyTexts[c._id]?.trim() || !isAuthenticated}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                  title={isAuthenticated ? "Send reply" : "Login to reply"}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {c.replies && c.replies.length > 0 && expandedReplies[c._id] && (
                          <div className="space-y-2 mt-3 ml-6 border-l-2 border-blue-300 pl-3">
                            {c.replies.map((r) => {
                              const isAuthorReply =
                                r.user && String(r.user) === String(blog.postedBy?._id);
                              const canDeleteReply =
                                user &&
                                (String(user._id) === String(r.user) ||
                                  String(user._id) === String(blog.postedBy?._id));
                              return (
                                <div
                                  key={r._id}
                                  className={`p-3 rounded-lg ${isAuthorReply
                                    ? "bg-gradient-to-br from-blue-100/50 to-blue-50/30 border border-blue-200"
                                    : "bg-white border border-gray-200"
                                    }`}
                                >
                                  <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${isAuthorReply
                                          ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                          : "bg-gradient-to-br from-gray-400 to-gray-500"
                                          }`}
                                      >
                                        {r.username.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`font-bold text-xs flex items-center flex-wrap ${isAuthorReply ? "text-blue-700" : "text-gray-700"
                                            }`}
                                        >
                                          <span className="truncate">{r.username}</span>
                                          {isAuthorReply && (
                                            <span className="ml-1.5 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                                              Author
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(r.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    {canDeleteReply && (
                                      <button
                                        onClick={() => setConfirmDeleteId(r._id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-0.5 rounded-full hover:bg-red-50 flex-shrink-0"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                  <pre className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                                    {r.text}
                                  </pre>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
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

        {/* Back to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
          style={{
            opacity: typeof window !== "undefined" && window.scrollY > 300 ? 1 : 0,
            visibility: typeof window !== "undefined" && window.scrollY > 300 ? "visible" : "hidden",
          }}
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 backdrop-blur-sm bg-white/20"
              onClick={() => setConfirmDeleteId(null)}
            />
            <div className="relative z-[101] w-full max-w-sm sm:max-w-md mx-auto rounded-xl sm:rounded-2xl shadow-2xl border border-blue-200 bg-white">
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M9 3h6a2 2 0 012 2v2H7V5a2 2 0 012-2zm-2 7h10l-1 9a2 2 0 01-2 2H9a2 2 0 01-2-2l-1-9z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete comment?</h3>
                    <p className="mt-1 text-xs sm:text-sm text-gray-600">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-6 flex items-center justify-end gap-2 sm:gap-3">
                  <button
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base transition-colors duration-200"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base transition-colors duration-200"
                    onClick={() => confirmDeleteId && performDelete(confirmDeleteId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// Helpers
function stripHtml(html: string): string {
  if (!html) return "";
  const withoutTags = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutTags;
}

function extractFirstImageSrc(html: string): string | null {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (!match) return null;
  const src = match[1];
  if (!src || src.startsWith("data:")) return null;
  return src;
}

export const getServerSideProps: GetServerSideProps<BlogDetailProps> = async ({
  params,
  req,
}) => {
  try {
    const { id } = params as { id: string };
    await dbConnect();

    let blogDoc: BlogDoc | null = null;
    
    // PRIORITY 1: Try to find by paramlink (slug) first - this is the primary method
    blogDoc = await BlogModel.findOne({ paramlink: id, status: "published" })
        .populate("postedBy", "name _id")
        .lean<BlogDoc>();

    // PRIORITY 2: If not found by slug, check if it's a MongoDB ObjectId
    if (!blogDoc) {
      const isObjectId = /^[a-f0-9]{24}$/i.test(id);
      
      if (isObjectId) {
        // Direct ID lookup
        blogDoc = await BlogModel.findById(id)
          .populate("postedBy", "name _id")
          .lean<BlogDoc>();
        
        // If blog found by ID and has a slug, redirect to slug-based URL
        if (blogDoc && blogDoc.paramlink && blogDoc.slugLocked) {
          return {
            redirect: {
              destination: `/blogs/${blogDoc.paramlink}`,
              permanent: true, // 301 redirect
            },
          };
        }
      } else {
        // PRIORITY 3: Try extracting ID from slug format (backward compatibility)
        // Format: blog-title-abc12345def67890 (title + full 24-char ID at the end)
        const objectIdPattern = /([a-f0-9]{24})$/i;
        const match = id.match(objectIdPattern);
        const extractedId = match ? match[1] : null;
        
        if (extractedId) {
          blogDoc = await BlogModel.findOne({ _id: extractedId, status: "published" })
          .populate("postedBy", "name _id")
          .lean<BlogDoc>();
          
          // If blog found and has a slug, redirect to slug-based URL
          if (blogDoc && blogDoc.paramlink && blogDoc.slugLocked) {
            return {
              redirect: {
                destination: `/blogs/${blogDoc.paramlink}`,
                permanent: true, // 301 redirect
              },
            };
          }
        }
      }
    }
    
    if (!blogDoc) {
      return { notFound: true };
    }

    const host = req.headers.host || "localhost:3000";
    const proto = (req.headers["x-forwarded-proto"] as string) || "http";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
    const url = `${baseUrl}/blogs/${id}`;

    const description = stripHtml(blogDoc.content || "").slice(0, 200);
    const imageFromContent = extractFirstImageSrc(blogDoc.content || "");
    const image =
      imageFromContent || `${baseUrl}/assets/health_treatments_logo.png`;

    // Create the blog object, ensuring no undefined values

    const initialBlog: Blog = {
      _id: blogDoc._id,
      title: blogDoc.title || "Blog",
      content: blogDoc.content || "",
      postedBy: {
        name: blogDoc.postedBy?.name || "Author",
        _id: blogDoc.postedBy?._id || null,
      },
      createdAt: blogDoc.createdAt
        ? new Date(blogDoc.createdAt).toISOString()
        : new Date().toISOString(),
      image: blogDoc.image || undefined,
      likesCount: Array.isArray(blogDoc.likes) ? blogDoc.likes.length : 0,
      liked: false, // will be set on client
      comments: Array.isArray(blogDoc.comments)
        ? (blogDoc.comments as Partial<BlogComment>[]).map((c): BlogComment => ({
          _id: String(c._id ?? ""),
          username: c.username ?? "Anonymous",
          text: c.text ?? "",
          createdAt: c.createdAt
            ? new Date(c.createdAt).toISOString()
            : new Date().toISOString(),
          user: c.user ?? null,
          replies: Array.isArray(c.replies)
            ? (c.replies as Partial<BlogReply>[]).map((r): BlogReply => ({
              _id: String(r._id ?? ""),
              username: r.username ?? "Anonymous",
              text: r.text ?? "",
              createdAt: r.createdAt
                ? new Date(r.createdAt).toISOString()
                : new Date().toISOString(),
              user: r.user ?? null,
            }))
            : [],
        }))
        : [],
      paramlink: blogDoc.paramlink || null,
    };



    // Only add image property if it exists (not null/undefined)
    const finalImage = blogDoc.image || imageFromContent;
    if (finalImage) {
      initialBlog.image = finalImage;
    }

    const seo: SeoMeta = {
      title: initialBlog.title,
      description,
      image,
      url,
    };

    // return { props: { initialBlog, seo } };
    return {
      props: {
        initialBlog: JSON.parse(JSON.stringify(initialBlog)),
        seo
      }
    };
  } catch (e) {
    console.error("getServerSideProps error:", e);
    return { props: { initialBlog: null, seo: null } };
  }
};
