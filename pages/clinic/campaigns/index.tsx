import ClinicLayout from "@/components/ClinicLayout";
import withClinicAuth from "@/components/withClinicAuth";
import React, { ReactElement, useEffect } from "react";
import { NextPageWithLayout } from "../../_app";
import {
  Search,
  Plus,
  X,
  Edit2,
  Trash2,
  Eye,
  Grid,
  List,
  RefreshCcw,
  Play,
  Pause,
  BarChart3,
  Send,
  Download,
  MessageSquare,
  Mail,
  Copy,
} from "lucide-react";
import CreateCampaignModal from "./_components/CreateCampaignModal";
import DeleteCampaignModal from "./_components/DeleteCampaignModal";
import PreviewCampaignModal from "./_components/PreviewCampaignModal";
import useCampaigns from "@/hooks/useCampaigns";
import { FaWhatsapp } from "react-icons/fa";

const CampaignsPage: NextPageWithLayout = () => {
  const {
    state,
    setCurrentPage,
    setFilterType,
    setFilterStatus,
    setViewMode,
    // setIsRefreshing,
    setSelectedCampaign,
    // setPreviewCampaign,
    setShowPreviewModal,
    setShowCreateModal,
    // setCreateLoading,
    setShowActionModal,
    setActionType,
    // setActionLoading,
    setSearchQuery,
    setShowDeleteCampaignModal,
    fetchCampaigns,
    handleCreateCampaign,
    handleCampaignAction,
    refreshCampaigns,
    handleActionConfirm,
    handleDeleteCampaign,
    calculateProgress,
    formatDate,
    formatNumber,
    getStatusBadge,
    getCampaignTypeBadge,
    getCampaignTypeIcon,
    // handleDeleteCampaign,
  } = useCampaigns();
  const {
    campaigns,
    currentPage,
    totalPages,
    totalCampaigns,
    loading,
    searchQuery,
    filterType,
    filterStatus,
    viewMode,
    isRefreshing,
    selectedCampaign,
    previewCampaign,
    showPreviewModal,
    showCreateModal,
    createLoading,
    showActionModal,
    actionType,
    actionLoading,
    showDeleteCampaignModal,
    // deleteCampaignLoading,
    campaignsPerPage,
    isDuplicating,
    isExporting,
  } = state;

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Campaigns
            </h1>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
              Manage your communication campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshCampaigns}
              disabled={isRefreshing}
              className={`inline-flex items-center justify-center cursor-pointer gap-1.5 ${
                !isRefreshing ? "bg-white" : "bg-gray-200"
              } border border-gray-200 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium`}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {!isRefreshing ? "Refresh" : "Refreshing..."}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
            >
              <Plus className="h-5 w-5" />
              Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatNumber(totalCampaigns)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">WhatsApp Campaigns</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {campaigns.filter((c) => c.type === "whatsapp").length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <FaWhatsapp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Email Campaigns</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {campaigns.filter((c) => c.type === "email").length}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <Mail className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SMS Campaigns</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {campaigns.filter((c) => c.type === "sms").length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search campaigns by name, description..."
              className="w-full pl-10 pr-4 py-2.5 text-gray-500 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid" ? "bg-white shadow" : "hover:bg-gray-100"
              }`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list" ? "bg-white shadow" : "hover:bg-gray-100"
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Channel
            </label>
            <select
              className="bg-white border border-gray-300 text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="bg-white border border-gray-300 text-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="processing">Processing</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const progress = calculateProgress(campaign);
            return (
              <div
                key={campaign._id}
                className="flex flex-col justify-between bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Campaign Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg">
                          {getCampaignTypeIcon(campaign.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 truncate max-w-[180px]">
                            {campaign.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {campaign.recipients.length} recipients
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(campaign.status)}
                      </div>
                    </div>

                    {/* Type and Schedule */}
                    <div className="flex items-center gap-2 mt-2">
                      {getCampaignTypeBadge(campaign.type)}
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded">
                        {campaign.scheduleType === "now"
                          ? "Send Now"
                          : `Scheduled: ${campaign.scheduleTime?.date} at ${campaign.scheduleTime?.time}`}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Content Preview */}
                  <div className="p-4">
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {campaign.description || "No description"}
                    </p>

                    {/* Progress Bar */}
                    {campaign.status === "processing" && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {campaign.sentMessages} of {campaign.totalMessages}{" "}
                          sent
                        </div>
                      </div>
                    )}

                    {/* Metrics */}
                    {(campaign.status === "completed" ||
                      campaign.sentMessages > 0) && (
                      <div className="border-t border-gray-100 pt-4 mb-3">
                        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                          Campaign Analytics
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 mb-1">
                              Sent
                            </div>
                            <div className="text-lg font-bold text-blue-700">
                              {formatNumber(campaign.sentMessages || 0)}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-green-600 mb-1">
                              Delivered
                            </div>
                            <div className="text-lg font-bold text-green-700">
                              {formatNumber(campaign.deliveredMessages || 0)}
                            </div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-purple-600 mb-1">
                              Read
                            </div>
                            <div className="text-lg font-bold text-purple-700">
                              {formatNumber(campaign.readMessages || 0)}
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-red-600 mb-1">
                              Failed
                            </div>
                            <div className="text-lg font-bold text-red-700">
                              {formatNumber(campaign.failedMessages || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Additional metrics for email */}
                        {campaign.type === "email" && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-orange-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-orange-600 mb-1">
                                Opened
                              </div>
                              <div className="text-lg font-bold text-orange-700">
                                {formatNumber(campaign.openedMessages || 0)}
                              </div>
                            </div>
                            <div className="bg-teal-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-teal-600 mb-1">
                                Clicked
                              </div>
                              <div className="text-lg font-bold text-teal-700">
                                {formatNumber(campaign.clickedMessages || 0)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Success Rate */}
                        {campaign.totalMessages > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Delivery Rate</span>
                              <span className="font-semibold">
                                {Math.round(
                                  (campaign.deliveredMessages /
                                    campaign.totalMessages) *
                                    100,
                                )}
                                %
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.round((campaign.deliveredMessages / campaign.totalMessages) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {campaign.scheduleType === "later" &&
                      campaign.status === "scheduled"
                        ? `Scheduled ${formatDate(campaign.createdAt)}`
                        : `Created ${formatDate(campaign.createdAt)}`}
                    </div>
                    <div className="flex items-center gap-2">
                      {campaign.status === "completed" && (
                        <button
                          onClick={() =>
                            handleCampaignAction("duplicate", campaign._id)
                          }
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Duplicate"
                          disabled={isDuplicating}
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      )}
                      {campaign.status === "draft" && (
                        <button
                          onClick={() =>
                            handleCampaignAction("edit", campaign._id)
                          }
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          handleCampaignAction("preview", campaign._id)
                        }
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {campaign.status === "completed" && (
                        <button
                          onClick={() =>
                            handleCampaignAction("export", campaign._id)
                          }
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Export Analytics"
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}

                      {["processing", "paused"].includes(campaign.status) && (
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setActionType(
                              campaign.status === "processing"
                                ? "pause"
                                : "resume",
                            );
                            setShowActionModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                          title={
                            campaign.status === "processing"
                              ? "Pause"
                              : "Resume"
                          }
                        >
                          {campaign.status === "processing" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {[
                        "draft",
                        "scheduled",
                        "paused",
                        "failed",
                        "completed",
                      ].includes(campaign.status) && (
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowDeleteCampaignModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => {
                  const progress = calculateProgress(campaign);
                  return (
                    <tr key={campaign._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 min-w-[250px]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                            {getCampaignTypeIcon(campaign.type)}
                          </div>
                          <div>
                            <div className="text-base font-medium text-gray-800">
                              {campaign.name?.length > 18
                                ? campaign.name?.slice(0, 18) + "..."
                                : campaign.name || "Untitled Campaign"}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 line-clamp-1 max-w-md">
                              {campaign.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getCampaignTypeBadge(campaign.type)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {formatNumber(campaign.recipients.length)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {campaign.status === "processing" ? (
                          <div className="w-32">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{progress}%</span>
                              <span>
                                {campaign.sentMessages}/{campaign.totalMessages}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ) : campaign.status === "completed" ||
                          campaign.sentMessages > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-gray-600">Sent:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatNumber(campaign.sentMessages || 0)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">
                                  Delivered:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {formatNumber(campaign.sentMessages || 0)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                <span className="text-gray-600">Read:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatNumber(campaign.sentMessages || 0)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                <span className="text-gray-600">Failed:</span>
                                <span className="font-semibold text-gray-900">
                                  {formatNumber(campaign.failedMessages || 0)}
                                </span>
                              </div>
                            </div>
                            {campaign.totalMessages > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full"
                                  style={{
                                    width: `${Math.round((campaign.deliveredMessages / campaign.totalMessages) * 100)}%`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            {campaign.status === "failed"
                              ? "Failed"
                              : "Pending"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleCampaignAction("preview", campaign._id)
                            }
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {campaign.status === "completed" && (
                            <button
                              onClick={() =>
                                handleCampaignAction("duplicate", campaign._id)
                              }
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title="Duplicate"
                              disabled={isDuplicating}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}

                          {campaign.status === "draft" && (
                            <button
                              onClick={() =>
                                handleCampaignAction("edit", campaign._id)
                              }
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {campaign.status === "completed" && (
                            <button
                              onClick={() =>
                                handleCampaignAction("export", campaign._id)
                              }
                              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title="Export Analytics"
                              disabled={isExporting}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}

                          {[
                            "draft",
                            "scheduled",
                            "paused",
                            "failed",
                            "completed",
                          ].includes(campaign.status) && (
                            <button
                              onClick={() => {
                                setSelectedCampaign(campaign);
                                setShowDeleteCampaignModal(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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

      {/* Empty State */}
      {campaigns.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Send className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            No campaigns found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || filterType !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Get started by creating your first communication campaign."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center cursor-pointer gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm font-medium"
          >
            <Plus className="h-5 w-5" />
            Create Campaign
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Pagination */}
      {campaigns.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {(currentPage - 1) * campaignsPerPage + 1}-
            {currentPage * campaignsPerPage} of {totalCampaigns} campaign
            {totalCampaigns === 1 ? "" : "s"}
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

      {/* Preview Modal */}
      <PreviewCampaignModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        campaign={previewCampaign}
      />

      {/* Action Confirmation Modal */}
      {showActionModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowActionModal(false);
              setActionType("");
            }}
          />
          <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-lg ${
                    actionType === "pause"
                      ? "bg-yellow-50 text-yellow-600"
                      : actionType === "resume"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {actionType === "pause" ? (
                    <Pause className="h-6 w-6" />
                  ) : actionType === "resume" ? (
                    <Play className="h-6 w-6" />
                  ) : (
                    <X className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {actionType === "pause"
                      ? "Pause Campaign"
                      : actionType === "resume"
                        ? "Resume Campaign"
                        : "Cancel Campaign"}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                {actionType === "pause"
                  ? `Are you sure you want to pause "${selectedCampaign.name}"? The campaign will stop sending messages.`
                  : actionType === "resume"
                    ? `Are you sure you want to resume "${selectedCampaign.name}"? The campaign will continue sending messages.`
                    : `Are you sure you want to cancel "${selectedCampaign.name}"? This action cannot be undone.`}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setActionType("");
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionConfirm}
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                    actionType === "pause"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : actionType === "resume"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading
                    ? "Processing..."
                    : actionType === "pause"
                      ? "Pause Campaign"
                      : actionType === "resume"
                        ? "Resume Campaign"
                        : "Cancel Campaign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Campaign Modal */}
      <DeleteCampaignModal
        isOpen={showDeleteCampaignModal}
        onClose={() => setShowDeleteCampaignModal(false)}
        onConfirm={() => handleDeleteCampaign(selectedCampaign?._id)}
        campaignName={selectedCampaign?.name}
        campaignStatus={selectedCampaign?.status}
      />

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateCampaign={handleCreateCampaign}
        loading={createLoading}
      />
    </div>
  );
};

// Layout configuration
CampaignsPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <ClinicLayout hideSidebar={false} hideHeader={false}>
      {page}
    </ClinicLayout>
  );
};

// Export protected page with auth
const ProtectedCampaignsPage = withClinicAuth(
  CampaignsPage,
) as NextPageWithLayout;
ProtectedCampaignsPage.getLayout = CampaignsPage.getLayout;

export default ProtectedCampaignsPage;
