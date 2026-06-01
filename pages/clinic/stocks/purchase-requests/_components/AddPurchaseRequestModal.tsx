import React, { useState, useEffect, useRef } from "react";
import {
  PlusCircle,
  X,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  CirclePlus,
} from "lucide-react";
import { PurchaseRecord, PurchaseRecordItem } from "@/types/stocks";
import useClinicBranches from "@/hooks/useClinicBranches";
import useSuppliers from "@/hooks/useSuppliers";
import useUoms from "@/hooks/useUoms";
import useStockItems from "@/hooks/useStockItems";
import AddStockItemModal from "@/components/shared/AddStockItemModal";

interface AddPurchaseRequestModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: PurchaseRecord) => void;
}

// Function to generate next enquiry number
const generateEnqNo = async (token: string): Promise<string> => {
  try {
    const response = await fetch(
      "/api/stocks/purchase-records?type=Purchase_Request&limit=1000",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();

    if (data.success) {
      const records = data.data.records || [];
      // Filter records with enqNo starting with ENQ-
      const enqNumbers = records
        .map((r: any) => r.enqNo)
        .filter((enq: string) => enq && enq.startsWith("ENQ-"))
        .map((enq: string) => {
          const match = enq.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .sort((a: number, b: number) => a - b);

      let nextNumber = 1;
      for (const num of enqNumbers) {
        if (num === nextNumber) {
          nextNumber++;
        } else if (num > nextNumber) {
          break;
        }
      }
      return `ENQ-${String(nextNumber).padStart(6, "0")}`;
    }
  } catch (error) {
    console.error("Error generating enquiry number:", error);
  }
  // Fallback
  return `ENQ-${Date.now().toString().slice(-6)}`;
};

const AddPurchaseRequestModal: React.FC<AddPurchaseRequestModalProps> = ({
  token,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { clinicBranches } = useClinicBranches();
  const { stockItems, fetchStockItems } = useStockItems();
  const [supplierSearch, setSupplierSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [isOpenAddStockItemModal, setIsOpenAddStockItemModal] = useState(false);
  const [enqNoLoading, setEnqNoLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
    date: new Date().toISOString().split("T")[0],
    enqNo: "",
    supplier: "",
    type: "Purchase_Request",
    supplierInvoiceNo: "",
    notes: "",
    status: "New",
    shipTo: {
      to: "",
      address: "",
      telephone: "",
      email: "",
    },
    billTo: {
      to: "",
      address: "",
      telephone: "",
      email: "",
    },
    contactInfoOfBuyer: {
      to: "",
      address: "",
      telephone: "",
      email: "",
    },
  });

  const { uoms } = useUoms({
    token,
    branchId: formData.branch || "",
  });

  const { suppliers, loading: suppliersLoading } = useSuppliers({
    search: supplierSearch,
    branchId: formData.branch,
  });

  const [items, setItems] = useState<PurchaseRecordItem[]>([]);

  // Current item being added
  const [currentItem, setCurrentItem] = useState<PurchaseRecordItem>({
    name: "",
    description: "",
    quantity: 1,
    uom: "",
    unitPrice: 0,
    totalPrice: 0,
    discount: 0,
    discountType: "Fixed",
    discountAmount: 0,
    netPrice: 0,
    vatAmount: 0,
    vatType: "Exclusive",
    vatPercentage: 0,
    netPlusVat: 0,
    freeQuantity: 0,
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  // Auto-generate enquiry number when modal opens
  useEffect(() => {
    if (isOpen && !formData.enqNo) {
      setEnqNoLoading(true);
      generateEnqNo(token)
        .then((enqNo) => {
          setFormData((prev) => ({ ...prev, enqNo }));
        })
        .finally(() => setEnqNoLoading(false));
    }
  }, [isOpen, token]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCurrentItemChange = (
    field: keyof PurchaseRecordItem,
    value: any
  ) => {
    let discountAmount = 0;
    if (field === "discount" && currentItem?.discountType === "Fixed") {
      discountAmount = value || 0;
    }
    if (field === "discount" && currentItem?.discountType === "Percentage") {
      discountAmount =
        (currentItem.quantity * currentItem.unitPrice * (value || 0)) / 100;
    }
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
      ...(field === "discount" && { discountAmount }),
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
      unitPrice: 0,
      totalPrice: 0,
      discount: 0,
      discountType: "Fixed",
      discountAmount: 0,
      netPrice: 0,
      vatAmount: 0,
      vatType: "Exclusive",
      vatPercentage: 0,
      netPlusVat: 0,
      freeQuantity: 0,
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
    if (!formData.branch.trim() || !formData.supplier.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (items.length === 0) {
      setError("Please add at least one item");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare the payload
      const payload = {
        ...formData,
        items: items,
        type: "Purchase_Request", // Force type to be Purchase_Request for purchase requests
      };

      const response = await fetch(
        "/api/stocks/purchase-records/add-purchase-records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
        handleClose();
      } else {
        setError(result.message || "Failed to add purchase request");
      }
    } catch (err) {
      console.error("Error adding purchase request:", err);
      setError("An error occurred while adding the purchase request");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      branch: "",
      date: new Date().toISOString().split("T")[0],
      enqNo: "",
      supplier: "",
      type: "Purchase_Request",
      supplierInvoiceNo: "",
      notes: "",
      status: "New",
      shipTo: {
        to: "",
        address: "",
        telephone: "",
        email: "",
      },
      billTo: {
        to: "",
        address: "",
        telephone: "",
        email: "",
      },
      contactInfoOfBuyer: {
        to: "",
        address: "",
        telephone: "",
        email: "",
      },
    });
    setItems([]);
    setCurrentItem({
      name: "",
      description: "",
      quantity: 1,
      uom: "",
      unitPrice: 0,
      totalPrice: 0,
      discount: 0,
      discountType: "Fixed",
      discountAmount: 0,
      netPrice: 0,
      vatAmount: 0,
      vatType: "Exclusive",
      vatPercentage: 0,
      netPlusVat: 0,
      freeQuantity: 0,
    });
    // Reset supplier search
    setSupplierSearch("");
    setIsSupplierDropdownOpen(false);
    setError(null);
    onClose();
  };

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
                Add New Purchase Request
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Create a new purchase request
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData({ ...formData, branch: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                >
                  <option value="">Select branch</option>
                  {clinicBranches?.map((item) => (
                    <option key={item?._id} value={item?._id}>
                      {item?.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select branch for this purchase request
                </p>
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
                        (supplier) => supplier._id === formData.supplier
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
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
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
                <p className="text-xs text-gray-500 mt-1">
                  Select supplier from the list
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
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Purchase request date
                </p>
              </div>

              {/* Enquiry Number */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Enquiry Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="enqNo"
                    value={formData.enqNo}
                    readOnly
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    disabled={true}
                  />
                  {enqNoLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated enquiry number
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
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <option value="New">New</option>
                  <option value="Approved">Approved</option>
                  <option value="Partly_Delivered">Partly Delivered</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Partly_Invoiced">Partly Invoiced</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Deleted">Deleted</option>
                  <option value="Converted_To_PO">Converted To PO</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Current status of the purchase request
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
                onChange={handleInputChange}
                placeholder="Enter any additional notes"
                rows={3}
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Additional notes for this purchase request
              </p>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Purchase Request Items *
                    </h3>
                    <button
                      onClick={() => setIsOpenAddStockItemModal(true)}
                      className="flex items-center justify-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <CirclePlus size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Add items for this purchase request
                  </p>
                </div>
              </div>

              {/* Item Form - Simplified for Purchase Request */}
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
                      <option value="">Select a Item</option>
                      {stockItems.map((item) => (
                        <option key={item?._id} value={item?._id}>
                          {item?.name}
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
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                    />
                  </div>

                  {/* Qty */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Qty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "quantity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
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
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 h-10"
                    >
                      <option value="">Select UOM</option>
                      {!stockItems?.find(
                        (i) => i?._id === currentItem?.itemId
                      ) ? (
                        <option value="">Loading UOMs...</option>
                      ) : (
                        <option value={currentItem.uom}>
                          {currentItem.uom}
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Add Item Button */}
                  <div className="sm:col-span-12 flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={resetItems}
                      disabled={loading || items.length === 0}
                      className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={addCurrentItem}
                      disabled={
                        loading ||
                        !currentItem.name?.trim() ||
                        !currentItem.quantity ||
                        !currentItem.uom?.trim()
                      }
                      className="inline-flex items-center px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table - Simplified for Purchase Request */}
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
                            <td className="px-3 py-2 text-sm text-gray-900">
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
                            colSpan={3}
                            className="px-3 py-2 text-sm font-bold text-gray-900 text-right"
                          >
                            Total Items:
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {items.length}
                          </td>
                          <td colSpan={2}></td>
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
              !formData.supplier.trim() ||
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
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Add Purchase Request
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
            fetchStockItems();
          }}
        />
      </div>
    </div>
  );
};

export default AddPurchaseRequestModal;
