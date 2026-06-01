"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import useClinicBranches from "@/hooks/useClinicBranches";
import { getTokenByPath } from "@/lib/helper";
import { PlusCircle, X, ChevronDown, Search, Trash2, Plus } from "lucide-react";
import useSuppliers from "@/hooks/useSuppliers";
import useStockItems from "@/hooks/useStockItems";
import useUoms from "@/hooks/useUoms";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface ReturnItem {
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

const AddPurchaseReturnModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { clinicBranches } = useClinicBranches();
  const { stockItems } = useStockItems();
  const token = getTokenByPath() || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [poSearch, setPoSearch] = useState("");
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const poDropdownRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<ReturnItem[]>([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState<ReturnItem>({
    code: "",
    name: "",
    description: "",
    quantity: 1,
    uom: "",
    expiryDate: "",
    costPrice: 0,
    totalPrice: 0,
  });

  const [formData, setFormData] = useState({
    branch: "",
    purchasedOrder: "",
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    status: "Returned",
  });

  const { uoms, loading: uomsLoading } = useUoms({
    token,
    branchId: formData.branch || "",
  });

  const { suppliers, loading: suppliersLoading } = useSuppliers({
    search: supplierSearch,
    branchId: formData.branch,
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        branch: "",
        supplier: "",
        purchasedOrder: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        status: "Returned",
      });
      setPoSearch("");
      setIsPoDropdownOpen(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.branch) fetchPurchaseOrders();
    else setPurchaseOrders([]);
  }, [formData.branch]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true);
      const res = await axios.get("/api/stocks/purchase-records", {
        params: {
          branch: formData.branch,
          type: "Purchase_Order",
          status: "Approved",
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchaseOrders(res.data?.data?.records || []);
    } catch (err) {
      console.error("Failed to fetch POs", err);
      setPurchaseOrders([]);
    } finally {
      setLoadingPOs(false);
    }
  };

  // Click outside to close PO dropdown
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        poDropdownRef.current &&
        !poDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPoDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close supplier dropdown when clicking outside
      if (
        supplierDropdownRef.current &&
        !supplierDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSupplierDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedPO = purchaseOrders.find(
    (p) => p._id === formData.purchasedOrder,
  );
  const filteredPOs = purchaseOrders.filter((p) =>
    p.orderNo?.toLowerCase().includes(poSearch.toLowerCase()),
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!formData.branch || !formData.purchasedOrder) {
      setError("Branch and Purchase Order are required");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        "/api/stocks/purchase-returns/add-purchase-return",
        {
          branch: formData.branch,
          purchasedOrder: formData.purchasedOrder,
          supplier: formData.supplier,
          date: formData.date,
          notes: formData.notes,
          items: items,
          status: formData.status,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        onSuccess(res.data.data);
        onClose();
      } else setError(res.data?.message || "Failed to add");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentItemChange = (field: keyof ReturnItem, value: any) => {
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
      ...(field === "quantity" || field === "costPrice"
        ? {
            totalPrice:
              parsedValue *
              (field === "quantity" ? prev.costPrice : prev.quantity),
          }
        : {}),
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

  useEffect(() => {
    console.log({ selectedPO });
    if (selectedPO) {
      const itemsForReturn = selectedPO.items.map((item: any) => ({
        ...item,
        returnQuantity: 0, // Initialize return quantity to 0
      }));
      setItems(itemsForReturn);
    } else {
      setItems([]);
    }
  }, [selectedPO]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Add Purchase Return
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Create a new purchase return
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg"
                  required
                >
                  <option value="">Select branch</option>
                  {clinicBranches?.map((b: any) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Supplier - Searchable Select */}
              <div className="space-y-2 relative" ref={supplierDropdownRef}>
                <label className="block text-sm font-bold text-gray-900">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between cursor-pointer bg-white"
                    onClick={() =>
                      setIsSupplierDropdownOpen(!isSupplierDropdownOpen)
                    }
                  >
                    <span
                      className={
                        formData.supplier ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {suppliers?.find(
                        (supplier) => supplier._id === formData.supplier,
                      )?.name || "Select a supplier"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${
                        isSupplierDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isSupplierDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Search Input */}
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={supplierSearch}
                            onChange={(e) => setSupplierSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Loading State */}
                      {suppliersLoading && (
                        <div className="p-4 text-center text-gray-500">
                          <div className="inline-flex items-center">
                            <svg
                              className="animate-spin h-4 w-4 mr-2 text-gray-500"
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
                            Loading suppliers...
                          </div>
                        </div>
                      )}

                      {/* Suppliers List */}
                      {!suppliersLoading && (
                        <>
                          {suppliers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              {supplierSearch
                                ? "No suppliers found"
                                : "No suppliers available"}
                            </div>
                          ) : (
                            <ul className="py-1">
                              {suppliers.map((supplier) => (
                                <li
                                  key={supplier._id}
                                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      supplier: supplier._id,
                                    });
                                    setIsSupplierDropdownOpen(false);
                                    setSupplierSearch("");
                                  }}
                                >
                                  <div>
                                    <div className="font-medium">
                                      {supplier.name}
                                    </div>
                                    {supplier.branch?.name && (
                                      <div className="text-xs text-gray-500">
                                        Branch: {supplier.branch.name}
                                      </div>
                                    )}
                                  </div>
                                  {supplier.mobile && (
                                    <div className="text-xs text-gray-500">
                                      {supplier.mobile}
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

              <div className="space-y-2 relative" ref={poDropdownRef}>
                <label className="block text-sm font-bold text-gray-900">
                  Purchase Order <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsPoDropdownOpen(!isPoDropdownOpen)}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white"
                >
                  <span>
                    {formData.purchasedOrder
                      ? selectedPO?.orderNo || "Select PO"
                      : "Select PO"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {isPoDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={poSearch}
                          onChange={(e) => setPoSearch(e.target.value)}
                          placeholder="Search POs..."
                          className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg"
                          autoFocus
                        />
                      </div>
                    </div>
                    {loadingPOs ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Loading purchase orders...
                      </div>
                    ) : filteredPOs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No purchase orders found
                      </div>
                    ) : (
                      <ul className="py-1">
                        {filteredPOs.map((po) => (
                          <li
                            key={po._id}
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                purchasedOrder: po._id,
                              });
                              setIsPoDropdownOpen(false);
                              setPoSearch("");
                            }}
                          >
                            {po.orderNo}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Enter any additional notes"
                rows={3}
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              ></textarea>
            </div>

            {/* Items Section */}
            {selectedPO && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        Returned Items <span className="text-red-500">*</span>
                      </h3>
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
                        UOM <span className="text-red-500">*</span>
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
                                {item?.costPrice?.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {item?.totalPrice?.toFixed(2)}
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
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={loading || !formData.branch || !formData.purchasedOrder}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
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
              </svg>
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}{" "}
            Add Return
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseReturnModal;
