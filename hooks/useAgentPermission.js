// hooks/useAgentPermission.js
import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Hook to check if agent has permission for a specific module and action
 * @param {string} moduleKey - The module key (e.g., 'add_vendor', 'membership')
 * @param {string} action - The action to check ('create', 'read', 'update', 'delete', 'all')
 * @param {string} subModuleName - Optional submodule name
 * @returns {object} - { hasPermission, loading, error }
 */
export const useAgentPermission = (moduleKey, action, subModuleName = null) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!moduleKey || !action) {
        setLoading(false);
        return;
      }

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
        if (!token) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          moduleKey,
          action,
        });

        if (subModuleName) {
          params.append('subModuleName', subModuleName);
        }

        const response = await axios.get(`/api/agent/check-permission?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setHasPermission(response.data.hasPermission);
        } else {
          setHasPermission(false);
        }
      } catch (err) {
        console.error('Error checking permission:', err);
        setError(err);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [moduleKey, action, subModuleName]);

  return { hasPermission, loading, error };
};

/**
 * Hook to get all permissions for the current agent
 * @returns {object} - { permissions, loading, error, hasPermission }
 */
export const useAgentPermissions = () => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get('/api/agent/my-permissions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.data) {
          // Build a permission map for easy lookup
          const permissionMap = {};
          const permissions = response.data.data.permissions || [];
          
          permissions.forEach(perm => {
            const moduleKey = perm.module;
            const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '');
            const moduleKeyWithClinic = `clinic_${moduleKeyWithoutPrefix}`;
            const moduleKeyWithAgent = `agent_${moduleKeyWithoutPrefix}`;
            const moduleKeyWithDoctor = `doctor_${moduleKeyWithoutPrefix}`;
            
            // Store permission with all possible moduleKey formats
            permissionMap[moduleKey] = perm;
            permissionMap[moduleKeyWithoutPrefix] = perm;
            permissionMap[moduleKeyWithClinic] = perm;
            permissionMap[moduleKeyWithAgent] = perm;
            permissionMap[moduleKeyWithDoctor] = perm;
            
            // Debug: Log submodules for staff_management
            if (moduleKey.includes('staff_management') || moduleKeyWithoutPrefix === 'staff_management') {
              console.log('Staff Management module found:', {
                moduleKey,
                moduleKeyWithoutPrefix,
                subModules: perm.subModules?.map(sm => ({
                  name: sm.name,
                  actions: sm.actions
                })) || []
              });
            }
            
            // Also store submodule permissions (for quick lookup, though we'll use the main perm object)
            if (perm.subModules && Array.isArray(perm.subModules)) {
              perm.subModules.forEach(subMod => {
                if (!subMod || !subMod.name) {
                  console.warn('Invalid submodule:', subMod);
                  return;
                }
                
                // Store submodule references for quick lookup
                const key = `${moduleKey}.${subMod.name}`;
                const keyWithoutPrefix = `${moduleKeyWithoutPrefix}.${subMod.name}`;
                const keyWithClinic = `${moduleKeyWithClinic}.${subMod.name}`;
                const keyWithAgent = `${moduleKeyWithAgent}.${subMod.name}`;
                const keyWithDoctor = `${moduleKeyWithDoctor}.${subMod.name}`;
                
                permissionMap[key] = subMod;
                permissionMap[keyWithoutPrefix] = subMod;
                permissionMap[keyWithClinic] = subMod;
                permissionMap[keyWithAgent] = subMod;
                permissionMap[keyWithDoctor] = subMod;
              });
            }
          });
          
          setPermissions(permissionMap);
          
          // Debug: Log the permission structure
          console.log('Permissions loaded:', {
            permissionCount: permissions.length,
            permissionMapKeys: Object.keys(permissionMap),
            samplePermission: permissions[0],
            permissionMapSample: Object.keys(permissionMap).slice(0, 5).reduce((acc, key) => {
              acc[key] = permissionMap[key];
              return acc;
            }, {})
          });
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (moduleKey, action, subModuleName = null) => {
    if (!permissions || !moduleKey || !action) {
      console.log('hasPermission: Missing params', { permissions: !!permissions, moduleKey, action });
      return false;
    }

    // Try multiple moduleKey formats
    const moduleKeyWithoutPrefix = moduleKey.replace(/^(admin|clinic|doctor|agent)_/, '');
    const moduleKeyWithClinic = `clinic_${moduleKeyWithoutPrefix}`;
    const moduleKeyWithAgent = `agent_${moduleKeyWithoutPrefix}`;
    const moduleKeyWithDoctor = `doctor_${moduleKeyWithoutPrefix}`;
    
    // Try to find the module permission with different formats
    let modulePerm = permissions[moduleKey] || 
                     permissions[moduleKeyWithoutPrefix] ||
                     permissions[moduleKeyWithClinic] ||
                     permissions[moduleKeyWithAgent] ||
                     permissions[moduleKeyWithDoctor];

    // If still not found, try searching by matching the module field in permissions
    if (!modulePerm && permissions) {
      const permValues = Object.values(permissions);
      modulePerm = permValues.find(p => {
        if (!p || typeof p !== 'object') return false;
        const permModule = p.module || '';
        return permModule === moduleKey ||
               permModule === moduleKeyWithoutPrefix ||
               permModule === moduleKeyWithClinic ||
               permModule === moduleKeyWithAgent ||
               permModule === moduleKeyWithDoctor ||
               permModule.replace(/^(admin|clinic|doctor|agent)_/, '') === moduleKeyWithoutPrefix;
      });
    }

    if (!modulePerm) {
      console.log('hasPermission: Module not found', { moduleKey, moduleKeyWithoutPrefix, availableKeys: Object.keys(permissions || {}) });
      return false;
    }

    if (subModuleName) {
      // Check if subModules array exists and find the submodule
      if (!modulePerm.subModules || !Array.isArray(modulePerm.subModules)) {
        console.log('hasPermission: No subModules array', { moduleKey, subModuleName });
        return false;
      }
      
      const subModulePerm = modulePerm.subModules.find(sm => {
        if (!sm || !sm.name) return false;
        return sm.name === subModuleName || 
               sm.name.toLowerCase() === subModuleName.toLowerCase() ||
               sm.name.trim() === subModuleName.trim();
      });
      
      if (!subModulePerm) {
        console.log('hasPermission: SubModule not found', { 
          moduleKey, 
          subModuleName, 
          availableSubModules: modulePerm.subModules.map(sm => sm.name) 
        });
        return false;
      }
      
      const hasAction = subModulePerm.actions?.[action] === true || subModulePerm.actions?.all === true;
      console.log('hasPermission: SubModule check', { 
        moduleKey, 
        subModuleName, 
        action, 
        hasAction,
        actions: subModulePerm.actions 
      });
      return hasAction;
    }

    const hasAction = modulePerm.actions?.[action] === true || modulePerm.actions?.all === true;
    console.log('hasPermission: Module check', { moduleKey, action, hasAction, actions: modulePerm.actions });
    return hasAction;
  };

  return { permissions, loading, error, hasPermission };
};

