import React from "react";
import {
  X,
  Info,
  Calendar,
  Building,
  User,
  Tag,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  ArrowRightLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  Hash,
  FileText,
  Printer,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transfer: any | null;
}

const DirectStockTransferDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  transfer,
}) => {
  const [expandedItems, setExpandedItems] = React.useState(false);
  const [showSummary, setShowSummary] = React.useState(true);

  if (!isOpen || !transfer) return null;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Transfered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "Deleted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "New":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "Transfered":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Cancelled":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "Deleted":
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const toggleItemsExpand = () => {
    setExpandedItems(!expandedItems);
  };

  const toggleSummary = () => {
    setShowSummary(!showSummary);
  };

  const itemCount = transfer?.items?.length || 0;
  const totalQuantity =
    transfer?.items?.reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0,
    ) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {transfer?.directStockTransferNo || "Direct Stock Transfer"}
              </h2>
              <p className="text-indigo-200 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                    transfer?.status,
                  )} flex items-center gap-1`}
                >
                  {getStatusIcon(transfer?.status)}
                  {String(transfer?.status || "").replace(/_/g, " ")}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-indigo-500/20 text-indigo-100 border-indigo-400/30">
                  Direct Transfer
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
            {/* Summary Toggle Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Transfer Summary
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Quick overview of this direct stock transfer
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleSummary}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showSummary ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {showSummary && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Package className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Total Items
                        </p>
                        <p className="text-xl font-bold text-gray-800">
                          {itemCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <ShoppingCart className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Total Quantity
                        </p>
                        <p className="text-xl font-bold text-gray-800">
                          {totalQuantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Transfer Date
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {formatShortDate(
                            transfer?.date || transfer?.createdAt,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Transfer Mode
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          Direct
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Transfer Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Hash className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Transfer Number
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {transfer?.directStockTransferNo || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Status
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          transfer?.status,
                        )} flex items-center gap-1`}
                      >
                        {getStatusIcon(transfer?.status)}
                        {String(transfer?.status || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Transfer Date
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDate(transfer?.date || transfer?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Created By
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {transfer?.createdBy?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Branches Info Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Branch Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* From Branch */}
                <div className="bg-white rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700">
                      From Branch
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Branch Name
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {transfer?.fromBranch?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Branch ID
                      </p>
                      <p className="text-xs font-mono text-gray-600">
                        {transfer?.fromBranch?._id
                          ? transfer?.fromBranch._id.substring(0, 8)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* To Branch */}
                <div className="bg-white rounded-lg border border-green-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Building className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-700">
                      To Branch
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Branch Name
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {transfer?.toBranch?.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Branch ID
                      </p>
                      <p className="text-xs font-mono text-gray-600">
                        {transfer?.toBranch?._id
                          ? transfer?.toBranch._id.substring(0, 8)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer Direction Visualization */}
              <div className="mt-6 flex items-center justify-center">
                <div className="relative flex items-center justify-center w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 border-dashed"></div>
                  </div>
                  <div className="relative flex items-center bg-white px-4">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg">
                      <ArrowRightLeft className="w-5 h-5 text-white" />
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Transfer Direction
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {transfer?.notes && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Additional Notes
                  </h3>
                </div>
                <div className="text-sm text-gray-700 bg-gray-50/50 rounded-lg p-4 border border-gray-200 whitespace-pre-wrap">
                  {transfer?.notes}
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <div
                onClick={toggleItemsExpand}
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Transfer Items
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {itemCount} item{itemCount !== 1 ? "s" : ""} •{" "}
                      {totalQuantity} total units
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    Click to {expandedItems ? "collapse" : "expand"}
                  </span>
                  {expandedItems ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedItems && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            S.No
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Item Name
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4" />
                            Quantity
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            UOM
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transfer?.items?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Package className="w-8 h-8 text-gray-300" />
                              <p className="text-sm font-medium">
                                No items to transfer
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        transfer?.items?.map((item: any, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="px-6 py-3 text-gray-700 font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {(item.name || "?").charAt(0)}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-800">
                                  {item.name || "-"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-gray-600 max-w-xs">
                              {item.description || (
                                <span className="text-gray-400 italic">
                                  No description
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3">
                              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                                {item.quantity || 0}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              {item.uom ? (
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
                                  {item.uom}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-3 text-right font-medium text-gray-700"
                        >
                          Total:
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm font-bold">
                            {totalQuantity}
                          </span>
                        </td>
                        <td className="px-6 py-3"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Metadata Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  System Information
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Created By
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {transfer?.createdBy?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Created Date
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(transfer?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Last Updated
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {formatDate(transfer?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Last updated: {formatDate(transfer?.updatedAt)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:ring-2 focus:ring-gray-800/20 transition-all duration-200 shadow-sm"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700 hover:border-indigo-700 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectStockTransferDetailModal;
