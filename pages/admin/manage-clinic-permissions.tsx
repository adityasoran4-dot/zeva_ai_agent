// pages/admin/manage-clinic-permissions.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import type { NextPageWithLayout } from '../_app';
import AdminLayout from '../../components/AdminLayout';
import ClinicPermissionManagerNew from '../../components/ClinicPermissionManagerNew';
import withAdminAuth from '../../components/withAdminAuth';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Clinic {
  _id: string;
  name: string;
  address: string;
  isApproved: boolean;
}

interface Doctor {
  _id: string;
  name: string;
  email?: string;
  userId?: string;
}

interface DoctorProfileApi {
  _id: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

interface SubModule {
  name: string;
  path?: string;
  icon: string;
  order: number;
  moduleKey?: string;
  actions: {
    all: boolean;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

interface ModulePermission {
  module: string;
  subModules: SubModule[];
  actions: {
    all: boolean;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

interface ClinicPermission {
  _id: string;
  clinicId:
    | {
        _id: string;
        name?: string;
      }
    | string
    | null;
  permissions: ModulePermission[];
  isActive: boolean;
  role: 'admin' | 'clinic' | 'doctor';
}

interface EntityOption {
  id: string;
  label: string;
}

interface NavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  badge?: number;
  parentId?: string;
  order: number;
  isActive: boolean;
  moduleKey: string;
  role: 'admin' | 'clinic' | 'doctor';
  subModules: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

const ACTION_KEYS: Array<keyof ModulePermission['actions']> = ['all', 'create', 'read', 'update', 'delete'];

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
    success: <CheckCircleIcon className="w-5 h-5" />,
    error: <XCircleIcon className="w-5 h-5" />,
    info: <InformationCircleIcon className="w-5 h-5" />,
    warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`${colors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      {icons[toast.type]}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Close"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => (
  <div className="fixed top-4 right-4 z-[100] space-y-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
    ))}
  </div>
);

const ManageClinicPermissionsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Check if user is an admin or agent - use state to ensure reactivity
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      console.log('Manage Clinic Permissions - Initial Token Check:', { 
        adminToken, 
        agentToken, 
        isAgentRoute,
        pathname: router.pathname,
        locationPath: window.location.pathname
      });
      
      // CRITICAL: If on agent route, prioritize agentToken over adminToken
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
  // Use the dedicated manage-clinic-permissions module for agent permission checks
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "manage-clinic-permissions" : (null as any), "Manage Clinic Permissions");
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [clinicPermissions, setClinicPermissions] = useState<ClinicPermission[]>([]);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveStatusTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);

  const createBlankActions = () => ({
    all: false,
    create: false,
    read: false,
    update: false,
    delete: false,
  });

  const sanitizeModulePermissions = useCallback(
    (items: ModulePermission[]): ModulePermission[] =>
      items.map((module) => ({
        module: module.module,
        actions: ACTION_KEYS.reduce((acc, key) => {
          acc[key] = Boolean(module.actions?.[key]);
          return acc;
        }, {} as ModulePermission['actions']),
        subModules: module.subModules?.map((subModule) => ({
          ...subModule,
          moduleKey: subModule.moduleKey,
          actions: ACTION_KEYS.reduce((acc, key) => {
            acc[key] = Boolean(subModule.actions?.[key]);
            return acc;
          }, {} as SubModule['actions']),
        })) || [],
      })),
    [],
  );

  const arePermissionsEqual = (left: ModulePermission[], right: ModulePermission[]) =>
    JSON.stringify(left) === JSON.stringify(right);

  const roleOptions = [
    { label: 'Clinic', value: 'clinic' },
    { label: 'Doctor', value: 'doctor' },
  ] as const;

  const [selectedRole, setSelectedRole] = useState<'clinic' | 'doctor'>(roleOptions[0].value);
  const [roleLoading, setRoleLoading] = useState(false);
  const entityOptions = useMemo<EntityOption[]>(() => {
    if (selectedRole === 'clinic') {
      return clinics.map(({ _id, name }) => ({
        id: _id,
        label: name || 'Unnamed clinic',
      }));
    } else {
      return doctors.map(({ _id, name, email }) => ({
        id: _id,
        label: name || email || 'Unnamed doctor',
      }));
    }
  }, [selectedRole, clinics, doctors]);
  const entityCardLabel = selectedRole === 'clinic' ? 'Clinics' : 'Doctors';
  const entitySelectLabel = selectedRole === 'clinic' ? 'Select clinic' : 'Select doctor';
  const entityPlaceholder = selectedRole === 'clinic' ? 'Choose a clinic...' : 'Choose a doctor...';
  const entityCount = entityOptions.length;

  const fetchClinics = useCallback(async (): Promise<Clinic[]> => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      const response = await fetch('/api/admin/approved-clinics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Handle 403 permission denied errors
        if (response.status === 403) {
          setClinics([]);
          return [];
        }
        throw new Error(`Failed to fetch clinics: ${response.statusText}`);
      }
      
      const data = await response.json();
      const clinicsData: Clinic[] = data?.clinics || [];
      setClinics(clinicsData);
      return clinicsData;
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setClinics([]);
      showToast('Failed to load clinics. Please try again.', 'error');
      return [];
    }
  }, [showToast]);

  const fetchDoctors = useCallback(async (): Promise<Doctor[]> => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;

      const response = await fetch('/api/admin/getAllDoctors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle 403 permission denied errors
        if (response.status === 403) {
          setDoctors([]);
          return [];
        }
        throw new Error(`Failed to fetch doctors: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data?.success) {
        setDoctors([]);
        return [];
      }

      const doctorProfiles: DoctorProfileApi[] = Array.isArray(data.doctorProfiles)
        ? data.doctorProfiles
        : [];
      const normalizedDoctors: Doctor[] = doctorProfiles.map((profile) => ({
        _id: profile._id,
        name: profile?.user?.name || profile?.user?.email || 'Unnamed doctor',
        email: profile?.user?.email,
        userId: profile?.user?._id,
      }));

      setDoctors(normalizedDoctors);
      return normalizedDoctors;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
      showToast('Failed to load doctors. Please try again.', 'error');
      return [];
    }
  }, [showToast]);

