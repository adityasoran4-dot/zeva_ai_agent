
import React, { useCallback, useEffect, useState } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Reply as ReplyIcon,
  Trash2,
  Filter,
  Calendar,
  MoreVertical,
  X,
  SortAsc,
  SortDesc,
  Clock,
  AlertCircle,
  RefreshCw,
  BookOpen,
  FileText,
  Hash,
} from "lucide-react";
import parse from "html-react-parser";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import axios from "axios";

type CommentReply = {
  _id: string;
  user?: string;
  username: string;
  text: string;
  createdAt: string;
};

type Comment = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
  replies?: CommentReply[];
};

interface Blog {
  _id: string;
  image?: string;
  title: string;
  postedBy?: { name?: string };
  createdAt: string;
  content?: string;
  youtubeUrl?: string;
  likesCount: number;
  likes: string[];
  commentsCount: number;
  comments: Comment[];
}

interface Props {
  tokenKey: "clinicToken" | "doctorToken" | "adminToken" | "agentToken";
  blog?: Blog;
  totalLikes?: number;
  totalComments?: number;
  avgEngagement?: number;
  setDetailsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setDetailsBlog?: React.Dispatch<React.SetStateAction<Blog | null>>;
  setDetailsModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  openCommentsPopup?: (blog: Blog) => void;
  permissions?: {
    canRead?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}


interface BlogDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
}

type FilterOption = "all" | "today" | "week" | "month" | "year";
type SortOption = "newest" | "oldest" | "most_liked" | "most_commented";

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}> = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <div
            className={`flex items-center mt-2 text-sm ${trendUp ? "text-green-600" : "text-red-600"
              }`}
          >
            <TrendingUp
              size={14}
              className={`mr-1 ${!trendUp ? "rotate-180" : ""}`}
            />
            {trend}
          </div>
        )}
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">{icon}</div>
    </div>
  </div>
);

