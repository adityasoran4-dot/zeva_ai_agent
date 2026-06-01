'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAuth from '../../components/withAdminAuth';
import { useAgentPermissions } from '../../hooks/useAgentPermissions';
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import type { NextPageWithLayout } from '../_app';

type SubTreatment = {
  name: string;
  slug: string;
};

type Treatment = {
  _id: string;
  name: string;
  slug: string;
  subcategories: SubTreatment[];
};

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

const AddTreatment: NextPageWithLayout = () => {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [newMainTreatment, setNewMainTreatment] = useState<string>('');
  const [currentSubTreatment, setCurrentSubTreatment] = useState<string>('');
  const [addedSubTreatments, setAddedSubTreatments] = useState<Array<{id: string, name: string}>>([]);
  const [selectedMainTreatment, setSelectedMainTreatment] = useState<string>('');
  const [availableSubTreatments, setAvailableSubTreatments] = useState<SubTreatment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // const [isFromDropdown, setIsFromDropdown] = useState<boolean>(false); // Reserved for future use - tracks if value came from dropdown vs manual input
  const [customMainTreatments, setCustomMainTreatments] = useState<Array<{id: string, name: string}>>([]);
  const [customSubTreatments, setCustomSubTreatments] = useState<Array<{id: string, name: string}>>([]);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [originalSubTreatments, setOriginalSubTreatments] = useState<string[]>([]);

  // Toast helper functions
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Check if user is an admin or agent/doctorStaff
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAgent, setIsAgent] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminToken = !!localStorage.getItem('adminToken');
      const agentToken = !!localStorage.getItem('agentToken');
      const userToken = !!localStorage.getItem('userToken');
      const isAgentRoute = router.pathname?.startsWith('/agent/') || window.location.pathname?.startsWith('/agent/');
      
      if (isAgentRoute && (agentToken || userToken)) {
        setIsAdmin(false);
        setIsAgent(true);
      } else if (adminToken) {
        setIsAdmin(true);
        setIsAgent(false);
      } else if (agentToken || userToken) {
        setIsAdmin(false);
        setIsAgent(true);
      } else {
        setIsAdmin(false);
        setIsAgent(false);
      }
    }
  }, [router.pathname]);
  
  const agentPermissionsData: any = useAgentPermissions(isAgent ? "admin_add_treatment" : (null as any));
  const agentPermissions = isAgent ? agentPermissionsData?.permissions : null;
  const permissionsLoading = isAgent ? agentPermissionsData?.loading : false;
  
  // Check if agent/doctorStaff doesn't have create permission
  const hasNoCreatePermission = 
    !isAdmin &&
    isAgent &&
    !permissionsLoading &&
    agentPermissions &&
    !agentPermissions.canCreate &&
    !agentPermissions.canAll;

  // Helper: detect "read-only" agent (has only read, no other actions)
  const isAgentReadOnly =
    !isAdmin &&
    isAgent &&
    !permissionsLoading &&
    agentPermissions &&
    agentPermissions.canRead === true &&
    !agentPermissions.canAll &&
    !agentPermissions.canCreate &&
    !agentPermissions.canUpdate &&
    !agentPermissions.canDelete &&
    !agentPermissions.canApprove &&
    !agentPermissions.canPrint &&
    !agentPermissions.canExport;

  const fetchTreatments = async () => {
    setFetching(true);
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      const token = adminToken || agentToken || userToken;

      if (!token) {
        showToast('No authentication token found', 'error');
        return;
      }

      const res = await axios.get<{ treatments: Treatment[] }>('/api/doctor/getTreatment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTreatments(res.data.treatments || []);
    } catch (err: any) {
      console.error('Failed to fetch treatments', err);
      showToast('Failed to load treatments', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    // Admins and non-agent routes always fetch
    if (isAdmin || !isAgent) {
      fetchTreatments();
      return;
    }

    // For agents, wait until permissions are loaded
    if (!permissionsLoading && agentPermissions) {
      // If agent is read-only, do NOT fetch (no need to show All Treatments)
      if (!isAgentReadOnly) {
        fetchTreatments();
      }
    }
  }, [isAdmin, isAgent, permissionsLoading, agentPermissions, isAgentReadOnly]);

  // Update available sub-treatments when treatments or selectedMainTreatment changes
  useEffect(() => {
    if (selectedMainTreatment && treatments.length > 0) {
      const selectedTreatment = treatments.find(t => t._id === selectedMainTreatment);
      if (selectedTreatment) {
        setAvailableSubTreatments(selectedTreatment.subcategories || []);
      } else {
        setAvailableSubTreatments([]);
      }
    } else {
      setAvailableSubTreatments([]);
    }
  }, [selectedMainTreatment, treatments]);

  // Reset form when editingTreatment changes
  useEffect(() => {
    if (!editingTreatment && selectedMainTreatment) {
      // Reset sub-treatment chips when not editing
      setAddedSubTreatments([]);
      setCurrentSubTreatment('');
    }
  }, [editingTreatment]);

  useEffect(() => {
    if (showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDeleteModal]);

  // Reserved for future use - currently using handleAddBoth instead
  /*
  const handleAddMainTreatment = async () => {
    if (!newMainTreatment.trim()) {
      showToast('Treatment name required', 'error');
      return;
    }

    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canCreate && !agentPermissions.canAll) {
      showToast('Permission denied', 'error');
      return;
    }

    setLoading(true);

    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      const token = adminToken || agentToken || userToken;

      if (!token) {
        showToast('Authentication required', 'error');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/admin/addTreatment', {
        name: newMainTreatment,
        slug: newMainTreatment.toLowerCase().replace(/\s+/g, '-'),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 201) {
        showToast('Treatment added', 'success');
        const addedTreatmentName = newMainTreatment;
        // Add to custom main treatments list
        const customId = Math.random().toString(36).substr(2, 9);
        setCustomMainTreatments(prev => [...prev, { id: customId, name: addedTreatmentName }]);
        setNewMainTreatment('');
        fetchTreatments();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to add treatment';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  */

  // Reserved for future use - currently using handleAddBoth instead
  /*
  const handleAddSubTreatment = async () => {
    if (!selectedMainTreatment) {
      showToast('Select main treatment first', 'warning');
      return;
    }

    if (!newSubTreatment.trim()) {
      showToast('Sub-treatment name required', 'error');
      return;
    }

    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canCreate && !agentPermissions.canAll) {
      showToast('Permission denied', 'error');
      return;
    }

    setLoading(true);

    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      const token = adminToken || agentToken || userToken;

      if (!token) {
        showToast('Authentication required', 'error');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/admin/addSubTreatment', {
        mainTreatmentId: selectedMainTreatment,
        subTreatmentName: newSubTreatment,
        subTreatmentSlug: newSubTreatment.toLowerCase().replace(/\s+/g, '-'),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 201) {
        showToast('Sub-treatment added', 'success');
        const addedSubTreatmentName = newSubTreatment;
        // Add to custom sub-treatments list
        const customId = Math.random().toString(36).substr(2, 9);
        setCustomSubTreatments(prev => [...prev, { id: customId, name: addedSubTreatmentName }]);
        setNewSubTreatment('');
        setSelectedMainTreatment('');
        fetchTreatments();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to add sub-treatment';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  */

  const handleRemoveCustomMainTreatment = (id: string) => {
    setCustomMainTreatments(prev => prev.filter(item => item.id !== id));
  };

  const handleRemoveCustomSubTreatment = (id: string) => {
    setCustomSubTreatments(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteClick = (id: string, name: string) => {
    setTreatmentToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!treatmentToDelete) return;

    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canDelete && !agentPermissions.canAll) {
      showToast('Permission denied', 'error');
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
      return;
    }

    setIsDeleting(true);
    
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      const token = adminToken || agentToken || userToken;

      if (!token) {
        showToast('Authentication required', 'error');
        setIsDeleting(false);
        return;
      }

      await axios.delete(`/api/admin/deleteTreatment?id=${treatmentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Treatment deleted', 'success');
      fetchTreatments();
      setShowDeleteModal(false);
      setTreatmentToDelete(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTreatmentToDelete(null);
  };

  const handleMainTreatmentSelect = (treatmentId: string) => {
    // setIsFromDropdown(true); // Reserved for future use
    setSelectedMainTreatment(treatmentId);
    const selectedTreatment = treatments.find(t => t._id === treatmentId);
    if (selectedTreatment) {
      // Load sub-treatments for the selected main treatment
      setAvailableSubTreatments(selectedTreatment.subcategories || []);
    } else {
      setAvailableSubTreatments([]);
    }
    // Reset sub-treatment chips when main treatment changes (only if not editing)
    if (!editingTreatment) {
      setAddedSubTreatments([]);
      setCurrentSubTreatment('');
    }
    // setTimeout(() => setIsFromDropdown(false), 100); // Reserved for future use
  };

  const handleSubTreatmentSelect = (subTreatmentName: string) => {
    setCurrentSubTreatment(subTreatmentName);
  };

  const handleAddSubTreatmentToChips = () => {
    const trimmedValue = currentSubTreatment.trim();
    if (!trimmedValue) {
      showToast('Please enter a sub-treatment name', 'warning');
      return;
    }

    // Check for duplicates (case-insensitive)
    const isDuplicate = addedSubTreatments.some(
      st => st.name.toLowerCase().trim() === trimmedValue.toLowerCase()
    );

    if (isDuplicate) {
      showToast('This sub-treatment is already added', 'warning');
      return;
    }

    // Add to chips
    const newId = Math.random().toString(36).substr(2, 9);
    setAddedSubTreatments(prev => [...prev, { id: newId, name: trimmedValue }]);
    setCurrentSubTreatment('');
  };

  const handleRemoveSubTreatmentChip = (id: string) => {
    setAddedSubTreatments(prev => prev.filter(chip => chip.id !== id));
  };

  const handleSubTreatmentKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubTreatmentToChips();
    }
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setEditingTreatment(treatment);
    setSelectedMainTreatment(treatment._id);
    setNewMainTreatment('');
    setCurrentSubTreatment('');
    // Set sub-treatment chips from existing subcategories
    if (treatment.subcategories && treatment.subcategories.length > 0) {
      const subTreatmentNames = treatment.subcategories.map(sub => sub.name);
      setOriginalSubTreatments(subTreatmentNames);
      setAddedSubTreatments(
        treatment.subcategories.map(sub => ({
          id: Math.random().toString(36).substr(2, 9),
          name: sub.name
        }))
      );
    } else {
      setOriginalSubTreatments([]);
      setAddedSubTreatments([]);
    }
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTreatment(null);
    setSelectedMainTreatment('');
    setNewMainTreatment('');
    setCurrentSubTreatment('');
    setAddedSubTreatments([]);
    setOriginalSubTreatments([]);
  };

  const handleAddBoth = async () => {
    // Get all sub-treatment values from chips
    const subTreatmentValues = addedSubTreatments.map(chip => chip.name.trim());

    if (!newMainTreatment.trim() && subTreatmentValues.length === 0) {
      showToast('Please enter main treatment or sub-treatment', 'warning');
      return;
    }

    if (!isAdmin && isAgent && agentPermissions && !agentPermissions.canCreate && !agentPermissions.canAll) {
      showToast('Permission denied', 'error');
      return;
    }

    setLoading(true);

    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const agentToken = typeof window !== 'undefined' ? localStorage.getItem('agentToken') : null;
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      const token = adminToken || agentToken || userToken;

      if (!token) {
        showToast('Authentication required', 'error');
        setLoading(false);
        return;
      }

      let mainTreatmentId = editingTreatment ? editingTreatment._id : selectedMainTreatment;

      // If editing but no mainTreatmentId, something is wrong
      if (editingTreatment && !mainTreatmentId) {
        showToast('Error: Treatment ID not found', 'error');
        setLoading(false);
        return;
      }

      // Add main treatment if value exists and not editing
      if (newMainTreatment.trim() && !editingTreatment) {
        // Normalize for comparison: lowercase and trim
        const normalizedMainTreatment = newMainTreatment.trim().toLowerCase();
        
        // Check for duplicate main treatment (case-insensitive)
        const isDuplicateMainTreatment = treatments.some(t => 
          t.name?.toLowerCase().trim() === normalizedMainTreatment
        );
        
        if (isDuplicateMainTreatment) {
          showToast(`Treatment "${newMainTreatment.trim()}" already exists`, 'error');
          setLoading(false);
          return;
        }
        
        const res = await axios.post('/api/admin/addTreatment', {
          name: newMainTreatment.trim(),
          slug: newMainTreatment.trim().toLowerCase().replace(/\s+/g, '-'),
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 201) {
          const addedTreatmentName = newMainTreatment;
          const customId = Math.random().toString(36).substr(2, 9);
          setCustomMainTreatments(prev => [...prev, { id: customId, name: addedTreatmentName }]);
          setNewMainTreatment('');
          // Fetch updated treatments to get the new treatment ID
          const updatedRes = await axios.get<{ treatments: Treatment[] }>('/api/doctor/getTreatment', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTreatments(updatedRes.data.treatments || []);
          const newTreatment = updatedRes.data.treatments?.find(t => t.name === addedTreatmentName);
          if (newTreatment) {
            mainTreatmentId = newTreatment._id;
            setSelectedMainTreatment(newTreatment._id);
          }
        }
      }

      // Handle sub-treatments if main treatment is selected
      if (!mainTreatmentId) {
        if (subTreatmentValues.length > 0) {
          showToast('Please select or add main treatment first', 'warning');
          setLoading(false);
          return;
        }
      } else {
        // If editing, handle deletions and additions
        if (editingTreatment) {
          const currentSubNames = subTreatmentValues.map(name => name.toLowerCase().trim());
          const originalSubNames = originalSubTreatments.map(name => name.toLowerCase().trim());
          
          // Find removed sub-treatments (in original but not in current)
          const removedSubTreatments = originalSubTreatments.filter(originalName => {
            const normalized = originalName.toLowerCase().trim();
            return !currentSubNames.includes(normalized);
          });
          
          // Find new sub-treatments (in current but not in original)
          const newSubTreatments = subTreatmentValues.filter(currentName => {
            const normalized = currentName.toLowerCase().trim();
            return !originalSubNames.includes(normalized);
          });

          // If no changes, just refresh and exit
          if (removedSubTreatments.length === 0 && newSubTreatments.length === 0) {
            await fetchTreatments();
            showToast('No changes made', 'info');
            setEditingTreatment(null);
            setSelectedMainTreatment('');
            setAddedSubTreatments([]);
            setCurrentSubTreatment('');
            setOriginalSubTreatments([]);
            setLoading(false);
            return;
          }

          const addPromises: Promise<any>[] = [];
          const deleteResults: any[] = [];
          const deleteErrors: any[] = [];

          // Delete removed sub-treatments SEQUENTIALLY to avoid race conditions
          // Multiple deletions on the same document can conflict if done in parallel
          if (removedSubTreatments.length > 0) {
            for (const subName of removedSubTreatments) {
              try {
                const result = await axios.delete(
                  `/api/admin/deleteSubTreatment?mainTreatmentId=${mainTreatmentId}&subTreatmentName=${encodeURIComponent(subName)}`,
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                );
                deleteResults.push({ success: true, subName, data: result.data });
              } catch (err: any) {
                // Log error but continue with other deletions
                console.error(`Failed to delete sub-treatment "${subName}":`, err.response?.data || err.message);
                deleteErrors.push({ 
                  error: true, 
                  subName, 
                  message: err.response?.data?.message || 'Delete failed' 
                });
                deleteResults.push({ error: true, subName });
              }
            }
          }

          // Add new sub-treatments (can be done in parallel since they don't conflict)
          if (newSubTreatments.length > 0) {
            newSubTreatments.forEach(subName => {
              addPromises.push(
                axios.post('/api/admin/addSubTreatment', {
                  mainTreatmentId: mainTreatmentId,
                  subTreatmentName: subName,
                  subTreatmentSlug: subName.toLowerCase().replace(/\s+/g, '-'),
                }, {
                  headers: { Authorization: `Bearer ${token}` }
                }).catch(err => {
                  // Log error but don't fail the entire update
                  console.error(`Failed to add sub-treatment "${subName}":`, err.response?.data || err.message);
                  return { error: true, subName, message: err.response?.data?.message || 'Add failed' };
                })
              );
            });
          }

          try {
            // Execute additions in parallel (they don't conflict with each other)
            const addResults = addPromises.length > 0 ? await Promise.all(addPromises) : [];
            
            // Check for errors
            const addErrors = addResults.filter(r => r && r.error);
            
            // Refresh data regardless of errors
            await fetchTreatments();
            
            // Reset form
            setAddedSubTreatments([]);
            setCurrentSubTreatment('');
            setOriginalSubTreatments([]);
            
            // Show appropriate messages
            const messages: string[] = [];
            const errorMessages: string[] = [];
            
            // Count successful deletions
            const successfulDeletions = deleteResults.filter(r => r && r.success).length;
            const failedDeletions = deleteErrors.length;
            
            if (failedDeletions > 0) {
              errorMessages.push(`${failedDeletions} deletion(s) failed`);
            }
            if (successfulDeletions > 0) {
              messages.push(`${successfulDeletions} sub-treatment(s) removed`);
            }
            
            // Count successful additions
            const successfulAdditions = addResults.filter(r => r && !r.error).length;
            const failedAdditions = addErrors.length;
            
            if (failedAdditions > 0) {
              errorMessages.push(`${failedAdditions} addition(s) failed`);
            }
            if (successfulAdditions > 0) {
              messages.push(`${successfulAdditions} sub-treatment(s) added`);
            }
            
            if (errorMessages.length > 0 && messages.length > 0) {
              showToast(`${messages.join(', ')}. ${errorMessages.join(', ')}`, 'warning');
            } else if (errorMessages.length > 0) {
              showToast(`Update completed with errors: ${errorMessages.join(', ')}`, 'warning');
            } else if (messages.length > 0) {
              showToast(messages.join(', '), 'success');
            } else {
              showToast('Update completed', 'success');
            }
            
            setEditingTreatment(null);
            setSelectedMainTreatment('');
          } catch (err: any) {
            // This should rarely happen now, but handle it just in case
            console.error('Unexpected error during update:', err);
            const message = err.response?.data?.message || 'Failed to update sub-treatments';
            showToast(message, 'error');
            // Still refresh and reset form
            await fetchTreatments();
            setEditingTreatment(null);
            setSelectedMainTreatment('');
            setAddedSubTreatments([]);
            setCurrentSubTreatment('');
            setOriginalSubTreatments([]);
            setLoading(false);
            return;
          }
        } else {
          // Not editing - just add new sub-treatments
          if (subTreatmentValues.length > 0) {
            const mainTreatment = treatments.find(t => t._id === mainTreatmentId);
            const existingSubNames = mainTreatment?.subcategories?.map(st => st.name.toLowerCase().trim()) || [];
            
            // Filter out existing sub-treatments (only add new ones)
            const newSubTreatments = subTreatmentValues.filter(subName => {
              const normalized = subName.toLowerCase();
              return !existingSubNames.includes(normalized);
            });

            if (newSubTreatments.length === 0) {
              showToast('All sub-treatments already exist for this treatment', 'info');
              setLoading(false);
              return;
            }

            // Batch add only new sub-treatments
            const subTreatmentPromises = newSubTreatments.map(subName => 
              axios.post('/api/admin/addSubTreatment', {
                mainTreatmentId: mainTreatmentId,
                subTreatmentName: subName,
                subTreatmentSlug: subName.toLowerCase().replace(/\s+/g, '-'),
              }, {
                headers: { Authorization: `Bearer ${token}` }
              })
            );

            try {
              await Promise.all(subTreatmentPromises);
              // Reset sub-treatment chips
              setAddedSubTreatments([]);
              setCurrentSubTreatment('');
              await fetchTreatments();
              showToast('Treatment(s) added successfully', 'success');
            } catch (err: any) {
              const message = err.response?.data?.message || 'Failed to add sub-treatment(s)';
              showToast(message, 'error');
            }
          } else {
            showToast('Treatment(s) added successfully', 'success');
          }
        }
      }

      // Reset form if not editing
      if (!editingTreatment) {
        setNewMainTreatment('');
        setSelectedMainTreatment('');
        setAddedSubTreatments([]);
        setCurrentSubTreatment('');
      } else {
        handleCancelEdit();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to add treatment';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalSubTreatments = treatments.reduce((total, treatment) => total + (treatment.subcategories?.length || 0), 0);
  const treatmentsWithSub = treatments.filter((treatment) => (treatment.subcategories?.length || 0) > 0).length;
  const subCoveragePercent = treatments.length
    ? Math.round((treatmentsWithSub / treatments.length) * 100)
    : 0;
  const avgSubsPerMain = treatments.length
    ? parseFloat((totalSubTreatments / treatments.length).toFixed(1))
    : 0;
  const topTreatments = [...treatments]
    .map((treatment) => ({
      ...treatment,
      subCount: treatment.subcategories?.length || 0,
    }))
    .sort((a, b) => b.subCount - a.subCount)
    .slice(0, 5);
  // const maxSubCount = Math.max(...topTreatments.map((t) => t.subCount), 1); // Reserved for future use

  // Show access denied only when agent has NO permissions at all for this module
  if (
    !isAdmin &&
    isAgent &&
    !permissionsLoading &&
    agentPermissions &&
    !agentPermissions.canAll &&
    !agentPermissions.canRead &&
    !agentPermissions.canCreate &&
    !agentPermissions.canUpdate &&
    !agentPermissions.canDelete &&
    !agentPermissions.canApprove &&
    !agentPermissions.canPrint &&
    !agentPermissions.canExport
  ) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Access Denied</h2>
          <p className="text-sm text-blue-700">
            You do not have permission to view treatments.
          </p>
        </div>
      </div>
    );
  }

  if (fetching && treatments.length === 0) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-3 text-sm text-blue-700">Loading...</p>
        </div>
      </div>
    );
  }

 return (
    <div className="min-h-screen bg-blue-50 p-4 sm:p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="max-w-6xl mx-auto sm:pt-1 lg:pt-1 space-y-4">
        {/* Compact Header */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-800 p-2 rounded-lg">
                <BeakerIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-blue-800">Treatment Management</h1>
                <p className="text-xs text-blue-600">Add and manage treatments</p>
              </div>
            </div>
            {/* <button
              onClick={fetchTreatments}
              disabled={fetching}
              className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {fetching ? 'Loading...' : 'Refresh'}
            </button> */}
          </div>
        </div>

         {/* Compact Stats - hidden for read-only agents */}
         {(!isAgentReadOnly || isAdmin) && (
           <div className="grid grid-cols-3 gap-3">
             <div className="bg-white rounded-lg border border-blue-200 p-3">
               <p className="text-xs text-blue-700 mb-1">Main</p>
               <p className="text-xl font-bold text-blue-800">{treatments.length}</p>
             </div>
             <div className="bg-white rounded-lg border border-blue-200 p-3">
               <p className="text-xs text-blue-700 mb-1">Sub</p>
               <p className="text-xl font-bold text-blue-800">{totalSubTreatments}</p>
             </div>
             <div className="bg-white rounded-lg border border-blue-200 p-3">
               <p className="text-xs text-blue-700 mb-1">Total</p>
               <p className="text-xl font-bold text-blue-800">{treatments.length + totalSubTreatments}</p>
             </div>
           </div>
         )}

     

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Add Treatment Form */}
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-blue-900">
                {editingTreatment ? 'Edit Treatment' : 'Add Treatment'}
              </h2>
              {editingTreatment && (
                <button
                  onClick={handleCancelEdit}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Show Access Denied if agent/doctorStaff doesn't have create permission */}
            {hasNoCreatePermission ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-blue-900 mb-2">Access Denied</h3>
                <p className="text-sm text-blue-700 text-center">
                  You do not have permission to create treatments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Main Treatment */}
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1.5">
                    Main Treatment
                  </label>
              
                  {/* Main treatment selection dropdown */}
                  <select
                    value={selectedMainTreatment}
                    onChange={(e) => handleMainTreatmentSelect(e.target.value)}
                    disabled={!!editingTreatment}
                    className="w-full mt-3 px-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Select main treatment</option>
                    {treatments.map((treatment) => (
                      <option key={treatment._id} value={treatment._id}>
                        {treatment.name}
                      </option>
                    ))}
                  </select>
                  {editingTreatment && (
                    <div className="mt-2 px-3 py-1.5 text-sm bg-blue-50 border border-blue-300 rounded-lg text-blue-900">
                      {editingTreatment.name}
                    </div>
                  )}
                  {!editingTreatment && (
                    <input
                      type="text"
                      value={newMainTreatment}
                      onChange={(e) => {
                        // setIsFromDropdown(false); // Reserved for future use
                        setNewMainTreatment(e.target.value);
                      }}
                      placeholder="Enter name"
                      className="w-full px-3 mt-2 py-1.5 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                  )}
                  {/* Custom Main Treatments Boxes */}
                  {customMainTreatments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customMainTreatments.map((custom) => (
                        <div
                          key={custom.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 border border-blue-300 rounded-lg text-sm text-blue-900"
                        >
                          <span>{custom.name}</span>
                          <button
                            onClick={() => handleRemoveCustomMainTreatment(custom.id)}
                            className="text-blue-500 hover:text-red-600 transition-colors"
                            aria-label="Remove"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-blue-200 pt-4">
                  <label className="block text-xs font-medium text-blue-700 mb-1.5">
                    Sub-Treatment
                  </label>
                  
                  {/* Sub-treatment selection dropdown */}
                  {selectedMainTreatment && availableSubTreatments.length > 0 && !editingTreatment && (
                    <select
                      onChange={(e) => handleSubTreatmentSelect(e.target.value)}
                      className="w-full mb-2 px-3 py-1.5 text-sm border border-blue-300 rounded-lg bg-white text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    >
                      <option value="">Select sub-treatment</option>
                      {availableSubTreatments.map((sub, index) => (
                        <option key={index} value={sub.name}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Single Sub-Treatment Input with icon inside */}
                  <div className="relative">
                    <input
                      type="text"
                      value={currentSubTreatment}
                      onChange={(e) => setCurrentSubTreatment(e.target.value)}
                      onKeyPress={handleSubTreatmentKeyPress}
                      placeholder="Enter sub-treatment name"
                      className="w-full px-3 py-1.5 pr-8 text-sm border border-blue-300 rounded-lg text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-800"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {currentSubTreatment.trim() && (
                        <button
                          onClick={() => setCurrentSubTreatment('')}
                          className="text-gray-400 hover:text-red-600 transition-colors p-0.5"
                          title="Clear"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={handleAddSubTreatmentToChips}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-0.5"
                        title="Add sub-treatment"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Added Sub-Treatment Chips */}
                  {addedSubTreatments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {addedSubTreatments.map((chip) => (
                        <div
                          key={chip.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 border border-blue-300 rounded text-xs text-blue-900"
                        >
                          <span>{chip.name}</span>
                          <button
                            onClick={() => handleRemoveSubTreatmentChip(chip.id)}
                            className="text-red-500 hover:text-red-700 transition-colors ml-0.5"
                            aria-label="Remove"
                            title="Remove"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Custom Sub-Treatments Boxes */}
                  {customSubTreatments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {customSubTreatments.map((custom) => (
                        <div
                          key={custom.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 border border-blue-300 rounded-lg text-sm text-blue-900"
                        >
                          <span>{custom.name}</span>
                          <button
                            onClick={() => handleRemoveCustomSubTreatment(custom.id)}
                            className="text-blue-500 hover:text-red-600 transition-colors"
                            aria-label="Remove"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Single Add Button for Both */}
                  {(isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canCreate || agentPermissions.canAll))) && (
                    <button
                      onClick={handleAddBoth}
                      disabled={loading || (!newMainTreatment.trim() && addedSubTreatments.length === 0)}
                      className="w-full mt-4 px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (editingTreatment ? 'Updating...' : 'Adding...') : (editingTreatment ? 'Update Treatment' : 'Add Treatment')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

           {/* Treatment List - hidden for read-only agents */}
           {(!isAgentReadOnly || isAdmin) && (
             <div className="bg-white rounded-lg border border-blue-200 p-4">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm font-semibold text-blue-900">All Treatments</h2>
                 <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                   {treatments.length}
                 </span>
               </div>

               <div className="max-h-[500px] overflow-y-auto space-y-2">
                 {treatments.length === 0 ? (
                   <div className="text-center py-8">
                     <BeakerIcon className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                     <p className="text-xs text-blue-700">No treatments yet</p>
                   </div>
                 ) : (
                   treatments.map((treatment, index) => {
                     const canDelete = isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canDelete || agentPermissions.canAll));
                     
                     return (
                       <div
                         key={treatment._id}
                         className="bg-blue-50 rounded-lg p-3 border border-blue-200 hover:border-blue-300 transition-colors"
                       >
                         <div className="flex items-start justify-between gap-2">
                           <div className="flex items-start gap-2 flex-1 min-w-0">
                             <span className="text-xs text-blue-700 font-medium pt-0.5">
                               {index + 1}.
                             </span>
                             <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-medium text-blue-900 mb-1">
                                 {treatment.name}
                               </h4>
                               {treatment.subcategories && treatment.subcategories.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-1.5">
                                   {treatment.subcategories.map((sub, subIndex) => (
                                     <span
                                       key={subIndex}
                                       className="text-xs text-blue-700 bg-white border border-blue-300 px-2 py-0.5 rounded"
                                     >
                                       {sub.name}
                                     </span>
                                   ))}
                                 </div>
                               )}
                             </div>
                           </div>
                           <div className="flex items-center gap-1 flex-shrink-0">
                             {(isAdmin || (isAgent && !permissionsLoading && agentPermissions && (agentPermissions.canUpdate || agentPermissions.canAll))) && (
                               <button
                                 onClick={() => handleEditTreatment(treatment)}
                                 className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded transition-colors"
                                 title="Edit"
                               >
                                 <PencilSquareIcon className="w-4 h-4" />
                               </button>
                             )}
                             {canDelete && (
                               <button
                                 onClick={() => handleDeleteClick(treatment._id, treatment.name)}
                                 className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                                 title="Delete"
                               >
                                 <TrashIcon className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                         </div>
                       </div>
                     );
                   })
                 )}
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Compact Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          />
          
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-blue-900 mb-1">
                Delete Treatment?
              </h3>
              <p className="text-xs text-blue-700 mb-3">
                This action cannot be undone.
              </p>
              <div className="bg-blue-50 rounded px-3 py-2">
                <p className="text-sm font-medium text-blue-900">
                  &quot;{treatmentToDelete?.name}&quot;
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
 {/* Graphical Overview */}
      <div className="bg-white rounded-lg mt-5 border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-blue-900">Treatment Distribution</p>
              <p className="text-xs text-blue-600">Share of sub-treatments by top mains</p>
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
              {totalSubTreatments} sub treatments
            </span>
          </div>
          {topTreatments.length === 0 || totalSubTreatments === 0 ? (
            <div className="py-6 text-center text-xs text-blue-500">No data yet</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative flex items-center justify-center">
                <svg viewBox="0 0 220 220" className="w-48 h-48">
                  <defs>
                    <radialGradient id="innerCircle" cx="50%" cy="50%" r="50%">
                      <stop offset="70%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </radialGradient>
                    <linearGradient id="donutColor1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="donutColor2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                    <linearGradient id="donutColor3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="donutColor4" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="donutColor5" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  {topTreatments.reduce(
                    (segments: { paths: React.ReactElement[]; currentAngle: number }, treatment, index) => {
                      const fraction = (treatment.subCount || 0) / totalSubTreatments;
                      const startAngle = segments.currentAngle;
                      const endAngle = startAngle + fraction * Math.PI * 2;
                      const largeArcFlag = fraction > 0.5 ? 1 : 0;
                      const radiusOuter = 90;
                      const radiusInner = 45;
                      const startOuterX = 110 + radiusOuter * Math.cos(startAngle);
                      const startOuterY = 110 + radiusOuter * Math.sin(startAngle);
                      const endOuterX = 110 + radiusOuter * Math.cos(endAngle);
                      const endOuterY = 110 + radiusOuter * Math.sin(endAngle);
                      const startInnerX = 110 + radiusInner * Math.cos(endAngle);
                      const startInnerY = 110 + radiusInner * Math.sin(endAngle);
                      const endInnerX = 110 + radiusInner * Math.cos(startAngle);
                      const endInnerY = 110 + radiusInner * Math.sin(startAngle);

                      segments.paths.push(
                        <path
                          key={treatment._id}
                          d={`M ${startOuterX} ${startOuterY} A ${radiusOuter} ${radiusOuter} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY} L ${startInnerX} ${startInnerY} A ${radiusInner} ${radiusInner} 0 ${largeArcFlag} 0 ${endInnerX} ${endInnerY} Z`}
                          fill={`url(#donutColor${(index % 5) + 1})`}
                          className="shadow-sm"
                        />
                      );

                      segments.currentAngle = endAngle;
                      return segments;
                    },
                    { paths: [] as React.ReactElement[], currentAngle: -Math.PI / 2 }
                  ).paths}
                  <circle cx="110" cy="110" r="40" fill="url(#innerCircle)" />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xs text-white">Total</p>
                  <p className="text-lg font-semibold text-white">{totalSubTreatments}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {topTreatments.map((treatment, index) => {
                  const percent = ((treatment.subCount / totalSubTreatments) * 100).toFixed(1);
                  const legendColors = [
                    "text-pink-500",
                    "text-orange-500",
                    "text-yellow-500",
                    "text-green-500",
                    "text-blue-500",
                  ];
                  return (
                    <div
                      key={treatment._id}
                      className="flex items-center justify-between border border-blue-100 rounded-lg px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${legendColors[index % legendColors.length]}`}>
                          {percent}%
                        </span>
                        <span className="font-medium text-blue-900 truncate">{treatment.name}</span>
                      </div>
                      <span className="text-blue-500 font-semibold">{treatment.subCount} sub</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-blue-600">
            <span>Main with sub treatments: {treatmentsWithSub}</span>
            <span>
              Avg sub/main:{" "}
              {treatments.length ? (totalSubTreatments / treatments.length).toFixed(1) : "0.0"}
            </span>
          </div>
        </div> 

 {/* Coverage & Activity Visualization */}
         <div className="grid grid-cols-1 mt-5 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-blue-200 p-4 flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center relative"
              style={{
                background: `conic-gradient(#3b82f6 ${subCoveragePercent}%, #e5e7eb ${subCoveragePercent}% 100%)`,
              }}
            >
              <div className="absolute w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-800">
                  {subCoveragePercent}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Coverage</p>
              <p className="text-xs text-blue-600 mb-2">
                Main treatments with at least one sub-treatment
              </p>
              <p className="text-sm text-blue-700">
                {treatmentsWithSub} of {treatments.length || 0} mains
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-blue-200 p-4 flex items-center gap-4">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center relative"
              style={{
                background: `conic-gradient(#3b82f6 ${Math.min(
                  (avgSubsPerMain / 5) * 100,
                  100
                )}%, #e5e7eb ${Math.min((avgSubsPerMain / 5) * 100, 100)}% 100%)`,
              }}
            >
              <div className="absolute w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-900">
                  {avgSubsPerMain}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Avg. Sub Count</p>
              <p className="text-xs text-blue-600 mb-2">
                Average sub-treatments per main (target 5+)
              </p>
              <p className="text-sm text-blue-700">
                {totalSubTreatments} subs / {treatments.length || 0} mains
              </p>
            </div>
          </div>
        </div> 


    </div>
);
};

AddTreatment.getLayout = function PageLayout(page: React.ReactNode) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedDashboard: NextPageWithLayout = withAdminAuth(AddTreatment);
ProtectedDashboard.getLayout = AddTreatment.getLayout;

export default ProtectedDashboard;
