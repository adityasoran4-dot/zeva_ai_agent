import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import {
  Bell, Home, LogOut, Briefcase, MessageCircle, User, Calendar, MapPin,
  DollarSign, Clock, Building, Award, Users, FileText, TrendingUp,
  Activity,Menu, X, BarChart3
} from "lucide-react";

// Utility Functions
const decodeUserId = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload?.userId;
  } catch { return null; }
};

const statusStyles = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200"
};

// API Helper
const apiCall = async (endpoint, token) => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const response = await fetch(`${apiBase}${endpoint}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// Custom Hooks - Removed local useAuth since we're importing from AuthContext

const useDashboardData = () => {
  const [data, setData] = useState({ jobs: [], comments: [], chats: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { setLoading(false); return; }

      try {
        const [jobsData, commentsData, chatsData] = await Promise.allSettled([
          apiCall("/api/users/applied-jobs", token),
          apiCall("/api/users/comments-with-replies", token),
          apiCall("/api/chat/user-chats", token)
        ]);

        const jobs = jobsData.status === 'fulfilled' ? (jobsData.value || []) : [];

        setData({
          jobs: jobs,
          comments: commentsData.status === 'fulfilled' ? (commentsData.value?.commentsWithReplies || commentsData.value || []) : [],
          chats: chatsData.status === 'fulfilled' ? (chatsData.value?.data?.filter(c => c.prescriptionRequest) || chatsData.value || []) : []
        });
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { ...data, loading };
};

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const [readNotifications, setReadNotifications] = useState(new Set());

  // Load cleared notifications from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cleared = localStorage.getItem("clearedNotifications");
      const read = localStorage.getItem("readNotifications");
      if (cleared) {
        const clearedIds = new Set(JSON.parse(cleared));
        const readIds = read ? new Set(JSON.parse(read)) : new Set();
        setReadNotifications(readIds);
      }
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      try {
        const userId = decodeUserId(token);
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        const response = await fetch(`${apiBase}/api/push-notification/reply-notifications?userId=${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          const fetchedNotifications = data.notifications || data.data || data || [];
          
          // Filter out cleared notifications
          const clearedIds = typeof window !== "undefined" 
            ? new Set(JSON.parse(localStorage.getItem("clearedNotifications") || "[]"))
            : new Set();
          
          const filteredNotifications = fetchedNotifications.filter(
            n => !clearedIds.has(n._id)
          );
          
          setNotifications(filteredNotifications);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (notificationId) => {
    const newReadSet = new Set(readNotifications);
    newReadSet.add(notificationId);
    setReadNotifications(newReadSet);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("readNotifications", JSON.stringify([...newReadSet]));
    }
    
    // Update notification in state
    setNotifications(prev => 
      prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const clearNotifications = () => {
    const notificationIds = notifications.map(n => n._id);
    const clearedIds = typeof window !== "undefined" 
      ? new Set(JSON.parse(localStorage.getItem("clearedNotifications") || "[]"))
      : new Set();
    
    notificationIds.forEach(id => clearedIds.add(id));
    
    if (typeof window !== "undefined") {
      localStorage.setItem("clearedNotifications", JSON.stringify([...clearedIds]));
    }
    
    setNotifications([]);
    setReadNotifications(new Set());
    if (typeof window !== "undefined") {
      localStorage.removeItem("readNotifications");
    }
  };

  return { notifications, show, setShow, markAsRead, clearNotifications, readNotifications };
};

// Components
const TopNav = ({ user, notifications, showNotif, setShowNotif, onLogout, activeTab, setActiveTab, markAsRead, clearNotifications, readNotifications }) => {
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const notificationRef = useRef(null);
  const unread = notifications.filter(n => !n.isRead && !readNotifications.has(n._id)).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotif && notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotif, setShowNotif]);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "comments", label: "Comments", icon: MessageCircle },
    { id: "chats", label: "Chats", icon: Users }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Bar */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{user?.name || "User"}</h1>
              <p className="text-xs text-slate-500">{user?.email || "user@example.com"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Home Button */}
            <button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              title="Go to Home"
            >
              {/* <Home className="w-4 h-4" /> */}
              <span>ZEVA</span>
            </button>

            {/* Notifications */}
            <div className="relative notification-container" ref={notificationRef}>
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                    {unread}
                  </span>
                )}
              </button>
              
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); clearNotifications(); }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(notif => {
                        const isRead = notif.isRead || readNotifications.has(notif._id);
                        return (
                          <div 
                            key={notif._id} 
                            onClick={() => markAsRead(notif._id)}
                            className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-all duration-150 ${!isRead ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${!isRead ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>{notif.title}</h4>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                              </div>
                              {!isRead && (
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 flex-shrink-0 animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info - Desktop Only (Right Side) */}
            <div className="hidden lg:flex items-center space-x-3 pl-3 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500">{user?.phone || "No phone"}</p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="hidden md:flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="hidden md:flex space-x-1 -mb-px">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all ${
                activeTab === id
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden py-4 space-y-2 border-t border-slate-200 mt-2">
            <button
              onClick={() => { router.push("/"); setMobileMenu(false); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50"
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMobileMenu(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${
                  activeTab === id ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color = "blue" }) => (
  <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 bg-${color}-50 rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      {trend && (
        <span className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <TrendingUp className="w-3 h-3 mr-1" />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-3xl font-bold text-slate-900 mb-1">{value}</h3>
    <p className="text-slate-500 text-sm">{title}</p>
  </div>
);

const OverviewTab = ({ jobs, comments, chats }) => {
  const stats = {
    totalJobs: jobs.length,
    pending: jobs.filter(j => j.status === "pending").length,
    activeChats: chats.filter(c => c.prescriptionRequest?.status === "active").length,
    totalComments: comments.length
  };

  const recentActivity = [
    ...jobs.slice(0, 3).map(j => ({
      type: "job",
      title: `Applied to ${j.jobId?.jobTitle || "Job"}`,
      time: j.createdAt,
      status: j.status
    })),
    ...comments.slice(0, 2).map(c => ({
      type: "comment",
      title: `Commented on ${c.blogTitle || "Blog"}`,
      time: c.commentCreatedAt,
      status: "active"
    }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">ZEVA User Dashboard</h2>
        <p className="text-slate-500">Here's a summary of your activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Applications" value={stats.totalJobs} icon={Briefcase} trend="+12%" color="blue" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Active Chats" value={stats.activeChats} icon={Users} trend="+5%" color="emerald" />
        <StatCard title="Total Comments" value={stats.totalComments} icon={MessageCircle} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No recent activity</p>
          ) : (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === "job" ? "bg-blue-50" : "bg-purple-50"
                  }`}>
                    {activity.type === "job" ? (
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-500">{new Date(activity.time).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[activity.status] || statusStyles.pending}`}>
                  {activity.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const JobsTab = ({ jobs }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Applied Jobs</h2>
      <p className="text-slate-500">Track all your job applications</p>
    </div>
    
    {jobs.length === 0 ? (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
        <p className="text-slate-500">Start applying to jobs to see them here</p>
      </div>
    ) : (
      <div className="space-y-4">
        {jobs.map(app => app.jobId && (
          <div key={app._id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{app.jobId.jobTitle}</h4>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span className="flex items-center"><Building className="w-4 h-4 mr-1" />{app.jobId.companyName}</span>
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{app.jobId.location}</span>
                </div>
              </div>
              <span className={`text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold border ${statusStyles[app.status]}`}>
                {app.status}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
              <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" />{app.jobId.salary}</span>
              <span className="flex items-center"><Clock className="w-4 h-4 mr-1" />{app.jobId.jobTiming}</span>
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{app.jobId.workingDays}</span>
            </div>
            
            <div className="text-sm text-slate-500">
              Applied on {new Date(app.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const CommentsTab = ({ comments }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Comments</h2>
      <p className="text-slate-500">All your blog comments and replies</p>
    </div>

    {comments.length === 0 ? (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No comments yet</h3>
        <p className="text-slate-500">Start commenting on blogs to see them here</p>
      </div>
    ) : (
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.commentId} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <h4 className="font-semibold text-slate-900 mb-2">{comment.blogTitle}</h4>
            <p className="text-slate-600 text-sm mb-4 bg-slate-50 p-3 rounded-lg">{comment.commentText}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{new Date(comment.commentCreatedAt).toLocaleDateString()}</span>
              <span className="flex items-center">
                <MessageCircle className="w-3 h-3 mr-1" />
                {comment.replies?.length || 0} replies
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ChatsTab = ({ chats }) => {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Doctor Consultations</h2>
        <p className="text-slate-500">Your medical consultation history</p>
      </div>

      {chats.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No consultations yet</h3>
          <p className="text-slate-500">Start consulting with doctors to see them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map(chat => (
            <div key={chat._id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Dr. {chat.doctor?.name}</h4>
                    <p className="text-sm text-slate-500">{chat.prescriptionRequest?.healthIssue}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${statusStyles[chat.prescriptionRequest?.status] || statusStyles.active}`}>
                  {chat.prescriptionRequest?.status || "active"}
                </span>
              </div>
              <button
                onClick={() => router.push(`/user/chat/${chat.prescriptionRequest?._id}`)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Continue Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
const Dashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const { user: authUser } = useAuth(); // Get user from AuthContext
  const { jobs, comments, chats, loading: dataLoading } = useDashboardData();
  const { notifications, show, setShow, markAsRead, clearNotifications, readNotifications } = useNotifications();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      router.push("/").then(() => {
        window.location.reload();
      });
    }
  };

  if (dataLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopNav
        user={authUser}
        notifications={notifications}
        showNotif={show}
        setShowNotif={setShow}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        markAsRead={markAsRead}
        clearNotifications={clearNotifications}
        readNotifications={readNotifications}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "overview" && <OverviewTab jobs={jobs} comments={comments} chats={chats} />}
        {activeTab === "jobs" && <JobsTab jobs={jobs} />}
        {activeTab === "comments" && <CommentsTab comments={comments} />}
        {activeTab === "chats" && <ChatsTab chats={chats} />}
      </main>
    </div>
  );
};

Dashboard.getLayout = function PageLayout(page) {
  return page;
};

export default Dashboard;