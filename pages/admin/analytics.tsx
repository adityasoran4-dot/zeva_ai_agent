import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import {
  UserGroupIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { NextPageWithLayout } from '../_app';

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  createdAt?: string;
};

type SortableField = 'name' | 'email' | 'phone';

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
  <div className="fixed top-4 right-4 z-[99999] space-y-2" style={{ zIndex: 99999 }}>
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

function UserProfile() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(9);
  const [sortField, setSortField] = useState<SortableField>('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check if user is an admin or agent
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
  
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_user_analytics" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
        const token = adminToken || agentToken;

        const res = await fetch(`/api/admin/analytics?page=${currentPage}&limit=${usersPerPage}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 403) {
            setUsers([]);
            setFilteredUsers([]);
            showToast('You do not have permission to view analytics', 'error');
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch users');
        }

        const data = await res.json();
        const usersData = data.users || [];
        setUsers(usersData);
        
        // Apply current sort to the fetched data
        const sortedData = [...usersData].sort((a, b) => {
          if (sortField === 'name') {
            return sortDirection === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          } else if (sortField === 'email') {
            return sortDirection === 'asc'
              ? a.email.localeCompare(b.email)
              : b.email.localeCompare(a.email);
          } else if (sortField === 'phone') {
            return sortDirection === 'asc'
              ? a.phone.localeCompare(b.phone)
              : b.phone.localeCompare(a.phone);
          }
          return 0;
        });
        setFilteredUsers(sortedData);
        
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalUsers(data.pagination.totalUsers);
        }
      } catch (error: any) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load user analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          fetchUsers();
        } else {
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions, currentPage, usersPerPage, sortField, sortDirection, showToast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole]);

  // Sort users
  const sortUsers = (field: SortableField) => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    const sorted = [...filteredUsers].sort((a, b) => {
      if (direction === 'asc') {
        return a[field].localeCompare(b[field]);
      } else {
        return b[field].localeCompare(a[field]);
      }
    });
    setFilteredUsers(sorted);
    showToast(`Sorted by ${field} (${direction})`, 'info');
  };

  // Filter by role - fix "all" filter to show all users from current page
  const roleFilteredUsers = useMemo(() => {
    if (selectedRole === 'all') {
      return filteredUsers; // Show all users from current page when "all" is selected
    }
    return filteredUsers.filter((user: User) => user.role === selectedRole);
  }, [filteredUsers, selectedRole]);

  // Pagination - use backend pagination, no client-side slicing needed
  const currentUsers: User[] = roleFilteredUsers;

  // Download CSV
  const downloadCSV = () => {
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions && agentPermissions.canExport !== true && agentPermissions.canAll !== true) {
      showToast("You do not have permission to export user data", 'error');
      return;
    }

    const exportData =
      selectedRole === 'all'
        ? filteredUsers
        : filteredUsers.filter((user) => user.role === selectedRole);

    if (exportData.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    try {
      const headers = ['Name', 'Email', 'Phone', 'Role', 'Gender', 'Age', 'Date of Birth'];
      const csvContent = [
        headers.join(','),
        ...exportData.map(user => [
          `"${user.name}"`,
          `"${user.email}"`,
          `"${user.phone}"`,
          `"${user.role}"`,
          `"${user.gender || 'N/A'}"`,
          `"${user.age || 'N/A'}"`,
          `"${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV file downloaded successfully', 'success');
    } catch (error) {
      showToast('Failed to download CSV file', 'error');
    }
  };

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));
  const canExport =
    isAdmin ||
    (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canExport || agentPermissions.canAll));

  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (isAgent && !hasReadPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-700">
            You do not have permission to view user analytics.
          </p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-sm text-gray-700">No user data available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get role counts for stats
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueRoles = Object.keys(roleCounts);
  const topRoleEntry = uniqueRoles
    .map((role) => ({ role, count: roleCounts[role] }))
    .sort((a, b) => b.count - a.count)[0];
  const averagePerRole =
    uniqueRoles.length > 0 ? Math.round(users.length / uniqueRoles.length) : 0;
  const summaryStats = [
    {
      label: 'Total Users',
      value: users.length,
      meta: `${roleFilteredUsers.length} in view`,
    },
    {
      label: 'Top Role',
      value: topRoleEntry ? topRoleEntry.role : '—',
      meta: topRoleEntry ? `${topRoleEntry.count} members` : 'No data',
    },
    {
      label: 'Unique Roles',
      value: uniqueRoles.length,
      meta: 'Segments tracked',
    },
    {
      label: 'Avg / Role',
      value: averagePerRole,
      meta: 'Members per category',
    },
  ];

  // Quick stats for current view
  const usersInView = roleFilteredUsers.length;
  const usersWithAgeInView = roleFilteredUsers.filter(
    (user: User) => typeof user.age === 'number' && !Number.isNaN(user.age)
  );
  const averageAgeInView = usersWithAgeInView.length
    ? (usersWithAgeInView.reduce((sum: number, user: User) => sum + (user.age || 0), 0) / usersWithAgeInView.length).toFixed(1)
    : null;
  const ageCoveragePercent = usersInView
    ? Math.round((usersWithAgeInView.length / usersInView) * 100)
    : 0;
  const latestUser =
    roleFilteredUsers.length > 0
      ? [...roleFilteredUsers].sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        })[0]
      : null;

