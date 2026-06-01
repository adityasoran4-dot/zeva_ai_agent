import React from "react";
import { PurchaseRecord } from "@/types/stocks";
import {
  FileText,
  X,
  Calendar,
  Building,
  Truck,
  CreditCard,
  User,
  MapPin,
  Phone,
  Mail,
  Tag,
  ShoppingCart,
  DollarSign,
  Percent,
  Hash,
  Gift,
  Printer,
} from "lucide-react";

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseRecord | null;
}

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
}) => {
  if (!isOpen || !purchaseOrder) return null;

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
      case "Partly_Delivered":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Delivered":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "Partly_Invoiced":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Invoiced":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Deleted":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Converted_To_PO":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Purchase_Order":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Purchase_Request":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Purchase_Invoice":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "GRN_Regular":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTotalAmount = () => {
    return purchaseOrder.items.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
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
                {purchaseOrder.orderNo}
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    purchaseOrder.status,
                  )}`}
                >
                  {purchaseOrder.status.replace(/_/g, " ")}
                </span>
                <span>•</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                    purchaseOrder.type,
                  )}`}
                >
                  {purchaseOrder.type.replace(/_/g, " ")}
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
                      Order Number
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {purchaseOrder.orderNo}
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
                      {formatDate(purchaseOrder.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Tag className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Type
                    </p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        purchaseOrder.type,
                      )}`}
                    >
                      {purchaseOrder.type.replace(/_/g, " ")}
                    </span>
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
                      {typeof purchaseOrder.branch === "object"
                        ? (purchaseOrder.branch as any).name
                        : purchaseOrder.branch || "N/A"}
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
                      {typeof purchaseOrder.supplier === "object"
                        ? (purchaseOrder.supplier as any).name
                        : purchaseOrder.supplier || "N/A"}
                    </p>
                  </div>
                </div>

                {purchaseOrder.enqNo && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Enquiry No
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {purchaseOrder.enqNo}
                      </p>
                    </div>
                  </div>
                )}

                {purchaseOrder.supplierInvoiceNo && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Supplier Invoice
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {purchaseOrder.supplierInvoiceNo}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {purchaseOrder.notes && (
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
                  {purchaseOrder.notes}
                </div>
              </div>
            )}

            {/* Contact Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ship To */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Truck className="w-4 h-4 text-orange-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Ship To
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">To</p>
                      <p className="text-sm font-medium text-gray-800">
                        {purchaseOrder.shipTo?.to || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-700">
                        {purchaseOrder.shipTo?.address || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Telephone</p>
                      <p className="text-sm text-gray-800">
                        {purchaseOrder.shipTo?.telephone || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-800">
                        {purchaseOrder.shipTo?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Bill To
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">To</p>
                      <p className="text-sm font-medium text-gray-800">
                        {purchaseOrder.billTo?.to || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-700">
                        {purchaseOrder.billTo?.address || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Telephone</p>
                      <p className="text-sm text-gray-800">
                        {purchaseOrder.billTo?.telephone || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-800">
                        {purchaseOrder.billTo?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info of Buyer */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Buyer Contact
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">To</p>
                      <p className="text-sm font-medium text-gray-800">
                        {purchaseOrder.contactInfoOfBuyer?.to || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm text-gray-700">
                        {purchaseOrder.contactInfoOfBuyer?.address || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Telephone</p>
                      <p className="text-sm text-gray-800">
                        {purchaseOrder.contactInfoOfBuyer?.telephone || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-800">
                        {purchaseOrder.contactInfoOfBuyer?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section - Enhanced with all item information */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Purchase Order Items
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Total Items: {purchaseOrder.items.length}</span>
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
                    {purchaseOrder.items.map((item, index) => (
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
                                {item.name.charAt(0)}
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
                            <span className="text-green-600 mr-1">AED</span>
                            {(item.unitPrice || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                          <div className="flex items-center">
                            <span className="text-green-600 mr-1">AED</span>
                            {(item.totalPrice || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center space-x-1">
                            <span>
                              {item.discount || 0}
                              {item.discountType === "Percentage" ? "%" : ""}
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
                            <span className="text-blue-600 mr-1">AED</span>
                            {(item.netPrice || item.totalPrice || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <span>{item.vatPercentage || 0}%</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          <div className="flex items-center">
                            <span className="text-orange-600 mr-1">AED</span>
                            {(item.vatAmount || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                          <div className="flex items-center">
                            <span className="text-purple-600 mr-1">AED</span>
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
                    ))}
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
                          {purchaseOrder.items
                            .reduce(
                              (sum, item) => sum + (item.totalPrice || 0),
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
                          {purchaseOrder.items
                            .reduce(
                              (sum, item) => sum + (item.discountAmount || 0),
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
                          {purchaseOrder.items
                            .reduce(
                              (sum, item) => sum + (item.vatAmount || 0),
                              0,
                            )
                            .toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                        <div className="flex items-center justify-end">
                          <span className="text-purple-600 mr-1">AED</span>
                          {purchaseOrder.items
                            .reduce(
                              (sum, item) =>
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
                            {purchaseOrder.items.reduce(
                              (sum, item) => sum + (item.freeQuantity || 0),
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
              // Open print page in new tab
              const printUrl = `/clinic/stocks/purchase-orders/print-purchase-order?poId=${purchaseOrder._id}`;
              window.open(printUrl, "_blank", "noopener,noreferrer");
              onClose();
            }}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-gray-800 rounded-lg hover:bg-gray-700 hover:border-gray-700 focus:ring-2 focus:ring-gray-700/20 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-center">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailModal;