const EngagementChart: React.FC<{
  totalLikes: number;
  totalComments: number;
}> = ({ totalLikes, totalComments }) => {
  const maxValue = Math.max(totalLikes, totalComments, 100);
  const likesWidth = totalLikes > 0 ? (totalLikes / maxValue) * 100 : 0;
  const commentsWidth =
    totalComments > 0 ? (totalComments / maxValue) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Engagement Overview
        </h3>
        <BarChart3 size={20} className="text-blue-600" />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <ThumbsUp size={16} className="text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Likes</span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {totalLikes}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${likesWidth}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <MessageCircle size={16} className="text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                Comments
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {totalComments}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${commentsWidth}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const CommentsPopup: React.FC<{
  blog: Blog;
  isOpen: boolean;
  onClose: () => void;
  onReply: (blogId: string, commentId: string, text: string) => Promise<void>;
  onDelete: (blogId: string, commentId: string) => Promise<void>;
  permissions?: {
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}> = ({ blog, isOpen, onClose, onReply, onDelete, permissions = { canUpdate: true, canDelete: true } }) => {
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [activeReply, setActiveReply] = useState<string | null>(null);
  // New state for delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{ blogId: string; commentId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Show modal instead of alert
  const handleDelete = (blogId: string, commentId: string) => {
    setDeleteTarget({ blogId, commentId });
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      setDeleting(true);
      await onDelete(deleteTarget.blogId, deleteTarget.commentId);
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  if (!isOpen) return null;

  const handleReply = async (commentId: string) => {
    const text = replyTexts[commentId]?.trim();
    if (!text) return;
    await onReply(blog._id, commentId, text);
    setReplyTexts((prev) => ({ ...prev, [commentId]: "" }));
    setActiveReply(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-white/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
            <p className="text-sm text-gray-500 mt-1">{blog.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {blog.comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No comments yet
              </h3>
              <p className="text-gray-500">
                Be the first to start a conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {blog.comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {comment.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {comment.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {permissions.canDelete && (
                      <button
                        onClick={() => handleDelete(blog._id, comment._id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{comment.text}</p>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply._id}
                          className="ml-6 bg-white rounded-lg p-3 border-l-2 border-blue-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {reply.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {reply.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {permissions.canDelete && (
                              <button
                                onClick={() => handleDelete(blog._id, reply._id)}
                                className="p-1 text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{reply.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  {permissions.canUpdate && (
                    <div className="border-t border-gray-200 pt-3">
                      {activeReply === comment._id ? (
                        <div className="space-y-3">
                          <textarea
                            placeholder="Write your reply..."
                            className="text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            value={replyTexts[comment._id] || ""}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({
                                ...prev,
                                [comment._id]: e.target.value,
                              }))
                            }
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setActiveReply(null)}
                              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleReply(comment._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveReply(comment._id)}
                          className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <ReplyIcon size={14} className="mr-1" />
                          Reply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="mb-4">
              <Trash2 size={32} className="mx-auto text-red-500 mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Comment?</h3>
              <p className="text-gray-600">Are you sure you want to delete this comment? This action cannot be undone.</p>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={cancelDelete}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// BlogDetailsModal component
const BlogDetailsModal: React.FC<BlogDetailsModalProps> = ({
  isOpen,
  onClose,
  blog,
}) => {
  if (!isOpen || !blog) return null;

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
      <style jsx global>{`
        .blog-content img,
        .blog-content * img,
        .blog-content video,
        .blog-content * video,
        .blog-content iframe,
        .blog-content * iframe {
          display: block !important;
          margin: 2.5rem auto !important;
          width: 700px !important;
          max-width: 700px !important;
          min-width: 700px !important;
          height: 400px !important;
          max-height: 400px !important;
          min-height: 400px !important;
          object-fit: cover !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.4s ease !important;
        }
        .blog-content img:hover,
        .blog-content video:hover,
        .blog-content iframe:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.08) !important;
        }
        /* Enhanced YouTube and Google Drive embeds - UNIFORM SIZE */
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
          margin: 2.5rem auto !important;
          width: 700px !important;
          max-width: 700px !important;
          min-width: 700px !important;
          height: 400px !important;
          max-height: 400px !important;
          min-height: 400px !important;
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.4s ease !important;
        }
        .blog-content iframe[src*="youtube"]:hover,
        .blog-content iframe[src*="youtu.be"]:hover {
          transform: translateY(-4px) scale(1.02) !important;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.08) !important;
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
        .blog-content .video-wrapper iframe,
        .blog-content .embed-responsive iframe,
        .blog-content .youtube-embed iframe,
        .blog-content .video-embed iframe,
        .blog-content .iframe-wrapper iframe {
          display: block !important;
          margin: 2.5rem auto !important;
          width: 700px !important;
          max-width: 700px !important;
          min-width: 700px !important;
          height: 400px !important;
          max-height: 400px !important;
          min-height: 400px !important;
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.04) !important;
        }
        @media (max-width: 768px) {
          .blog-content img,
          .blog-content * img,
          .blog-content video,
          .blog-content * video,
          .blog-content iframe,
          .blog-content * iframe,
          .blog-content iframe[src*="youtube"],
          .blog-content iframe[src*="youtu.be"],
          .blog-content iframe[src*="drive.google"],
          .blog-content iframe[src*="docs.google"],
          .blog-content iframe[src*="googleapis"],
          .blog-content *[src*="youtube"],
          .blog-content *[src*="youtu.be"],
          .blog-content *[src*="drive.google"],
          .blog-content .video-wrapper iframe,
          .blog-content .embed-responsive iframe,
          .blog-content .youtube-embed iframe,
          .blog-content .video-embed iframe,
          .blog-content .iframe-wrapper iframe {
            width: 500px !important;
            max-width: 500px !important;
            min-width: 500px !important;
            height: 300px !important;
            max-height: 300px !important;
            min-height: 300px !important;
            margin: 1.5rem auto !important;
          }
        }
        @media (max-width: 600px) {
          .blog-content img,
          .blog-content * img,
          .blog-content video,
          .blog-content * video,
          .blog-content iframe,
          .blog-content * iframe,
          .blog-content iframe[src*="youtube"],
          .blog-content iframe[src*="youtu.be"],
          .blog-content iframe[src*="drive.google"],
          .blog-content iframe[src*="docs.google"],
          .blog-content iframe[src*="googleapis"],
          .blog-content *[src*="youtube"],
          .blog-content *[src*="youtu.be"],
          .blog-content *[src*="drive.google"],
          .blog-content .video-wrapper iframe,
          .blog-content .embed-responsive iframe,
          .blog-content .youtube-embed iframe,
          .blog-content .video-embed iframe,
          .blog-content .iframe-wrapper iframe {
            width: 380px !important;
            max-width: 380px !important;
            min-width: 380px !important;
            height: 228px !important;
            max-height: 228px !important;
            min-height: 228px !important;
          }
        }
        @media (max-width: 400px) {
          .blog-content img,
          .blog-content * img,
          .blog-content video,
          .blog-content * video,
          .blog-content iframe,
          .blog-content * iframe,
          .blog-content iframe[src*="youtube"],
          .blog-content iframe[src*="youtu.be"],
          .blog-content iframe[src*="drive.google"],
          .blog-content iframe[src*="docs.google"],
          .blog-content iframe[src*="googleapis"],
          .blog-content *[src*="youtube"],
          .blog-content *[src*="youtu.be"],
          .blog-content *[src*="drive.google"],
          .blog-content .video-wrapper iframe,
          .blog-content .embed-responsive iframe,
          .blog-content .youtube-embed iframe,
          .blog-content .video-embed iframe,
          .blog-content .iframe-wrapper iframe {
            width: 320px !important;
            max-width: 320px !important;
            min-width: 320px !important;
            height: 192px !important;
            max-height: 192px !important;
            min-height: 192px !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full relative overflow-hidden max-h-[95vh] shadow-2xl">
          {/* Header with close button */}
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-[#2D9AA5]"></div>
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Blog Post
              </span>
            </div>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              onClick={onClose}
            >
              <X size={24} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
            <div className="px-8 py-6">
              {/* Blog Title */}
              <h1 className="text-4xl font-bold mb-6 text-gray-900 leading-tight text-center">
                {blog.title}
              </h1>

              {/* Author and Date Info */}
              <div className="flex items-center justify-center mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#2D9AA5] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {(blog.postedBy?.name || "A").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {blog.postedBy?.name || "Anonymous Author"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Published on{" "}
                      {new Date(blog.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hashtags/Topics Section */}
              {extractTopics(blog.content).length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {extractTopics(blog.content).map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      <Hash className="w-4 h-4" />
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Blog Content */}
              <div className="prose prose-lg max-w-none mb-8">
                <div className="blog-content text-gray-800 leading-relaxed space-y-4">
                  {parse(blog.content || "")}
                </div>
              </div>

              {/* Engagement Stats */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-xl">
                    <div className="w-8 h-8 bg-[#2D9AA5] rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {blog.likes?.length || 0} Likes
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-xl">
                    <div className="w-8 h-8 bg-[#2D9AA5] rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M21 6h-2l-2-2H7L5 6H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zM8 18H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V8h2v2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {blog.comments?.length || 0} Comments
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const BlogAnalytics: React.FC<Props> = ({ 
  tokenKey,
  permissions = {
    canRead: true,
    canUpdate: true,
    canDelete: true,
  }
}) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  // const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCommentsPopup, setShowCommentsPopup] = useState(false);
  const [popupBlog, setPopupBlog] = useState<Blog | null>(null);
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  // export state removed (unused)
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsBlog, setDetailsBlog] = useState<Blog | null>(null);
  const [, setDetailsLoading] = useState(false);
  const blogsPerPage = 12;
  const PRIMARY_COLOR = "#2D9AA5";

  const fetchBlogs = useCallback(async () => {
    // Don't fetch if no read permission
    if (!permissions.canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      setError("You must be logged in to view your blogs.");
      setLoading(false);
      return;
    }

    try {
      const [blogsRes, draftsRes] = await Promise.all([
        fetch("/api/blog/getAuthorCommentsAndLikes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/blog/draft", {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => status === 200 || status === 403,
        }),
      ]);

      const blogsData = await blogsRes.json();

      if (!blogsData.success) {
        if (blogsRes.status === 403) {
          setBlogs([]);
        } else {
          setError(blogsData.error || "Failed to fetch blogs");
        }
      } else {
        setBlogs(blogsData.blogs);
      }

      // Handle drafts
      if (draftsRes.status === 403) {
        setDrafts([]);
      } else {
        setDrafts(draftsRes.data?.drafts || draftsRes.data || []);
      }
    } catch {
      setError("Network error while fetching blogs");
    } finally {
      setLoading(false);
    }
  }, [tokenKey, permissions.canRead]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = blogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply date filter
    const now = new Date();
    switch (filterOption) {
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
    }

    // Apply sorting
    switch (sortOption) {
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
      case "most_liked":
        filtered.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case "most_commented":
        filtered.sort((a, b) => b.commentsCount - a.commentsCount);
        break;
    }

    setFilteredBlogs(filtered);
    setCurrentPage(1);
  }, [blogs, searchTerm, filterOption, sortOption]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  // Update popupBlog after add/delete comment/reply
  useEffect(() => {
    if (popupBlog) {
      // Find the latest version of the popupBlog from blogs
      const updated = blogs.find((b) => b._id === popupBlog._id);
      if (updated) setPopupBlog(updated);
    }
  }, [blogs, popupBlog]);

  // fetchBlogs moved above and memoized with useCallback

  const refreshData = async () => {
    setRefreshing(true);
    await fetchBlogs();
    setRefreshing(false);
  };

  // duplicate applyFiltersAndSort removed; memoized version is defined above

  // const exportData = async () => {
  //   setIsExporting(true);
  //   try {
  //     const data = {
  //       exportDate: new Date().toISOString(),
  //       summary: {
  //         totalBlogs: blogs.length,
  //         totalLikes: blogs.reduce((sum, blog) => sum + blog.likesCount, 0),
  //         totalComments: blogs.reduce(
  //           (sum, blog) => sum + blog.commentsCount,
  //           0
  //         ),
  //         avgEngagement:
  //           blogs.length > 0
  //             ? (
  //               blogs.reduce(
  //                 (sum, blog) => sum + blog.likesCount + blog.commentsCount,
  //                 0
  //               ) / blogs.length
  //             ).toFixed(2)
  //             : 0,
  //       },
  //       blogs: blogs.map((blog) => ({
  //         title: blog.title,
  //         createdAt: blog.createdAt,
  //         likesCount: blog.likesCount,
  //         commentsCount: blog.commentsCount,
  //         totalEngagement: blog.likesCount + blog.commentsCount,
  //         comments: blog.comments.map((comment) => ({
  //           username: comment.username,
  //           text: comment.text,
  //           createdAt: comment.createdAt,
  //           repliesCount: comment.replies?.length || 0,
  //         })),
  //       })),
  //     };

  //     const blob = new Blob([JSON.stringify(data, null, 2)], {
  //       type: "application/json",
  //     });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = `blog-analytics-${new Date().toISOString().split("T")[0]
  //       }.json`;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Export failed:", error);
  //     setError("Failed to export data");
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  const submitReply = async (
    blogId: string,
    commentId: string,
    text: string
  ) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setError("You must be logged in to reply.");
      return;
    }

    try {
      const res = await fetch("/api/blog/addReply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId, commentId, text }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to add reply");
      } else {
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments.map((comment) =>
                comment._id === commentId ? data.comment : comment
              ),
            };
          })
        );
      }
    } catch {
      setError("Network error while adding reply");
    }
  };

  const deleteComment = async (blogId: string, commentId: string) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setError("You must be logged in to delete a comment.");
      return;
    }

    try {
      const res = await fetch("/api/blog/deleteComment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blogId, commentId }),
      });

      const data = await res.json();
      if (data.success) {
        setBlogs((prevBlogs) =>
          prevBlogs.map((blog) => {
            if (blog._id !== blogId) return blog;
            return {
              ...blog,
              comments: blog.comments
                .filter((comment) => comment._id !== commentId)
                .map((comment) => ({
                  ...comment,
                  replies:
                    comment.replies?.filter((r) => r._id !== commentId) || [],
                })),
            };
          })
        );
      } else {
        setError(data.error || "Failed to delete comment");
      }
    } catch {
      setError("Network error while deleting comment");
    }
  };

  const openCommentsPopup = (blog: Blog) => {
    setPopupBlog(blog);
    setShowCommentsPopup(true);
  };

  const totalLikes = blogs.reduce((sum, blog) => sum + blog.likesCount, 0);
  const totalComments = blogs.reduce(
    (sum, blog) => sum + blog.commentsCount,
    0
  );
  const avgEngagementNumber =
    blogs.length > 0 ? (totalLikes + totalComments) / blogs.length : 0;
  const avgEngagement = avgEngagementNumber.toFixed(1);

  const chartData = [
    { name: 'Published', value: blogs.length, color: PRIMARY_COLOR },
    { name: 'Drafts', value: drafts.length, color: '#6B7280' }
  ];

  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const filterOptions = [
    { value: "all", label: "All Time", icon: Clock },
    { value: "today", label: "Today", icon: Calendar },
    { value: "week", label: "Last Week", icon: Calendar },
    { value: "month", label: "Last Month", icon: Calendar },
    { value: "year", label: "Last Year", icon: Calendar },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First", icon: SortDesc },
    { value: "oldest", label: "Oldest First", icon: SortAsc },
    { value: "most_liked", label: "Most Liked", icon: ThumbsUp },
    { value: "most_commented", label: "Most Commented", icon: MessageCircle },
  ];

  // Don't render content if no read permission
  if (!permissions.canRead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You do not have permission to view blog analytics.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator to request access to the Blog Analytics module.
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg border border-red-200 max-w-md">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-3 w-fit mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={fetchBlogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filter Controls */}
        <div className="mb-6 flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Calendar size={16} className="mr-2" />
              {
                filterOptions.find((opt) => opt.value === filterOption)
                  ?.label
              }
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterOption(option.value as FilterOption);
                      setShowFilterDropdown(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <option.icon size={16} className="mr-2" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Blogs"
            value={blogs.length}
            icon={<BarChart3 size={24} className="text-[#2D9AA5]" />}
            // trend="+12% from last month"
            trendUp={true}
          />
          <StatCard
            title="Total Likes"
            value={totalLikes}
            icon={<ThumbsUp size={24} className="text-[#2D9AA5]" />}
            // trend="+8% from last month"
            trendUp={true}
          />
          <StatCard
            title="Total Comments"
            value={totalComments}
            icon={<MessageCircle size={24} className="text-[#2D9AA5]" />}
            // trend="+15% from last month"
            trendUp={true}
          />
          <StatCard
            title="Avg Engagement"
            value={avgEngagement}
            icon={<Users size={24} className="text-[#2D9AA5]" />}
            // trend="+5% from last month"
            trendUp={true}
          />
        </div>

        {/* Blog Statistics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Blog Statistics</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${PRIMARY_COLOR}20` }}>
                  <BookOpen className="w-6 h-6" style={{ color: PRIMARY_COLOR }} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Published Blogs</p>
                  <p className="text-3xl font-bold text-gray-900">{blogs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Draft Blogs</p>
                  <p className="text-3xl font-bold text-gray-900">{drafts.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="mb-8">
          <EngagementChart
            totalLikes={totalLikes}
            totalComments={totalComments}
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search blogs by title..."
                className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Filter size={16} className="mr-2" />
                  Sort:{" "}
                  {sortOptions.find((opt) => opt.value === sortOption)?.label}
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortOption(option.value as SortOption);
                          setShowSortDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <option.icon size={16} className="mr-2" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                Showing {currentBlogs.length} of {filteredBlogs.length} blogs
              </span>
            </div>
          </div>
        </div>

        {/* Blog Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {currentBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                    {blog.title}
                  </h3>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1 text-blue-600">
                      <ThumbsUp size={16} />
                      <span className="text-sm font-medium">
                        {blog.likesCount}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600">
                      <MessageCircle size={16} />
                      <span className="text-sm font-medium">
                        {blog.commentsCount}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Engagement Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Engagement</span>
                    <span>{blog.likesCount + blog.commentsCount}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          ((blog.likesCount + blog.commentsCount) /
                            Math.max(totalLikes + totalComments, 100)) *
                          100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={async () => {
                        if (tokenKey === "adminToken") {
                          alert("Hit the API to show blog details");
                        } else {
                          const token = localStorage.getItem(tokenKey);
                          if (!token) {
                            alert(
                              "You must be logged in to view blog details."
                            );
                            return;
                          }
                          setDetailsLoading(true);
                          try {
                            const res = await fetch(
                              `/api/blog/published?id=${blog._id}`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            const data = await res.json();
                            if (data.success) {
                              setDetailsBlog(data.blog);
                              setDetailsModalOpen(true);
                            } else {
                              alert(
                                data.error || "Failed to fetch blog details"
                              );
                            }
                          } catch {
                            alert("Network error while fetching blog details");
                          } finally {
                            setDetailsLoading(false);
                          }
                        }
                      }}
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </button>
                    {blog.comments.length > 0 && (
                      <button
                        onClick={() => openCommentsPopup(blog)}
                        className="flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <MessageCircle size={14} className="mr-1" />
                        View All Comments
                      </button>
                    )}
                  </div>

                  {/* Performance Indicator */}
                  <div className="flex items-center">
                    {blog.likesCount + blog.commentsCount > avgEngagementNumber ? (
                      <div className="flex items-center text-green-600">
                        <TrendingUp size={14} className="mr-1" />
                        <span className="text-xs font-medium">High</span>
                      </div>
                    ) : blog.likesCount + blog.commentsCount >
                      avgEngagementNumber / 2 ? (
                      <div className="flex items-center text-yellow-600">
                        <TrendingUp size={14} className="mr-1" />
                        <span className="text-xs font-medium">Medium</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <TrendingUp size={14} className="mr-1 rotate-180" />
                        <span className="text-xs font-medium">Low</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Comments Preview */}
                {/* {blog.comments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <MessageCircle size={14} className="mr-1" />
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      {blog.comments.slice(0, 2).map((comment) => (
                        <div
                          key={comment._id}
                          className="bg-gray-50 rounded-lg p-2"
                        >
                          <div className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-medium">
                                {comment.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900">
                                {comment.username}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {comment.text}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(
                                  comment.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {blog.comments.length > 2 && (
                        <button
                          onClick={() => openCommentsPopup(blog)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          +{blog.comments.length - 2} more comments
                        </button>
                      )}
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstBlog + 1} to{" "}
                {Math.min(indexOfLastBlog, filteredBlogs.length)} of{" "}
                {filteredBlogs.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  Previous
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 hover:bg-gray-50 border border-gray-300"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredBlogs.length === 0 && !loading && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="bg-gray-100 rounded-full p-4 w-fit mx-auto mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterOption !== "all"
                ? "No blogs found"
                : "No blogs yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterOption !== "all"
                ? "Try adjusting your search terms or filters."
                : "Start creating blogs to see analytics here."}
            </p>
            {(searchTerm || filterOption !== "all") && (
              <div className="flex justify-center space-x-3">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
                {filterOption !== "all" && (
                  <button
                    onClick={() => setFilterOption("all")}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comments Popup */}
      {popupBlog && (
        <CommentsPopup
          blog={popupBlog}
          isOpen={showCommentsPopup}
          onClose={() => {
            setShowCommentsPopup(false);
            setPopupBlog(null);
          }}
          onReply={submitReply}
          onDelete={deleteComment}
          permissions={{
            canUpdate: permissions.canUpdate,
            canDelete: permissions.canDelete,
          }}
        />
      )}

      {/* Click outside to close dropdowns */}
      {(showFilterDropdown || showSortDropdown) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowFilterDropdown(false);
            setShowSortDropdown(false);
          }}
        />
      )}

      {/* Blog Details Modal */}
      <BlogDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        blog={detailsBlog}
      />
    </div>
  );
};

export default BlogAnalytics;
