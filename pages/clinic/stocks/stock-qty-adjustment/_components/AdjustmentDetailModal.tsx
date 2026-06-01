"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import {
  FileText,
  X,
  Calendar,
  Building,
  CreditCard,
  User,
  Hash,
  ShoppingCart,
  DollarSign,
  Tag,
  Package,
  AlertCircle,
  Printer,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
}

const AdjustmentDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  record,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!isOpen || !record?._id) return;
      try {
        setLoading(true);
        const token = getTokenByPath();
        const res = await axios.get(
          `/api/stocks/stock-qty-adjustment/${record._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.data?.success) {
          setData(res.data.data || null);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [isOpen, record]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "AED 0.00";
    return `AED ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Deleted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTotalAmount = () => {
    if (!data?.items) return 0;
    return data.items.reduce(
      (sum: number, item: any) => sum + (item.totalPrice || 0),
      0,
    );
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Stock Adjustment Details
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
                {data && (
                  <>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        data.status || "New",
                      )}`}
                    >
                      {data.status || "New"}
                    </span>
                    {data.adjustmentNo && (
                      <>
                        <span>•</span>
                        <span className="text-gray-300">
                          {data.adjustmentNo}
                        </span>
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600 text-sm">
                Loading adjustment details...
              </p>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-sm font-medium">
                No data available
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Unable to load adjustment details
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info Card */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Hash className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Adjustment No
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {data.adjustmentNo || record._id?.slice(-6) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Date
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {formatDate(data.date || data.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Building className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Branch
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {typeof data.branch === "object"
                          ? data.branch?.name || "N/A"
                          : data.branch || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Post A/c
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {data.postAc || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Tag className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Status
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          data.status || "New",
                        )}`}
                      >
                        {data.status || "New"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Created By
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {data.createdBy?.name || data.createdBy || "System"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {data.notes && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <FileText className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Notes
                    </h3>
                  </div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {data.notes}
                  </div>
                </div>
              )}

              {/* Items Section */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Adjustment Items
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Total Items: {data.items?.length || 0}</span>
                    <span className="font-bold text-gray-800">
                      {formatCurrency(getTotalAmount())}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Hash className="w-4 h-4 mr-2 text-gray-500" />
                            SI No
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <ShoppingCart className="w-4 h-4 mr-2 text-gray-500" />
                            Item Name
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Hash className="w-4 h-4 mr-2 text-gray-500" />
                            Code
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Hash className="w-4 h-4 mr-2 text-gray-500" />
                            Qty
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Tag className="w-4 h-4 mr-2 text-gray-500" />
                            UOM
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                            Expiry
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                            Cost Price
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                            Total
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.items?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-4 py-8 text-sm text-center text-gray-500"
                          >
                            No items found
                          </td>
                        </tr>
                      ) : (
                        data.items?.map((item: any, index: number) => (
                          <tr
                            key={index}
                            className="hover:bg-blue-50 transition-colors duration-150"
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {item.name?.charAt(0) || "?"}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name || "N/A"}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-500">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.code || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {item.quantity || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.uom || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {item.expiryDate
                                ? formatDate(item.expiryDate)
                                : "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                              <div className="flex items-center">
                                <span className="text-green-600 mr-1">AED</span>
                                {(item.costPrice || 0).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                              <div className="flex items-center">
                                <span className="text-green-600 mr-1">AED</span>
                                {(item.totalPrice || 0).toFixed(2)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {data.items?.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-3 text-sm font-medium text-gray-700 text-right"
                          >
                            Total Adjustment Value:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-green-600 mr-1">AED</span>
                              {getTotalAmount().toFixed(2)}
                            </div>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* System Information */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    System Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Created At
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDate(data.createdAt)}
                      {data.createdAt && (
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(data.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                  {data.updatedAt && data.updatedAt !== data.createdAt && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Last Updated
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {formatDate(data.updatedAt)}
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(data.updatedAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Record ID
                    </p>
                    <p className="text-xs text-gray-600 font-mono">
                      {record._id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-800/20 transition-all duration-200 shadow-sm"
          >
            Close
          </button>
          {data && (
            <button
              onClick={() => {
                // Open print view
                const printUrl = `/clinic/stocks/stock-qty-adjustment/print-stock-qty-adjustment/?sqaId=${record._id}`;
                window.open(printUrl, "_blank", "noopener,noreferrer");
              }}
              className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-gray-800 rounded-lg hover:bg-gray-700 hover:border-gray-700 focus:ring-2 focus:ring-gray-700/20 transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdjustmentDetailModal;
