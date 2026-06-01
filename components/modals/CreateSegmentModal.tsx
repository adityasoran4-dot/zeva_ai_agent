import axios from "axios";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (segment: any) => void;
  token: string;
}

interface Values {
  name: string;
  description: string;
}

const CreateSegmentModal: React.FC<IProps> = ({
  isOpen,
  onClose,
  onComplete,
  token,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [values, setValues] = useState<Values>({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  const resetModal = () => {
    setValues({ name: "", description: "" });
    setLoading(false);
  };

  const handleCreateSegment = async () => {
    if (!values?.name?.trim()) {
      toast.error("Segment name is required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        "/api/segments/create-segment",
        {
          name: values.name.trim(),
          description: values.description?.trim() || "",
          leads: [], // Empty array as per API requirement
          status: "active", // Default status
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Changed from multipart/form-data
          },
        }
      );

      if (data && data?.success) {
        toast.success("Segment created successfully");
        if (onComplete) onComplete(data?.segment || null);
        onClose(); // Close modal after successful creation
      } else {
        toast.error(data?.message || "Failed to create segment");
      }
    } catch (error: any) {
      console.log("Error in create segment: ", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create segment"
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header - Dark Theme */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Create New Segment
            </h2>
            <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
              Organize your leads into meaningful groups for better management
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-bold text-blue-800 mb-1">
                    What is a Segment?
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Segments help you organize leads into groups for targeted
                    follow-ups, campaigns, and analysis. You can add leads to
                    segments later.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Segment Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900">
                    Segment Name *
                  </label>
                  <span className="text-xs text-gray-500">
                    {values?.name?.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  value={values.name}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      name: e.target.value.slice(0, 50),
                    }))
                  }
                  placeholder="e.g., High Priority Leads, Follow-up Required, New Enquiries"
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  maxLength={50}
                  autoFocus
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Choose a descriptive name that helps identify the segment
                  purpose
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900">
                    Description
                  </label>
                  <span className="text-xs text-gray-500">
                    {values?.description?.length || 0}/200
                  </span>
                </div>
                <textarea
                  value={values?.description}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      description: e.target.value.slice(0, 200),
                    }))
                  }
                  placeholder="Describe what this segment is for, what type of leads should be included, etc."
                  rows={4}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  maxLength={200}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Optional. Helps team members understand the segment criteria
                </p>
              </div>

              {/* Example Segments */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  💡 Example Segments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValues({
                        name: "High Priority",
                        description: "Leads requiring immediate follow-up",
                      });
                    }}
                    disabled={loading}
                    className="text-left p-3 bg-white rounded border border-gray-300 hover:border-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      High Priority
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Immediate follow-up needed
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValues({
                        name: "Hot Leads",
                        description:
                          "Highly interested leads likely to convert",
                      });
                    }}
                    disabled={loading}
                    className="text-left p-3 bg-white rounded border border-gray-300 hover:border-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      Hot Leads
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      High conversion probability
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValues({
                        name: "Follow-up Required",
                        description: "Leads pending follow-up in next 7 days",
                      });
                    }}
                    disabled={loading}
                    className="text-left p-3 bg-white rounded border border-gray-300 hover:border-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      Follow-up Required
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Pending follow-up actions
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValues({
                        name: "New Enquiries",
                        description: "Leads received in last 24 hours",
                      });
                    }}
                    disabled={loading}
                    className="text-left p-3 bg-white rounded border border-gray-300 hover:border-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      New Enquiries
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Fresh leads to contact
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-3 flex justify-between gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateSegment}
            disabled={!values?.name?.trim() || loading}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              values?.name?.trim() && !loading
                ? "bg-gray-800 text-white hover:bg-gray-900 cursor-pointer"
                : "bg-gray-400 text-gray-700 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              "Create Segment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateSegmentModal;
