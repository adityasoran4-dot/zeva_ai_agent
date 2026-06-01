import React, { useEffect, useMemo, useState, useRef } from "react";
import { Pencil, X, Search, ChevronDown } from "lucide-react";
import useClinicBranches from "@/hooks/useClinicBranches";
import useSuppliers from "@/hooks/useSuppliers";
import axios from "axios";
import { getTokenByPath, handleUpload } from "@/lib/helper";

type Props = {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  data: any | null;
  onSuccess: (data: any) => void;
};

type InvoiceFormData = {
  branch: string;
  supplier: string;
  supplierInvoiceNo: string;
  date: string;
  notes: string;
  status: string;
  attachmentUrl: string;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: string;
};

const EditPurchaseInvoiceModal: React.FC<Props> = ({
  token,
  isOpen,
  onClose,
  data,
  onSuccess,
}) => {
  console.log({ data });
  const { clinicBranches } = useClinicBranches();
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<InvoiceFormData>({
    branch: "",
    supplier: "",
    supplierInvoiceNo: "",
    date: "",
    notes: "",
    status: "New",
    attachmentUrl: "",
    paidAmount: 0,
    remainingAmount: 0,
    paymentMethod: "",
  });

  const [grns, setGrns] = useState<any[]>([]);
  const [selectedGrns, setSelectedGrns] = useState<string[]>([]);
  const [grnLoading, setGrnLoading] = useState(false);
  const [showEntries, setShowEntries] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const payableAmount = useMemo(() => {
    try {
      const map = new Map<string, any>();
      grns.forEach((g) => map.set(g._id, g));
      let sum = 0;
      selectedGrns.forEach((id) => {
        const g = map.get(id);
        if (!g) return;
        let totalOfPurchaseOrder = 0;
        g?.purchasedOrder?.items?.forEach((po: any) => {
          totalOfPurchaseOrder += Number(po?.netPlusVat || 0);
        });

        sum += totalOfPurchaseOrder;
      });
      return Number(sum.toFixed(2));
    } catch {
      return 0;
    }
  }, [grns, selectedGrns]);

  useEffect(() => {
    setFormData((prev) => {
      const next = { ...prev };
      if (prev.status === "Paid") {
        next.remainingAmount = 0;
        next.paidAmount = payableAmount;
      } else {
        const paid = Number(prev.paidAmount || 0);
        const clamped =
          isNaN(paid) || paid < 0
            ? 0
            : paid > payableAmount
              ? payableAmount
              : paid;
        next.paidAmount = clamped;
        const remaining = payableAmount - clamped;
        next.remainingAmount = remaining > 0 ? Number(remaining.toFixed(2)) : 0;
      }
      return next;
    });
  }, [payableAmount]);

  const { suppliers, loading: suppliersLoading } = useSuppliers({
    search: supplierSearch,
    branchId: formData.branch || "",
  });

  // Load invoice data when modal opens
  useEffect(() => {
    if (data && isOpen) {
      setFormData({
        branch: data?.branch?._id || data?.branch || "",
        supplier: data?.supplier?._id || data?.supplier || "",
        supplierInvoiceNo: data?.supplierInvoiceNo || "",
        date: data?.date
          ? new Date(data.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        notes: data?.notes || "",
        status: data?.status || "New",
        attachmentUrl: data?.attachmentUrl || "",
        paymentMethod: data?.paymentMethod || "",
        paidAmount: Number(data?.paidAmount || 0),
        remainingAmount: Number(data?.remainingAmount || 0),
      });

      // Load selected GRNs
      const selectedGrnIds = Array.isArray(data?.grns)
        ? data?.grns
            .map((g: any) => (typeof g === "object" ? g?._id : g))
            .filter(Boolean)
        : [];

      // If there's a primary GRN, include it too
      const primaryGrnId =
        typeof data?.grn === "object" ? data?.grn?._id : data?.grn;
      if (primaryGrnId && !selectedGrnIds.includes(primaryGrnId)) {
        selectedGrnIds.push(primaryGrnId);
      }

      setSelectedGrns(selectedGrnIds);
    }
  }, [data, isOpen]);

  // Fetch GRNs when branch or supplier changes
  useEffect(() => {
    const fetchGrns = async () => {
      try {
        if (!formData.branch) {
          setGrns([]);
          return;
        }
        setGrnLoading(true);
        const t = getTokenByPath();
        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("limit", showEntries);
        params.append("branch", formData.branch);
        const res = await axios.get(`/api/stocks/grns?${params.toString()}`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (res.data?.success) {
          let filteredGrns = res.data?.data?.records || [];
          // Filter by selected supplier
          if (formData.supplier) {
            filteredGrns = filteredGrns.filter(
              (grn: any) =>
                grn?.purchasedOrder?.supplier?._id === formData.supplier ||
                grn?.purchasedOrder?.supplier === formData.supplier,
            );
          }
          setGrns(filteredGrns || []);
        } else {
          setGrns([]);
        }
      } catch {
        setGrns([]);
      } finally {
        setGrnLoading(false);
      }
    };

    if (isOpen && formData.branch) {
      fetchGrns();
    }
  }, [formData.branch, formData.supplier, showEntries, isOpen]);

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
    setFormData((prev) => {
      const next = { ...prev };
      if (name === "status") {
        next.status = String(value);
        if (next.status === "Paid") {
          next.paidAmount = payableAmount;
          next.remainingAmount = 0;
        } else if (next.status === "Partly_Paid") {
          const clampedPaid =
            Number(prev.paidAmount || 0) > payableAmount
              ? payableAmount
              : Number(prev.paidAmount || 0) < 0
                ? 0
                : Number(prev.paidAmount || 0);
          next.paidAmount = clampedPaid;
          const remaining = payableAmount - clampedPaid;
          next.remainingAmount =
            remaining > 0 ? Number(remaining.toFixed(2)) : 0;
        } else {
          next.paidAmount = 0;
          next.remainingAmount = 0;
        }
        return next;
      }
      if (name === "paidAmount") {
        if (prev.status === "Paid") {
          next.paidAmount = payableAmount;
          next.remainingAmount = 0;
          return next;
        }
        const raw = Number(value);
        const clamped =
          isNaN(raw) || raw < 0 ? 0 : raw > payableAmount ? payableAmount : raw;
        next.paidAmount = clamped;
        const remaining = payableAmount - clamped;
        next.remainingAmount = remaining > 0 ? Number(remaining.toFixed(2)) : 0;
        return next;
      }
      // remainingAmount is always derived; ignore direct edits
      if (name === "remainingAmount") {
        return prev;
      }
      (next as any)[name] = value;
      return next;
    });
  };

  const toggleSelectGrn = (grnId: string) => {
    setSelectedGrns((prev) => {
      if (prev.includes(grnId)) {
        return prev.filter((id) => id !== grnId);
      } else {
        return [...prev, grnId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedGrns.length === grns.length) {
      setSelectedGrns([]);
    } else {
      setSelectedGrns(grns.map((g) => g._id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?._id) return;

    if (
      !formData.branch.trim() ||
      !formData.supplier.trim() ||
      selectedGrns.length === 0
    ) {
      setError("Please select branch, supplier and at least one GRN");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let payload: any = {
        branch: formData.branch,
        supplier: formData.supplier,
        grns: selectedGrns,
        supplierInvoiceNo: formData.supplierInvoiceNo,
        date: formData.date,
        notes: formData.notes,
        status: formData.status,
      };

      if (
        (formData.status === "Paid" || formData.status === "Partly_Paid") &&
        !formData.attachmentUrl
      ) {
        setError("Please upload an attachment for Paid/Partly Paid status");
        if (
          formData.status === "Paid" &&
          Number(formData.paidAmount || 0) !== payableAmount
        ) {
          setError(
            "For Paid status, the paid amount must equal the payable amount",
          );
          setLoading(false);
          return;
        }
        setLoading(false);
        return;
      }

      payload.attachmentUrl = formData.attachmentUrl || "";
      payload.paidAmount = Number(formData.paidAmount || 0);
      payload.remainingAmount = Number(formData.remainingAmount || 0);
      payload.paymentMethod = formData.paymentMethod || "";

      const res = await fetch(
        `/api/stocks/purchase-invoices/update/${data._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();

      if (result.success) {
        onSuccess(result.data);
        handleClose();
      } else {
        setError(result.message || "Failed to update purchase invoice");
      }
    } catch {
      setError("An error occurred while updating the purchase invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      branch: "",
      supplier: "",
      supplierInvoiceNo: "",
      date: "",
      notes: "",
      status: "New",
      attachmentUrl: data?.attachmentUrl || "",
      paidAmount: 0,
      remainingAmount: 0,
    });
    setSelectedGrns([]);
    setSupplierSearch("");
    setIsSupplierDropdownOpen(false);
    setGrns([]);
    setError(null);
    setAttachment(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Update Purchase Invoice
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Required fields are marked with *
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
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Fields - 2 Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Branch */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) =>
                      setFormData({ ...formData, branch: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                </div>

                {/* Supplier - Searchable Select */}
                <div className="space-y-1.5 relative" ref={supplierDropdownRef}>
                  <label className="block text-sm font-semibold text-gray-800">
                    Supplier Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all flex items-center justify-between cursor-pointer bg-white"
                      onClick={() =>
                        !loading &&
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
                              onChange={(e) =>
                                setSupplierSearch(e.target.value)
                              }
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
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        supplier: supplier._id,
                                      });
                                      setSelectedGrns([]);
                                      setIsSupplierDropdownOpen(false);
                                      setSupplierSearch("");
                                    }}
                                  >
                                    <div className="font-medium">
                                      {supplier.name}
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

                {/* Supplier Invoice */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">
                    Supplier Invoice <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="supplierInvoiceNo"
                    value={formData.supplierInvoiceNo}
                    onChange={handleInputChange}
                    placeholder="Enter supplier invoice number"
                    className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                    required
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-800">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                    required
                  >
                    <option value="New">New</option>
                    <option value="Partly_Paid">Partly Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Deleted">Deleted</option>
                  </select>
                </div>
              </div>
              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-800">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter Notes"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  disabled={loading}
                />
              </div>
            </div>

            {selectedGrns?.length > 0 &&
              (formData?.status === "Paid" ||
                formData?.status === "Partly_Paid") && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <div className="px-3 py-2.5 text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between">
                        <span className="font-semibold">Payable Amount</span>
                        <span className="font-bold">
                          {payableAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    {(formData.status === "Paid" ||
                      formData.status === "Partly_Paid") && (
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="block text-sm font-semibold text-gray-800">
                          Attachments (payment proofs, invoices){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          onChange={async (e) => {
                            const file =
                              (e.target.files && e.target.files[0]) || null;
                            setAttachment(file);
                            if (file) {
                              setUploading(true);
                              try {
                                const resData = await handleUpload(file);
                                if (resData?.success && resData?.url) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    attachmentUrl: resData.url,
                                  }));
                                } else {
                                  setError("Failed to upload attachment");
                                }
                              } catch {
                                setError("Failed to upload attachment");
                              } finally {
                                setUploading(false);
                              }
                            }
                          }}
                          className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={loading || uploading}
                          accept=".pdf,image/*"
                        />
                        {attachment && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            <div className="px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50 text-gray-700 flex items-center gap-2">
                              <span className="font-medium">
                                {attachment.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setAttachment(null)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        )}
                        {formData.attachmentUrl && (
                          <div className="mt-2 text-xs">
                            <a
                              href={formData.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View uploaded attachment
                            </a>
                          </div>
                        )}
                        {uploading && (
                          <div className="text-xs text-gray-500">
                            Uploading...
                          </div>
                        )}
                      </div>
                    )}
                    {(formData.status === "Paid" ||
                      formData.status === "Partly_Paid") && (
                      <div className="space-y-1.5 col-span-2">
                        <label className="block text-sm font-semibold text-gray-800">
                          Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="paymentMethod"
                          value={formData.paymentMethod || ""}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                          disabled={loading}
                        >
                          <option value="">Select method</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="Bank_Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Online">Online</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-800">
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        max={payableAmount}
                        name="paidAmount"
                        value={Number(formData.paidAmount || 0)}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                        disabled={loading || formData.status === "Paid"}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-800">
                        Remaining Amount
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        name="remainingAmount"
                        value={
                          formData.status === "Paid"
                            ? 0
                            : Number(formData.remainingAmount || 0)
                        }
                        onChange={() => {}}
                        className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                        disabled
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}

            {/* GRN Selection Table */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-800">
                  Select GRNs <span className="text-red-500">*</span>
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    value={showEntries}
                    onChange={(e) => setShowEntries(e.target.value)}
                    className="px-2 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={!formData.branch || grnLoading}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span className="text-sm text-gray-600">entries</span>
                </div>
              </div>

              {!formData.branch ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  Please select a branch to view GRNs
                </div>
              ) : grnLoading ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="inline-flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-gray-500"
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
                    Loading GRNs...
                  </div>
                </div>
              ) : grns.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  No GRNs found for this branch
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                selectedGrns.length === grns.length &&
                                grns.length > 0
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-gray-800 focus:ring-gray-800/20"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            GRN No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Order No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Disc
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Net
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            VAT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Net Plus VAT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grns.map((grn) => {
                          console.log({ data });
                          let total = 0;
                          let discount = 0;
                          let net = 0;
                          let vat = 0;
                          let netPlusVat = 0;
                          for (let item of grn?.purchasedOrder?.items || []) {
                            total += item?.totalPrice;
                            discount += item?.discountAmount || 0;
                            net += item?.netPrice || 0;
                            vat += item?.vatAmount || 0;
                            netPlusVat += item?.netPlusVat || 0;
                          }
                          // Payment due label calculation
                          const paymentTermsDays = Number(
                            grn?.orderCreditDays || 0,
                          );
                          const poDate = grn?.purchasedOrder?.date
                            ? new Date(grn.purchasedOrder.date)
                            : null;
                          let paymentLabel:
                            | "Due"
                            | "Partly Due"
                            | "Unpaid"
                            | "Paid"
                            | "Partly_Paid"
                            | null = "Unpaid";
                          if (poDate && paymentTermsDays > 0) {
                            const dueDate = new Date(poDate);
                            dueDate.setDate(
                              dueDate.getDate() + paymentTermsDays,
                            );
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            dueDate.setHours(0, 0, 0, 0);
                            const diffDays = Math.ceil(
                              (dueDate.getTime() - today.getTime()) /
                                (1000 * 60 * 60 * 24),
                            );
                            if (diffDays <= 0) {
                              paymentLabel = "Due";
                            }
                          }

                          let isIncludedGRN = data?.grns?.find(
                            (item: any) => item?._id === grn?._id,
                          );
                          if (isIncludedGRN) {
                            if (data?.status === "Paid") {
                              paymentLabel = "Paid";
                            } else if (data?.status === "Partly_Paid") {
                              paymentLabel = "Partly_Paid";
                            }
                          }

                          return (
                            <tr
                              key={grn._id}
                              className={`hover:bg-gray-50 cursor-pointer ${
                                selectedGrns.includes(grn._id)
                                  ? "bg-blue-50/50"
                                  : ""
                              }`}
                              onClick={() => toggleSelectGrn(grn._id)}
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedGrns.includes(grn._id)}
                                  onChange={() => toggleSelectGrn(grn._id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300 text-gray-800 focus:ring-gray-800/20"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {grn.grnNo || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {grn.grnDate
                                  ? new Date(grn.grnDate).toLocaleDateString(
                                      "en-GB",
                                    )
                                  : "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {grn.purchasedOrder?.orderNo || "N/A"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {total?.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {discount?.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {net?.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {vat?.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {netPlusVat?.toFixed(2) || "0.00"}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    grn.status === "Completed"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {grn.status || "New"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {paymentLabel === "Due" && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                                    Due
                                  </span>
                                )}

                                {paymentLabel === "Unpaid" && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 border border-gray-300 rounded-full">
                                    {paymentLabel}
                                  </span>
                                )}
                                {(paymentLabel === "Paid" ||
                                  paymentLabel === "Partly_Paid") && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-500 border border-green-300 rounded-full">
                                    {paymentLabel}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Showing 1 to {grns.length} of {grns.length} entries
                      {selectedGrns.length > 0 && (
                        <span className="ml-2 font-medium text-gray-900">
                          ({selectedGrns.length} selected)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.branch.trim() ||
              !formData.supplier.trim() ||
              !formData.supplierInvoiceNo.trim() ||
              !formData.date.trim() ||
              selectedGrns.length === 0 ||
              ((formData.status === "Paid" ||
                formData.status === "Partly_Paid") &&
                !formData.attachmentUrl)
            }
            className="px-5 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPurchaseInvoiceModal;
