"use client";

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/router';

import ModernBlogEditor from '../../components/ModernBlogEditor';

import SocialMediaShare from '../../components/SocialMediaShare';

import axios from 'axios';

import {

  PlusCircle,

  Search,

  Heart,

  MessageCircle,

  Bookmark,

  Edit3,

  Trash2,

  Eye,

  Clock,

  User,

  Hash,

  Sparkles,

  Flame,

  BarChart3,

  ExternalLink,

  X,

  Link as LinkIcon,

  RefreshCw,

  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useAgentPermissions } from '../../hooks/useAgentPermissions';



type TabType = 'feed' | 'published' | 'drafts' | 'trending' | 'analytics';

type CommentType = {

  _id: string;

  user?: string;

  username: string;

  text: string;

  createdAt: string;

  replies?: Array<{

    _id: string;

    user?: string;

    username: string;

    text: string;

    createdAt: string;

  }>;

};



type PostType = {

  _id: string;

  title: string;

  content: string;

  paramlink: string;

  createdAt: string;

  status?: 'draft' | 'published';

  postedBy?: {

    name?: string;

    username?: string;

    email?: string;

  } | string;

  likes?: number;

  likesCount?: number;

  likesArray?: string[];

  liked?: boolean;

  comments?: number;

  commentsCount?: number;

  commentsArray?: CommentType[];

  views?: number;

};



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

    const value = localStorage.getItem(key) || sessionStorage.getItem(key);

    if (value) return value;

  }

  return null;

};



