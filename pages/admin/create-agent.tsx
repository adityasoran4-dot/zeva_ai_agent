'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useRouter } from 'next/router';
import CreateAgentModal from '../../components/CreateAgentModal';
import AgentPermissionModal from '../../components/AgentPermissionModal';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import type { NextPageWithLayout } from '../_app';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  KeyIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  FunnelIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isApproved: boolean;
  declined: boolean;
  role?: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Toast Component
const Toast = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircleIcon className="w-4 h-4" />,
    error: <XCircleIcon className="w-4 h-4" />,
    info: <InformationCircleIcon className="w-4 h-4" />,
    warning: <ExclamationTriangleIcon className="w-4 h-4" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`${colors[toast.type]} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-xs animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="flex-1 font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded p-0.5 transition-colors"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

const ManageAgentsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [doctorStaff, setDoctorStaff] = useState<Agent[]>([]);
  const [activeView, setActiveView] = useState<'agents' | 'doctorStaff'>('agents');
  const [menuAgentId, setMenuAgentId] = useState<string | null>(null);
  const [passwordAgent, setPasswordAgent] = useState<Agent | null>(null);
  const [permissionAgent, setPermissionAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 15;

  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  // Check if user is an admin or agent - use state to ensure reactivity
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
  
  // Always call the hook (React rules), but only use it if isAgent is true
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "create_agent" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const adminToken =
    typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const agentToken =
    typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;

  async function loadAgents() {
    try {
      setLoading(true);
      const token = adminToken || agentToken;
      const { data } = await axios.get('/api/lead-ms/get-agents?role=agent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setAgents(data.agents);
        showToast(`Loaded ${data.agents.length} agent(s) successfully`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setAgents([]);
        showToast('You do not have permission to view agents', 'error');
      } else {
        showToast('Failed to load agents. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDoctorStaff() {
    try {
      setLoading(true);
      const token = adminToken || agentToken;
      const { data } = await axios.get('/api/lead-ms/get-agents?role=doctorStaff', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setDoctorStaff(data.agents);
        showToast(`Loaded ${data.agents.length} doctor staff member(s) successfully`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setDoctorStaff([]);
        showToast('You do not have permission to view doctor staff', 'error');
      } else {
        showToast('Failed to load doctor staff. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadAll() {
    await Promise.all([loadAgents(), loadDoctorStaff()]);
  }

  useEffect(() => {
    if (isAdmin) {
      loadAll();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          loadAll();
        }
      }
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions]);

  async function handleAction(agentId: string, action: string) {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if (!adminTokenExists && (isAgentRoute || isAgent) && agentTokenExists && agentPermissions) {
      if (action === 'approve' || action === 'decline') {
        if (agentPermissions.canApprove !== true && agentPermissions.canAll !== true) {
          showToast("You do not have permission to approve/decline agents", 'error');
          return;
        }
      }
    }
    
    const token = adminToken || agentToken;
    showToast(`${action === 'approve' ? 'Approving' : 'Declining'} agent...`, 'info');
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId, action },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        } else {
          setAgents((prev) =>
            prev.map((a) => (a._id === agentId ? data.agent : a))
          );
        }
        showToast(`Agent ${action === 'approve' ? 'approved' : 'declined'} successfully`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || `Failed to ${action} agent. Please try again.`, 'error');
    }
  }

  async function handleDelete(agentId: string) {
    if (!agentId) return;
    
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if (!adminTokenExists && (isAgentRoute || isAgent) && agentTokenExists && agentPermissions) {
      if (agentPermissions.canDelete !== true && agentPermissions.canAll !== true) {
        showToast("You do not have permission to delete agents", 'error');
        return;
      }
    }
    
    const token = adminToken || agentToken;
    showToast('Deleting agent...', 'info');
    try {
      const { data } = await axios.delete(
        '/api/lead-ms/delete-agent',
        {
          data: { agentId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        // Remove from the appropriate list
        if (data.deletedUser.role === 'doctorStaff') {
          setDoctorStaff((prev) => prev.filter((a) => a._id !== agentId));
        } else {
          setAgents((prev) => prev.filter((a) => a._id !== agentId));
        }
        setDeleteAgent(null);
        setMenuAgentId(null);
        showToast(`${data.deletedUser.role === 'doctorStaff' ? 'Doctor staff' : 'Agent'} deleted successfully`, 'success');
      } else {
        showToast(data?.message || 'Failed to delete agent', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete agent. Please try again.', 'error');
      setDeleteAgent(null);
    }
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordAgent) return;
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if (!adminTokenExists && (isAgentRoute || isAgent) && agentTokenExists && agentPermissions) {
      if (agentPermissions.canUpdate !== true && agentPermissions.canAll !== true) {
        showToast("You do not have permission to reset passwords", 'error');
        return;
      }
    }
    
    const token = adminToken || agentToken;
    showToast('Updating password...', 'info');
    try {
      const { data } = await axios.patch(
        '/api/lead-ms/get-agents',
        { agentId: passwordAgent._id, action: 'resetPassword', newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        if (data.agent.role === 'doctorStaff') {
          setDoctorStaff((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        } else {
          setAgents((prev) => prev.map((a) => (a._id === passwordAgent._id ? data.agent : a)));
        }
        setPasswordAgent(null);
        setNewPassword('');
        setConfirmPassword('');
        setMenuAgentId(null);
        showToast('Password updated successfully', 'success');
      } else {
        showToast(data?.message || 'Failed to reset password', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to reset password. Please try again.', 'error');
    }
  }

  // Filter and paginate data
  const filteredList = useMemo(() => {
    const list = activeView === 'agents' ? agents : doctorStaff;
    if (!searchTerm.trim()) return list;
    
    const term = searchTerm.toLowerCase().trim();
    return list.filter((agent) => 
      agent.name?.toLowerCase().includes(term) ||
      agent.email?.toLowerCase().includes(term) ||
      agent.phone?.toLowerCase().includes(term)
    );
  }, [activeView, agents, doctorStaff, searchTerm]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, endIndex);

  // Reset to page 1 when search term or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeView]);

  const currentList = paginatedList;
  const totalAgents = agents.length;
  const approvedAgents = agents.filter((a: Agent) => a.isApproved).length;
  const declinedAgents = agents.filter((a: Agent) => a.declined).length;
  const totalDoctorStaff = doctorStaff.length;
  const approvedDoctorStaff = doctorStaff.filter((a: Agent) => a.isApproved).length;
  const declinedDoctorStaff = doctorStaff.filter((a: Agent) => a.declined).length;

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (isAgent && permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied message if agent doesn't have read permission
  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-5">
          <div className="bg-red-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
            <XCircleIcon className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-base text-gray-700 mb-4">
            You do not have permission to view agent management. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-5">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-800 p-2.5 rounded-xl shadow-sm">
                <UserGroupIcon className="w-7 h-7 text-white " />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-xl font-bold text-blue-900 mb-1">
                  Agent Management
                </h1>
                <p className="text-sm sm:text-base text-blue-700">
                  Create and manage agent accounts and permissions
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm sm:text-base font-medium transition-all shadow-sm w-full sm:w-auto ${
                  showFilters
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Filters</span>
                <span className="xs:hidden">Filter</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200">
            {[
              { 
                title: activeView === 'agents' ? 'Total Agents' : 'Total Staff', 
                value: activeView === 'agents' ? totalAgents : totalDoctorStaff, 
                icon: UserGroupIcon, 
                color: 'bg-blue-500' 
              },
              { 
                title: 'Approved', 
                value: activeView === 'agents' ? approvedAgents : approvedDoctorStaff, 
                icon: CheckCircleIcon, 
                color: 'bg-green-500' 
              },
              { 
                title: 'Declined', 
                value: activeView === 'agents' ? declinedAgents : declinedDoctorStaff, 
                icon: XCircleIcon, 
                color: 'bg-red-500' 
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-gray-50 rounded-xl border border-blue-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide mb-1 truncate">{stat.title}</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-2 sm:p-2.5 rounded-lg text-white shadow-sm flex-shrink-0 ml-2`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="bg-white rounded-xl shadow-md border border-blue-200 p-3 sm:p-4">
          {/* Tabs with Create Button */}
          <div className="border-b border-blue-200 mb-3 sm:mb-4 pb-2 sm:pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <nav className="flex space-x-2 sm:space-x-4 md:space-x-6 flex-shrink-0 overflow-x-auto -mx-3 sm:-mx-0 px-3 sm:px-0 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveView('agents');
                    setCurrentPage(1);
                    showToast('Switched to Agents view', 'info');
                  }}
                  className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    activeView === 'agents'
                      ? 'border-blue-800 text-blue-800'
                      : 'border-transparent text-blue-700 hover:text-blue-900 hover:border-blue-300'
                  }`}
                >
                  Agents ({totalAgents})
                </button>
                {/* <button
                  onClick={() => {
                    setActiveView('doctorStaff');
                    setCurrentPage(1);
                    showToast('Switched to Doctor Staff view', 'info');
                  }}
                  className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-sm sm:text-base transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                    activeView === 'doctorStaff'
                      ? 'border-gray-800 text-gray-800'
                      : 'border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  Doctor Staff ({totalDoctorStaff})
                </button> */}
              </nav>
              
              {/* Create Button */}
              {(() => {
                const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                
                const shouldShowAction = (action: 'create' | 'update' | 'approve') => {
                  if (adminTokenExists) {
                    return true;
                  }
                  
                  if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists) {
                    if (permissionsLoading || !agentPermissions) {
                      return false;
                    }
                    
                    if (action === 'create') {
                      return agentPermissions.canCreate === true || agentPermissions.canAll === true;
                    }
                  }
                  
                  return false;
                };
                
                return shouldShowAction('create') ? (
                  <button 
                    onClick={() => setIsCreateOpen(true)} 
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex-shrink-0 whitespace-nowrap"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    Create Agent
                  </button>
                ) : null;
              })()}
            </div>
          </div>

          {/* Search Bar */}
          {showFilters && (
            <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Search & Filter</h3>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    showToast('Filters cleared', 'info');
                  }}
                  className="flex items-center gap-1 text-sm sm:text-base text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-700 hover:text-gray-900"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {searchTerm && (
            <div className="mb-3 text-base text-gray-700">
              Showing {filteredList.length} result(s) for "{searchTerm}"
            </div>
          )}
        </div>

        {/* Agents Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg sm:text-xl font-semibold text-blue-900">{activeView === 'agents' ? 'Agents' : 'Doctor Staff'}</h2>
            <p className="text-sm sm:text-base text-blue-700 mt-1">Approve, decline and manage agent accounts</p>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto"></div>
              <p className="mt-3 text-sm sm:text-base text-gray-700">Loading...</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-gray-200">
                {currentList.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserGroupIcon className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No results found' : `No ${activeView === 'agents' ? 'agents' : 'doctor staff'} found`}
                      </p>
                      <p className="text-sm sm:text-base text-gray-700">
                        {searchTerm 
                          ? 'Try adjusting your search terms' 
                          : 'Create your first agent to get started'}
                      </p>
                    </div>
                  </div>
                ) : (
                  currentList.map((agent) => (
                    <div key={agent._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-800 text-white flex items-center justify-center text-base font-semibold">
                            {agent.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-base font-medium text-gray-900 truncate">
                              {agent.name}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mt-1 truncate">
                              <EnvelopeIcon className="w-3 h-3 mr-1.5 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{agent.email}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                            agent.declined
                              ? 'bg-red-100 text-red-800'
                              : agent.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {agent.declined
                            ? 'Declined'
                            : agent.isApproved
                            ? 'Approved'
                            : 'Pending'}
                        </span>
                      </div>
                      
                      {agent.phone && (
                        <div className="flex items-center text-sm text-gray-700 mb-3">
                          <PhoneIcon className="w-3 h-3 mr-1.5 text-gray-500 flex-shrink-0" />
                          {agent.phone}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 items-center">
                        {(() => {
                          const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                          const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                          const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                          
                          const shouldShowAction = (action: 'create' | 'update' | 'approve') => {
                            if (adminTokenExists) {
                              return true;
                            }
                            
                            if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists) {
                              if (permissionsLoading || !agentPermissions) {
                                return false;
                              }
                              
                              if (action === 'approve') {
                                return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                              }
                            }
                            
                            return false;
                          };
                          
                          return (
                            <>
                              {shouldShowAction('approve') && (
                                <>
                                  <button
                                    onClick={() => handleAction(agent._id, 'approve')}
                                    disabled={agent.isApproved}
                                    className={`text-xs sm:text-sm font-medium transition-all ${
                                      agent.isApproved
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-green-600 hover:text-green-700 hover:underline'
                                    }`}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleAction(agent._id, 'decline')}
                                    disabled={agent.declined}
                                    className={`text-xs sm:text-sm font-medium transition-all ${
                                      agent.declined
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-red-600 hover:text-red-700 hover:underline'
                                    }`}
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              <div className="relative inline-block">
                                <button
                                  type="button"
                                  onClick={() => setMenuAgentId(menuAgentId === agent._id ? null : agent._id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                  aria-label="More actions"
                                >
                                  <EllipsisVerticalIcon className="w-5 h-5 text-gray-700" />
                                </button>
                                {menuAgentId === agent._id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="py-1">
                                      <button
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                          setPasswordAgent(agent);
                                          setMenuAgentId(null);
                                        }}
                                      > 
                                        <KeyIcon className="w-4 h-4" />
                                        Change password
                                      </button>
                                      <button
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-200 flex items-center gap-2"
                                        onClick={() => {
                                          setPermissionAgent(agent);
                                          setMenuAgentId(null);
                                        }}
                                      >
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        Manage Permissions
                                      </button>
                                      {(() => {
                                        const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                                        const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                                        const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                                        
                                        const shouldShowDelete = () => {
                                          if (adminTokenExists) {
                                            return true;
                                          }
                                          
                                          if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists) {
                                            if (permissionsLoading || !agentPermissions) {
                                              return false;
                                            }
                                            return agentPermissions.canDelete === true || agentPermissions.canAll === true;
                                          }
                                          
                                          return false;
                                        };
                                        
                                        return shouldShowDelete() ? (
                                          <button
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors border-t border-gray-200 flex items-center gap-2"
                                            onClick={() => {
                                              setDeleteAgent(agent);
                                              setMenuAgentId(null);
                                            }}
                                          >
                                            <TrashIcon className="w-4 h-4" />
                                            Delete Agent
                                          </button>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {[
                        activeView === 'agents' ? 'Agent Name' : 'Staff Name',
                        'Email Address',
                        'Phone Number',
                        'Status',
                        'Actions',
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-3 lg:px-4 py-2 lg:py-3 text-left text-xs lg:text-sm font-semibold text-gray-700 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <UserGroupIcon className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-lg lg:text-xl font-medium text-gray-900 mb-2">
                              {searchTerm ? 'No results found' : `No ${activeView === 'agents' ? 'agents' : 'doctor staff'} found`}
                            </p>
                            <p className="text-sm lg:text-base text-gray-700">
                              {searchTerm 
                                ? 'Try adjusting your search terms' 
                                : 'Create your first agent to get started'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentList.map((agent) => (
                        <tr key={agent._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 lg:px-4 py-2 lg:py-3">
                            <div className="flex items-center min-w-0">
                              <div className="h-8 w-8 lg:h-9 lg:w-9 flex-shrink-0 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm lg:text-base font-semibold">
                                {agent.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-2 lg:ml-3 min-w-0">
                                <div className="text-sm lg:text-base font-medium text-gray-900 truncate">
                                  {agent.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-2 lg:py-3">
                            <div className="flex items-center text-sm lg:text-base text-gray-700 min-w-0">
                              <EnvelopeIcon className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5 lg:mr-2 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{agent.email}</span>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base text-gray-700">
                            {agent.phone ? (
                              <div className="flex items-center min-w-0">
                                <PhoneIcon className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5 lg:mr-2 text-gray-500 flex-shrink-0" />
                                <span className="truncate">{agent.phone}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-3 lg:px-4 py-2 lg:py-3">
                            <span
                              className={`inline-flex items-center px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm font-medium ${
                                agent.declined
                                  ? 'bg-red-100 text-red-800'
                                  : agent.isApproved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {agent.declined
                                ? 'Declined'
                                : agent.isApproved
                                ? 'Approved'
                                : 'Pending'}
                            </span>
                          </td>
                          <td className="px-3 lg:px-4 py-2 lg:py-3 text-sm lg:text-base font-medium">
                            <div className="flex flex-wrap gap-1.5 lg:gap-2 items-center">
                          {(() => {
                            const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                            const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                            const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                            
                            const shouldShowAction = (action: 'create' | 'update' | 'approve') => {
                              if (adminTokenExists) {
                                return true;
                              }
                              
                              if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists) {
                                if (permissionsLoading || !agentPermissions) {
                                  return false;
                                }
                                
                                if (action === 'approve') {
                                  return agentPermissions.canApprove === true || agentPermissions.canAll === true;
                                }
                              }
                              
                              return false;
                            };
                            
                            return (
                              <>
                                {shouldShowAction('approve') && (
                                  <>
                                    <button
                                      onClick={() => handleAction(agent._id, 'approve')}
                                      disabled={agent.isApproved}
                                      className={`text-xs lg:text-sm font-medium transition-all ${
                                        agent.isApproved
                                          ? 'text-gray-400 cursor-not-allowed'
                                          : 'text-green-600 hover:text-green-700 hover:underline'
                                      }`}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleAction(agent._id, 'decline')}
                                      disabled={agent.declined}
                                      className={`text-xs lg:text-sm font-medium transition-all ${
                                        agent.declined
                                          ? 'text-gray-400 cursor-not-allowed'
                                          : 'text-red-600 hover:text-red-700 hover:underline'
                                      }`}
                                    >
                                      Decline
                                    </button>
                                  </>
                                )}
                              </>
                            );
                          })()}
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setMenuAgentId(menuAgentId === agent._id ? null : agent._id)}
                                className="p-1.5 lg:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="More actions"
                              >
                                <EllipsisVerticalIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                              </button>
                              {menuAgentId === agent._id && (
                                <div className="absolute right-0 mt-1 w-48 lg:w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  <div className="py-1">
                                    <button
                                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                      onClick={() => {
                                        setPasswordAgent(agent);
                                        setMenuAgentId(null);
                                      }}
                                    >
                                      <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                      Change password
                                    </button>
                                    <button
                                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-200 flex items-center gap-2"
                                      onClick={() => {
                                        setPermissionAgent(agent);
                                        setMenuAgentId(null);
                                      }}
                                    >
                                      <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                      Manage Permissions
                                    </button>
                                    {(() => {
                                      const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
                                      const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
                                      const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
                                      
                                      const shouldShowDelete = () => {
                                        if (adminTokenExists) {
                                          return true;
                                        }
                                        
                                        if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists) {
                                          if (permissionsLoading || !agentPermissions) {
                                            return false;
                                          }
                                          return agentPermissions.canDelete === true || agentPermissions.canAll === true;
                                        }
                                        
                                        return false;
                                      };
                                      
                                        return shouldShowDelete() ? (
                                          <button
                                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-red-700 hover:bg-red-50 transition-colors border-t border-gray-200 flex items-center gap-2"
                                            onClick={() => {
                                              setDeleteAgent(agent);
                                              setMenuAgentId(null);
                                            }}
                                          >
                                            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            Delete Agent
                                          </button>
                                        ) : null;
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {filteredList.length > itemsPerPage && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col gap-3">
                <div className="text-xs sm:text-sm lg:text-base text-gray-700 text-center sm:text-left">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredList.length)}</span> of{' '}
                  <span className="font-medium">{filteredList.length}</span> results
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-center">
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all shadow-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Prev
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all shadow-sm ${
                            currentPage === pageNum
                              ? 'bg-gray-800 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all shadow-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Agent Modal - Using Portal to render outside layout stacking context */}
      {isCreateOpen && typeof window !== 'undefined' && createPortal(
        <div style={{ zIndex: 9999 }} className="fixed inset-0">
          <CreateAgentModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onCreated={loadAll}
            token={undefined}
            doctorToken={undefined}
            adminToken={adminToken || undefined}
            defaultRole={activeView === 'doctorStaff' ? 'doctorStaff' : 'agent'}
          />
        </div>,
        document.body
      )}

      {/* MODIFIED: Agent Permission Modal - Using Portal to render outside layout stacking context */}
      {permissionAgent && typeof window !== 'undefined' && createPortal(
        <div style={{ zIndex: 9999 }} className="fixed inset-0">
          <AgentPermissionModal
            isOpen={!!permissionAgent}
            onClose={() => setPermissionAgent(null)}
            agentId={permissionAgent._id}
            agentName={permissionAgent.name}
            token={adminToken || null}
            userRole="admin"
          />
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {deleteAgent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            setDeleteAgent(null);
          }}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-red-50 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-xl font-semibold text-red-900">Delete Agent</h3>
                <p className="text-base text-red-700 mt-1 break-words">
                  Are you sure you want to delete this agent? This action cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeleteAgent(null);
                }}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 transition-colors text-red-700 hover:text-red-900"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-base font-medium text-gray-900 mb-1">Agent Details:</p>
                <p className="text-base text-gray-700">{deleteAgent.name}</p>
                <p className="text-base text-gray-700">{deleteAgent.email}</p>
                <p className="text-sm text-gray-500 mt-1 capitalize">{deleteAgent.role}</p>
              </div>
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-base text-yellow-800">
                  This will permanently delete the agent account and all associated data.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteAgent(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(deleteAgent._id);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-base font-medium rounded-lg transition-all shadow-md"
                >
                  Delete Agent
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordAgent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => {
            setPasswordAgent(null);
            setNewPassword('');
            setConfirmPassword('');
          }}
        >
          <div 
            className="w-full max-w-md bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm sm:text-base text-gray-700 mt-1 break-words">
                  {passwordAgent.name} • {passwordAgent.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordAgent(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors text-gray-700 hover:text-gray-900"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleResetPasswordSubmit} className="p-3 sm:p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent placeholder-gray-500"
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent placeholder-gray-500"
                    placeholder="Re-enter password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordAgent(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm sm:text-base font-medium rounded-lg transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Apply Layout
ManageAgentsPage.getLayout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;

// Preserve layout on wrapped component
const ProtectedManageAgentsPage: NextPageWithLayout = withAdminAuth(ManageAgentsPage) as any;
ProtectedManageAgentsPage.getLayout = ManageAgentsPage.getLayout;

export default ProtectedManageAgentsPage;
