"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { PurchaseRecord, PurchaseRecordItem } from "@/types/stocks";
import useClinicBranches from "@/hooks/useClinicBranches";
import { getTokenByPath } from "@/lib/helper";
import { PlusCircle, X, ChevronDown, Search } from "lucide-react";
import useUoms from "@/hooks/useUoms";

interface AddGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGRN: (grnData: any) => void;
}

const AddGRNModal: React.FC<AddGRNModalProps> = ({
  isOpen,
  onClose,
  onAddGRN,
}) => {
  const { clinicBranches } = useClinicBranches();
  const token = getTokenByPath() || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPoDropdownOpen, setIsPoDropdownOpen] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseRecord[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [poSearch, setPoSearch] = useState("");
  const poDropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
    purchaseOrder: "",
    grnDate: new Date().toISOString().split("T")[0],
    supplierGRN: "",
    supplierGRNDate: new Date().toISOString().split("T")[0],
    notes: "",
    status: "New",
    orderCreditDays: "0",
  });

  const [items, setItems] = useState<PurchaseRecordItem[]>([]);
  const { uoms } = useUoms({ token, branchId: formData.branch });

  // Fetch purchase orders when branch changes
  useEffect(() => {
    if (formData.branch) {
      fetchPurchaseOrders();
    } else {
      setPurchaseOrders([]);
    }
  }, [formData.branch]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true);
      const response = await axios.get("/api/stocks/purchase-records", {
        params: {
          branch: formData.branch,
          type: "Purchase_Order",
          status: "Approved",
          limit: 1000,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPurchaseOrders(response.data?.data?.records || []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setPurchaseOrders([]);
    } finally {
      setLoadingPOs(false);
    }
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        poDropdownRef.current &&
        !poDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPoDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load items when PO is selected
  useEffect(() => {
    if (formData.purchaseOrder) {
      const selectedPO = purchaseOrders.find(
        (po) => po._id === formData.purchaseOrder
      );
      if (selectedPO && (selectedPO as any).items) {
        const poItems = (selectedPO as any).items || [];
        setItems(
          poItems.map((it: any) => ({
            ...it,
            expiryDate: new Date().toISOString().split("T")[0] || "",
            freeQuantityExpiryDate:
              new Date().toISOString().split("T")[0] || "",
            level0: {
              price: it.unitPrice || 0,
              uom: it.uom || "",
            },
            packagingStructure: {
              level1: {
                quantity:
                  it?.packagingStructure?.level1?.quantity || 0,
                price: it?.packagingStructure?.level1?.price || 0,
                uom: it?.packagingStructure?.level1?.uom || "",
              },
              level2: {
                quantity:
                  it?.packagingStructure?.level2?.quantity || 0,
                price: it?.packagingStructure?.level2?.price || 0,
                uom: it?.packagingStructure?.level2?.uom || "",
              },
            },
          }))
        );
      }
    } else {
      setItems([]);
    }
  }, [formData.purchaseOrder, purchaseOrders]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const recalcItem = (item: PurchaseRecordItem): PurchaseRecordItem => {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.unitPrice) || 0;
    const total = parseFloat((qty * unit).toFixed(2));
    const discVal =
      (item.discountType || "Fixed") === "Percentage"
        ? parseFloat(
            ((qty * unit * (Number(item.discount) || 0)) / 100).toFixed(2)
          )
        : Number(item.discount) || 0;
    const net = parseFloat((total - discVal).toFixed(2));
    const vatPct = Number(item.vatPercentage) || 0;
    const vatAmt =
      (item.vatType || "Exclusive") === "Exclusive"
        ? parseFloat(((net * vatPct) / 100).toFixed(2))
        : Number(item.vatAmount) || 0;
    const netVat = parseFloat((net + (vatAmt || 0)).toFixed(2));
    return {
      ...item,
      totalPrice: total,
      discountAmount: discVal,
      netPrice: net,
      vatAmount: vatAmt,
      netPlusVat: netVat,
    };
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseRecordItem,
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const parsed =
        field === "quantity" ||
        field === "unitPrice" ||
        field === "discount" ||
        field === "vatPercentage" ||
        field === "freeQuantity"
          ? parseFloat(value) || 0
          : value;
      const updated = recalcItem({ ...next[index], [field]: parsed });
      // derive base box price from netPlusVat / quantity, then sub-level prices
      const qtyBox = Number(updated.quantity || 0);
      const totalInc = Number(updated.netPlusVat || 0);
      const baseBoxPrice =
        qtyBox > 0 ? Number((totalInc / qtyBox).toFixed(4)) : Number(0);
      const l1Qty = Number(updated.packagingStructure?.level1?.quantity || 0);
      const l2Qty = Number(updated.packagingStructure?.level2?.quantity || 0);
      if (l1Qty > 0 && baseBoxPrice > 0) {
        const l1Price = Number((baseBoxPrice / l1Qty).toFixed(4));
        updated.packagingStructure = {
          ...(updated.packagingStructure || {}),
          level1: {
            ...(updated.packagingStructure?.level1 || {}),
            price: l1Price,
            uom: updated.packagingStructure?.level1?.uom || "",
          },
          level2: updated.packagingStructure?.level2,
        };
        if (l2Qty > 0) {
          const l2Price = Number((l1Price / l2Qty).toFixed(4));
          updated.packagingStructure = {
            ...(updated.packagingStructure || {}),
            level1: updated.packagingStructure?.level1,
            level2: {
              ...(updated.packagingStructure?.level2 || {}),
              price: l2Price,
              uom: updated.packagingStructure?.level2?.uom || "",
            },
          };
        }
      }
      next[index] = updated;
      return next;
    });
  };

  const handlePackagingChange = (
    index: number,
    level: 1 | 2,
    subField: "quantity" | "uom",
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      const parsed =
        subField === "quantity" ? Math.max(0, parseFloat(value) || 0) : value;
      const ps = { ...(item.packagingStructure || {}) };
      if (level === 1) {
        ps.level1 = {
          ...(ps.level1 || {}),
          [subField]: parsed,
        };
      } else {
        ps.level2 = {
          ...(ps.level2 || {}),
          [subField]: parsed,
        };
      }
      item.packagingStructure = ps;
      // recompute prices based on netPlusVat/quantity and sub-quantities
      const qtyBox = Number(item.quantity || 0);
      const totalInc = Number(item.netPlusVat || 0);
      const baseBoxPrice =
        qtyBox > 0 ? Number((totalInc / qtyBox).toFixed(4)) : Number(0);
      const l1Qty = Number(item.packagingStructure?.level1?.quantity || 0);
      const l2Qty = Number(item.packagingStructure?.level2?.quantity || 0);
      if (l1Qty > 0 && baseBoxPrice > 0) {
        const l1Price = Number((baseBoxPrice / l1Qty).toFixed(4));
        item.packagingStructure.level1 = {
          ...(item.packagingStructure.level1 || {}),
          price: l1Price,
        };
        if (l2Qty > 0) {
          const l2Price = Number((l1Price / l2Qty).toFixed(4));
          item.packagingStructure.level2 = {
            ...(item.packagingStructure.level2 || {}),
            price: l2Price,
          };
        }
      }
      next[index] = item;
      return next;
    });
  };
  const handleClose = () => {
    setFormData({
      branch: "",
      purchaseOrder: "",
      grnDate: new Date().toISOString().split("T")[0],
      supplierGRN: "",
      supplierGRNDate: new Date().toISOString().split("T")[0],
      notes: "",
      status: "New",
      orderCreditDays: "",
    });
    setItems([]);
    setPoSearch("");
    setIsPoDropdownOpen(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (
      !formData.branch.trim() ||
      !formData.purchaseOrder.trim() ||
      !formData.supplierGRN.trim()
    ) {
      setError("Branch, Purchase Order, and Supplier GRN are required");
      return;
    }

    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        branch: formData.branch,
        purchasedOrder: formData.purchaseOrder,
        grnDate: formData.grnDate,
        supplierInvoiceNo: formData.supplierGRN,
        supplierGrnDate: formData.supplierGRNDate,
        notes: formData.notes,
        status: formData.status,
        orderCreditDays: formData.orderCreditDays,
        items: items.map((it) => ({
          itemId: it.itemId,
          code: it.code,
          name: it.name,
          description: it.description,
          expiryDate: it.expiryDate ? new Date(it.expiryDate) : undefined,
          quantity: it.quantity,
          uom: it.uom,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          discount: it.discount,
          discountType: it.discountType,
          discountAmount: it.discountAmount,
          netPrice: it.netPrice,
          vatAmount: it.vatAmount,
          vatType: it.vatType,
          vatPercentage: it.vatPercentage,
          netPlusVat: it.netPlusVat,
          freeQuantity: it.freeQuantity,
          freeQuantityExpiryDate: it.freeQuantityExpiryDate
            ? new Date(it.freeQuantityExpiryDate)
            : undefined,
          level0: {
            price: it.unitPrice,
            uom: it.uom,
          },
          packagingStructure: {
            level1: {
              quantity: it.packagingStructure?.level1?.quantity || 0,
              price: it.packagingStructure?.level1?.price || 0,
              uom: it.packagingStructure?.level1?.uom || "",
            },
            level2: {
              quantity: it.packagingStructure?.level2?.quantity || 0,
              price: it.packagingStructure?.level2?.price || 0,
              uom: it.packagingStructure?.level2?.uom || "",
            },
          },
        })),
      };

      const response = await axios.post("/api/stocks/grns/add-grn", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onAddGRN(response.data);
      handleClose();
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Failed to add GRN. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedPO = purchaseOrders?.find(
    (po) => po._id === formData.purchaseOrder
  );
  const filteredPOs = purchaseOrders?.filter((po) =>
    po.orderNo?.toLowerCase().includes(poSearch.toLowerCase())
  );

  useEffect(() => {
    if (selectedPO) {
      setFormData((prev) => ({
        ...prev,
        orderCreditDays: selectedPO.paymentTermsDays || "0",
      }));
    }
  }, [selectedPO]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Add New GRN
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Create a new goods receipt note
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
                  {clinicBranches?.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Purchase Order */}
              <div className="space-y-2 relative" ref={poDropdownRef}>
                <label className="block text-sm font-bold text-gray-900">
                  Purchase Order <span className="text-red-500">*</span>
                </label>

                <div
                  onClick={() => setIsPoDropdownOpen(!isPoDropdownOpen)}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all flex items-center justify-between cursor-pointer bg-white hover:border-gray-400"
                >
                  <span>
                    {formData.purchaseOrder
                      ? selectedPO?.orderNo || "Select PO"
                      : "Select PO"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {isPoDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search POs..."
                          value={poSearch}
                          onChange={(e) => setPoSearch(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                          autoFocus
                        />
                      </div>
                    </div>

                    {loadingPOs && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Loading purchase orders...
                      </div>
                    )}

                    {!loadingPOs && (
                      <>
                        {filteredPOs.length === 0 ? (
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
                                    purchaseOrder: po._id,
                                    supplierGRN: po.supplierInvoiceNo || "",
                                  });
                                  setIsPoDropdownOpen(false);
                                  setPoSearch("");
                                }}
                              >
                                <div className="font-medium">{po.orderNo}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* GRN Date */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  GRN Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="grnDate"
                  value={formData.grnDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
              </div>

              {/* Supplier GRN */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Supplier GRN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplierGRN"
                  placeholder="Enter Supplier Invoice number"
                  value={formData.supplierGRN}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
              </div>

              {/* Supplier GRN Date */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Supplier GRN Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="supplierGRNDate"
                  value={formData.supplierGRNDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                  required
                />
              </div>

              {/* Order Credit Days */}
              {selectedPO && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Order Credit Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="orderCreditDays"
                    value={formData.orderCreditDays}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                    required
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2 col-span-full">
                <label className="block text-sm font-bold text-gray-900">
                  Notes
                </label>
                <textarea
                  name="notes"
                  placeholder="Enter any additional notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div className="border border-gray-200 text-gray-500 rounded-lg overflow-hidden">
                <div className="bg-blue-50 border-b border-blue-100 px-3 py-2 text-[11px] text-blue-800">
                  <div className="font-semibold">Instructions</div>
                  <div>
                    R.Qty: Received Box count. Net+VAT is total including VAT.
                    L1 Qty/UOM: Units per Box (e.g., PCS). L1 Price = (Net+VAT ÷ R.Qty) ÷ L1 Qty.
                    L2 Qty/UOM: Units per L1 unit (e.g., sub-PCS). L2 Price = L1 Price ÷ L2 Qty.
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Exp. Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          U.Price
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          D.Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Disc
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          VAT%
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          R.Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          UOM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Free Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Free Qty Exp. Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          NET
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          VAT
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Net+VAT
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          L1 Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          L1 UOM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          L1 Price
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          L2 Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          L2 UOM
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          L2 Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="px-3 py-2">
                            <div className="font-medium text-sm text-gray-900">
                              {item.code}
                            </div>
                            <div className="text-xs text-gray-600 uppercase">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={item.expiryDate || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "expiryDate",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.discountType || "Fixed"}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "discountType",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="Fixed">Fixed</option>
                              <option value="Percentage">Percentage</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.discount || 0}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "discount",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.vatPercentage || 0}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "vatPercentage",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.uom || ""}
                              onChange={(e) =>
                                handleItemChange(idx, "uom", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="">Select UOM</option>
                              {uoms?.map((u: any) => (
                                <option key={u._id} value={u.name}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.freeQuantity || 0}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "freeQuantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="date"
                              value={item.freeQuantityExpiryDate || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "freeQuantityExpiryDate",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.netPrice?.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.vatAmount?.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-bold">
                            {item.netPlusVat?.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.packagingStructure?.level1?.quantity || 0}
                              onChange={(e) =>
                                handlePackagingChange(
                                  idx,
                                  1,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.packagingStructure?.level1?.uom || ""}
                              onChange={(e) =>
                                handlePackagingChange(idx, 1, "uom", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="">Select UOM</option>
                              {uoms?.map((u: any) => (
                                <option key={u._id} value={u.name}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.packagingStructure?.level1?.price
                              ? item.packagingStructure.level1.price.toFixed(4)
                              : "-"}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              value={item.packagingStructure?.level2?.quantity || 0}
                              onChange={(e) =>
                                handlePackagingChange(
                                  idx,
                                  2,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={item.packagingStructure?.level2?.uom || ""}
                              onChange={(e) =>
                                handlePackagingChange(idx, 2, "uom", e.target.value)
                              }
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="">Select UOM</option>
                              {uoms?.map((u: any) => (
                                <option key={u._id} value={u.name}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.packagingStructure?.level2?.price
                              ? item.packagingStructure.level2.price.toFixed(4)
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={
              loading ||
              !formData.branch.trim() ||
              !formData.purchaseOrder.trim() ||
              !formData.supplierGRN.trim() ||
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Add GRN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGRNModal;
