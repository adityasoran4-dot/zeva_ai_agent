import React, { useState, useEffect, useCallback } from "react";
import { NextPageWithLayout } from "@/pages/_app";
import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import { ReactElement } from "react";
import {
  Plus,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  Shield,
  Zap,
  Grid,
  Table,
  Edit,
  Eye,
  Search,
  RefreshCw,
  Globe,
  Send,
  Bell,
  Info,
  Phone,
  Globe as GlobeIcon,
  Hash,
  Mailbox,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { Provider } from "@/types/conversations";
import AddWhatsappProvider from "./_components/AddWhatsappProvider";
import { getTokenByPath } from "@/lib/helper";
import EditWhatsappProvider from "./_components/EditWhatsappProvider";
import DeleteProviderModal from "./_components/DeleteProviderModal";
import toast from "react-hot-toast";

const ProvidersPage: NextPageWithLayout = () => {
  const token = getTokenByPath();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProviders, setTotalProviders] = useState<number>(0);

  const [isOpenEditWhatsappModal, setIsOpenEditWhatsappModal] =
    useState<boolean>(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [permissions, _setPermissions] = useState({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
    canAssign: false,
  });

  const providersPerPage = 9;

  useEffect(() => {
    fetchAllProviders();
  }, [activeTab, currentPage, selectedType, searchQuery]);

  const fetchAllProviders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `/api/providers?status=${activeTab}&page=${currentPage}&limit=${providersPerPage}&type=${selectedType}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (data && data?.success) {
        const providersData: Provider[] = data?.data || [];
        setProviders(providersData);
        setTotalPages(data?.pagination?.totalPages || 1);
        setTotalProviders(data?.pagination?.totalResults || 0);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, selectedType, searchQuery]);

  const handleDeleteProvider = async () => {
    if (!selectedProvider) return;
    try {
      setIsDeleting(true);
      const { data } = await axios.delete(
        `/api/providers/delete-provider/${selectedProvider?._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data && data?.success) {
        const updatedproviders = providers?.filter(
          (p) => p?._id !== selectedProvider?._id,
        );
        setProviders(updatedproviders);
        setSelectedProvider(null);
        setIsOpenDeleteModal(false);
        toast.success(data?.message || "Provider deleted successfully");
      }
    } catch (error: any) {
      console.log("Error in deleting a provider: ", error?.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-green-100 text-green-800 border border-green-200",
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-800 border border-blue-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
    };

    const icons = {
      approved: <CheckCircle className="w-3 h-3" />,
      pending: <Clock className="w-3 h-3" />,
      "in-progress": <Clock className="w-3 h-3" />,
      rejected: <XCircle className="w-3 h-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
          styles[status as keyof typeof styles]
        }`}
      >
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: string[]) => {
    if (type.includes("whatsapp")) {
      return <Smartphone className="w-4 h-4 text-green-600" />;
    }
    if (type.includes("sms")) {
      return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
    if (type.includes("email")) {
      return <Mail className="w-4 h-4 text-purple-600" />;
    }
    if (type.includes("voice")) {
      return <Phone className="w-4 h-4 text-orange-600" />;
    }
    return <MessageSquare className="w-4 h-4 text-gray-600" />;
  };

  const getTypeBadge = (type: string[]) => {
    return type.map((t, index) => (
      <span
        key={index}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
          t === "whatsapp"
            ? "bg-green-50 text-green-700 border border-green-200"
            : t === "sms"
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : t === "email"
                ? "bg-purple-50 text-purple-700 border border-purple-200"
                : "bg-orange-50 text-orange-700 border border-orange-200"
        }`}
      >
        {getTypeIcon([t])}
        {t.toUpperCase()}
      </span>
    ));
  };

  const getEmailProviderIcon = (emailProviderType?: string) => {
    switch (emailProviderType) {
      case "gmail":
        return <Mail className="w-4 h-4 text-red-500" />;
      case "outlook":
        return <Mailbox className="w-4 h-4 text-blue-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const stats = {
    total: providers.length,
    active: providers.filter((p) => p.isActive).length,
    pending: providers.filter(
      (p) => p.status === "pending" || p.status === "in-progress",
    ).length,
    approved: providers.filter((p) => p.status === "approved").length,
    whatsapp: providers.filter((p) => p.type.includes("whatsapp")).length,
    sms: providers.filter((p) => p.type.includes("sms")).length,
    email: providers.filter((p) => p.type.includes("email")).length,
    voice: providers.filter((p) => p.type.includes("voice")).length,
    inboxAutomation: providers.filter((p) => p.inboxAutomation).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="px-6 pt-8 max-w-9xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Communication Providers
              </h1>
            </div>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Secure, encrypted communication channels for your clinic
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => fetchAllProviders()}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm text-xs sm:text-sm font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="cursor-pointer inline-flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Provider
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {stats.active}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-5 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">WhatsApp</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  {stats.whatsapp}
                </p>
              </div>
              <Smartphone className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">SMS</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {stats.sms}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Email</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {stats.email}
                </p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-9xl mx-auto">
        {/* Controls */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Tabs */}
              <div className="flex overflow-x-auto pb-2 -mx-2 px-2 bg-gray-100 p-1 rounded-xl">
                {["all", "approved", "pending", "in-progress", "rejected"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap mx-1 ${
                        activeTab === tab
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ),
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Table className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-gray-600 text-sm w-full sm:w-64 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 text-gray-600 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading providers...</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {providers?.map((provider) => {
              return (
                <div
                  key={provider._id}
                  className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-colors duration-300">
                          {getTypeIcon(provider.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {provider.label}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {provider.name}
                            </code>
                            {provider.country && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <GlobeIcon className="w-3 h-3" />
                                {provider.countryCode || provider.country}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {provider.type.includes("email") &&
                          provider.emailProviderType && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {getEmailProviderIcon(provider.emailProviderType)}
                              <span>{provider.emailProviderType}</span>
                            </div>
                          )}
                        {provider.type.includes("sms") &&
                          provider.numberType && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Hash className="w-3 h-3" />
                              <span>{provider.numberType}</span>
                            </div>
                          )}
                      </div>
                      {provider.inboxAutomation && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          <Bell className="w-3 h-3" />
                          Auto-Inbox
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Status Row */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-gray-500">Status</span>
                      {getStatusBadge(provider.status)}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-6">
                      {provider.phone && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Phone</span>
                          <span className="font-medium text-gray-900">
                            {provider.phone}
                          </span>
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Email</span>
                          <span className="font-medium text-gray-900">
                            {provider.email}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last Synced</span>
                        <span className="font-medium text-gray-900">
                          {provider.lastSyncedAt
                            ? formatDate(provider.lastSyncedAt)
                            : "Never"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Type</span>
                        <div className="flex gap-1">
                          {getTypeBadge(provider.type)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Created {formatDate(provider.createdAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="cursor-pointer p-2 border border-inherit hover:bg-white hover:border hover:border-gray-300 rounded-lg transition-colors"
                          title="Edit"
                          onClick={() => {
                            if (provider?.type?.includes("whatsapp")) {
                              setIsOpenEditWhatsappModal(true);
                              setSelectedProvider(provider);
                            }
                          }}
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          className="cursor-pointer p-2 border border-inherit hover:bg-white hover:border hover:border-gray-300 rounded-lg transition-colors"
                          title="Delete"
                          onClick={() => {
                            setIsOpenDeleteModal(true);
                            setSelectedProvider(provider);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Synced
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {providers?.map((provider) => {
                    return (
                      <tr
                        key={provider._id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getTypeIcon(provider.type)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {provider.label}
                              </div>
                              <div className="text-sm text-gray-500">
                                {provider.name}
                                {provider.inboxAutomation && (
                                  <span className="ml-2 inline-flex items-center gap-1 text-blue-600 text-xs">
                                    <Bell className="w-3 h-3" />
                                    Auto-Inbox
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              {getTypeBadge(provider.type)}
                            </div>
                            {provider.type.includes("email") &&
                              provider.emailProviderType && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {provider.emailProviderType}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(provider.status)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {provider.phone && (
                              <div className="text-gray-900">
                                {provider.phone}
                              </div>
                            )}
                            {provider.email && (
                              <div className="text-gray-500 text-xs">
                                {provider.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {provider.lastSyncedAt
                              ? formatDate(provider.lastSyncedAt)
                              : "Never"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(provider.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                              onClick={() => {
                                if (provider?.type?.includes("whatsapp")) {
                                  setIsOpenEditWhatsappModal(true);
                                  setSelectedProvider(provider);
                                }
                              }}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </button>

                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Delete"
                              onClick={() => {
                                setIsOpenDeleteModal(true);
                                setSelectedProvider(provider);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-purple-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {providers?.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <MessageSquare className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No providers found
            </h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-8">
              {searchQuery
                ? `No providers match "${searchQuery}"`
                : activeTab !== "all"
                  ? `No ${activeTab} providers found`
                  : "No communication providers configured yet"}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Provider
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {permissions.canRead && totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {(currentPage - 1) * providersPerPage + 1}-
            {Math.min(currentPage * providersPerPage, totalProviders)} of{" "}
            {totalProviders} provider
            {totalProviders === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Add New Provider
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Choose a communication channel
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* WhatsApp Card */}
                <div
                  onClick={() => setShowWhatsappModal(true)}
                  className="group border-2 border-gray-200 rounded-2xl p-6 hover:border-green-500 hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl mb-4 group-hover:from-green-100 group-hover:to-emerald-100 transition-colors duration-300">
                      <Smartphone className="w-10 h-10 text-green-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-2">
                      WhatsApp Business
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Send appointment reminders, notifications, and updates via
                      WhatsApp
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="w-3 h-3" />
                      End-to-end encrypted
                    </div>
                  </div>
                </div>

                {/* SMS Card */}
                <div className="group border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl mb-4 group-hover:from-blue-100 group-hover:to-cyan-100 transition-colors duration-300">
                      <MessageSquare className="w-10 h-10 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-2">
                      SMS Gateway
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Send SMS notifications, alerts, and reminders to patients
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Bell className="w-3 h-3" />
                      Real-time delivery
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="group border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-500 hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl mb-4 group-hover:from-purple-100 group-hover:to-pink-100 transition-colors duration-300">
                      <Mail className="w-10 h-10 text-purple-600" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-base mb-2">
                      Email Service
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Send transactional emails, newsletters, and appointment
                      confirmations
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Send className="w-3 h-3" />
                      High deliverability
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Info className="w-5 h-5 text-blue-500" />
                  <p>
                    All provider secrets are encrypted using AES-256 encryption
                    for maximum security
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add WhatsApp Provider Modal */}
      <AddWhatsappProvider
        isOpen={showWhatsappModal}
        onClose={() => setShowWhatsappModal(false)}
        onSuccess={() => {
          fetchAllProviders();
          setShowAddModal(false);
        }}
        token={token as string}
      />

      <EditWhatsappProvider
        providerId={selectedProvider!?._id}
        isOpen={isOpenEditWhatsappModal}
        onClose={() => setIsOpenEditWhatsappModal(false)}
        onUpdate={() => {
          fetchAllProviders();
          setSelectedProvider(null);
        }}
        token={token as string}
      />

      {/* Delete Provider Modal */}
      <DeleteProviderModal
        isOpen={isOpenDeleteModal}
        onClose={() => setIsOpenDeleteModal(false)}
        onConfirm={handleDeleteProvider}
        providerName={
          selectedProvider?.label ||
          selectedProvider?.phone ||
          selectedProvider?.email
        }
        loading={isDeleting}
      />
    </div>
  );
};

// Layout configuration
ProvidersPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedProvidersPage = withClinicAuth(
  ProvidersPage,
) as NextPageWithLayout;
ProtectedProvidersPage.getLayout = ProvidersPage.getLayout;

export default ProtectedProvidersPage;
