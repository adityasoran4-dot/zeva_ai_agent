import React, { useState, useEffect } from 'react';

interface SubModule {
  name: string;
  path?: string;
  icon: string;
  order: number;
  moduleKey?: string;
  actions: Record<ActionKey, boolean>;
}

interface ModulePermission {
  module: string;
  subModules: SubModule[];
  actions: Record<ActionKey, boolean>;
}

interface ClinicNavigationItem {
  _id: string;
  label: string;
  path?: string;
  icon: string;
  description?: string;
  order: number;
  moduleKey: string;
  role?: 'admin' | 'clinic' | 'doctor';
  subModules?: Array<{
    name: string;
    path?: string;
    icon: string;
    order: number;
  }>;
}

interface ClinicPermissionManagerProps {
  permissions: ModulePermission[];
  navigationItems: ClinicNavigationItem[];
  onPermissionsChange: (permissions: ModulePermission[], meta?: { trigger?: 'user' | 'sync' }) => void;
  disabled?: boolean;
  title?: string;
  isLoading?: boolean;
}

type ActionKey = 'all' | 'create' | 'read' | 'update' | 'delete';

const ACTION_SEQUENCE: Array<{ key: ActionKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

const ACTION_KEYS: ActionKey[] = ACTION_SEQUENCE.map(({ key }) => key);

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

const createBlankActions = (): Record<ActionKey, boolean> =>
  ACTION_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as Record<ActionKey, boolean>);

const sanitizeModulePermission = (permission: ModulePermission): ModulePermission => ({
  ...permission,
  actions: ACTION_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(permission.actions?.[key]);
    return acc;
  }, {} as Record<ActionKey, boolean>),
  subModules: (permission.subModules || []).map((sub) => ({
    ...sub,
    moduleKey: sub.moduleKey,
    actions: ACTION_KEYS.reduce((acc, key) => {
      acc[key] = Boolean(sub.actions?.[key]);
      return acc;
    }, {} as Record<ActionKey, boolean>),
  })),
});

const areModulePermissionsEqual = (left: ModulePermission[], right: ModulePermission[]) =>
  JSON.stringify(left) === JSON.stringify(right);

const ClinicPermissionManagerNew: React.FC<ClinicPermissionManagerProps> = ({
  permissions,
  navigationItems,
  onPermissionsChange,
  disabled = false,
  title = 'Permission Matrix',
  isLoading = false,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [localPermissions, setLocalPermissions] = useState<ModulePermission[]>(
    permissions.map(sanitizeModulePermission)
  );

  // ISSUE FIXED: Removed auto-expansion of modules with submodules
  // Previously, all modules with submodules were automatically expanded on load
  // Now modules will only expand when user clicks on them
  // The removed code was:
  // useEffect(() => {
  //   const autoExpanded = navigationItems
  //     .filter((item) => item.subModules?.length)
  //     .map((item) => item.moduleKey);
  //   setExpandedModules(new Set(autoExpanded));
  // }, [navigationItems]);

  useEffect(() => {
    const sanitized = permissions.map(sanitizeModulePermission);
    const allowedModules = new Set(navigationItems.map((item) => item.moduleKey));
    const filtered = allowedModules.size
      ? sanitized.filter((permission) => allowedModules.has(permission.module))
      : sanitized;

    const existingModules = new Set(filtered.map((permission) => permission.module));
    const missing = navigationItems.filter((navItem) => !existingModules.has(navItem.moduleKey));

    const filler = missing.map((navItem) => ({
      module: navItem.moduleKey,
      subModules:
        navItem.subModules?.map((subModule) => ({
          name: subModule.name,
          path: subModule.path || '',
          icon: subModule.icon,
          order: subModule.order,
          moduleKey: (subModule as any).moduleKey,
          actions: createBlankActions(),
        })) || [],
      actions: createBlankActions(),
    }));

    const next = [...filtered, ...filler].map(sanitizeModulePermission);
    const shouldSync =
      missing.length > 0 ||
      filtered.length !== permissions.length;

    if (!areModulePermissionsEqual(localPermissions, next)) {
      setLocalPermissions(next);
    }
    if (shouldSync) {
      onPermissionsChange(next, { trigger: 'sync' });
    }
  }, [permissions, navigationItems, localPermissions, onPermissionsChange]);

  const toggleModuleExpansion = (moduleKey: string) => {
    const clone = new Set(expandedModules);
    if (clone.has(moduleKey)) {
      clone.delete(moduleKey);
    } else {
      clone.add(moduleKey);
    }
    setExpandedModules(clone);
  };

  const propagatePermissions = (next: ModulePermission[], trigger: 'user' | 'sync' = 'user') => {
    setLocalPermissions(next);
    onPermissionsChange(next, { trigger });
  };

  const syncModuleAction = (moduleKey: string, action: ActionKey, value: boolean) => {
    const next = [...localPermissions];
    let target = next.find((module) => module.module === moduleKey);

    if (!target) {
      const navItem = navigationItems.find((item) => item.moduleKey === moduleKey);
      target = {
        module: moduleKey,
        actions: createBlankActions(),
        subModules:
          navItem?.subModules?.map((sub) => ({
            name: sub.name,
            path: sub.path || '',
            icon: sub.icon,
            order: sub.order,
            moduleKey: (sub as any).moduleKey,
            actions: createBlankActions(),
          })) || [],
      };
      next.push(target);
    }

    if (action === 'all') {
      ACTION_SEQUENCE.forEach(({ key }) => {
        target!.actions[key] = value;
      });

      if (target.subModules && target.subModules.length > 0) {
        target.subModules = target.subModules.map((sub) => ({
          ...sub,
          actions: ACTION_KEYS.reduce((acc, key) => {
            acc[key] = value;
            return acc;
          }, {} as Record<ActionKey, boolean>),
        }));
      }
    } else {
      target.actions[action] = value;
      const rest = ACTION_SEQUENCE.filter((a) => a.key !== 'all');
      target.actions.all = rest.every(({ key }) => target!.actions[key]);

      if (target.subModules && target.subModules.length > 0) {
        target.subModules = target.subModules.map((sub) => {
          const updatedActions = { ...sub.actions, [action]: value };
          const allEnabled = ACTION_SEQUENCE.filter((a) => a.key !== 'all').every(
            ({ key }) => updatedActions[key]
          );
          return {
            ...sub,
            actions: {
              ...updatedActions,
              all: allEnabled,
            },
          };
        });
      }
    }

    propagatePermissions(next);
  };

  const syncSubModuleAction = (
    moduleKey: string,
    subModuleName: string,
    action: ActionKey,
    value: boolean
  ) => {
    const next = [...localPermissions];
    let modulePermission = next.find((item) => item.module === moduleKey);

    if (!modulePermission) {
      const navItem = navigationItems.find((item) => item.moduleKey === moduleKey);
      modulePermission = {
        module: moduleKey,
        actions: createBlankActions(),
        subModules:
          navItem?.subModules?.map((sub) => ({
            name: sub.name,
            path: sub.path || '',
            icon: sub.icon,
            order: sub.order,
            moduleKey: (sub as any).moduleKey,
            actions: createBlankActions(),
          })) || [],
      };
      next.push(modulePermission);
    }

    if (!modulePermission.subModules) {
      modulePermission.subModules = [];
    }

    let subModule = modulePermission.subModules.find((sub) => sub.name === subModuleName);
    if (!subModule) {
      const navSub = navigationItems
        .find((item) => item.moduleKey === moduleKey)
        ?.subModules?.find((sub) => sub.name === subModuleName);

      subModule = {
        name: subModuleName,
        path: navSub?.path || '',
        icon: navSub?.icon || '📄',
        order: navSub?.order || 0,
        moduleKey: (navSub as any)?.moduleKey,
        actions: createBlankActions(),
      };
      modulePermission.subModules.push(subModule);
    }

    if (action === 'all') {
      ACTION_SEQUENCE.filter((a) => a.key !== 'all').forEach(({ key }) => {
        subModule!.actions[key] = value;
      });
      subModule.actions.all = value;
    } else {
      subModule.actions[action] = value;
      const rest = ACTION_SEQUENCE.filter((a) => a.key !== 'all');
      subModule.actions.all = rest.every(({ key }) => subModule!.actions[key]);
    }

    propagatePermissions(next);
  };

  const renderActionToggle = (
    contextKey: string,
    actionKey: ActionKey,
    label: string,
    current: boolean,
    onSelect: (value: boolean) => void
  ) => {
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
        onClick={() => !disabled && onSelect(!current)}
        className={`group inline-flex items-center gap-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
          current ? style.active : style.inactive
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:brightness-105'}`}
      >
        <span>{label}</span>
        <span
          className={`relative inline-flex h-4 w-8 items-center rounded-full transition ${trackClasses} ${
            current ? 'justify-end pr-[2px]' : 'justify-start pl-[2px]'
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

  const renderModuleCard = (item: ClinicNavigationItem) => {
    const modulePermission = localPermissions.find((p) => p.module === item.moduleKey);
    const isExpanded = expandedModules.has(item.moduleKey);
    const hasSubModules = item.subModules?.length;

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
                    modulePermission ? modulePermission.actions[key] : false,
                    (checked) => syncModuleAction(item.moduleKey, key, checked),
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
                    const subPermission =
                      modulePermission?.subModules?.find((sub) => sub.name === subModule.name) || {
                        name: subModule.name,
                        path: subModule.path,
                        icon: subModule.icon,
                        order: subModule.order,
                        actions: createBlankActions(),
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
                              subPermission.actions[key] ?? false,
                              (checked) =>
                                syncSubModuleAction(item.moduleKey, subModule.name, key, checked),
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
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-sky-500" />
        <p className="mt-3 text-sm font-medium text-slate-600">Loading modules…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-[11px] text-slate-400">
          {navigationItems.length} modules •{' '}
          {localPermissions.reduce(
            (acc, module) => acc + (module.subModules?.length || 0),
            0
          )}{' '}
          sub-modules
        </p>
      </div>

      <div className="grid gap-3.5">
        {navigationItems.map((item) => renderModuleCard(item))}
      </div>
    </div>
  );
};

export default ClinicPermissionManagerNew;
