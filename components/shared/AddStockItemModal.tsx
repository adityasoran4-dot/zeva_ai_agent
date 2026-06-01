import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, X, Search, ChevronDown } from "lucide-react";
// import useClinicBranches from "@/hooks/useClinicBranches";
import useLocations from "@/hooks/useLocations";
import useUoms from "@/hooks/useUoms";
import { handleUpload } from "@/lib/helper";
import useClinicBranches from "@/hooks/useClinicBranches";

interface StockItem {
  _id?: string;
  clinicId: string;
  name: string;
  description?: string;
  code?: string;
  type: "Stock" | "Service" | "Fixed_Asset";
  location: string;
  brand?: string;
  dosage?: string;
  strength?: string;
  status: "Active" | "Inactive";
  vatPercentage: number;
  minQuantity: number;
  maxQuantity: number;
  level0: {
    costPrice: number;
    uom: string;
    salePrice: number;
  };
  packagingStructure: {
    level1: {
      multiplier: number;
      costPrice: number;
      uom: string;
      salePrice: number;
    };
    level2: {
      multiplier: number;
      costPrice: number;
      uom: string;
      salePrice: number;
    };
  };
  imageUrl?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AddStockItemModalProps {
  token: string;
  clinicId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: StockItem) => void;
}

const AddStockItemModal: React.FC<AddStockItemModalProps> = ({
  token,
  clinicId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { clinicBranches } = useClinicBranches();
  const [locationSearch, setLocationSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Form state - corrected to match API model
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: "",
    type: "Stock" as "Stock" | "Service" | "Fixed_Asset",
    location: "",
    brand: "",
    dosage: "",
    strength: "",
    status: "Active" as "Active" | "Inactive",
    vatPercentage: 0,
    minQuantity: 0,
    maxQuantity: 0,
    level0: {
      costPrice: 0,
      uom: "",
      salePrice: 0,
    },
    packagingStructure: {
      level1: {
        multiplier: 1,
        costPrice: 0,
        uom: "",
        salePrice: 0,
      },
      level2: {
        multiplier: 1,
        costPrice: 0,
        uom: "",
        salePrice: 0,
      },
    },
    imageUrl: "",
  });

  const { locations, loading: locationsLoading } = useLocations({
    token,
    clinicId: clinicId || clinicBranches?.[0]?._id,
    search: locationSearch,
  });
  const { uoms } = useUoms({ token, branchId: clinicId });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    // Handle deeply nested objects
    if (name.includes(".")) {
      const path = name.split(".");
      if (path.length === 2) {
        const [parent, child] = path;
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]:
              child === "multiplier" ||
              child === "costPrice" ||
              child === "salePrice" ||
              child === "vatPercentage" ||
              child === "minQuantity" ||
              child === "maxQuantity"
                ? parseFloat(value) || 0
                : value,
          },
        }));
      } else if (path.length === 3) {
        const [parent, subParent, child] = path;
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [subParent]: {
              ...(prev as any)[parent][subParent],
              [child]:
                child === "multiplier" ||
                child === "costPrice" ||
                child === "salePrice"
                  ? parseFloat(value) || 0
                  : value,
            },
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "vatPercentage" ||
          name === "minQuantity" ||
          name === "maxQuantity"
            ? parseFloat(value) || 0
            : value,
      }));
    }
  };

  const handleLevel0Change = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      level0: {
        ...prev.level0,
        [field]:
          field === "costPrice" || field === "salePrice"
            ? parseFloat(value) || 0
            : value,
      },
    }));
  };

  // Auto-calculate level1 sale price based on multiplier
  const handleLevel1MultiplierChange = (multiplier: number) => {
    setFormData((prev) => ({
      ...prev,
      packagingStructure: {
        ...prev.packagingStructure,
        level1: {
          ...prev.packagingStructure.level1,
          multiplier: multiplier,
          costPrice: prev.level0.costPrice / multiplier,
          salePrice: prev.level0.salePrice / multiplier,
        },
      },
    }));
  };

  // Auto-calculate level2 sale price based on multiplier
  const handleLevel2MultiplierChange = (multiplier: number) => {
    setFormData((prev) => ({
      ...prev,
      packagingStructure: {
        ...prev.packagingStructure,
        level2: {
          ...prev.packagingStructure.level2,
          multiplier: multiplier,
          costPrice: prev.packagingStructure.level1.costPrice / multiplier,
          salePrice: prev.packagingStructure.level1.salePrice / multiplier,
        },
      },
    }));
  };

  // Handle file upload for item image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Here you would typically upload to your server/cloud storage
    const allowedFormats = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedFormats.includes(file.type)) {
      setError("Only JPG, PNG, and GIF formats are allowed");
      return;
    }

    try {
      const result = await handleUpload(file);

      if (result?.success && result?.url) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: result.url,
        }));
      } else {
        setError("Failed to upload image");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Error uploading image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location.trim() || !formData.name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare the payload - match API expected format
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        code: formData.code.trim(),
        type: formData.type,
        location: formData.location,
        brand: formData.brand.trim(),
        dosage: formData.dosage.trim(),
        strength: formData.strength.trim(),
        status: formData.status,
        vatPercentage: formData.vatPercentage,
        minQuantity: formData.minQuantity,
        maxQuantity: formData.maxQuantity,
        level0: {
          costPrice: formData.level0.costPrice,
          uom: formData.level0.uom.trim(),
          salePrice: formData.level0.salePrice,
        },
        packagingStructure: {
          level1: {
            multiplier: formData.packagingStructure.level1.multiplier,
            costPrice: formData.packagingStructure.level1.costPrice,
            uom: formData.packagingStructure.level1.uom.trim(),
            salePrice: formData.packagingStructure.level1.salePrice,
          },
          level2: {
            multiplier: formData.packagingStructure.level2.multiplier,
            costPrice: formData.packagingStructure.level2.costPrice,
            uom: formData.packagingStructure.level2.uom.trim(),
            salePrice: formData.packagingStructure.level2.salePrice,
          },
        },
        imageUrl: formData.imageUrl.trim(),
      };

      const response = await fetch("/api/stocks/stock-items/add-stock-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.data);
        handleClose();
      } else {
        // Handle validation errors
        if (result.errors && Array.isArray(result.errors)) {
          setError(result.errors.join(", "));
        } else {
          setError(result.message || "Failed to add stock item");
        }
      }
    } catch (err) {
      console.error("Error adding stock item:", err);
      setError("An error occurred while adding the stock item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      code: "",
      type: "Stock",
      location: "",
      brand: "",
      dosage: "",
      strength: "",
      status: "Active",
      vatPercentage: 0,
      minQuantity: 0,
      maxQuantity: 0,
      level0: {
        costPrice: 0,
        uom: "",
        salePrice: 0,
      },
      packagingStructure: {
        level1: {
          multiplier: 1,
          costPrice: 0,
          uom: "",
          salePrice: 0,
        },
        level2: {
          multiplier: 1,
          costPrice: 0,
          uom: "",
          salePrice: 0,
        },
      },
      imageUrl: "",
    });
    setLocationSearch("");
    setIsLocationDropdownOpen(false);
    setError(null);
    onClose();
  };

  useEffect(() => {
    // update level1 and level2 prices when level0 prices change
    setFormData((prev) => ({
      ...prev,
      packagingStructure: {
        level1: {
          ...prev.packagingStructure.level1,
          costPrice:
            prev.level0.costPrice / prev.packagingStructure.level1.multiplier,
          salePrice:
            prev.level0.salePrice / prev.packagingStructure.level1.multiplier,
        },
        level2: {
          ...prev.packagingStructure.level2,
          costPrice:
            prev.packagingStructure.level1.costPrice /
            prev.packagingStructure.level2.multiplier,
          salePrice:
            prev.packagingStructure.level1.salePrice /
            prev.packagingStructure.level2.multiplier,
        },
      },
    }));
  }, [
    formData.level0.costPrice,
    formData.level0.salePrice,
    formData.packagingStructure.level1.multiplier,
    formData.packagingStructure.level2.multiplier,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-white" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Add New Stock Item
              </h2>
              <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5">
                Create a new stock item
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:bg-white/20 rounded p-1.5 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Code/Barcode, Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code/Barcode */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Code/Barcode
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Ex: MED001"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                  required
                >
                  <option value="Stock">Stock</option>
                  <option value="Service">Service</option>
                  <option value="Fixed_Asset">Fixed Asset</option>
                </select>
              </div>
            </div>

            {/* Row 2: Name, Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Paracetamol 500mg"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2 text-gray-500">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-900">
                    Location <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="relative" ref={locationDropdownRef}>
                  <div
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800 cursor-pointer bg-white"
                    onClick={() =>
                      setIsLocationDropdownOpen(!isLocationDropdownOpen)
                    }
                  >
                    <span
                      className={
                        formData.location ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {locations?.find((loc) => loc._id === formData.location)
                        ?.location || "Please Select"}
                    </span>
                    <ChevronDown
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                        isLocationDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isLocationDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 text-gray-500 rounded-lg shadow-lg">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search locations..."
                            value={locationSearch}
                            onChange={(e) => setLocationSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {locationsLoading ? (
                          <div className="p-4 text-center text-sm">
                            Loading...
                          </div>
                        ) : locations.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No locations found
                          </div>
                        ) : (
                          <ul className="py-1">
                            {locations.map((location) => (
                              <li
                                key={location._id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    location: location._id,
                                  }));
                                  setIsLocationDropdownOpen(false);
                                }}
                              >
                                {location.location}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: Brand, Dosage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Ex: Generic"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                />
              </div>

              {/* Dosage */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Dosage
                </label>
                <input
                  type="text"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  placeholder="Ex: 500mg"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Row 4: Strength, VAT Percentage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strength */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Strength
                </label>
                <input
                  type="text"
                  name="strength"
                  value={formData.strength}
                  onChange={handleInputChange}
                  placeholder="Ex: Tablet"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                />
              </div>

              {/* VAT Percentage */}
              {/* <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  VAT % <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="vatPercentage"
                  value={formData.vatPercentage}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                  required
                />
              </div> */}
            </div>

            {/* Row 5: Min Qty, Max Qty */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Min Qty <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="minQuantity"
                  value={formData.minQuantity}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500  rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-900">
                  Max Qty <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="maxQuantity"
                  value={formData.maxQuantity}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                  disabled={loading}
                  required
                />
              </div>
            </div> */}

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-900">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Item description..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                disabled={loading}
              />
            </div>

            {/* Level 0 Detail Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Level 0 Detail (Base Unit)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    UOM
                  </label>
                  <select
                    value={formData.level0.uom}
                    onChange={(e) => handleLevel0Change("uom", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  >
                    <option value="">Select UOM</option>
                    {uoms.map((uom) => (
                      <option key={uom._id} value={uom.name}>
                        {uom.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    value={formData.level0.costPrice}
                    onChange={(e) =>
                      handleLevel0Change("costPrice", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    value={formData.level0.salePrice}
                    onChange={(e) =>
                      handleLevel0Change("salePrice", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* M Factor #1 & Level 1 Detail */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    M Factor #1
                  </label>
                  <input
                    type="number"
                    name="packagingStructure.level1.multiplier"
                    value={formData.packagingStructure.level1.multiplier}
                    onChange={(e) =>
                      handleLevel1MultiplierChange(
                        parseFloat(e.target.value) || 1,
                      )
                    }
                    placeholder="1"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Level 1 UOM
                  </label>
                  <select
                    name="packagingStructure.level1.uom"
                    value={formData.packagingStructure.level1.uom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  >
                    <option value="">Select UOM</option>
                    {uoms.map((uom) => (
                      <option key={uom._id} value={uom.name}>
                        {uom.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    name="packagingStructure.level1.costPrice"
                    value={formData.packagingStructure.level1.costPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={true}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    name="packagingStructure.level1.salePrice"
                    value={formData.packagingStructure.level1.salePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            {/* M Factor #2 & Level 2 Detail */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-900">
                    M Factor #2
                  </label>
                  <input
                    type="number"
                    name="packagingStructure.level2.multiplier"
                    value={formData.packagingStructure.level2.multiplier}
                    onChange={(e) =>
                      handleLevel2MultiplierChange(
                        parseFloat(e.target.value) || 1,
                      )
                    }
                    placeholder="1"
                    min="1"
                    step="1"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Level 2 UOM
                  </label>
                  <select
                    name="packagingStructure.level2.uom"
                    value={formData.packagingStructure.level2.uom}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={loading}
                  >
                    <option value="">Select UOM</option>
                    {uoms.map((uom) => (
                      <option key={uom._id} value={uom.name}>
                        {uom.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    name="packagingStructure.level2.costPrice"
                    value={formData.packagingStructure.level2.costPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={true}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sale Price
                  </label>
                  <input
                    type="number"
                    name="packagingStructure.level2.salePrice"
                    value={formData.packagingStructure.level2.salePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
                    disabled={true}
                  />
                </div>
              </div>
            </div>

            {/* Item Image */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Item Image
              </h3>
              <div className="space-y-4">
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">Choose Item Image</p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="item-image-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="item-image-upload"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                  >
                    Browse
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Allowed format .jpg .png .gif
                  </p>
                </div>
                {formData.imageUrl && (
                  <div className="text-center">
                    <img
                      src={formData.imageUrl}
                      alt="Item preview"
                      className="h-32 mx-auto rounded-lg border border-gray-300"
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        {/* Action Buttons */}
        <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={
              loading || !formData.name || !formData.location || !formData.type
              // !formData.vatPercentage ||
              // !formData.minQuantity ||
              // !formData.maxQuantity
            }
            className="px-4 py-2.5 text-sm font-medium text-white bg-gray-800 border border-transparent rounded-lg hover:bg-gray-900 focus:ring-2 focus:ring-gray-800/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Add Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStockItemModal;
