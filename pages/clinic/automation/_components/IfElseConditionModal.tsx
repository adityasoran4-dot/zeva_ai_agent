import React, { useEffect, useState, useCallback } from "react";
import { X, Split, Save, Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import VariableMappingSelect from "./VariableMappingSelect";
import { WorkflowEntity } from "@/types/workflows";

interface Condition {
  conditionType: "and" | "or";
  field: string;
  operator: string;
  value: any;
}

interface IfElseConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conditionId: string | null;
  onUpdate: (updatedCondition: any) => void;
  entity?: WorkflowEntity;
}

const operators = [
  { label: "Equals", value: "equal" },
  { label: "Does not equal", value: "not_equal" },
  { label: "Contains", value: "contains" },
  { label: "Does not contain", value: "not_contains" },
  { label: "Exists", value: "exists" },
  { label: "Does not exist", value: "not_exists" },
  { label: "Is empty", value: "is_empty" },
  { label: "Is not empty", value: "is_not_empty" },
  { label: "Starts with", value: "starts_with" },
  { label: "Does not start with", value: "not_starts_with" },
  { label: "Ends with", value: "ends_with" },
  { label: "Does not end with", value: "not_ends_with" },
  { label: "Less than", value: "less_than" },
  { label: "Greater than", value: "greater_than" },
  { label: "Less than or equal", value: "less_than_or_equal" },
  { label: "Greater than or equal", value: "greater_than_or_equal" },
];

const IfElseConditionModal: React.FC<IfElseConditionModalProps> = ({
  isOpen,
  onClose,
  conditionId,
  onUpdate,
  entity = "Lead",
}) => {
  const [conditions, setConditions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCondition = useCallback(async () => {
    if (!conditionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.get(
        `/api/workflows/conditions/update/${conditionId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (data.success) {
        setConditions(data.data.conditions || []);
      }
    } catch (err: any) {
      console.error("Error fetching if-else condition:", err);
      setError("Failed to load condition details.");
    } finally {
      setIsLoading(false);
    }
  }, [conditionId]);

  useEffect(() => {
    if (isOpen && conditionId) {
      fetchCondition();
    }
  }, [isOpen, conditionId, fetchCondition]);

  const handleSave = async () => {
    if (!conditionId) return;
    setIsSaving(true);
    setError(null);
    try {
      const token = getTokenByPath();
      const { data } = await axios.put(
        `/api/workflows/conditions/update/${conditionId}`,
        { type: "if_else", conditions },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data.success) {
        onUpdate(data.data);
        onClose();
      }
    } catch (err: any) {
      console.error("Error saving if-else condition:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const addConditionGroup = () => {
    setConditions([...conditions, { andConditions: [], orConditions: [] }]);
  };

  const removeConditionGroup = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addSubCondition = (
    groupIndex: number,
    type: "andConditions" | "orConditions",
  ) => {
    const newConditions = [...conditions];
    newConditions[groupIndex][type].push({
      conditionType: type === "andConditions" ? "and" : "or",
      field: "",
      operator: "equal",
      value: "",
    });
    setConditions(newConditions);
  };

  const removeSubCondition = (
    groupIndex: number,
    type: "andConditions" | "orConditions",
    subIndex: number,
  ) => {
    const newConditions = [...conditions];
    newConditions[groupIndex][type].splice(subIndex, 1);
    setConditions(newConditions);
  };

  const updateSubCondition = (
    groupIndex: number,
    type: "andConditions" | "orConditions",
    subIndex: number,
    field: keyof Condition,
    value: any,
  ) => {
    const newConditions = [...conditions];
    newConditions[groupIndex][type][subIndex][field] = value;
    setConditions(newConditions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end text-gray-500">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Content */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Split className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                If/Else Conditions
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Branch your workflow logic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Loading settings...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700">
                  Logic Groups
                </h4>
                <button
                  onClick={addConditionGroup}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Group
                </button>
              </div>

              {conditions.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                  <p className="text-xs text-gray-400 font-medium italic">
                    No logic configured. Click "Add Group" to define branching.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {conditions.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl relative group"
                    >
                      <button
                        onClick={() => removeConditionGroup(gIdx)}
                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-100 rounded-lg text-gray-300 hover:text-red-500 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* AND Conditions */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                            AND (Must meet all)
                          </span>
                          <button
                            onClick={() =>
                              addSubCondition(gIdx, "andConditions")
                            }
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Rule
                          </button>
                        </div>
                        {group.andConditions.map((rule: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-4">
                              <VariableMappingSelect
                                placeholder="Select Field"
                                value={rule.field}
                                onChange={(val) =>
                                  updateSubCondition(
                                    gIdx,
                                    "andConditions",
                                    sIdx,
                                    "field",
                                    val,
                                  )
                                }
                                entity={entity}
                                nodeId={conditionId as string}
                              />
                            </div>
                            <div className="col-span-3">
                              <select
                                value={rule.operator}
                                onChange={(e) =>
                                  updateSubCondition(
                                    gIdx,
                                    "andConditions",
                                    sIdx,
                                    "operator",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                              >
                                {operators.map((op) => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-4">
                              <input
                                placeholder="Value"
                                value={rule.value}
                                onChange={(e) =>
                                  updateSubCondition(
                                    gIdx,
                                    "andConditions",
                                    sIdx,
                                    "value",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                onClick={() =>
                                  removeSubCondition(
                                    gIdx,
                                    "andConditions",
                                    sIdx,
                                  )
                                }
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* OR Conditions */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">
                            OR (Must meet any)
                          </span>
                          <button
                            onClick={() =>
                              addSubCondition(gIdx, "orConditions")
                            }
                            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Rule
                          </button>
                        </div>
                        {group.orConditions.map((rule: any, sIdx: number) => (
                          <div
                            key={sIdx}
                            className="grid grid-cols-12 gap-2 items-center"
                          >
                            <div className="col-span-4">
                              <VariableMappingSelect
                                placeholder="Select Field"
                                value={rule.field}
                                onChange={(val) =>
                                  updateSubCondition(
                                    gIdx,
                                    "orConditions",
                                    sIdx,
                                    "field",
                                    val,
                                  )
                                }
                                entity={entity}
                                nodeId={conditionId as string}
                              />
                            </div>
                            <div className="col-span-3">
                              <select
                                value={rule.operator}
                                onChange={(e) =>
                                  updateSubCondition(
                                    gIdx,
                                    "orConditions",
                                    sIdx,
                                    "operator",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                              >
                                {operators.map((op) => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-4">
                              <input
                                placeholder="Value"
                                value={rule.value}
                                onChange={(e) =>
                                  updateSubCondition(
                                    gIdx,
                                    "orConditions",
                                    sIdx,
                                    "value",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button
                                onClick={() =>
                                  removeSubCondition(gIdx, "orConditions", sIdx)
                                }
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex-1 px-4 py-3 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Logic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IfElseConditionModal;