function ModernBlogForm() {

  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [editBlogId, setEditBlogId] = useState<string | null>(null);

  const [editDraftId, setEditDraftId] = useState<string | null>(null);

  const [publishedPosts, setPublishedPosts] = useState<PostType[]>([]);

  const [draftPosts, setDraftPosts] = useState<PostType[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const [selectedPostForComments, setSelectedPostForComments] = useState<PostType | null>(null);

  const [newComment, setNewComment] = useState('');

  const [commenting, setCommenting] = useState(false);

  const [showEditUrlModal, setShowEditUrlModal] = useState(false);

  const [editUrlPost, setEditUrlPost] = useState<PostType | null>(null);

  const [editUrlTitle, setEditUrlTitle] = useState('');

  const [editUrlParamlink, setEditUrlParamlink] = useState('');

  const [editUrlError, setEditUrlError] = useState('');

  const [showPostDetailModal, setShowPostDetailModal] = useState(false);

  const [selectedPostDetail, setSelectedPostDetail] = useState<PostType | null>(null);

  const [permissions, setPermissions] = useState({

    canCreate: true, // Default to true for clinic/doctor/admin

    canReadPublished: true, // Default to true for clinic/doctor/admin

    canUpdatePublished: true, // Default to true for clinic/doctor/admin

    canDeletePublished: true, // Default to true for clinic/doctor/admin

    canReadAnalytics: true, // Default to true for clinic/doctor/admin

  });

  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  const [hasAgentToken, setHasAgentToken] = useState(false);

  const [isAgentRoute, setIsAgentRoute] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);



  const tokenKey = isAgentRoute ? "agentToken" : "clinicToken";

  // Helper function to get user role from token
  const getUserRole = (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      for (const key of TOKEN_PRIORITY) {
        const token = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            return decoded.role || decoded.userRole || null;
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user role:", error);
    }
    return null;
  };

  useEffect(() => {

    const getCurrentUserId = async () => {

      try {

        const token = localStorage.getItem(tokenKey);

        if (!token) return;

        

        const base64Url = token.split('.')[1];

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const jsonPayload = decodeURIComponent(

          atob(base64)

            .split('')

            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))

            .join('')

        );

        const decoded = JSON.parse(jsonPayload);

        setCurrentUserId(decoded.userId || decoded._id || null);

      } catch (error) {

        console.error('Error getting user ID:', error);

      }

    };

    getCurrentUserId();

  }, [tokenKey]);



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

    const agentPath =

      router?.pathname?.startsWith("/agent/") ||

      window.location.pathname?.startsWith("/agent/");

    setIsAgentRoute(agentPath && hasAgentToken);

  }, [router.pathname, hasAgentToken]);



  const agentPermissionsHook: any = useAgentPermissions(isAgentRoute ? "clinic_write_blog" : null);

  const agentPermissions = agentPermissionsHook?.permissions || {

    canCreate: false,

    canRead: false,

    canUpdate: false,

    canDelete: false,

    canAll: false,

  };

  const agentPermissionsLoading = agentPermissionsHook?.loading || false;



  useEffect(() => {

    if (!isAgentRoute) return;

    if (agentPermissionsLoading) return;

    

    setPermissions({

      canCreate: Boolean(agentPermissions.canAll || agentPermissions.canCreate),

      canReadPublished: Boolean(agentPermissions.canAll || agentPermissions.canRead),

      canUpdatePublished: Boolean(agentPermissions.canAll || agentPermissions.canUpdate),

      canDeletePublished: Boolean(agentPermissions.canAll || agentPermissions.canDelete),

      canReadAnalytics: Boolean(agentPermissions.canAll || agentPermissions.canRead),

    });

    setPermissionsLoaded(true);

  }, [isAgentRoute, agentPermissions, agentPermissionsLoading]);



  useEffect(() => {

    if (isAgentRoute) return;

    let isMounted = true;

    const token = getStoredToken();
    const agentToken = localStorage.getItem("agentToken");
    const userRole = getUserRole();

    // ✅ For admin role, grant full access (bypass permission checks)
    if (userRole === "admin") {
      setPermissions({
        canCreate: true,
        canReadPublished: true,
        canUpdatePublished: true,
        canDeletePublished: true,
        canReadAnalytics: true,
      });
      setPermissionsLoaded(true);
      return; // Skip API calls for admin role
    }

    // ✅ For clinic and doctor roles, fetch admin-level permissions from /api/clinic/sidebar-permissions
    if (userRole === "clinic" || userRole === "doctor") {
      const fetchClinicPermissions = async () => {
        try {
          if (!token) {
            if (!isMounted) return;
            setPermissions({
              canCreate: false,
              canReadPublished: false,
              canUpdatePublished: false,
              canDeletePublished: false,
              canReadAnalytics: false,
            });
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
                canCreate: true,
                canReadPublished: true,
                canUpdatePublished: true,
                canDeletePublished: true,
                canReadAnalytics: true,
              });
            } else {
              // Admin has set permissions - check the clinic_write_blog module
              const modulePermission = res.data.permissions.find((p: any) => {
                if (!p?.module) return false;
                // Check for clinic_write_blog module
                if (p.module === "clinic_write_blog") return true;
                if (p.module === "write_blog") return true;
                if (p.module === "blog") return true;
                return false;
              });

              if (modulePermission) {
                const actions = modulePermission.actions || {};
                
                // Check if "all" is true, which grants all permissions
                const moduleAll = actions.all === true || actions.all === "true" || String(actions.all).toLowerCase() === "true";
                const moduleCreate = actions.create === true || actions.create === "true" || String(actions.create).toLowerCase() === "true";
                const moduleRead = actions.read === true || actions.read === "true" || String(actions.read).toLowerCase() === "true";
                const moduleUpdate = actions.update === true || actions.update === "true" || String(actions.update).toLowerCase() === "true";
                const moduleDelete = actions.delete === true || actions.delete === "true" || String(actions.delete).toLowerCase() === "true";

                setPermissions({
                  canCreate: moduleAll || moduleCreate,
                  canReadPublished: moduleAll || moduleRead,
                  canUpdatePublished: moduleAll || moduleUpdate,
                  canDeletePublished: moduleAll || moduleDelete,
                  canReadAnalytics: moduleAll || moduleRead,
                });
              } else {
                // Module permission not found in the permissions array - default to read-only
                setPermissions({
                  canCreate: false,
                  canReadPublished: true, // Clinic/doctor can always read their own data
                  canUpdatePublished: false,
                  canDeletePublished: false,
                  canReadAnalytics: true,
                });
              }
            }
          } else {
            // API response doesn't have permissions, default to full access (backward compatibility)
            setPermissions({
              canCreate: true,
              canReadPublished: true,
              canUpdatePublished: true,
              canDeletePublished: true,
              canReadAnalytics: true,
            });
          }
        } catch (err: any) {
          console.error("Error fetching clinic sidebar permissions:", err);
          // On error, default to full access (backward compatibility)
          if (isMounted) {
            setPermissions({
              canCreate: true,
              canReadPublished: true,
              canUpdatePublished: true,
              canDeletePublished: true,
              canReadAnalytics: true,
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

    // For agent/doctorStaff on clinic routes, use agent permissions API
    if (agentToken) {
      const fetchAgentPermissions = async () => {
        try {
          setPermissionsLoaded(false);
          // Use agent permissions API for agent/doctorStaff
          const res = await axios.get("/api/agent/get-module-permissions", {
            params: { moduleKey: "clinic_write_blog" },
            headers: { Authorization: `Bearer ${agentToken}` }
          });
          const data = res.data;
          
          if (!isMounted) return;
          
          // Use correct response structure - data.permissions.actions
          // API already normalizes actions to booleans
          if (data.success && data.permissions) {
            const moduleActions = data.permissions.actions || {};
            const hasAllPermission = moduleActions.all === true;
            
            // Check both boolean true and string "true" for safety
            const checkAction = (action: any) => {
              return hasAllPermission || action === true || action === "true" || String(action).toLowerCase() === "true";
            };
            
            const newPermissions = {
              canCreate: checkAction(moduleActions.create),
              canReadPublished: checkAction(moduleActions.read),
              canUpdatePublished: checkAction(moduleActions.update),
              canDeletePublished: checkAction(moduleActions.delete),
              canReadAnalytics: checkAction(moduleActions.read),
            };
            
            console.log('[BlogForm] Agent permissions fetched:', {
              moduleActions,
              hasAllPermission,
              newPermissions,
              canReadPublished: newPermissions.canReadPublished,
              readAction: moduleActions.read,
              readType: typeof moduleActions.read,
              rawResponse: data
            });
            
            if (isMounted) {
              setPermissions(newPermissions);
              console.log('[BlogForm] Permissions set in state:', newPermissions);
            }
          } else {
            console.warn('No permissions found in response:', data);
            if (isMounted) {
              setPermissions({
                canCreate: false,
                canReadPublished: false,
                canUpdatePublished: false,
                canDeletePublished: false,
        canReadAnalytics: false,
              });
            }
          }
        } catch (err) {
          console.error("Error fetching agent permissions:", err);
          if (isMounted) {
            setPermissions({
              canCreate: false,
              canReadPublished: false,
              canUpdatePublished: false,
              canDeletePublished: false,
              canReadAnalytics: false,
            });
          }
        } finally {
          if (isMounted) {
      setPermissionsLoaded(true);
          }
        }
      };

      fetchAgentPermissions();
      return () => { isMounted = false; };
    }

    // For other roles (if any), use clinic permissions API
    if (!token) {
      setPermissions({
        canCreate: false,
        canReadPublished: false,
        canUpdatePublished: false,
        canDeletePublished: false,
        canReadAnalytics: false,
      });
      setPermissionsLoaded(true);
      return;
    }

    const fetchClinicPermissions = async () => {

      try {

        setPermissionsLoaded(false);

        const res = await axios.get("/api/clinic/permissions", {

          headers: { Authorization: `Bearer ${token}` }

        });

        const data = res.data;

        

        if (!isMounted) return;

        if (data.success && data.data) {

          const modulePermission = data.data.permissions?.find((p: any) => {

            if (!p?.module) return false;

            const moduleKey = p.module || "";

            const normalizedModule = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, "");

            return normalizedModule === "write_blog" || moduleKey === "write_blog" || 

                   moduleKey === "clinic_write_blog" || moduleKey === "doctor_write_blog" ||

                   normalizedModule === "blogs" || moduleKey === "blogs" || moduleKey === "clinic_blogs";

          });

          

          if (modulePermission) {

            const actions = modulePermission.actions || {};

            const isTrue = (value: any) => {

              if (value === true) return true;

              if (value === "true") return true;

              if (String(value).toLowerCase() === "true") return true;

              return false;

            };



            const moduleAll = isTrue(actions.all);

            const moduleCreate = isTrue(actions.create);

            const moduleRead = isTrue(actions.read);

            const moduleUpdate = isTrue(actions.update);

            const moduleDelete = isTrue(actions.delete);

            

            if (isMounted) {

              setPermissions({

                canCreate: moduleAll || moduleCreate,

                canReadPublished: moduleAll || moduleRead,

                canUpdatePublished: moduleAll || moduleUpdate,

                canDeletePublished: moduleAll || moduleDelete,

                canReadAnalytics: moduleAll || moduleRead,

              });

            }

          } else {

            const hasAnyPermissions = data.data.permissions && data.data.permissions.length > 0;

            if (isMounted) {

              setPermissions({

                canCreate: !hasAnyPermissions,

                canReadPublished: !hasAnyPermissions,

                canUpdatePublished: !hasAnyPermissions,

                canDeletePublished: !hasAnyPermissions,

                canReadAnalytics: !hasAnyPermissions,

              });

            }

          }

        }

      } catch (err: any) {

        console.error("Error fetching permissions:", err);

      } finally {

        if (isMounted) {

          setPermissionsLoaded(true);

        }

      }

    };



    fetchClinicPermissions();

    return () => { isMounted = false; };

  }, [isAgentRoute, hasAgentToken]);



  const getAuthHeaders = () => {
    // For agent/doctorStaff, prioritize agentToken even on clinic routes
    const agentToken = localStorage.getItem("agentToken");
    const token = agentToken || localStorage.getItem(tokenKey);

    return { headers: { Authorization: `Bearer ${token}` } };
  };



  const sanitizePost = (post: any): PostType | null => {

    if (!post || typeof post !== 'object') return null;

    

    let postedBy: PostType['postedBy'] = 'Anonymous';

    if (post.postedBy) {

      if (typeof post.postedBy === 'string') {

        postedBy = post.postedBy;

      } else if (typeof post.postedBy === 'object') {

        postedBy = {

          name: String(post.postedBy.name || post.postedBy.username || ''),

          username: String(post.postedBy.username || ''),

          email: String(post.postedBy.email || ''),

        };

      }

    }



    const likesArray = Array.isArray(post.likes) ? post.likes.map(String) : [];

    const likesCount = post.likesCount || (Array.isArray(post.likes) ? post.likes.length : 0);

    const liked = currentUserId ? likesArray.includes(currentUserId) : false;



    const commentsArray = Array.isArray(post.comments) 

      ? post.comments.map((c: any) => ({

          _id: String(c._id || ''),

          user: c.user ? String(c.user) : undefined,

          username: String(c.username || 'Anonymous'),

          text: String(c.text || ''),

          createdAt: String(c.createdAt || ''),

          replies: Array.isArray(c.replies) 

            ? c.replies.map((r: any) => ({

                _id: String(r._id || ''),

                user: r.user ? String(r.user) : undefined,

                username: String(r.username || 'Anonymous'),

                text: String(r.text || ''),

                createdAt: String(r.createdAt || ''),

              }))

            : [],

        }))

      : [];

    const commentsCount = post.commentsCount || (Array.isArray(post.comments) ? post.comments.length : 0);



    return {

      _id: String(post._id || ''),

      title: String(post.title || ''),

      content: String(post.content || ''),

      paramlink: String(post.paramlink || ''),

      createdAt: String(post.createdAt || new Date().toISOString()),

      status: post.status === 'draft' ? 'draft' : 'published',

      postedBy,

      likes: likesCount,

      likesCount,

      likesArray,

      liked,

      comments: commentsCount,

      commentsCount,

      commentsArray,

      views: typeof post.views === 'number' ? post.views : 0,

    };

  };



  const loadPosts = async (showRefreshIndicator = false) => {

    console.log('[BlogForm] loadPosts called. canReadPublished:', permissions.canReadPublished);

    // ✅ For clinic/doctor/admin roles, always allow loading posts (bypass permission check)
    const userRole = getUserRole();
    const shouldLoadPosts = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canReadPublished;

    if (!shouldLoadPosts) {

      console.log('[BlogForm] loadPosts returning early - no read permission');
      setLoading(false);

      setIsRefreshing(false);

      return;

    }

    console.log('[BlogForm] loadPosts proceeding to fetch blogs');



    try {

      if (showRefreshIndicator) {

        setIsRefreshing(true);

      } else {

        setLoading(true);

      }

      const [publishedRes, draftsRes] = await Promise.all([

        axios.get("/api/blog/published", {

          ...getAuthHeaders(),

          validateStatus: (status) => status === 200 || status === 403,

        }),

        axios.get("/api/blog/draft", {

          ...getAuthHeaders(),

          validateStatus: (status) => status === 200 || status === 403,

        }),

      ]);



      let publishedPostsData: PostType[] = [];

      if (publishedRes.status === 200) {

        const blogs = publishedRes.data?.blogs || publishedRes.data || [];

        const sanitized = Array.isArray(blogs)

          ? blogs.map(sanitizePost).filter((p): p is PostType => p !== null)

          : [];

        publishedPostsData = sanitized;

        setPublishedPosts(publishedPostsData);

      }

      

      if (draftsRes.status === 200) {

        const drafts = draftsRes.data?.drafts || draftsRes.data || [];

        const publishedIds = new Set(

          publishedPostsData.map((p) => p._id)

        );

        

        const sanitized = Array.isArray(drafts)

          ? drafts

              .map(sanitizePost)

              .filter((p): p is PostType => p !== null)

              .filter((p) => {

                const isDraftStatus = p.status === 'draft' || (!p.status && p.status !== 'published');

                const notInPublished = !publishedIds.has(p._id);

                const notPublishedStatus = p.status !== 'published';

                return isDraftStatus && notInPublished && notPublishedStatus;

              })

          : [];

        setDraftPosts(sanitized);

      }

    } catch (error) {

      console.error('Error loading posts:', error);

    } finally {

      setLoading(false);

      setIsRefreshing(false);

    }

  };



  const handleRefresh = async () => {

    await loadPosts(true);

  };



  useEffect(() => {

    if (permissionsLoaded) {
      console.log('[BlogForm] Permissions loaded, calling loadPosts. canReadPublished:', permissions.canReadPublished, 'permissions:', permissions);
      // ✅ For clinic/doctor/admin roles, always load posts (bypass permission check)
      const userRole = getUserRole();
      const shouldLoadPosts = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canReadPublished;
      if (shouldLoadPosts) {
      loadPosts();
      } else {
        console.log('[BlogForm] Skipping loadPosts - no read permission');
        setLoading(false);
      }
    }

  }, [permissionsLoaded, permissions.canReadPublished, currentUserId]);

  // Scroll to top when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showPostDetailModal) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore scroll position and body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showPostDetailModal]);



  const loadAnalytics = async () => {

    // ✅ For clinic/doctor/admin roles, always allow loading analytics (bypass permission check)
    const userRole = getUserRole();
    const canReadAnalytics = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canReadAnalytics;

    if (!canReadAnalytics) {

      return;

    }



    try {

      setAnalyticsLoading(true);

      const res = await axios.get("/api/blog/getAuthorCommentsAndLikes", {

        ...getAuthHeaders(),

        validateStatus: (status) => status === 200 || status === 403,

      });



      if (res.status === 200 && res.data.success) {

        setAnalyticsData(res.data);

      }

    } catch (error) {

      console.error('Error loading analytics:', error);

    } finally {

      setAnalyticsLoading(false);

    }

  };



  useEffect(() => {

    // ✅ For clinic/doctor/admin roles, always allow loading analytics (bypass permission check)
    const userRole = getUserRole();
    const canReadAnalytics = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canReadAnalytics;

    if (activeTab === 'analytics' && permissionsLoaded && canReadAnalytics) {

      loadAnalytics();

    }

  }, [activeTab, permissionsLoaded, permissions.canReadAnalytics]);



  useEffect(() => {

    if (publishedPosts.length > 0 && draftPosts.length > 0) {

      const publishedIds = new Set(publishedPosts.map(p => p._id));

      setDraftPosts(prevDrafts => 

        prevDrafts.filter(draft => !publishedIds.has(draft._id))

      );

    }

  }, [publishedPosts]);

  // Reset pagination when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Handle page bounds - ensure current page is valid
  useEffect(() => {
    // Calculate publishedPostIds inside useEffect to avoid initialization order issues
    const publishedPostIdsSet = new Set(publishedPosts.map(p => p._id));
    
    // Use allPosts directly instead of filteredPosts to avoid initialization order issues
    const allPostsToShow = [...publishedPosts, ...draftPosts].filter(post => {
      if (activeTab === 'feed') return true;
      if (activeTab === 'published') return post.status === 'published';
      if (activeTab === 'drafts') {
        const isDraft = post.status === 'draft' || (!post.status && !publishedPostIdsSet.has(post._id));
        const notPublished = !publishedPostIdsSet.has(post._id);
        return isDraft && notPublished;
      }
      if (activeTab === 'trending') {
        if (post.status !== 'published') return false;
        const likesCount = post.likesCount || post.likes || 0;
        const commentsCount = post.commentsCount || (Array.isArray(post.comments) ? post.comments.length : 0) || 0;
        return (likesCount + commentsCount) > 0;
      }
      return false;
    });
    const totalPages = Math.ceil(allPostsToShow.length / postsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [publishedPosts, draftPosts, activeTab, currentPage, postsPerPage]);



  const handleCreatePost = () => {

    if (!permissions.canCreate) {

      alert("You do not have permission to create blogs");

      return;

    }

    setEditBlogId(null);

    setEditDraftId(null);

    setIsEditorOpen(true);

  };



  const handleEditPost = (postId: string, type: 'published' | 'drafts') => {

    if (type === 'published') {

      setEditBlogId(postId);

      setEditDraftId(null);

    } else {

      setEditDraftId(postId);

      setEditBlogId(null);

    }

    setIsEditorOpen(true);

  };



  const handleDeletePost = async (postId: string, type: 'published' | 'drafts') => {

    if (!confirm('Are you sure you want to delete this post?')) return;

    

    try {

      await axios.delete(

        `/api/blog/${type === 'published' ? 'published' : 'draft'}?id=${postId}`,

        getAuthHeaders()

      );

      loadPosts();
      
      // Show success modal after deletion
      setShowDeleteSuccessModal(true);

    } catch (error) {

      console.error('Error deleting post:', error);

      alert('Failed to delete post');

    }

  };



  const handleLike = async (postId: string) => {

    if (!currentUserId) {

      alert('Please login to like posts');

      return;

    }



    try {

      const res = await axios.post(

        '/api/blog/likeBlog',

        { blogId: postId },

        getAuthHeaders()

      );



      if (res.data.success) {

        setPublishedPosts(prev => prev.map(post => 

          post._id === postId 

            ? { 

                ...post, 

                likesCount: res.data.likesCount,

                liked: res.data.liked,

                likes: res.data.likesCount

              }

            : post

        ));

      }

    } catch (error: any) {

      console.error('Error liking post:', error);

      alert(error.response?.data?.error || 'Failed to like post');

    }

  };



  const handleAddComment = async (postId: string) => {

    if (!newComment.trim()) return;

    if (!currentUserId) {

      alert('Please login to comment');

      return;

    }



    setCommenting(true);

    try {

      const res = await axios.post(

        '/api/blog/addComment',

        { blogId: postId, text: newComment.trim() },

        getAuthHeaders()

      );



      if (res.data.success) {

        setPublishedPosts(prev => prev.map(post => 

          post._id === postId 

            ? { 

                ...post, 

                commentsCount: res.data.commentsCount,

                comments: res.data.commentsCount,

                commentsArray: [...(post.commentsArray || []), res.data.comment]

              }

            : post

        ));

        setNewComment('');

        if (selectedPostForComments?._id === postId) {

          setSelectedPostForComments(prev => prev ? {

            ...prev,

            commentsCount: res.data.commentsCount,

            comments: res.data.commentsCount,

            commentsArray: [...(prev.commentsArray || []), res.data.comment]

          } : null);

        }

      }

    } catch (error: any) {

      console.error('Error adding comment:', error);

      alert(error.response?.data?.error || 'Failed to add comment');

    } finally {

      setCommenting(false);

    }

  };



  const openCommentsModal = (post: PostType) => {

    setSelectedPostForComments(post);

    setShowCommentsModal(true);

  };



  const handleEditUrl = (post: PostType) => {

    setEditUrlPost(post);

    setEditUrlTitle(post.title);

    setEditUrlParamlink(post.paramlink);

    setEditUrlError('');

    setShowEditUrlModal(true);

  };



  const handleSaveUrl = async () => {

    if (!editUrlPost || !editUrlTitle || !editUrlParamlink) {

      setEditUrlError('Title and URL slug are required');

      return;

    }



    try {

      await axios.put(

        `/api/blog/published?id=${editUrlPost._id}`,

        { 

          title: editUrlTitle, 

          paramlink: editUrlParamlink, 

          content: editUrlPost.content 

        },

        getAuthHeaders()

      );

      

      setPublishedPosts(prev => prev.map(post => 

        post._id === editUrlPost._id 

          ? { ...post, title: editUrlTitle, paramlink: editUrlParamlink }

          : post

      ));

      

      setShowEditUrlModal(false);

      setEditUrlPost(null);

      alert('Blog URL updated successfully!');

    } catch (error: any) {

      if (error.response?.data?.message?.includes('Paramlink already exists')) {

        setEditUrlError('URL slug already exists. Please choose another.');

      } else {

        setEditUrlError('Failed to update blog URL');

      }

    }

  };



  const slugify = (text: string) => {

    return text

      .toString()

      .toLowerCase()

      .trim()

      .replace(/\s+/g, '-')

      .replace(/[^a-z0-9-]/g, '')

      .replace(/-+/g, '-');

  };



  const extractFirstImage = (html: string | undefined): string | null => {

    if (!html || typeof html !== 'string') return null;

    // Try multiple patterns to catch different image formats
    // Pattern 1: src="..."
    let match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match && match[1]) {
      const url = match[1].trim();
      // Validate URL - must be a valid image URL
      if (url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:image'))) {
        return url;
      }
    }

    // Pattern 2: src=... (without quotes)
    match = html.match(/<img[^>]+src=([^\s>]+)/i);
    if (match && match[1]) {
      const url = match[1].trim().replace(/["']/g, '');
      if (url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:image'))) {
        return url;
      }
    }

    // Pattern 3: Look for any img tag and extract src attribute
    const imgTagMatch = html.match(/<img[^>]*>/i);
    if (imgTagMatch) {
      const imgTag = imgTagMatch[0];
      const srcMatch = imgTag.match(/src=["']?([^"'\s>]+)["']?/i);
      if (srcMatch && srcMatch[1]) {
        const url = srcMatch[1].trim();
        if (url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:image'))) {
          return url;
        }
      }
    }

    return null;

  };



  const extractText = (html: string | undefined, maxLength: number = 150): string => {

    if (!html || typeof html !== 'string') return '';

    const text = html.replace(/<[^>]*>/g, '').trim();

    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

  };



  const extractTopics = (content: string | undefined): string[] => {

    if (!content || typeof content !== 'string') return [];

    const hashtagRegex = /#(\w+)/g;

    const matches = content.match(hashtagRegex);

    return matches ? matches.map(m => m.substring(1)) : [];

  };



  const getBaseUrl = () => {

    if (typeof window !== "undefined") {

      const origin = window.location.origin;

      return origin.includes("localhost") ? process.env.NEXT_PUBLIC_BASE_URL : "https://zeva360.com";

    }

    return "";

  };



  const formatDate = (dateString: string | undefined) => {

    if (!dateString || typeof dateString !== 'string') return 'Recently';

    try {

      const date = new Date(dateString);

      if (isNaN(date.getTime())) return 'Recently';

      const now = new Date();

      const diff = now.getTime() - date.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      

      if (days === 0) return 'Today';

      if (days === 1) return 'Yesterday';

      if (days < 7) return `${days} days ago`;

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    } catch {

      return 'Recently';

    }

  };



  const PostCard = ({ post, type }: { post: PostType; type: 'published' | 'drafts' }) => {

    if (!post || !post._id || !post.title) {

      return <div>Invalid post data</div>;

    }

    

    const rawImageUrl = extractFirstImage(post.content);
    // Process image URL - convert relative URLs to absolute
    const imageUrl = rawImageUrl ? (() => {
      // If it's already an absolute URL (http/https), return as is
      if (rawImageUrl.startsWith('http://') || rawImageUrl.startsWith('https://')) {
        return rawImageUrl;
      }
      // If it's a data URI, return as is
      if (rawImageUrl.startsWith('data:image')) {
        return rawImageUrl;
      }
      // If it starts with /, it's a relative path - prepend base URL
      if (rawImageUrl.startsWith('/')) {
        return `${getBaseUrl()}${rawImageUrl}`;
      }
      // Otherwise, assume it's a relative path and prepend base URL with /
      return `${getBaseUrl()}/${rawImageUrl}`;
    })() : null;

    const excerpt = extractText(post.content);

    const topics = extractTopics(post.content);

    

    const getAuthorName = (): string => {

      if (!post.postedBy) return 'Anonymous';

      if (typeof post.postedBy === 'string') {

        return post.postedBy || 'Anonymous';

      }

      if (typeof post.postedBy === 'object' && post.postedBy !== null) {

        const name = post.postedBy.name || post.postedBy.username || '';

        return String(name) || 'Anonymous';

      }

      return 'Anonymous';

    };

    

    const authorName = getAuthorName();

    const safeTitle = String(post.title || 'Untitled');

    const safeExcerpt = String(excerpt || '');

    const safeDate = formatDate(post.createdAt);

    

    return (

      <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 flex flex-col">
        {/* Always show image container with fixed height */}
        <div className="relative h-32 sm:h-36 overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex-shrink-0">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  // Hide image if it fails to load and show placeholder
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const container = target.parentElement;
                  if (container) {
                    const placeholder = container.querySelector('.no-image-placeholder');
                    if (placeholder) {
                      (placeholder as HTMLElement).style.display = 'flex';
                    }
                  }
                }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="no-image-placeholder absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs sm:text-sm text-gray-500">No Image</span>
            </div>
          )}
          {type === 'drafts' && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-amber-500/95 backdrop-blur-sm text-white rounded-full text-xs font-bold shadow-lg">
              Draft
            </div>
          )}
        </div>

        

        <div className="p-4 overflow-hidden flex-1 flex flex-col min-h-[200px]">
          {topics.length > 0 && (

            <div className="flex flex-wrap gap-1.5 mb-2">
              {topics.slice(0, 3).map((topic) => (

                <span

                  key={topic}

                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 rounded-full text-xs font-semibold border border-cyan-100"
                >

                  <Hash className="w-2.5 h-2.5" />

                  {topic}
                </span>

              ))}

            </div>

          )}



          <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-cyan-600 transition-colors leading-tight">
            {safeTitle}

          </h2>



          <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
            {safeExcerpt}

          </p>



          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-md">
                <User className="w-4 h-4 text-white" />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-900">{authorName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">

                  <Clock className="w-3 h-3" />
                  {safeDate}
                </p>

              </div>

            </div>

          </div>



          {/* Action Icons in Single Row */}
          <div className="flex items-center justify-between pt-2 gap-1 min-w-0">
            {/* Left: Like, Comment, Share, Preview, Views */}
            <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
              {type === 'published' && (

                <>

                  <button 

                    onClick={() => handleLike(post._id)}

                    className={`flex items-center gap-1 p-1.5 rounded-md transition-all hover:scale-110 flex-shrink-0 ${
                      post.liked 

                        ? 'text-rose-600 bg-rose-50' 
                        : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50'
                    }`}

                    title="Like"
                  >

                    <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium">{Number(post.likesCount || post.likes) || 0}</span>
                  </button>

                  <button 

                    onClick={() => openCommentsModal(post)}

                    className="flex items-center gap-1 p-1.5 rounded-md text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all hover:scale-110 flex-shrink-0"
                    title="Comments"
                  >

                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{Number(post.commentsCount || post.comments) || 0}</span>
                  </button>

                  <div className="p-0 flex-shrink-0">
                    <SocialMediaShare
                      blogTitle={safeTitle}
                      blogUrl={`${getBaseUrl()}/blogs/${post.paramlink}`}
                      blogDescription={safeExcerpt}
                      triggerClassName="p-1.5 rounded-md text-green-500 hover:text-green-600 hover:bg-cyan-50 transition-all hover:scale-110 flex items-center flex-shrink-0"
                    />
                  </div>
                  {/* <button
                    onClick={() => {
                      setSelectedPostDetail(post);
                      setShowPostDetailModal(true);
                    }}
                    className="p-1.5 rounded-md text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all hover:scale-110 flex-shrink-0"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button> */}
{/* 
                  <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{Number(post.views) || 0}</span>
                  </div> */}
                </>

              )}

            </div>

            

            {/* Right: Edit, Link, External, Delete */}

            <div className="flex items-center gap-0.5 flex-shrink-0">


            <button
                    onClick={() => {
                      setSelectedPostDetail(post);
                      setShowPostDetailModal(true);
                    }}
                    className="p-1.5 rounded-md text-cyan-600 hover:text-cyan-600 hover:bg-cyan-50 transition-all hover:scale-110 flex-shrink-0"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>


              {permissions.canUpdatePublished && (
                <button
                  onClick={() => handleEditPost(post._id, type)}
                  className="p-1 hover:bg-cyan-50 rounded-md transition-all hover:scale-105 text-cyan-600 flex-shrink-0"
                  title="Edit"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {type === 'published' && (

                <>

                  {permissions.canUpdatePublished && (
                    <button
                      onClick={() => handleEditUrl(post)}
                      className="p-1 hover:bg-cyan-50 rounded-md transition-all hover:scale-105 text-cyan-600 flex-shrink-0"
                      title="Edit URL"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a

                    href={`${getBaseUrl()}/blogs/${post.paramlink}`}

                    target="_blank"

                    rel="noopener noreferrer"

                    className="p-1 hover:bg-cyan-50 rounded-md transition-all hover:scale-105 text-cyan-600 flex-shrink-0"
                    title="Open in New Tab"

                  >

                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>

              )}

              {permissions.canDeletePublished && (
                <button
                  onClick={() => handleDeletePost(post._id, type)}
                  className="p-1 hover:bg-rose-50 rounded-md transition-all hover:scale-105 text-rose-600 flex-shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

            </div>

          </div>

        </div>

      </article>

    );

  };



  if (!permissionsLoaded) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600"></div>
          <p className="text-cyan-700 text-base font-semibold">Loading your workspace...</p>
        </div>

      </div>

    );

  }

  const publishedPostIds = new Set(publishedPosts.map(p => p._id));



  const allPosts = [...publishedPosts, ...draftPosts]

    .filter(post => post && typeof post === 'object' && post._id && post.title)
    .sort((a, b) => 

      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

    );



  const filteredPosts = (() => {
    if (!searchQuery.trim()) {
      return allPosts;
    }

    const query = searchQuery.toLowerCase().trim();
    const matchingPosts = allPosts.filter(post => {
      if (!post || !post.title || !post.content) return false;

      const title = String(post.title).toLowerCase();
      const content = String(post.content).toLowerCase();

      return title.includes(query) || content.includes(query);
    });

    // Sort by relevance: title matches first, then content matches
    return matchingPosts.sort((a, b) => {
      const aTitle = String(a.title).toLowerCase();
      const bTitle = String(b.title).toLowerCase();

      // Title matches get priority
      const aTitleMatch = aTitle.includes(query);
      const bTitleMatch = bTitle.includes(query);

      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;

      // If both or neither match in title, check if query starts with title
      const aStartsWith = aTitle.startsWith(query);
      const bStartsWith = bTitle.startsWith(query);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  })();



  return (

    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        /* Post Preview modal content: keep embedded media compact */
        .post-preview-content img,
        .post-preview-content video,
        .post-preview-content iframe {
          display: block !important;
          max-width: 70% !important;
          width: auto !important;
          height: auto !important;
          margin: 1rem auto !important;
          border-radius: 12px !important;
          object-fit: cover !important;
        }
        @media (max-width: 768px) {
          .post-preview-content img,
          .post-preview-content video,
          .post-preview-content iframe {
            max-width: 95% !important;
          }
        }
      `}</style>
      {/* Fixed Header - No movement */}
      {permissions.canReadPublished && (
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-cyan-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 mt-4 sm:p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg shadow-md">
                <Sparkles className="w-4 h-4 sm:w-5  sm:h-5 text-white" />
              </div>

              <div>
                <h1 className="text-lg sm:text-xl mt-4  font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Blog Studio
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">Create & Share Your Stories</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-40 sm:w-56 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                />
              </div>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-cyan-50 border border-gray-200 rounded-lg text-gray-600 hover:text-cyan-600 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {permissions.canCreate && (
                <button
                  onClick={handleCreatePost}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">New Post</span>
                  <span className="sm:hidden">New</span>
                </button>
              )}
            </div>
          </div>



          <div className="flex items-center justify-end gap-2 sm:gap-3 overflow-x-auto scrollbar-hide ml-auto">
            {[
              { id: 'feed' as TabType, label: 'Feed', icon: Sparkles },
              { id: 'published' as TabType, label: 'Published', icon: Bookmark },
              { id: 'drafts' as TabType, label: 'Drafts', icon: Edit3 },
              { id: 'trending' as TabType, label: 'Trending', icon: Flame },
              { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
            ].map((tab) => {

              const Icon = tab.icon;

              return (

                <button

                  key={tab.id}

                  onClick={() => setActiveTab(tab.id)}

                  className={`flex flex-col items-center gap-0.5 py-1 text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap relative group ${
                    activeTab === tab.id

                      ? 'text-cyan-600'
                      : 'text-gray-600 hover:text-cyan-600'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{tab.label}</span>
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-600 transition-all ${
                    activeTab === tab.id
                      ? 'opacity-100 scale-x-100'
                      : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                  }`}></span>
                </button>

              );

            })}

          </div>

        </div>

      </div>
      )}



      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Show access denied if no read permission */}
        {!permissions.canReadPublished && (
          <div className="flex flex-col items-center justify-center py-12 mb-8">
            <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 text-center max-w-md mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-sm text-gray-700 mb-4">
                You do not have permission to view blog posts.
              </p>
              <p className="text-xs text-gray-600">
                Please contact your administrator to request access to the Blog module.
              </p>
            </div>
            
            {/* Show New Post button if user has create permission */}
            {permissions.canCreate && (
              <button
                onClick={handleCreatePost}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" />
                <span>New Post</span>
              </button>
            )}
          </div>
        )}
        
        {loading ? (

          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600"></div>
              <p className="text-cyan-700 font-semibold">Loading posts...</p>
            </div>
          </div>

        ) : permissions.canReadPublished ? (

          <>

            {(activeTab === 'feed' || activeTab === 'published' || activeTab === 'trending') && (() => {
              let allPostsToShow = filteredPosts.filter(post => {
                if (activeTab === 'feed') return true;
                if (activeTab === 'published') return post.status === 'published';
                if (activeTab === 'trending') {
                  // For trending: only show published posts with engagement (likes + comments)
                  if (post.status !== 'published') return false;
                  
                  const likesCount = post.likesCount || post.likes || 0;
                  const commentsCount = post.commentsCount || (Array.isArray(post.comments) ? post.comments.length : 0) || 0;
                  const engagement = likesCount + commentsCount;
                  
                  // Only show posts with engagement (at least 1 like or comment)
                  return engagement > 0;
                }
                return false;
              });

              // For trending tab, sort by engagement (likes + comments) in descending order
              if (activeTab === 'trending') {
                allPostsToShow = allPostsToShow.sort((a, b) => {
                  const aLikes = a.likesCount || a.likes || 0;
                  const aComments = a.commentsCount || (Array.isArray(a.comments) ? a.comments.length : 0) || 0;
                  const aEngagement = aLikes + aComments;
                  
                  const bLikes = b.likesCount || b.likes || 0;
                  const bComments = b.commentsCount || (Array.isArray(b.comments) ? b.comments.length : 0) || 0;
                  const bEngagement = bLikes + bComments;
                  
                  // Sort by engagement (descending), then by date if engagement is equal
                  if (bEngagement !== aEngagement) {
                    return bEngagement - aEngagement;
                  }
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
              }

              // Pagination logic
              const totalPages = Math.ceil(allPostsToShow.length / postsPerPage);
              const startIndex = (currentPage - 1) * postsPerPage;
              const endIndex = startIndex + postsPerPage;
              const paginatedPosts = allPostsToShow.slice(startIndex, endIndex);

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedPosts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        type={post.status === 'draft' ? 'drafts' : 'published'}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                        title="Previous"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                        title="Next"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}



            {activeTab === 'drafts' && (() => {
              const allDraftPosts = filteredPosts.filter(post => {
                const isDraft = post.status === 'draft' || (!post.status && !publishedPostIds.has(post._id));
                const notPublished = !publishedPostIds.has(post._id);
                return isDraft && notPublished;
              });

              // Pagination logic for drafts
              const totalPages = Math.ceil(allDraftPosts.length / postsPerPage);
              const startIndex = (currentPage - 1) * postsPerPage;
              const endIndex = startIndex + postsPerPage;
              const paginatedDrafts = allDraftPosts.slice(startIndex, endIndex);

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedDrafts.map((post) => (
                      <PostCard key={post._id} post={post} type="drafts" />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                        title="Previous"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                        title="Next"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  )}
                </>
              );
            })()}



            {activeTab === 'analytics' && (

              <div className="space-y-6">
                {(() => {
                  // ✅ For clinic/doctor/admin roles, always allow reading analytics (bypass permission check)
                  const userRole = getUserRole();
                  const canReadAnalytics = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canReadAnalytics;
                  return !canReadAnalytics ? (

                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h3>
                    <p className="text-gray-600">You don't have permission to view analytics.</p>
                  </div>

                ) : analyticsLoading ? (

                  <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center gap-4">

                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-200 border-t-cyan-600"></div>
                      <p className="text-cyan-700 font-semibold">Loading analytics...</p>
                    </div>

                  </div>

                ) : analyticsData ? (

                  <>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-white/20 rounded-xl">
                            <Bookmark className="w-6 h-6" />
                          </div>

                          <TrendingUp className="w-5 h-5 opacity-80" />
                        </div>

                        <p className="text-sm opacity-90 mb-1">Total Posts</p>
                        <p className="text-4xl font-bold">
                          {analyticsData.blogs?.length || publishedPosts.length || 0}

                        </p>

                        <p className="text-sm opacity-75 mt-2">
                          {draftPosts.length} drafts

                        </p>

                      </div>



                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-white/20 rounded-xl">
                            <Eye className="w-6 h-6" />
                          </div>

                          <TrendingUp className="w-5 h-5 opacity-80" />
                        </div>

                        <p className="text-sm opacity-90 mb-1">Total Views</p>
                        <p className="text-4xl font-bold">
                          {publishedPosts.reduce((sum: number, post: PostType) => sum + (post.views || 0), 0).toLocaleString()}

                        </p>

                        <p className="text-sm opacity-75 mt-2">All time</p>
                      </div>



                      <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-white/20 rounded-xl">
                            <Heart className="w-6 h-6" />
                          </div>

                          <TrendingUp className="w-5 h-5 opacity-80" />
                        </div>

                        <p className="text-sm opacity-90 mb-1">Total Likes</p>
                        <p className="text-4xl font-bold">
                          {analyticsData.blogs?.reduce((sum: number, blog: any) => sum + (blog.likesCount || 0), 0) || 

                           publishedPosts.reduce((sum: number, post: PostType) => sum + (post.likesCount || post.likes || 0), 0).toLocaleString()}

                        </p>

                        <p className="text-sm opacity-75 mt-2">Across all posts</p>
                      </div>



                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-white/20 rounded-xl">
                            <MessageCircle className="w-6 h-6" />
                          </div>

                          <TrendingUp className="w-5 h-5 opacity-80" />
                        </div>

                        <p className="text-sm opacity-90 mb-1">Total Comments</p>
                        <p className="text-4xl font-bold">
                          {analyticsData.blogs?.reduce((sum: number, blog: any) => sum + (blog.commentsCount || 0), 0) || 

                           publishedPosts.reduce((sum: number, post: PostType) => sum + (post.commentsCount || post.comments || 0), 0).toLocaleString()}

                        </p>

                        <p className="text-sm opacity-75 mt-2">User engagement</p>
                      </div>

                    </div>

                  </>

                ) : (

                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-10 h-10 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Data</h3>
                    <p className="text-gray-600 mb-4">Start publishing posts to see analytics.</p>
                    {(() => {
                      // ✅ For clinic/doctor/admin roles, always show create button (bypass permission check)
                      const userRole = getUserRole();
                      const canCreate = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canCreate;
                      return canCreate ? (

                      <button

                        onClick={handleCreatePost}

                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >

                        Create Your First Post

                      </button>

                    ) : null;
                    })()}

                  </div>

                );
                })()}
              </div>
            )}



            {filteredPosts.length === 0 && (

              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Start creating amazing content!</p>
                {(() => {
                  // ✅ For clinic/doctor/admin roles, always show create button (bypass permission check)
                  const userRole = getUserRole();
                  const canCreate = ["clinic", "doctor", "admin"].includes(userRole || "") || permissions.canCreate;
                  return canCreate ? (

                  <button

                    onClick={handleCreatePost}

                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >

                    Create Your First Post

                  </button>

                  ) : null;
                })()}

              </div>
            )}

          </>

        ) : permissions.canCreate ? null : (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <p className="text-gray-600">You don't have permission to view or create blog posts.</p>
            </div>
          </div>
        )}

      </div>



      {/* Editor Modal */}

      {isEditorOpen && (

        <ModernBlogEditor

          tokenKey={tokenKey}

          editBlogId={editBlogId || undefined}

          editDraftId={editDraftId || undefined}

          onClose={() => {

            setIsEditorOpen(false);

            setEditBlogId(null);

            setEditDraftId(null);

            loadPosts();

          }}

          onSave={(isPublished) => {
            loadPosts();
            if (isPublished) {
              setSuccessMessage('Blog submitted successfully!');
              setShowSuccessModal(true);
            }
          }}

        />

      )}

      {/* Success Modal - Blog Submitted */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Blog Submitted!
              </h3>
              <p className="text-gray-600 mb-6">
                {successMessage || 'Your blog has been submitted successfully.'}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessMessage('');
                }}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {showDeleteSuccessModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Blog Deleted!
              </h3>
              <p className="text-gray-600 mb-6">
                The blog has been deleted successfully.
              </p>
              <button
                onClick={() => {
                  setShowDeleteSuccessModal(false);
                }}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal - Compact & Centered */}
      {showCommentsModal && selectedPostForComments && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col animate-scaleIn">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-teal-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-600" />
                Comments
              </h2>
              <button

                onClick={() => {

                  setShowCommentsModal(false);

                  setSelectedPostForComments(null);

                  setNewComment('');

                }}

                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >

                <X className="w-5 h-5 text-gray-600" />
              </button>

            </div>



            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selectedPostForComments.commentsArray && selectedPostForComments.commentsArray.length > 0 ? (

                selectedPostForComments.commentsArray.map((comment) => (

                  <div key={comment._id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-sm">
                          <span className="text-white text-xs font-bold">
                            {comment.username.charAt(0).toUpperCase()}

                          </span>

                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900">{comment.username}</p>
                          <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                        </div>

                      </div>

                    </div>

                    <p className="text-sm text-gray-700 break-words leading-relaxed">{comment.text}</p>
                    {comment.replies && comment.replies.length > 0 && (

                      <div className="mt-3 ml-4 space-y-2 border-l-2 border-cyan-200 pl-4">
                        {comment.replies.map((reply) => (

                          <div key={reply._id} className="bg-white rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-700">{reply.username}</span>

                              <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>

                            </div>

                            <p className="text-sm text-gray-600 break-words">{reply.text}</p>
                          </div>

                        ))}

                      </div>

                    )}

                  </div>

                ))

              ) : (

                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No comments yet. Be the first!</p>
                </div>

              )}

            </div>



            <div className="p-5 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">

                <input

                  type="text"

                  placeholder="Write a comment..."

                  value={newComment}

                  onChange={(e) => setNewComment(e.target.value)}

                  onKeyPress={(e) => {

                    if (e.key === 'Enter' && !e.shiftKey) {

                      e.preventDefault();

                      handleAddComment(selectedPostForComments._id);

                    }

                  }}

                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                />

                <button

                  onClick={() => handleAddComment(selectedPostForComments._id)}

                  disabled={commenting || !newComment.trim()}

                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >

                  {commenting ? 'Posting...' : 'Post'}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Edit URL Modal - Compact */}
      {showEditUrlModal && editUrlPost && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scaleIn">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <LinkIcon className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Edit Blog URL</h3>
                    <p className="text-sm text-gray-500">Update title and URL slug</p>
                  </div>

                </div>

                <button

                  onClick={() => {

                    setShowEditUrlModal(false);

                    setEditUrlPost(null);

                    setEditUrlError('');

                  }}

                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >

                  <X className="w-5 h-5 text-gray-600" />
                </button>

              </div>

            </div>



            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Blog Title</label>
                <input

                  type="text"

                  value={editUrlTitle}

                  onChange={(e) => setEditUrlTitle(e.target.value)}

                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="Enter blog title..."

                />

              </div>



              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug</label>
                <div className="border-2 rounded-xl p-4 mb-3 bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200">
                  <div className="flex items-center gap-2 text-sm overflow-x-auto">
                    <span className="text-gray-600 whitespace-nowrap">{getBaseUrl()}/blogs/</span>
                    <span className="font-mono font-semibold text-cyan-700">{editUrlParamlink || '...'}</span>
                  </div>

                </div>

                <input

                  type="text"

                  value={editUrlParamlink}

                  onChange={(e) => setEditUrlParamlink(slugify(e.target.value))}

                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                  placeholder="blog-url-slug"

                />

                {editUrlError && (

                  <div className="flex items-center gap-2 text-rose-600 text-sm mt-2 bg-rose-50 p-3 rounded-lg border border-rose-200">
                    <X className="w-4 h-4" />
                    {editUrlError}
                  </div>

                )}

              </div>

            </div>



            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button

                onClick={() => {

                  setShowEditUrlModal(false);

                  setEditUrlPost(null);

                  setEditUrlError('');

                }}

                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all"
              >

                Cancel

              </button>

              <button

                onClick={handleSaveUrl}

                className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white py-3 px-6 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >

                Save Changes

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Post Detail Modal - Fixed Navbar Issue */}
      {showPostDetailModal && selectedPostDetail && (

        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md animate-fadeIn overflow-y-auto" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowPostDetailModal(false);
            setSelectedPostDetail(null);
          }
        }}>
          <div className="min-h-screen px-4 py-8 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto animate-scaleIn flex flex-col max-h-[90vh] overflow-hidden">
              {/* Fixed Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl">
                    <Eye className="w-5 h-5 text-white" />
                </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Post Preview</h2>
                    <p className="text-sm text-gray-600">Full content view</p>
                </div>

              </div>

                <div className="flex items-center gap-2">
                <a

                  href={`${getBaseUrl()}/blogs/${selectedPostDetail.paramlink}`}

                  target="_blank"

                  rel="noopener noreferrer"

                    className="p-2 rounded-lg hover:bg-cyan-100 text-cyan-600 transition"
                    title="Open in new tab"
                >

                    <ExternalLink className="w-5 h-5" />
                </a>

                <button

                  onClick={() => {

                    setShowPostDetailModal(false);

                    setSelectedPostDetail(null);

                  }}

                    className="p-2 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                    title="Close"
                >

                    <X className="w-5 h-5" />
                </button>

              </div>

            </div>



              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8 prose prose-cyan max-w-none">
                <h1 className="text-3xl font-bold mb-4 text-gray-900">
                {selectedPostDetail.title}

              </h1>



                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>
                      {typeof selectedPostDetail.postedBy === 'object'
                        ? selectedPostDetail.postedBy?.name ||
                          selectedPostDetail.postedBy?.username ||
                          'Anonymous'
                        : selectedPostDetail.postedBy || 'Anonymous'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                      <span>{formatDate(selectedPostDetail.createdAt)}</span>

                  </div>

                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{selectedPostDetail.views || 0} views</span>
                </div>

              </div>



                {/* Blog HTML Content */}
                <div
                  className="blog-content post-preview-content leading-relaxed text-gray-800"
                  dangerouslySetInnerHTML={{
                    __html: selectedPostDetail.content,
                  }}
                />
              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



export default ModernBlogForm;
