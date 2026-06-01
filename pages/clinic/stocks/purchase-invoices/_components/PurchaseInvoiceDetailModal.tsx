"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getTokenByPath } from "@/lib/helper";
import {
  FileText,
  X,
  Calendar,
  Building,
  User,
  Hash,
  Tag,
  Package,
  AlertCircle,
  CreditCard,
  ChevronRight,
  Printer,
  Box,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
}

const PurchaseInvoiceDetailModal: React.FC<Props> = ({
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
          `/api/stocks/purchase-invoices/${record._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.data?.success) {
          const invoiceData = res.data.data;
          setData(invoiceData);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Partly_Paid":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Unpaid":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Deleted":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusDisplay = (status: string) => {
    return status ? status.replace(/_/g, " ") : "New";
  };

  const getLinkedGrns = () => {
    const list: any[] = [];
    if (Array.isArray(data?.grns)) list.push(...data.grns);
    return list;
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header - Dark Gradient */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Purchase Invoice Details
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
                {data && (
                  <>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        data.status || "New",
                      )}`}
                    >
                      {getStatusDisplay(data.status || "New")}
                    </span>
                    {data.invoiceNo && (
                      <>
                        <span>•</span>
                        <span className="text-gray-300">{data.invoiceNo}</span>
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
                Loading invoice details...
              </p>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-sm font-medium">
                No data available
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Unable to load invoice details
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
                        Invoice No
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {data.invoiceNo || data._id?.slice(-6) || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Invoice Date
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {formatDate(data.date)}
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
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Supplier
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {typeof data.supplier === "object"
                          ? data.supplier?.name || "N/A"
                          : data.supplier || "N/A"}
                      </p>
                      {typeof data.supplier === "object" &&
                        data.supplier?.mobile && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {data.supplier.mobile}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Supplier Invoice No
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {data.supplierInvoiceNo || "-"}
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
                        {getStatusDisplay(data.status || "New")}
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

              {/* Linked GRNs Card */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Box className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Linked GRNs
                  </h3>
                  <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    {getLinkedGrns().length} GRN
                    {getLinkedGrns().length !== 1 ? "s" : ""}
                  </span>
                </div>

                {getLinkedGrns().length > 0 ? (
                  <div className="space-y-3">
                    {getLinkedGrns().map((grn, index) => (
                      <div
                        key={(grn as any)?._id || index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="text-sm font-semibold text-gray-900">
                                  {typeof grn === "object"
                                    ? (grn as any).grnNo || "N/A"
                                    : (grn as string)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                    <Box className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No GRNs linked to this invoice
                    </p>
                  </div>
                )}
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

              {/* Items removed: PurchaseInvoice does not have item lines */}

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
                const printUrl = `/clinic/stocks/purchase-invoices/print-purchase-invoice?pinvId=${record._id}`;
                window.open(printUrl, "_blank", "noopener,noreferrer");
              }}
              className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-gray-800 rounded-lg hover:bg-gray-700 hover:border-gray-700 focus:ring-2 focus:ring-gray-700/20 transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseInvoiceDetailModal;
