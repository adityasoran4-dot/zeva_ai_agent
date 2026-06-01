import React from "react";
import { X } from "lucide-react";
import useClinicBranches from "@/hooks/useClinicBranches";
import useSuppliers from "@/hooks/useSuppliers";

interface FilterData {
  branch: string;
  supplier: string;
  orderNo: string;
  fromDate: string;
  toDate: string;
  status: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterData) => void;
  filterData: FilterData;
  setFilterData: React.Dispatch<React.SetStateAction<FilterData>>;
  title?: string;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  filterData,
  setFilterData,
  title = "Advanced Filter",
}) => {
  const { clinicBranches } = useClinicBranches();
  const { suppliers } = useSuppliers({ branchId: filterData.branch });

  if (!isOpen) return null;

  const handleClear = () => {
    setFilterData({
      branch: "",
      supplier: "",
      orderNo: "",
      fromDate: "",
      toDate: "",
      status: "",
    });
  };

  const handleApply = () => {
    onApply(filterData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Filter your purchase records
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
                Branch
              </label>
              <select
                value={filterData.branch}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    branch: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Branches</option>
                {clinicBranches?.map((branch) => (
                  <option key={branch?._id} value={branch?._id}>
                    {branch?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Supplier
              </label>
              <select
                value={filterData.supplier}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    supplier: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                disabled={!filterData.branch}
              >
                <option value="">All Suppliers</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier?._id} value={supplier?._id}>
                    {supplier?.name}
                  </option>
                ))}
              </select>
              {!filterData.branch && (
                <p className="text-xs text-gray-500">Select branch first</p>
              )}
            </div>

            {/* Order Code Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Order Code
              </label>
              <input
                type="text"
                value={filterData.orderNo}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    orderNo: e.target.value,
                  }))
                }
                placeholder="Enter order code"
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                From Date
              </label>
              <input
                type="date"
                value={filterData.fromDate}
                onChange={(e) =>
                  setFilterData((prev) => ({
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
                To Date
              </label>
              <input
                type="date"
                value={filterData.toDate}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    toDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Status
              </label>
              <select
                value={filterData.status}
                onChange={(e) =>
                  setFilterData((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="New">New</option>
                <option value="Approved">Approved</option>
                <option value="Partly_Delivered">Partly Delivered</option>
                <option value="Delivered">Delivered</option>
                <option value="Partly_Invoiced">Partly Invoiced</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Deleted">Deleted</option>
                <option value="Converted_To_PO">Converted To PO</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
          >
            Clear Filters
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
