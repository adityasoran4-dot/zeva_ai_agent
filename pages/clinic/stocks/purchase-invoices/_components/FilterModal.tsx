"use client";
import React from "react";
import {
  X,
  Filter,
  Building,
  Tag,
  Calendar,
  FileText,
  User,
} from "lucide-react";
import useClinicBranches from "@/hooks/useClinicBranches";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  filterData: any;
  setFilterData: (f: any) => void;
  title?: string;
}

const FilterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApply,
  filterData,
  setFilterData,
  title = "Advanced Filter",
}) => {
  const { clinicBranches } = useClinicBranches();

  if (!isOpen) return null;

  const handleClear = () => {
    setFilterData({
      branch: "",
      supplier: "",
      invoiceNo: "",
      status: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleApply = () => {
    onApply(filterData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
        {/* Header - Indigo Gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Filter your purchase invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Branch Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  Branch
                </div>
              </label>
              <select
                value={filterData.branch || ""}
                onChange={(e) =>
                  setFilterData((prev: any) => ({
                    ...prev,
                    branch: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Branches</option>
                {clinicBranches?.map((b: any) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Supplier
                </div>
              </label>
              <input
                type="text"
                value={filterData.supplier || ""}
                onChange={(e) =>
                  setFilterData((prev: any) => ({
                    ...prev,
                    supplier: e.target.value,
                  }))
                }
                placeholder="Supplier ID or Name"
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Invoice No Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Invoice No
                </div>
              </label>
              <input
                type="text"
                value={filterData.invoiceNo || ""}
                onChange={(e) =>
                  setFilterData((prev: any) => ({
                    ...prev,
                    invoiceNo: e.target.value,
                  }))
                }
                placeholder="Invoice #"
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  Status
                </div>
              </label>
              <select
                value={filterData.status || ""}
                onChange={(e) =>
                  setFilterData((prev: any) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="Partly_Paid">Partly Paid</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Deleted">Deleted</option>
              </select>
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  From Date
                </div>
              </label>
              <input
                type="date"
                value={filterData.fromDate || ""}
                onChange={(e) =>
                  setFilterData((prev: any) => ({
                    ...prev,
                    fromDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  To Date
                </div>
              </label>
              <input
                type="date"
                value={filterData.toDate || ""}
                onChange={(e) =>
                  setFilterData((prev: any) => ({
                    ...prev,
                    toDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-indigo-500/20"
          >
            Clear Filters
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-indigo-500/20"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500/20"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
