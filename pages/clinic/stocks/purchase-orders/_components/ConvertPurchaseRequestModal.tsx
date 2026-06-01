import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileText,
  Search,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Check,
  X as XIcon,
  CirclePlus,
} from "lucide-react";
import { PurchaseRecordItem } from "@/types/stocks";
import useClinicBranches from "@/hooks/useClinicBranches";
import useSuppliers from "@/hooks/useSuppliers";
import useUoms from "@/hooks/useUoms";
import useStockItems from "@/hooks/useStockItems";
import AddStockItemModal from "@/components/shared/AddStockItemModal";

interface IProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (purchaseOrderData: any) => void;
}

interface PurchaseRequestItem {
  itemId?: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  uom?: string;
  unitPrice: number;
  discount?: number;
  discountType?: string;
  totalPrice: number;
  netPrice?: number;
  vatPercentage?: number;
  vatAmount?: number;
  netPlusVat?: number;
  freeQuantity?: number;
  batchNo?: string;
  expiryDate?: string;
  freeUom?: string;
}

interface ExtendedPurchaseRecordItem extends PurchaseRecordItem {
  batchNo?: string;
  expiryDate?: string;
  freeUom?: string;
}

interface ContactInfo {
  to?: string;
  address?: string;
  telephone?: string;
  email?: string;
}

interface PurchaseRequest {
  _id: string;
  orderNo: string;
  supplier?: {
    _id: string;
    name: string;
  };
  enqNo?: string;
  shipTo?: ContactInfo;
  billTo?: ContactInfo;
  contactInfoOfBuyer?: ContactInfo;
  items: PurchaseRequestItem[];
  notes?: string;
  createdAt: string;
  date: string;
}

// Function to generate next enquiry number
// const generateEnqNo = async (token: string): Promise<string> => {
//   try {
//     const response = await fetch("/api/stocks/purchase-records?limit=1000", {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     const data = await response.json();

//     if (data.success) {
//       const records = data.data.records || [];
//       // Filter records with enqNo starting with ENQ-
//       const enqNumbers = records
//         .map((r: any) => r.enqNo)
//         .filter((enq: string) => enq && enq.startsWith("ENQ-"))
//         .map((enq: string) => {
//           const match = enq.match(/(\d+)$/);
//           return match ? parseInt(match[1]) : 0;
//         })
//         .sort((a: number, b: number) => a - b);

//       let nextNumber = 1;
//       for (const num of enqNumbers) {
//         if (num === nextNumber) {
//           nextNumber++;
//         } else if (num > nextNumber) {
//           break;
//         }
//       }
//       return `ENQ-${String(nextNumber).padStart(6, "0")}`;
//     }
//   } catch (error) {
//     console.error("Error generating enquiry number:", error);
//   }
//   // Fallback
//   return `ENQ-${Date.now().toString().slice(-6)}`;
// };

