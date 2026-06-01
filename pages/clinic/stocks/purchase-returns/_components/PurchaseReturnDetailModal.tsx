import React from "react";
import {
  FileText,
  X,
  Calendar,
  Building,
  User,
  Tag,
  ShoppingCart,
  DollarSign,
  Percent,
  Hash,
  Gift,
  Printer,
} from "lucide-react";
import { PurchaseRecord } from "@/types/stocks";

interface PurchaseReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseReturn: any | null;
}

const PurchaseReturnDetailModal: React.FC<PurchaseReturnDetailModalProps> = ({
  isOpen,
  onClose,
  purchaseReturn,
}) => {
  console.log("Purchase Return Details:", purchaseReturn);
  if (!isOpen || !purchaseReturn) return null;

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "AED 0.00";
    return `AED ${amount.toFixed(2)}`;
  };

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
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Returned":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Deleted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTotalReturnedAmount = (purchasedOrder: PurchaseRecord) => {
    let sum = 0;
    for (let item of purchasedOrder.items || []) {
      sum += (item.netPrice || 0) + (item.vatAmount || 0);
    }
    return sum;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {purchaseReturn.purchaseReturnNo}
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                    purchaseReturn.status,
                  )}`}
                >
                  {String(purchaseReturn.status || "").replace(/_/g, " ")}
                </span>
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
                      Return Number
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {purchaseReturn.purchaseReturnNo}
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
                      {formatDate(
                        purchaseReturn.date || purchaseReturn.createdAt,
                      )}
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
                      {typeof purchaseReturn.branch === "object"
                        ? (purchaseReturn.branch as any).name
                        : purchaseReturn.branch || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Tag className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Purchase Order
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {purchaseReturn.purchasedOrder?.orderNo ||
                        purchaseReturn.purchasedOrder?._id?.substring(0, 8) ||
                        "N/A"}
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
                      {purchaseReturn.purchasedOrder?.supplier?.name ||
                        purchaseReturn.supplier?.name ||
                        "N/A"}
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
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        purchaseReturn.status,
                      )}`}
                    >
                      {String(purchaseReturn.status || "").replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {purchaseReturn.notes && (
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
                  {purchaseReturn.notes}
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Return Summary
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(
                      getTotalReturnedAmount(purchaseReturn.purchasedOrder) ||
                        0,
                    )}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">
                    Items Count
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {(purchaseReturn?.purchasedOrder?.items || []).length}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs font-medium text-orange-600 uppercase tracking-wider mb-1">
                    Created Date
                  </p>
                  <p className="text-lg font-bold text-orange-900">
                    {formatDate(purchaseReturn.createdAt)}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wider mb-1">
                    Updated Date
                  </p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatDate(purchaseReturn.updatedAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Items Section */}
            {purchaseReturn.purchasedOrder?.items &&
              purchaseReturn.purchasedOrder.items.length > 0 && (
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <ShoppingCart className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-800">
                        Order Items ({purchaseReturn.purchasedOrder?.orderNo})
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        Total Items:{" "}
                        {purchaseReturn.purchasedOrder.items.length}
                      </span>
                      <span className="font-bold text-gray-800">
                        AED{" "}
                        {purchaseReturn.purchasedOrder.items
                          .reduce(
                            (sum: number, item: any) =>
                              sum + (item.totalPrice || 0),
                            0,
                          )
                          .toFixed(2)}
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
                              <FileText className="w-4 h-4 mr-2 text-gray-500" />
                              Description
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
                              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                              Unit Price
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                              Total
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <Percent className="w-4 h-4 mr-2 text-gray-500" />
                              Discount
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                              Net Price
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <Percent className="w-4 h-4 mr-2 text-gray-500" />
                              VAT %
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                              VAT
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                              Net + VAT
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center">
                              <Gift className="w-4 h-4 mr-2 text-gray-500" />
                              Free Qty
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {purchaseReturn.purchasedOrder.items.map(
                          (item: any, index: number) => (
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
                                      {(item.name || "").charAt(0)}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                  {item.description || (
                                    <span className="text-gray-400 italic">
                                      No description
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {item.quantity}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.uom || "N/A"}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                <div className="flex items-center">
                                  <span className="text-green-600 mr-1">
                                    AED
                                  </span>
                                  {(item.unitPrice || 0).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                <div className="flex items-center">
                                  <span className="text-green-600 mr-1">
                                    AED
                                  </span>
                                  {(item.totalPrice || 0).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex items-center space-x-1">
                                  <span>
                                    {item.discount || 0}
                                    {item.discountType === "Percentage"
                                      ? "%"
                                      : ""}
                                  </span>
                                  {(item.discount || 0) > 0 && (
                                    <span className="text-xs text-gray-500">
                                      ({item.discountType})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                <div className="flex items-center">
                                  <span className="text-blue-600 mr-1">
                                    AED
                                  </span>
                                  {(
                                    item.netPrice ||
                                    item.totalPrice ||
                                    0
                                  ).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                <span>{item.vatPercentage || 0}%</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                                <div className="flex items-center">
                                  <span className="text-orange-600 mr-1">
                                    AED
                                  </span>
                                  {(item.vatAmount || 0).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                <div className="flex items-center">
                                  <span className="text-purple-600 mr-1">
                                    AED
                                  </span>
                                  {(
                                    item.netPlusVat ||
                                    (item.netPrice || item.totalPrice) +
                                      (item.vatAmount || 0) ||
                                    0
                                  ).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                <div className="flex items-center">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {item.freeQuantity || 0}
                                  </span>
                                  {(item.freeQuantity || 0) > 0 && item.uom && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      {item.uom}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-3 text-sm font-medium text-gray-700 text-right"
                          >
                            Order Totals:
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-green-600 mr-1">AED</span>
                              {purchaseReturn.purchasedOrder.items
                                .reduce(
                                  (sum: number, item: any) =>
                                    sum + (item.totalPrice || 0),
                                  0,
                                )
                                .toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            <span className="text-gray-500">Discounts:</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-blue-600 mr-1">AED</span>
                              {purchaseReturn.purchasedOrder.items
                                .reduce(
                                  (sum: number, item: any) =>
                                    sum + (item.discountAmount || 0),
                                  0,
                                )
                                .toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            <span className="text-gray-500">VAT:</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-orange-600 mr-1">AED</span>
                              {purchaseReturn.purchasedOrder.items
                                .reduce(
                                  (sum: number, item: any) =>
                                    sum + (item.vatAmount || 0),
                                  0,
                                )
                                .toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            <div className="flex items-center justify-end">
                              <span className="text-purple-600 mr-1">AED</span>
                              {purchaseReturn.purchasedOrder.items
                                .reduce(
                                  (sum: number, item: any) =>
                                    sum +
                                    (item.netPlusVat ||
                                      (item.netPrice || item.totalPrice) +
                                        (item.vatAmount || 0)),
                                  0,
                                )
                                .toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 text-right">
                            <div className="flex items-center justify-end">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {purchaseReturn.purchasedOrder.items.reduce(
                                  (sum: number, item: any) =>
                                    sum + (item.freeQuantity || 0),
                                  0,
                                )}{" "}
                                free
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-800/20 transition-all duration-200 shadow-sm"
          >
            Close
          </button>
          <button
            onClick={() => {
              const printUrl = `/clinic/stocks/purchase-returns/print-purchase-return/?prId=${purchaseReturn?._id}`;
              window.open(printUrl, "_blank", "noopener,noreferrer");
            }}
            className="px-4 py-2.5 text-sm flex items-center font-medium text-white bg-gray-800 border border-gray-800 rounded-lg hover:bg-gray-700 hover:border-gray-700 focus:ring-2 focus:ring-gray-700/20 transition-all duration-200 shadow-sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReturnDetailModal;
