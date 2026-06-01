import React, { useState } from 'react';

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

interface ClinicPermissionManagerProps {
  permissions: ModulePermission[];
  onPermissionsChange: (permissions: ModulePermission[]) => void;
  disabled?: boolean;
  title?: string;
}

const MODULES = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    description: 'Overview & metrics'
  },
  {
    key: 'health_center',
    label: 'Manage Health Center',
    icon: '📅',
    description: 'Manage Clinic'
  },
  {
    key: 'review',
    label: 'Review',
    icon: '👤',
    description: 'Check all review'
  },
  {
    key: 'enquiry',
    label: 'Enquiry',
    icon: '👨‍⚕️',
    description: 'All Patient Enquiries'
  },
  {
    key: 'jobs',
    label: 'Jobs',
    icon: '💼',
    description: 'Manage job postings',
    subModules: [
      { name: 'Job Posting', icon: '📢', order: 1 },
      { name: 'See All Jobs', icon: '💼', order: 2 },
      { name: 'See Job Applicants', icon: '👥', order: 3 }
    ]
  },
  {
    key: 'blogs',
    label: 'Blogs',
    icon: '📄',
    description: 'Manage Blogs',
    subModules: [
      { name: 'Write Blog', icon: '📝', order: 1 },
      { name: 'Published and Drafts Blogs', icon: '📄', order: 2 },
      { name: 'Analytics of blog', icon: '📊', order: 3 }
    ]
  }
];

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

const ClinicPermissionManager: React.FC<ClinicPermissionManagerProps> = ({ 
  permissions, 
  onPermissionsChange, 
  disabled = false,
  title = "Manage Clinic Permissions"
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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
        allActions.forEach(actionKey => {
          module.actions[actionKey as keyof typeof module.actions] = value;
        });
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
      
      <div className="space-y-4">
        {MODULES.map((module) => {
          const modulePermission = getModulePermission(module.key);
          const isExpanded = expandedModules.has(module.key);
          const hasSubModules = module.subModules && module.subModules.length > 0;
          
          return (
            <div key={module.key} className="border border-gray-200 rounded-lg">
              {/* Module Header */}
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleModuleExpansion(module.key)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <span className="font-medium text-gray-800">{module.label}</span>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hasSubModules && (
                    <span className="text-sm text-gray-500">
                      {module.subModules?.length} sub-modules
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
                            onChange={(e) => handleModuleActionChange(module.key, action.key, e.target.checked)}
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
                        {module.subModules?.map((subModule) => {
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
                                      onChange={(e) => handleSubModuleActionChange(module.key, subModule.name, action.key, e.target.checked)}
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

export default ClinicPermissionManager;