  const getPermissionEntityId = (permission: ClinicPermission): string => {
    if (!permission?.clinicId) {
      return '';
    }
    return typeof permission.clinicId === 'string'
      ? permission.clinicId
      : permission.clinicId._id;
  };

  const buildPermissionsForEntity = useCallback(
    (
      entityId: string,
      availablePermissions: ClinicPermission[],
      navItems: NavigationItem[],
    ): ModulePermission[] => {
      if (!entityId) {
        return [];
      }

      const existing = availablePermissions.find(
        (cp) => getPermissionEntityId(cp) === entityId
      );
      if (existing) {
        return sanitizeModulePermissions(existing.permissions);
      }

      return navItems.map((navItem) => ({
        module: navItem.moduleKey,
        subModules: navItem.subModules.map((subModule) => ({
          name: subModule.name,
          path: subModule.path,
          icon: subModule.icon,
          order: subModule.order,
          moduleKey: (subModule as any).moduleKey,
          actions: createBlankActions(),
        })),
        actions: createBlankActions(),
      }));
    },
    [sanitizeModulePermissions],
  );

  const fetchClinicPermissions = useCallback(async (
    role: 'clinic' | 'doctor',
    entityOptionsOverride?: EntityOption[],
  ) => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      console.log('Fetching clinic permissions for role:', role);
      
      const response = await fetch(`/api/admin/permissions/clinic?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Handle 403 permission denied errors
        if (response.status === 403) {
          setClinicPermissions([]);
          return;
        }
        throw new Error(`Failed to fetch clinic permissions: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const permissionsArray = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
        const normalizedPermissions = permissionsArray.map((permission: ClinicPermission) => ({
          ...permission,
          role: permission.role || 'clinic',
        }));
        console.log('Found permissions:', normalizedPermissions.length);
        const entityOptionsForRole = entityOptionsOverride || [];

        const enrichedPermissions = normalizedPermissions.map((permission: ClinicPermission) => {
          const rawId =
            typeof permission.clinicId === 'object' && permission.clinicId !== null
              ? permission.clinicId._id
              : permission.clinicId;
          const stringId = rawId?.toString?.() || '';
          const entityMatch = entityOptionsForRole.find((option) => option.id === stringId);
          return {
            ...permission,
            clinicId: {
              _id: stringId,
              name:
                entityMatch?.label ||
                (typeof permission.clinicId === 'object' ? permission.clinicId?.name : undefined) ||
                'Unknown',
            },
          };
        });

        setClinicPermissions(enrichedPermissions as ClinicPermission[]);
      } else {
        console.log('No permissions found or error:', data.message);
        setClinicPermissions([]);
      }
    } catch (error) {
      console.error('Error fetching clinic permissions:', error);
    }
  }, []);

  const fetchNavigationItems = useCallback(async (role: 'clinic' | 'doctor') => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      
      const response = await fetch(`/api/navigation/get-by-role?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Handle 403 permission denied errors
        if (response.status === 403) {
          setNavigationItems([]);
          return;
        }
        console.warn('Navigation request failed', { status: response.status, statusText: response.statusText });
        setNavigationItems([]);
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        const items = Array.isArray(data.data) ? data.data : [];
        setNavigationItems(items as NavigationItem[]);
      } else {
        setNavigationItems([]);
      }
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      setNavigationItems([]);
    }
  }, []);

  const fetchEntitiesForRole = useCallback(
    (role: 'clinic' | 'doctor') => (role === 'clinic' ? fetchClinics() : fetchDoctors()),
    [fetchClinics, fetchDoctors]
  );

  useEffect(() => {
    if (isAdmin) {
      let cancelled = false;

      const loadRoleData = async () => {
        setRoleLoading(true);
        setSelectedEntity('');
        setPermissions([]);

        try {
          const entityList = await fetchEntitiesForRole(selectedRole);
          const entityOptionsOverride: EntityOption[] = entityList.map((entity) => ({
            id: entity._id,
            label: entity.name || (selectedRole === 'clinic' ? 'Unnamed clinic' : 'Unnamed doctor'),
          }));

          await Promise.all([
            fetchClinicPermissions(selectedRole, entityOptionsOverride),
            fetchNavigationItems(selectedRole),
          ]);
        } finally {
          if (!cancelled) {
            setRoleLoading(false);
            setLoading(false);
          }
        }
      };

      loadRoleData();

      return () => {
        cancelled = true;
      };
    } else if (isAgent) {
      if (!permissionsLoading) {
        if (agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true)) {
          let cancelled = false;

          const loadRoleData = async () => {
            setRoleLoading(true);
            setSelectedEntity('');
            setPermissions([]);

            try {
              const entityList = await fetchEntitiesForRole(selectedRole);
              const entityOptionsOverride: EntityOption[] = entityList.map((entity) => ({
                id: entity._id,
                label: entity.name || (selectedRole === 'clinic' ? 'Unnamed clinic' : 'Unnamed doctor'),
              }));

              await Promise.all([
                fetchClinicPermissions(selectedRole, entityOptionsOverride),
                fetchNavigationItems(selectedRole),
              ]);
            } finally {
              if (!cancelled) {
                setRoleLoading(false);
                setLoading(false);
              }
            }
          };

          loadRoleData();

          return () => {
            cancelled = true;
          };
        } else {
          setLoading(false);
          setRoleLoading(false);
        }
      }
    } else {
      setLoading(false);
      setRoleLoading(false);
    }
  }, [selectedRole, fetchEntitiesForRole, fetchClinicPermissions, fetchNavigationItems, isAdmin, isAgent, permissionsLoading, agentPermissions]);

  const handleEntitySelect = (entityId: string) => {
    setSelectedEntity(entityId);
    if (!entityId) {
      setPermissions([]);
    } else {
      const entityName = entityOptions.find(e => e.id === entityId)?.label || 'entity';
      showToast(`Selected ${entityName}`, 'info');
    }
  };

  useEffect(() => {
    if (!selectedEntity) {
      setPermissions([]);
      return;
    }

    const next = buildPermissionsForEntity(
      selectedEntity,
      clinicPermissions,
      navigationItems,
    );

    setPermissions((prev) => (arePermissionsEqual(prev, next) ? prev : next));
  }, [selectedEntity, clinicPermissions, navigationItems, buildPermissionsForEntity]);

  const autoSavePermissions = useCallback(async (permissionsPayload: ModulePermission[]) => {
    if (!selectedEntity || !selectedRole) return;
    
    // Check permissions for agents
    const adminTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('adminToken') : false;
    const agentTokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('agentToken') : false;
    const isAgentRoute = router.pathname?.startsWith('/agent/') || (typeof window !== 'undefined' && window.location.pathname?.startsWith('/agent/'));
    
    if ((isAgentRoute || isAgent) && agentTokenExists && !adminTokenExists && agentPermissions) {
      if (agentPermissions.canUpdate !== true && agentPermissions.canAll !== true) {
        showToast('You do not have permission to update clinic permissions', 'error');
        return;
      }
    }
    
    console.log('Auto-saving permissions for entity:', selectedEntity, 'role:', selectedRole);
    console.log('Payload:', permissionsPayload);
    if (saveStatusTimeout.current) {
      clearTimeout(saveStatusTimeout.current);
      saveStatusTimeout.current = null;
    }
    setSaving(true);
    setSaveStatus('saving');
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const token = adminToken || agentToken;
      const response = await fetch('/api/admin/permissions/clinic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clinicId: selectedEntity,
          role: selectedRole,
          permissions: permissionsPayload
        })
      });

      console.log('Save response status:', response.status);
      const data = await response.json();
      console.log('Save response data:', data);
      
      if (data.success) {
        setSaveStatus('saved');
        showToast('Permissions saved successfully', 'success');
        saveStatusTimeout.current = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
        await fetchClinicPermissions(selectedRole, entityOptions);
      } else {
        setSaveStatus('error');
        showToast(data.message || 'Failed to save permissions', 'error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setSaveStatus('error');
      showToast('Failed to save permissions. Please try again.', 'error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [selectedEntity, selectedRole, fetchClinicPermissions, entityOptions, router, isAgent, agentPermissions, showToast]);

  useEffect(() => {
    return () => {
      if (saveStatusTimeout.current) {
        clearTimeout(saveStatusTimeout.current);
      }
    };
  }, []);

  const handlePermissionsChange = useCallback((
    newPermissions: ModulePermission[],
    meta?: { trigger?: 'user' | 'sync' }
  ) => {
    if (
      isAgent &&
      !(agentPermissions?.canUpdate === true || agentPermissions?.canAll === true)
    ) {
      showToast('You do not have permission to change clinic permissions', 'error');
      return;
    }

    setPermissions(newPermissions);
    if (meta?.trigger === 'user') {
      autoSavePermissions(newPermissions);
    }
  }, [autoSavePermissions, isAgent, agentPermissions, showToast]);

  const getEntityLabel = (entityId: string) => {
    if (!entityId) {
      return selectedRole === 'clinic' ? 'Unknown Clinic' : 'Unknown Doctor';
    }

    const option = entityOptions.find((entity) => entity.id === entityId);
    if (option) {
      return option.label;
    }

    const permissionMatch = clinicPermissions.find(
      (permission) => getPermissionEntityId(permission) === entityId
    );

    if (
      permissionMatch &&
      typeof permissionMatch.clinicId === 'object' &&
      permissionMatch.clinicId?.name
    ) {
      return permissionMatch.clinicId.name;
    }

    return selectedRole === 'clinic' ? 'Unknown Clinic' : 'Unknown Doctor';
  };

  // Check if agent has read permission
  const hasReadPermission = isAdmin || (isAgent && agentPermissions && (agentPermissions.canRead === true || agentPermissions.canAll === true));

  // Show loading spinner while checking permissions
  if (loading || (isAgent && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-700">
            You do not have permission to view clinic permissions. Please contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-blue-800 p-3 rounded-lg">
                  <Cog6ToothIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2">
                    Clinic Permission Management
                  </h1>
                  <p className="text-blue-600 text-base ">
                  This page enables you to manage module-wise and action-based permissions for registered clinics and doctors on the platform. For example, when the “Read” permission is disabled, the clinic or doctor will not be able to access the data.
                  </p>
                </div>
              </div>
            </div>
            {/* Stats and Filters */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Entity Count Card */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
                  {entityCardLabel}
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {roleLoading ? '...' : entityCount}
                </p>
              </div>

              {/* Navigation Items Count */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
                  Permission Sets
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {roleLoading ? '...' : navigationItems.length}
                </p>
              </div>

              {/* Role Selector */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <label className="block text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">
                  Role Filter
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as typeof roleOptions[number]['value']);
                    showToast(`Switched to ${e.target.value} view`, 'info');
                  }}
                  disabled={roleLoading}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-blue-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {roleOptions.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entity Selector */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <label className="block text-xs font-medium text-blue-700 uppercase tracking-wider mb-2">
                  {entitySelectLabel}
                </label>
                <select
                  value={selectedEntity}
                  onChange={(e) => handleEntitySelect(e.target.value)}
                  disabled={roleLoading || entityOptions.length === 0}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-blue-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{entityPlaceholder}</option>
                  {entityOptions.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Permission Matrix Section */}
          {selectedEntity && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Active Permission Matrix
                  </p>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {getEntityLabel(selectedEntity)}
                  </h2>
                  <p className="text-sm text-gray-700 mt-1">
                    Configure module and sub-module permissions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {roleLoading && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                      Loading...
                    </span>
                  )}
                  {saveStatus === 'saving' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium">
                      <CheckCircleIcon className="w-4 h-4" />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium">
                      <XCircleIcon className="w-4 h-4" />
                      Save Failed
                    </span>
                  )}
                </div>
              </div>

              <ClinicPermissionManagerNew
                permissions={permissions}
                navigationItems={navigationItems}
                onPermissionsChange={handlePermissionsChange}
                isLoading={roleLoading}
                disabled={
                  roleLoading ||
                  saving ||
                  (isAgent &&
                    !(agentPermissions?.canUpdate === true || agentPermissions?.canAll === true))
                }
                title="Permission Matrix"
              />
            </div>
          )}

          {/* Empty State */}
          {!selectedEntity && !roleLoading && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Cog6ToothIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {selectedRole} selected
              </h3>
              <p className="text-gray-700">
                Please select a {selectedRole === 'clinic' ? 'clinic' : 'doctor'} from the dropdown above to manage permissions.
              </p>
            </div>
          )}
        </div>
      </div>
  );
};

ManageClinicPermissionsPage.getLayout = function PageLayout(page: ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedManageClinicPermissions: NextPageWithLayout =
  withAdminAuth(ManageClinicPermissionsPage);
ProtectedManageClinicPermissions.getLayout = ManageClinicPermissionsPage.getLayout;

export default ProtectedManageClinicPermissions;

