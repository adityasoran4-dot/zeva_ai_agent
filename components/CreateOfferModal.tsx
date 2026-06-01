import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (offer: any) => void;
  token: string;
  mode?: "create" | "update";
  offer?: any;
  actorRole?: "clinic" | "doctor" | "agent" | "admin" | "doctorStaff";
}

export default function CreateOfferModal({
  isOpen,
  onClose,
  onCreated,
  token,
  mode = "create",
  offer,
  actorRole = "clinic",
}: Props) {
  const headerClass = "bg-teal-100";
  const subtitleClass = "text-teal-700";
  const formBgClass = "bg-white";
  const footerBgClass = "border-t bg-white";
  const cancelBtnVariant = "border-gray-300 text-gray-700 hover:bg-gray-100";
  const submitBtnVariant = "bg-gray-800 hover:bg-gray-900";
  const getInitialForm = () => ({
    title: "",
    description: "",
    offerType: "instant_discount" as "instant_discount" | "bundle" | "cashback",
    code: "",
    slug: "",
    startsAt: "",
    endsAt: "",
    timezone: "Asia/Kolkata",
    status: "draft" as "draft" | "active" | "paused" | "expired" | "archived",
    enabled: true,
    usesCount: 0,
    
    // Applicability Control
    applyOnType: "all_services" as "all_services" | "selected_services" | "selected_departments" | "selected_doctors",
    applyOnAllServices: true,
    serviceIds: [] as string[],
    departmentIds: [] as string[],
    doctorIds: [] as string[],
    
    // Stacking & Control Rules
    allowCombiningWithOtherOffers: false,
    allowReceptionistDiscount: false,
    maxBenefitCap: 30,
    minimumBillAmount: 0,
    marginThresholdPercent: 0,
    sameDayReuseBlocked: true,
    partialPaymentAllowed: false,
    
    // Smart Toggles
    autoApplyBestOffer: true,
    allowManualOverride: false,
    requireApprovalForOverride: true,
    blockIfProfitMarginBelowX: true,
    
    // Type 1: Instant Discount
    discountMode: "percentage" as "percentage" | "flat",
    discountValue: 0,
    
    // Type 2: Bundle
    buyQty: 0,
    freeQty: 0,
    
    // Type 3: Cashback
    cashbackAmount: 0,
    cashbackExpiryDays: 0,
  });
  const [form, setForm] = useState(getInitialForm);

  const [clinicId, setClinicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Data for selections
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  
  // Track service count for selected departments
  const [departmentServiceCount, setDepartmentServiceCount] = useState<number>(0);

  const [permissions, setPermissions] = useState<{
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canRead: boolean;
  }>({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canRead: false,
  });
  const [resolvedToken, setResolvedToken] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showLinkedWarning, setShowLinkedWarning] = useState(false);
  const [linkedServicesMessage, setLinkedServicesMessage] = useState("");
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const resolveTokenFromContext = () => {
    if (token) return token;
    if (typeof window === "undefined") return "";

    const roleFallbackMap: Record<string, string[]> = {
      clinic: ["clinicToken"],
      doctor: ["doctorToken", "clinicToken"],
      agent: ["agentToken", "clinicToken"],
      admin: ["adminToken"],
    };

    const fallbackKeys = [
      ...(roleFallbackMap[actorRole] || []),
      "clinicToken",
      "doctorToken",
      "agentToken",
      "adminToken",
    ];

    const seen = new Set<string>();
    for (const key of fallbackKeys) {
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        const value =
          window.localStorage?.getItem(key) ||
          window.sessionStorage?.getItem(key);
        if (value) return value;
      } catch {
        // ignore access issues
      }
    }
    return "";
  };

  useEffect(() => {
    if (!isOpen && !token) {
      setResolvedToken("");
      return;
    }
    const nextToken = resolveTokenFromContext();
    setResolvedToken(nextToken);
  }, [isOpen, token, actorRole]);

  useEffect(() => {
    if (!isOpen) return;

    const authToken = resolvedToken;
    if (!authToken) {
      setClinicId(null);
      setAllServices([]);
      setAllDepartments([]);
      setAllDoctors([]);
      setPermissions({
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canRead: false,
      });
      return;
    }

    const fetchAllData = async () => {
      try {
        // Fetch everything in parallel
        const [
          clinicRes,
          permissionsRes,
          servicesRes,
          departmentsRes,
          doctorsRes
        ] = await Promise.all([
          fetch("/api/lead-ms/get-clinic-treatment", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/clinic/permissions", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/clinic/services", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/clinic/departments?module", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/lead-ms/get-agents?role=doctorStaff", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        const clinicData = await clinicRes.json();
        if (clinicData.success) {
          setClinicId(clinicData.clinicId);
        }

        const servicesData = await servicesRes.json();
        if (servicesData.success) {
          setAllServices(servicesData.services || servicesData.data || []);
        }

        const departmentsData = await departmentsRes.json();
        if (departmentsData.success) {
          setAllDepartments(departmentsData.departments || departmentsData.data || []);
        }

        const doctorsData = await doctorsRes.json();
        if (doctorsData.success) {
          setAllDoctors(doctorsData.agents || doctorsData.data || []);
        }

        // Process permissions
        const permissionsData = await permissionsRes.json();
        if (permissionsData.success && permissionsData.data) {
          const modulePermission = permissionsData.data.permissions?.find((p: any) => {
            if (!p?.module) return false;
            if (p.module === "create_offers") return true;
            if (p.module === "clinic_create_offers") return true;
            if (p.module.startsWith("clinic_") && p.module.slice(7) === "create_offers") {
              return true;
            }
            return false;
          });

          if (modulePermission) {
            const actions = modulePermission.actions || {};
            setPermissions({
              canCreate: actions.all === true || actions.create === true,
              canUpdate: actions.all === true || actions.update === true,
              canDelete: actions.all === true || actions.delete === true,
              canRead: actions.all === true || actions.read === true,
            });
          } else {
            setPermissions({
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canRead: false,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    fetchAllData();
  }, [isOpen, resolvedToken]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "create") {
      setForm(getInitialForm());
      setErrors({});
      setShowSuccessPopup(false);
      return;
    }

    if (mode === "update" && offer) {
      console.log('Loading offer for update:', offer);
      console.log('Offer serviceIds (raw):', offer.serviceIds);
      console.log('Offer departmentIds (raw):', offer.departmentIds);
      console.log('Offer doctorIds (raw):', offer.doctorIds);
      
      // Handle both populated objects and raw IDs
      const extractIds = (items: any[]) => {
        if (!Array.isArray(items)) return [];
        return items.map((item: any) => {
          // If it's a populated object, get the _id
          if (item && typeof item === 'object' && item._id) {
            return String(item._id);
          }
          // If it's already a string/ObjectId
          return String(item);
        });
      };
      
      const serviceIds = extractIds(offer.serviceIds || []);
      const departmentIds = extractIds(offer.departmentIds || []);
      const doctorIds = extractIds(offer.doctorIds || []);
      
      console.log('Extracted serviceIds:', serviceIds);
      console.log('Extracted departmentIds:', departmentIds);
      console.log('Extracted doctorIds:', doctorIds);
      
      setForm({
        title: offer.title || "",
        description: offer.description || "",
        offerType: offer.offerType || "instant_discount",
        code: offer.code || "",
        slug: offer.slug || "",
        startsAt: offer.startsAt ? new Date(offer.startsAt).toISOString().slice(0, 16) : "",
        endsAt: offer.endsAt ? new Date(offer.endsAt).toISOString().slice(0, 16) : "",
        timezone: offer.timezone || "Asia/Kolkata",
        status: offer.status || "draft",
        enabled: offer.enabled ?? true,
        usesCount: offer.usesCount || 0,
        
        applyOnType: offer.applyOnAllServices ? "all_services" : 
                    offer.departmentIds?.length > 0 ? "selected_departments" :
                    offer.doctorIds?.length > 0 ? "selected_doctors" :
                    offer.serviceIds?.length > 0 ? "selected_services" : "all_services",
        applyOnAllServices: offer.applyOnAllServices ?? true,
        serviceIds: serviceIds,
        departmentIds: departmentIds,
        doctorIds: doctorIds,
        
        allowCombiningWithOtherOffers: offer.allowCombiningWithOtherOffers || false,
        allowReceptionistDiscount: offer.allowReceptionistDiscount || false,
        maxBenefitCap: offer.maxBenefitCap || 0,
        minimumBillAmount: offer.minimumBillAmount || 0,
        marginThresholdPercent: offer.marginThresholdPercent || 0,
        sameDayReuseBlocked: offer.sameDayReuseBlocked ?? true,
        partialPaymentAllowed: offer.partialPaymentAllowed || false,
        
        autoApplyBestOffer: offer.autoApplyBestOffer ?? true,
        allowManualOverride: offer.allowManualOverride || false,
        requireApprovalForOverride: offer.requireApprovalForOverride ?? true,
        blockIfProfitMarginBelowX: offer.blockIfProfitMarginBelowX ?? true,
        
        discountMode: offer.discountMode || "percentage",
        discountValue: offer.discountValue || 0,
        
        buyQty: offer.buyQty || 0,
        freeQty: offer.freeQty || 0,
        
        cashbackAmount: offer.cashbackAmount || 0,
        cashbackExpiryDays: offer.cashbackExpiryDays || 0,
      });
      setClinicId(offer.clinicId || null);
    }
  }, [isOpen, mode, offer]);

  // Calculate service count when departments are selected
  useEffect(() => {
    if (form.departmentIds.length > 0 && allServices.length > 0) {
      const count = allServices.filter(s => 
        form.departmentIds.includes(s.departmentId || s._id)
      ).length;
      setDepartmentServiceCount(count);
    } else {
      setDepartmentServiceCount(0);
    }
  }, [form.departmentIds, allServices]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = (target as HTMLInputElement).name;
    const value = (target as HTMLInputElement).value;
    const type = (target as HTMLInputElement).type as string;
    const checked = (target as HTMLInputElement).checked as boolean;

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    if (errors[name.split(".")[0]]) {
      const baseKey = name.split(".")[0];
      setErrors({ ...errors, [baseKey]: "" });
    }

    if (["discountValue", "cashbackAmount", "cashbackExpiryDays", "buyQty", "freeQty", "maxBenefitCap", "minimumBillAmount", "marginThresholdPercent"].includes(name)) {
      setForm((prev) => ({ ...prev, [name]: value ? Number(value) : 0 }));
      return;
    }

    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (listName: "serviceIds" | "departmentIds" | "doctorIds", id: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      [listName]: checked
        ? [...prev[listName], id]
        : prev[listName].filter((item: string) => item !== id),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const errorMessages: string[] = [];

    if (!form.title || form.title.trim().length === 0) {
      newErrors.title = "Offer title is required";
      errorMessages.push("Please fill in the Offer Name");
    }

    if (form.offerType === "instant_discount" && form.discountValue <= 0) {
      newErrors.discountValue = "Discount value must be greater than 0";
      errorMessages.push("Please enter a valid Discount Value greater than 0");
    }

    if (form.offerType === "bundle" && (form.buyQty <= 0 || form.freeQty <= 0)) {
      newErrors.bundle = "Buy and Free quantities must be greater than 0";
      errorMessages.push("Please enter valid Buy and Free quantities for Bundle offer");
    }

    if (form.offerType === "cashback" && form.cashbackAmount <= 0) {
      newErrors.cashbackAmount = "Cashback amount must be greater than 0";
      errorMessages.push("Please enter a valid Cashback Amount greater than 0");
    }

    if (!form.startsAt) {
      newErrors.startsAt = "Start date is required";
      errorMessages.push("Please select a Start Date");
    }
    
    if (!form.endsAt) {
      newErrors.endsAt = "End date is required";
      errorMessages.push("Please select an End Date");
    }

    if (form.startsAt && form.endsAt) {
      if (new Date(form.endsAt) <= new Date(form.startsAt)) {
        newErrors.endsAt = "End date must be after start date";
        errorMessages.push("End Date must be after Start Date");
      }
    }

    if (form.maxBenefitCap <= 0) {
      newErrors.maxBenefitCap = "Max benefit cap is mandatory";
      errorMessages.push("Please enter a valid Max Total Benefit Cap");
    }

    setErrors(newErrors);
    
    // Show all validation errors in toaster notifications
    if (errorMessages.length > 0) {
      errorMessages.forEach((message, index) => {
        setTimeout(() => {
          toast.error(message, {
            duration: 4000,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              fontSize: '13px',
              fontWeight: '500',
            },
            icon: '⚠️',
          });
        }, index * 300); // Stagger toasts for better UX
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    if (!clinicId) {
      toast.error("Clinic ID not found. Please try again or contact support.", {
        duration: 4000,
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '13px',
          fontWeight: '500',
        },
      });
      return;
    }

    if (mode === "create" && !permissions.canCreate) {
      toast.error("You do not have permission to create offers", {
        duration: 4000,
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '13px',
          fontWeight: '500',
        },
      });
      return;
    }
    if (mode === "update" && !permissions.canUpdate) {
      toast.error("You do not have permission to update offers", {
        duration: 4000,
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '13px',
          fontWeight: '500',
        },
      });
      return;
    }

    // If this is a pending submit after user confirmation, proceed directly
    if (pendingSubmit) {
      setPendingSubmit(false);
      await submitOffer();
      return;
    }

    // First, try to submit to check for linked services
    setLoading(true);
    try {
      const authToken = resolvedToken || resolveTokenFromContext();
      const url = mode === "create" ? "/api/lead-ms/create-offer" : `/api/lead-ms/update-offer?id=${offer._id}`;
      const method = mode === "create" ? "POST" : "PUT";

      // Final adjustments based on applyOnType
      const finalForm = { ...form };
      finalForm.applyOnAllServices = form.applyOnType === "all_services";
      
      // When applyOnAllServices is true, populate serviceIds with all clinic services
      if (form.applyOnType === "all_services") {
        finalForm.serviceIds = allServices.map(s => s._id);
      } else {
        if (form.applyOnType !== "selected_services") finalForm.serviceIds = [];
        if (form.applyOnType !== "selected_departments") finalForm.departmentIds = [];
        if (form.applyOnType !== "selected_doctors") finalForm.doctorIds = [];
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...finalForm,
          clinicId,
          startsAt: new Date(form.startsAt),
          endsAt: new Date(form.endsAt),
        }),
      });

      const data = await res.json();
      
      // Check if error is about already linked treatments
      if (!data.success && data.message && data.message.toLowerCase().includes('already linked')) {
        setLinkedServicesMessage(data.message);
        setShowLinkedWarning(true);
        setLoading(false);
        return;
      }
      
      if (data.success) {
        onCreated(data.offer);
        setShowSuccessPopup(true);
        toast.success(`Offer ${mode === "create" ? "created" : "updated"} successfully!`, {
          duration: 3000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontSize: '13px',
            fontWeight: '500',
          },
        });
        setTimeout(() => {
          setShowSuccessPopup(false);
          onClose();
        }, 2000);
      } else {
        toast.error(data.message || "Failed to save offer", {
          duration: 4000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontSize: '13px',
            fontWeight: '500',
          },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving offer. Please try again.", {
        duration: 4000,
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '13px',
          fontWeight: '500',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to submit offer after user confirms
  const submitOffer = async () => {
    setLoading(true);
    try {
      const authToken = resolvedToken || resolveTokenFromContext();
      const url = mode === "create" ? "/api/lead-ms/create-offer" : `/api/lead-ms/update-offer?id=${offer._id}`;
      const method = mode === "create" ? "POST" : "PUT";

      // Final adjustments based on applyOnType
      const finalForm = { ...form };
      finalForm.applyOnAllServices = form.applyOnType === "all_services";
      
      // When applyOnAllServices is true, populate serviceIds with all clinic services
      if (form.applyOnType === "all_services") {
        finalForm.serviceIds = allServices.map(s => s._id);
      } else {
        if (form.applyOnType !== "selected_services") finalForm.serviceIds = [];
        if (form.applyOnType !== "selected_departments") finalForm.departmentIds = [];
        if (form.applyOnType !== "selected_doctors") finalForm.doctorIds = [];
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...finalForm,
          clinicId,
          startsAt: new Date(form.startsAt),
          endsAt: new Date(form.endsAt),
          forceUpdate: true, // Flag to bypass duplicate check
        }),
      });

      const data = await res.json();
      if (data.success) {
        onCreated(data.offer);
        setShowSuccessPopup(true);
        toast.success(`Offer ${mode === "create" ? "created" : "updated"} successfully!`, {
          duration: 3000,
          style: {
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            fontSize: '13px',
            fontWeight: '500',
          },
        });
        toast.success("Treatment linkage updated despite existing connections", {
          duration: 4000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #f59e0b',
            fontSize: '13px',
            fontWeight: '500',
          },
          icon: '✅',
        });
        setTimeout(() => {
          setShowSuccessPopup(false);
          onClose();
        }, 2000);
      } else {
        toast.error(data.message || "Failed to save offer", {
          duration: 4000,
          style: {
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca',
            fontSize: '13px',
            fontWeight: '500',
          },
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving offer. Please try again.", {
        duration: 4000,
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          fontSize: '13px',
          fontWeight: '500',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Compact Header */}
        <div className={`${headerClass} px-4 py-3 flex justify-between items-center`}>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {mode === "create" ? "Create New Offer" : "Update Offer"}
            </h2>
            <p className={`${subtitleClass} text-[10px] sm:text-xs mt-0.5`}>
              {mode === "create" 
                ? "Fill in the details to create a promotional offer" 
                : !offer ? "Loading offer..." : "Modify the offer details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-teal-700 hover:bg-teal-200 rounded-lg p-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Compact Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className={`${formBgClass} px-4 py-3 space-y-6`}>
            
            {/* 1. BASIC SETTINGS */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-teal-800 border-b border-gray-200 pb-1.5 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px]">1</span>
                BASIC SETTINGS
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-medium text-teal-700 mb-1">Offer Name *</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    className={`text-gray-900 w-full border rounded-lg px-2.5 py-2 text-xs sm:text-sm ${errors.title ? "border-red-500" : "border-gray-200"}`}
                    placeholder="e.g., Summer Special 2024"
                    required
                  />
                  {errors.title && <p className="text-red-500 text-[10px] mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-teal-700 mb-1">Offer Type *</label>
                  <select
                    name="offerType"
                    value={form.offerType}
                    onChange={handleChange}
                    className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                  >
                    <option value="instant_discount">🟢 TYPE 1: INSTANT DISCOUNT</option>
                    <option value="bundle">🟡 TYPE 2: BUNDLE / PACKAGE</option>
                    <option value="cashback">🔵 TYPE 3: CASHBACK / WALLET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-teal-700 mb-1">Start Date *</label>
                  <input
                    type="datetime-local"
                    name="startsAt"
                    value={form.startsAt}
                    onChange={handleChange}
                    className={`text-gray-900 w-full border rounded-lg px-2.5 py-2 text-xs sm:text-sm ${errors.startsAt ? "border-red-500" : "border-gray-200"}`}
                    required
                  />
                  {errors.startsAt && <p className="text-red-500 text-[10px] mt-1">{errors.startsAt}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-teal-700 mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    name="endsAt"
                    value={form.endsAt}
                    onChange={handleChange}
                    className={`text-gray-900 w-full border rounded-lg px-2.5 py-2 text-xs sm:text-sm ${errors.endsAt ? "border-red-500" : "border-gray-200"}`}
                    required
                  />
                  {errors.endsAt && <p className="text-red-500 text-[10px] mt-1">{errors.endsAt}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-teal-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Type-Specific Fields */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                {form.offerType === "instant_discount" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-teal-700 mb-1">Discount Mode</label>
                      <select
                        name="discountMode"
                        value={form.discountMode}
                        onChange={handleChange}
                        className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="flat">Flat Amount (OFF)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-teal-700 mb-1">Discount Value *</label>
                      <input
                        type="number"
                        name="discountValue"
                        value={form.discountValue}
                        onChange={handleChange}
                        className={`text-gray-900 w-full border rounded-lg px-2.5 py-2 text-xs sm:text-sm ${errors.discountValue ? "border-red-500" : "border-gray-200"}`}
                        required
                      />
                      {errors.discountValue && <p className="text-red-500 text-[10px] mt-1">{errors.discountValue}</p>}
                    </div>
                  </div>
                )}

                {form.offerType === "bundle" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      {errors.bundle && <p className="text-red-500 text-[10px] mb-2">{errors.bundle}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-teal-700 mb-1">Buy Quantity (Paid)</label>
                      <input
                        type="number"
                        name="buyQty"
                        value={form.buyQty}
                        onChange={handleChange}
                        className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-teal-700 mb-1">Get Free Quantity</label>
                      <input
                        type="number"
                        name="freeQty"
                        value={form.freeQty}
                        onChange={handleChange}
                        className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                )}

                {form.offerType === "cashback" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-medium text-teal-700 mb-1">Cashback Amount</label>
                      <input
                        type="number"
                        name="cashbackAmount"
                        value={form.cashbackAmount}
                        onChange={handleChange}
                        className={`text-gray-900 w-full border rounded-lg px-2.5 py-2 text-xs sm:text-sm ${errors.cashbackAmount ? "border-red-500" : "border-gray-200"}`}
                      />
                      {errors.cashbackAmount && <p className="text-red-500 text-[10px] mt-1">{errors.cashbackAmount}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-teal-700 mb-1">Wallet Credit Expiry (Days)</label>
                      <input
                        type="number"
                        name="cashbackExpiryDays"
                        value={form.cashbackExpiryDays}
                        onChange={handleChange}
                        className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 2. APPLICABILITY CONTROL */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-teal-800 border-b border-gray-200 pb-1.5 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px]">2</span>
                APPLICABILITY CONTROL
              </h3>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-medium text-teal-700">Apply On:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: "all_services", label: "All Services" },
                    { id: "selected_services", label: "Selected Services" },
                    { id: "selected_departments", label: "Selected Departments" },
                    { id: "selected_doctors", label: "Selected Doctors" }
                  ].map((opt) => (
                    <label key={opt.id} className={`flex items-center justify-center p-2 border rounded-lg cursor-pointer transition-all text-[10px] text-center ${form.applyOnType === opt.id ? "bg-teal-600 text-white border-teal-600 shadow-sm" : "bg-white text-teal-700 border-gray-200 hover:bg-gray-50"}`}>
                      <input
                        type="radio"
                        name="applyOnType"
                        value={opt.id}
                        checked={form.applyOnType === opt.id}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>

                {/* Selection Lists based on type */}
                {form.applyOnType === "selected_services" && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                    {(() => {
                      console.log('=== SERVICES CHECKBOX RENDERING ===');
                      console.log('form.serviceIds:', form.serviceIds);
                      console.log('allServices count:', allServices.length);
                      return null;
                    })()}
                    {allServices.map((s: any) => {
                      // Check both _id and serviceSlug
                      const serviceId = s._id;
                      const serviceSlug = s.serviceSlug;
                      const isChecked = form.serviceIds.includes(serviceId) || 
                                       (serviceSlug && form.serviceIds.includes(serviceSlug));
                      
                      if (isChecked) {
                        console.log(`✓ Service MATCHED: ${s.name}, _id: ${serviceId}, slug: ${serviceSlug}`);
                      }
                      
                      return (
                      <label key={s._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelection("serviceIds", serviceId, e.target.checked)}
                          className="w-3.5 h-3.5 text-teal-600 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-700 font-medium">{s.name || s.mainTreatment || 'Unnamed Service'}</span>
                          {s.serviceSlug && <span className="text-[10px] text-gray-500">{s.serviceSlug}</span>}
                        </div>
                      </label>
                      );
                    })}
                  </div>
                )}

                {form.applyOnType === "selected_departments" && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                    {(() => {
                      console.log('=== DEPARTMENTS CHECKBOX RENDERING ===');
                      console.log('form.departmentIds:', form.departmentIds);
                      console.log('allDepartments count:', allDepartments.length);
                      return null;
                    })()}
                    {allDepartments.map((d: any) => {
                      const departmentId = d._id;
                      const isChecked = form.departmentIds.includes(departmentId);
                      
                      if (isChecked) {
                        console.log(`✓ Department MATCHED: ${d.name}, _id: ${departmentId}`);
                      }
                      
                      return (
                      <label key={d._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelection("departmentIds", departmentId, e.target.checked)}
                          className="w-3.5 h-3.5 text-teal-600 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-700 font-medium">{d.name || 'Unnamed Department'}</span>
                          {d.description && <span className="text-[10px] text-gray-500">{d.description}</span>}
                        </div>
                      </label>
                      );
                    })}
                    
                    {/* Service count feedback */}
                    {form.departmentIds.length > 0 && (
                      <div className="mt-3 p-2 bg-teal-50 border border-teal-200 rounded-md">
                        <p className="text-xs text-teal-700 font-medium">
                          {form.departmentIds.length} department{form.departmentIds.length > 1 ? 's' : ''} selected
                          {departmentServiceCount > 0 && (
                            <span className="ml-1">
                              ({departmentServiceCount} service{departmentServiceCount > 1 ? 's' : ''} will be included)
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {form.applyOnType === "selected_doctors" && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto space-y-2">
                    {(() => {
                      console.log('=== DOCTORS CHECKBOX RENDERING ===');
                      console.log('form.doctorIds:', form.doctorIds);
                      console.log('allDoctors count:', allDoctors.length);
                      return null;
                    })()}
                    {allDoctors.map((doc: any) => {
                      const doctorId = doc._id;
                      const isChecked = form.doctorIds.includes(doctorId);
                      
                      if (isChecked) {
                        console.log(`✓ Doctor MATCHED: ${doc.name}, _id: ${doctorId}`);
                      }
                      
                      return (
                      <label key={doc._id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleSelection("doctorIds", doctorId, e.target.checked)}
                          className="w-3.5 h-3.5 text-teal-600 rounded"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-700 font-medium">{doc.name || 'Unnamed Doctor'}</span>
                          {doc.role && <span className="text-[10px] text-gray-500">{doc.role}</span>}
                        </div>
                      </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* 3. STACKING & CONTROL RULES */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-teal-800 border-b border-gray-200 pb-1.5 flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px]">3</span>
                STACKING & CONTROL RULES
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="autoApplyBestOffer"
                      checked={form.autoApplyBestOffer}
                      onChange={handleChange}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-teal-900">Auto Apply Best Offer</span>
                      <span className="text-[10px] text-gray-500">System automatically picks highest benefit</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowCombiningWithOtherOffers"
                      checked={form.allowCombiningWithOtherOffers}
                      onChange={handleChange}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-teal-900">Allow Stacking</span>
                      <span className="text-[10px] text-gray-500">Combine with other active offers</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowReceptionistDiscount"
                      checked={form.allowReceptionistDiscount}
                      onChange={handleChange}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-teal-900">Allow Receptionist Discount</span>
                      <span className="text-[10px] text-gray-500">Can be combined with manual discounts</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-teal-700 mb-1">Max Total Benefit Cap *</label>
                    <input
                      type="number"
                      name="maxBenefitCap"
                      value={form.maxBenefitCap}
                      onChange={handleChange}
                      className={`text-gray-900 w-full border rounded-lg px-2.5 py-2 text-xs sm:text-sm ${errors.maxBenefitCap ? "border-red-500" : "border-gray-200"}`}
                      placeholder="e.g., 30"
                      required
                    />
                    {errors.maxBenefitCap && <p className="text-red-500 text-[10px] mt-1">{errors.maxBenefitCap}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-teal-700 mb-1">Minimum Billing Amount (Optional)</label>
                    <input
                      type="number"
                      name="minimumBillAmount"
                      value={form.minimumBillAmount}
                      onChange={handleChange}
                      className="text-gray-900 w-full border border-gray-200 rounded-lg px-2.5 py-2 text-xs sm:text-sm"
                      placeholder="e.g., 1000"
                    />
                  </div>
                </div>
              </div>
            </section>

 

          </div>

          {/* Compact Footer Actions */}
          <div className={`${footerBgClass} px-4 py-3 flex justify-end gap-2`}>
            <button
              type="button"
              onClick={onClose}
              className={["px-4 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors", cancelBtnVariant].join(" ")}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (mode === "create" && !permissions.canCreate) || (mode === "update" && !permissions.canUpdate)}
              className={["px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm", submitBtnVariant].join(" ")}
              title={
                mode === "create" && !permissions.canCreate
                  ? "You do not have permission to create offers"
                  : mode === "update" && !permissions.canUpdate
                  ? "You do not have permission to update offers"
                  : ""
              }
            >
              {loading
                ? "Saving..."
                : mode === "create"
                ? "Create Offer"
                : "Update Offer"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Offer Submitted!</h3>
              <p className="text-sm text-gray-600">
                Your offer has been {mode === "create" ? "created" : "updated"} successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Linked Services Warning Popup */}
      {showLinkedWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <svg
                  className="h-8 w-8 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Treatment Already Linked</h3>
              <p className="text-sm text-gray-600 mb-4">
                {linkedServicesMessage}
              </p>
              <p className="text-xs text-gray-500 mb-6">
                Do you want to proceed anyway? This will update the treatment linkage.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowLinkedWarning(false);
                    setLinkedServicesMessage("");
                  }}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLinkedWarning(false);
                    setPendingSubmit(true);
                    // Trigger submit again with forceUpdate flag
                    setTimeout(() => submitOffer(), 100);
                  }}
                  className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium text-sm shadow-sm"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