return (
  <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 lg:px-6">
    <ToastContainer toasts={toasts} removeToast={removeToast} />

    <div className="mx-auto max-w-7xl space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 via-slate-600 to-blue-600 p-4 sm:p-5 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-300">
              Admin · User analytics
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
              Intelligence dashboard
            </h1>
            <p className="max-w-2xl text-xs text-slate-200">
              Track growth across roles, gender, and age demographics.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-white/30 bg-white/10 px-2 py-1.5 text-center">
              <p className="text-[8px] uppercase tracking-wide text-slate-200">
                Active profiles
              </p>
              <p className="text-sm font-normal">{roleFilteredUsers.length}</p>
            </div>
            {canExport && (
              <button
                onClick={downloadCSV}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                Export
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-2.5 text-blue-800 grid-cols-2 md:grid-cols-4">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200  bg-white p-3 shadow-sm"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-blue-500">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold text-blue-800">
              {stat.value}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{stat.meta}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-500">
              Filter:
            </span>
            {['all', ...uniqueRoles].map((role) => {
              const chipCount = role === 'all'
                ? totalUsers
                : roleCounts[role] || 0;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
                    selectedRole === role
                      ? 'border-slate-900 bg-blue-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-blue-600 hover:border-blue-300'
                  }`}
                >
                  {role === 'all' ? 'All' : role}{' '}
                  <span className="text-[9px] opacity-80">({chipCount})</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <FunnelIcon className="h-3.5 w-3.5 text-blue-400" />
              Sort by:
            </div>
            <select
              value={sortField}
              onChange={(e) => sortUsers(e.target.value as SortableField)}
              className="w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900/10 lg:w-40"
            >
              <option value="name">Name (A-Z)</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          {usersInView > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wide text-blue-500">In view</p>
                <p className="text-base font-semibold text-blue-900">{usersInView}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wide text-blue-500">Avg age</p>
                <p className="text-base font-semibold text-blue-900">
                  {averageAgeInView ? `${averageAgeInView}` : 'N/A'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wide text-blue-500">Age coverage</p>
                <p className="text-base font-semibold text-blue-900">{ageCoveragePercent}%</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                <p className="text-[9px] uppercase tracking-wide text-blue-500">Latest user</p>
                <p className="text-[11px] font-semibold text-blue-900 truncate">
                  {latestUser?.name || '—'}
                </p>
                {latestUser?.createdAt && (
                  <p className="text-[9px] text-slate-500">
                    {new Date(latestUser.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {roleFilteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No users match the current filters.
          </div>
        ) : (
          <div className="pagination-wrapper">
            <div className="grid grid-cols-3 gap-4 p-4 mb-6">
              {currentUsers.map((user) => (
              <div
                key={user._id}
                className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 shadow-sm transition hover:border-slate-200 hover:bg-white"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-900/90 p-1.5 text-white">
                      <UserIcon className="h-4 w-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-blue-900">{user.name}</p>
                      <p className="text-[10px] text-slate-500">ID: {user._id.slice(-6)}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {user.role}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center">
                    <EnvelopeIcon className="mr-1.5 h-3 w-3 text-slate-400" />
                    <span className="truncate text-[11px]">{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon className="mr-1.5 h-3 w-3 text-slate-400" />
                    <span className="text-[11px]">{user.phone}</span>
                  </div>
                  {user.gender && (
                    <div className="flex items-center">
                      <UserIcon className="mr-1.5 h-3 w-3 text-slate-400" />
                      <span className="capitalize text-[11px]">{user.gender}</span>
                    </div>
                  )}
                  {user.age && (
                    <div className="flex items-center">
                      <span className="mr-1.5 text-[10px] text-slate-400">Age:</span>
                      <span className="text-[11px]">{user.age} years</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Empty placeholder cards to maintain grid layout when cards are less than 9 */}
            {currentUsers.length < usersPerPage && 
              Array.from({ length: usersPerPage - currentUsers.length }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-transparent border-0" aria-hidden="true"></div>
              ))
            }
            </div>
          </div>
        )}
      </section>

      {totalUsers > usersPerPage && (
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm mt-4">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.max(prev - 1, 1));
              }}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
              }}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}
    </div>
  </div>
);
}

UserProfile.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(UserProfile);
ProtectedDashboard.getLayout = UserProfile.getLayout;

export default ProtectedDashboard;

