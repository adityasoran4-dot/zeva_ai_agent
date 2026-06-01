'use client';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

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
    print?: boolean;
    export?: boolean;
    approve?: boolean;
  };
}

interface NavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  order: number;
  moduleKey: string;
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
    moduleKey?: string;
  }>;
}

interface AgentPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  token: string | null;
  userRole: 'admin' | 'clinic' | 'doctor';
}

type ActionKey = 'all' | 'create' | 'read' | 'update' | 'delete';

const ACTION_SEQUENCE: Array<{ key: ActionKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

const ACTION_STYLES: Record<
  ActionKey,
  { active: string; inactive: string; accent: string }
> = {
  all: {
    active: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-indigo-200',
    inactive: 'bg-slate-200 text-slate-600',
    accent: 'bg-indigo-200',
  },
  create: {
    active: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-200',
    inactive: 'bg-slate-200 text-slate-600',
    accent: 'bg-emerald-200',
  },
  read: {
    active: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-sky-200',
    inactive: 'bg-slate-200 text-slate-600',
    accent: 'bg-sky-200',
  },
  update: {
    active: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200',
    inactive: 'bg-slate-200 text-slate-600',
    accent: 'bg-amber-200',
  },
  delete: {
    active: 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-rose-200',
    inactive: 'bg-slate-200 text-slate-600',
    accent: 'bg-rose-200',
  },
};

const AgentPermissionModal: React.FC<AgentPermissionModalProps> = ({
  isOpen,
  onClose,
  agentId,
  agentName,
  token,
  userRole
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [clinicPermissions, setClinicPermissions] = useState<ModulePermission[] | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      if (userRole === 'clinic') {
        fetchClinicPermissions().then(() => {
          fetchAgentPermissions();
        });
      } else {
        fetchNavigationItems();
        fetchAgentPermissions();
      }
    }
  }, [isOpen, token, userRole, agentId]);

  // Fetch navigation items when clinic permissions are loaded or when not clinic role
  useEffect(() => {
    if (userRole === 'clinic') {
      // For clinic, wait for permissions to be loaded
      if (clinicPermissions !== null) {
        fetchNavigationItems();
      }
    } else {
      // For admin/doctor, fetch immediately if modal is open
      if (isOpen && token) {
        fetchNavigationItems();
      }
    }
  }, [clinicPermissions, userRole, isOpen, token]);

  const fetchClinicPermissions = async () => {
    try {
      const { data } = await axios.get('/api/clinic/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.data && data.data.permissions) {
        setClinicPermissions(data.data.permissions);
      } else {
        setClinicPermissions(null);
      }
    } catch (err) {
      console.error('Error fetching clinic permissions:', err);
      setClinicPermissions(null);
    }
  };

  const fetchNavigationItems = async () => {
    try {
      const { data } = await axios.get(`/api/navigation/get-by-role?role=${userRole}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        let items = data.data || [];

        // If userRole is 'clinic' and we have clinic permissions, filter navigation items
        if (userRole === 'clinic' && clinicPermissions && clinicPermissions.length > 0) {
          // Build permission map for quick lookup
          const permissionMap: Record<string, { moduleActions: any; subModules: Record<string, any> }> = {};
          clinicPermissions.forEach(perm => {
            const moduleKey = perm.module;
            const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor)_/, '');
            const moduleKeyWithPrefix = `clinic_${moduleKeyWithoutPrefix}`;

            const permissionData: { moduleActions: any; subModules: Record<string, any> } = {
              moduleActions: perm.actions,
              subModules: {}
            };

            permissionMap[moduleKey] = permissionData;
            permissionMap[moduleKeyWithoutPrefix] = permissionData;
            permissionMap[moduleKeyWithPrefix] = permissionData;

            if (perm.subModules && perm.subModules.length > 0) {
              perm.subModules.forEach(subModule => {
                if (subModule && subModule.name) {
                  permissionData.subModules[subModule.name] = subModule.actions;
                }
              });
            }
          });

          // Filter navigation items based on clinic permissions
          // Show ALL modules that exist in clinic permissions, regardless of action values
          items = items
            .map((item: NavigationItem) => {
              // Try multiple lookup strategies for moduleKey matching
              const modulePerm = permissionMap[item.moduleKey] ||
                permissionMap[item.moduleKey.replace('clinic_', '')] ||
                permissionMap[item.moduleKey.replace(/^(admin|clinic|doctor)_/, '')];

              // Show module if it exists in clinic permissions (regardless of action values)
              // Only hide if the module doesn't exist in clinic permissions at all
              if (!modulePerm) {
                return null; // Don't show this module if it's not in clinic permissions
              }

              // Filter submodules based on permissions
              // Show ALL submodules that exist in clinic permissions, regardless of action values
              let filteredSubModules = [];
              if (item.subModules && item.subModules.length > 0) {
                filteredSubModules = item.subModules
                  .map((subModule: any) => {
                    if (!subModule || !subModule.name) {
                      return null;
                    }
                    const subModulePerm = modulePerm?.subModules[subModule.name];

                    // Show submodule if it exists in clinic permissions (regardless of action values)
                    // Only hide if the submodule doesn't exist in clinic permissions at all
                    if (subModulePerm) {
                      return subModule;
                    }
                    return null;
                  })
                  .filter((subModule: any) => subModule !== null);
              }

              return {
                ...item,
                subModules: filteredSubModules
              };
            })
            .filter((item: NavigationItem) => item !== null);
        }

        setNavigationItems(items);
        // ISSUE FIXED: Removed auto-expansion of modules with submodules
        // Previously, all modules with submodules were automatically expanded on load
        // Now modules will only expand when user clicks on them
        // The removed code was:
        // const modulesWithSubModules = items.filter((item: NavigationItem) =>
        //   item.subModules && item.subModules.length > 0
        // );
        // setExpandedModules(new Set(modulesWithSubModules.map((item: NavigationItem) => item.moduleKey)));
      }
    } catch (err) {
      console.error('Error fetching navigation items:', err);
    }
  };

  const sanitizePermissions = (perms: ModulePermission[]): ModulePermission[] => {
    return perms.map(perm => {
      // Remove print, export, approve if they exist and recalculate "all"
      const sanitizedActions = {
        all: false,
        create: Boolean(perm.actions?.create),
        read: Boolean(perm.actions?.read),
        update: Boolean(perm.actions?.update),
        delete: Boolean(perm.actions?.delete),
      };

      // Recalculate "all" based on the 4 core actions
      const allActions: ActionKey[] = ['create', 'read', 'update', 'delete'];
      sanitizedActions.all = allActions.every(actionKey => sanitizedActions[actionKey]);

      // Sanitize submodules
      const sanitizedSubModules = (perm.subModules || []).map(subMod => {
        const sanitizedSubActions = {
          all: false,
          create: Boolean(subMod.actions?.create),
          read: Boolean(subMod.actions?.read),
          update: Boolean(subMod.actions?.update),
          delete: Boolean(subMod.actions?.delete),
        };
        sanitizedSubActions.all = allActions.every(actionKey => sanitizedSubActions[actionKey]);

        return {
          ...subMod,
          moduleKey: subMod.moduleKey,
          actions: sanitizedSubActions
        };
      });

      return {
        ...perm,
        actions: sanitizedActions,
        subModules: sanitizedSubModules
      };
    });
  };

  const fetchAgentPermissions = async () => {
    try {
      const { data } = await axios.get(`/api/agent/permissions?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success && data.data) {
        const rawPermissions = data.data.permissions || [];
        const sanitized = sanitizePermissions(rawPermissions);
        setPermissions(sanitized);
      } else {
        // Initialize with empty permissions - will be synced with navigation items
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching agent permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync permissions with navigation items when both are loaded
  useEffect(() => {
    if (navigationItems.length > 0 && !loading && permissions.length === 0) {
      // Only initialize if no permissions exist yet
      const newPermissions = navigationItems.map(navItem => ({
        module: navItem.moduleKey,
        subModules: navItem.subModules?.map(subModule => ({
          name: subModule.name,
          path: subModule.path || '',
          icon: subModule.icon,
          order: subModule.order,
          moduleKey: subModule.moduleKey,
          actions: {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false,
          }
        })) || [],
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false
        }
      }));

      setPermissions(newPermissions);
    } else if (navigationItems.length > 0 && !loading && permissions.length > 0) {
      // Sync missing modules from navigation items
      const currentModules = permissions.map(p => p.module);
      const missingModules = navigationItems.filter(navItem => !currentModules.includes(navItem.moduleKey));

      if (missingModules.length > 0) {
        const newPermissions = missingModules.map(navItem => ({
          module: navItem.moduleKey,
          subModules: navItem.subModules?.map(subModule => ({
            name: subModule.name,
            path: subModule.path || '',
            icon: subModule.icon,
            order: subModule.order,
            moduleKey: subModule.moduleKey,
            actions: {
              all: false,
              create: false,
              read: false,
              update: false,
              delete: false
            }
          })) || [],
          actions: {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false,
          }
        }));

        setPermissions(prev => [...prev, ...newPermissions]);
      }
    }
  }, [navigationItems, loading]);

  const getModulePermission = (moduleKey: string): ModulePermission => {
    return permissions.find(p => p.module === moduleKey) || {
      module: moduleKey,
      subModules: [],
      actions: {
        all: false,
        create: false,
        read: false,
        update: false,
        delete: false
      }
    };
  };

  // Helper function to check if clinic has permission for a specific action
  const clinicHasAction = (moduleKey: string, action: ActionKey, subModuleName?: string): boolean => {
    if (userRole !== 'clinic' || !clinicPermissions || clinicPermissions.length === 0) {
      return true; // Admin/doctor can grant all permissions
    }

    // Build permission map
    const permissionMap: Record<string, { moduleActions: any; subModules: Record<string, any> }> = {};
    clinicPermissions.forEach(perm => {
      const modKey = perm.module;
      const modKeyWithoutPrefix = modKey.replace(/^(admin|clinic|doctor)_/, '');
      const modKeyWithPrefix = `clinic_${modKeyWithoutPrefix}`;

      const permissionData: { moduleActions: any; subModules: Record<string, any> } = {
        moduleActions: perm.actions,
        subModules: {}
      };

      permissionMap[modKey] = permissionData;
      permissionMap[modKeyWithoutPrefix] = permissionData;
      permissionMap[modKeyWithPrefix] = permissionData;

      if (perm.subModules && perm.subModules.length > 0) {
        perm.subModules.forEach(subModule => {
          if (subModule && subModule.name) {
            permissionData.subModules[subModule.name] = subModule.actions;
          }
        });
      }
    });

    // Find module permission
    const modulePerm = permissionMap[moduleKey] ||
      permissionMap[moduleKey.replace('clinic_', '')] ||
      permissionMap[moduleKey.replace(/^(admin|clinic|doctor)_/, '')];

    if (!modulePerm) {
      return false; // Module not found in clinic permissions
    }

    // If checking submodule action
    if (subModuleName) {
      const subModulePerm = modulePerm.subModules[subModuleName];
      if (!subModulePerm) {
        return false; // Submodule not found
      }
      // Check if clinic has this action for the submodule
      return subModulePerm.all === true || subModulePerm[action] === true;
    }

    // Check module-level action
    return modulePerm.moduleActions.all === true || modulePerm.moduleActions[action] === true;
  };

  const autoSavePermissions = async (permissionsToSave: ModulePermission[]) => {
    if (!token) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: wait 500ms before saving
    saveTimeoutRef.current = setTimeout(async () => {
      if (saving) return; // Skip if already saving

      setSaving(true);
      setSaveStatus('saving');
      try {
        // Sanitize and ensure module-level actions are included
        const sanitizedPermissions = sanitizePermissions(permissionsToSave);
        
        // Ensure every module has actions object with all required fields
        const finalPermissions = sanitizedPermissions.map(perm => {
          // Ensure actions object exists and has all required fields
          const actions = perm.actions || {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false
          };
          
          // Ensure all action fields are present (even if false)
          const completeActions = {
            all: Boolean(actions.all),
            create: Boolean(actions.create),
            read: Boolean(actions.read),
            update: Boolean(actions.update),
            delete: Boolean(actions.delete),
            print: Boolean((actions as any).print || false),
            export: Boolean((actions as any).export || false),
            approve: Boolean((actions as any).approve || false)
          };
          
          return {
            module: perm.module,
            actions: completeActions,
            subModules: perm.subModules || []
          };
        });

        console.log('[AgentPermissionModal] Saving permissions:', JSON.stringify(finalPermissions, null, 2));

        const { data } = await axios.post(
          '/api/agent/permissions',
          { agentId, permissions: finalPermissions },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          setSaveStatus('saved');
          setTimeout(() => {
            setSaveStatus('idle');
          }, 1500);
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      } catch (err: any) {
        console.error('Error auto-saving permissions:', err);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const handleModuleActionChange = (moduleKey: string, action: string, value: boolean) => {
    // Check if clinic has permission for this action
    if (value && !clinicHasAction(moduleKey, action as ActionKey)) {
      alert(`You do not have permission to grant "${action}" action for this module. You can only grant permissions that you have been granted.`);
      return;
    }

    const newPermissions = [...permissions];
    let modulePermission = newPermissions.find(p => p.module === moduleKey);

    if (!modulePermission) {
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      modulePermission = {
        module: moduleKey,
        subModules: navItem?.subModules?.map(subModule => ({
          name: subModule.name,
          path: subModule.path || '',
          icon: subModule.icon,
          order: subModule.order,
          moduleKey: subModule.moduleKey,
          actions: {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false,
          }
        })) || [],
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false
        }
      };
      newPermissions.push(modulePermission);
    }

    if (action === 'all') {
      // When "all" is toggled, set all actions including "all" itself to the same value
      modulePermission.actions.all = value;
      const allActions: ActionKey[] = ['create', 'read', 'update', 'delete'];
      allActions.forEach(actionKey => {
        modulePermission.actions[actionKey] = value;
      });

      // ✅ CRITICAL FIX: When module-level "all" is clicked, also set all submodule actions to true
      // First, ensure all submodules from navigationItems are initialized
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      if (navItem && navItem.subModules && navItem.subModules.length > 0) {
        // Initialize submodules if they don't exist
        if (!modulePermission.subModules) {
          modulePermission.subModules = [];
        }

        // Add missing submodules from navigationItems
        navItem.subModules.forEach(navSubModule => {
          const existingSubModule = modulePermission.subModules.find(sm => sm.name === navSubModule.name);
          if (!existingSubModule) {
            const newSubModule: SubModule = {
              name: navSubModule.name,
              path: navSubModule.path || '',
              icon: navSubModule.icon || '📄',
              order: navSubModule.order || 0,
              moduleKey: navSubModule.moduleKey,
              actions: {
                all: false,
                create: false,
                read: false,
                update: false,
                delete: false
              }
            };
            modulePermission.subModules.push(newSubModule);
          }
        });

        // Now set all actions for all submodules
        modulePermission.subModules.forEach(subModule => {
          // Set all actions for each submodule
          const subModuleActions = Object.keys(subModule.actions).filter(key => key !== 'all');
          subModuleActions.forEach(actionKey => {
            (subModule.actions as any)[actionKey] = value;
          });
          // Also set the "all" flag for the submodule
          subModule.actions.all = value;
        });
        modulePermission.actions.all = value;
      }
    } else {
      // When individual action is toggled, update that action
      modulePermission.actions[action as ActionKey] = value;

      // Check if all actions are enabled to update "all" state
      const allActions: ActionKey[] = ['create', 'read', 'update', 'delete'];
      const allEnabled = allActions.every(actionKey => modulePermission.actions[actionKey]);
      modulePermission.actions.all = allEnabled;
    }

    setPermissions(newPermissions);
    // Auto-save with debouncing
    autoSavePermissions(newPermissions);
  };

  const handleSubModuleActionChange = (moduleKey: string, subModuleName: string, action: string, value: boolean) => {
    // Check if clinic has permission for this action
    if (value && !clinicHasAction(moduleKey, action as ActionKey, subModuleName)) {
      alert(`You do not have permission to grant "${action}" action for this submodule. You can only grant permissions that you have been granted.`);
      return;
    }

    const newPermissions = [...permissions];
    let modulePermission = newPermissions.find(p => p.module === moduleKey);

    if (!modulePermission) {
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      modulePermission = {
        module: moduleKey,
        subModules: navItem?.subModules?.map(subModule => ({
          name: subModule.name,
          path: subModule.path || '',
          icon: subModule.icon,
          order: subModule.order,
          moduleKey: subModule.moduleKey,
          actions: {
            all: false,
            create: false,
            read: false,
            update: false,
            delete: false,
          }
        })) || [],
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false
        }
      };
      newPermissions.push(modulePermission);
    }

    // Find or create the submodule
    let subModule: SubModule | undefined = modulePermission.subModules.find(sm => sm.name === subModuleName);
    if (!subModule) {
      const navItem = navigationItems.find(item => item.moduleKey === moduleKey);
      const navSubModule = navItem?.subModules?.find(sm => sm.name === subModuleName);
      const newSubModule: SubModule = {
        name: subModuleName,
        path: navSubModule?.path || '',
        icon: navSubModule?.icon || '📄',
        order: navSubModule?.order || 0,
        moduleKey: navSubModule?.moduleKey,
        actions: {
          all: false,
          create: false,
          read: false,
          update: false,
          delete: false
        }
      };
      modulePermission.subModules.push(newSubModule);
      subModule = newSubModule;
    }

    // subModule is guaranteed to be defined at this point
    if (!subModule) {
      console.error('Failed to find or create submodule');
      return;
    }

    if (action === 'all') {
      // When "all" is toggled for submodule, set all actions including "all" itself to the same value
      subModule.actions.all = value;
      const allActions: ActionKey[] = ['create', 'read', 'update', 'delete'];
      allActions.forEach(actionKey => {
        subModule.actions[actionKey] = value;
      });
    } else {
      // When individual action is toggled, update that action
      subModule.actions[action as ActionKey] = value;

      // Check if all actions are enabled to update "all" state
      const allActions: ActionKey[] = ['create', 'read', 'update', 'delete'];
      const allEnabled = allActions.every(actionKey => subModule.actions[actionKey]);
      subModule.actions.all = allEnabled;
    }

    setPermissions(newPermissions);
    // Auto-save with debouncing
    autoSavePermissions(newPermissions);
  };

  const toggleModuleExpansion = (moduleKey: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleKey)) {
      newExpanded.delete(moduleKey);
    } else {
      newExpanded.add(moduleKey);
    }
    setExpandedModules(newExpanded);
  };


  const renderActionToggle = (
    contextKey: string,
    actionKey: ActionKey,
    label: string,
    current: boolean,
    onSelect: (value: boolean) => void,
    disabled: boolean = false,
    moduleKey?: string,
    subModuleName?: string
  ) => {
    // Check if clinic has permission for this action (only for clinic role)
    const hasClinicPermission = !moduleKey || clinicHasAction(moduleKey, actionKey, subModuleName);
    const isDisabled = disabled || (userRole === 'clinic' && !hasClinicPermission);

    const style = ACTION_STYLES[actionKey];
    const trackClasses = current
      ? `${style.accent} bg-opacity-70`
      : 'bg-slate-200';
    return (
      <button
        key={`${contextKey}-${actionKey}`}
        type="button"
        role="switch"
        aria-checked={current}
        onClick={() => !isDisabled && onSelect(!current)}
        className={`group inline-flex items-center gap-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${current ? style.active : style.inactive
          } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:brightness-105'}`}
        title={isDisabled && userRole === 'clinic' && !hasClinicPermission ? `You don't have "${label}" permission for this module` : ''}
      >
        <span>{label}</span>
        <span
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${trackClasses} ${current ? 'justify-end pr-[2px]' : 'justify-start pl-[2px]'
            }`}
        >
          <span
            className="h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
          />
        </span>
      </button>
    );
  };

  const slugify = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!isOpen) return null;

  // MODIFIED: Increased z-index to ensure modal appears above sidebar
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 text-sm font-semibold text-white shadow-sm">
              AP
            </span>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-600 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                agent permissions
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Manage Permissions</h3>
              <p className="text-xs text-slate-500 mt-0.5">{agentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-medium text-sky-700">
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
                </svg>
                Saving…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-[11px] font-medium text-rose-600">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.75a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zM10 13.5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                Error
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-sky-500" />
              <p className="mt-3 text-sm font-medium text-slate-600">Loading modules…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Permission Matrix</h2>
                <p className="text-[11px] text-slate-400">
                  {navigationItems.length} modules •{' '}
                  {permissions.reduce(
                    (acc, module) => acc + (module.subModules?.length || 0),
                    0
                  )}{' '}
                  sub-modules
                </p>
              </div>

              <div className="grid gap-3.5">
                {navigationItems.map((item) => {
                  const modulePermission = getModulePermission(item.moduleKey);
                  const isExpanded = expandedModules.has(item.moduleKey);
                  const hasSubModules = item.subModules && item.subModules.length > 0;

                  return (
                    <div
                      key={item._id}
                      className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow transition hover:border-sky-200"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 text-left"
                        onClick={() => toggleModuleExpansion(item.moduleKey)}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-slate-500">{item.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          {hasSubModules ? `${item.subModules?.length} sub-modules` : 'Module only'}
                          <svg
                            className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-4 border-t border-slate-200 pt-3">
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Module actions
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {ACTION_SEQUENCE.map(({ key, label }) =>
                                renderActionToggle(
                                  `module-${slugify(item.moduleKey)}`,
                                  key,
                                  label,
                                  modulePermission.actions[key] || false,
                                  (checked) => handleModuleActionChange(item.moduleKey, key, checked),
                                  saving,
                                  item.moduleKey
                                )
                              )}
                            </div>
                          </div>

                          {hasSubModules && (
                            <div className="space-y-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Sub-module actions
                              </p>
                              <div className="space-y-2.5">
                                {item.subModules?.map((subModule) => {
                                  const subModulePermission = modulePermission.subModules.find(
                                    sm => sm.name === subModule.name
                                  ) || {
                                    name: subModule.name,
                                    path: subModule.path || '',
                                    icon: subModule.icon,
                                    order: subModule.order,
                                    actions: {
                                      all: false,
                                      create: false,
                                      read: false,
                                      update: false,
                                      delete: false
                                    }
                                  };

                                  return (
                                    <div
                                      key={subModule.name}
                                      className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                                    >
                                      <div className="mb-2.5 flex items-center gap-2">
                                        <span className="text-base">{subModule.icon}</span>
                                        <div>
                                          <p className="text-sm font-medium text-slate-800">{subModule.name}</p>
                                          {subModule.path && (
                                            <p className="text-xs text-slate-500">{subModule.path}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {ACTION_SEQUENCE.map(({ key, label }) =>
                                          renderActionToggle(
                                            `sub-${slugify(item.moduleKey)}-${slugify(subModule.name)}`,
                                            key,
                                            label,
                                            subModulePermission.actions[key] || false,
                                            (checked) => handleSubModuleActionChange(item.moduleKey, subModule.name, key, checked),
                                            saving,
                                            item.moduleKey,
                                            subModule.name
                                          )
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPermissionModal;