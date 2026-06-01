import React, { useState, useEffect } from 'react';

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
  }>;
}

interface SubModule {
  name: string;
  path?: string;
  icon: string;
  order: number;
  actions: {
    all: boolean;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    print: boolean;
    export: boolean;
    approve: boolean;
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
    print: boolean;
    export: boolean;
    approve: boolean;
  };
}

interface DynamicPermissionManagerProps {
  permissions: ModulePermission[];
  onPermissionsChange: (permissions: ModulePermission[]) => void;
  disabled?: boolean;
  title?: string;
}

const ACTIONS = [
  { key: 'all', label: 'All', color: 'bg-purple-600' },
  { key: 'create', label: 'Create', color: 'bg-green-500' },
  { key: 'read', label: 'Read', color: 'bg-yellow-500' },
  { key: 'update', label: 'Update', color: 'bg-blue-500' },
  { key: 'delete', label: 'Delete', color: 'bg-red-500' },
  { key: 'print', label: 'Print', color: 'bg-purple-600' },
  { key: 'export', label: 'Export', color: 'bg-gray-800' },
  { key: 'approve', label: 'Approve', color: 'bg-gray-800' }
];

const DynamicPermissionManager: React.FC<DynamicPermissionManagerProps> = ({ 
  permissions, 
  onPermissionsChange, 
  disabled = false,
  title = "Manage Permissions"
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNavigationItems();
  }, []);

  const fetchNavigationItems = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/navigation/items', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setNavigationItems(data.data);
        // Auto-expand modules with sub-modules
        const modulesWithSubModules = data.data.filter((item: NavigationItem) => item.subModules && item.subModules.length > 0);
        setExpandedModules(new Set(modulesWithSubModules.map((item: NavigationItem) => item.moduleKey)));
      }
    } catch (error) {
      console.error('Error fetching navigation items:', error);
    } finally {
      setLoading(false);
    }
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

  const handleModuleActionChange = (moduleKey: string, action: string, value: boolean) => {
    const newPermissions = [...permissions];
    const moduleIndex = newPermissions.findIndex(p => p.module === moduleKey);
    
    if (moduleIndex >= 0) {
      const module = newPermissions[moduleIndex];
      
      if (action === 'all') {
        const allActions = Object.keys(module.actions).filter(key => key !== 'all');
        // Set all module-level actions
        allActions.forEach(actionKey => {
          module.actions[actionKey as keyof typeof module.actions] = value;
        });
        
        // ✅ When module-level "all" is clicked, also set all submodule actions to true
        // This ensures UI consistency and makes it clear that all submodules are active
        if (module.subModules && module.subModules.length > 0) {
          module.subModules.forEach(subModule => {
            // Set all actions for each submodule
            const subModuleActions = Object.keys(subModule.actions).filter(key => key !== 'all');
            subModuleActions.forEach(actionKey => {
              (subModule.actions as any)[actionKey] = value;
            });
            // Also set the "all" flag for the submodule
            subModule.actions.all = value;
          });
        }
      } else {
        module.actions[action as keyof typeof module.actions] = value;
        
        const allActions = Object.keys(module.actions).filter(key => key !== 'all');
        const allEnabled = allActions.every(actionKey => 
          module.actions[actionKey as keyof typeof module.actions]
        );
        module.actions.all = allEnabled;
      }
      
      onPermissionsChange(newPermissions);
    }
  };

  const handleSubModuleActionChange = (moduleKey: string, subModuleName: string, action: string, value: boolean) => {
    const newPermissions = [...permissions];
    const moduleIndex = newPermissions.findIndex(p => p.module === moduleKey);
    
    if (moduleIndex >= 0) {
      const module = newPermissions[moduleIndex];
      const subModuleIndex = module.subModules.findIndex(sm => sm.name === subModuleName);
      
      if (subModuleIndex >= 0) {
        const subModule = module.subModules[subModuleIndex];
        
        if (action === 'all') {
          const allActions = Object.keys(subModule.actions).filter(key => key !== 'all');
          allActions.forEach(actionKey => {
            subModule.actions[actionKey as keyof typeof subModule.actions] = value;
          });
        } else {
          subModule.actions[action as keyof typeof subModule.actions] = value;
          
          const allActions = Object.keys(subModule.actions).filter(key => key !== 'all');
          const allEnabled = allActions.every(actionKey => 
            subModule.actions[actionKey as keyof typeof subModule.actions]
          );
          subModule.actions.all = allEnabled;
        }
        
        onPermissionsChange(newPermissions);
      }
    }
  };

  const getModulePermission = (moduleKey: string) => {
    return permissions.find(p => p.module === moduleKey) || {
      module: moduleKey,
      subModules: [],
      actions: {
        all: false,
        create: false,
        read: false,
        update: false,
        delete: false,
        print: false,
        export: false,
        approve: false
      }
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      
      <div className="space-y-4">
        {navigationItems.map((item) => {
          const modulePermission = getModulePermission(item.moduleKey);
          const isExpanded = expandedModules.has(item.moduleKey);
          const hasSubModules = item.subModules && item.subModules.length > 0;
          
          return (
            <div key={item._id} className="border border-gray-200 rounded-lg">
              {/* Module Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleModuleExpansion(item.moduleKey)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hasSubModules && (
                    <span className="text-sm text-gray-500">
                      {item.subModules?.length} sub-modules
                    </span>
                  )}
                  <svg 
                    className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Module Content */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-200">
                  {/* Module-level Actions */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Module Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      {ACTIONS.map((action) => (
                        <label key={action.key} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={modulePermission.actions[action.key as keyof typeof modulePermission.actions]}
                            onChange={(e) => handleModuleActionChange(item.moduleKey, action.key, e.target.checked)}
                            disabled={disabled}
                            className="sr-only"
                          />
                          <div className={`
                            px-3 py-1 rounded-full text-xs font-medium transition-colors
                            ${modulePermission.actions[action.key as keyof typeof modulePermission.actions] 
                              ? `${action.color} text-white` 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }
                          `}>
                            {action.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sub-modules */}
                  {hasSubModules && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Sub-modules</h4>
                      <div className="space-y-3">
                        {item.subModules?.map((subModule) => {
                          const subModulePermission = modulePermission.subModules.find(sm => sm.name === subModule.name) || {
                            name: subModule.name,
                            path: '',
                            icon: subModule.icon,
                            order: subModule.order,
                            actions: {
                              all: false,
                              create: false,
                              read: false,
                              update: false,
                              delete: false,
                              print: false,
                              export: false,
                              approve: false
                            }
                          };
                          
                          return (
                            <div key={subModule.name} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{subModule.icon}</span>
                                  <span className="font-medium text-gray-800">{subModule.name}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {ACTIONS.map((action) => (
                                  <label key={action.key} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={subModulePermission.actions[action.key as keyof typeof subModulePermission.actions]}
                                      onChange={(e) => handleSubModuleActionChange(item.moduleKey, subModule.name, action.key, e.target.checked)}
                                      disabled={disabled}
                                      className="sr-only"
                                    />
                                    <div className={`
                                      px-3 py-1 rounded-full text-xs font-medium transition-colors
                                      ${subModulePermission.actions[action.key as keyof typeof subModulePermission.actions] 
                                        ? `${action.color} text-white` 
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }
                                    `}>
                                      {action.label}
                                    </div>
                                  </label>
                                ))}
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
  );
};

export default DynamicPermissionManager;
