import React from "react";
import { Supplier } from "@/types/stocks";
import {
  Building,
  X,
  Phone,
  Mail,
  Globe,
  MapPin,
  CreditCard,
  Calendar,
  User,
  FileText,
  Clock,
  DollarSign,
  Wallet,
  Receipt,
} from "lucide-react";

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  if (!isOpen || !supplier) return null;

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getBalanceColor = (balance: number | undefined) => {
    const amount = balance || 0;
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {supplier.name}
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(supplier.status)}`}
                >
                  {supplier.status || "N/A"}
                </span>
                <span>•</span>
                <span>Supplier Details</span>
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
                  <Building className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Basic Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Branch
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.branch?.name || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      VAT Registration
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.vatRegNo || "Not Provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Credit Days
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.creditDays || 0} Days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Phone className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Mobile
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.mobile || "Not Provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Telephone
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.telephone || "Not Provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Email
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.email || "Not Provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Globe className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Website
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.url ? (
                        <a
                          href={supplier.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {supplier.url}
                        </a>
                      ) : (
                        "Not Provided"
                      )}
                    </p>
                  </div>
                </div>

                {supplier.address && (
                  <div className="sm:col-span-2 flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg mt-1">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                        Address
                      </p>
                      <p className="text-sm text-gray-800">
                        {supplier.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Info Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Financial Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-50 rounded">
                      <DollarSign className="w-3 h-3 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      Opening Balance
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(supplier.openingBalance)}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${supplier.openingBalanceType === "Debit" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                    >
                      {supplier.openingBalanceType || "Credit"}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-50 rounded">
                      <Receipt className="w-3 h-3 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      Total Invoices
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(supplier.invoiceTotal)}
                  </p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-50 rounded">
                      <Wallet className="w-3 h-3 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      Total Paid
                    </p>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(supplier.totalPaid)}
                  </p>
                </div>

                <div className="sm:col-span-3 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-orange-50 rounded">
                      <DollarSign className="w-3 h-3 text-orange-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      Current Balance
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${getBalanceColor(supplier.totalBalance)}`}
                  >
                    {formatCurrency(supplier.totalBalance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {supplier.totalBalance && supplier.totalBalance > 0
                      ? "Supplier owes you money"
                      : supplier.totalBalance && supplier.totalBalance < 0
                        ? "You owe supplier money"
                        : "Balance settled"}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">
                  Additional Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {supplier.notes && (
                  <div className="sm:col-span-2">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {supplier.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Created By
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {supplier.createdBy || "System"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Created Date
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDate(supplier.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-800 font-medium">
                      {formatDate(supplier.updatedAt)}
                    </p>
                  </div>
                </div>
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
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-gray-800 rounded-lg hover:bg-gray-700 hover:border-gray-700 focus:ring-2 focus:ring-gray-700/20 transition-all duration-200 shadow-sm"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailModal;
