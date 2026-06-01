// components/CreateJobModal.tsx
import React, { useState } from 'react';
import JobPostingForm, { JobFormData } from './JobPostingForm';
import { jobPostingService } from '../services/jobService';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: () => void;
  canCreate: boolean;
  role?: 'clinic' | 'doctor' | 'hospital' | 'admin';
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
  canCreate,
  role = 'clinic',
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJobSubmit = async (formData: JobFormData): Promise<void> => {
    if (!canCreate) {
      toast.error("You do not have permission to create jobs");
      throw new Error("You do not have permission to create jobs");
    }

    setIsSubmitting(true);
    try {
      // Use the appropriate service method based on role
      switch (role) {
        case 'doctor':
          await jobPostingService.createDoctorJob(formData);
          break;
        case 'hospital':
          await jobPostingService.createHospitalJob(formData);
          break;
        case 'admin':
          await jobPostingService.createAdminJob(formData);
          break;
        case 'clinic':
        default:
          await jobPostingService.createClinicJob(formData);
          break;
      }
      
      toast.success("Job posted successfully!");
      
      if (onJobCreated) {
        onJobCreated();
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create job posting";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Create New Job</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content - Scrolled area */}
        <div className="flex-1 overflow-y-auto">
          <JobPostingForm
            onSubmit={handleJobSubmit}
            isSubmitting={isSubmitting}
            title="Create New Job"
            subtitle="Fill in the details to post a new job"
            isCompact={true}
          />
        </div>
      </div>
    </div>
  );
};

export default CreateJobModal;

 