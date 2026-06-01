import React, { useState, useEffect } from "react";
import { X, Save, Zap, FileText, Activity, TriangleAlert } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import { clsx, type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface EditWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: any;
  onUpdate: (updatedWorkflow: any) => void;
}

const EditWorkflow: React.FC<EditWorkflowProps> = ({
  isOpen,
  onClose,
  workflow,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Inactive",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (workflow) {
      setForm({
        name: workflow.name || "",
        description: workflow.description || "",
        status: workflow.status || "Active",
      });
    }
  }, [workflow]);

  useEffect(() => {
    const triggerNode = workflow?.nodes?.find(
      (w: any) => w?.type === "trigger",
    );
    if (!triggerNode && form.status === "Active") {
      setError("Workflow must have a trigger node.");
      return;
    } else {
      setError("");
    }
  }, [form.status, workflow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getTokenByPath();

      const { data } = await axios.put(`/api/workflows/${workflow._id}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (error) {
      console.error("Error updating workflow:", error);
      alert("Failed to update workflow details.");
    } finally {
      setLoading(false);
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
              <h3 className="text-xl font-bold text-white">
                Workflow Settings
              </h3>
              <p className="text-blue-100 text-xs font-medium opacity-80">
                Configure your automation details
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
                {form.name.length} / 30
              </span>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter a clear name..."
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-600 placeholder:text-gray-400"
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
                {form.description.length} / 200
              </span>
            </div>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What does this workflow do?"
              maxLength={200}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all h-28 resize-none text-gray-600 placeholder:text-gray-400"
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">
              Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["Active", "Inactive"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setForm({ ...form, status })}
                  className={cn(
                    "px-4 py-3 rounded-2xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2",
                    form.status === status
                      ? status === "Active"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-gray-50 border-gray-500 text-gray-700"
                      : "bg-white border-gray-100 text-gray-400 hover:border-gray-200",
                  )}
                >
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      status === "Active" ? "bg-emerald-500" : "bg-gray-400",
                    )}
                  />
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 bg-red-50 px-3 py-2.5 rounded-md text-sm font-medium">
              <TriangleAlert className="w-5 h-5 inline-block mr-2" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (error ? true : false)}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditWorkflow;
