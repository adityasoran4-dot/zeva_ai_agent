"use client";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  CreditCard,
  Users,
  Lightbulb,
  MessageSquare,
  Bot,
  Star,
  UserCog,
  MessageCircle,
  Megaphone,
  Workflow,
  Clock,
  RefreshCw,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import ClinicLayout from "../../../components/ClinicLayout";
import withClinicAuth from "../../../components/withClinicAuth";
import WhatsAppMarketingSidebar from "../../../components/WhatsAppMarketingSidebar";

const WhatsAppMarketingDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Tenant Admin");
  const [permissions, setPermissions] = useState({
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  });
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [isClinicContext, setIsClinicContext] = useState(false);
  const [subscription, setSubscription] = useState({
    plan: "Plan Y3 - Enterprise",
    nextBilling: "2025-07-26",
    daysUntil: 239,
  });
  const [usageLimits, setUsageLimits] = useState({
    contacts: { used: 1, total: 100000 },
    aiPrompts: { used: 2, total: 100000 },
    conversations: { used: 0, total: "Unlimited" },
    templateBots: { used: 0, total: 100000 },
    cannedReplies: { used: 1, total: 100000 },
    staff: { used: 1, total: 100000 },
    messageBots: { used: 0, total: 100000 },
    campaigns: { used: 0, total: 100000 },
    botFlow: { used: 4, total: "Unlimited" },
  });
  const [chartView, setChartView] = useState({
    audienceGrowth: "mixed", // "mixed" or "stacked"
    campaignStatistic: "line", // "line" or "bar"
  });

  // Mock data for charts
  const audienceGrowthData = [
    { month: "Dec 2024", totalContacts: 0, totalLeads: 0, newContacts: 0, newLeads: 0 },
    { month: "Jan 2025", totalContacts: 0, totalLeads: 0.1, newContacts: 0, newLeads: 0.1 },
    { month: "Feb 2025", totalContacts: 0, totalLeads: 0.2, newContacts: 0, newLeads: 0.1 },
    { month: "Mar 2025", totalContacts: 0, totalLeads: 0.3, newContacts: 0, newLeads: 0.1 },
    { month: "Apr 2025", totalContacts: 0, totalLeads: 0.4, newContacts: 0, newLeads: 0.1 },
    { month: "May 2025", totalContacts: 0, totalLeads: 0.5, newContacts: 0, newLeads: 0.1 },
    { month: "Jun 2025", totalContacts: 0, totalLeads: 0.6, newContacts: 0, newLeads: 0.1 },
    { month: "Jul 2025", totalContacts: 0, totalLeads: 0.7, newContacts: 0, newLeads: 0.1 },
    { month: "Aug 2025", totalContacts: 0, totalLeads: 0.8, newContacts: 0, newLeads: 0.2 },
    { month: "Sep 2025", totalContacts: 0, totalLeads: 0.8, newContacts: 0, newLeads: 0 },
    { month: "Oct 2025", totalContacts: 0, totalLeads: 0.8, newContacts: 0, newLeads: 0 },
    { month: "Nov 2025", totalContacts: 0, totalLeads: 0.8, newContacts: 0, newLeads: 0 },
  ];

  const contactSourcesData = [
    { name: "whatsapp", value: 100, color: "#3B82F6" },
  ];

  const weeklyMessageData = [
    { day: "Sun", sent: 0, delivered: 0 },
    { day: "Mon", sent: 0, delivered: 0 },
    { day: "Tue", sent: 0, delivered: 0 },
    { day: "Wed", sent: 0, delivered: 0 },
    { day: "Thu", sent: 0, delivered: 0 },
    { day: "Fri", sent: 0, delivered: 0 },
    { day: "Sat", sent: 0, delivered: 0 },
  ];

  const campaignStatisticData = [
    { month: "Dec 2024", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Jan 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Feb 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Mar 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Apr 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "May 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Jun 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Jul 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Aug 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Sep 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Oct 2025", created: 0, sent: 0, delivered: 0, read: 0 },
    { month: "Nov 2025", created: 0, sent: 0, delivered: 0, read: 0 },
  ];

  // Check if we're in clinic context
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      setIsClinicContext(path.startsWith("/clinic/") || path.startsWith("/marketingalltype/") || path.startsWith("/agent/"));
    }
  }, []);

  // Fetch permissions for clinic context
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isClinicContext) {
        setPermissionsLoaded(true);
        return;
      }

      try {
        setPermissionsLoaded(false);
        const token = 
          localStorage.getItem("clinicToken") ||
          sessionStorage.getItem("clinicToken") ||
          localStorage.getItem("agentToken") ||
          sessionStorage.getItem("agentToken") ||
          localStorage.getItem("userToken") ||
          sessionStorage.getItem("userToken") ||
          localStorage.getItem("doctorToken") ||
          sessionStorage.getItem("doctorToken");
        
        if (!token) {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
          setPermissionsLoaded(true);
          return;
        }

        const response = await axios.get("/api/clinic/permissions", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            moduleKey: "clinic_staff_management",
            subModuleName: "WhatsApp Marketing",
          },
        });

        if (response.data.success) {
          setPermissions({
            canCreate: response.data.permissions?.create || false,
            canRead: response.data.permissions?.read || false,
            canUpdate: response.data.permissions?.update || false,
            canDelete: response.data.permissions?.delete || false,
          });
        } else {
          setPermissions({
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setPermissions({
          canCreate: false,
          canRead: false,
          canUpdate: false,
          canDelete: false,
        });
      } finally {
        setPermissionsLoaded(true);
      }
    };

    fetchPermissions();
  }, [isClinicContext]);

  const getAuthHeaders = useCallback(() => {
    if (typeof window === "undefined") return {};
    const token =
      localStorage.getItem("clinicToken") ||
      sessionStorage.getItem("clinicToken") ||
      localStorage.getItem("agentToken") ||
      sessionStorage.getItem("agentToken") ||
      localStorage.getItem("userToken") ||
      sessionStorage.getItem("userToken") ||
      localStorage.getItem("doctorToken") ||
      sessionStorage.getItem("doctorToken");
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        // TODO: Fetch real data from API
        // For now using mock data
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getAuthHeaders]);

  const formatLimit = (used, total) => {
    if (total === "Unlimited") {
      return `${used} / ${total}`;
    }
    return `${used} / ${total.toLocaleString()}`;
  };

  const usageCards = [
    {
      id: "contacts",
      label: "Contacts",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      used: usageLimits.contacts.used,
      total: usageLimits.contacts.total,
    },
    {
      id: "aiPrompts",
      label: "Smart Automation",
      icon: Lightbulb,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      used: usageLimits.aiPrompts.used,
      total: usageLimits.aiPrompts.total,
    },
    {
      id: "conversations",
      label: "Conversation",
      icon: MessageSquare,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      used: usageLimits.conversations.used,
      total: usageLimits.conversations.total,
      button: { label: "Open Chat", action: () => {} },
    },
    {
      id: "templateBots",
      label: "Automated Templates",
      icon: Bot,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      used: usageLimits.templateBots.used,
      total: usageLimits.templateBots.total,
      button: { label: "View", action: () => {} },
    },
    {
      id: "cannedReplies",
      label: "Quick Responses",
      icon: Star,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      used: usageLimits.cannedReplies.used,
      total: usageLimits.cannedReplies.total,
      button: { label: "Manage", action: () => {} },
    },
    {
      id: "staff",
      label: "Team Members",
      icon: UserCog,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      used: usageLimits.staff.used,
      total: usageLimits.staff.total,
      button: { label: "Manage", action: () => {} },
    },
    {
      id: "messageBots",
      label: "Auto Responders",
      icon: MessageCircle,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      used: usageLimits.messageBots.used,
      total: usageLimits.messageBots.total,
      button: { label: "Manage", action: () => {} },
    },
    {
      id: "campaigns",
      label: "Marketing Campaigns",
      icon: Megaphone,
      iconColor: "text-blue-400",
      bgColor: "bg-blue-50",
      used: usageLimits.campaigns.used,
      total: usageLimits.campaigns.total,
      button: { label: "Manage", action: () => {} },
    },
    {
      id: "botFlow",
      label: "Quick Bot Replies",
      icon: Workflow,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      used: usageLimits.botFlow.used,
      total: usageLimits.botFlow.total,
      button: { label: "Manage", action: () => {} },
    },
  ];

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-screen sticky top-0 z-30">
        <WhatsAppMarketingSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  Hello {userName},
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Empower Your Business With Whatsmark
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <div className="text-sm">
                    <p className="font-semibold text-purple-900">{subscription.plan}</p>
                    <p className="text-xs text-purple-700">
                      Next Billing: {subscription.nextBilling} ({subscription.daysUntil} Days)
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium">
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>

          {/* Usage & Limits Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage & Limits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usageCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-lg shadow-sm p-4 sm:p-5 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{card.label}</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                      {formatLimit(card.used, card.total)}
                    </p>
                    {card.button && (
                      <button
                        onClick={card.button.action}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 transition"
                      >
                        {card.button.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Audience Growth Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Audience Growth</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView({ ...chartView, audienceGrowth: "mixed" })}
                    className={`px-3 py-1 text-xs rounded ${
                      chartView.audienceGrowth === "mixed"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition`}
                  >
                    Mixed
                  </button>
                  <button
                    onClick={() => setChartView({ ...chartView, audienceGrowth: "stacked" })}
                    className={`px-3 py-1 text-xs rounded ${
                      chartView.audienceGrowth === "stacked"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition`}
                  >
                    Stacked
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {chartView.audienceGrowth === "mixed" ? (
                  <AreaChart data={audienceGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                      domain={[0, 1.0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px" }}
                      iconType="line"
                    />
                    <Area
                      type="monotone"
                      dataKey="newContacts"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.3}
                      name="New Contacts"
                    />
                    <Area
                      type="monotone"
                      dataKey="newLeads"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.3}
                      name="New Leads"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalContacts"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      name="Total Contacts"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalLeads"
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={false}
                      name="Total Leads"
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={audienceGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                      domain={[0, 1.0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Area
                      type="monotone"
                      dataKey="totalContacts"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="Total Contacts"
                    />
                    <Area
                      type="monotone"
                      dataKey="totalLeads"
                      stackId="1"
                      stroke="#F97316"
                      fill="#F97316"
                      fillOpacity={0.6}
                      name="Total Leads"
                    />
                    <Area
                      type="monotone"
                      dataKey="newContacts"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.6}
                      name="New Contacts"
                    />
                    <Area
                      type="monotone"
                      dataKey="newLeads"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.6}
                      name="New Leads"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Contact Sources Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Sources</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contactSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  >
                    {contactSourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Message Volume Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Message Volume</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyMessageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    stroke="#9CA3AF"
                    domain={[0, 1.0]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="sent"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Messages Sent"
                  />
                  <Line
                    type="monotone"
                    dataKey="delivered"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Delivered"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Campaign Statistic Chart */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Campaign Statistic</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView({ ...chartView, campaignStatistic: "line" })}
                    className={`px-3 py-1 text-xs rounded ${
                      chartView.campaignStatistic === "line"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartView({ ...chartView, campaignStatistic: "bar" })}
                    className={`px-3 py-1 text-xs rounded ${
                      chartView.campaignStatistic === "bar"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } transition`}
                  >
                    Bar
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {chartView.campaignStatistic === "line" ? (
                  <LineChart data={campaignStatisticData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                      domain={[0, 1.0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#9333EA"
                      strokeWidth={2}
                      dot={false}
                      name="Campaigns Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="sent"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      name="Campaigns Sent"
                    />
                    <Line
                      type="monotone"
                      dataKey="delivered"
                      stroke="#F97316"
                      strokeWidth={2}
                      dot={false}
                      name="Messages Delivered"
                    />
                    <Line
                      type="monotone"
                      dataKey="read"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={false}
                      name="Messages Read"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={campaignStatisticData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                      stroke="#9CA3AF"
                      domain={[0, 1.0]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="created" fill="#9333EA" name="Campaigns Created" />
                    <Bar dataKey="sent" fill="#10B981" name="Campaigns Sent" />
                    <Bar dataKey="delivered" fill="#F97316" name="Messages Delivered" />
                    <Bar dataKey="read" fill="#EF4444" name="Messages Read" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layout
WhatsAppMarketingDashboard.getLayout = function PageLayout(page) {
  return (
    <ClinicLayout hideSidebar={true} hideHeader={true}>
      {page}
    </ClinicLayout>
  );
};

// Protect and preserve layout
const ProtectedWhatsAppMarketingDashboard = withClinicAuth(WhatsAppMarketingDashboard);
ProtectedWhatsAppMarketingDashboard.getLayout = WhatsAppMarketingDashboard.getLayout;

export default ProtectedWhatsAppMarketingDashboard;

