"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import useClinicBranches from "@/hooks/useClinicBranches";
import { getTokenByPath } from "@/lib/helper";
import { PlusCircle, X, Plus, Trash2, ChevronDown } from "lucide-react";
import useAgents from "@/hooks/useAgents";
import useAllocatedItems from "@/hooks/useAllocatedItems";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface StockTransferItem {
  code?: string;
  itemId?: string;
  allocatedStockItemId?: string;
  name: string;
  description: string;
  quantity: number;
  uom: string;
  product?: string;
  requestedQuantity?: number;
  approvedQuantity?: number;
}

const AddStockTransferRequestModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { clinicBranches } = useClinicBranches();
  const { agents: doctors } = useAgents({ role: "doctorStaff" })?.state || {};
  const token = getTokenByPath() || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestingEmployees = [...(doctors || [])];

  // Form state
  const [formData, setFormData] = useState({
    transferType: "Internal",
    requestingBranch: "",
    fromBranch: "",
    requestingEmployee: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isAllocatedDropdownOpen, setIsAllocatedDropdownOpen] =
    useState<boolean>(false);
  const [allocatedSearch, setAllocatedSearch] = useState<string>("");
  const allocatedDropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Items state
  const [items, setItems] = useState<StockTransferItem[]>([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState<StockTransferItem>({
    code: "",
    itemId: "",
    allocatedStockItemId: "",
    name: "",
    description: "",
    quantity: 1,
    uom: "",
    requestedQuantity: 1,
  });

  // fetch allocated stock items
  const {
    allocatedItems,
    loading: fetchAllocatedItemsLoading,
    // fetchAllocatedItems,
  } = useAllocatedItems({
    // @ts-ignore
    userId: formData.requestingEmployee || "",
    search: "",
  });

  console.log({ allocatedItems });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        transferType: "Internal",
        requestingBranch: "",
        fromBranch: "",
        requestingEmployee: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setItems([]);
      setCurrentItem({
        name: "",
        description: "",
        quantity: 1,
        uom: "",
        requestedQuantity: 1,
      });
      setError(null);
    }
  }, [isOpen]);

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
    field: keyof StockTransferItem,
    value: any,
  ) => {
    // if (field === "itemId") {
    //   const item = stockItems.find((i) => i._id === value);
    //   const selectedUOM = uoms.find((u) => u?.name === item?.level0?.uom);
    //   if (item) {
    //     setCurrentItem((prev) => ({
    //       ...prev,
    //       code: item.code,
    //       name: item.name,
    //       uom: selectedUOM ? selectedUOM.name : "",
    //       allocatedStockItemId: "",
    //     }));
    //   }
    // }
    setCurrentItem((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "quantity" ? { requestedQuantity: value } : {}),
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
      name: "",
      description: "",
      quantity: 1,
      uom: "",
      requestedQuantity: 1,
    });
    setError(null);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (
      (formData?.transferType === "External" && !formData.requestingBranch) ||
      !formData.fromBranch ||
      !formData.date
    ) {
      setError("Requesting branch, from branch, and date are required");
      return;
    }

    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "/api/stocks/stock-transfer-requests/add",
        {
          ...formData,
          items: items,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data?.success) {
        onSuccess(res.data.data);
        handleClose();
      } else {
        setError(
          res.data?.message || "Failed to create stock transfer request",
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to create stock transfer request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      transferType: "Internal",
      requestingBranch: "",
      fromBranch: "",
      requestingEmployee: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setItems([]);
    setCurrentItem({
      name: "",
      description: "",
      quantity: 1,
      uom: "",
      requestedQuantity: 1,
    });
    setError(null);
    onClose();
  };

  const selectedAllocatedItem: any =
    allocatedItems.find(
      (si: any) => si._id === currentItem.allocatedStockItemId,
    ) || null;

  const availableForSelectedUom: number =
    selectedAllocatedItem?.quantitiesByUom?.find(
      (q: any) => q?.uom === currentItem.uom,
    )?.quantity ?? 0;
  const exceedsAvailable =
    !!currentItem.uom &&
    typeof currentItem.quantity === "number" &&
    currentItem.quantity > availableForSelectedUom &&
    availableForSelectedUom > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                New Stock Transfer Request
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Create a new stock transfer request
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
                  Transfer Type
                </label>
                <select
                  name="transferType"
                  value={formData.transferType}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="Internal">Internal</option>
                  <option value="External">External</option>
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

              {formData?.transferType === "External" && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Requesting Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="requestingBranch"
                    value={formData.requestingBranch}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Requesting Branch</option>
                    {clinicBranches?.map((branch: any) => (
                      <option key={branch?._id} value={branch?._id}>
                        {branch?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  From Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="fromBranch"
                  value={formData.fromBranch}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select From Branch</option>
                  {clinicBranches?.map((branch: any) => (
                    <option key={branch?._id} value={branch?._id}>
                      {branch?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Requesting Employee <span className="text-red-500">*</span>
                </label>
                <select
                  name="requestingEmployee"
                  value={formData.requestingEmployee}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select Employee</option>
                  {requestingEmployees?.map((e: any) => (
                    <option key={e?._id} value={e?._id}>
                      {e?.name} ( {e?.email || e?.phone} )
                    </option>
                  ))}
                </select>
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
            {formData?.requestingEmployee && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Transfer Items <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Add items for this transfer request
                    </p>
                  </div>
                </div>

                <div className="border border-blue-200 rounded-lg p-3 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div
                      className="sm:col-span-3 space-y-1"
                      ref={allocatedDropdownRef}
                    >
                      <label className="block text-xs font-bold text-gray-900">
                        Item <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div
                          className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer bg-white h-10"
                          onClick={() =>
                            setIsAllocatedDropdownOpen(!isAllocatedDropdownOpen)
                          }
                        >
                          <span
                            className={
                              currentItem.itemId
                                ? "text-gray-900"
                                : "text-gray-400"
                            }
                          >
                            {allocatedItems.find(
                              (si: any) =>
                                si._id === currentItem.allocatedStockItemId,
                            )?.item?.name || "Select an item"}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform ${
                              isAllocatedDropdownOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>

                        {isAllocatedDropdownOpen && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-gray-200">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search items..."
                                  value={allocatedSearch}
                                  onChange={(e) =>
                                    setAllocatedSearch(e.target.value)
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                                  autoFocus
                                />
                              </div>
                            </div>

                            {fetchAllocatedItemsLoading && (
                              <div className="p-4 text-sm text-center text-gray-500">
                                Loading items...
                              </div>
                            )}

                            {!fetchAllocatedItemsLoading && (
                              <>
                                {allocatedItems.length === 0 ? (
                                  <div className="p-4 text-center text-gray-500 text-sm">
                                    {allocatedSearch
                                      ? "No items found"
                                      : "No items available"}
                                  </div>
                                ) : (
                                  <ul className="py-1">
                                    {allocatedItems
                                      .filter((si: any) => {
                                        const n = (
                                          si.item?.name || ""
                                        ).toLowerCase();
                                        const c = (
                                          si.item?.code || ""
                                        ).toLowerCase();
                                        const q = allocatedSearch.toLowerCase();
                                        return n.includes(q) || c.includes(q);
                                      })
                                      .map((si: any) => (
                                        <li
                                          key={si._id}
                                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                          onClick={() => {
                                            const it = si.item || {};
                                            console.log({ it, si });
                                            setCurrentItem((prev) => ({
                                              ...prev,
                                              code: it.code || "",
                                              itemId: it?.itemId?._id || "",
                                              allocatedStockItemId:
                                                si._id || "",
                                              name: it.name || "",
                                              description: it.description || "",
                                              uom: it.uom || prev.uom || "",
                                            }));
                                            console.log({ currentItem });
                                            setIsAllocatedDropdownOpen(false);
                                            setAllocatedSearch("");
                                          }}
                                        >
                                          <div className="font-medium">
                                            {si.item?.name || "-"}
                                          </div>
                                          {(si.item?.code ||
                                            si.location?.name) && (
                                            <div className="text-xs text-gray-500">
                                              {si.item?.code
                                                ? `Code: ${si.item.code}`
                                                : ""}
                                            </div>
                                          )}
                                        </li>
                                      ))}
                                  </ul>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Description
                      </label>
                      <input
                        type="text"
                        value={currentItem.description || ""}
                        onChange={(e) =>
                          handleCurrentItemChange("description", e.target.value)
                        }
                        placeholder="Description"
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 h-10"
                      />
                    </div>
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Qty <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={availableForSelectedUom || undefined}
                        value={currentItem.quantity}
                        onChange={(e) => {
                          const raw = Number(e.target.value) || 0;
                          const max = availableForSelectedUom || 0;
                          const clamped =
                            max > 0 ? Math.min(raw, max) : Math.max(1, raw);
                          handleCurrentItemChange("quantity", clamped);
                        }}
                        placeholder="Qty"
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 h-10"
                      />
                      {currentItem.uom && (
                        <p className="text-xs text-gray-500">
                          Available: {availableForSelectedUom} {currentItem.uom}
                        </p>
                      )}
                      {exceedsAvailable && (
                        <p className="text-xs text-red-600">
                          Quantity exceeds available for selected UOM
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        UOM <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={currentItem.uom || ""}
                        onChange={(e) =>
                          handleCurrentItemChange("uom", e.target.value)
                        }
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 h-10"
                      >
                        <option value="">Select UOM</option>
                        {!allocatedItems?.find(
                          (i) => i?._id === currentItem?.allocatedStockItemId,
                        ) ? (
                          <option value="">Loading UOMs...</option>
                        ) : allocatedItems?.find(
                            (i) => i?._id === currentItem?.allocatedStockItemId,
                          ) && currentItem ? (
                          (
                            allocatedItems?.find(
                              (i) =>
                                i?._id === currentItem?.allocatedStockItemId,
                            )?.quantitiesByUom || []
                          )?.map((i, index: number) => (
                            <option key={index.toString()} value={i.uom}>
                              {i.uom}
                            </option>
                          ))
                        ) : (
                          <></>
                        )}
                      </select>
                    </div>
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setItems([]);
                        }}
                        disabled={
                          items.length === 0 || !availableForSelectedUom
                        }
                        className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={addCurrentItem}
                        disabled={
                          !currentItem.name.trim() ||
                          !currentItem.quantity ||
                          !currentItem.uom ||
                          exceedsAvailable
                        }
                        className="inline-flex items-center px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>
                </div>
                {/* Item Form */}

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
            )}
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
              (formData?.transferType === "External" &&
                !formData.requestingBranch) ||
              !formData.fromBranch ||
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
                Create Transfer Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStockTransferRequestModal;
