import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  Check,
  CirclePlus,
} from "lucide-react";
import { PurchaseRecord, PurchaseRecordItem } from "@/types/stocks";
import useClinicBranches from "@/hooks/useClinicBranches";
import useSuppliers from "@/hooks/useSuppliers";
import useUoms from "@/hooks/useUoms";
import useStockItems from "@/hooks/useStockItems";
import AddStockItemModal from "@/components/shared/AddStockItemModal";

interface EditPurchaseOrderModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderData: PurchaseRecord | null;
  onSuccess: (data: PurchaseRecord) => void;
}

const EditPurchaseOrderModal: React.FC<EditPurchaseOrderModalProps> = ({
  token,
  isOpen,
  onClose,
  purchaseOrderData,
  onSuccess,
}) => {
  const { clinicBranches } = useClinicBranches();
  const { stockItems } = useStockItems();
  const [supplierSearch, setSupplierSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [isOpenAddStockItemModal, setIsOpenAddStockItemModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
    date: "",
    enqNo: "",
    quotationNo: "",
    quotationDate: "",
    validityDays: "",
    paymentTermsDays: "",
    supplier: "",
    type: "Purchase_Order",
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

  const [items, setItems] = useState<PurchaseRecordItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] = useState<PurchaseRecordItem | null>(null);
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

  const { uoms, loading: uomsLoading } = useUoms({
    token,
    branchId: formData.branch || "",
  });

  const { suppliers, loading: suppliersLoading } = useSuppliers({
    search: supplierSearch,
    branchId: formData.branch,
  });

  // Show supplier invoice number field only for specific types
  const showSupplierInvoiceNo =
    formData.type === "Purchase_Invoice" || formData.type === "GRN_Regular";

  // Calculate discount amount (clamped)
  const calculateDiscountAmount = (item: PurchaseRecordItem): number => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unit = Math.max(0, Number(item.unitPrice) || 0);
    const total = qty * unit;
    if (item.discountType === "Fixed") {
      const fixed = Math.max(0, Number(item.discount || 0));
      return Math.min(fixed, total);
    } else if (item.discountType === "Percentage") {
      const pct = Math.min(Math.max(Number(item.discount || 0), 0), 100);
      return (total * pct) / 100;
    }
    return 0;
  };

  // Update current item calculations (handles Inclusive/Exclusive VAT correctly)
  useEffect(() => {
    const qty = Math.max(0, Number(currentItem.quantity) || 0);
    const unit = Math.max(0, Number(currentItem.unitPrice) || 0);
    const total = qty * unit;
    const discountAmount = calculateDiscountAmount(currentItem);
    const netBeforeVat = total - discountAmount;
    const vatPct = Math.max(0, Number(currentItem.vatPercentage || 0));

    let vatAmount = 0;
    let netPrice = 0;
    let netPlusVat = 0;
    if (currentItem.vatType === "Inclusive") {
      if (vatPct > 0) {
        vatAmount = Number(((netBeforeVat * vatPct) / (100 + vatPct)).toFixed(2));
      } else {
        vatAmount = Math.max(0, Math.min(Number(currentItem.vatAmount || 0), netBeforeVat));
      }
      netPrice = Number((netBeforeVat - vatAmount).toFixed(2));
      netPlusVat = Number(netBeforeVat.toFixed(2));
    } else {
      // Exclusive
      if (vatPct > 0) {
        vatAmount = Number(((netBeforeVat * vatPct) / 100).toFixed(2));
      } else {
        vatAmount = Math.max(0, Number(currentItem.vatAmount || 0));
      }
      netPrice = Number(netBeforeVat.toFixed(2));
      netPlusVat = Number((netBeforeVat + vatAmount).toFixed(2));
    }
    setCurrentItem((prev) => ({
      ...prev,
      quantity: qty,
      unitPrice: unit,
      totalPrice: Number(total.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      netPrice,
      vatAmount,
      netPlusVat,
    }));
  }, [
    currentItem.quantity,
    currentItem.unitPrice,
    currentItem.discount,
    currentItem.discountType,
    currentItem.vatAmount,
    currentItem.vatType,
    currentItem.vatPercentage,
  ]);

  // Load data when purchaseOrderData changes
  useEffect(() => {
    if (purchaseOrderData) {
      setFormData({
        branch:
          typeof purchaseOrderData.branch === "object"
            ? (purchaseOrderData.branch as any)._id
            : purchaseOrderData.branch || "",
        date: purchaseOrderData.date
          ? purchaseOrderData.date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        enqNo: purchaseOrderData.enqNo || "",
        quotationNo: purchaseOrderData.quotationNo || "",
        quotationDate: purchaseOrderData.quotationDate || "",
        validityDays: purchaseOrderData.validityDays || "",
        paymentTermsDays: purchaseOrderData.paymentTermsDays || "",
        supplier:
          typeof purchaseOrderData.supplier === "object"
            ? (purchaseOrderData.supplier as any)._id
            : purchaseOrderData.supplier || "",
        type: purchaseOrderData.type || "Purchase_Order",
        supplierInvoiceNo: purchaseOrderData.supplierInvoiceNo || "",
        notes: purchaseOrderData.notes || "",
        status: purchaseOrderData.status || "New",
        shipTo: {
          to: purchaseOrderData.shipTo?.to || "",
          address: purchaseOrderData.shipTo?.address || "",
          telephone: purchaseOrderData.shipTo?.telephone || "",
          email: purchaseOrderData.shipTo?.email || "",
        },
        billTo: {
          to: purchaseOrderData.billTo?.to || "",
          address: purchaseOrderData.billTo?.address || "",
          telephone: purchaseOrderData.billTo?.telephone || "",
          email: purchaseOrderData.billTo?.email || "",
        },
        contactInfoOfBuyer: {
          to: purchaseOrderData.contactInfoOfBuyer?.to || "",
          address: purchaseOrderData.contactInfoOfBuyer?.address || "",
          telephone: purchaseOrderData.contactInfoOfBuyer?.telephone || "",
          email: purchaseOrderData.contactInfoOfBuyer?.email || "",
        },
      });

      setItems(
        purchaseOrderData.items.map((item) => ({
          ...item,
          discountAmount: item.discountAmount || calculateDiscountAmount(item),
        })),
      );
    }
  }, [purchaseOrderData]);

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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
    value: any,
  ) => {
    const numericFields: (keyof PurchaseRecordItem)[] = [
      "quantity",
      "unitPrice",
      "discount",
      "vatAmount",
      "vatPercentage",
      "freeQuantity",
    ];
    if (numericFields.includes(field)) {
      value = Number(value || 0);
      if (value < 0) value = 0;
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
    }));
  };

  const addCurrentItem = () => {
    if (!currentItem.name.trim()) {
      setError("Please select an item");
      return;
    }

    const qty = Math.max(0, Number(currentItem.quantity) || 0);
    const unit = Math.max(0, Number(currentItem.unitPrice) || 0);
    const total = qty * unit;
    const discountAmount = calculateDiscountAmount(currentItem);
    const netBeforeVat = total - discountAmount;
    const vatPct = Math.max(0, Number(currentItem.vatPercentage || 0));
    let vatAmount = 0;
    let netPrice = 0;
    let netPlusVat = 0;
    if (currentItem.vatType === "Inclusive") {
      if (vatPct > 0) {
        vatAmount = Number(((netBeforeVat * vatPct) / (100 + vatPct)).toFixed(2));
      } else {
        vatAmount = Math.max(0, Math.min(Number(currentItem.vatAmount || 0), netBeforeVat));
      }
      netPrice = Number((netBeforeVat - vatAmount).toFixed(2));
      netPlusVat = Number(netBeforeVat.toFixed(2));
    } else {
      if (vatPct > 0) {
        vatAmount = Number(((netBeforeVat * vatPct) / 100).toFixed(2));
      } else {
        vatAmount = Math.max(0, Number(currentItem.vatAmount || 0));
      }
      netPrice = Number(netBeforeVat.toFixed(2));
      netPlusVat = Number((netBeforeVat + vatAmount).toFixed(2));
    }

    const newItem = {
      ...currentItem,
      discountAmount: Number(discountAmount.toFixed(2)),
      totalPrice: Number(total.toFixed(2)),
      netPrice,
      vatAmount,
      netPlusVat,
    };

    setItems([...items, newItem]);

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
  };

  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  const editItem = (index: number) => {
    setEditingIndex(index);
    setEditedItem({ ...items[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editedItem) {
      const updatedItems = [...items];
      const discountAmount = calculateDiscountAmount(editedItem);
      const total = editedItem.quantity * editedItem.unitPrice;
      const netPrice = total - discountAmount;
      const vatAmount =
        editedItem.vatType === "Exclusive" ? editedItem.vatAmount || 0 : 0;

      updatedItems[editingIndex] = {
        ...editedItem,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        totalPrice: parseFloat(total.toFixed(2)),
        netPrice: parseFloat(netPrice.toFixed(2)),
        netPlusVat: parseFloat((netPrice + vatAmount).toFixed(2)),
      };
      setItems(updatedItems);
      setEditingIndex(null);
      setEditedItem(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedItem(null);
  };

  const handleEditChange = (field: keyof PurchaseRecordItem, value: any) => {
    if (editedItem) {
      setEditedItem({
        ...editedItem,
        [field]: value,
      });
    }
  };

  const resetCurrentItem = () => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          discountAmount: item.discountAmount || calculateDiscountAmount(item),
        })),
      };

      const response = await fetch(
        `/api/stocks/purchase-records/update-purchase-record/${purchaseOrderData?._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
        handleClose();
      } else {
        setError(result.message || "Failed to update purchase order");
      }
    } catch (err) {
      console.error("Error updating purchase order:", err);
      setError("An error occurred while updating the purchase order");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !purchaseOrderData) return null;

  // Calculate totals
  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.discountAmount || 0),
    0,
  );
  const totalNet = items.reduce((sum, item) => sum + item.netPrice, 0);
  const totalVat = items.reduce((sum, item) => sum + (item.vatAmount || 0), 0);
  const totalNetPlusVat = items.reduce(
    (sum, item) => sum + (item.netPlusVat || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit Purchase Order
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Update purchase order details
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
                  Select branch for this purchase order
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

              {/* Type */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <option value="Purchase_Order">Purchase Order</option>
                  <option value="Purchase_Invoice">Purchase Invoice</option>
                  <option value="GRN_Regular">GRN Regular</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the type of purchase record
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
                  Purchase order date
                </p>
              </div>

              {/* Enquiry Number */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Enquiry Number
                </label>
                <input
                  type="text"
                  name="enqNo"
                  value={formData.enqNo}
                  onChange={handleInputChange}
                  placeholder="Enter enquiry number"
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Reference enquiry number
                </p>
              </div>

              {/* Quotation Number */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Quotation Number
                </label>
                <input
                  type="text"
                  name="quotationNo"
                  value={formData.quotationNo}
                  onChange={handleInputChange}
                  placeholder="Enter quotation number"
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Reference quotation number
                </p>
              </div>

              {/* Validity (Days) */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Validity (Days)
                </label>
                <input
                  type="number"
                  name="validityDays"
                  value={formData.validityDays}
                  onChange={handleInputChange}
                  placeholder="Enter validity days"
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Validity period in days
                </p>
              </div>

              {/* Payment Terms (Days) */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Payment Terms (Days)
                </label>
                <input
                  type="number"
                  name="paymentTermsDays"
                  value={formData.paymentTermsDays}
                  onChange={handleInputChange}
                  placeholder="Enter payment terms days"
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Payment terms in days
                </p>
              </div>

              {/* Supplier Invoice Number - conditionally rendered */}
              {showSupplierInvoiceNo && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Supplier Invoice No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="supplierInvoiceNo"
                    value={formData.supplierInvoiceNo}
                    onChange={handleInputChange}
                    placeholder="Enter supplier invoice number"
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                    required={showSupplierInvoiceNo}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required for Purchase Invoice and GRN Regular
                  </p>
                </div>
              )}

              {/* Quotation Date */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Quotation Date
                </label>
                <input
                  type="date"
                  name="quotationDate"
                  value={formData.quotationDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Quotation date</p>
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
                  Current status of the purchase order
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
                Additional notes for this purchase order
              </p>
            </div>

            {/* Address Information Sections */}
            <div className="space-y-6">
              {/* Ship To Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Ship To
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      To
                    </label>
                    <input
                      type="text"
                      name="shipTo.to"
                      value={formData.shipTo.to}
                      onChange={handleInputChange}
                      placeholder="Enter recipient name"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Telephone
                    </label>
                    <input
                      type="text"
                      name="shipTo.telephone"
                      value={formData.shipTo.telephone}
                      onChange={handleInputChange}
                      placeholder="Enter telephone"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Address
                    </label>
                    <textarea
                      name="shipTo.address"
                      value={formData.shipTo.address}
                      onChange={handleInputChange}
                      placeholder="Enter shipping address"
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Email
                    </label>
                    <input
                      type="email"
                      name="shipTo.email"
                      value={formData.shipTo.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Bill To Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Bill To
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      To
                    </label>
                    <input
                      type="text"
                      name="billTo.to"
                      value={formData.billTo.to}
                      onChange={handleInputChange}
                      placeholder="Enter recipient name"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Telephone
                    </label>
                    <input
                      type="text"
                      name="billTo.telephone"
                      value={formData.billTo.telephone}
                      onChange={handleInputChange}
                      placeholder="Enter telephone"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Address
                    </label>
                    <textarea
                      name="billTo.address"
                      value={formData.billTo.address}
                      onChange={handleInputChange}
                      placeholder="Enter billing address"
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Email
                    </label>
                    <input
                      type="email"
                      name="billTo.email"
                      value={formData.billTo.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info of Buyer Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Contact Info of Buyer
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      To
                    </label>
                    <input
                      type="text"
                      name="contactInfoOfBuyer.to"
                      value={formData.contactInfoOfBuyer.to}
                      onChange={handleInputChange}
                      placeholder="Enter buyer name"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Telephone
                    </label>
                    <input
                      type="text"
                      name="contactInfoOfBuyer.telephone"
                      value={formData.contactInfoOfBuyer.telephone}
                      onChange={handleInputChange}
                      placeholder="Enter telephone"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Address
                    </label>
                    <textarea
                      name="contactInfoOfBuyer.address"
                      value={formData.contactInfoOfBuyer.address}
                      onChange={handleInputChange}
                      placeholder="Enter buyer address"
                      rows={2}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-900">
                      Email
                    </label>
                    <input
                      type="email"
                      name="contactInfoOfBuyer.email"
                      value={formData.contactInfoOfBuyer.email}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Items *
                    </h3>
                    <button
                      onClick={() => setIsOpenAddStockItemModal(true)}
                      className="flex items-center justify-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <CirclePlus size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Edit items for this purchase order
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
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      placeholder="Qty"
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
                        uoms.map((uom) => (
                          <option key={uom._id} value={uom.name}>
                            {uom.name}
                          </option>
                        ))
                      ) : (
                        <option value="">No UOMs available</option>
                      )}
                    </select>
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.unitPrice}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "unitPrice",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      placeholder="0"
                    />
                  </div>

                  {/* Total */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Total *
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentItem.totalPrice.toFixed(2)}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                    />
                  </div>

                  {/* Discount */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Discount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.discount}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "discount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      placeholder="0"
                    />
                  </div>

                  {/* Disc. Type */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Disc. Type
                    </label>
                    <select
                      value={currentItem.discountType}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "discountType",
                          e.target.value as "Fixed" | "Percentage",
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                    >
                      <option value="Fixed">Fixed</option>
                      <option value="Percentage">%</option>
                    </select>
                  </div>

                  {/* Disc. Value */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Disc. Value
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentItem.discountAmount?.toFixed(2) || "0.00"}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                    />
                  </div>

                  {/* NET */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      NET *
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentItem.netPrice.toFixed(2)}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                    />
                  </div>

                  {/* VAT % */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      VAT %
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.vatPercentage}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "vatPercentage",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      placeholder="0"
                    />
                  </div>

                  {/* VAT */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      VAT
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentItem.vatAmount}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "vatAmount",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      placeholder="0"
                    />
                  </div>

                  {/* Net + VAT */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Net + VAT *
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={currentItem.netPlusVat?.toFixed(2) || "0.00"}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                    />
                  </div>

                  {/* Free Qty */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-gray-900">
                      Free Qty
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentItem.freeQuantity}
                      onChange={(e) =>
                        handleCurrentItemChange(
                          "freeQuantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                      disabled={loading}
                      placeholder="0"
                    />
                  </div>

                  {/* Add Item Button */}
                  <div className="sm:col-span-12 flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={resetCurrentItem}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={addCurrentItem}
                      disabled={
                        loading ||
                        !currentItem.name.trim() ||
                        !currentItem.quantity ||
                        !currentItem.unitPrice ||
                        !currentItem.uom
                      }
                      className="inline-flex items-center px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
                          Item
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Qty-UoM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Free Qty-UoM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Disc. / Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Disc. Value
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Net
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          VAT
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          NET + VAT
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={13}
                            className="px-3 py-8 text-sm text-center text-gray-500"
                          >
                            No Items Added
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {editingIndex === index && editedItem ? (
                              // Edit mode - show input fields
                              <>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={editedItem.name}
                                    onChange={(e) =>
                                      handleEditChange("itemId", e.target.value)
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="">Select Item</option>
                                    {stockItems.map((item) => (
                                      <option key={item?._id} value={item?._id}>
                                        {item?.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={editedItem.description || ""}
                                    onChange={(e) =>
                                      handleEditChange(
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      value={editedItem.quantity}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "quantity",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                    <select
                                      value={editedItem.uom || ""}
                                      onChange={(e) =>
                                        handleEditChange("uom", e.target.value)
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                    >
                                      <option value="">Select UOM</option>
                                      {uomsLoading ? (
                                        <option value="">
                                          Loading UOMs...
                                        </option>
                                      ) : uoms.length > 0 ? (
                                        uoms.map((uom) => (
                                          <option
                                            key={uom._id}
                                            value={uom.name}
                                          >
                                            {uom.name}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="">
                                          No UOMs available
                                        </option>
                                      )}
                                    </select>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      value={editedItem.freeQuantity}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "freeQuantity",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                    <select
                                      value={editedItem.uom || ""}
                                      onChange={(e) =>
                                        handleEditChange("uom", e.target.value)
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                    >
                                      <option value="">Select UOM</option>
                                      {uomsLoading ? (
                                        <option value="">
                                          Loading UOMs...
                                        </option>
                                      ) : uoms.length > 0 ? (
                                        uoms.map((uom) => (
                                          <option
                                            key={uom._id}
                                            value={uom.name}
                                          >
                                            {uom.name}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="">
                                          No UOMs available
                                        </option>
                                      )}
                                    </select>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editedItem.unitPrice}
                                    onChange={(e) =>
                                      handleEditChange(
                                        "unitPrice",
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {editedItem.totalPrice.toFixed(2)}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editedItem.discount}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "discount",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                    />
                                    <select
                                      value={editedItem.discountType}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "discountType",
                                          e.target.value as
                                            | "Fixed"
                                            | "Percentage",
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                    >
                                      <option value="Fixed">Fixed</option>
                                      <option value="Percentage">%</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {editedItem.discountAmount?.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {editedItem.netPrice.toFixed(2)}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex gap-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editedItem.vatPercentage}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "vatPercentage",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                      placeholder="%"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editedItem.vatAmount}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "vatAmount",
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                      placeholder="Amt"
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {editedItem.netPlusVat?.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm flex gap-2">
                                  <button
                                    type="button"
                                    onClick={saveEdit}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </>
                            ) : (
                              // View mode - show item data
                              <>
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
                                  {item.quantity} {item.uom}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.freeQuantity || 0} {item.uom}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.totalPrice.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.discount}{" "}
                                  {item.discountType === "Percentage"
                                    ? "%"
                                    : ""}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.discountAmount?.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.netPrice.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.vatAmount?.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {item.netPlusVat?.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => editItem(index)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                    {items.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={6}
                            className="px-3 py-2 text-sm font-bold text-gray-900 text-right"
                          >
                            Grand Total:
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {grandTotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900"></td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {totalDiscount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {totalNet.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {totalVat.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900">
                            {totalNetPlusVat.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-gray-900"></td>
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
              !formData.date.trim() ||
              !formData.type.trim() ||
              (showSupplierInvoiceNo && !formData.supplierInvoiceNo.trim()) ||
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
                  />
                </svg>
                Updating...
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Update Purchase Order
              </>
            )}
          </button>
        </div>
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
  );
};

export default EditPurchaseOrderModal;
