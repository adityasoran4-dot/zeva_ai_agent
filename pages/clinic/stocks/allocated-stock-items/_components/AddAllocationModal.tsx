import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  PlusCircle,
  X,
  Search,
  ChevronDown,
  CheckCircle,
  Package,
  AlertCircle,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/helper";
import { PurchaseRecord } from "@/types/stocks";
import useAgents from "@/hooks/useAgents";

type PurchaseRecordType = "Purchase_Order";

type StockLocation = {
  _id: string;
  location: string;
  status: string;
};

// Updated to match the API expected structure
type AllocatedStockItem = {
  item: any;
  quantity: number;
  user: string;
  location: string;
  expiryDate?: string;
};

interface AddAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: unknown) => void;
}

const AddAllocationModal: React.FC<AddAllocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>(
    {},
  );

  const [selectedType, _setSelectedType] =
    useState<PurchaseRecordType>("Purchase_Order");
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [fetchRecordsLoading, setFetchRecordsLoading] =
    useState<boolean>(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [isRecordDropdownOpen, setIsRecordDropdownOpen] = useState(false);
  const recordDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<PurchaseRecord | null>(
    null,
  );

  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [defaultUserId, setDefaultUserId] = useState<string>("");
  const [defaultLocationId, setDefaultLocationId] = useState<string>("");
  const [defaultExpiryDate, setDefaultExpiryDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [allocations, setAllocations] = useState<
    Record<
      string,
      { userId: string; qty: number; locationId: string; expiryDate: string }[]
    >
  >({});

  const headers = useMemo(() => getAuthHeaders() || {}, []);
  const { state: staffState } = useAgents({ role: "doctorStaff" });
  const userOptions = useMemo(() => {
    const s = staffState.agents || [];
    return [...s];
  }, [staffState.agents]);

  const filteredRecords = useMemo(() => {
    const term = recordSearch.trim().toLowerCase();
    if (!term) return records;
    return records.filter((r) => {
      const order = r.orderNo?.toLowerCase() || "";
      const date = r.date?.toLowerCase() || "";
      return order.includes(term) || date.includes(term);
    });
  }, [records, recordSearch]);

  const fetchRecords = useCallback(
    async (page = 1) => {
      if (!isOpen) return;
      try {
        setFetchRecordsLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: page.toString(),
          type: selectedType,
          limit: "500",
          sortBy: "date",
          sortOrder: "desc",
          status: "Delivered",
          search: recordSearch,
        });
        const res = await axios.get(
          `/api/stocks/purchase-records?${params.toString()}`,
          {
            headers,
          },
        );
        let list: PurchaseRecord[] = res.data?.data?.records || [];
        setRecords(list);
      } catch (err: unknown) {
        const message =
          typeof err === "object" &&
          err &&
          "response" in err &&
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message
            ? (err as { response?: { data?: { message?: string } } }).response!
                .data!.message!
            : "Failed to fetch purchase records";
        setError(message);
        setRecords([]);
      } finally {
        setFetchRecordsLoading(false);
      }
    },
    [headers, selectedType, isOpen, recordSearch],
  );

  const fetchRecordDetail = useCallback(
    async (id: string) => {
      if (!id) return;
      try {
        setError(null);
        const res = await axios.get(`/api/stocks/purchase-records/${id}`, {
          headers,
        });
        const pr: PurchaseRecord = res.data?.data;
        setSelectedRecord(pr);
        setDefaultUserId(pr?.createdBy?._id || "");
        setDefaultExpiryDate(new Date().toISOString().split("T")[0]);
        const q: Record<string, number> = {};
        (pr.items || []).forEach((it) => {
          const key = it._id || it.itemId || "";
          if (key) q[key] = (it.quantity || 0) + (it.freeQuantity || 0);
        });
        setQuantities(q);
      } catch (err: unknown) {
        const message =
          typeof err === "object" &&
          err &&
          "response" in err &&
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message
            ? (err as { response?: { data?: { message?: string } } }).response!
                .data!.message!
            : "Failed to fetch record details";
        setError(message);
        setSelectedRecord(null);
      } finally {
      }
    },
    [headers],
  );

  const fetchLocations = useCallback(async () => {
    if (!isOpen) return;
    try {
      const res = await axios.get(`/api/stocks/locations`, { headers });
      const list: StockLocation[] = res.data?.locations || [];
      setLocations(list);
    } catch {
      setLocations([]);
    }
  }, [headers, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchRecords();
    fetchLocations();
  }, [isOpen, selectedType, fetchRecords, fetchLocations]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        recordDropdownRef.current &&
        !recordDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRecordDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  useEffect(() => {
    if (selectedRecordId) {
      fetchRecordDetail(selectedRecordId);
    } else {
      setSelectedRecord(null);
      setSelectedItemIds([]);
      setQuantities({});
      setAllocations({});
      setQuantityErrors({});
    }
  }, [selectedRecordId, fetchRecordDetail]);

  const validateItemQuantity = (
    key: string,
    qty: number,
    maxQty: number,
  ): boolean => {
    if (qty > maxQty) {
      setQuantityErrors((prev) => ({
        ...prev,
        [key]: `Cannot exceed available quantity (${maxQty})`,
      }));
      return false;
    } else if (qty <= 0) {
      setQuantityErrors((prev) => ({
        ...prev,
        [key]: "Quantity must be greater than 0",
      }));
      return false;
    } else {
      setQuantityErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      return true;
    }
  };

  const toggleItem = (key: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(key) ? prev.filter((id) => id !== key) : [...prev, key],
    );
  };

  const setItemQty = (key: string, qty: number, maxQty: number) => {
    const validQty = Math.max(0, qty);
    setQuantities((prev) => ({ ...prev, [key]: validQty }));
    validateItemQuantity(key, validQty, maxQty);
  };

  const computedQuantity = useMemo(() => {
    return selectedItemIds.reduce((sum, id) => {
      const splits = allocations[id] || [];
      const subtotal = splits.reduce((s, sp) => s + (sp.qty || 0), 0);
      return sum + subtotal;
    }, 0);
  }, [selectedItemIds, allocations]);

  const hasQuantityErrors = useMemo(() => {
    return Object.keys(quantityErrors).length > 0;
  }, [quantityErrors]);

  const resetAndClose = () => {
    setSelectedItemIds([]);
    setQuantities({});
    setSelectedRecordId("");
    setSelectedRecord(null);
    setRecordSearch("");
    setAllocations({});
    setQuantityErrors({});
    setError(null);
    onClose();
  };

  const addAllocationRow = (key: string) => {
    setAllocations((prev) => {
      const next = { ...prev };
      const list = next[key] ? [...next[key]] : [];
      const it =
        selectedRecord?.items?.find((i) => (i._id || i.itemId) === key) || null;
      const d = it?.expiryDate
        ? new Date(it.expiryDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      list.push({ userId: "", qty: 0, locationId: "", expiryDate: d });
      next[key] = list;
      return next;
    });
  };

  const removeAllocationRow = (key: string, idx: number) => {
    setAllocations((prev) => {
      const next = { ...prev };
      const list = next[key] ? [...next[key]] : [];
      next[key] = list.filter((_, i) => i !== idx);
      return next;
    });
  };

  const setAllocationField = (
    key: string,
    idx: number,
    field: "userId" | "qty" | "locationId" | "expiryDate",
    value: string | number,
    maxQty?: number,
  ) => {
    setAllocations((prev) => {
      const next = { ...prev };
      const list = next[key] ? [...next[key]] : [];
      if (!list[idx]) return prev;

      const newValue = field === "qty" ? Number(value) || 0 : String(value);

      // Validate split quantity
      if (field === "qty" && maxQty) {
        const totalOtherSplits = list.reduce(
          (sum, sp, i) => (i !== idx ? sum + (sp.qty || 0) : sum),
          0,
        );
        const newTotal =
          totalOtherSplits +
          (typeof newValue === "number"
            ? newValue
            : parseInt(newValue as string));

        if (newTotal > maxQty) {
          setQuantityErrors((prev) => ({
            ...prev,
            [key]: `Total allocated quantity (${newTotal}) exceeds available (${maxQty})`,
          }));
        } else {
          setQuantityErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
          });
        }
      }

      list[idx] = {
        ...list[idx],
        [field]: newValue,
      };
      next[key] = list;
      return next;
    });
  };

  const getTotalAllocatedForItem = (key: string): number => {
    const splits = allocations[key] || [];
    return splits.reduce((sum, sp) => sum + (sp.qty || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) {
      setError("Select a purchase record");
      return;
    }
    if (selectedItemIds.length === 0) {
      setError("Select at least one item");
      return;
    }

    // Check for quantity errors
    if (hasQuantityErrors) {
      setError("Please fix quantity errors before submitting");
      return;
    }

    const exceedItem = selectedItemIds.find((id) => {
      const item = selectedRecord.items?.find(
        (it) => (it._id || it.itemId) === id,
      );
      const selectedQty = quantities[id] || 0;
      const maxQty = (item?.quantity || 0) + (item?.freeQuantity || 0);
      return selectedQty > maxQty;
    });
    if (exceedItem) {
      setError(
        "Selected quantity exceeds available quantity in purchase order",
      );
      return;
    }

    // Validate split fields and auto-allocate remainder
    for (const id of selectedItemIds) {
      const splits = allocations[id] || [];
      const total = splits.reduce((s, sp) => s + (sp.qty || 0), 0);
      const target = quantities[id] || 0;
      if (total > target) {
        setError(
          "Total allocated quantity exceeds selected allocation quantity for an item",
        );
        return;
      }
      const hasInvalid = splits.some(
        (sp) => !sp.userId || !sp.locationId || !sp.expiryDate || sp.qty <= 0,
      );
      if (hasInvalid) {
        setError(
          "Each split must include user, location, expiry and a positive quantity",
        );
        return;
      }
      if (total < target) {
        if (!defaultUserId || !defaultLocationId || !defaultExpiryDate) {
          setError(
            "Remaining quantity detected. Select default user, location and expiry to auto-allocate remainder.",
          );
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const allocatedStockItems: AllocatedStockItem[] = [];
      for (const id of selectedItemIds) {
        const item = selectedRecord.items?.find(
          (it) => (it._id || it.itemId) === id,
        );
        const target = quantities[id] || 0;
        const splits = allocations[id] || [];
        let total = 0;
        for (const sp of splits) {
          allocatedStockItems.push({
            item,
            quantity: sp.qty || 0,
            user: sp.userId,
            location: sp.locationId,
            expiryDate: sp.expiryDate,
          });
          total += sp.qty || 0;
        }
        if (total < target) {
          allocatedStockItems.push({
            item,
            quantity: target - total,
            user: defaultUserId,
            location: defaultLocationId,
            expiryDate: defaultExpiryDate,
          });
        }
      }

      const payload = {
        allocatedStockItems,
        purchaseRecord: selectedRecord._id,
        allocatedBy: selectedRecord?.createdBy?._id || "",
        notes: `Allocated from ${selectedRecord.orderNo}`,
      };

      const res = await axios.post(
        `/api/stocks/allocated-stock-items/add`,
        payload,
        { headers },
      );

      // set records to empty array
      setRecords([]);
      onSuccess(res.data);
      resetAndClose();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? (err as { response?: { data?: { message?: string } } }).response!
              .data!.message!
          : "Failed to create allocation";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-8xl overflow-hidden flex flex-col h-[90vh]">
        {/* Fixed Header - Consistent with GRN modals */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Allocate Stock Items
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Move items from Purchase Order into Allocated stock
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            disabled={submitting}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {/* Source Info - Read-only like in EditGRNModal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Source Type
              </label>
              <div className="px-3 py-2.5 text-sm text-gray-600 bg-gray-50 border border-gray-300 rounded-lg">
                Purchase Order
              </div>
            </div>
          </div>

          {/* Purchase Record Dropdown - Similar to GRN modals */}
          <div className="space-y-2 relative" ref={recordDropdownRef}>
            <label className="block text-sm font-bold text-gray-900">
              Purchase Order <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => setIsRecordDropdownOpen(!isRecordDropdownOpen)}
              className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all flex items-center justify-between cursor-pointer bg-white hover:border-gray-400"
            >
              <span className="truncate">
                {selectedRecordId
                  ? records.find((r) => r._id === selectedRecordId)?.orderNo ||
                    "Select PO"
                  : "Select Purchase Order"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>

            {isRecordDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by order number or date..."
                      value={recordSearch}
                      onChange={(e) => setRecordSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                      autoFocus
                    />
                  </div>
                </div>

                {fetchRecordsLoading ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Loading...
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No purchase orders found
                  </div>
                ) : (
                  <ul className="py-1">
                    {filteredRecords.map((record) => (
                      <li
                        key={record._id}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedRecordId(record._id);
                          setIsRecordDropdownOpen(false);
                          setRecordSearch("");
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{record.orderNo}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {selectedRecord && (
            <div className="space-y-4">
              {/* Default Allocation (Used for remaining quantity) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Default User
                  </label>
                  <div className="relative">
                    <select
                      value={defaultUserId}
                      onChange={(e) => setDefaultUserId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    >
                      <option value="">
                        {selectedRecord?.createdBy?.name
                          ? `Select user (default: ${selectedRecord.createdBy.name})`
                          : "Select user"}
                      </option>
                      {userOptions.map((u: any) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Default Location
                  </label>
                  <select
                    value={defaultLocationId}
                    onChange={(e) => setDefaultLocationId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  >
                    <option value="">Select location</option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    Default Expiry
                  </label>
                  <input
                    type="date"
                    value={defaultExpiryDate}
                    onChange={(e) => setDefaultExpiryDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Selected {selectedItemIds.length} item
                    {selectedItemIds.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-sm font-bold text-blue-700">
                  Total Quantity: {computedQuantity}
                </div>
              </div>

              {/* Items Table - Similar to GRN modals */}
              <div className="border border-gray-200 text-gray-500 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={
                              selectedItemIds.length ===
                              (selectedRecord.items || []).length
                            }
                            onChange={() => {
                              const allKeys = (selectedRecord.items || [])
                                .map((it) => it._id || it.itemId || "")
                                .filter(Boolean);
                              if (selectedItemIds.length === allKeys.length) {
                                setSelectedItemIds([]);
                              } else {
                                setSelectedItemIds(allKeys);
                              }
                            }}
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Available Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Allocate Qty
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                          Allocations
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {(selectedRecord.items || []).map((it) => {
                        const key = it._id || it.itemId || "";
                        if (!key) return null;
                        const checked = selectedItemIds.includes(key);
                        const qty = quantities[key] ?? it.quantity ?? 1;
                        const maxQty =
                          (it.quantity || 0) + (it?.freeQuantity || 0);
                        const splits = allocations[key] || [];
                        const allocatedSum = getTotalAllocatedForItem(key);
                        const hasError = quantityErrors[key];
                        const isOverAllocated = allocatedSum > qty;

                        return (
                          <React.Fragment key={key}>
                            <tr className={checked ? "bg-blue-50/30" : ""}>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleItem(key)}
                                  className="rounded border-gray-300"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-sm text-gray-900">
                                  {it.code}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {it.name}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {it.quantity + (it?.freeQuantity || 0)}
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col">
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxQty}
                                    value={maxQty}
                                    onChange={(e) =>
                                      setItemQty(
                                        key,
                                        Number(e.target.value),
                                        maxQty,
                                      )
                                    }
                                    className={`w-24 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 ${
                                      hasError
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-300"
                                    }`}
                                    disabled={!checked}
                                  />
                                  {hasError && (
                                    <span className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {quantityErrors[key]}
                                    </span>
                                  )}
                                  <div className="text-[10px] text-gray-500 mt-1">
                                    Allocated: {allocatedSum} / {maxQty}, ({qty}
                                    -Qty and {it.freeQuantity || 0}-FreeQty)
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="space-y-3">
                                  {splits.map((sp, i) => (
                                    <div
                                      key={i}
                                      className="flex flex-wrap items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50"
                                    >
                                      <div className="flex-1 min-w-[200px]">
                                        <select
                                          value={sp.userId}
                                          onChange={(e) =>
                                            setAllocationField(
                                              key,
                                              i,
                                              "userId",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                                          disabled={!checked}
                                        >
                                          <option value="">Select user</option>
                                          {userOptions.map((u: any) => (
                                            <option key={u._id} value={u._id}>
                                              {u.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex-1 min-w-[200px]">
                                        <select
                                          value={sp.locationId}
                                          onChange={(e) =>
                                            setAllocationField(
                                              key,
                                              i,
                                              "locationId",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                                          disabled={!checked}
                                        >
                                          <option value="">
                                            Select location
                                          </option>
                                          {locations.map((l) => (
                                            <option key={l._id} value={l._id}>
                                              {l.location}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="min-w-[160px]">
                                        <input
                                          type="date"
                                          value={sp.expiryDate}
                                          onChange={(e) =>
                                            setAllocationField(
                                              key,
                                              i,
                                              "expiryDate",
                                              e.target.value,
                                            )
                                          }
                                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                                          disabled={!checked}
                                        />
                                      </div>
                                      <div className="w-24">
                                        <input
                                          type="number"
                                          min={0}
                                          max={qty}
                                          value={sp.qty}
                                          onChange={(e) =>
                                            setAllocationField(
                                              key,
                                              i,
                                              "qty",
                                              Number(e.target.value),
                                              maxQty,
                                            )
                                          }
                                          className={`w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 ${
                                            isOverAllocated
                                              ? "border-red-500"
                                              : "border-gray-300"
                                          }`}
                                          placeholder="Qty"
                                          disabled={!checked}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeAllocationRow(key, i)
                                        }
                                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                                        disabled={!checked}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => addAllocationRow(key)}
                                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                                    disabled={!checked}
                                  >
                                    <PlusCircle className="w-3 h-3" />
                                    Add Split
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </form>

        {/* Fixed Footer - Consistent with GRN modals */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={submitting}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              submitting ||
              !selectedRecord ||
              selectedItemIds.length === 0 ||
              computedQuantity === 0 ||
              hasQuantityErrors
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
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
                Allocating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Allocate Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAllocationModal;
