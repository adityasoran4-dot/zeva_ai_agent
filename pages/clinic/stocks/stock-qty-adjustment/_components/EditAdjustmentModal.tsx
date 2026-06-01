"use client";
import React, { useState, useEffect } from "react";
import { Pencil, X, Plus, Trash2, CirclePlus } from "lucide-react";
import axios from "axios";
import useClinicBranches from "@/hooks/useClinicBranches";
import { getTokenByPath } from "@/lib/helper";
import useUoms from "@/hooks/useUoms";
import useStockItems from "@/hooks/useStockItems";
import AddStockItemModal from "@/components/shared/AddStockItemModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: any | null;
}

interface AdjustmentItem {
  itemId?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  uom?: string;
  expiryDate?: string;
  costPrice: number;
  totalPrice: number;
}

const EditAdjustmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const { stockItems } = useStockItems();
  const { clinicBranches } = useClinicBranches();
  const token = getTokenByPath() || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpenAddStockItemModal, setIsOpenAddStockItemModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
    postAc: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    status: "",
  });

  const { uoms, loading: uomsLoading } = useUoms({
    token,
    branchId: formData.branch || "",
  });

  const [items, setItems] = useState<AdjustmentItem[]>([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState<AdjustmentItem>({
    code: "",
    name: "",
    description: "",
    quantity: 1,
    uom: "",
    expiryDate: "",
    costPrice: 0,
    totalPrice: 0,
  });

  // Calculate total price when quantity or cost price changes
  useEffect(() => {
    const total = currentItem.quantity * currentItem.costPrice;
    setCurrentItem((prev) => ({
      ...prev,
      totalPrice: parseFloat(total.toFixed(2)),
    }));
  }, [currentItem.quantity, currentItem.costPrice]);

  // Load record data when modal opens
  useEffect(() => {
    if (isOpen && record) {
      setFormData({
        branch: record.branch?._id || record.branch || "",
        postAc: record.postAc || "",
        date: record.date
          ? new Date(record.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: record.notes || "",
        status: record.status || "New",
      });
      setItems(
        (record.items || []).map((i: any) => ({
          code: i.code || "",
          name: i.name || "",
          description: i.description || "",
          quantity: i.quantity || 1,
          uom: i.uom || "",
          expiryDate: i.expiryDate
            ? new Date(i.expiryDate).toISOString().split("T")[0]
            : "",
          costPrice: typeof i.costPrice === "number" ? i.costPrice : 0,
          totalPrice: typeof i.totalPrice === "number" ? i.totalPrice : 0,
        })),
      );
      setError(null);
    }
  }, [isOpen, record]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        branch: "",
        postAc: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        status: "",
      });
      setItems([]);
      setCurrentItem({
        code: "",
        name: "",
        description: "",
        quantity: 1,
        uom: "",
        expiryDate: "",
        costPrice: 0,
        totalPrice: 0,
      });
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !record) return null;

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

  const handleCurrentItemChange = (field: keyof AdjustmentItem, value: any) => {
    const parsedValue =
      field === "quantity" || field === "costPrice" || field === "totalPrice"
        ? parseFloat(value) || 0
        : value;
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
      [field]: parsedValue,
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
    if (currentItem.costPrice < 0 || currentItem.totalPrice < 0) {
      setError("Please enter valid prices");
      return;
    }

    setItems([...items, { ...currentItem }]);
    // Reset current item
    setCurrentItem({
      code: "",
      name: "",
      description: "",
      quantity: 1,
      uom: "",
      expiryDate: "",
      costPrice: 0,
      totalPrice: 0,
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

    if (!formData.branch.trim()) {
      setError("Branch is required");
      return;
    }
    if (!formData.date.trim()) {
      setError("Date is required");
      return;
    }
    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put(
        `/api/stocks/stock-qty-adjustment/update/${record._id}`,
        {
          ...formData,
          items,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        onSuccess();
        handleClose();
      } else {
        setError(res.data?.message || "Failed to update adjustment");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error updating stock adjustment",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      branch: "",
      postAc: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      status: "",
    });
    setItems([]);
    setCurrentItem({
      code: "",
      name: "",
      description: "",
      quantity: 1,
      uom: "",
      expiryDate: "",
      costPrice: 0,
      totalPrice: 0,
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
            <Pencil className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit Stock Adjustment
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Update stock quantities
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
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Branch */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                >
                  <option value="">Select Branch</option>
                  {clinicBranches.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select branch for this adjustment
                </p>
              </div>

              {/* Date */}
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
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Adjustment date</p>
              </div>

              {/* Post A/c */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Post A/c <span className="text-red-500">*</span>
                </label>
                <select
                  name="postAc"
                  value={formData.postAc}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                >
                  <option value="">Select Post A/c</option>
                  {formData?.branch && (
                    <>
                      <option value="Inventory">Inventory</option>
                      <option value="Patient Debtors Control Account">
                        Patient Debtors Control Account
                      </option>
                      <option value="Insurances Control Account">
                        Insurances Control Account
                      </option>
                      <option value="Cash in hand">Cash in hand</option>
                      <option value="Card in hand">Card in hand</option>
                      <option value="Cheque Amount">Cheque Amount</option>
                      <option value="Tabby">Tabby</option>
                      <option value="Petty Cash">Petty Cash</option>
                      <option value="Rak Bank">Rak Bank</option>
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Account reference for this adjustment
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <option value="New">New</option>
                  <option value="Partly_Paid">Partly Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Current adjustment status
                </p>
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
                rows={3}
                placeholder="Enter notes here"
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional notes for this adjustment
              </p>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Adjustment Items <span className="text-red-500">*</span>
                    </h3>
                    <button
                      onClick={() => setIsOpenAddStockItemModal(true)}
                      className="flex items-center justify-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <CirclePlus size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add items to adjust stock quantities
                  </p>
                </div>
              </div>

              {/* Item Form - Compact Design */}
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
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      required
                    >
                      <option value="">Select Item</option>
                      {stockItems.map((item: any) => (
                        <option key={item._id} value={item._id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={currentItem.quantity}
                      onChange={(e) =>
                        handleCurrentItemChange("quantity", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      placeholder="Qty"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* UOM */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      UOM
                    </label>
                    <select
                      value={currentItem.uom || ""}
                      onChange={(e) =>
                        handleCurrentItemChange("uom", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                    >
                      <option value="">Select UOM</option>
                      {uomsLoading ? (
                        <option value="">Loading UOMs...</option>
                      ) : uoms.length > 0 ? (
                        uoms.map((u: any) => (
                          <option key={u._id} value={u.name}>
                            {u.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No UOMs available</option>
                      )}
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={currentItem.expiryDate || ""}
                      onChange={(e) =>
                        handleCurrentItemChange("expiryDate", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                    />
                  </div>

                  {/* Cost Price */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Cost Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={currentItem.costPrice}
                      onChange={(e) =>
                        handleCurrentItemChange("costPrice", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      placeholder="0.00"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Total Price */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Total Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentItem.totalPrice.toFixed(2)}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Description
                    </label>
                    <input
                      value={currentItem.description || ""}
                      onChange={(e) =>
                        handleCurrentItemChange("description", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      placeholder="Enter description"
                      disabled={loading}
                    />
                  </div>

                  {/* Add Item Button */}
                  <div className="sm:col-span-12 flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={resetItems}
                      disabled={loading || items.length === 0}
                      className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={addCurrentItem}
                      disabled={
                        loading ||
                        !currentItem.name.trim() ||
                        !currentItem.quantity ||
                        currentItem.costPrice === 0
                      }
                      className="inline-flex items-center px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
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
                          Code
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          UOM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Expiry
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Cost Price
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Total
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
                            colSpan={9}
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
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700">
                              {item.code || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.uom || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.expiryDate || "-"}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.costPrice.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {item.totalPrice.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-900"
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
                            colSpan={7}
                            className="px-3 py-2 text-sm font-bold text-gray-900 text-right"
                          >
                            Total:
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {items
                              .reduce((sum, item) => sum + item.totalPrice, 0)
                              .toFixed(2)}
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
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={
              loading ||
              !formData.branch.trim() ||
              !formData.date.trim() ||
              !formData.postAc.trim() ||
              items.length === 0
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                Updating...
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Update Adjustment
              </>
            )}
          </button>
        </div>

        {/* Add stock item modal */}
        <AddStockItemModal
          token={token || ""}
          clinicId={formData?.branch || ""}
          isOpen={isOpenAddStockItemModal}
          onClose={() => setIsOpenAddStockItemModal(false)}
          onSuccess={(newStockItem) => {
            // Handle successful creation
            console.log("New stock item created:", newStockItem);
          }}
        />
      </div>
    </div>
  );
};

export default EditAdjustmentModal;
