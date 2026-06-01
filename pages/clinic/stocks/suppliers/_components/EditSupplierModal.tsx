import React, { useState, useEffect } from "react";
import { Edit3, X } from "lucide-react";
import axios from "axios";
import { Supplier } from "@/types/stocks";
import useClinicBranches from "@/hooks/useClinicBranches";

interface FormDataValues {
  branch: string;
  name: string;
  vatRegNo: string;
  telephone: string;
  mobile: string;
  email: string;
  url: string;
  creditDays: number;
  address: string;
  notes: string;
}

interface EditSupplierModalProps {
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (supplierData: Supplier) => void;
  supplierData?: Supplier | null;
}

const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  token,
  isOpen,
  onClose,
  onSuccess,
  supplierData,
}) => {
  const { clinicBranches } = useClinicBranches();
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataValues>({
    branch: "",
    name: "",
    vatRegNo: "",
    telephone: "",
    mobile: "",
    email: "",
    url: "",
    creditDays: 0,
    address: "",
    notes: "",
  });

  // Update local state when modal opens or supplierData changes
  useEffect(() => {
    if (isOpen && supplierData) {
      setFormData({
        branch: supplierData.branch?._id || "",
        name: supplierData.name || "",
        vatRegNo: supplierData.vatRegNo || "",
        telephone: supplierData.telephone || "",
        mobile: supplierData.mobile || "",
        email: supplierData.email || "",
        url: supplierData.url || "",
        creditDays: supplierData.creditDays || 0,
        address: supplierData.address || "",
        notes: supplierData.notes || "",
      });
    }
  }, [isOpen, supplierData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !supplierData?._id ||
      !formData.name.trim() ||
      !formData.branch.trim() ||
      formData.creditDays === undefined
    )
      return;

    try {
      setLoading(true);
      const { data } = await axios.put(
        `/api/stocks/suppliers/update-supplier/${supplierData._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data && data?.success) {
        onSuccess(data?.data);
        onClose();
        setFormData({
          branch: "",
          name: "",
          vatRegNo: "",
          telephone: "",
          mobile: "",
          email: "",
          url: "",
          creditDays: 0,
          address: "",
          notes: "",
        });
      }
    } catch (error: any) {
      console.error("Error updating supplier:", error?.message || "");
      // You might want to add toast/notification here
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      branch: "",
      name: "",
      vatRegNo: "",
      telephone: "",
      mobile: "",
      email: "",
      url: "",
      creditDays: 0,
      address: "",
      notes: "",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Edit Supplier
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Update supplier information
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* Branch/Category Selection - Select Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.branch}
                onChange={(e) =>
                  setFormData({ ...formData, branch: e.target.value })
                }
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              <p className="text-xs text-gray-500 mt-1">
                Select supplier branch or category
              </p>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="E.x: MedSupply Corporation"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a unique name for the supplier
              </p>
            </div>

            {/* VAT Registration Number Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                VAT Reg. No.
              </label>
              <input
                type="text"
                value={formData.vatRegNo}
                onChange={(e) =>
                  setFormData({ ...formData, vatRegNo: e.target.value })
                }
                placeholder="Enter VAT registration number"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                VAT registration number of the supplier
              </p>
            </div>

            {/* Telephone Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Telephone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) =>
                  setFormData({ ...formData, telephone: e.target.value })
                }
                placeholder="Enter telephone number"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supplier's telephone number
              </p>
            </div>

            {/* Mobile Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Mobile
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                placeholder="Enter mobile number"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mobile number of the contact person
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter supplier email"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supplier's contact email address
              </p>
            </div>

            {/* URL Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Website
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="Enter website URL"
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supplier's website URL
              </p>
            </div>

            {/* Credit Days Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Credit Days <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.creditDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    creditDays: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
                required
              >
                <option value="0">0 Days</option>
                <option value="7">7 Days</option>
                <option value="15">15 Days</option>
                <option value="30">30 Days</option>
                <option value="45">45 Days</option>
                <option value="60">60 Days</option>
                <option value="75">75 Days</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Credit days offered by the supplier
              </p>
            </div>

            {/* Address Field */}
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-bold text-gray-900">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Enter supplier address"
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
            </div>

            {/* Notes Field */}
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-bold text-gray-900">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Enter any additional notes"
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !formData.name?.trim() ||
              !formData.branch?.trim() ||
              formData.creditDays === undefined ||
              !supplierData?._id
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              <>
                <Edit3 className="w-4 h-4" />
                Update Supplier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSupplierModal;
