import { useState } from "react";
import { X, Zap, ChevronDown, FileText, Activity, Layers } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { useRouter } from "next/router";

interface AddWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowCreated: () => void;
}

const AddWorkflow: React.FC<AddWorkflowProps> = ({
  isOpen,
  onClose,
  onWorkflowCreated,
}) => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [entity, setEntity] = useState("Lead");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getTokenByPath();
      const response = await axios.post(
        "/api/workflows",
        {
          name,
          description,
          entity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data.success) {
        const workflow = response?.data?.data;
        onWorkflowCreated();
        setName("");
        setDescription("");
        setEntity("Lead");
        router.push(`/clinic/automation/${workflow._id}`);
      } else {
        setError(response.data.message || "An unknown error occurred.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "An error occurred while creating the workflow.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">New Workflow</h3>
              <p className="text-blue-100 text-xs font-medium opacity-80">
                Design your automation sequence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Workflow Name */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <FileText className="w-4 h-4 text-blue-500" />
                Workflow Name
              </label>
              <span className="text-xs font-medium text-gray-400">
                {name.length} / 30
              </span>
            </div>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Patient Follow-up Reminders"
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-600 placeholder:text-gray-400 font-medium"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Activity className="w-4 h-4 text-indigo-500" />
                Description
              </label>
              <span className="text-xs font-medium text-gray-400">
                {description.length} / 50
              </span>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this workflow do?"
              maxLength={50}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all h-24 resize-none text-gray-600 placeholder:text-gray-400 font-medium"
            />
          </div>

          {/* Entity Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Layers className="w-4 h-4 text-emerald-500" />
              Target Entity
            </label>
            <div className="relative group">
              <select
                id="entity"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="w-full appearance-none bg-gray-50 text-gray-600 px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold cursor-pointer"
              >
                <option value="Lead">Lead</option>
                <option value="Patient">Patient</option>
                <option value="Appointment">Appointment</option>
                <option value="Webhook">Webhook</option>
                <option value="Message">Message</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-[10px] text-gray-400 font-medium px-1">
              This determines the base data available in your workflow.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 animate-pulse">
              <Activity className="w-4 h-4 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white/20" />
                  Create Workflow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkflow;
