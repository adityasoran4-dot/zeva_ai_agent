"use client";

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChartBarIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  LinkIcon,
  TagIcon,
  GlobeAltIcon,
  DocumentDuplicateIcon,
  MapIcon,
  BellIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const SEOAudit = () => {
  const [entityType, setEntityType] = useState('clinic'); // clinic, doctor, blog, job, treatment
  const [entities, setEntities] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    healthy: 0,
    warning: 0,
    critical: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedEntities, setExpandedEntities] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [detailedAudit, setDetailedAudit] = useState(null);
  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [showJsonResponse, setShowJsonResponse] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 7,
    totalPages: 0,
    hasMore: false,
  });

  const fetchAuditData = async (type = entityType, page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!adminToken) {
        setError('Admin token not found. Please login.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`/api/admin/seo-audit?entityType=${type}&page=${page}&limit=7`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.data.success) {
        setEntities(response.data.entities || []);
        setSummary(response.data.summary || summary);
        setLastUpdated(response.data.lastUpdated || null);
        setPagination(response.data.pagination || pagination);
        setCurrentPage(page);
      } else {
        setError(response.data.message || 'Failed to fetch SEO audit data');
      }
    } catch (err) {
      console.error('Error fetching SEO audit:', err);
      setError(err?.response?.data?.message || 'Failed to fetch SEO audit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when entity type changes
    fetchAuditData(entityType, 1);
  }, [entityType]);

  const handleNextPage = () => {
    if (pagination.hasMore) {
      const nextPage = currentPage + 1;
      fetchAuditData(entityType, nextPage);
      // Scroll to top of the list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      fetchAuditData(entityType, prevPage);
      // Scroll to top of the list
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleExpanded = (entityId) => {
    const newExpanded = new Set(expandedEntities);
    if (newExpanded.has(entityId)) {
      newExpanded.delete(entityId);
      setDetailedAudit(null);
      setSelectedEntityId(null);
      setShowJsonResponse(false);
      setShowModal(false);
    } else {
      newExpanded.add(entityId);
      fetchDetailedAudit(entityId);
      setShowJsonResponse(false);
    }
    setExpandedEntities(newExpanded);
  };

  const openDetailedModal = async (entityId, e) => {
    e.stopPropagation(); // Prevent triggering toggleExpanded
    setSelectedEntityId(entityId);
    setShowModal(true);
    setActiveSection(null);
    await fetchDetailedAudit(entityId);
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    // Wait a bit for the modal content to render
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Find the scrollable container (modal content area)
        const scrollContainer = element.closest('.overflow-y-auto');
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop + (elementRect.top - containerRect.top) - 20; // 20px offset
          scrollContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
        } else {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 100);
  };

  const fetchDetailedAudit = async (entityId) => {
    try {
      setLoadingDetailed(true);
      setSelectedEntityId(entityId);

      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!adminToken) {
        setError('Admin token not found. Please login.');
        return;
      }

      const response = await axios.get(`/api/admin/seo-audit-detailed?entityType=${entityType}&entityId=${entityId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.data.success) {
        setDetailedAudit(response.data.audit);
      } else {
        setError(response.data.message || 'Failed to fetch detailed audit');
      }
    } catch (err) {
      console.error('Error fetching detailed audit:', err);
      setError(err?.response?.data?.message || 'Failed to fetch detailed audit');
    } finally {
      setLoadingDetailed(false);
    }
  };

  // Helper function to get color classes for explanations
  const getColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-50 border-green-200',
      red: 'bg-red-50 border-red-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      blue: 'bg-blue-50 border-blue-200',
      purple: 'bg-purple-50 border-purple-200',
      teal: 'bg-teal-50 border-teal-200',
      pink: 'bg-pink-50 border-pink-200',
      orange: 'bg-orange-50 border-orange-200',
      cyan: 'bg-cyan-50 border-cyan-200',
      gray: 'bg-gray-50 border-gray-200',
    };
    return colorMap[color] || 'bg-gray-50 border-gray-200';
  };

  // Helper function to get entity type name
  const getEntityTypeName = () => {
    const entityNames = {
      clinic: 'clinic',
      doctor: 'doctor',
      blog: 'blog',
      job: 'job',
      treatment: 'treatment',
    };
    return entityNames[entityType] || 'entity';
  };

  // Helper function to format location (handle GeoJSON objects)
  const formatLocation = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location.type && location.coordinates) {
      // GeoJSON format - extract coordinates or return formatted string
      if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
        return `${location.coordinates[1]}, ${location.coordinates[0]}`; // lat, lng
      }
      return 'Location available';
    }
    return String(location);
  };

  // Helper function to convert indexing decision to human language
  const explainIndexingDecision = (indexing) => {
    if (!indexing) return null;
    
    const entityName = getEntityTypeName();
    const entityNameCapitalized = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    const explanations = [];
    
    if (indexing.shouldIndex) {
      explanations.push({
        icon: '✅',
        title: `This ${entityName} WILL appear in Google search results`,
        description: `The ${entityName} profile is complete and meets all requirements for search engine indexing. Users will be able to find this ${entityName} when searching on Google, Bing, and other search engines.`,
        color: 'green'
      });
    } else {
      explanations.push({
        icon: '❌',
        title: `This ${entityName} will NOT appear in Google search results`,
        description: `The ${entityName} profile needs to be completed before it can be indexed. This helps ensure only quality, complete profiles appear in search results.`,
        color: 'red'
      });
    }

    explanations.push({
      icon: '📋',
      title: `Reason: ${indexing.reason}`,
      description: 'This explains why the indexing decision was made. Common reasons include profile completeness, content quality, or duplicate detection.',
      color: 'blue'
    });

    if (indexing.priority) {
      const priorityExplanations = {
        high: `This ${entityName} has high priority for indexing, meaning it will be crawled and indexed quickly by search engines.`,
        medium: `This ${entityName} has medium priority for indexing, meaning it will be processed in normal time.`,
        low: `This ${entityName} has low priority for indexing, meaning it may take longer to appear in search results.`
      };
      explanations.push({
        icon: '⭐',
        title: `Priority Level: ${indexing.priority.toUpperCase()}`,
        description: priorityExplanations[indexing.priority] || '',
        color: indexing.priority === 'high' ? 'green' : indexing.priority === 'medium' ? 'yellow' : 'gray'
      });
    }

    if (indexing.warnings && indexing.warnings.length > 0) {
      explanations.push({
        icon: '⚠️',
        title: `Warnings: ${indexing.warnings.length} issue(s) detected`,
        description: 'These warnings indicate potential issues that should be reviewed, but do not prevent indexing.',
        color: 'yellow',
        warnings: indexing.warnings
      });
    }

    return explanations;
  };

  // Helper function to convert robots meta to human language
  const explainRobotsMeta = (robots) => {
    if (!robots) return null;

    const entityName = getEntityTypeName();
    const explanations = [];
    
    if (robots.noindex) {
      explanations.push({
        icon: '🚫',
        title: 'Search engines are told NOT to index this page',
        description: `This means the ${entityName} page will not appear in search results. This is typically set when a profile is incomplete or needs review.`,
        color: 'red'
      });
    } else {
      explanations.push({
        icon: '✅',
        title: 'Search engines are allowed to index this page',
        description: `Google, Bing, and other search engines can crawl and include this ${entityName} in their search results.`,
        color: 'green'
      });
    }

    if (robots.nofollow) {
      explanations.push({
        icon: '🔗',
        title: 'Search engines are told NOT to follow links on this page',
        description: `Any links on this page will not pass SEO value to other pages. This is rarely used for ${entityName} pages.`,
        color: 'yellow'
      });
    } else {
      explanations.push({
        icon: '✅',
        title: 'Search engines can follow links on this page',
        description: 'Links on this page will be crawled and can pass SEO value to other pages.',
        color: 'green'
      });
    }

    explanations.push({
      icon: '📝',
      title: `Meta Tag Content: "${robots.content}"`,
      description: `This is the exact HTML meta tag that will be added to the ${entityName} page. It tells search engines how to handle this page.`,
      color: 'blue'
    });

    return explanations;
  };

  // Helper function to convert meta tags to human language
  const explainMetaTags = (meta) => {
    if (!meta) return null;

    const entityName = getEntityTypeName();
    const explanations = [];
    
    explanations.push({
      icon: '📄',
      title: 'Page Title',
      description: `"${meta.title}" - This is what appears as the clickable headline in Google search results. It should be clear, descriptive, and include the ${entityName} name.`,
      color: 'blue',
      length: meta.title.length,
      optimal: meta.title.length >= 50 && meta.title.length <= 60
    });

    explanations.push({
      icon: '📝',
      title: 'Page Description',
      description: `"${meta.description}" - This appears below the title in search results. It should summarize what the ${entityName} offers and encourage users to click.`,
      color: 'blue',
      length: meta.description.length,
      optimal: meta.description.length >= 120 && meta.description.length <= 160
    });

    if (meta.keywords && meta.keywords.length > 0) {
      explanations.push({
        icon: '🏷️',
        title: 'Keywords',
        description: `These keywords help search engines understand what this ${entityName} offers: ${meta.keywords.join(', ')}. While less important than before, they still help with SEO.`,
        color: 'purple'
      });
    }

    return explanations;
  };

  // Helper function to convert canonical URL to human language
  const explainCanonicalUrl = (canonical) => {
    if (!canonical) return null;

    const entityName = getEntityTypeName();
    return {
      icon: '🔗',
      title: 'Canonical URL',
      description: `This is the official, preferred URL for this ${entityName}: ${canonical}. If there are multiple URLs pointing to the same ${entityName}, search engines will use this one as the primary version. This prevents duplicate content issues.`,
      color: 'teal'
    };
  };

  // Helper function to convert duplicate check to human language
  const explainDuplicateCheck = (duplicateCheck) => {
    if (!duplicateCheck) return null;

    const entityName = getEntityTypeName();
    const explanations = [];
    
    if (duplicateCheck.isDuplicate) {
      explanations.push({
        icon: '⚠️',
        title: 'Potential Duplicate Content Detected',
        description: `This ${entityName} appears to be very similar to other ${entityName}s in the system. This could cause SEO issues if not addressed.`,
        color: 'red'
      });
    } else {
      explanations.push({
        icon: '✅',
        title: 'No Duplicate Content Found',
        description: `This ${entityName} is unique and does not appear to duplicate content from other ${entityName}s. This is good for SEO.`,
        color: 'green'
      });
    }

    const confidenceExplanations = {
      high: 'There is a high likelihood that this content is duplicated. Immediate action may be required.',
      medium: 'There is a moderate likelihood that this content is duplicated. Review recommended.',
      low: 'There is a low likelihood that this content is duplicated. This is likely fine.'
    };

    explanations.push({
      icon: '📊',
      title: `Confidence Level: ${duplicateCheck.confidence.toUpperCase()}`,
      description: confidenceExplanations[duplicateCheck.confidence] || '',
      color: duplicateCheck.confidence === 'high' ? 'red' : duplicateCheck.confidence === 'medium' ? 'yellow' : 'blue'
    });

    if (duplicateCheck.reason) {
      explanations.push({
        icon: '📋',
        title: `Reason: ${duplicateCheck.reason}`,
        description: 'This explains why the duplicate check returned this result.',
        color: 'gray'
      });
    }

    return explanations;
  };

  // Helper function to convert headings to human language
  const explainHeadings = (headings) => {
    if (!headings) return null;

    const explanations = [];
    
    const entityName = getEntityTypeName();
    if (headings.h1) {
      explanations.push({
        icon: '📌',
        title: 'Main Heading (H1)',
        description: `"${headings.h1}" - This is the main heading that appears at the top of the ${entityName} page. There should only be one H1 per page for SEO best practices.`,
        color: 'pink'
      });
    }

    if (headings.h2 && headings.h2.length > 0) {
      explanations.push({
        icon: '📑',
        title: `Section Headings (H2) - ${headings.h2.length} sections`,
        description: `These are the main section headings: ${headings.h2.join(', ')}. They help organize the page content and improve SEO structure.`,
        color: 'pink',
        list: headings.h2
      });
    }

    if (headings.h3 && headings.h3.length > 0) {
      explanations.push({
        icon: '📄',
        title: `Subsection Headings (H3) - ${headings.h3.length} subsections`,
        description: `These are subsection headings that provide more detail: ${headings.h3.join(', ')}.`,
        color: 'pink',
        list: headings.h3
      });
    }

    return explanations;
  };

  // Helper function to convert sitemap status to human language
  const explainSitemap = (sitemapUpdated) => {
    if (sitemapUpdated === undefined) return null;

    if (sitemapUpdated) {
      return {
        icon: '✅',
        title: 'Sitemap Successfully Updated',
        description: 'This clinic has been added to the sitemap file (sitemap-clinics.xml). Search engines use sitemaps to discover and crawl pages. This clinic will now be included when search engines check the sitemap.',
        color: 'green'
      };
    } else {
      return {
        icon: '❌',
        title: 'Sitemap Not Updated',
        description: 'The sitemap could not be updated. This may be due to an error or the clinic may not meet the requirements for sitemap inclusion.',
        color: 'red'
      };
    }
  };

  // Helper function to convert ping status to human language
  const explainPing = (pinged) => {
    if (pinged === undefined) return null;

    if (pinged) {
      return {
        icon: '✅',
        title: 'Search Engines Successfully Notified',
        description: 'Google and Bing have been notified about the sitemap update. This helps them discover and index this clinic faster than waiting for them to find it naturally.',
        color: 'green'
      };
    } else {
      return {
        icon: '⏳',
        title: 'Search Engine Notification Pending',
        description: 'The notification to search engines is still being processed. This usually happens automatically in the background and may take a few minutes.',
        color: 'yellow'
      };
    }
  };

  const getEntityDisplayName = (entity) => {
    return entity.displayName || entity.name || entity.title || entity.jobTitle || 'Unknown';
  };

  const getEntityDisplayLocation = (entity) => {
    if (entityType === 'treatment') {
      return entity.subcategories?.length > 0 
        ? `${entity.subcategories.length} sub-treatment(s)` 
        : 'No sub-treatments';
    }
    return entity.displayLocation || entity.address || entity.location || '';
  };

  const filteredEntities = entities.filter((entity) => {
    const displayName = getEntityDisplayName(entity);
    const displayLocation = getEntityDisplayLocation(entity);
    const locationStr = formatLocation(entity.location);
    
    const matchesSearch =
      displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      displayLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (entity.health && entity.health.overallHealth === filter);

    return matchesSearch && matchesFilter;
  });

  const getHealthColor = (health) => {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthIcon = (health) => {
    switch (health) {
      case 'healthy':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'critical':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <Head>
        <title>SEO Audit - Admin Dashboard</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold ml-4 mt-3 text-blue-600">SEO Health Report</h1>
            <p className="text-sm ml-4  text-blue-500">
              Simple Google visibility report
              {lastUpdated && (
                <span className="text-xs text-blue-400 ml-2">
                  (Last updated: {new Date(lastUpdated).toLocaleString()})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchAuditData(entityType, currentPage)}
            disabled={loading}
            className="flex items-center mr-3 mt-2 rounded gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 ml-3 mr-3 md:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s</p>
                <p className="text-xl font-bold text-gray-800 mt-1">{summary.total}</p>
              </div>
              <ChartBarIcon className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Healthy</p>
                <p className="text-xl font-bold text-green-600 mt-1">{summary.healthy}</p>
              </div>
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Warning</p>
                <p className="text-xl font-bold text-yellow-600 mt-1">{summary.warning}</p>
              </div>
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Critical</p>
                <p className="text-xl font-bold text-red-600 mt-1">{summary.critical}</p>
              </div>
              <XCircleIcon className="w-6 h-6 text-red-400" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Avg Score</p>
                <p className={`text-xl font-bold mt-1 ${getScoreColor(summary.averageScore)}`}>
                  {summary.averageScore}/100
                </p>
              </div>
              <ChartBarIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Entity Type Tabs */}
        <div className="bg-white p-3 rounded-lg mr-3 ml-3 shadow border border-gray-200">
          <div className="flex gap-2 mb-2">
            {[
              { id: 'clinic', label: 'Clinics', icon: '🏥' },
              { id: 'doctor', label: 'Doctors', icon: '👨‍⚕️' },
              { id: 'blog', label: 'Blogs', icon: '📝' },
              { id: 'job', label: 'Jobs', icon: '💼' },
              { id: 'treatment', label: 'Treatments', icon: '💊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setEntityType(tab.id);
                  setSearchTerm('');
                  setFilter('all');
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  entityType === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 ml-3 mr-3 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${entityType}s by name, address, or location...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('healthy')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filter === 'healthy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Healthy
              </button>
              <button
                onClick={() => setFilter('warning')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filter === 'warning'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Warning
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  filter === 'critical'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Critical
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">Loading SEO audit data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Clinics List */}
        {!loading && !error && (
          <div className="space-y-4">
            {filteredEntities.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
                <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No {entityType}s found matching your criteria.</p>
              </div>
            ) : (
              filteredEntities.map((entity) => {
                const isExpanded = expandedEntities.has(entity._id);
                const health = entity.health;

                return (
                  <div
                    key={entity._id}
                    className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mx-2"
                  >
                    {/* Entity Header */}
                    <div
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                        health ? getHealthColor(health.overallHealth) : 'bg-gray-50'
                      }`}
                      onClick={() => toggleExpanded(entity._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {health && getHealthIcon(health.overallHealth)}
                            <h3 className="text-base font-semibold text-gray-800">{getEntityDisplayName(entity)}</h3>
                            {health && (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded ${
                                  health.overallHealth === 'healthy'
                                    ? 'bg-green-100 text-green-700'
                                    : health.overallHealth === 'warning'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {health.overallHealth.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-4 text-xs text-gray-600">
                            {getEntityDisplayLocation(entity) && (
                              <span>📍 {getEntityDisplayLocation(entity)}</span>
                            )}
                            {entity.location && (
                              <span>🗺️ {formatLocation(entity.location)}</span>
                            )}
                            {(entity.slug || entity.paramlink) && (
                              <span>🔗 /{entityType}s/{entity.slug || entity.paramlink}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {health && (
                            <div className="text-right">
                              <p className={`text-xl font-bold ${getScoreColor(health.score)}`}>
                                {health.score}/100
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {health.issuesCount} issue{health.issuesCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                          <button
                            onClick={(e) => openDetailedModal(entity._id, e)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View detailed SEO audit"
                          >
                            <EyeIcon className="w-4 h-4 text-blue-600 hover:text-blue-700" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Refresh Detailed Audit Button */}
                    {isExpanded && selectedEntityId === entity._id && detailedAudit && (
                      <div className="px-6 pb-4 border-t border-gray-200">
                        <button
                          onClick={() => fetchDetailedAudit(entity._id)}
                          disabled={loadingDetailed}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          <ArrowPathIcon className={`w-4 h-4 ${loadingDetailed ? 'animate-spin' : ''}`} />
                          Refresh Detailed Audit
                        </button>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        {/* Loading Detailed Audit */}
                        {loadingDetailed && selectedEntityId === entity._id && (
                          <div className="text-center py-8">
                            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                            <p className="text-gray-600">Loading detailed SEO audit...</p>
                          </div>
                        )}

                        {/* Detailed SEO Pipeline Results */}
                        {!loadingDetailed && detailedAudit && selectedEntityId === entity._id && (
                          <div className="space-y-6">
                            {/* SEO Pipeline Overview */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                                📊 SEO Pipeline Results
                              </h4>
                              <p className="text-sm text-gray-600">
                                Full SEO pipeline execution results for this {entityType}
                              </p>
                            </div>

                            {/* 1. Indexing Decision Service */}
                            {detailedAudit.seoPipeline?.indexing && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                  <h5 className="font-semibold text-gray-800">1. Indexing Decision Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Determines if the clinic should be indexed by search engines based on completeness, duplicates, and content quality.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Should Index:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.indexing.shouldIndex
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.indexing.shouldIndex ? 'YES' : 'NO'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Reason:</span>
                                    <span className="ml-2 text-gray-600">{detailedAudit.seoPipeline.indexing.reason}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Priority:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.indexing.priority === 'high'
                                        ? 'bg-green-100 text-green-700'
                                        : detailedAudit.seoPipeline.indexing.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.indexing.priority.toUpperCase()}
                                    </span>
                                  </div>
                                  {detailedAudit.seoPipeline.indexing.warnings?.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-700">Warnings:</span>
                                      <ul className="list-disc list-inside ml-2 mt-1">
                                        {detailedAudit.seoPipeline.indexing.warnings.map((warning, idx) => (
                                          <li key={idx} className="text-sm text-yellow-700">{warning}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                {/* Human-readable explanation */}
                                {explainIndexingDecision(detailedAudit.seoPipeline.indexing) && (
                                  <div className="mt-4 space-y-3">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    {explainIndexingDecision(detailedAudit.seoPipeline.indexing).map((explanation, idx) => (
                                      <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                        <div className="flex items-start gap-3">
                                          <span className="text-xl">{explanation.icon}</span>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                            <p className="text-sm text-gray-600">{explanation.description}</p>
                                            {explanation.warnings && (
                                              <ul className="list-disc list-inside mt-2 space-y-1">
                                                {explanation.warnings.map((warning, wIdx) => (
                                                  <li key={wIdx} className="text-sm text-yellow-700">{warning}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 2. Robots Meta Service */}
                            {detailedAudit.seoPipeline?.robots && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                                  <h5 className="font-semibold text-gray-800">2. Robots Meta Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Generates meta robots tags to control how search engines crawl and index the page.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                  <div>
                                    <span className="font-medium text-gray-700">Content:</span>
                                    <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm">
                                      {detailedAudit.seoPipeline.robots.content}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.robots.noindex
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.robots.noindex ? 'NOINDEX' : 'INDEX'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.robots.nofollow
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.robots.nofollow ? 'NOFOLLOW' : 'FOLLOW'}
                                    </span>
                                  </div>
                                </div>
                                {/* Human-readable explanation */}
                                {explainRobotsMeta(detailedAudit.seoPipeline.robots) && (
                                  <div className="mt-4 space-y-3">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    {explainRobotsMeta(detailedAudit.seoPipeline.robots).map((explanation, idx) => (
                                      <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                        <div className="flex items-start gap-3">
                                          <span className="text-xl">{explanation.icon}</span>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                            <p className="text-sm text-gray-600">{explanation.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 3. Meta Tags Service */}
                            {detailedAudit.seoPipeline?.meta && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <TagIcon className="w-5 h-5 text-indigo-600" />
                                  <h5 className="font-semibold text-gray-800">3. Meta Tags Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Generates SEO-optimized meta title, description, and keywords for search engine results.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                  <div>
                                    <span className="font-medium text-gray-700">Title:</span>
                                    <p className="mt-1 text-gray-800">{detailedAudit.seoPipeline.meta.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Length: {detailedAudit.seoPipeline.meta.title.length} characters
                                      {detailedAudit.seoPipeline.meta.title.length < 50 && ' (Too short)'}
                                      {detailedAudit.seoPipeline.meta.title.length > 60 && ' (Too long)'}
                                      {detailedAudit.seoPipeline.meta.title.length >= 50 && detailedAudit.seoPipeline.meta.title.length <= 60 && ' ✓ Optimal'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Description:</span>
                                    <p className="mt-1 text-gray-800">{detailedAudit.seoPipeline.meta.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Length: {detailedAudit.seoPipeline.meta.description.length} characters
                                      {detailedAudit.seoPipeline.meta.description.length < 120 && ' (Too short)'}
                                      {detailedAudit.seoPipeline.meta.description.length > 160 && ' (Too long)'}
                                      {detailedAudit.seoPipeline.meta.description.length >= 120 && detailedAudit.seoPipeline.meta.description.length <= 160 && ' ✓ Optimal'}
                                    </p>
                                  </div>
                                  {detailedAudit.seoPipeline.meta.keywords && detailedAudit.seoPipeline.meta.keywords.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-700">Keywords:</span>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {detailedAudit.seoPipeline.meta.keywords.map((keyword, idx) => (
                                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                            {keyword}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {/* Human-readable explanation */}
                                {explainMetaTags(detailedAudit.seoPipeline.meta) && (
                                  <div className="mt-4 space-y-3">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    {explainMetaTags(detailedAudit.seoPipeline.meta).map((explanation, idx) => (
                                      <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                        <div className="flex items-start gap-3">
                                          <span className="text-xl">{explanation.icon}</span>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                            <p className="text-sm text-gray-600">{explanation.description}</p>
                                            {explanation.length !== undefined && (
                                              <p className={`text-xs mt-2 ${explanation.optimal ? 'text-green-700' : 'text-yellow-700'}`}>
                                                {explanation.optimal ? '✓ Length is optimal for SEO' : `⚠ Length: ${explanation.length} characters (${explanation.length < 50 || explanation.length < 120 ? 'too short' : 'too long'})`}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 4. Canonical URL Service */}
                            {detailedAudit.seoPipeline?.canonical && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <LinkIcon className="w-5 h-5 text-teal-600" />
                                  <h5 className="font-semibold text-gray-800">4. Canonical URL Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Resolves the canonical URL to prevent duplicate content issues and ensure search engines know the preferred version.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div>
                                    <span className="font-medium text-gray-700">Canonical URL:</span>
                                    <p className="mt-1 text-blue-600 break-all">{detailedAudit.seoPipeline.canonical}</p>
                                  </div>
                                </div>
                                {/* Human-readable explanation */}
                                {explainCanonicalUrl(detailedAudit.seoPipeline.canonical) && (
                                  <div className="mt-4">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    <div className={`${getColorClasses(explainCanonicalUrl(detailedAudit.seoPipeline.canonical).color)} rounded-lg p-4`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explainCanonicalUrl(detailedAudit.seoPipeline.canonical).icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explainCanonicalUrl(detailedAudit.seoPipeline.canonical).title}</p>
                                          <p className="text-sm text-gray-600">{explainCanonicalUrl(detailedAudit.seoPipeline.canonical).description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 5. Duplicate Content Service */}
                            {detailedAudit.seoPipeline?.duplicateCheck && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <DocumentDuplicateIcon className="w-5 h-5 text-orange-600" />
                                  <h5 className="font-semibold text-gray-800">5. Duplicate Content Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Checks for duplicate or similar content across other clinics to prevent SEO penalties.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Is Duplicate:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.duplicateCheck.isDuplicate
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.duplicateCheck.isDuplicate ? 'YES' : 'NO'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Confidence:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.duplicateCheck.confidence === 'high'
                                        ? 'bg-red-100 text-red-700'
                                        : detailedAudit.seoPipeline.duplicateCheck.confidence === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.duplicateCheck.confidence.toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Reason:</span>
                                    <span className="ml-2 text-gray-600">{detailedAudit.seoPipeline.duplicateCheck.reason}</span>
                                  </div>
                                </div>
                                {/* Human-readable explanation */}
                                {explainDuplicateCheck(detailedAudit.seoPipeline.duplicateCheck) && (
                                  <div className="mt-4 space-y-3">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    {explainDuplicateCheck(detailedAudit.seoPipeline.duplicateCheck).map((explanation, idx) => (
                                      <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                        <div className="flex items-start gap-3">
                                          <span className="text-xl">{explanation.icon}</span>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                            <p className="text-sm text-gray-600">{explanation.description}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 6. Heading Service */}
                            {detailedAudit.seoPipeline?.headings && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <DocumentTextIcon className="w-5 h-5 text-pink-600" />
                                  <h5 className="font-semibold text-gray-800">6. Heading Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Generates structured heading plan (H1, H2, H3) to prevent duplicate headings and improve SEO structure.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                  <div>
                                    <span className="font-medium text-gray-700">H1:</span>
                                    <p className="mt-1 text-gray-800 font-semibold">{detailedAudit.seoPipeline.headings.h1}</p>
                                  </div>
                                  {detailedAudit.seoPipeline.headings.h2 && detailedAudit.seoPipeline.headings.h2.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-700">H2 Headings:</span>
                                      <ul className="list-disc list-inside mt-1 space-y-1">
                                        {detailedAudit.seoPipeline.headings.h2.map((h2, idx) => (
                                          <li key={idx} className="text-gray-700">{h2}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {detailedAudit.seoPipeline.headings.h3 && detailedAudit.seoPipeline.headings.h3.length > 0 && (
                                    <div>
                                      <span className="font-medium text-gray-700">H3 Headings:</span>
                                      <ul className="list-disc list-inside mt-1 space-y-1">
                                        {detailedAudit.seoPipeline.headings.h3.map((h3, idx) => (
                                          <li key={idx} className="text-gray-700">{h3}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                {/* Human-readable explanation */}
                                {explainHeadings(detailedAudit.seoPipeline.headings) && (
                                  <div className="mt-4 space-y-3">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    {explainHeadings(detailedAudit.seoPipeline.headings).map((explanation, idx) => (
                                      <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                        <div className="flex items-start gap-3">
                                          <span className="text-xl">{explanation.icon}</span>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                            <p className="text-sm text-gray-600">{explanation.description}</p>
                                            {explanation.list && (
                                              <ul className="list-disc list-inside mt-2 space-y-1">
                                                {explanation.list.map((item, lIdx) => (
                                                  <li key={lIdx} className="text-sm text-gray-700">{item}</li>
                                                ))}
                                              </ul>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 7. Sitemap Service */}
                            {detailedAudit.seoPipeline?.sitemapUpdated !== undefined && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapIcon className="w-5 h-5 text-green-600" />
                                  <h5 className="font-semibold text-gray-800">7. Sitemap Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Updates the XML sitemap to include this clinic for search engine discovery.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Sitemap Updated:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.sitemapUpdated
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.sitemapUpdated ? 'YES' : 'NO'}
                                    </span>
                                  </div>
                                  {detailedAudit.seoPipeline.sitemapUpdated && (
                                    <p className="text-sm text-gray-600 mt-2">
                                      File: <code className="bg-gray-200 px-2 py-1 rounded">sitemap-clinics.xml</code>
                                    </p>
                                  )}
                                </div>
                                {/* Human-readable explanation */}
                                {explainSitemap(detailedAudit.seoPipeline.sitemapUpdated) && (
                                  <div className="mt-4">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    <div className={`${getColorClasses(explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).color)} rounded-lg p-4`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).title}</p>
                                          <p className="text-sm text-gray-600">{explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 8. Sitemap Ping Service */}
                            {detailedAudit.seoPipeline?.pinged !== undefined && (
                              <div className="bg-white border border-gray-200 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <BellIcon className="w-5 h-5 text-cyan-600" />
                                  <h5 className="font-semibold text-gray-800">8. Sitemap Ping Service</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  Notifies Google and Bing search engines about sitemap updates for faster indexing.
                                </p>
                                <div className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-700">Search Engines Pinged:</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      detailedAudit.seoPipeline.pinged
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {detailedAudit.seoPipeline.pinged ? 'YES' : 'PENDING'}
                                    </span>
                                  </div>
                                </div>
                                {/* Human-readable explanation */}
                                {explainPing(detailedAudit.seoPipeline.pinged) && (
                                  <div className="mt-4">
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2">📖 What This Means:</h6>
                                    <div className={`${getColorClasses(explainPing(detailedAudit.seoPipeline.pinged).color)} rounded-lg p-4`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explainPing(detailedAudit.seoPipeline.pinged).icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explainPing(detailedAudit.seoPipeline.pinged).title}</p>
                                          <p className="text-sm text-gray-600">{explainPing(detailedAudit.seoPipeline.pinged).description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SEO Health Check Section - Enhanced */}
                            {detailedAudit.healthCheck && (
                              <div className="bg-white border-2 border-blue-300 rounded-lg p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                  <h5 className="font-semibold text-gray-800">SEO Health Check Summary</h5>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                  Comprehensive health check results including issues and recommendations. This shows the overall SEO health of the clinic profile.
                                </p>
                                
                                {/* Overall Health Status */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <span className="text-sm font-medium text-gray-700">Overall Health Status:</span>
                                      <span className={`ml-3 px-3 py-1 rounded text-sm font-medium ${
                                        detailedAudit.healthCheck.overallHealth === 'healthy'
                                          ? 'bg-green-100 text-green-700'
                                          : detailedAudit.healthCheck.overallHealth === 'warning'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {detailedAudit.healthCheck.overallHealth === 'healthy' ? '✅ HEALTHY' : 
                                         detailedAudit.healthCheck.overallHealth === 'warning' ? '⚠️ WARNING' : 
                                         '🚨 CRITICAL'}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-sm font-medium text-gray-700">Health Score:</span>
                                      <span className={`ml-2 text-2xl font-bold ${getScoreColor(detailedAudit.healthCheck.score)}`}>
                                        {detailedAudit.healthCheck.score}/100
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">
                                    {detailedAudit.healthCheck.overallHealth === 'healthy' 
                                      ? '✅ This clinic profile is in good SEO health. All major SEO requirements are met.'
                                      : detailedAudit.healthCheck.overallHealth === 'warning'
                                      ? '⚠️ This clinic profile has some SEO issues that should be addressed. Review the warnings below.'
                                      : '🚨 This clinic profile has critical SEO issues that need immediate attention. Review the critical issues below.'}
                                  </p>
                                </div>

                                {/* Issue Breakdown */}
                                <div className="space-y-4">
                                  {/* Critical Issues */}
                                  {detailedAudit.healthCheck.issues.filter(i => i.severity === 'critical').length > 0 && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                        <XCircleIcon className="w-5 h-5" />
                                        Critical Issues ({detailedAudit.healthCheck.issues.filter(i => i.severity === 'critical').length})
                                      </h6>
                                      <p className="text-xs text-gray-600 mb-3">
                                        These are serious issues that can significantly impact SEO performance and search visibility. They should be fixed immediately.
                                      </p>
                                      <div className="space-y-2">
                                        {detailedAudit.healthCheck.issues.filter(i => i.severity === 'critical').map((issue, idx) => (
                                          <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <p className="font-medium text-red-800 mb-1">{issue.message}</p>
                                                <p className="text-sm text-gray-700 mb-2">{issue.type}</p>
                                                {issue.field && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Field:</span> {issue.field}
                                                  </p>
                                                )}
                                                {issue.expected && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Expected:</span> {issue.expected}
                                                  </p>
                                                )}
                                                {issue.actual && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Current:</span> {issue.actual}
                                                  </p>
                                                )}
                                                {issue.fix && (
                                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                    <p className="text-xs font-medium text-green-800 mb-1">💡 How to Fix:</p>
                                                    <p className="text-xs text-green-700">{issue.fix}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Warning Issues */}
                                  {detailedAudit.healthCheck.issues.filter(i => i.severity === 'warning').length > 0 && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                                        <ExclamationTriangleIcon className="w-5 h-5" />
                                        Warnings ({detailedAudit.healthCheck.issues.filter(i => i.severity === 'warning').length})
                                      </h6>
                                      <p className="text-xs text-gray-600 mb-3">
                                        These are potential issues that could affect SEO performance. They should be reviewed and addressed when possible.
                                      </p>
                                      <div className="space-y-2">
                                        {detailedAudit.healthCheck.issues.filter(i => i.severity === 'warning').map((issue, idx) => (
                                          <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <p className="font-medium text-yellow-800 mb-1">{issue.message}</p>
                                                <p className="text-sm text-gray-700 mb-2">{issue.type}</p>
                                                {issue.field && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Field:</span> {issue.field}
                                                  </p>
                                                )}
                                                {issue.expected && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Expected:</span> {issue.expected}
                                                  </p>
                                                )}
                                                {issue.actual && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Current:</span> {issue.actual}
                                                  </p>
                                                )}
                                                {issue.fix && (
                                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                    <p className="text-xs font-medium text-green-800 mb-1">💡 How to Fix:</p>
                                                    <p className="text-xs text-green-700">{issue.fix}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Info Issues */}
                                  {detailedAudit.healthCheck.issues.filter(i => i.severity === 'info').length > 0 && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                        <InformationCircleIcon className="w-5 h-5" />
                                        Information ({detailedAudit.healthCheck.issues.filter(i => i.severity === 'info').length})
                                      </h6>
                                      <p className="text-xs text-gray-600 mb-3">
                                        These are informational notes that may help improve SEO but are not urgent issues.
                                      </p>
                                      <div className="space-y-2">
                                        {detailedAudit.healthCheck.issues.filter(i => i.severity === 'info').map((issue, idx) => (
                                          <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                              <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <p className="font-medium text-blue-800 mb-1">{issue.message}</p>
                                                <p className="text-sm text-gray-700 mb-2">{issue.type}</p>
                                                {issue.field && (
                                                  <p className="text-xs text-gray-600 mb-1">
                                                    <span className="font-medium">Field:</span> {issue.field}
                                                  </p>
                                                )}
                                                {issue.fix && (
                                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                    <p className="text-xs font-medium text-green-800 mb-1">💡 Suggestion:</p>
                                                    <p className="text-xs text-green-700">{issue.fix}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recommendations */}
                                  {detailedAudit.healthCheck.recommendations && detailedAudit.healthCheck.recommendations.length > 0 && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <InformationCircleIcon className="w-5 h-5 text-green-600" />
                                        Recommendations ({detailedAudit.healthCheck.recommendations.length})
                                      </h6>
                                      <p className="text-xs text-gray-600 mb-3">
                                        These are suggestions to improve the SEO performance of this clinic profile.
                                      </p>
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <ul className="list-disc list-inside space-y-2">
                                          {detailedAudit.healthCheck.recommendations.map((rec, idx) => (
                                            <li key={idx} className="text-sm text-gray-700">{rec}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}

                                  {/* No Issues Message */}
                                  {detailedAudit.healthCheck.issues.length === 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                      <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                      <p className="font-medium text-green-800">Perfect! No SEO issues detected.</p>
                                      <p className="text-sm text-green-700 mt-1">This clinic profile meets all SEO requirements.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Full JSON Response - Collapsible */}
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                              <button
                                onClick={() => setShowJsonResponse(!showJsonResponse)}
                                className="flex items-center justify-between w-full mb-3"
                              >
                                <div className="flex items-center gap-2">
                                  <h5 className="font-semibold text-gray-800">📋 Complete API Response (Technical)</h5>
                                  <span className="text-xs text-gray-500">(For developers)</span>
                                </div>
                                {showJsonResponse ? (
                                  <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <EyeIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              {showJsonResponse && (
                                <>
                                  <p className="text-sm text-gray-600 mb-3">
                                    This is the raw JSON response from SEO pipeline and health check services. All information above has been converted to human-readable format for easier understanding.
                                  </p>
                                  <div className="bg-gray-900 rounded p-3 overflow-x-auto max-h-96 overflow-y-auto">
                                    <pre className="text-xs text-green-400">
                                      {JSON.stringify(detailedAudit, null, 2)}
                                    </pre>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Health Check Issues (if detailed audit not loaded yet) */}
                        {!loadingDetailed && !detailedAudit && health && (
                          <div className="space-y-6">
                            {/* Issues */}
                            {health.issues.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  Issues ({health.issues.length})
                                </h4>
                                <div className="space-y-3">
                                  {health.issues.map((issue, index) => (
                                    <div
                                      key={index}
                                      className={`p-4 rounded-lg border ${
                                        issue.severity === 'critical'
                                          ? 'bg-red-50 border-red-200'
                                          : issue.severity === 'warning'
                                          ? 'bg-yellow-50 border-yellow-200'
                                          : 'bg-blue-50 border-blue-200'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                          {issue.severity === 'critical' && (
                                            <XCircleIcon className="w-5 h-5 text-red-600" />
                                          )}
                                          {issue.severity === 'warning' && (
                                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
                                          )}
                                          {issue.severity === 'info' && (
                                            <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800">{issue.message}</p>
                                          {issue.field && (
                                            <p className="text-sm text-gray-600 mt-1">
                                              <span className="font-medium">Field:</span> {issue.field}
                                            </p>
                                          )}
                                          {issue.expected && (
                                            <p className="text-sm text-gray-600">
                                              <span className="font-medium">Expected:</span> {issue.expected}
                                            </p>
                                          )}
                                          {issue.actual && (
                                            <p className="text-sm text-gray-600">
                                              <span className="font-medium">Actual:</span> {issue.actual}
                                            </p>
                                          )}
                                          {issue.fix && (
                                            <p className="text-sm text-green-700 mt-2">
                                              <span className="font-medium">Fix:</span> {issue.fix}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommendations */}
                            {health.recommendations.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  Recommendations ({health.recommendations.length})
                                </h4>
                                <ul className="list-disc list-inside space-y-2">
                                  {health.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-gray-700">
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Last Checked */}
                            {health.lastChecked && (
                              <div className="text-xs text-gray-500">
                                Last checked: {new Date(health.lastChecked).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Pagination Controls */}
            {!loading && !error && pagination.totalPages > 1 && (
              <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} {entityType}s
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={!pagination.hasMore || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed SEO Audit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowModal(false);
                setActiveSection(null);
              }}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                  <div>
                  <h2 className="text-2xl font-bold text-blue-800">
                    Detailed SEO Audit
                  </h2>
                  {detailedAudit && (() => {
                    const entityData = detailedAudit[entityType] || {};
                    const displayName = entityData.name || entityData.title || entityData.jobTitle || 'Unknown';
                    const displayLocation = entityData.address || entityData.location || '';
                    return displayLocation ? (
                      <p className="text-sm text-blue-600 mt-1">
                        {displayName} • {displayLocation}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">
                        {displayName}
                      </p>
                    );
                  })()}
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setActiveSection(null);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-1 overflow-hidden bg-blue-50/10">
                  {/* Sidebar Removed as per request */}

                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {loadingDetailed ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                          <p className="text-gray-600">Loading detailed SEO audit...</p>
                        </div>
                      </div>
                    ) : detailedAudit ? (
                      <div className="space-y-6 max-w-5xl mx-auto">
                        {/* SEO Pipeline Overview */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="text-lg font-semibold text-blue-800 mb-2">
                            📊 SEO Audit Results
                          </h4>
                          <p className="text-sm text-blue-600">
                            Here are the simple results of your clinic's visibility check.
                          </p>
                        </div>

                        {/* 1. Indexing Decision Service */}
                        {detailedAudit.seoPipeline?.indexing && (
                          <div id="indexing" className="scroll-mt-4">
                            {(() => {
                              const section = (
                                <div className="bg-white border border-blue-100 rounded-lg p-5">
                                  <div className="flex items-center gap-2 mb-3">
                                    <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                    <h5 className="font-semibold text-blue-800">1. Can Google Find This? (Indexing)</h5>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">
                                    Checks if this page is allowed to be shown in Google search results.
                                  </p>
                                  <div className="bg-blue-50/50 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-700">Should Index:</span>
                                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        detailedAudit.seoPipeline.indexing.shouldIndex
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {detailedAudit.seoPipeline.indexing.shouldIndex ? 'YES' : 'NO'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">Reason:</span>
                                      <span className="ml-2 text-gray-600">{detailedAudit.seoPipeline.indexing.reason}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium text-gray-700">Priority:</span>
                                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                        detailedAudit.seoPipeline.indexing.priority === 'high'
                                          ? 'bg-green-100 text-green-700'
                                          : detailedAudit.seoPipeline.indexing.priority === 'medium'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {detailedAudit.seoPipeline.indexing.priority.toUpperCase()}
                                      </span>
                                    </div>
                                    {detailedAudit.seoPipeline.indexing.warnings?.length > 0 && (
                                      <div>
                                        <span className="font-medium text-gray-700">Warnings:</span>
                                        <ul className="list-disc list-inside ml-2 mt-1">
                                          {detailedAudit.seoPipeline.indexing.warnings.map((warning, idx) => (
                                            <li key={idx} className="text-sm text-yellow-700">{warning}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  {/* Human-readable explanation */}
                                  {explainIndexingDecision(detailedAudit.seoPipeline.indexing) && (
                                    <div className="mt-4 space-y-3">
                                      <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                      {explainIndexingDecision(detailedAudit.seoPipeline.indexing).map((explanation, idx) => (
                                        <div key={idx} className={`${getColorClasses(explanation.color).replace('bg-gray', 'bg-blue').replace('border-gray', 'border-blue')} rounded-lg p-4 bg-opacity-30`}>
                                          <div className="flex items-start gap-3">
                                            <span className="text-xl">{explanation.icon}</span>
                                            <div className="flex-1">
                                              <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                              <p className="text-sm text-gray-600">{explanation.description}</p>
                                              {explanation.warnings && (
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                  {explanation.warnings.map((warning, wIdx) => (
                                                    <li key={wIdx} className="text-sm text-yellow-700">{warning}</li>
                                                  ))}
                                                </ul>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                              return section;
                            })()}
                          </div>
                        )}

                        {/* 2. Robots Meta Service */}
                        {detailedAudit.seoPipeline?.robots && (
                          <div id="robots" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <GlobeAltIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">2. Search Engine Instructions (Robots)</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                Technical rules for search robots (like 'Allowed' or 'Blocked').
                              </p>
                              <div className="bg-blue-50/50 rounded-lg p-4 space-y-2">
                                <div>
                                  <span className="font-medium text-gray-700">Content:</span>
                                  <code className="ml-2 px-2 py-1 bg-blue-100 rounded text-sm text-blue-800">
                                    {detailedAudit.seoPipeline.robots.content}
                                  </code>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    detailedAudit.seoPipeline.robots.noindex
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {detailedAudit.seoPipeline.robots.noindex ? 'NOINDEX (Hidden)' : 'INDEX (Visible)'}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    detailedAudit.seoPipeline.robots.nofollow
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {detailedAudit.seoPipeline.robots.nofollow ? 'NOFOLLOW (Ignore Links)' : 'FOLLOW (Follow Links)'}
                                  </span>
                                </div>
                              </div>
                              {/* Human-readable explanation */}
                              {explainRobotsMeta(detailedAudit.seoPipeline.robots) && (
                                <div className="mt-4 space-y-3">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  {explainRobotsMeta(detailedAudit.seoPipeline.robots).map((explanation, idx) => (
                                    <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4 bg-opacity-30`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explanation.icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                          <p className="text-sm text-gray-600">{explanation.description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. Meta Tags Service */}
                        {detailedAudit.seoPipeline?.meta && (
                          <div id="meta" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <TagIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">3. Page Title & Description</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                How your page looks in search results (Title and Description).
                              </p>
                              <div className="bg-blue-50/50 rounded-lg p-4 space-y-3">
                                <div>
                                  <span className="font-medium text-gray-700">Title (Headline):</span>
                                  <p className="mt-1 text-gray-800 bg-white p-2 rounded border border-blue-100">{detailedAudit.seoPipeline.meta.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Length: {detailedAudit.seoPipeline.meta.title.length} characters
                                    {detailedAudit.seoPipeline.meta.title.length < 50 && ' (Too short)'}
                                    {detailedAudit.seoPipeline.meta.title.length > 60 && ' (Too long)'}
                                    {detailedAudit.seoPipeline.meta.title.length >= 50 && detailedAudit.seoPipeline.meta.title.length <= 60 && ' ✓ Optimal'}
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Description (Summary):</span>
                                  <p className="mt-1 text-gray-800 bg-white p-2 rounded border border-blue-100">{detailedAudit.seoPipeline.meta.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Length: {detailedAudit.seoPipeline.meta.description.length} characters
                                    {detailedAudit.seoPipeline.meta.description.length < 120 && ' (Too short)'}
                                    {detailedAudit.seoPipeline.meta.description.length > 160 && ' (Too long)'}
                                    {detailedAudit.seoPipeline.meta.description.length >= 120 && detailedAudit.seoPipeline.meta.description.length <= 160 && ' ✓ Optimal'}
                                  </p>
                                </div>
                                {detailedAudit.seoPipeline.meta.keywords && detailedAudit.seoPipeline.meta.keywords.length > 0 && (
                                  <div>
                                    <span className="font-medium text-gray-700">Keywords:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {detailedAudit.seoPipeline.meta.keywords.map((keyword, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                          {keyword}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {/* Human-readable explanation */}
                              {explainMetaTags(detailedAudit.seoPipeline.meta) && (
                                <div className="mt-4 space-y-3">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  {explainMetaTags(detailedAudit.seoPipeline.meta).map((explanation, idx) => (
                                    <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4 bg-opacity-30`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explanation.icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                          <p className="text-sm text-gray-600">{explanation.description}</p>
                                          {explanation.length !== undefined && (
                                            <p className={`text-xs mt-2 ${explanation.optimal ? 'text-green-700' : 'text-yellow-700'}`}>
                                              {explanation.optimal ? '✓ Length is good' : `⚠ Length: ${explanation.length} characters (${explanation.length < 50 || explanation.length < 120 ? 'too short' : 'too long'})`}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 4. Canonical URL Service */}
                        {detailedAudit.seoPipeline?.canonical && (
                          <div id="canonical" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <LinkIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">Is This The Original Link? (Canonical)</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                We checked if this is the main link that search engines should show.
                              </p>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div>
                                  <span className="font-medium text-gray-700">Canonical URL:</span>
                                  <p className="mt-1 text-blue-600 break-all">{detailedAudit.seoPipeline.canonical}</p>
                                </div>
                              </div>
                              {/* Human-readable explanation */}
                              {explainCanonicalUrl(detailedAudit.seoPipeline.canonical) && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  <div className={`${getColorClasses(explainCanonicalUrl(detailedAudit.seoPipeline.canonical).color)} rounded-lg p-4`}>
                                    <div className="flex items-start gap-3">
                                      <span className="text-xl">{explainCanonicalUrl(detailedAudit.seoPipeline.canonical).icon}</span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800 mb-1">{explainCanonicalUrl(detailedAudit.seoPipeline.canonical).title}</p>
                                        <p className="text-sm text-gray-600">{explainCanonicalUrl(detailedAudit.seoPipeline.canonical).description}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 5. Duplicate Content Service */}
                        {detailedAudit.seoPipeline?.duplicateCheck && (
                          <div id="duplicate" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <DocumentDuplicateIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">Is This Content Unique? (Duplicate Check)</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                We checked if your content is original. Search engines prefer unique content.
                              </p>
                              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">Is Duplicate:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    detailedAudit.seoPipeline.duplicateCheck.isDuplicate
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {detailedAudit.seoPipeline.duplicateCheck.isDuplicate ? 'YES' : 'NO'}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Confidence:</span>
                                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                    detailedAudit.seoPipeline.duplicateCheck.confidence === 'high'
                                      ? 'bg-red-100 text-red-700'
                                      : detailedAudit.seoPipeline.duplicateCheck.confidence === 'medium'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {detailedAudit.seoPipeline.duplicateCheck.confidence.toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Reason:</span>
                                  <span className="ml-2 text-gray-600">{detailedAudit.seoPipeline.duplicateCheck.reason}</span>
                                </div>
                              </div>
                              {/* Human-readable explanation */}
                              {explainDuplicateCheck(detailedAudit.seoPipeline.duplicateCheck) && (
                                <div className="mt-4 space-y-3">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  {explainDuplicateCheck(detailedAudit.seoPipeline.duplicateCheck).map((explanation, idx) => (
                                    <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explanation.icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                          <p className="text-sm text-gray-600">{explanation.description}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 6. Heading Service */}
                        {detailedAudit.seoPipeline?.headings && (
                          <div id="headings" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">Are Headings Correct? (Structure)</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                We checked your page titles and subtitles to make sure they are organized correctly.
                              </p>
                              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                                <div>
                                  <span className="font-medium text-gray-700">H1:</span>
                                  <p className="mt-1 text-gray-800 font-semibold">{detailedAudit.seoPipeline.headings.h1}</p>
                                </div>
                                {detailedAudit.seoPipeline.headings.h2 && detailedAudit.seoPipeline.headings.h2.length > 0 && (
                                  <div>
                                    <span className="font-medium text-gray-700">H2 Headings:</span>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      {detailedAudit.seoPipeline.headings.h2.map((h2, idx) => (
                                        <li key={idx} className="text-gray-700">{h2}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {detailedAudit.seoPipeline.headings.h3 && detailedAudit.seoPipeline.headings.h3.length > 0 && (
                                  <div>
                                    <span className="font-medium text-gray-700">H3 Headings:</span>
                                    <ul className="list-disc list-inside mt-1 space-y-1">
                                      {detailedAudit.seoPipeline.headings.h3.map((h3, idx) => (
                                        <li key={idx} className="text-gray-700">{h3}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              {/* Human-readable explanation */}
                              {explainHeadings(detailedAudit.seoPipeline.headings) && (
                                <div className="mt-4 space-y-3">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  {explainHeadings(detailedAudit.seoPipeline.headings).map((explanation, idx) => (
                                    <div key={idx} className={`${getColorClasses(explanation.color)} rounded-lg p-4`}>
                                      <div className="flex items-start gap-3">
                                        <span className="text-xl">{explanation.icon}</span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-800 mb-1">{explanation.title}</p>
                                          <p className="text-sm text-gray-600">{explanation.description}</p>
                                          {explanation.list && (
                                            <ul className="list-disc list-inside mt-2 space-y-1">
                                              {explanation.list.map((item, lIdx) => (
                                                <li key={lIdx} className="text-sm text-gray-700">{item}</li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 7. Sitemap Service */}
                        {detailedAudit.seoPipeline?.sitemapUpdated !== undefined && (
                          <div id="sitemap" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <MapIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">Is It Listed? (Sitemap)</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                We checked if your page is listed in the map that search engines use to find your site.
                              </p>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">Sitemap Updated:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    detailedAudit.seoPipeline.sitemapUpdated
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {detailedAudit.seoPipeline.sitemapUpdated ? 'YES' : 'NO'}
                                  </span>
                                </div>
                                {detailedAudit.seoPipeline.sitemapUpdated && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    File: <code className="bg-gray-200 px-2 py-1 rounded">sitemap-clinics.xml</code>
                                  </p>
                                )}
                              </div>
                              {/* Human-readable explanation */}
                              {explainSitemap(detailedAudit.seoPipeline.sitemapUpdated) && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  <div className={`${getColorClasses(explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).color)} rounded-lg p-4`}>
                                    <div className="flex items-start gap-3">
                                      <span className="text-xl">{explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).icon}</span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800 mb-1">{explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).title}</p>
                                        <p className="text-sm text-gray-600">{explainSitemap(detailedAudit.seoPipeline.sitemapUpdated).description}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 8. Sitemap Ping Service */}
                        {detailedAudit.seoPipeline?.pinged !== undefined && (
                          <div id="ping" className="scroll-mt-4">
                            <div className="bg-white border border-blue-100 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <BellIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-blue-800">Did We Tell Google? (Ping)</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                We notified search engines that your page exists or has been updated.
                              </p>
                              <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-700">Search Engines Pinged:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    detailedAudit.seoPipeline.pinged
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {detailedAudit.seoPipeline.pinged ? 'YES' : 'PENDING'}
                                  </span>
                                </div>
                              </div>
                              {/* Human-readable explanation */}
                              {explainPing(detailedAudit.seoPipeline.pinged) && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-semibold text-blue-700 mb-2">📖 What This Means:</h6>
                                  <div className={`${getColorClasses(explainPing(detailedAudit.seoPipeline.pinged).color)} rounded-lg p-4`}>
                                    <div className="flex items-start gap-3">
                                      <span className="text-xl">{explainPing(detailedAudit.seoPipeline.pinged).icon}</span>
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-800 mb-1">{explainPing(detailedAudit.seoPipeline.pinged).title}</p>
                                        <p className="text-sm text-gray-600">{explainPing(detailedAudit.seoPipeline.pinged).description}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SEO Health Check Summary */}
                        {detailedAudit.healthCheck && (
                          <div id="health" className="scroll-mt-4">
                            {/* Same health check content as before */}
                            <div className="bg-white border-2 border-blue-300 rounded-lg p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <ChartBarIcon className="w-5 h-5 text-blue-600" />
                                <h5 className="font-semibold text-gray-800">SEO Health Check Summary</h5>
                              </div>
                              <p className="text-sm text-gray-600 mb-4">
                                Comprehensive health check results including issues and recommendations. This shows the overall SEO health of the clinic profile.
                              </p>
                              
                              {/* Overall Health Status */}
                              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Overall Health Status:</span>
                                    <span className={`ml-3 px-3 py-1 rounded text-sm font-medium ${
                                      detailedAudit.healthCheck.overallHealth === 'healthy'
                                        ? 'bg-green-100 text-green-700'
                                        : detailedAudit.healthCheck.overallHealth === 'warning'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {detailedAudit.healthCheck.overallHealth === 'healthy' ? '✅ HEALTHY' : 
                                       detailedAudit.healthCheck.overallHealth === 'warning' ? '⚠️ WARNING' : 
                                       '🚨 CRITICAL'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-medium text-gray-700">Health Score:</span>
                                    <span className={`ml-2 text-2xl font-bold ${getScoreColor(detailedAudit.healthCheck.score)}`}>
                                      {detailedAudit.healthCheck.score}/100
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                  {detailedAudit.healthCheck.overallHealth === 'healthy' 
                                    ? '✅ This clinic profile is in good SEO health. All major SEO requirements are met.'
                                    : detailedAudit.healthCheck.overallHealth === 'warning'
                                    ? '⚠️ This clinic profile has some SEO issues that should be addressed. Review the warnings below.'
                                    : '🚨 This clinic profile has critical SEO issues that need immediate attention. Review the critical issues below.'}
                                </p>
                              </div>

                              {/* Issue Breakdown - Same as before */}
                              <div className="space-y-4">
                                {/* Critical Issues */}
                                {detailedAudit.healthCheck.issues.filter(i => i.severity === 'critical').length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                                      <XCircleIcon className="w-5 h-5" />
                                      Critical Issues ({detailedAudit.healthCheck.issues.filter(i => i.severity === 'critical').length})
                                    </h6>
                                    <p className="text-xs text-gray-600 mb-3">
                                      These are serious issues that can significantly impact SEO performance and search visibility. They should be fixed immediately.
                                    </p>
                                    <div className="space-y-2">
                                      {detailedAudit.healthCheck.issues.filter(i => i.severity === 'critical').map((issue, idx) => (
                                        <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="font-medium text-red-800 mb-1">{issue.message}</p>
                                              <p className="text-sm text-gray-700 mb-2">{issue.type}</p>
                                              {issue.field && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Field:</span> {issue.field}
                                                </p>
                                              )}
                                              {issue.expected && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Expected:</span> {issue.expected}
                                                </p>
                                              )}
                                              {issue.actual && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Current:</span> {issue.actual}
                                                </p>
                                              )}
                                              {issue.fix && (
                                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                  <p className="text-xs font-medium text-green-800 mb-1">💡 How to Fix:</p>
                                                  <p className="text-xs text-green-700">{issue.fix}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Warning Issues */}
                                {detailedAudit.healthCheck.issues.filter(i => i.severity === 'warning').length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                                      <ExclamationTriangleIcon className="w-5 h-5" />
                                      Warnings ({detailedAudit.healthCheck.issues.filter(i => i.severity === 'warning').length})
                                    </h6>
                                    <p className="text-xs text-gray-600 mb-3">
                                      These are potential issues that could affect SEO performance. They should be reviewed and addressed when possible.
                                    </p>
                                    <div className="space-y-2">
                                      {detailedAudit.healthCheck.issues.filter(i => i.severity === 'warning').map((issue, idx) => (
                                        <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="font-medium text-yellow-800 mb-1">{issue.message}</p>
                                              <p className="text-sm text-gray-700 mb-2">{issue.type}</p>
                                              {issue.field && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Field:</span> {issue.field}
                                                </p>
                                              )}
                                              {issue.expected && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Expected:</span> {issue.expected}
                                                </p>
                                              )}
                                              {issue.actual && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Current:</span> {issue.actual}
                                                </p>
                                              )}
                                              {issue.fix && (
                                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                  <p className="text-xs font-medium text-green-800 mb-1">💡 How to Fix:</p>
                                                  <p className="text-xs text-green-700">{issue.fix}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Info Issues */}
                                {detailedAudit.healthCheck.issues.filter(i => i.severity === 'info').length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                                      <InformationCircleIcon className="w-5 h-5" />
                                      Information ({detailedAudit.healthCheck.issues.filter(i => i.severity === 'info').length})
                                    </h6>
                                    <p className="text-xs text-gray-600 mb-3">
                                      These are informational notes that may help improve SEO but are not urgent issues.
                                    </p>
                                    <div className="space-y-2">
                                      {detailedAudit.healthCheck.issues.filter(i => i.severity === 'info').map((issue, idx) => (
                                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="font-medium text-blue-800 mb-1">{issue.message}</p>
                                              <p className="text-sm text-gray-700 mb-2">{issue.type}</p>
                                              {issue.field && (
                                                <p className="text-xs text-gray-600 mb-1">
                                                  <span className="font-medium">Field:</span> {issue.field}
                                                </p>
                                              )}
                                              {issue.fix && (
                                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                                  <p className="text-xs font-medium text-green-800 mb-1">💡 Suggestion:</p>
                                                  <p className="text-xs text-green-700">{issue.fix}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recommendations */}
                                {detailedAudit.healthCheck.recommendations && detailedAudit.healthCheck.recommendations.length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      <InformationCircleIcon className="w-5 h-5 text-green-600" />
                                      Recommendations ({detailedAudit.healthCheck.recommendations.length})
                                    </h6>
                                    <p className="text-xs text-gray-600 mb-3">
                                      These are suggestions to improve the SEO performance of this clinic profile.
                                    </p>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                      <ul className="list-disc list-inside space-y-2">
                                        {detailedAudit.healthCheck.recommendations.map((rec, idx) => (
                                          <li key={idx} className="text-sm text-gray-700">{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}

                                {/* No Issues Message */}
                                {detailedAudit.healthCheck.issues.length === 0 && (
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                    <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium text-green-800">Perfect! No SEO issues detected.</p>
                                    <p className="text-sm text-green-700 mt-1">This clinic profile meets all SEO requirements.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No detailed audit data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

SEOAudit.getLayout = function PageLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedSEOAudit = withAdminAuth(SEOAudit);
ProtectedSEOAudit.getLayout = SEOAudit.getLayout;

export default ProtectedSEOAudit;
