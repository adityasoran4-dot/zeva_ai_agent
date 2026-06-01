"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import useClinicBranches from "@/hooks/useClinicBranches";
import useClinicDoctors from "@/hooks/useClinicDoctors";
import { getTokenByPath } from "@/lib/helper";
import { PlusCircle, X, Plus, Trash2 } from "lucide-react";
import useUoms from "@/hooks/useUoms";
import useStockItems from "@/hooks/useStockItems";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface ConsumptionItem {
  itemId?: string;
  code?: string;
  name: string;
  description: string;
  quantity: number;
  uom: string;
}

const AddConsumptionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { clinicBranches } = useClinicBranches();
  const { stockItems } = useStockItems();
  const token = getTokenByPath() || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
    doctor: "",
    room: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { doctors, loading: doctorsLoading } = useClinicDoctors(
    formData?.branch,
  );

  const { uoms, loading: uomsLoading } = useUoms({
    token,
    branchId: formData.branch,
  });

  // Items state
  const [items, setItems] = useState<ConsumptionItem[]>([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState<ConsumptionItem>({
    code: "",
    itemId: "",
    name: "",
    description: "",
    quantity: 1,
    uom: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        branch: "",
        doctor: "",
        room: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setItems([]);
      setCurrentItem({
        name: "",
        description: "",
        quantity: 1,
        uom: "",
      });
      setError(null);
    }
  }, [isOpen]);

  // Fetch rooms and UOMs when branch is selected
  useEffect(() => {
    if (formData.branch) {
      fetchRooms();
    } else {
      setRooms([]);
    }
  }, [formData.branch]);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await axios.get(
        `/api/clinic/rooms?branchId=${formData.branch}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRooms(res.data?.rooms || []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCurrentItemChange = (
    field: keyof ConsumptionItem,
    value: any,
  ) => {
    if (field === "itemId") {
      const item = stockItems.find((i) => i._id === value);
      const selectedUOM = uoms.find((u) => u?.name === item?.level0?.uom);
      if (item) {
        setCurrentItem((prev) => ({
          ...prev,
          code: item.code,
          name: item.name,
          uom: selectedUOM ? selectedUOM.name : "",
        }));
      }
    }
    setCurrentItem((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addCurrentItem = () => {
    if (!currentItem.name.trim()) {
      setError("Please select an item");
      return;
    }

    if (!currentItem.quantity || currentItem.quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (!currentItem.uom?.trim()) {
      setError("Please select a UOM");
      return;
    }

    setItems([...items, { ...currentItem }]);
    // Reset current item
    setCurrentItem({
      itemId: "",
      code: "",
      name: "",
      description: "",
      quantity: 1,
      uom: "",
    });
    setError(null);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const resetItems = () => {
    setItems([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.branch ||
      !formData.doctor ||
      !formData.room ||
      !formData.date
    ) {
      setError("Branch, doctor, room, and date are required");
      return;
    }

    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "/api/stocks/material-consumptions/add",
        {
          ...formData,
          items,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        onSuccess(res.data.data);
        handleClose();
      } else {
        setError(res.data?.message || "Failed to create consumption");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error creating material consumption",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      branch: "",
      doctor: "",
      room: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setItems([]);
    setCurrentItem({
      name: "",
      description: "",
      quantity: 1,
      uom: "",
    });
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                New Material Consumption
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Record material consumption for treatment
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Branch</option>
                  {clinicBranches.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctorsLoading ? (
                    <option value="">Loading doctors...</option>
                  ) : (
                    doctors.map((d: any) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Room <span className="text-red-500">*</span>
                </label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleFormChange}
                  disabled={!formData.branch || roomsLoading}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {roomsLoading ? "Loading rooms..." : "Select Room"}
                  </option>
                  {rooms.map((r: any) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                placeholder="Enter any additional notes"
                rows={3}
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all"
              />
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Consumed Items <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Add items consumed during treatment
                  </p>
                </div>
              </div>

              {/* Item Form */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Item Name */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentItem.itemId || ""}
                      onChange={(e) =>
                        handleCurrentItemChange("itemId", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all h-10"
                      required
                    >
                      <option value="">Select an Item</option>
                      {stockItems.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Item Description
                    </label>
                    <input
                      type="text"
                      value={currentItem.description || ""}
                      onChange={(e) =>
                        handleCurrentItemChange("description", e.target.value)
                      }
                      placeholder="Description"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all h-10"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "quantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all h-10"
                      placeholder="Qty"
                      required
                    />
                  </div>

                  {/* UOM */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      UOM <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentItem.uom || ""}
                      onChange={(e) =>
                        handleCurrentItemChange("uom", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all h-10"
                      required
                    >
                      <option value="">Select UOM</option>
                      {uomsLoading ? (
                        <option value="">Loading UOMs...</option>
                      ) : uoms.length > 0 ? (
                        uoms.map((uom: any) => (
                          <option key={uom._id} value={uom.name}>
                            {uom.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No UOMs available</option>
                      )}
                    </select>
                  </div>

                  {/* Add Item Button */}
                  <div className="sm:col-span-12 flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={resetItems}
                      disabled={items.length === 0}
                      className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50"
                    >
                      Reset Items
                    </button>
                    <button
                      type="button"
                      onClick={addCurrentItem}
                      disabled={
                        !currentItem.name?.trim() ||
                        !currentItem.quantity ||
                        !currentItem.uom?.trim()
                      }
                      className="px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          SI No
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          UOM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-8 text-sm text-center text-gray-500"
                          >
                            No Items Added
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                              {item.name}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.description || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.uom}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {items.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-2 text-sm font-bold text-gray-900 text-right"
                          >
                            Total Items:
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {items.reduce(
                              (sum, item) => sum + (item.quantity || 0),
                              0,
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {items.length}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={
              loading ||
              !formData.branch ||
              !formData.doctor ||
              !formData.room ||
              items.length === 0
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Create Consumption
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddConsumptionModal;