const ConvertPurchaseRequestModal: React.FC<IProps> = ({
  token,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { stockItems, fetchStockItems } = useStockItems();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState("");
  const [selectedPurchaseRequest, setSelectedPurchaseRequest] =
    useState<PurchaseRequest | null>(null);
  const { clinicBranches } = useClinicBranches();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(
    []
  );
  const [purchaseRequestsLoading, setPurchaseRequestsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedItem, setEditedItem] =
    useState<ExtendedPurchaseRecordItem | null>(null);
  const [isOpenAddStockItemModal, setIsOpenAddStockItemModal] = useState(false);
  const [enqNoLoading, _setEnqNoLoading] = useState(false);

  // Form state for purchase order
  const [formData, setFormData] = useState({
    branch: "",
    date: new Date().toISOString().split("T")[0],
    enqNo: "",
    quotationNo: "",
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

  const [items, setItems] = useState<ExtendedPurchaseRecordItem[]>([]);

  // Current item being added/edited
  const [currentItem, setCurrentItem] = useState<ExtendedPurchaseRecordItem>({
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

  const { suppliers, loading: suppliersLoading } = useSuppliers({
    search: "",
    branchId: formData.branch,
  });

  const { uoms, loading: uomsLoading } = useUoms({
    token: token,
    branchId: formData.branch || "",
  });

  // Show supplier invoice number field only for specific types
  const showSupplierInvoiceNo =
    formData.type === "Purchase_Invoice" || formData.type === "GRN_Regular";

  // Update item calculations when relevant fields change
  useEffect(() => {
    const totalPrice = currentItem.quantity * currentItem.unitPrice;

    // Calculate discount amount
    let discountAmount = 0;
    if (currentItem.discountType === "Fixed") {
      discountAmount = currentItem.discount || 0;
    } else if (currentItem.discountType === "Percentage") {
      discountAmount = (totalPrice * (currentItem.discount || 0)) / 100;
    }

    // Net price = totalPrice - discountAmount
    const netPrice = totalPrice - discountAmount;

    // VAT amount: if vatPercentage is set use it, otherwise use manual vatAmount
    const vatAmount =
      (currentItem.vatPercentage || 0) > 0
        ? (netPrice * (currentItem.vatPercentage || 0)) / 100
        : currentItem.vatAmount || 0;

    // Net + VAT
    const netPlusVat = netPrice + vatAmount;

    setCurrentItem((prev) => ({
      ...prev,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      netPrice: parseFloat(netPrice.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      netPlusVat: parseFloat(netPlusVat.toFixed(2)),
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

  // Calculate totals for the entire order
  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );
    const totalDiscount = items.reduce(
      (sum, item) => sum + (item.discountAmount || 0),
      0
    );
    const totalVat = items.reduce(
      (sum, item) => sum + (item.vatAmount || 0),
      0
    );
    const grandTotal = items.reduce(
      (sum, item) => sum + (item.netPlusVat || 0),
      0
    );

    return { subtotal, totalDiscount, totalVat, grandTotal };
  };

  const totals = calculateTotals();

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

  // Fetch purchase requests when branch is selected
  useEffect(() => {
    if (branchId && step === 1) {
      fetchPurchaseRequests();
    }
  }, [branchId, step]);

  const fetchPurchaseRequests = async () => {
    if (!branchId) return;

    try {
      setPurchaseRequestsLoading(true);
      const response = await fetch(
        `/api/stocks/purchase-records?branchId=${branchId}&type=Purchase_Request&statusNot=Converted_To_PO&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPurchaseRequests(data.data.records || []);
      }
    } catch (err) {
      console.error("Error fetching purchase requests:", err);
      setError("Failed to fetch purchase requests");
    } finally {
      setPurchaseRequestsLoading(false);
    }
  };

  const handlePurchaseRequestSelect = (pr: PurchaseRequest) => {
    setSelectedPurchaseRequest(pr);

    // Pre-fill form data from purchase request
    // Status is set to "Approved" when converting PR to PO
    setFormData({
      ...formData,
      branch: branchId,
      date: pr.date
        ? new Date(pr.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      enqNo: pr.enqNo || "",
      supplier: pr.supplier?._id || "",
      notes: pr.notes || "",
      status: "Approved",
      shipTo: {
        to: pr.shipTo?.to || "",
        address: pr.shipTo?.address || "",
        telephone: pr.shipTo?.telephone || "",
        email: pr.shipTo?.email || "",
      },
      billTo: {
        to: pr.billTo?.to || "",
        address: pr.billTo?.address || "",
        telephone: pr.billTo?.telephone || "",
        email: pr.billTo?.email || "",
      },
      contactInfoOfBuyer: {
        to: pr.contactInfoOfBuyer?.to || "",
        address: pr.contactInfoOfBuyer?.address || "",
        telephone: pr.contactInfoOfBuyer?.telephone || "",
        email: pr.contactInfoOfBuyer?.email || "",
      },
    });

    // Convert purchase request items to purchase order items
    const convertedItems = pr.items.map((item) => ({
      itemId: item?.itemId || "",
      code: item?.code || "",
      name: item.name || "",
      description: item.description || "",
      quantity: item.quantity || 1,
      uom: item.uom || "NOS",
      unitPrice: item.unitPrice || 0,
      totalPrice: item.totalPrice || item.quantity * (item.unitPrice || 0),
      discount: item.discount || 0,
      discountType: (item.discountType as "Fixed" | "Percentage") || "Fixed",
      discountAmount: item.discount || 0,
      netPrice:
        item.netPrice ||
        item.totalPrice ||
        item.quantity * (item.unitPrice || 0),
      vatAmount: item.vatAmount || 0,
      vatType: "Exclusive" as const,
      vatPercentage: item.vatPercentage || 0,
      netPlusVat:
        item.netPlusVat ||
        (item.netPrice ||
          item.totalPrice ||
          item.quantity * (item.unitPrice || 0)) + (item.vatAmount || 0),
      freeQuantity: item.freeQuantity || 0,
      batchNo: item.batchNo || "",
      expiryDate: item.expiryDate || "",
      freeUom: item.freeUom || item.uom || "NOS",
    }));

    setItems(convertedItems);
    setStep(2);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested objects
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
    field: keyof ExtendedPurchaseRecordItem,
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
          description: item.description,
          uom: selectedUOM ? selectedUOM.name : "",
          unitPrice: item.level0?.costPrice || 0,
        }));
      }
    }
    setCurrentItem((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "discount" && { discountAmount }),
    }));
  };

  // Handle editing item
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditedItem({ ...items[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editedItem) {
      const updatedItems = [...items];

      // Calculate total price
      const totalPrice = editedItem.quantity * editedItem.unitPrice;

      // Calculate discount amount
      let discountAmount = 0;
      if (editedItem.discountType === "Fixed") {
        discountAmount = editedItem.discount || 0;
      } else if (editedItem.discountType === "Percentage") {
        discountAmount = (totalPrice * (editedItem.discount || 0)) / 100;
      }

      // Calculate net price (after discount)
      const netPrice = totalPrice - discountAmount;

      // Calculate VAT amount based on percentage
      const vatAmount = (netPrice * (editedItem.vatPercentage || 0)) / 100;

      // Calculate final total
      const netPlusVat = netPrice + vatAmount;

      updatedItems[editingIndex] = {
        ...editedItem,
        totalPrice,
        discountAmount,
        netPrice,
        vatAmount,
        netPlusVat,
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

  const handleEditChange = (
    field: keyof ExtendedPurchaseRecordItem,
    value: any
  ) => {
    if (editedItem) {
      // Create updated item with new value
      const updatedItem = { ...editedItem, [field]: value };

      // Calculate total price
      const totalPrice = updatedItem.quantity * updatedItem.unitPrice;

      // Calculate discount amount
      let discountAmount = 0;
      if (updatedItem.discountType === "Fixed") {
        discountAmount = updatedItem.discount || 0;
      } else if (updatedItem.discountType === "Percentage") {
        discountAmount = (totalPrice * (updatedItem.discount || 0)) / 100;
      }

      // Calculate net price (after discount)
      const netPrice = totalPrice - discountAmount;

      // Calculate VAT amount based on percentage
      const vatAmount = (netPrice * (updatedItem.vatPercentage || 0)) / 100;

      // Calculate final total
      const netPlusVat = netPrice + vatAmount;

      setEditedItem({
        ...updatedItem,
        totalPrice,
        discountAmount,
        netPrice,
        vatAmount,
        netPlusVat,
      });
    }
  };

  const addCurrentItem = () => {
    if (!currentItem.name.trim()) {
      setError("Please select an item");
      return;
    }

    // All calculations are already up-to-date via the useEffect
    const newItem = { ...currentItem };

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
      batchNo: "",
      expiryDate: "",
      freeUom: "",
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

  const resetItems = () => {
    setItems([]);
    setEditingIndex(null);
    setEditedItem(null);
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
        type: "Purchase_Order",
        purchaseRequestId: selectedPurchaseRequest?._id || "",
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
        setError(result.message || "Failed to create purchase order");
      }
    } catch (err) {
      setError("An error occurred while creating the purchase order");
      console.error("Error creating purchase order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBranchId("");
    setSelectedPurchaseRequest(null);
    setError(null);
    setEditingIndex(null);
    setEditedItem(null);
    setFormData({
      branch: "",
      date: new Date().toISOString().split("T")[0],
      enqNo: "",
      quotationNo: "",
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
      batchNo: "",
      expiryDate: "",
      freeUom: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Convert Purchase Request to Purchase Order
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                {step === 1
                  ? "Select purchase request to convert"
                  : "Create purchase order from request"}
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

        {/* Progress Indicator */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium">Select Request</span>
            </div>
            <div className="h-0.5 w-16 bg-gray-200 flex-1">
              <div
                className={`h-full ${
                  step >= 2 ? "bg-blue-600" : "bg-gray-200"
                } transition-all duration-300`}
              ></div>
            </div>
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Create Order</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            // Step 1: Select Purchase Request
            <div className="space-y-6">
              {/* Branch Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Select Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select a branch</option>
                  {clinicBranches?.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select branch to view purchase requests
                </p>
              </div>

              {/* Purchase Request Selection */}
              {branchId && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-gray-900">
                      Select Purchase Request{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative w-64">
                      <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                      />
                      <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {purchaseRequestsLoading ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-600">
                        Loading purchase requests...
                      </p>
                    </div>
                  ) : purchaseRequests.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        No purchase requests found for this branch
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-800">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Order No
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Supplier
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Items
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {purchaseRequests
                              .filter(
                                (pr) =>
                                  !searchTerm ||
                                  pr.orderNo
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase()) ||
                                  pr.supplier?.name
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                              )
                              .map((pr) => (
                                <tr key={pr._id} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {pr.orderNo}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {pr.supplier?.name || "No supplier"}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {pr.items.length} items
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {new Date(
                                      pr.createdAt
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePurchaseRequestSelect(pr)
                                      }
                                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all"
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      Select
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Step 2: Create Purchase Order
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Purchase Request Info */}
              {selectedPurchaseRequest && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Converting Purchase Request:{" "}
                        {selectedPurchaseRequest.orderNo}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Supplier: {selectedPurchaseRequest.supplier?.name} |
                        Items: {selectedPurchaseRequest.items.length} | Date:{" "}
                        {new Date(
                          selectedPurchaseRequest.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Change Request
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields - Same as AddPurchaseOrderModal */}
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
                          (supplier) => supplier._id === formData.supplier
                        )?.name ||
                          selectedPurchaseRequest?.supplier?.name ||
                          "Select a supplier"}
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
                              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Suppliers List */}
                        {!suppliersLoading && suppliers.length > 0 && (
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
                  <div className="relative">
                    <input
                      type="text"
                      name="enqNo"
                      value={formData.enqNo}
                      readOnly
                      placeholder="Auto-generated from PR"
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
                      Supplier Invoice No{" "}
                      <span className="text-red-500">*</span>
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

              {/* Items Section - Updated to match image */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">
                        Purchase Order Items *
                      </h3>
                      <button
                        onClick={() => setIsOpenAddStockItemModal(true)}
                        className="flex items-center justify-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
                      >
                        <CirclePlus size={18} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Items from purchase request - you can edit them
                    </p>
                  </div>
                </div>

                {/* Item Form - Updated to match image */}
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
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Description
                      </label>
                      <input
                        type="text"
                        value={currentItem.description || ""}
                        onChange={(e) =>
                          handleCurrentItemChange("description", e.target.value)
                        }
                        placeholder="Enter Description"
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                        disabled={loading}
                      />
                    </div>

                    {/* Qty */}
                    <div className="sm:col-span-1 space-y-1">
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
                            parseFloat(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                        disabled={loading}
                        placeholder="1"
                      />
                    </div>

                    {/* UOM */}
                    <div className="sm:col-span-1 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        UoM
                      </label>
                      <select
                        value={currentItem.uom || ""}
                        onChange={(e) =>
                          handleCurrentItemChange("uom", e.target.value)
                        }
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                        disabled={loading}
                      >
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

                    {/* Price */}
                    <div className="sm:col-span-1 space-y-1">
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
                            parseFloat(e.target.value) || 0
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
                            e.target.value as "Fixed" | "Percentage"
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                        disabled={loading}
                      >
                        <option value="Fixed">Fixed</option>
                        <option value="Percentage">%</option>
                      </select>
                    </div>

                    {/* Discount */}
                    <div className="sm:col-span-1 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Disc.
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentItem.discount}
                        onChange={(e) =>
                          handleCurrentItemChange(
                            "discount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                        disabled={loading}
                        placeholder="0"
                      />
                    </div>

                    {/* VAT Percentage */}
                    <div className="sm:col-span-1 space-y-1">
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
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed h-10"
                        disabled={loading}
                        placeholder="0%"
                      />
                    </div>

                    {/* Free Qty */}
                    <div className="sm:col-span-1 space-y-1">
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
                            parseFloat(e.target.value) || 0
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
                          !currentItem.name.trim() ||
                          !currentItem.quantity ||
                          !currentItem.unitPrice
                        }
                        className="inline-flex items-center px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {/* Calculated Values */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Disc. Value
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currentItem.discountAmount || 0}
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        NET *
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currentItem.netPrice || 0}
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        VAT %
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${currentItem.vatPercentage || 0}%`}
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        VAT
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currentItem.vatAmount || 0}
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Net + VAT *
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={currentItem.netPlusVat || 0}
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-gray-900">
                        Free Qty / UoM
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${currentItem.freeQuantity || 0} ${
                          currentItem.freeUom || ""
                        }`}
                        className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Items Table - Updated to match image */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Sl No
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Description
                          </th>

                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            UoM
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Disc. Type
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Disc.
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            VAT Percentage
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Free Qty
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
                              colSpan={14}
                              className="px-3 py-8 text-sm text-center text-gray-500"
                            >
                              No Items Added
                            </td>
                          </tr>
                        ) : (
                          items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              {editingIndex === index ? (
                                <>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={editedItem?.name || ""}
                                      onChange={(e) =>
                                        handleEditChange("name", e.target.value)
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="text"
                                      value={editedItem?.description || ""}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>

                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={editedItem?.quantity || 1}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "quantity",
                                          parseFloat(e.target.value) || 1
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <select
                                      value={editedItem?.uom || "NOS"}
                                      onChange={(e) =>
                                        handleEditChange("uom", e.target.value)
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    >
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
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editedItem?.unitPrice || 0}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "unitPrice",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <select
                                      value={
                                        editedItem?.discountType || "Fixed"
                                      }
                                      onChange={(e) =>
                                        handleEditChange(
                                          "discountType",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    >
                                      <option value="Fixed">Fixed</option>
                                      <option value="Percentage">%</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editedItem?.discount || 0}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "discount",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editedItem?.vatPercentage || 0}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "vatPercentage",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={editedItem?.freeQuantity || 0}
                                      onChange={(e) =>
                                        handleEditChange(
                                          "freeQuantity",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className="w-full px-2 py-1 text-sm border border-gray-300 text-gray-500 rounded"
                                    />
                                  </td>

                                  <td className="px-3 py-2 text-sm">
                                    <div className="flex gap-2">
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
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
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
                                    {item.quantity}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.uom}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.unitPrice.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.discountType}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.discount?.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.vatPercentage}%
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-900">
                                    {item.freeQuantity || 0}
                                  </td>

                                  <td className="px-3 py-2 text-sm">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditing(index)}
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
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary */}
                {items.length > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">
                          Total Quantity
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {items.reduce((sum, item) => sum + item.quantity, 0)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totals.subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">
                          Total Discount
                        </p>
                        <p className="text-lg font-bold text-red-600">
                          -{totals.totalDiscount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Total VAT</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totals.totalVat.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                      <p className="text-sm text-gray-600">Grand Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {totals.grandTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3">
          {step === 1 ? (
            <>
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedPurchaseRequest) {
                    setStep(2);
                  }
                }}
                disabled={!selectedPurchaseRequest}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit as any}
                disabled={
                  loading ||
                  !formData.branch.trim() ||
                  !formData.supplier.trim() ||
                  !formData.date.trim() ||
                  !formData.type.trim() ||
                  (showSupplierInvoiceNo &&
                    !formData.supplierInvoiceNo.trim()) ||
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
                    Converting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Create Purchase Order
                  </>
                )}
              </button>
            </>
          )}
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

export default ConvertPurchaseRequestModal;
