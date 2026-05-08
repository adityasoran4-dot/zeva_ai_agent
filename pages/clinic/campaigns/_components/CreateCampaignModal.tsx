import React, { useState } from "react";
import { X, Megaphone } from "lucide-react";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCampaign: (campaignData: {
    name: string;
    description: string;
    type: "whatsapp" | "sms" | "email";
  }) => void;
  loading?: boolean;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreateCampaign,
  loading = false,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [campaignType, setCampaignType] = useState<
    "whatsapp" | "sms" | "email"
  >("whatsapp");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateCampaign({
      name: name.trim(),
      description: description.trim(),
      type: campaignType,
    });

    // Reset form
    setName("");
    setDescription("");
    setCampaignType("whatsapp");
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setCampaignType("whatsapp");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Create New Campaign
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Set up a new marketing campaign to engage your audience
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campaign Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Campaign Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    value: "whatsapp" as const,
                    label: "WhatsApp",
                    icon: "💬",
                    color: "green",
                  },
                  // {
                  //   value: "sms" as const,
                  //   label: "SMS",
                  //   icon: "📱",
                  //   color: "blue",
                  // },
                  // {
                  //   value: "email" as const,
                  //   label: "Email",
                  //   icon: "📧",
                  //   color: "purple",
                  // },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCampaignType(type.value)}
                    className={`px-3 py-3 rounded-lg border-2 transition-all text-center ${
                      campaignType === type.value
                        ? type.color === "green"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : type.color === "blue"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl mb-1">{type.icon}</div>
                    <div className="text-xs font-bold">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter campaign name (e.g., Summer Health Checkup 2024)"
                className="w-full px-4 py-3 text-sm border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
                required
              />
            </div>

            {/* Campaign Description Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter campaign description (e.g., Promote summer health checkup packages to existing patients)"
                rows={4}
                className="w-full px-4 py-3 text-sm border border-gray-300 text-gray-600 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-t-gray-200 bg-gray-50 px-4 py-3 flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              loading || !name.trim()
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-900"
            }`}
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
              "Create Campaign"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignModal;
