"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import {
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  X,
  ChevronUp,
  Send,
  FileText,
  TrendingUp,
  Clock,
  Tag,
} from "lucide-react";

interface Appointment {
  _id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientNumber: string;
  patientEmail: string;
  emrNumber: string;
  gender: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  roomId: string;
  roomName: string;
  serviceId?: string | { _id: string } | null;
  serviceName?: string | null;
  serviceIds?: string[] | Array<{ _id: string }>;
  serviceNames?: string[];
  status: string;
  followType: string;
  referral: string;
  startDate: string;
  fromTime: string;
  toTime: string;
}

interface Treatment {
  name: string;
  slug: string;
  price: number;
  type: "main" | "sub";
  mainTreatment?: string;
  mainTreatmentSlug?: string;
}

interface Package {
  _id: string;
  name: string;
  price?: number;
  totalPrice: number;
  totalSessions: number;
  sessionPrice?: number;
  isUserPackage?: boolean;
  remainingSessions?: number;
  patientPackageId?: string;
  patientPackageSubId?: string;
  paidAmount?: number;
  paymentStatus?: string;
  treatments: Array<{
    treatmentName: string;
    treatmentSlug: string;
    sessions: number;
    allocatedPrice: number;
    sessionPrice: number;
    _id: string;
  }>;
}

interface SelectedTreatment {
  treatmentName: string;
  treatmentSlug: string;
  price: number;
  quantity: number;
  totalPrice: number;
  usesFreeConsultation?: boolean;
  usesMembershipDiscount?: boolean;
  isFreeSession?: boolean;
}

interface PackageTreatmentSession {
  treatmentName: string;
  treatmentSlug: string;
  maxSessions: number;
  usedSessions: number;
  previouslyUsedSessions: number; // Track sessions used in previous billings
  usageDetails?: Array<{
    invoiceNumber: string;
    sessions: number;
    date: string;
  }>; // Detailed usage history
  isSelected: boolean;
  sessionPrice: number;
  isAlreadyBilledForThisAppointment?: boolean;
  usesFreeConsultation?: boolean;
  usesMembershipDiscount?: boolean;
}

interface BilledTreatmentInfo {
  name: string;
  billedAt: Date | string;
}

interface Offer {
  _id: string;
  title: string;
  description: string;
  offerType: "instant_discount" | "bundle" | "cashback";
  discountMode: "percentage" | "flat";
  discountValue: number;
  applyOnAllServices: boolean;
  serviceIds: Array<{
    _id: string;
    name?: string;
    serviceSlug?: string;
  } | string>;
  doctorIds?: string[];
  departmentIds?: string[];
  serviceNames?: string[];
  departmentNames?: string[];
  status: string;
  enabled: boolean;
  code: string;
  maxBenefitCap: number;
  minimumBillAmount: number;
  allowCombiningWithOtherOffers: boolean;
  allowReceptionistDiscount: boolean;
  // Bundle-specific fields
  buyQty?: number;
  freeQty?: number;
  // Cashback-specific fields
  cashbackAmount?: number;
  cashbackExpiryDays?: number;
  // Additional fields from CreateOffer model
  startsAt?: Date | string;
  endsAt?: Date | string;
  maxUses?: number | null;
  usesCount?: number;
  perUserLimit?: number;
  sameDayReuseBlocked?: boolean;
  marginThresholdPercent?: number;
  autoApplyBestOffer?: boolean;
  allowManualOverride?: boolean;
}

interface AppointmentBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  getAuthHeaders: () => Record<string, string>;
  onSuccess?: () => void;
}

const AppointmentBillingModal: React.FC<AppointmentBillingModalProps> = ({
  isOpen,
  onClose,
  appointment,
  getAuthHeaders,
  onSuccess,
}) => {
  const ENABLE_BILLING_DEBUG_LOGS = false;
  const billingDebugLog = (...args: unknown[]) => {
    if (ENABLE_BILLING_DEBUG_LOGS) console.log(...args);
  };

  const [loading, setLoading] = useState(false);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<
    "Treatment" | "Package"
  >("Treatment");
  const [selectedTreatments, setSelectedTreatments] = useState<
    SelectedTreatment[]
  >([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [packageTreatmentSessions, setPackageTreatmentSessions] = useState<
    PackageTreatmentSession[]
  >([]);
  const [treatmentDropdownOpen, setTreatmentDropdownOpen] = useState(false);
  const [packageDropdownOpen, setPackageDropdownOpen] = useState(false);
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState("");
  const [packageSearchQuery, setPackageSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [matchedOffers, setMatchedOffers] = useState<Offer[]>([]);
  const [appliedOfferIds, setAppliedOfferIds] = useState<string[]>([]);
  const [unmatchedOffersDueToMinimum, setUnmatchedOffersDueToMinimum] = useState<Array<{offer: Offer, minimumAmount: number, currentAmount: number}>>([]);
  
  // Bundle offer tracking state
  const [matchedBundleOffer, setMatchedBundleOffer] = useState<Offer | null>(null);
  const [bundleFreeSessions, setBundleFreeSessions] = useState<string[]>([]);
  const [bundleFreeSessionCount, setBundleFreeSessionCount] = useState<number>(0);
  
  // Cashback offer tracking state
  const [matchedCashbackOffer, setMatchedCashbackOffer] = useState<Offer | null>(null);
  const [appliedCashbackAmount, setAppliedCashbackAmount] = useState<number>(0);
  const [isCashbackApplied, setIsCashbackApplied] = useState<boolean>(false);
  // Use refs to avoid stale closure issues in useEffect
  const appliedCashbackRef = useRef<{ offerId: string; amount: number } | null>(null);
  const matchedOffersRef = useRef<Offer[]>([]); // Track matchedOffers without causing re-renders
  const offersClearedRef = useRef<boolean>(false); // Prevent repeated clear loops when offers are empty
  const bundleClearedRef = useRef<boolean>(false); // Prevent repeated bundle-clear loops
  
  // New state variables for flag-based discount visibility control
  const [showMembershipDiscount, setShowMembershipDiscount] = useState(true);
  const [showAgentDiscount, setShowAgentDiscount] = useState(true);
  const [showDoctorDiscount, setShowDoctorDiscount] = useState(true);
  
  const [isMembershipApplied, setIsMembershipApplied] = useState(false);
  const [finalMembershipDiscount, setFinalMembershipDiscount] = useState(0);
  const [finalOfferDiscount, setFinalOfferDiscount] = useState(0);
  const [finalReceptionistDiscount, setFinalReceptionistDiscount] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [billingHistoryFetched, setBillingHistoryFetched] = useState(false);
  const [packageUsageData, setPackageUsageData] = useState<any>(null);
  const [loadingPackageUsage, setLoadingPackageUsage] = useState(false);
  const [membershipUsage, setMembershipUsage] = useState<any>(null);
  const [loadingMembershipUsage, setLoadingMembershipUsage] = useState(false);
  const [activePackageUsage, setActivePackageUsage] = useState<any[]>([]);
  const [loadingActivePackageUsage, setLoadingActivePackageUsage] = useState(false);
  const [availableFreeSessions, setAvailableFreeSessions] = useState<any[]>([]);
  const [loadingFreeSessions, setLoadingFreeSessions] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  // Smart Recommendations state
  interface SmartService { _id: string; name: string; price: number; clinicPrice?: number | null; durationMinutes?: number; departmentId?: string; serviceSlug?: string; }
  interface SmartDepartment { _id: string; name: string; services: SmartService[]; }
  const [smartDepartments, setSmartDepartments] = useState<SmartDepartment[]>([]);
  const [loadingSmartRec, setLoadingSmartRec] = useState(false);
  const [justAddedServiceName, setJustAddedServiceName] = useState<string | null>(null);

  // Doctor discount state
  const [doctorDiscount, setDoctorDiscount] = useState<{
    discountType: string;
    discountAmount: number;
  } | null>(null);
  const [isDoctorDiscountApplied, setIsDoctorDiscountApplied] =
    useState(false);
  const [doctorAppliedDiscount, setDoctorAppliedDiscount] = useState(false);
  const [doctorComplaintDiscount, setDoctorComplaintDiscount] = useState<{
    discountType: string;
    discountAmount: number;
  } | null>(null);

  // Agent discount state
  const [agentDiscount, setAgentDiscount] = useState<{
    discountType: string;
    discountAmount: number;
  } | null>(null);
  const [isAgentDiscountApplied, setIsAgentDiscountApplied] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Helper function to get user info from token
  const getUserInfo = (): { role: string | null; id: string | null } => {
    if (typeof window === "undefined") return { role: null, id: null };
    try {
      const TOKEN_PRIORITY = ["clinicToken", "doctorToken", "agentToken", "userToken", "adminToken"];
      for (const key of TOKEN_PRIORITY) {
        const token = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            return {
              role: decoded.role || decoded.userRole || null,
              id: decoded.userId || decoded.id || null
            };
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return { role: null, id: null };
  };

  // Balances and advance usage
  const [balances, setBalances] = useState<{
    advanceBalance: number;
    pendingBalance: number;
    claimAmount: number;
    pendingClaim: number;
    pastAdvanceBalance: number;
    pastAdvance50PercentBalance: number;
    pastAdvance54PercentBalance: number;
    pastAdvance159FlatBalance: number;
  }>({
    advanceBalance: 0,
    pendingBalance: 0,
    claimAmount: 0,
    pendingClaim: 0,
    pastAdvanceBalance: 0,
    pastAdvance50PercentBalance: 0,
    pastAdvance54PercentBalance: 0,
    pastAdvance159FlatBalance: 0,
  });
  const [applyAdvance, setApplyAdvance] = useState(false);
  const [applyPastAdvance50Percent] = useState(false);
  const [applyPastAdvance54Percent] = useState(false);
  const [applyPastAdvance159Flat, setApplyPastAdvance159Flat] = useState(false);
  const [applyClaimAmount, setApplyClaimAmount] = useState(false);
  const [applyPendingClaim, setApplyPendingClaim] = useState(false);
  
  // Cashback state
  const [availableCashback, setAvailableCashback] = useState<any>(null); // { amount, expiryDate, daysRemaining }
  const [useCashback, setUseCashback] = useState(false);

  // Consent Form States
  const [consentForms, setConsentForms] = useState<any[]>([]);
  const [selectedConsentId, setSelectedConsentId] = useState("");
  const [sendingConsent, setSendingConsent] = useState(false);
  const [consentSent, setConsentSent] = useState(false);
  const [consentStatuses, setConsentStatuses] = useState<any[]>([]);
  const [loadingConsentStatus, setLoadingConsentStatus] = useState(false);

  // Multiple payment method support
  const [useMultiplePayments, setUseMultiplePayments] = useState(false);
  const [multiplePayments, setMultiplePayments] = useState<
    Array<{ paymentMethod: string; amount: string }>
  >([
    { paymentMethod: "Cash", amount: "" },
    { paymentMethod: "Card", amount: "" },
  ]);

  // Form data
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoicedDate: new Date().toISOString().split("T")[0],
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    gender: "",
    doctor: "",
    service: "Treatment",
    treatment: "",
    package: "",
    patientType: "New",
    referredBy: "",
    amount: "",
    discountedAmount: "",
    paid: "",
    pending: "0.00",
    advance: "0.00",
    pastAdvance: "0.00",
    paymentMethod: "Cash",
    insurance: "No",
    advanceGivenAmount: "",
    coPayPercent: "",
    advanceClaimStatus: "Pending",
    insuranceType: "Paid",
    membership: "No",
    membershipStartDate: "",
    membershipEndDate: "",
    notes: "",
    emrNumber: "",
    originalAmount: "",
    advanceUsed: "0.00",
    pastAdvanceUsed: "0.00",
    pastAdvanceUsed50Percent: "0.00",
    pastAdvanceUsed54Percent: "0.00",
    pastAdvanceUsed159Flat: "0.00",
    pendingUsed: "0.00",
    claimAmountUsed: "0.00",
    pendingClaimUsed: "0.00",
  });

  const treatmentDropdownRef = useRef<HTMLDivElement>(null);
  const packageDropdownRef = useRef<HTMLDivElement>(null);
  const initializedAppointmentId = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const { role } = getUserInfo();
      setUserRole(role);
    }
  }, [isOpen]);

  // Helper function to check if membership was transferred out
  const isMembershipTransferredOut = useCallback(() => {
    if (!membershipUsage?.membershipId || !patientDetails?.membershipTransfers)
      return false;
    return patientDetails.membershipTransfers.some(
      (t: any) =>
        t.type === "out" &&
        String(t.membershipId) === String(membershipUsage.membershipId),
    );
  }, [membershipUsage, patientDetails]);

  // Generate invoice number
  const generateInvoiceNumber = useCallback(() => {
    const date = new Date();
    // Use Date.now() for guaranteed uniqueness (milliseconds since epoch)
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits for readability
    const invoiceNum = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${timestamp}`;
    setFormData((prev) => ({ ...prev, invoiceNumber: invoiceNum }));
  }, []);

  // Reset state when opening or switching appointments
  useEffect(() => {
    if (isOpen && appointment?._id) {
      // Reset all patient-specific state
      setPatientDetails(null);
      setSelectedService("Treatment");
      setSelectedTreatments([]);
      setSelectedPackage(null);
      setPackageTreatmentSessions([]);
      setErrors({});
      setTotalPrice(0);
      setBillingHistory([]);
      setBillingHistoryFetched(false);
      setPackageUsageData(null);
      setMembershipUsage(null);
      setActivePackageUsage([]);
      setExpandedPackages({});
      setDoctorDiscount(null);
      setIsDoctorDiscountApplied(false);
      setDoctorAppliedDiscount(false);
      setDoctorComplaintDiscount(null);
      setAgentDiscount(null);
      setIsAgentDiscountApplied(false);
      setBalances({
        advanceBalance: 0,
        pendingBalance: 0,
        claimAmount: 0,
        pendingClaim: 0,
        pastAdvanceBalance: 0,
        pastAdvance50PercentBalance: 0,
        pastAdvance54PercentBalance: 0,
        pastAdvance159FlatBalance: 0,
      });
      setApplyClaimAmount(false);
      setApplyPendingClaim(false);
      setApplyAdvance(false);
      setApplyPastAdvance159Flat(false);
      setUseMultiplePayments(false);
      setActiveOffers([]);
      setMatchedOffers([]);
      setAppliedOfferIds([]);
      setUnmatchedOffersDueToMinimum([]);
      setMatchedBundleOffer(null);
      setBundleFreeSessions([]);
      setBundleFreeSessionCount(0);
      // Reset new flag-based visibility state to defaults
      setShowMembershipDiscount(true);
      setShowAgentDiscount(true);
      setShowDoctorDiscount(true);
      setMultiplePayments([
        { paymentMethod: "Cash", amount: "" },
        { paymentMethod: "Card", amount: "" },
      ]);
      setVisitCount(null);
      setConsentStatuses([]);
      initializedAppointmentId.current = null;
      
      // Initialize basic form data from appointment
      const nameParts = (appointment.patientName || "").split(" ");
      setFormData({
        invoiceNumber: "",
        invoicedDate: new Date().toISOString().split("T")[0],
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: appointment.patientEmail || "",
        mobileNumber: appointment.patientNumber || "",
        gender: appointment.gender || "",
        doctor: appointment.doctorName || "",
        service: "Treatment",
        treatment: "",
        package: "",
        patientType: "Old",
        referredBy: appointment.referral || "",
        amount: "",
        discountedAmount: "",
        paid: "",
        pending: "0.00",
        advance: "0.00",
        pastAdvance: "0.00",
        paymentMethod: "Cash",
        insurance: "No",
        advanceGivenAmount: "",
        coPayPercent: "",
        advanceClaimStatus: "Pending",
        insuranceType: "Paid",
        membership: "No",
        membershipStartDate: "",
        membershipEndDate: "",
        notes: "",
        emrNumber: appointment.emrNumber || "",
        originalAmount: "",
        advanceUsed: "0.00",
        pastAdvanceUsed: "0.00",
        pastAdvanceUsed50Percent: "0.00",
        pastAdvanceUsed54Percent: "0.00",
        pastAdvanceUsed159Flat: "0.00",
        pendingUsed: "0.00",
        claimAmountUsed: "0.00",
        pendingClaimUsed: "0.00",
      });

      generateInvoiceNumber();
    }
  }, [isOpen, appointment?._id, generateInvoiceNumber]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get('/api/clinics/myallClinic', { headers });
        if (res.data.success && res.data.clinic?.currency) {
          setCurrency(res.data.clinic.currency);
        }
      } catch (e) { 
        console.error('Error fetching clinic currency:', e); 
      }
    };
    fetchClinicCurrency();
  }, []);

  // Fetch treatments and packages
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;

      try {
        // Fetch treatments
        const treatmentsRes = await axios.get("/api/clinic/treatments", {
          headers,
        });
        if (treatmentsRes.data.success) {
          const clinicTreatments = treatmentsRes.data.clinic?.treatments || [];
          const allTreatments: Treatment[] = [];

          clinicTreatments.forEach((tr: any) => {
            // Add sub-treatments only (main treatments don't have prices)
            if (tr.subTreatments && tr.subTreatments.length > 0) {
              tr.subTreatments.forEach((sub: any) => {
                allTreatments.push({
                  name: sub.name,
                  slug: sub.slug,
                  price: sub.price || 0,
                  type: "sub",
                  mainTreatment: tr.mainTreatment,
                  mainTreatmentSlug: tr.mainTreatmentSlug,
                });
              });
            }
          });

          // Also include clinic Services as selectable treatments
          try {
            const servicesRes = await axios.get("/api/clinic/services", {
              headers,
            });
            if (
              servicesRes.data?.success &&
              Array.isArray(servicesRes.data.services)
            ) {
              servicesRes.data.services.forEach((svc: any) => {
                if (!svc || !svc.name) return;
                allTreatments.push({
                  name: svc.name,
                  slug: svc.serviceSlug || svc._id, // unique key for selection
                  price: Number(svc.price) || 0,
                  type: "sub", // keep as 'sub' so existing filters include it
                  mainTreatment: "Service",
                  mainTreatmentSlug: "service",
                });
              });
            }
          } catch {
            // Ignore services fetch errors and proceed with available treatments
          }

          setTreatments(allTreatments);
        }

        // Fetch packages
        const packagesRes = await axios.get("/api/clinic/packages", {
          headers,
        });
        if (packagesRes.data.success) {
          setPackages(packagesRes.data.packages || []);
        }

        // Fetch userPackages (packages created via public form) for this patient
        if (appointment?.patientId) {
          try {
            const userPkgRes = await axios.get(`/api/clinic/patient-registration?id=${appointment.patientId}`, { headers });
            if (userPkgRes.data.success && userPkgRes.data.patient?.userPackages) {
              const approvedUserPackages = userPkgRes.data.patient.userPackages.filter(
                (pkg: any) => pkg.approvalStatus === 'approved'
              );
              // Fetch full package details for each userPackage from UserPackage model
              const fullUserPackages: any[] = [];
              for (const pkg of approvedUserPackages) {
                try {
                  const pkgDetailsRes = await axios.get(
                    `/api/clinic/public-package?patientId=${appointment.patientId}`,
                    { headers }
                  );
                  if (pkgDetailsRes.data.success && pkgDetailsRes.data.existingPackages) {
                    const fullPkg = pkgDetailsRes.data.existingPackages.find(
                      (p: any) => p._id === pkg.packageId
                    );
                    if (fullPkg) {
                      fullUserPackages.push({
                        ...fullPkg,
                        assignedDate: pkg.assignedDate,
                        patientPackageId: pkg.packageId, // Use the actual UserPackage ID
                        patientPackageSubId: pkg._id, // Keep the sub-document ID just in case
                        isUserPackage: true,
                      });
                    }
                  }
                } catch (e) {
                  console.error(`Error fetching userPackage ${pkg.packageId}:`, e);
                }
              }
              setUserPackages(fullUserPackages);
            }
          } catch (e) {
            console.error("Error fetching userPackages:", e);
          }
        }

        // Fetch memberships
        const membershipsRes = await axios.get("/api/clinic/memberships", {
          headers,
        });
        if (membershipsRes.data.success) {
          setMemberships(membershipsRes.data.memberships || []);
        }

        // Fetch Smart Recommendations (departments & services) based on doctor
        try {
          if (appointment?.doctorId) {
            setLoadingSmartRec(true);
            const deptRes = await axios.get("/api/clinic/doctor-departments", {
              headers,
              params: { doctorStaffId: appointment.doctorId },
            });
            if (deptRes.data?.success && Array.isArray(deptRes.data.departments)) {
              const departments = deptRes.data.departments;
              if (departments.length > 0) {
                // Fetch services for each department
                const results = await Promise.allSettled(
                  departments.map((dept: any) =>
                    axios.get("/api/clinic/services", {
                      headers,
                      params: { departmentId: dept.clinicDepartmentId || dept._id },
                    })
                  )
                );

                const enriched = departments.map((dept: any, i: number) => {
                  const res = results[i];
                  const services: SmartService[] =
                    res.status === "fulfilled" && res.value?.data?.success
                      ? (res.value.data.services || []).map((s: any) => ({
                          _id: s._id,
                          name: s.name,
                          price: s.price,
                          clinicPrice: s.clinicPrice,
                          durationMinutes: s.durationMinutes,
                          departmentId: dept._id,
                          serviceSlug: s.serviceSlug,
                        }))
                      : [];
                  return { _id: dept._id, name: dept.name, services };
                }).filter((d: any) => d.services.length > 0);

                setSmartDepartments(enriched);
              }
            }
          }
        } catch (error) {
          console.log("Smart Rec fetch error:", error);
          // Ignore smart rec errors
        } finally {
          setLoadingSmartRec(false);
        }

        // Fetch active offers
         try {
           const offersRes = await axios.get("/api/lead-ms/get-create-offer", {
             headers,
           });
           if (offersRes.data.success && Array.isArray(offersRes.data.offers)) {
             // Log all offers with their status for debugging
             console.log('[OfferFetch] All offers from API:', offersRes.data.offers.map((o: any) => ({
               title: o.title,
               status: o.status,
               enabled: o.enabled,
               endsAt: o.endsAt
             })));
             
             // Include only 'active' status offers
             const applicableOnes = offersRes.data.offers.filter((o: any) => 
               o.status === "active" && o.enabled === true
             );
             console.log(`[OfferFetch] Successfully fetched ${applicableOnes.length} active and enabled offers.`);
             console.log('[OfferFetch] Active offers:', applicableOnes.map((o: any) => ({
               title: o.title,
               status: o.status,
               allowReceptionistDiscount: o.allowReceptionistDiscount,
               autoApplyBestOffer: o.autoApplyBestOffer
             })));
             setActiveOffers(applicableOnes);
           }
         } catch (offerErr: any) {
           console.error("Error fetching offers:", offerErr);
           // Show user-friendly message for permission denied error
           if (offerErr.response?.status === 403) {
             const errorMessage = offerErr.response?.data?.message || "";
             if (errorMessage.includes("Permission denied") || errorMessage.includes("not allowed")) {
               setErrors({
                 general: "You don't have permission to view billing discounts. Please contact your administrator to enable this feature."
               });
             }
           }
         }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [isOpen, getAuthHeaders, appointment?.patientId, appointment?.doctorId]);

  // Fetch patient details (memberships/packages)
  useEffect(() => {
    if (!isOpen || !appointment?.patientId) return;
    const fetchPatient = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get(`/api/clinic/${appointment.patientId}`, {
          headers,
        });
        setPatientDetails(res.data || null);
      } catch (e) {
        setPatientDetails(null);
      }
    };
    fetchPatient();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  const billedTreatmentInfos = useMemo<BilledTreatmentInfo[]>(() => {
    if (!appointment?._id || !Array.isArray(billingHistory)) return [];
    const list: BilledTreatmentInfo[] = [];
    billingHistory.forEach((b: any) => {
      const apptMatch =
        String(b.appointmentId) === String(appointment._id) ||
        String(b.appointmentId?._id) === String(appointment._id);
      if (!apptMatch) return;
      
      // Use invoicedDate as the billing timestamp
      const billedAt = b.invoicedDate || b.createdAt || new Date().toISOString();
      
      if (b.treatment) {
        const names = String(b.treatment)
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean);
        names.forEach((n: string) =>
          list.push({ name: n.toLowerCase(), billedAt })
        );
      }
      if (Array.isArray(b.selectedPackageTreatments)) {
        b.selectedPackageTreatments.forEach((pt: any) => {
          const n = (pt?.treatmentName || "").toString().trim();
          if (n) list.push({ name: n.toLowerCase(), billedAt });
        });
      }
    });
    return list;
  }, [billingHistory, appointment?._id]);

  // Check if treatment was billed within the last 24 hours
  // If yes, don't allow re-billing; if more than 24 hours, allow re-billing
  const isTreatmentBilledWithin24Hours = useCallback(
    (treatmentName: string) => {
      const norm = (treatmentName || "").trim().toLowerCase();
      const now = new Date();
      
      // Find the most recent billing for this treatment
      const matchingBillings = billedTreatmentInfos.filter((bt) => bt.name === norm);
      
      if (matchingBillings.length === 0) {
        return false; // Never billed, can bill
      }
      
      // Check if any of the billings were within the last 24 hours
      for (const billing of matchingBillings) {
        const billedAt = new Date(billing.billedAt);
        const hoursDiff = (now.getTime() - billedAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          // Billed within 24 hours, don't allow re-billing
          return true;
        }
      }
      
      // All billings are older than 24 hours, allow re-billing
      return false;
    },
    [billedTreatmentInfos]
  );

  // Keep the old function name as an alias for backward compatibility
  const isTreatmentBilledRecently = isTreatmentBilledWithin24Hours;

  // Fetch patient balances (advance/pending)
  useEffect(() => {
    if (!isOpen || !appointment?.patientId) return;
    const fetchBalances = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get(
          `/api/clinic/patient-balance/${appointment.patientId}`,
          { headers },
        );
        if (res.data?.success && res.data?.balances) {
          setBalances({
            advanceBalance: res.data.balances.advanceBalance || 0,
            pendingBalance: res.data.balances.pendingBalance || 0,
            claimAmount: res.data.balances.claimAmount || 0,
            pendingClaim: res.data.balances.pendingClaim || 0,
            pastAdvanceBalance: res.data.balances.pastAdvanceBalance || 0,
            pastAdvance50PercentBalance:
              res.data.balances.pastAdvance50PercentBalance || 0,
            pastAdvance54PercentBalance:
              res.data.balances.pastAdvance54PercentBalance || 0,
            pastAdvance159FlatBalance:
              res.data.balances.pastAdvance159FlatBalance || 0,
          });
        } else {
          setBalances({
            advanceBalance: 0,
            pendingBalance: 0,
            claimAmount: 0,
            pendingClaim: 0,
            pastAdvanceBalance: 0,
            pastAdvance50PercentBalance: 0,
            pastAdvance54PercentBalance: 0,
            pastAdvance159FlatBalance: 0,
          });
        }
      } catch {
        setBalances({
          advanceBalance: 0,
          pendingBalance: 0,
          claimAmount: 0,
          pendingClaim: 0,
          pastAdvanceBalance: 0,
          pastAdvance50PercentBalance: 0,
          pastAdvance54PercentBalance: 0,
          pastAdvance159FlatBalance: 0,
        });
      }
    };
    fetchBalances();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Fetch consent forms
  useEffect(() => {
    if (!isOpen) return;
    const fetchConsentForms = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get("/api/clinic/consent", { headers });
        if (res.data?.success) setConsentForms(res.data.consents || []);
      } catch (err) {
        console.error("Error fetching consent forms:", err);
      }
    };
    fetchConsentForms();
  }, [isOpen, getAuthHeaders]);

  // Fetch consent statuses
  useEffect(() => {
    if (!isOpen || !appointment?.patientId || !appointment?._id) return;
    const fetchConsentStatuses = async () => {
      setLoadingConsentStatus(true);
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
       
        // Consent APIs only accept patientId - no appointmentId
        // Consent is scoped to the patient across all appointments
        const [signaturesRes, logsRes] = await Promise.all([
          axios.get("/api/clinic/consent-status", {
            headers,
            params: { patientId: appointment.patientId },
          }),
          axios.get("/api/clinic/consent-log", {
            headers,
            params: { patientId: appointment.patientId },
          }),
        ]);

        const signatures = signaturesRes.data?.consentStatuses || [];
        const logs = logsRes.data?.consentLogs || [];

        const logMap = new Map();
        logs.forEach((log: any) => {
          logMap.set(log.consentFormId, {
            _id: log._id,
            consentFormId: log.consentFormId,
            consentFormName: log.consentFormName,
            description: log.description || "",
            patientName: log.patientName,
            date: new Date(log.createdAt).toLocaleDateString("en-GB"),
            hasSignature: false,
            status: "sent",
            signedAt: null,
          });
        });

        // Override with signed status if signature exists
        signatures.forEach((sig: any) => {
          logMap.set(sig.consentFormId, {
            ...sig,
            status: "signed",
          });
        });

        setConsentStatuses(Array.from(logMap.values()));
      } catch (err) {
        console.error("Error fetching consent statuses:", err);
      } finally {
        setLoadingConsentStatus(false);
      }
    };
    fetchConsentStatuses();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Send Consent Form on WhatsApp
  const handleSendConsentMsgOnWhatsapp = async () => {
    if (!selectedConsentId || !appointment) return;
 
    try {
      setSendingConsent(true);
     
      const patientData = {
        firstName: appointment.patientName?.split(" ")[0] || "",
        lastName: appointment.patientName?.split(" ").slice(1).join(" ") || "",
        mobileNumber: appointment.patientNumber || "",
        email: appointment.patientEmail || "",
        appointmentId: appointment._id,
      };
     
      const encodedPatientData = encodeURIComponent(JSON.stringify(patientData));
      const consentUrl = `https://zeva360.com/consent-form/${selectedConsentId}?patient=${encodedPatientData}`;
 
      await axios.post(
        "/api/messages/send-message",
        {
          patientId: appointment.patientId,
          providerId: "6952256c4a46b2f1eb01be86",
          channel: "whatsapp",
          content: `Please review and sign the consent form by clicking the link below:\n\n ${consentUrl}\n\n Thank you.`,
          mediaUrl: "",
          mediaType: "",
          source: "Zeva",
          messageType: "conversational",
          templateId: "69c38b4d26b8217e1ba78f8a",
          headerParameters: [],
          bodyParameters: [{ type: "text", text: consentUrl }],
          attachments: [],
        },
        { headers: getAuthHeaders() }
      );
 
      setConsentSent(true);
     
      // Log the sent consent form
      try {
        const selectedForm = consentForms.find((f) => f._id === selectedConsentId);
        await axios.post(
          "/api/clinic/consent-log",
          {
            consentFormId: selectedConsentId,
            consentFormName: selectedForm?.formName || "",
            patientId: appointment.patientId,
            patientName: appointment.patientName || "",
            appointmentId: appointment._id,
            sentVia: "whatsapp",
          },
          { headers: getAuthHeaders() }
        );
       
        // Refresh consent statuses
        setTimeout(() => {
          const headers = getAuthHeaders();
          axios.get("/api/clinic/consent-log", {
            headers,
            params: { patientId: appointment.patientId, appointmentId: appointment._id },
          }).then((logsRes) => {
            const logs = logsRes.data?.consentLogs || [];
            const logMap = new Map();
           
            logs.forEach((log: any) => {
              logMap.set(log.consentFormId, {
                _id: log._id,
                consentFormId: log.consentFormId,
                consentFormName: log.consentFormName,
                description: log.description || "",
                patientName: log.patientName,
                date: new Date(log.createdAt).toLocaleDateString("en-GB"),
                hasSignature: false,
                status: "sent",
                signedAt: null,
              });
            });
           
            setConsentStatuses(Array.from(logMap.values()));
          });
        }, 100);
      } catch (logError) {
        console.error("Error logging consent form sent:", logError);
      }
    } catch (error: any) {
      console.error("Error sending consent form:", error?.response?.data || error.message);
    } finally {
      setSendingConsent(false);
    }
  };

  const monthsUntil = (endDate?: string | Date) => {
    if (!endDate) return null;
    try {
      const end = new Date(endDate);
      const now = new Date();
      let months =
        (end.getFullYear() - now.getFullYear()) * 12 +
        (end.getMonth() - now.getMonth());
      if (end.getDate() < now.getDate()) months -= 1;
      return months;
    } catch {
      return null;
    }
  };

  // Fetch billing history for the patient
  useEffect(() => {
    if (!isOpen || !appointment?.patientId) return;

    const fetchBillingHistory = async () => {
      setLoadingHistory(true);
      try {
        const headers = getAuthHeaders();
        const response = await axios.get(
          `/api/clinic/billing-history/${appointment.patientId}`,
          { headers },
        );
        if (response.data.success) {
            const filteredBillings = (response.data.billings || []).filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance");
            setBillingHistory(filteredBillings);
            
            // Calculate available cashback from billing history
            // Available = Earned (cashbackAmount) - Used (cashbackWalletUsed)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Calculate total earned cashback (still valid, excluding refunded)
            const cashbackEarnedBillings = (response.data.billings || []).filter((billing: any) => {
              // Skip refunded billings
              if (billing.isOfferRefunded) {
                return false;
              }
              
              if (!billing.isCashbackApplied || !billing.cashbackAmount || billing.cashbackAmount <= 0) {
                return false;
              }
              
              if (billing.cashbackEndDate) {
                const endDate = new Date(billing.cashbackEndDate);
                endDate.setHours(0, 0, 0, 0);
                return endDate >= today;
              }
              
              return false;
            });
            
            const totalCashbackEarned = cashbackEarnedBillings.reduce((sum: number, billing: any) => {
              return sum + (billing.cashbackAmount || 0);
            }, 0);
            
            // Calculate total used cashback (excluding refunded billings)
            const totalCashbackUsed = (response.data.billings || [])
              .filter((billing: any) => !billing.isOfferRefunded)
              .reduce((sum: number, billing: any) => {
                return sum + (billing.cashbackWalletUsed || 0);
              }, 0);
            
            // Available cashback = Earned - Used
            const availableCashbackAmount = Math.max(0, totalCashbackEarned - totalCashbackUsed);
            
            console.log('[CashbackModal] Cashback calculation:', {
              totalEarned: totalCashbackEarned,
              totalUsed: totalCashbackUsed,
              available: availableCashbackAmount
            });
            
            // Find nearest expiry from earned billings
            let nearestExpiry = null;
            if (cashbackEarnedBillings.length > 0) {
              const sortedByExpiry = cashbackEarnedBillings.sort((a: any, b: any) => {
                return new Date(a.cashbackEndDate).getTime() - new Date(b.cashbackEndDate).getTime();
              });
              nearestExpiry = sortedByExpiry[0].cashbackEndDate;
            }
            
            if (availableCashbackAmount > 0 && nearestExpiry) {
              setAvailableCashback({
                amount: availableCashbackAmount,
                expiryDate: nearestExpiry,
                daysRemaining: Math.ceil((new Date(nearestExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              });
              console.log('[CashbackModal] Available cashback:', {
                amount: availableCashbackAmount,
                expiryDate: nearestExpiry,
                daysRemaining: Math.ceil((new Date(nearestExpiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              });
            } else {
              setAvailableCashback(null);
              setUseCashback(false); // Reset cashback usage if no cashback available
            }
            setBillingHistoryFetched(true);
          }
      } catch (error) {
        console.error("Error fetching billing history:", error);
        setBillingHistory([]);
        setBillingHistoryFetched(true); // Allow initialization even on error
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchBillingHistory();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Visit count state
  const [visitCount, setVisitCount] = useState<number | null>(null);

  // Fetch membership usage for the patient
  useEffect(() => {
    if (!isOpen || !appointment?.patientId) return;

    const fetchMembershipUsage = async () => {
      setLoadingMembershipUsage(true);
      try {
        const headers = getAuthHeaders();
        const response = await axios.get(
          `/api/clinic/membership-usage/${appointment.patientId}`,
          { headers },
        );
        if (response.data.success) {
          setMembershipUsage(response.data);
        }
      } catch (error) {
        console.error("Error fetching membership usage:", error);
        setMembershipUsage(null);
      } finally {
        setLoadingMembershipUsage(false);
      }
    };

    fetchMembershipUsage();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Fetch visit count using all-appointments API
  useEffect(() => {
    if (!isOpen || !appointment?.patientId) return;
    const fetchVisitCount = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
       
        // Fetch appointments for the past year
        const today = new Date().toISOString().split('T')[0];
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
       
        const res = await axios.get(
          `/api/clinic/all-appointments?page=1&limit=1000&fromDate=${oneYearAgo.toISOString().split('T')[0]}&toDate=${today}`,
          { headers }
        );
       
        if (res.data?.success) {
          const patientAppointments = res.data.appointments?.filter(
            (apt: any) => apt.patientId === appointment.patientId
          ) || [];
         
          // Count total visits based on specific statuses
          const visitStatuses = ['arrived', 'waiting', 'consultation', 'approved', 'rescheduled', 'completed', 'discharge', 'invoice'];
          const totalVisits = patientAppointments.filter((apt: any) => {
            const status = (apt.status || '').toLowerCase();
            return visitStatuses.includes(status);
          }).length;
         
          setVisitCount(totalVisits ?? null);
        }
      } catch {
        setVisitCount(null);
      }
    };
    fetchVisitCount();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Initialize selected treatments from appointment when both are available.
  // If any billing already exists for this appointment, don't pre-select anything
  // to prevent accidental billing of remaining treatments.
  useEffect(() => {
    if (!isOpen || !appointment || treatments.length === 0) return;
    // Only auto-initialize if the user hasn't already selected treatments manually
    if (initializedAppointmentId.current === appointment._id) return;

    // If billing history has loaded, check if ANY billing exists for this appointment
    if (billingHistoryFetched) {
      const hasAnyBillingForAppointment = billedTreatmentInfos.length > 0;

      if (hasAnyBillingForAppointment) {
        // Don't pre-select any treatments - user must manually select what to bill
        console.log('[BillingModal] Billing already exists for this appointment. Not pre-selecting treatments.');
        setSelectedTreatments([]);
        initializedAppointmentId.current = appointment._id;
        return;
      }
    }

    // Only pre-select treatments if NO billing exists yet for this appointment
    const initialTreatments: SelectedTreatment[] = [];

    // Handle multiple services (serviceNames / serviceIds)
    if (appointment.serviceNames && appointment.serviceNames.length > 0) {
      appointment.serviceNames.forEach((name, index) => {
        const serviceIdItem = appointment.serviceIds?.[index];
        const slug = typeof serviceIdItem === 'string' ? serviceIdItem : serviceIdItem?._id;
        if (name && slug) {
          const matchingTreatment = treatments.find(t => t.slug === slug || t.name === name);
          initialTreatments.push({
            treatmentName: name,
            treatmentSlug: slug,
            price: matchingTreatment?.price || 0,
            quantity: 1,
            totalPrice: matchingTreatment?.price || 0,
          });
        }
      });
    }
    // Fallback to single service (serviceName / serviceId)
    else if (appointment.serviceName && appointment.serviceId) {
      const slug = typeof appointment.serviceId === 'string' ? appointment.serviceId : (appointment.serviceId as { _id: string })._id;
      const matchingTreatment = treatments.find(t => t.slug === slug || t.name === appointment.serviceName);
      initialTreatments.push({
        treatmentName: appointment.serviceName,
        treatmentSlug: slug,
        price: matchingTreatment?.price || 0,
        quantity: 1,
        totalPrice: matchingTreatment?.price || 0,
      });
    }

    // Only initialize if billing history has loaded
    if (billingHistoryFetched) {
      console.log('[BillingModal] First billing for this appointment. Pre-selecting:', initialTreatments.map(t => t.treatmentName));
      setSelectedTreatments(initialTreatments);
      initializedAppointmentId.current = appointment._id;
    }
  }, [isOpen, appointment, treatments, billingHistory, billingHistoryFetched, billedTreatmentInfos]);

  // Auto-select offer based on selected treatment
  useEffect(() => {
    const sameOfferIds = (a: Offer[], b: Offer[]) => {
      if (a.length !== b.length) return false;
      return a.every((offer, idx) => offer?._id === b[idx]?._id);
    };
    const sameUnmatchedMinimum = (
      a: Array<{ offer: Offer; minimumAmount: number; currentAmount: number }>,
      b: Array<{ offer: Offer; minimumAmount: number; currentAmount: number }>
    ) => {
      if (a.length !== b.length) return false;
      return a.every((item, idx) => {
        const next = b[idx];
        return (
          item.offer?._id === next.offer?._id &&
          item.minimumAmount === next.minimumAmount &&
          item.currentAmount === next.currentAmount
        );
      });
    };

    if (!isOpen || activeOffers.length === 0) {
      if (!offersClearedRef.current) {
        offersClearedRef.current = true;
        setMatchedOffers((prev) => (prev.length > 0 ? [] : prev));
        setAppliedOfferIds((prev) => (prev.length > 0 ? [] : prev));
      }
      return;
    }
    offersClearedRef.current = false;

    const currentTreatments = selectedService === "Treatment" 
      ? selectedTreatments.map(t => ({ slug: t.treatmentSlug, name: t.treatmentName, price: t.price, quantity: t.quantity }))
      : packageTreatmentSessions.filter(t => t.isSelected).map(t => ({ slug: t.treatmentSlug, name: t.treatmentName, price: t.sessionPrice, quantity: t.usedSessions }));

    if (currentTreatments.length === 0) {
      setMatchedOffers((prev) => (prev.length > 0 ? [] : prev));
      setAppliedOfferIds((prev) => (prev.length > 0 ? [] : prev));
      setUnmatchedOffersDueToMinimum((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    // IMPORTANT: If ALL selected treatments are free sessions (price = 0), don't apply offers
    const allTreatmentsAreFree = currentTreatments.every(t => t.price === 0);
    if (allTreatmentsAreFree) {
      console.log("[OfferMatching] All treatments are free sessions. Skipping offer matching.");
      setMatchedOffers((prev) => (prev.length > 0 ? [] : prev));
      setAppliedOfferIds((prev) => (prev.length > 0 ? [] : prev));
      setUnmatchedOffersDueToMinimum((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    // Filter out free session treatments when calculating base total and matching offers
    const paidTreatments = currentTreatments.filter(t => t.price > 0);
    
    // If no paid treatments, skip offer matching
    if (paidTreatments.length === 0) {
      console.log("[OfferMatching] No paid treatments. Skipping offer matching.");
      setMatchedOffers((prev) => (prev.length > 0 ? [] : prev));
      setAppliedOfferIds((prev) => (prev.length > 0 ? [] : prev));
      setUnmatchedOffersDueToMinimum((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const baseTotal = paidTreatments.reduce((sum, t) => sum + t.price * t.quantity, 0);
    
    // Appointment-level context for matching
    const currentDoctorId = typeof appointment?.doctorId === 'object'
      ? (appointment.doctorId as any)._id
      : appointment?.doctorId;

    billingDebugLog("[OfferMatching] Attempting to match offers for treatments:", currentTreatments, "Base Total:", baseTotal);
    
    // Track offers that don't match due to minimum bill amount
    const unmatchedMinimum: Array<{offer: Offer, minimumAmount: number, currentAmount: number}> = [];
    
    // Find applicable offers for the selected treatments
    const applicableOffers = activeOffers.filter(offer => {
      // 0. Check Minimum Bill Amount
      if (offer.minimumBillAmount > 0 && baseTotal < offer.minimumBillAmount) {
        console.log(`[OfferMatching] Offer "${offer.title}" skipped: Base total ${baseTotal} is below minimum bill amount ${offer.minimumBillAmount}.`);
        unmatchedMinimum.push({
          offer,
          minimumAmount: offer.minimumBillAmount,
          currentAmount: baseTotal
        });
        return false;
      }

      // 1. Check Global Application
      if (offer.applyOnAllServices) {
        console.log(`[OfferMatching] Offer "${offer.title}" matches globally.`);
        return true;
      }
      
      // 2. Check Doctor-Specific Application
      if (offer.doctorIds && Array.isArray(offer.doctorIds) && currentDoctorId) {
        if (offer.doctorIds.some(id => String(id) === String(currentDoctorId))) {
          billingDebugLog(`[OfferMatching] Offer "${offer.title}" matches for current doctor.`);
          return true;
        }
      }

      // 3. Check Service-Specific Application (Slug or Name or ID)
       if (offer.serviceIds && Array.isArray(offer.serviceIds)) {
         const matchesService = paidTreatments.some(t => 
           offer.serviceIds.some(svc => {
             if (typeof svc === 'string') {
               return String(svc) === String(t.slug) || String(svc).toLowerCase() === String(t.name).toLowerCase();
             } else if (svc && typeof svc === 'object') {
               return (
                 String(svc._id) === String(t.slug) || 
                 (svc.serviceSlug && String(svc.serviceSlug) === String(t.slug)) ||
                 (svc.name && String(svc.name).toLowerCase() === String(t.name).toLowerCase())
               );
             }
             return false;
           })
         );
         if (matchesService) {
           console.log(`[OfferMatching] Offer "${offer.title}" matches for selected service (slug/name/id).`);
           return true;
         }
       }
       
       // 4. Fallback: Check serviceNames array (cached names at creation time)
       if (offer.serviceNames && Array.isArray(offer.serviceNames) && offer.serviceNames.length > 0) {
         const matchesServiceName = paidTreatments.some(t =>
           offer.serviceNames!.some((name: string) => String(name).toLowerCase() === String(t.name).toLowerCase())
         );
         if (matchesServiceName) {
           console.log(`[OfferMatching] Offer "${offer.title}" matches for selected service (serviceNames fallback).`);
           return true;
         }
       }

      return false;
    });

    if (applicableOffers.length > 0) {
      // Sort to find the best offer (highest actual discount amount)
      applicableOffers.sort((a, b) => {
        const getDiscountAmount = (offer: Offer) => {
          let amount = 0;
          if (offer.discountMode === "percentage") {
            amount = (baseTotal * offer.discountValue) / 100;
            if (offer.maxBenefitCap > 0) amount = Math.min(amount, offer.maxBenefitCap);
          } else {
            amount = offer.discountValue;
          }
          return amount;
        };
        return getDiscountAmount(b) - getDiscountAmount(a);
      });

      billingDebugLog(`[OfferMatching] Matched ${applicableOffers.length} offers.`);
      setMatchedOffers((prev) =>
        sameOfferIds(prev, applicableOffers) ? prev : applicableOffers
      );
      matchedOffersRef.current = applicableOffers; // Sync ref
      setUnmatchedOffersDueToMinimum((prev) =>
        sameUnmatchedMinimum(prev, unmatchedMinimum) ? prev : unmatchedMinimum
      );
      // Keep only those applied IDs that are still in applicable offers
      setAppliedOfferIds((prev) => {
        const filtered = prev.filter((id) => applicableOffers.some((o) => o._id === id));
        if (filtered.length === prev.length && filtered.every((id, idx) => id === prev[idx])) {
          return prev;
        }
        return filtered;
      });
    } else {
      console.log("[OfferMatching] No applicable offers found.");
      setMatchedOffers((prev) => (prev.length > 0 ? [] : prev));
      matchedOffersRef.current = []; // Sync ref
      setUnmatchedOffersDueToMinimum((prev) =>
        sameUnmatchedMinimum(prev, unmatchedMinimum) ? prev : unmatchedMinimum
      );
      setAppliedOfferIds((prev) => (prev.length > 0 ? [] : prev));
    }
  }, [isOpen, activeOffers, selectedTreatments, selectedService, packageTreatmentSessions, appointment?.doctorId]);

  // ============================================
  // NEW: Flag-Based Discount Visibility Logic
  // ============================================
  // This useEffect evaluates matched offers and determines which discount sources should be visible
  // based on the three flags: allowCombiningWithOtherOffers, allowReceptionistDiscount, autoApplyBestOffer
  useEffect(() => {
    // If no offers matched, keep existing behavior - show all discounts
    if (!isOpen || matchedOffers.length === 0) {
      console.log('[FlagLogic] No matched offers - showing all discount sources');
      setShowMembershipDiscount(true);
      setShowAgentDiscount(true);
      setShowDoctorDiscount(true);
      return;
    }

    console.log('[FlagLogic] Matched offers found - applying flag-based visibility logic');
    
    // Evaluate flags from all matched offers
    // Strategy: Use the most restrictive flags across all matched offers
    const allowCombining = matchedOffers.every(o => o.allowCombiningWithOtherOffers);
    const allowReceptionist = matchedOffers.some(o => o.allowReceptionistDiscount); // If ANY allows receptionist, show it
    const autoApply = matchedOffers.some(o => o.autoApplyBestOffer); // If ANY has auto-apply, enable it

    console.log('[FlagLogic] Evaluated flags:', {
      allowCombiningWithOtherOffers: allowCombining,
      allowReceptionistDiscount: allowReceptionist,
      autoApplyBestOffer: autoApply,
      matchedOffersCount: matchedOffers.length
    });

    // ==========================================
    // CASE 1: allowCombining=true, allowReceptionistDiscount=false, autoApplyBestOffer=true
    // ==========================================
    // Show: All offers + Membership discount (doctor discount too)
    // Hide: Agent discount (receptionist discount not allowed)
    // Auto-apply: Best offer from matched offers only
    if (allowCombining && !allowReceptionist && autoApply) {
      console.log('[FlagLogic] Case 1: Show offers + membership, hide agent, auto-apply best offer');
      setShowMembershipDiscount(true);
      setShowAgentDiscount(false);
      setShowDoctorDiscount(true);
    }
    
    // ==========================================
    // CASE 2: allowCombining=true, allowReceptionistDiscount=true, autoApplyBestOffer=true
    // ==========================================
    // Show: All offers + Membership + Agent + Doctor discounts
    // Auto-apply: Best discount among ALL (offers + agent + doctor)
    else if (allowCombining && allowReceptionist && autoApply) {
      console.log('[FlagLogic] Case 2: Show ALL discounts, auto-apply best among all');
      setShowMembershipDiscount(true);
      setShowAgentDiscount(true);
      setShowDoctorDiscount(true);
    }
    
    // ==========================================
    // CASE 3: allowCombining=true, allowReceptionistDiscount=true, autoApplyBestOffer=false
    // ==========================================
    // Show: All discounts visible
    // Do NOT auto-apply: All have manual "Apply" buttons
    else if (allowCombining && allowReceptionist && !autoApply) {
      console.log('[FlagLogic] Case 3: Show ALL discounts, NO auto-apply (manual only)');
      setShowMembershipDiscount(true);
      setShowAgentDiscount(true);
      setShowDoctorDiscount(true);
    }
    
    // ==========================================
    // CASE 4: allowCombining=false, allowReceptionistDiscount=true, autoApplyBestOffer=true
    // ==========================================
    // Show: Only createOffer offers + Agent discount
    // Hide: Membership discount
    // Auto-apply: Best among (matched offers + agent discount)
    else if (!allowCombining && allowReceptionist && autoApply) {
      console.log('[FlagLogic] Case 4: Show offers + agent only (no membership), auto-apply best');
      setShowMembershipDiscount(false);
      setShowAgentDiscount(true);
      setShowDoctorDiscount(true);
    }
    
    // Default: fallback to current behavior (show all)
    else {
      console.log('[FlagLogic] Default case: showing all discount sources');
      setShowMembershipDiscount(true);
      setShowAgentDiscount(true);
      setShowDoctorDiscount(true);
    }
  }, [isOpen, matchedOffers]);

  // ============================================
  // NEW: Auto-Apply Best Offer Logic
  // ============================================
  // This useEffect automatically compares all eligible discounts and applies the best one
  // when autoApplyBestOffer flag is true
  useEffect(() => {
    // Skip if modal not open, no offers matched, or auto-apply is disabled
    if (!isOpen || matchedOffers.length === 0) return;
    
    // Check if ANY matched offer has autoApplyBestOffer enabled
    const hasAutoApply = matchedOffers.some(o => o.autoApplyBestOffer);
    if (!hasAutoApply) {
      console.log('[AutoApply] Auto-apply disabled - manual mode');
      return; // Manual mode - skip auto-application
    }

    console.log('[AutoApply] Auto-apply enabled - calculating best discount');
    
    // Calculate base total from selected treatments
    const currentTreatments = selectedService === "Treatment" 
      ? selectedTreatments.map(t => ({ price: t.price, quantity: t.quantity }))
      : packageTreatmentSessions.filter(t => t.isSelected).map(t => ({ price: t.sessionPrice, quantity: t.usedSessions }));
    
    const baseTotal = currentTreatments.reduce((sum, t) => sum + (t.price || 0) * (t.quantity || 1), 0);
    if (baseTotal === 0) {
      console.log('[AutoApply] Base total is 0 - skipping auto-apply');
      return;
    }

    // Collect all eligible discounts based on visibility flags
    const eligibleDiscounts: Array<{type: string, amount: number, id?: string, label?: string}> = [];

    // 1. Calculate offer discounts for all matched offers
    matchedOffers.forEach(offer => {
      // Skip bundle and cashback offers from instant discount comparison
      if (offer.offerType === 'bundle' || offer.offerType === 'cashback') {
        console.log(`[AutoApply] Skipping ${offer.offerType} offer "${offer.title}" from instant discount comparison`);
        return;
      }

      let discountAmount = 0;
      if (offer.discountMode === 'percentage') {
        discountAmount = (baseTotal * offer.discountValue) / 100;
        if (offer.maxBenefitCap > 0) {
          discountAmount = Math.min(discountAmount, offer.maxBenefitCap);
        }
      } else {
        discountAmount = offer.discountValue || 0;
      }
      
      console.log(`[AutoApply] Offer "${offer.title}": ${offer.discountMode} ${offer.discountValue} = ${discountAmount}`);
      eligibleDiscounts.push({ 
        type: 'offer', 
        amount: discountAmount, 
        id: offer._id,
        label: offer.title 
      });
    });

    // 2. Add agent discount if visible and available
    if (showAgentDiscount && agentDiscount && agentDiscount.discountAmount > 0) {
      let agentAmount = 0;
      if (agentDiscount.discountType === 'percentage') {
        agentAmount = (baseTotal * agentDiscount.discountAmount) / 100;
      } else {
        agentAmount = agentDiscount.discountAmount;
      }
      console.log(`[AutoApply] Agent discount: ${agentAmount}`);
      eligibleDiscounts.push({ type: 'agent', amount: agentAmount, label: 'Agent Discount' });
    }

    // 3. Add doctor discount if visible and available
    if (showDoctorDiscount && doctorComplaintDiscount && doctorComplaintDiscount.discountAmount > 0) {
      let doctorAmount = 0;
      if (doctorComplaintDiscount.discountType === 'percentage') {
        doctorAmount = (baseTotal * doctorComplaintDiscount.discountAmount) / 100;
      } else {
        doctorAmount = doctorComplaintDiscount.discountAmount;
      }
      console.log(`[AutoApply] Doctor discount: ${doctorAmount}`);
      eligibleDiscounts.push({ type: 'doctor', amount: doctorAmount, label: 'Doctor Discount' });
    }

    if (eligibleDiscounts.length === 0) {
      console.log('[AutoApply] No eligible discounts found');
      return;
    }

    // 4. Find highest discount
    const bestDiscount = eligibleDiscounts.reduce((best, current) => 
      current.amount > best.amount ? current : best
    , { type: '', amount: 0, label: '' });

    console.log('[AutoApply] Best discount:', bestDiscount);

    // 5. Apply best discount automatically
    if (bestDiscount.type === 'offer' && bestDiscount.id) {
      console.log(`[AutoApply] Auto-applying offer: ${bestDiscount.label} (${bestDiscount.amount})`);
      setAppliedOfferIds([bestDiscount.id]);
      setIsAgentDiscountApplied(false);
      setIsDoctorDiscountApplied(false);
    } else if (bestDiscount.type === 'agent') {
      console.log(`[AutoApply] Auto-applying agent discount: ${bestDiscount.amount}`);
      setIsAgentDiscountApplied(true);
      setIsDoctorDiscountApplied(false);
      setAppliedOfferIds([]);
    } else if (bestDiscount.type === 'doctor') {
      console.log(`[AutoApply] Auto-applying doctor discount: ${bestDiscount.amount}`);
      setIsDoctorDiscountApplied(true);
      setIsAgentDiscountApplied(false);
      setAppliedOfferIds([]);
    }

  }, [isOpen, matchedOffers, agentDiscount, doctorComplaintDiscount, showAgentDiscount, showDoctorDiscount, selectedTreatments, selectedService, packageTreatmentSessions]);

  // Bundle Offer Matching Logic
  useEffect(() => {
    const clearBundleStateOnce = () => {
      if (!bundleClearedRef.current) {
        bundleClearedRef.current = true;
        setMatchedBundleOffer((prev) => (prev ? null : prev));
        setBundleFreeSessions((prev) => (prev.length > 0 ? [] : prev));
        setBundleFreeSessionCount((prev) => (prev !== 0 ? 0 : prev));
      }
    };

    if (!isOpen || activeOffers.length === 0) {
      clearBundleStateOnce();
      return;
    }
    bundleClearedRef.current = false;

    const currentTreatments = selectedService === "Treatment" 
      ? selectedTreatments.map(t => ({ slug: t.treatmentSlug, name: t.treatmentName, price: t.price, quantity: t.quantity }))
      : packageTreatmentSessions.filter(t => t.isSelected).map(t => ({ slug: t.treatmentSlug, name: t.treatmentName, price: t.sessionPrice, quantity: t.usedSessions }));

    if (currentTreatments.length === 0) {
      clearBundleStateOnce();
      return;
    }

    // IMPORTANT: If ALL selected treatments are free sessions (price = 0), don't match bundle offers
    const allTreatmentsAreFree = currentTreatments.every(t => t.price === 0);
    if (allTreatmentsAreFree) {
      console.log("[BundleMatching] All treatments are free sessions. Skipping bundle matching.");
      clearBundleStateOnce();
      return;
    }

    // Filter out free session treatments when checking bundle eligibility
    const paidTreatments = currentTreatments.filter(t => t.price > 0);
    
    // If no paid treatments, skip bundle matching
    if (paidTreatments.length === 0) {
      console.log("[BundleMatching] No paid treatments. Skipping bundle matching.");
      clearBundleStateOnce();
      return;
    }

    const baseTotal = paidTreatments.reduce((sum, t) => sum + t.price * t.quantity, 0);
    
    billingDebugLog("[BundleMatching] Checking for bundle offers. Selected treatments:", currentTreatments, "Paid treatments:", paidTreatments);

    // Find bundle offers
    const bundleOffers = activeOffers.filter(offer => offer.offerType === "bundle");
    
    if (bundleOffers.length === 0) {
      billingDebugLog("[BundleMatching] No bundle offers found.");
      clearBundleStateOnce();
      return;
    }

    // Check each bundle offer
    let bestBundleOffer: Offer | null = null;
    let bestFreeSessions: string[] = [];
    let bestFreeCount = 0;

    for (const offer of bundleOffers) {
      // Skip if bundle doesn't have valid buyQty/freeQty
      if (!offer.buyQty || offer.buyQty <= 0 || !offer.freeQty || offer.freeQty <= 0) {
        continue;
      }

      // Skip if minimum bill amount not met
      if (offer.minimumBillAmount > 0 && baseTotal < offer.minimumBillAmount) {
        console.log(`[BundleMatching] Bundle "${offer.title}" skipped: Base total ${baseTotal} below minimum ${offer.minimumBillAmount}`);
        continue;
      }

      // Check which selected treatments are in the bundle's serviceIds
      const eligibleTreatments: typeof currentTreatments = [];
      let hasBundleServicesSelected = false;
      
      if (offer.serviceIds && Array.isArray(offer.serviceIds) && offer.serviceIds.length > 0) {
        // Bundle has specific services - check if ANY treatments from the bundle are selected
        // For "Buy 2 Get 1 Free", the bundle should apply when at least buyQty treatments are selected
        // Not ALL services need to be selected - only those that the patient is actually receiving
        
        // First, collect all treatments from the bundle that are selected
        for (const treatment of paidTreatments) {
          const isInBundle = offer.serviceIds.some(svc => {
            if (typeof svc === 'string') {
              return String(svc) === String(treatment.slug) || 
                     String(svc).toLowerCase() === String(treatment.name).toLowerCase();
            } else if (svc && typeof svc === 'object') {
              return (
                String(svc._id) === String(treatment.slug) || 
                (svc.serviceSlug && String(svc.serviceSlug) === String(treatment.slug)) ||
                (svc.name && String(svc.name).toLowerCase() === String(treatment.name).toLowerCase())
              );
            }
            return false;
          });
          
          if (isInBundle) {
            hasBundleServicesSelected = true;
            // Add treatment quantity times (if quantity > 1, count it multiple times)
            for (let i = 0; i < treatment.quantity; i++) {
              eligibleTreatments.push(treatment);
            }
          }
        }
        
        // For bundle offers, we DON'T require all services to be selected
        // Just check if at least buyQty treatments from the bundle are selected
        // hasBundleServicesSelected is already set based on whether ANY bundle services are selected
        // The actual check happens later: eligibleTreatments.length >= offer.buyQty
      } else if (offer.applyOnAllServices) {
        // Bundle applies to all services - but only paid ones
        hasBundleServicesSelected = true;
        eligibleTreatments.push(...paidTreatments.flatMap(t => 
          Array(t.quantity).fill(t)
        ));
      }

      console.log(`[BundleMatching] Bundle "${offer.title}": ${eligibleTreatments.length} eligible treatments from ${paidTreatments.length} paid treatments (need ${offer.buyQty}), Bundle services selected: ${hasBundleServicesSelected}`);

      // Check if we have enough eligible treatments from the bundle
      // The bundle applies when at least buyQty treatments from the bundle are selected
      if (hasBundleServicesSelected && eligibleTreatments.length >= offer.buyQty) {
        // Sort eligible treatments by price (ascending) to find lowest-priced ones for free sessions
        const sortedByPrice = [...eligibleTreatments].sort((a, b) => a.price - b.price);
        
        // The lowest-priced treatments become free
        const freeSessions = sortedByPrice.slice(0, offer.freeQty).map(t => t.name);
        const freeCount = Math.min(offer.freeQty, eligibleTreatments.length);

        console.log(`[BundleMatching] Bundle "${offer.title}" MATCHED! Free sessions:`, freeSessions);

        // Store this as the best bundle offer (you could add logic to compare multiple bundles)
        if (!bestBundleOffer || freeCount > bestFreeCount) {
          bestBundleOffer = offer;
          bestFreeSessions = freeSessions;
          bestFreeCount = freeCount;
        }
      }
    }

    if (bestBundleOffer) {
      console.log(`[BundleMatching] Best bundle offer: ${bestBundleOffer.title}, Free sessions: ${bestFreeSessions.join(', ')}`);
      setMatchedBundleOffer((prev) =>
        prev?._id === bestBundleOffer!._id ? prev : bestBundleOffer
      );
      setBundleFreeSessions((prev) => {
        if (prev.length === bestFreeSessions.length && prev.every((s, i) => s === bestFreeSessions[i])) {
          return prev;
        }
        return bestFreeSessions;
      });
      setBundleFreeSessionCount((prev) => (prev === bestFreeCount ? prev : bestFreeCount));
      
      // Auto-apply the bundle offer
      setAppliedOfferIds(prev => {
        if (!prev.includes(bestBundleOffer!._id)) {
          return [...prev, bestBundleOffer!._id];
        }
        return prev;
      });
    } else {
      console.log("[BundleMatching] No matching bundle offers.");
      clearBundleStateOnce();
    }
  }, [isOpen, activeOffers, selectedTreatments, selectedService, packageTreatmentSessions]);

  // Cashback Offer Matching Logic
  useEffect(() => {
    // CRITICAL: Do NOT run any logic or set any state when modal is closed
    // This prevents infinite loops on pages where the component is mounted but modal is closed
    if (!isOpen) {
      return;
    }
    
    if (activeOffers.length === 0) {
      console.log('[CashbackMatching] Skipped: isOpen=', isOpen, 'activeOffers.length=', activeOffers?.length || 0);
      setMatchedCashbackOffer(null);
      setAppliedCashbackAmount(0);
      return;
    }

    const currentTreatments = selectedService === "Treatment" 
      ? selectedTreatments.map(t => ({ slug: t.treatmentSlug, name: t.treatmentName, price: t.price, quantity: t.quantity }))
      : packageTreatmentSessions.filter(t => t.isSelected).map(t => ({ slug: t.treatmentSlug, name: t.treatmentName, price: t.sessionPrice, quantity: t.usedSessions }));

    if (currentTreatments.length === 0) {
      console.log('[CashbackMatching] Skipped: No treatments selected');
      setMatchedCashbackOffer(null);
      setAppliedCashbackAmount(0);
      return;
    }

    const baseTotal = currentTreatments.reduce((sum, t) => sum + t.price * t.quantity, 0);
    
    billingDebugLog('[CashbackMatching] Checking for cashback offers. Selected treatments:', currentTreatments);
    billingDebugLog('[CashbackMatching] Base total:', baseTotal);
    billingDebugLog('[CashbackMatching] Total active offers:', activeOffers.length);
    
    // Find cashback offers
    const cashbackOffers = activeOffers.filter(offer => offer.offerType === "cashback");
    billingDebugLog('[CashbackMatching] All active offers with types:', activeOffers.map(o => ({
      title: o.title,
      offerType: o.offerType,
      applyOnAllServices: o.applyOnAllServices,
      serviceIds: o.serviceIds
    })));
    billingDebugLog('[CashbackMatching] Cashback offers found:', cashbackOffers.length);
    if (cashbackOffers.length > 0) {
      console.log('[CashbackMatching] Cashback offers details:', cashbackOffers.map(o => ({
        title: o.title,
        offerType: o.offerType,
        discountMode: o.discountMode,
        discountValue: o.discountValue
      })));
    }
    
    if (cashbackOffers.length === 0) {
      billingDebugLog("[CashbackMatching] No cashback offers found.");
      setMatchedCashbackOffer(null);
      setAppliedCashbackAmount(0);
      return;
    }

    // Find best cashback offer (by discount value)
    let bestCashbackOffer: Offer | null = null;
    let bestCashbackAmount = 0;

    for (const offer of cashbackOffers) {
      console.log(`[CashbackMatching] Processing cashback offer:`, {
        title: offer.title,
        cashbackAmount: offer.cashbackAmount,    // ← Use cashbackAmount for cashback offers
        cashbackExpiryDays: offer.cashbackExpiryDays,
        minimumBillAmount: offer.minimumBillAmount,
        baseTotal: baseTotal
      });
      
      // Skip if no cashback amount
      if (!offer.cashbackAmount || offer.cashbackAmount <= 0) {
        console.log(`[CashbackMatching] Skip: No cashback amount`);
        continue;
      }

      // Skip if minimum bill amount not met
      if (offer.minimumBillAmount > 0 && baseTotal < offer.minimumBillAmount) {
        console.log(`[CashbackMatching] Cashback "${offer.title}" skipped: Base total ${baseTotal} below minimum ${offer.minimumBillAmount}`);
        continue;
      }

      // Check which selected treatments are in the offer's serviceIds
      let eligibleTotal = 0;
      console.log(`[CashbackMatching] Checking serviceIds:`, {
        serviceIds: offer.serviceIds,
        currentTreatments: currentTreatments
      });
      
      if (offer.serviceIds && Array.isArray(offer.serviceIds) && offer.serviceIds.length > 0) {
        // Offer has specific services - check matches
        for (const treatment of currentTreatments) {
          const isEligible = offer.serviceIds.some(svc => {
            if (typeof svc === 'string') {
              return svc.toLowerCase() === treatment.slug.toLowerCase() || svc.toLowerCase() === treatment.name.toLowerCase();
            }
            return svc.serviceSlug?.toLowerCase() === treatment.slug.toLowerCase() || svc.name?.toLowerCase() === treatment.name.toLowerCase();
          });
          console.log(`[CashbackMatching] Treatment "${treatment.name}" (slug: ${treatment.slug}) eligible:`, isEligible);
          if (isEligible) {
            eligibleTotal += treatment.price * treatment.quantity;
          }
        }
        console.log(`[CashbackMatching] Eligible total for "${offer.title}":`, eligibleTotal);
      } else {
        // No specific services - apply to all
        eligibleTotal = baseTotal;
        console.log(`[CashbackMatching] No serviceIds, applying to all. Eligible total:`, eligibleTotal);
      }

      // For cashback offers, use the fixed cashbackAmount
      // (NOT discountValue - that's for instant_discount offers)
      let cashbackAmount = offer.cashbackAmount || 0;
      
      console.log(`[CashbackMatching] Cashback "${offer.title}": ${cashbackAmount} (fixed amount from cashbackAmount field)`);

      if (cashbackAmount > bestCashbackAmount) {
        bestCashbackAmount = cashbackAmount;
        bestCashbackOffer = offer;
      }
    }

    if (bestCashbackOffer) {
      console.log(`[CashbackMatching] Best cashback offer: ${bestCashbackOffer.title}, Cashback: ${bestCashbackAmount}`);
      setMatchedCashbackOffer(bestCashbackOffer);
      
      // Check if this is the same offer that was already applied (using ref to avoid stale closure)
      const isSameOffer = appliedCashbackRef.current && appliedCashbackRef.current.offerId === bestCashbackOffer._id;
      
      if (isSameOffer) {
        // Restore the applied amount from ref
        const refData = appliedCashbackRef.current;
        if (refData) {
          console.log('[CashbackMatching] Restoring applied cashback amount for same offer', {
            offerId: bestCashbackOffer._id,
            amount: refData.amount
          });
          setAppliedCashbackAmount(refData.amount);
          setIsCashbackApplied(true);
        }
      } else {
        // Reset if different offer or not applied yet
        console.log('[CashbackMatching] Resetting cashback amount (different offer or not applied)', {
          currentRef: appliedCashbackRef.current,
          newOfferId: bestCashbackOffer._id
        });
        setAppliedCashbackAmount(0);
        setIsCashbackApplied(false);
      }
    } else {
      console.log("[CashbackMatching] No matching cashback offers.");
      setMatchedCashbackOffer(null);
      setAppliedCashbackAmount(0);
      setIsCashbackApplied(false);  // Also reset applied state when no offer matches
    }
  }, [isOpen, activeOffers, selectedTreatments, selectedService, packageTreatmentSessions]);

  // Fetch and override referredBy with patient's referral name when available
  useEffect(() => {
    const fetchReferralName = async () => {
      if (!isOpen || !appointment?.patientId) return;
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get(
          `/api/staff/get-patient-data/${appointment.patientId}`,
          { headers },
        );
        const patientData = res?.data || null;
        setPatientDetails(patientData);
        const patientReferral = patientData?.referredBy || "";
        if (patientReferral && typeof patientReferral === "string") {
          setFormData((prev) => ({
            ...prev,
            referredBy: patientReferral,
          }));
        }
      } catch (err) {
        // Ignore errors, keep existing appointment.referral fallback
      }
    };
    fetchReferralName();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Fetch doctor's discount information
  useEffect(() => {
    const fetchDoctorDiscount = async () => {
      if (!isOpen || !appointment?.doctorId) return;
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
       
        const docId = typeof appointment.doctorId === 'object'
          ? (appointment.doctorId as any)._id
          : appointment.doctorId;

        if (!docId) return;

        const res = await axios.get(
          `/api/lead-ms/get-agents?agentId=${docId}`,
          { headers },
        );
        if (res.data.success && res.data.profile) {
          const profile = res.data.profile;
          if (profile.discountType && profile.discountAmount) {
            setDoctorDiscount({
              discountType: profile.discountType,
              discountAmount: parseFloat(profile.discountAmount) || 0,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching doctor discount:", err);
      }
    };
    fetchDoctorDiscount();
  }, [isOpen, appointment?.doctorId, getAuthHeaders]);

  // Fetch agent's discount information
  useEffect(() => {
    const fetchAgentDiscount = async () => {
      if (!isOpen) return;
      const { id: agentId } = getUserInfo();
      if (!agentId) return;

      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get(
          `/api/lead-ms/get-agents?agentId=${agentId}`,
          { headers },
        );
        if (res.data.success && res.data.profile) {
          const profile = res.data.profile;
          if (profile.discountType && profile.discountAmount) {
            setAgentDiscount({
              discountType: profile.discountType,
              discountAmount: parseFloat(profile.discountAmount) || 0,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching agent discount:", err);
      }
    };
    fetchAgentDiscount();
  }, [isOpen, getAuthHeaders]);

  // Fetch doctor's discount application status from complaint
  useEffect(() => {
    const fetchDoctorAppliedDiscountStatus = async () => {
      if (!isOpen || !appointment?._id) return;
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await axios.get(
          `/api/clinic/patient-complaints?appointmentId=${appointment._id}`,
          { headers },
        );
        if (res.data.success && Array.isArray(res.data.complaints)) {
          // Find if any complaint has isDoctorDiscountApplied set truthy
          const appliedComplaint = res.data.complaints.find(
            (c: any) => Boolean(c?.isDoctorDiscountApplied),
          );
          const hasAppliedFromComplaint = !!appliedComplaint;
          setDoctorAppliedDiscount(hasAppliedFromComplaint);
         
          if (hasAppliedFromComplaint) {
            setDoctorComplaintDiscount({
              discountType: appliedComplaint.doctorDiscountType,
              discountAmount: parseFloat(appliedComplaint.doctorDiscountAmount) || 0,
            });
          }

          // Max Discount Logic: Auto-apply the absolute better one
          // We have: doctorDiscount (profile), agentDiscount (profile), doctorComplaintDiscount (complaint)
         
          const doctorEffectiveDisc = hasAppliedFromComplaint
            ? { type: appliedComplaint.doctorDiscountType, amount: parseFloat(appliedComplaint.doctorDiscountAmount) || 0 }
            : null;

          const agentEffectiveDisc = agentDiscount
            ? { type: agentDiscount.discountType, amount: agentDiscount.discountAmount }
            : null;

          // Check if any matched offer has allowReceptionistDiscount = false
          // Use ref to avoid infinite loop
          const currentMatchedOffers = matchedOffersRef.current;
          const hasOffersWithReceptionistDiscountFalse = currentMatchedOffers.length > 0 && 
            currentMatchedOffers.some(o => o.allowReceptionistDiscount === false);

          // If offers with allowReceptionistDiscount: false are matched, remove agent discount if it was auto-applied
          if (hasOffersWithReceptionistDiscountFalse && isAgentDiscountApplied) {
            console.log(`[MaxDiscount] Offers with allowReceptionistDiscount: false detected. Removing auto-applied agent discount.`);
            setIsAgentDiscountApplied(false);
          }

          if (!isAgentDiscountApplied && !isDoctorDiscountApplied) {
            // If offers exist with allowReceptionistDiscount: false, skip auto-apply
            if (hasOffersWithReceptionistDiscountFalse) {
              console.log(`[MaxDiscount] Matched offers have allowReceptionistDiscount: false. NOT auto-applying agent discount.`);
              // Skip auto-apply - user must manually apply agent discount if needed
            } else {
              // No offers OR offers have allowReceptionistDiscount: true - run max discount logic
              if (doctorEffectiveDisc && agentEffectiveDisc) {
                // Assuming same types for simple comparison (usually %)
                if (agentEffectiveDisc.amount > doctorEffectiveDisc.amount) {
                  console.log(`[MaxDiscount] Agent discount (${agentEffectiveDisc.amount}) > Doctor discount (${doctorEffectiveDisc.amount}). Auto-applying agent discount.`);
                  setIsAgentDiscountApplied(true);
                  setIsDoctorDiscountApplied(false);
                } else {
                  console.log(`[MaxDiscount] Doctor discount (${doctorEffectiveDisc.amount}) >= Agent discount (${agentEffectiveDisc.amount}). Auto-applying doctor discount.`);
                  setIsDoctorDiscountApplied(true);
                  setIsAgentDiscountApplied(false);
                }
              } else if (doctorEffectiveDisc) {
                console.log(`[MaxDiscount] Only doctor discount exists. Auto-applying doctor discount.`);
                setIsDoctorDiscountApplied(true);
              } else if (agentEffectiveDisc) {
                console.log(`[MaxDiscount] Only agent discount exists. Auto-applying agent discount.`);
                setIsAgentDiscountApplied(true);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching doctor applied discount status:", err);
      }
    };
    fetchDoctorAppliedDiscountStatus();
  }, [isOpen, appointment?._id, getAuthHeaders, agentDiscount, doctorDiscount]); // Removed matchedOffers to prevent infinite loop

  // Watch matchedOffers and remove agent discount if allowReceptionistDiscount is false
  useEffect(() => {
    if (!isOpen || matchedOffers.length === 0) return;
    
    // Check if any matched offer has allowReceptionistDiscount: false
    const hasOffersWithReceptionistDiscountFalse = matchedOffers.some(o => o.allowReceptionistDiscount === false);
    
    if (hasOffersWithReceptionistDiscountFalse && isAgentDiscountApplied) {
      console.log(`[OfferWatch] Matched offers have allowReceptionistDiscount: false. Removing auto-applied agent discount.`);
      setIsAgentDiscountApplied(false);
    }
  }, [isOpen, matchedOffers, isAgentDiscountApplied]);

  // Handle maximum discount logic
  useEffect(() => {
    if (!isOpen || !doctorDiscount || !agentDiscount) return;

    // Convert both to percentage for comparison if needed
    // Assuming both are percentages for now as per requirement description
    if (
      agentDiscount.discountAmount > doctorDiscount.discountAmount &&
      doctorAppliedDiscount
    ) {
      // Suggest agent discount or apply if agent prefers
      // For now, let's keep the doctor's if they applied it, but give the option to switch
    }
  }, [isOpen, doctorDiscount, agentDiscount, doctorAppliedDiscount]);

  // Smart recommendations fetch disabled
  useEffect(() => {
    // Smart recommendations section removed from UI
  }, [isOpen, appointment?.doctorId, getAuthHeaders]);

  // Fetch active package usage for patient
  useEffect(() => {
    const fetchActivePackageUsage = async () => {
      if (!isOpen || !appointment?.patientId) return;
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;
     
      setLoadingActivePackageUsage(true);
      try {
        const response = await axios.get(
          `/api/clinic/package-usage/${appointment.patientId}`,
          { headers }
        );
       
        if (response.data.success && response.data.packageUsage) {
          setActivePackageUsage(response.data.packageUsage);
         
          // Auto-expand first package
          const firstPkg = response.data.packageUsage[0]?.packageName;
          if (firstPkg) {
            setExpandedPackages({ [firstPkg]: true });
          }
        } else {
          setActivePackageUsage([]);
        }
      } catch (error) {
        console.error("Error fetching active package usage:", error);
        setActivePackageUsage([]);
      } finally {
        setLoadingActivePackageUsage(false);
      }
    };
   
    fetchActivePackageUsage();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Fetch available free sessions from billing history
  useEffect(() => {
    const fetchFreeSessions = async () => {
      if (!isOpen || !appointment?.patientId) return;
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;
     
      setLoadingFreeSessions(true);
      try {
        // Fetch billing history for this patient
        const response = await axios.get(
          `/api/clinic/billing-history/${appointment.patientId}`,
          { headers }
        );
       
        if (response.data.success && response.data.billings) {
          // Extract bundle offers with free sessions and calculate remaining (unused) sessions
          const allBillings = response.data.billings;
          
          // Build a map of used free sessions across all billings
          const usedSessionsMap = new Map<string, number>();
          allBillings.forEach((billing: any) => {
            if (billing.usedFreeSessions && Array.isArray(billing.usedFreeSessions)) {
              billing.usedFreeSessions.forEach((session: string) => {
                const sessionKey = session.toLowerCase();
                usedSessionsMap.set(sessionKey, (usedSessionsMap.get(sessionKey) || 0) + 1);
              });
            }
          });

          // Filter billings that offer free sessions and calculate remaining
          const freeSessions = allBillings
            .filter((billing: any) => 
              billing.offerType === 'bundle' && 
              billing.offerFreeSession && 
              billing.offerFreeSession.length > 0 &&
              billing.freeOfferSessionCount > 0
            )
            .map((billing: any) => {
              const offeredSessions = billing.offerFreeSession || [];
              const offeredCount = billing.freeOfferSessionCount || 0;
              
              // Calculate how many of these sessions have been used
              let usedCount = 0;
              offeredSessions.forEach((session: string) => {
                const sessionKey = session.toLowerCase();
                usedCount += usedSessionsMap.get(sessionKey) || 0;
              });
              
              // Calculate remaining sessions
              const remainingCount = Math.max(0, offeredCount - usedCount);
              const remainingSessions = offeredSessions.filter((session: string) => {
                const sessionKey = session.toLowerCase();
                const usedForThisSession = usedSessionsMap.get(sessionKey) || 0;
                return usedForThisSession < offeredCount;
              });

              return {
                billingId: billing._id,
                offerName: billing.offerName || billing.offerTitle || 'Bundle Offer',
                offerFreeSession: remainingSessions,
                freeOfferSessionCount: remainingCount,
                originalOfferedSessions: offeredSessions,
                originalOfferedCount: offeredCount,
                usedCount: usedCount,
                remainingCount: remainingCount,
                invoiceNumber: billing.invoiceNumber,
                invoicedDate: billing.invoicedDate,
                purchasedTreatment: billing.treatment,
                amount: billing.amount
              };
            })
            .filter((session: any) => session.remainingCount > 0);
          
          setAvailableFreeSessions(freeSessions);
          console.log('[FreeSessions] Available free sessions (after filtering used):', freeSessions);
        } else {
          setAvailableFreeSessions([]);
        }
      } catch (error) {
        console.error('Error fetching free sessions:', error);
        setAvailableFreeSessions([]);
      } finally {
        setLoadingFreeSessions(false);
      }
    };
   
    fetchFreeSessions();
  }, [isOpen, appointment?.patientId, getAuthHeaders]);

  // Calculate total price with membership benefits
  useEffect(() => {
    let baseTotal = 0;

    if (selectedService === "Treatment") {
      baseTotal = selectedTreatments.reduce((sum, t) => sum + t.totalPrice, 0);
    } else if (selectedPackage) {
      // Package Payment Handling (New Requirement)
      const paidAmount = selectedPackage.paidAmount || 0;
      const paymentStatus = selectedPackage.paymentStatus || "Unpaid";
      
      // Calculate how much has already been consumed from the paidAmount
      // by looking at activePackageUsage.billingHistory
      let consumedPrepaidAmount = 0;
      if (packageUsageData?.billingHistory) {
        // Find usage history for this specific package assignment
        // If there are multiple assignments of the same package, we should ideally
        // track by sub-document ID, but for now we'll assume the latest assignment's history
        packageUsageData.billingHistory.forEach((bill: any) => {
          // Calculate cost of sessions in this bill
          // bill.selectedPackageTreatments has { treatmentName, treatmentSlug, sessions }
          if (bill.selectedPackageTreatments) {
            bill.selectedPackageTreatments.forEach((bt: any) => {
              const trDef = selectedPackage.treatments.find(t => t.treatmentSlug === bt.treatmentSlug);
              if (trDef) {
                consumedPrepaidAmount += (trDef.sessionPrice || 0) * (bt.sessions || 0);
              }
            });
          }
        });
      }

      let availablePrepaidAmount = Math.max(0, paidAmount - consumedPrepaidAmount);
      
      // Calculate total based on each treatment's sessionPrice × usedSessions
      let computedTotal = 0;
      
      // We process selected treatments to see how many sessions are free
      packageTreatmentSessions.forEach((t) => {
        if (!t.isSelected || (t.usedSessions || 0) === 0) {
          return;
        }
        
        let sessionCost = t.sessionPrice * (t.usedSessions || 0);
        let billableForThisTreatment = 0;

        if (paymentStatus === "Full") {
          billableForThisTreatment = 0;
        } else if (availablePrepaidAmount >= sessionCost) {
          billableForThisTreatment = 0;
          availablePrepaidAmount -= sessionCost;
        } else if (availablePrepaidAmount > 0) {
          billableForThisTreatment = sessionCost - availablePrepaidAmount;
          availablePrepaidAmount = 0;
        } else {
          billableForThisTreatment = sessionCost;
        }

        computedTotal += billableForThisTreatment;
      });

      // Update packageTreatmentSessions state if needed to show "Free Session" tag
      // Use a ref or a separate effect to avoid infinite loops
      // For now, let's just use the computedTotal for baseTotal
      
      // Round to 2 decimal places
      let finalTotal = Number(computedTotal.toFixed(2));

      // Check if all treatments are selected with their max sessions (Legacy logic)
      const allTreatmentsSelected = packageTreatmentSessions.every(
        (t) => t.isSelected && t.usedSessions === t.maxSessions,
      );

      if (allTreatmentsSelected && selectedPackage.totalPrice && paymentStatus === "Unpaid") {
        const difference = Math.abs(finalTotal - selectedPackage.totalPrice);
        if (difference > 0 && difference <= 2) {
          finalTotal = selectedPackage.totalPrice;
        }
      }

      baseTotal = finalTotal;
    }

    // Apply membership benefits (skip if membership was transferred out)
    let finalTotal = baseTotal;
    let membershipDiscountAmount = 0;
    let offerDiscountAmount = 0;
    let receptionistDiscountAmount = 0;

    // 1. Calculate Membership Discount
    const membershipTransferredOut =
      membershipUsage?.membershipId &&
      patientDetails?.membershipTransfers?.some(
        (t: any) =>
          t.type === "out" &&
          String(t.membershipId) === String(membershipUsage.membershipId),
      );

    if (
      isMembershipApplied &&
      membershipUsage?.hasMembership &&
      !membershipUsage?.isExpired &&
      !membershipTransferredOut
    ) {
      const remainingFreeConsultations = membershipUsage.remainingFreeConsultations || 0;
      const discountPercentage = membershipUsage.discountPercentage || 0;

      if (selectedService === "Treatment" && selectedTreatments.length > 0) {
        const sortedTreatments = [...selectedTreatments].sort((a, b) => a.price - b.price);
        let freeAvailable = remainingFreeConsultations;
        let totalFree = 0;
        let totalDiscount = 0;

        const updated = sortedTreatments.map((t) => {
          let usesFree = false;
          let usesDiscount = false;
          if (freeAvailable > 0 && t.quantity > 0) {
            const qtyFree = Math.min(t.quantity, freeAvailable);
            if (qtyFree > 0) {
              usesFree = true;
              totalFree += t.price * qtyFree;
              freeAvailable -= qtyFree;
              const remainingQty = t.quantity - qtyFree;
              if (remainingQty > 0 && discountPercentage > 0) {
                usesDiscount = true;
                totalDiscount += (t.price * remainingQty * discountPercentage) / 100;
              }
            }
          } else if (discountPercentage > 0 && t.totalPrice > 0) {
            usesDiscount = true;
            totalDiscount += (t.totalPrice * discountPercentage) / 100;
          }
          return { ...t, usesFreeConsultation: usesFree, usesMembershipDiscount: usesDiscount };
        });

        const map = new Map(updated.map((t: any) => [t.treatmentSlug, t]));
        setSelectedTreatments((prev) => {
          let changed = false;
          const next = prev.map((t: any) => {
            const mapped = map.get(t.treatmentSlug);
            if (!mapped) return t;
            const usesFreeConsultation = !!mapped.usesFreeConsultation;
            const usesMembershipDiscount = !!mapped.usesMembershipDiscount;
            if (
              t.usesFreeConsultation === usesFreeConsultation &&
              t.usesMembershipDiscount === usesMembershipDiscount
            ) {
              return t;
            }
            changed = true;
            return { ...t, usesFreeConsultation, usesMembershipDiscount };
          });
          return changed ? next : prev;
        });
        membershipDiscountAmount = totalFree + totalDiscount;
      } else if (selectedService === "Package" && packageTreatmentSessions.some(t => t.isSelected)) {
        const hasSessions = packageTreatmentSessions.some(t => t.isSelected && (t.usedSessions || 0) > 0);
        if (hasSessions) {
          const selectedSessions = packageTreatmentSessions
            .filter((t: any) => t.isSelected && (t.usedSessions || 0) > 0)
            .sort((a, b) => a.sessionPrice - b.sessionPrice);
          let freeAvailable = remainingFreeConsultations;
          let totalFree = 0;
          let totalDiscount = 0;

          const withFreeInfo = selectedSessions.map((t: any) => {
            const sessions = t.usedSessions || 0;
            let sessionsFree = 0;
            if (freeAvailable > 0 && sessions > 0) {
              sessionsFree = Math.min(sessions, freeAvailable);
              freeAvailable -= sessionsFree;
            }
            return { ...t, sessionsFree, remainingSessions: sessions - sessionsFree };
          });

          const sessionUpdates = new Map();
          withFreeInfo.forEach((t: any) => {
            const sf = t.sessionsFree || 0;
            const rs = t.remainingSessions || 0;
            let usesFree = sf > 0;
            let usesDiscount = false;
            if (sf > 0) totalFree += t.sessionPrice * sf;
            if (rs > 0 && discountPercentage > 0) {
              usesDiscount = true;
              totalDiscount += (t.sessionPrice * rs * discountPercentage) / 100;
            }
            sessionUpdates.set(t.treatmentSlug, { usesFreeConsultation: usesFree, usesMembershipDiscount: usesDiscount });
          });

          setPackageTreatmentSessions((prev) => {
            let changed = false;
            const next = prev.map((t: any) => {
              const update = sessionUpdates.get(t.treatmentSlug);
              const usesFreeConsultation = !!update?.usesFreeConsultation;
              const usesMembershipDiscount = !!update?.usesMembershipDiscount;
              if (
                t.usesFreeConsultation === usesFreeConsultation &&
                t.usesMembershipDiscount === usesMembershipDiscount
              ) {
                return t;
              }
              changed = true;
              return { ...t, usesFreeConsultation, usesMembershipDiscount };
            });
            return changed ? next : prev;
          });

          membershipDiscountAmount = totalFree + totalDiscount;
        }
      } else if (remainingFreeConsultations > 0 && baseTotal > 0) {
        membershipDiscountAmount = baseTotal;
      } else if (discountPercentage > 0 && baseTotal > 0) {
        membershipDiscountAmount = (baseTotal * discountPercentage) / 100;
      }
    } else {
      // Reset membership flags if not applied
      if (selectedService === "Treatment") {
        setSelectedTreatments((prev) => {
          if (prev.every((t) => !t.usesFreeConsultation && !t.usesMembershipDiscount)) {
            return prev;
          }
          return prev.map((t) => ({ ...t, usesFreeConsultation: false, usesMembershipDiscount: false }));
        });
      } else if (selectedService === "Package") {
        setPackageTreatmentSessions((prev) => {
          if (prev.every((t) => !t.usesFreeConsultation && !t.usesMembershipDiscount)) {
            return prev;
          }
          return prev.map((t) => ({ ...t, usesFreeConsultation: false, usesMembershipDiscount: false }));
        });
      }
    }

    // 2. Calculate Offer Discount
    const appliedOffers = matchedOffers.filter(o => appliedOfferIds.includes(o._id));
    if (appliedOffers.length > 0 && baseTotal > 0) {
      console.log('[OfferDiscountCalc] baseTotal:', baseTotal, 'appliedOffers:', appliedOffers.map(o => ({ title: o.title, discountMode: o.discountMode, discountValue: o.discountValue, maxBenefitCap: o.maxBenefitCap })));
      appliedOffers.forEach(offer => {
        if (offer.minimumBillAmount === 0 || baseTotal >= offer.minimumBillAmount) {
          let currentOfferDiscount = 0;
          
          // Handle bundle offers differently
          if (offer.offerType === "bundle" && matchedBundleOffer && matchedBundleOffer._id === offer._id) {
            // For bundle offers, NO discount is applied in current billing
            // The free session is stored for FUTURE redemption
            // Bundle offers with discountValue > 0 can still apply additional discount
            if (offer.discountValue && offer.discountValue > 0) {
              // Bundle has an additional percentage/flat discount (optional)
              let additionalDiscount = 0;
              if (offer.discountMode === "percentage") {
                additionalDiscount = (baseTotal * offer.discountValue) / 100;
                if (offer.maxBenefitCap && offer.maxBenefitCap > 0) {
                  additionalDiscount = Math.min(additionalDiscount, offer.maxBenefitCap);
                }
              } else {
                additionalDiscount = offer.discountValue;
              }
              currentOfferDiscount = additionalDiscount;
              console.log(`[BundleDiscount] Bundle "${offer.title}": Additional discount only = ${additionalDiscount} (free session stored for future)`);
            } else {
              // Pure bundle offer - NO discount in current billing
              // Free session will be redeemed in next visit
              currentOfferDiscount = 0;
              console.log(`[BundleDiscount] Bundle "${offer.title}": No discount in current billing. Free session (${bundleFreeSessions.join(', ')}) stored for future redemption`);
            }
          } else if (offer.offerType !== "bundle") {
            // Regular instant discount
            if (offer.discountMode === "percentage") {
              currentOfferDiscount = (baseTotal * offer.discountValue) / 100;
              console.log(`[OfferDiscountCalc] Before cap: baseTotal=${baseTotal}, discountValue=${offer.discountValue}, calculated=${currentOfferDiscount}, maxBenefitCap=${offer.maxBenefitCap}`);
              if (offer.maxBenefitCap > 0) {
                currentOfferDiscount = Math.min(currentOfferDiscount, offer.maxBenefitCap);
                console.log(`[OfferDiscountCalc] After cap applied: ${currentOfferDiscount}`);
              }
            } else {
              currentOfferDiscount = offer.discountValue;
            }
          }
          
          offerDiscountAmount += currentOfferDiscount;
          console.log(`[OfferDiscountCalc] Offer "${offer.title}" discount: ${currentOfferDiscount}, Total offerDiscountAmount: ${offerDiscountAmount}`);
        }
      });
    }

    // 3. Calculate Receptionist (Doctor/Agent) Discount
    // Only if receptionist discount is allowed by ALL applied offers (or no offers applied)
    const receptionistDiscountAllowed = appliedOffers.length === 0 || appliedOffers.every(o => o.allowReceptionistDiscount);
    if (receptionistDiscountAllowed) {
      if (isDoctorDiscountApplied && baseTotal > 0 && doctorAppliedDiscount && doctorComplaintDiscount) {
        if (doctorComplaintDiscount.discountType === "percentage") {
          receptionistDiscountAmount = (baseTotal * doctorComplaintDiscount.discountAmount) / 100;
        } else {
          receptionistDiscountAmount = doctorComplaintDiscount.discountAmount;
        }
      } else if (isAgentDiscountApplied && agentDiscount && baseTotal > 0) {
        if (agentDiscount.discountType === "percentage") {
          receptionistDiscountAmount = (baseTotal * agentDiscount.discountAmount) / 100;
        } else {
          receptionistDiscountAmount = agentDiscount.discountAmount;
        }
      }
    }

    // 4. Combine or Select Highest
    // Note: If ANY applied offer does not allow combining, then canCombine is false.
    const canCombine = appliedOffers.length === 0 || appliedOffers.every(o => o.allowCombiningWithOtherOffers);

    let calcMembershipDiscount = 0;
    let calcOfferDiscount = 0;
    let calcReceptionistDiscount = 0;

    if (canCombine) {
      // Apply all sequential: Membership -> Offer -> Receptionist
      const totalDiscount = membershipDiscountAmount + offerDiscountAmount + receptionistDiscountAmount;
      finalTotal = Math.max(0, baseTotal - totalDiscount);
      calcMembershipDiscount = membershipDiscountAmount;
      calcOfferDiscount = offerDiscountAmount;
      calcReceptionistDiscount = receptionistDiscountAmount;
    } else {
      // Only apply the highest discount
      const discounts = [
        { type: 'Membership', amount: membershipDiscountAmount },
        { type: 'Offer', amount: offerDiscountAmount },
        { type: 'Receptionist', amount: receptionistDiscountAmount }
      ];
      const highest = discounts.reduce((prev, current) => (prev.amount >= current.amount) ? prev : current);
      
      calcMembershipDiscount = highest.type === 'Membership' ? highest.amount : 0;
      calcOfferDiscount = highest.type === 'Offer' ? highest.amount : 0;
      calcReceptionistDiscount = highest.type === 'Receptionist' ? highest.amount : 0;
      
      finalTotal = Math.max(0, baseTotal - highest.amount);
    }

    setFinalMembershipDiscount(calcMembershipDiscount);
    setFinalOfferDiscount(calcOfferDiscount);
    setFinalReceptionistDiscount(calcReceptionistDiscount);

    setTotalPrice(finalTotal);
    setFormData((prev) => ({
      ...prev,
      discountedAmount: finalTotal.toFixed(2),
      originalAmount: baseTotal.toFixed(2),
      paid: finalTotal === 0 ? "0.00" : prev.paid,
    }));
  }, [
    selectedTreatments,
    selectedPackage,
    selectedService,
    packageTreatmentSessions,
    membershipUsage,
    isDoctorDiscountApplied,
    doctorDiscount,
    doctorAppliedDiscount,
    doctorComplaintDiscount,
    isAgentDiscountApplied,
    agentDiscount,
    matchedOffers,
    appliedOfferIds,
    isMembershipApplied,
  ]);

  // Override displayed invoice total to include previous pending
  useEffect(() => {
    const discountedTotal = parseFloat(formData.discountedAmount || "0") || 0;
   
    // Always ensure amount has a value - either with previous pending or just the discounted total
    // Include pending balance AND pending claim in the total
    const invoiceTotal = Number(
      (discountedTotal + (balances.pendingBalance || 0) + (balances.pendingClaim || 0)).toFixed(2),
    );
   
    console.log("Adding previous pending:", {
      discountedTotal,
      previousPending: balances.pendingBalance,
      pendingClaim: balances.pendingClaim,
      invoiceTotal,
      currentAmount: formData.amount
    });
   
    // Only update if the amount has changed to avoid infinite loops
    if (Math.abs(parseFloat(formData.amount || "0") - invoiceTotal) > 0.001) {
      setFormData((prev) => ({
        ...prev,
        amount: invoiceTotal.toFixed(2),
      }));
    }
  }, [balances.pendingBalance, balances.pendingClaim, formData.discountedAmount]);

  // Auto-calc pending/advance considering applied advance balances
  useEffect(() => {
    const discountedAmount = parseFloat(formData.discountedAmount || "0") || 0;
    const originalAmountNum = parseFloat(formData.amount) || 0;
    
    // Calculate cashback deduction based on discounted amount
    const cashbackDeduction = (useCashback && availableCashback) 
      ? Math.min(availableCashback.amount, discountedAmount) 
      : 0;
    
    // Final amount after all discounts AND cashback
    const finalAmountAfterCashback = Math.max(0, discountedAmount - cashbackDeduction);
    
    // Calculate how much previous pending is being rolled into this billing
    // pendingUsed is for pending balance from billings only
    const pendingUsed = balances.pendingBalance || 0;
    // pendingClaimUsed is for pending claim from insurance claims only
    const pendingClaimUsed = balances.pendingClaim || 0;
    // Total pending being rolled in (for amountForCredits calculation)
    const pendingBeingRolledIn = pendingUsed + pendingClaimUsed;
    
    // Amount for credits = discounted amount + all pending (balance + claim)
    // This equals invoiceTotal which includes: discountedAmount + pendingBalance + pendingClaim

    // Amount available for applying credits = final amount after cashback + pending rolled in
    const amountForCredits = finalAmountAfterCashback + pendingBeingRolledIn;
    
    console.log('[PendingCalculation] Calculation breakdown:', {
      originalAmount: originalAmountNum,
      discountedAmount,
      cashbackDeduction,
      finalAmountAfterCashback,
      pendingBeingRolledIn,
      amountForCredits
    });

    // Calculate applied credits based on FINAL amount after cashback
    const appliedAdvance = applyAdvance
      ? Math.min(balances.advanceBalance || 0, amountForCredits)
      : 0;
    const appliedPastAdvance50Percent = applyPastAdvance50Percent
      ? Math.min(balances.pastAdvance50PercentBalance || 0, amountForCredits - appliedAdvance)
      : 0;
    const appliedPastAdvance54Percent = applyPastAdvance54Percent
      ? Math.min(balances.pastAdvance54PercentBalance || 0, amountForCredits - appliedAdvance - appliedPastAdvance50Percent)
      : 0;
    const appliedPastAdvance159Flat = applyPastAdvance159Flat
      ? Math.min(balances.pastAdvance159FlatBalance || 0, amountForCredits - appliedAdvance - appliedPastAdvance50Percent - appliedPastAdvance54Percent)
      : 0;
    const totalPastAdvanceUsed =
      appliedPastAdvance50Percent +
      appliedPastAdvance54Percent +
      appliedPastAdvance159Flat;
    const appliedClaimAmount = applyClaimAmount
      ? Math.min(balances.claimAmount || 0, amountForCredits - appliedAdvance - totalPastAdvanceUsed)
      : 0;
    // Pending claim is automatically added to total, no separate deduction needed
    // The amountForCredits already includes pending claim, so it affects net due automatically
    const totalClaimUsed = appliedClaimAmount;

    // 2. Net Due (Remaining amount to be paid after credits)
    const netDue = Math.max(
      0,
      amountForCredits - appliedAdvance - totalPastAdvanceUsed - totalClaimUsed,
    );

    // 3. Determine how much is actually being paid today (Cash/Card etc)
    let paidNum: number;
    if (useMultiplePayments) {
      paidNum = multiplePayments.reduce(
        (sum, mp) => sum + (parseFloat(mp.amount) || 0),
        0,
      );
    } else {
      // If we just toggled an advance checkbox, we usually set paid to 0
      // because the bill is covered by credit.
      // But if the user types a value, we respect it.
      paidNum = Math.max(0, parseFloat(formData.paid) || 0);
    }

    // 4. Calculate Pending and New Advance
    let pendingVal = 0;
    let advanceVal = 0;

    if (paidNum > netDue) {
      advanceVal = paidNum - netDue;
      pendingVal = 0;
    } else {
      advanceVal = 0;
      pendingVal = netDue - paidNum;
    }

    setFormData((prev) => {
      const updates: any = {
        pending: pendingVal.toFixed(2),
        advance: advanceVal.toFixed(2),
        advanceUsed: appliedAdvance.toFixed(2),
        pastAdvanceUsed: totalPastAdvanceUsed.toFixed(2),
        pastAdvanceUsed50Percent: appliedPastAdvance50Percent.toFixed(2),
        pastAdvanceUsed54Percent: appliedPastAdvance54Percent.toFixed(2),
        pastAdvanceUsed159Flat: appliedPastAdvance159Flat.toFixed(2),
        // Track pending balance being rolled into this billing
        pendingUsed: pendingUsed.toFixed(2),
        claimAmountUsed: appliedClaimAmount.toFixed(2),
        // Track pending claim being rolled into this billing
        pendingClaimUsed: pendingClaimUsed.toFixed(2),
      };

      // Auto-set paid when advance is applied
      if (
        applyAdvance ||
        applyPastAdvance50Percent ||
        applyPastAdvance54Percent ||
        applyPastAdvance159Flat ||
        applyClaimAmount
      ) {
        const currentPaid = parseFloat(prev.paid) || 0;
        const currentAmount = parseFloat(prev.amount) || 0;
       
        // Use a small epsilon for floating point comparisons
        if (Math.abs(currentPaid - currentAmount) < 0.01 || prev.paid === "" || prev.paid === "0.00") {
          if (netDue === 0) {
            updates.paid = "0.00";
          } else {
            updates.paid = netDue.toFixed(2);
          }
        }
      }

      // Sync multi-pay paid amount if applicable
      if (useMultiplePayments) {
        updates.paid = paidNum.toFixed(2);
      }

      // Check if we need to update to avoid infinite loops
      const hasChanges =
        updates.pending !== prev.pending ||
        updates.advance !== prev.advance ||
        updates.advanceUsed !== prev.advanceUsed ||
        updates.pastAdvanceUsed !== prev.pastAdvanceUsed ||
        updates.pastAdvanceUsed50Percent !== prev.pastAdvanceUsed50Percent ||
        updates.pastAdvanceUsed54Percent !== prev.pastAdvanceUsed54Percent ||
        updates.pastAdvanceUsed159Flat !== prev.pastAdvanceUsed159Flat ||
        updates.claimAmountUsed !== prev.claimAmountUsed ||
        updates.pendingClaimUsed !== prev.pendingClaimUsed ||
        (updates.paid !== undefined && updates.paid !== prev.paid);

      if (!hasChanges) return prev;
      return { ...prev, ...updates };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.amount,
    formData.paid,
    applyAdvance,
    applyPastAdvance50Percent,
    applyPastAdvance54Percent,
    applyPastAdvance159Flat,
    applyClaimAmount,
    applyPendingClaim,
    balances.advanceBalance,
    balances.pastAdvanceBalance,
    balances.pastAdvance50PercentBalance,
    balances.pastAdvance54PercentBalance,
    balances.pastAdvance159FlatBalance,
    balances.claimAmount,
    balances.pendingClaim,
    useMultiplePayments,
    multiplePayments,
  ]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        treatmentDropdownRef.current &&
        !treatmentDropdownRef.current.contains(event.target as Node)
      ) {
        setTreatmentDropdownOpen(false);
      }
      if (
        packageDropdownRef.current &&
        !packageDropdownRef.current.contains(event.target as Node)
      ) {
        setPackageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle treatment selection
  const handleTreatmentToggle = (treatment: Treatment, showNotification = false) => {
    const existingIndex = selectedTreatments.findIndex(
      (t) => t.treatmentSlug === treatment.slug,
    );

    if (existingIndex >= 0) {
      // Remove treatment
      setSelectedTreatments((prev) =>
        prev.filter((_, i) => i !== existingIndex),
      );
    } else {
      // Check if this treatment is available as a free session
      const isFreeSession = availableFreeSessions.some((session: any) => 
        session.offerFreeSession.some((freeTreatment: string) => 
          freeTreatment.toLowerCase() === treatment.name.toLowerCase()
        )
      );

      // Add treatment with quantity 1
      // If it's a free session, price = 0, otherwise use original price
      const treatmentPrice = isFreeSession ? 0 : treatment.price;
      
      const newTreatment: SelectedTreatment = {
        treatmentName: treatment.name,
        treatmentSlug: treatment.slug,
        price: treatmentPrice, // 0 for free sessions, original price otherwise
        quantity: 1,
        totalPrice: treatmentPrice, // Initial total = price × 1
        isFreeSession: isFreeSession,
      };
      setSelectedTreatments((prev) => [...prev, newTreatment]);
      
      if (isFreeSession) {
        console.log(`[FreeSession] Treatment "${treatment.name}" added as FREE session`);
      }
     
      // Show notification if requested (e.g., from Smart Recommendations)
      if (showNotification) {
        setJustAddedServiceName(treatment.name);
        setTimeout(() => setJustAddedServiceName(null), 3000);
      }
    }
    setTreatmentSearchQuery("");
    setTreatmentDropdownOpen(false);
  };

  // Handle treatment quantity change
  const handleQuantityChange = (slug: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedTreatments((prev) =>
      prev.map((t) =>
        t.treatmentSlug === slug
          ? { ...t, quantity, totalPrice: t.price * quantity } // Total = price × quantity (not doubled)
          : t,
      ),
    );
  };

  // Remove a selected treatment
  const handleRemoveSelectedTreatment = (slug: string) => {
    setSelectedTreatments((prev) =>
      prev.filter((t) => t.treatmentSlug !== slug),
    );
  };

  // Toggle package expansion
  const togglePackageExpansion = (pkgName: string) => {
    setExpandedPackages(prev => ({
      ...prev,
      [pkgName]: !prev[pkgName]
    }));
  };

  const handlePackageSelect = async (pkg: Package) => {
    // Check if this package is assigned to the patient and get its payment info
    const assignedPkg = (patientDetails?.packages || []).find((p: any) => String(p.packageId) === String(pkg._id));
    
    // Check main fields as well if array doesn't have it
    const mainPackageId = patientDetails?.packageId;
    const isMainPackage = String(mainPackageId) === String(pkg._id);
    
    const pkgWithPaymentInfo = {
      ...pkg,
      paidAmount: assignedPkg?.paidAmount || (isMainPackage ? patientDetails?.packagePaidAmount : 0) || 0,
      paymentStatus: assignedPkg?.paymentStatus || (isMainPackage ? patientDetails?.packagePaymentStatus : "Unpaid") || "Unpaid",
    };
    setSelectedPackage(pkgWithPaymentInfo);
    setLoadingPackageUsage(true);

    // Fetch package usage for this patient and package
    let fetchedUsageData = null;
    if (appointment?.patientId) {
      try {
        const headers = getAuthHeaders();
        const response = await axios.get(
          `/api/clinic/package-usage/${appointment.patientId}?packageName=${encodeURIComponent(pkg.name)}`,
          { headers },
        );

        if (response.data.success && response.data.packageUsage.length > 0) {
          fetchedUsageData = response.data.packageUsage[0];
          setPackageUsageData(fetchedUsageData);
        } else {
          setPackageUsageData(null);
        }
      } catch (error) {
        console.error("Error fetching package usage:", error);
        setPackageUsageData(null);
      } finally {
        setLoadingPackageUsage(false);
      }
    } else {
      setLoadingPackageUsage(false);
    }

    // Initialize package treatment sessions with usage data
    const sessions: PackageTreatmentSession[] = pkg.treatments.map((t) => {
      // Find if this treatment has been used before
      let previouslyUsed = 0;
      let usageDetails: Array<{
        invoiceNumber: string;
        sessions: number;
        date: string;
      }> = [];

      if (fetchedUsageData?.treatments) {
        const usageInfo = fetchedUsageData.treatments.find(
          (usage: any) => usage.treatmentSlug === t.treatmentSlug,
        );
        if (usageInfo) {
          previouslyUsed = usageInfo.totalUsedSessions || 0;
          usageDetails = usageInfo.usageDetails || [];
        }
      }

      const tName = t.treatmentName;
      const isAlreadyBilledForThisAppointment = isTreatmentBilledRecently(tName);

      return {
        treatmentName: tName,
        treatmentSlug: t.treatmentSlug,
        maxSessions: t.sessions,
        usedSessions: 0,
        previouslyUsedSessions: previouslyUsed,
        usageDetails: usageDetails,
        isSelected: false,
        sessionPrice: t.sessionPrice || 0,
        isAlreadyBilledForThisAppointment // Add this flag
      };
    });

    setPackageTreatmentSessions(sessions);
    setPackageSearchQuery("");
    setPackageDropdownOpen(false);
  };

  // Handle package treatment selection toggle
  const handlePackageTreatmentToggle = (slug: string) => {
    setPackageTreatmentSessions((prev) =>
      prev.map((t) => {
        if (t.treatmentSlug === slug) {
          const newSelected = !t.isSelected;
          // If unselecting, reset sessions to 0
          return {
            ...t,
            isSelected: newSelected,
            usedSessions: newSelected ? t.usedSessions : 0,
          };
        }
        return t;
      }),
    );
  };

  // Handle package treatment session change
  const handlePackageSessionChange = (slug: string, sessions: number) => {
    setPackageTreatmentSessions((prev) =>
      prev.map((t) => {
        if (t.treatmentSlug === slug) {
          const availableSessions = t.maxSessions - t.previouslyUsedSessions;
          if (sessions > availableSessions) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [`packageSession_${slug}`]: `Only ${availableSessions} session(s) remaining (${t.previouslyUsedSessions} already used)`,
            }));
            return { ...t, usedSessions: availableSessions };
          }
          if (sessions < 1 && t.isSelected && availableSessions > 0) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              [`packageSession_${slug}`]: `Enter at least 1 session (max ${availableSessions})`,
            }));
            return { ...t, usedSessions: 1 };
          }
          setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors[`packageSession_${slug}`];
            return newErrors;
          });
          return { ...t, usedSessions: sessions };
        }
        return t;
      }),
    );
  };

  // Handle form submission
  const generateInvoicePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(22);
      doc.setTextColor(20, 184, 166); // teal-600
      doc.setFont("helvetica", "bold");
      doc.text("ZEVA CLINIC", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont("helvetica", "normal");
      doc.text("Billing Statement / Invoice", 14, 26);

      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("INVOICE", pageWidth - 14, 20, { align: "right" });

      const today = new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc.setFontSize(9);
      doc.text(`Date: ${today}`, pageWidth - 14, 26, { align: "right" });
      doc.text(
        `Invoice #: ${formData.invoiceNumber || "-"}`,
        pageWidth - 14,
        31,
        { align: "right" },
      );

      // Patient Details
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 36, pageWidth - 14, 36);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("PATIENT INFORMATION", 14, 44);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(
        `Name: ${appointment?.patientName || "-"}`,
        14,
        50,
      );
      doc.text(`Patient ID: ${appointment?.patientId || "-"}`, 14, 55);
      doc.text(`EMR No: ${appointment?.emrNumber || "-"}`, 14, 60);

      doc.text(
        `Mobile: ${appointment?.patientNumber || "-"}`,
        pageWidth / 2,
        50,
      );
      doc.text(`Email: ${appointment?.patientEmail || "-"}`, pageWidth / 2, 55);
      doc.text(`Gender: ${appointment?.gender || "-"}`, pageWidth / 2, 60);

      // Billing Details Table
      const tableRows = [];
      if (selectedService === "Treatment") {
        selectedTreatments.forEach((t) => {
          tableRows.push([
            t.treatmentName,
            "Treatment",
            t.quantity.toString(),
            `${getCurrencySymbol(currency)} ${t.price.toFixed(2)}`,
            `${getCurrencySymbol(currency)} ${t.totalPrice.toFixed(2)}`,
          ]);
        });
      } else if (selectedService === "Package") {
        const selectedPackageTreatments = packageTreatmentSessions.filter(
          (t) => t.isSelected,
        );
        tableRows.push([
          selectedPackage?.name || "-",
          "Package",
          "1",
          `${getCurrencySymbol(currency)} ${selectedPackage?.totalPrice.toFixed(2) || "0.00"}`,
          `${getCurrencySymbol(currency)} ${selectedPackage?.totalPrice.toFixed(2) || "0.00"}`,
        ]);
        selectedPackageTreatments.forEach((t) => {
          tableRows.push([
            `  • ${t.treatmentName}`,
            "Session",
            t.usedSessions.toString(),
            "-",
            "-",
          ]);
        });
      }

      autoTable(doc, {
        startY: 70,
        head: [["Description", "Type", "Qty/Sessions", "Unit Price", "Total"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [31, 41, 55], // Gray-800
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });

      // Split Payment Details (if any)
      let currentY = (doc as any).lastAutoTable.finalY + 10;
      const effectivePayments = useMultiplePayments
        ? multiplePayments.filter(p => parseFloat(p.amount) > 0)
        : [{ paymentMethod: formData.paymentMethod, amount: formData.paid }];

      if (effectivePayments.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);
        doc.text("PAYMENT BREAKDOWN", 14, currentY);
        currentY += 6;

        const paymentRows = effectivePayments.map((p: any) => [
          p.paymentMethod,
          `${getCurrencySymbol(currency)} ${parseFloat(p.amount || "0").toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [["Payment Method", "Amount"]],
          body: paymentRows,
          theme: "plain",
          headStyles: { fontSize: 8, fontStyle: "bold", fillColor: [243, 244, 246] },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14 },
          tableWidth: 80,
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Summary Section
      const finalY = currentY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text("SUMMARY", pageWidth - 70, finalY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Total Amount:", pageWidth - 70, finalY + 6);
      doc.text(
        `${getCurrencySymbol(currency)} ${parseFloat(formData.amount || "0").toFixed(2)}`,
        pageWidth - 14,
        finalY + 6,
        { align: "right" },
      );

      doc.text("Paid Amount:", pageWidth - 70, finalY + 11);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(
        `${getCurrencySymbol(currency)} ${parseFloat(formData.paid || "0").toFixed(2)}`,
        pageWidth - 14,
        finalY + 11,
        { align: "right" },
      );

      doc.setTextColor(220, 38, 38); // red-600
      doc.setFont("helvetica", "bold");
      doc.text("Outstanding:", pageWidth - 70, finalY + 16);
      doc.text(
        `${getCurrencySymbol(currency)} ${parseFloat(formData.pending || "0").toFixed(2)}`,
        pageWidth - 14,
        finalY + 16,
        { align: "right" },
      );

      // Notes
      if (formData.notes) {
        doc.setTextColor(71, 85, 105); // slate-600
        doc.setFont("helvetica", "bold");
        doc.text("NOTES", 14, finalY + 30);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const splitNotes = doc.splitTextToSize(formData.notes, pageWidth - 28);
        doc.text(splitNotes, 14, finalY + 35);
      }

      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
          `Page ${i} of ${pageCount} | ZEVA Clinic Management System`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" },
        );
      }

      doc.save(
        `Invoice_${appointment?.patientName || "Patient"}_${new Date().getTime()}.pdf`,
      );
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    console.log("Submitting billing with formData:", {
      amount: formData.amount,
      discountedAmount: formData.discountedAmount,
      paid: formData.paid,
      pending: formData.pending,
      pendingUsed: formData.pendingUsed,
    });

    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        setErrors({ general: "Unauthorized. Please log in again." });
        setLoading(false);
        return;
      }

      // Validate required fields
      const fieldErrors: Record<string, string> = {};
      if (!formData.invoiceNumber) fieldErrors.invoiceNumber = "Required";
      if (!formData.firstName) fieldErrors.firstName = "Required";
      if (!formData.mobileNumber) fieldErrors.mobileNumber = "Required";
      if (!formData.doctor) fieldErrors.doctor = "Required";
      if (Object.keys(fieldErrors).length > 0) {
        const missingList = Object.keys(fieldErrors)
          .map((k) => {
            if (k === "invoiceNumber") return "Invoice Number";
            if (k === "firstName") return "Name";
            if (k === "mobileNumber") return "Mobile";
            if (k === "doctor") return "Doctor";
            return k;
          })
          .join(", ");
        setErrors({
          general: `Please fill all required fields: ${missingList}`,
          ...fieldErrors,
        });
        setLoading(false);
        return;
      }

      if (selectedService === "Treatment" && selectedTreatments.length === 0) {
        setErrors({
          general: "Please select at least one treatment",
          treatment: "Select at least one treatment",
        });
        setLoading(false);
        return;
      }

      if (selectedService === "Package" && !selectedPackage) {
        setErrors({
          general: "Please select a package",
          package: "Select a package",
        });
        setLoading(false);
        return;
      }

      if (selectedService === "Package" && selectedPackage) {
        // Check if at least one treatment is selected
        const hasSelectedTreatment = packageTreatmentSessions.some(
          (t) => t.isSelected,
        );
        if (!hasSelectedTreatment) {
          setErrors({
            general: "Please select at least one treatment from the package",
            packageTreatments: "Select at least one treatment",
          });
          setLoading(false);
          return;
        }
        // Check if selected treatments have valid sessions
        const invalidSessions = packageTreatmentSessions.filter((t) => {
          if (!t.isSelected) return false;
          const availableSessions = t.maxSessions - t.previouslyUsedSessions;
          return t.usedSessions < 1 || t.usedSessions > availableSessions;
        });
        if (invalidSessions.length > 0) {
          const sessionErrors: Record<string, string> = {};
          invalidSessions.forEach((t) => {
            const availableSessions = t.maxSessions - t.previouslyUsedSessions;
            sessionErrors[`packageSession_${t.treatmentSlug}`] =
              `Enter 1–${availableSessions} (${t.previouslyUsedSessions} already used)`;
          });
          setErrors({
            general: "Please enter valid sessions for selected treatments",
            ...sessionErrors,
          });
          setLoading(false);
          return;
        }
      }

      if (!appointment) {
        setErrors({ general: "Appointment not found" });
        setLoading(false);
        return;
      }

      // Calculate membership benefits (skip if membership was transferred out)
      const baseAmount =
        parseFloat(formData.originalAmount || formData.amount) || 0;
      const finalAmount = parseFloat(formData.amount) || 0;
      let isFreeConsultation = false;
      let freeConsultationCount = 0;
      let membershipDiscountApplied = 0;

      // Check if membership was transferred out
      const membershipTransferredOut =
        membershipUsage?.membershipId &&
        patientDetails?.membershipTransfers?.some(
          (t: any) =>
            t.type === "out" &&
            String(t.membershipId) === String(membershipUsage.membershipId),
        );

      if (
        isMembershipApplied &&
        membershipUsage?.hasMembership &&
        !membershipUsage?.isExpired &&
        !membershipTransferredOut
      ) {
        const hasRemainingFreeConsultations =
          membershipUsage.remainingFreeConsultations > 0;
        const discountPercentage = membershipUsage.discountPercentage || 0;

        if (hasRemainingFreeConsultations) {
          // This is a free consultation
          isFreeConsultation = true;
          freeConsultationCount =
            selectedService === "Treatment"
              ? selectedTreatments.reduce((sum, t) => sum + t.quantity, 0)
              : packageTreatmentSessions
                  .filter((t) => t.isSelected)
                  .reduce((sum, t) => sum + t.usedSessions, 0);
        } else if (discountPercentage > 0 && baseAmount > 0) {
          // Calculate discount applied
          membershipDiscountApplied = (baseAmount * discountPercentage) / 100;
        }
      }

      // Calculate doctor discount applied
      let doctorDiscountApplied = 0;
      if (isDoctorDiscountApplied && doctorAppliedDiscount && doctorComplaintDiscount) {
        const amountAfterMembership =
          baseAmount - (membershipDiscountApplied || 0);
        if (doctorComplaintDiscount.discountType === "percentage") {
          doctorDiscountApplied =
            (amountAfterMembership * doctorComplaintDiscount.discountAmount) / 100;
        } else if (doctorComplaintDiscount.discountType === "fixed_amount") {
          doctorDiscountApplied = doctorComplaintDiscount.discountAmount;
        }
      }

      // Calculate offer discount applied
      let offerDiscountApplied = 0;
      const appliedOffers = matchedOffers.filter(o => appliedOfferIds.includes(o._id));
      if (appliedOffers.length > 0) {
        appliedOffers.forEach(offer => {
          if (offer.minimumBillAmount === 0 || baseAmount >= offer.minimumBillAmount) {
            let currentOfferDiscount = 0;
            if (offer.discountMode === "percentage") {
              currentOfferDiscount = (baseAmount * offer.discountValue) / 100;
              if (offer.maxBenefitCap && offer.maxBenefitCap > 0) {
                currentOfferDiscount = Math.min(currentOfferDiscount, offer.maxBenefitCap);
              }
            } else if (offer.discountMode === "flat") {
              currentOfferDiscount = offer.discountValue;
            }
            offerDiscountApplied += currentOfferDiscount;
          }
        });
      }

      // 4. Combine or Select Highest
      const canCombine = appliedOffers.length === 0 || appliedOffers.every(o => o.allowCombiningWithOtherOffers);
      let calcMembershipDiscount = membershipDiscountApplied;
      let calcOfferDiscount = offerDiscountApplied;
      let calcReceptionistDiscount = doctorDiscountApplied || (isAgentDiscountApplied ? (agentDiscount?.discountType === "percentage" ? (baseAmount * agentDiscount.discountAmount / 100) : agentDiscount?.discountAmount || 0) : 0);

      if (!canCombine) {
        const discounts = [
          { type: 'Membership', amount: membershipDiscountApplied },
          { type: 'Offer', amount: offerDiscountApplied },
          { type: 'Receptionist', amount: calcReceptionistDiscount }
        ];
        const highest = discounts.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
        
        calcMembershipDiscount = highest.type === 'Membership' ? highest.amount : 0;
        calcOfferDiscount = highest.type === 'Offer' ? highest.amount : 0;
        calcReceptionistDiscount = highest.type === 'Receptionist' ? highest.amount : 0;
      }

      // Calculate cashback deduction
      const cashbackAmountToUse = useCashback && availableCashback ? Math.min(availableCashback.amount, finalAmount) : 0;
      const amountAfterCashback = finalAmount - cashbackAmountToUse;
      
      console.log('[CashbackModal] Cashback calculation:', {
        finalAmount,
        availableCashback: availableCashback?.amount || 0,
        useCashback,
        cashbackAmountToUse,
        amountAfterCashback
      });

      // Prepare payload
      const payload: any = {
        invoiceNumber: formData.invoiceNumber,
        invoicedDate: formData.invoicedDate,
        appointmentId: appointment._id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        gender: formData.gender || "Unknown",
        doctor: appointment.doctorName,
        service: selectedService,
        referredBy: formData.referredBy,
        amount: amountAfterCashback,  // Deduct cashback from amount
        cashbackWalletUsed: cashbackAmountToUse,  // Track how much cashback was used
        paid: parseFloat(formData.paid) || 0,
        advanceUsed: parseFloat(formData.advanceUsed) || 0,
        pastAdvanceUsed: parseFloat(formData.pastAdvanceUsed) || 0,
        pastAdvanceUsed50Percent:
          parseFloat(formData.pastAdvanceUsed50Percent) || 0,
        pastAdvanceUsed54Percent:
          parseFloat(formData.pastAdvanceUsed54Percent) || 0,
        pastAdvanceUsed159Flat:
          parseFloat(formData.pastAdvanceUsed159Flat) || 0,
        pendingUsed: parseFloat(formData.pendingUsed || "0") || 0,
        claimAmountUsed: parseFloat(formData.claimAmountUsed || "0") || 0,
        pendingClaimUsed: parseFloat(formData.pendingClaimUsed || "0") || 0,
        pending: parseFloat(formData.pending || "0") || 0,
        advance: parseFloat(formData.advance) || 0,
        pastAdvance: parseFloat(formData.pastAdvance) || 0,
        pastAdvanceType: applyPastAdvance50Percent
          ? "50% Offer"
          : applyPastAdvance54Percent
            ? "54% Offer"
            : applyPastAdvance159Flat
              ? "159 Flat"
              : "",
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        emrNumber: formData.emrNumber,
        userId: appointment.patientId, // Pass patient ID from appointment
        // Multiple payment methods
        multiplePayments: useMultiplePayments
          ? multiplePayments
              .filter((mp) => parseFloat(mp.amount) > 0)
              .map((mp) => ({
                paymentMethod: mp.paymentMethod,
                amount: parseFloat(mp.amount) || 0,
              }))
          : [],
        // Membership tracking fields
        isFreeConsultation: isFreeConsultation && (canCombine || calcMembershipDiscount > 0),
        freeConsultationCount,
        membershipDiscountApplied: calcMembershipDiscount,
        doctorDiscountApplied: calcReceptionistDiscount > 0 && isDoctorDiscountApplied ? calcReceptionistDiscount : 0,
        isDoctorDiscountApplied: calcReceptionistDiscount > 0 && isDoctorDiscountApplied,
        doctorDiscountType: (calcReceptionistDiscount > 0 && isDoctorDiscountApplied) ? (doctorAppliedDiscount ? doctorComplaintDiscount?.discountType : null) : null,
        doctorDiscountAmount: (calcReceptionistDiscount > 0 && isDoctorDiscountApplied) ? (doctorAppliedDiscount ? doctorComplaintDiscount?.discountAmount : 0) : 0,
        isAgentDiscountApplied: calcReceptionistDiscount > 0 && isAgentDiscountApplied,
        agentDiscountType: (calcReceptionistDiscount > 0 && isAgentDiscountApplied) ? agentDiscount?.discountType : null,
        agentDiscountAmount: (calcReceptionistDiscount > 0 && isAgentDiscountApplied) ? agentDiscount?.discountAmount : 0,
        // Offer fields
        isOfferApplied: calcOfferDiscount > 0 || (matchedBundleOffer !== null),
        offerId: (calcOfferDiscount > 0 || matchedBundleOffer) ? appliedOffers[0]?._id : null,
        offerTitle: (calcOfferDiscount > 0 || matchedBundleOffer) ? appliedOffers.map(o => o.title).join(", ") : null,
        offerType: (calcOfferDiscount > 0 || matchedBundleOffer) ? (matchedBundleOffer ? matchedBundleOffer.offerType : appliedOffers[0]?.offerType) : null,
        offerDiscountAmount: calcOfferDiscount,
        // Bundle offer fields - Track which free sessions are being USED
        offerFreeSession: matchedBundleOffer && bundleFreeSessions.length > 0 ? bundleFreeSessions : [],
        freeOfferSessionCount: matchedBundleOffer ? bundleFreeSessionCount : 0,
        // Free sessions being REDEEMED in this billing (price = 0)
        usedFreeSessions: selectedTreatments.filter((t: any) => t.isFreeSession).map((t: any) => t.treatmentName),
        usedFreeSessionCount: selectedTreatments.filter((t: any) => t.isFreeSession).length,
        // Cashback offer fields
        isCashbackApplied: isCashbackApplied && matchedCashbackOffer !== null,
        cashbackOfferId: isCashbackApplied && matchedCashbackOffer ? matchedCashbackOffer._id : null,
        cashbackOfferName: isCashbackApplied && matchedCashbackOffer ? matchedCashbackOffer.title : null,
        cashbackAmount: isCashbackApplied && matchedCashbackOffer ? appliedCashbackAmount : 0,
        discountPercent: (calcMembershipDiscount > 0 || calcOfferDiscount > 0 || calcReceptionistDiscount > 0)
          ? (baseAmount > 0
              ? ((baseAmount - finalAmount) / baseAmount * 100)
              : 0)
          : 0,
        originalAmount: baseAmount,
      };

      if (selectedService === "Treatment") {
        // For treatment, send all selected treatments with their quantities
        const totalQuantity = selectedTreatments.reduce(
          (sum, t) => sum + t.quantity,
          0,
        );
        payload.treatment = selectedTreatments
          .map((t) => t.treatmentName)
          .join(", ");
        payload.quantity = totalQuantity;
      } else {
        // For package, only send selected treatments and their sessions
        const selectedTreatmentsFromPackage = packageTreatmentSessions.filter(
          (t) => t.isSelected,
        );
        payload.package = selectedPackage?.name || "";
        payload.sessions = selectedTreatmentsFromPackage.reduce(
          (sum, t) => sum + t.usedSessions,
          0,
        );
        // Store which treatments were selected
        payload.selectedPackageTreatments = selectedTreatmentsFromPackage.map(
          (t) => ({
            treatmentName: t.treatmentName,
            treatmentSlug: t.treatmentSlug,
            sessions: t.usedSessions,
          }),
        );
        // For user packages, also send the patientPackageId
        if (selectedPackage?.isUserPackage && selectedPackage?.patientPackageId) {
          payload.patientPackageId = selectedPackage.patientPackageId;
          payload.patientPackageSubId = selectedPackage.patientPackageSubId;
          payload.isUserPackage = true;
          console.log("Submitting user package:", {
            name: selectedPackage.name,
            patientPackageId: selectedPackage.patientPackageId,
            patientPackageSubId: selectedPackage.patientPackageSubId,
            isUserPackage: true
          });
        }
      }

      console.log("Final submission payload:", payload);
      console.log("[BundleDebug] matchedBundleOffer:", matchedBundleOffer);
      console.log("[BundleDebug] bundleFreeSessions:", bundleFreeSessions);
      console.log("[BundleDebug] bundleFreeSessionCount:", bundleFreeSessionCount);
      console.log("[BundleDebug] offerFreeSession in payload:", payload.offerFreeSession);
      console.log("[BundleDebug] freeOfferSessionCount in payload:", payload.freeOfferSessionCount);
      console.log("[FreeSessionDebug] selectedTreatments:", selectedTreatments);
      console.log("[FreeSessionDebug] usedFreeSessions in payload:", payload.usedFreeSessions);
      console.log("[FreeSessionDebug] usedFreeSessionCount in payload:", payload.usedFreeSessionCount);
      console.log("[FreeSessionDebug] availableFreeSessions:", availableFreeSessions);
      console.log('[CashbackDebug] Current state - isCashbackApplied:', isCashbackApplied);
      console.log('[CashbackDebug] Current state - appliedCashbackAmount:', appliedCashbackAmount);
      console.log('[CashbackDebug] Current state - matchedCashbackOffer:', matchedCashbackOffer ? matchedCashbackOffer.title : null);
      console.log("[CashbackDebug] isCashbackApplied in payload:", payload.isCashbackApplied);
      console.log("[CashbackDebug] cashbackAmount in payload:", payload.cashbackAmount);
      console.log("[CashbackDebug] cashbackOfferName in payload:", payload.cashbackOfferName);

      const response = await axios.post(
        "/api/clinic/create-patient-registration",
        payload,
        { headers },
      );

      if (response.data.success) {
        // Refresh billing history and balances after successful creation
        if (appointment?.patientId) {
          try {
            const headers = getAuthHeaders();
            const [historyResponse, balanceResponse] = await Promise.all([
              axios.get(
                `/api/clinic/billing-history/${appointment.patientId}`,
                { headers },
              ),
              axios.get(
                `/api/clinic/patient-balance/${appointment.patientId}`,
                { headers },
              ),
            ]);
            if (historyResponse.data.success) {
              const filteredBillings = (historyResponse.data.billings || []).filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance");
              setBillingHistory(filteredBillings);
            }
            if (
              balanceResponse.data?.success &&
              balanceResponse.data?.balances
            ) {
              setBalances({
                advanceBalance:
                  balanceResponse.data.balances.advanceBalance || 0,
                pendingBalance:
                  balanceResponse.data.balances.pendingBalance || 0,
                claimAmount:
                  balanceResponse.data.balances.claimAmount || 0,
                pendingClaim:
                  balanceResponse.data.balances.pendingClaim || 0,
                pastAdvanceBalance:
                  balanceResponse.data.balances.pastAdvanceBalance || 0,
                pastAdvance50PercentBalance:
                  balanceResponse.data.balances.pastAdvance50PercentBalance ||
                  0,
                pastAdvance54PercentBalance:
                  balanceResponse.data.balances.pastAdvance54PercentBalance ||
                  0,
                pastAdvance159FlatBalance:
                  balanceResponse.data.balances.pastAdvance159FlatBalance || 0,
              });
            }
            
            // ✅ IMPORTANT: Refresh available free sessions after billing
            // This updates the list when free sessions are consumed
            try {
              const freeSessionsResponse = await axios.get(
                `/api/clinic/billing-history/${appointment.patientId}`,
                { headers }
              );
              
              if (freeSessionsResponse.data.success && freeSessionsResponse.data.billings) {
                // Same logic as above - calculate remaining free sessions
                const allBillings = freeSessionsResponse.data.billings;
                
                const usedSessionsMap = new Map<string, number>();
                allBillings.forEach((billing: any) => {
                  if (billing.usedFreeSessions && Array.isArray(billing.usedFreeSessions)) {
                    billing.usedFreeSessions.forEach((session: string) => {
                      const sessionKey = session.toLowerCase();
                      usedSessionsMap.set(sessionKey, (usedSessionsMap.get(sessionKey) || 0) + 1);
                    });
                  }
                });

                const freeSessions = allBillings
                  .filter((billing: any) => 
                    billing.offerType === 'bundle' && 
                    billing.offerFreeSession && 
                    billing.offerFreeSession.length > 0 &&
                    billing.freeOfferSessionCount > 0
                  )
                  .map((billing: any) => {
                    const offeredSessions = billing.offerFreeSession || [];
                    const offeredCount = billing.freeOfferSessionCount || 0;
                    
                    let usedCount = 0;
                    offeredSessions.forEach((session: string) => {
                      const sessionKey = session.toLowerCase();
                      usedCount += usedSessionsMap.get(sessionKey) || 0;
                    });
                    
                    const remainingCount = Math.max(0, offeredCount - usedCount);
                    const remainingSessions = offeredSessions.filter((session: string) => {
                      const sessionKey = session.toLowerCase();
                      const usedForThisSession = usedSessionsMap.get(sessionKey) || 0;
                      return usedForThisSession < offeredCount;
                    });

                    return {
                      billingId: billing._id,
                      offerName: billing.offerName || billing.offerTitle || 'Bundle Offer',
                      offerFreeSession: remainingSessions,
                      freeOfferSessionCount: remainingCount,
                      originalOfferedSessions: offeredSessions,
                      originalOfferedCount: offeredCount,
                      usedCount: usedCount,
                      remainingCount: remainingCount,
                      invoiceNumber: billing.invoiceNumber,
                      invoicedDate: billing.invoicedDate,
                      purchasedTreatment: billing.treatment,
                      amount: billing.amount
                    };
                  })
                  .filter((session: any) => session.remainingCount > 0);
                
                setAvailableFreeSessions(freeSessions);
                console.log('[FreeSessions] Refreshed available free sessions after billing:', freeSessions);
              } else {
                setAvailableFreeSessions([]);
              }
            } catch (error) {
              console.error('Error refreshing free sessions:', error);
            }
          } catch (error) {
            console.error("Error refreshing history/balances:", error);
          }
        }

        if (onSuccess) onSuccess();
        onClose();
        // Reset form
        setSelectedTreatments([]);
        setSelectedPackage(null);
        setPackageTreatmentSessions([]);
        setSelectedService("Treatment");
        setUseMultiplePayments(false);
        setMultiplePayments([
          { paymentMethod: "Cash", amount: "" },
          { paymentMethod: "Card", amount: "" },
        ]);
        generateInvoiceNumber();
      } else {
        setErrors({
          general: response.data.message || "Failed to create billing",
        });
      }
    } catch (error: any) {
      console.error("Error creating billing:", error);
      setErrors({
        general: error.response?.data?.message || "Failed to create billing",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const billedItems = (billingHistory || []).filter(
    (b) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance" && (String(b.appointmentId) === String(appointment?._id) ||
           String(b.appointmentId?._id) === String(appointment?._id))
  );

  const isAlreadyBilled = billedItems.length > 0;

  const canRebill = isAlreadyBilled;

  const filteredTreatments = treatments.filter((t) => {
    const isBilled = isTreatmentBilledRecently(t.name);
    
    // Check if this treatment is available as a free session
    const isFreeSession = availableFreeSessions.some((session: any) => 
      session.offerFreeSession.some((freeTreatment: string) => 
        freeTreatment.toLowerCase() === t.name.toLowerCase()
      )
    );

    // If treatment is already billed, only show it if it's a free session
    if (isBilled && !isFreeSession) {
      return false;
    }

    if (!treatmentSearchQuery.trim()) {
      return t.type === "sub";
    }
    const query = treatmentSearchQuery.toLowerCase();
    if (t.type === "sub") {
      return (
        t.name.toLowerCase().includes(query) ||
        t.mainTreatment?.toLowerCase().includes(query) ||
        false
      );
    }
    return false;
  });

  // Combine regular packages with userPackages for the dropdown
  const allPackagesForDropdown: Package[] = [
    ...packages.map((pkg: any) => ({ ...pkg, isUserPackage: false })),
    ...userPackages.map((pkg: any) => ({
      _id: pkg._id,
      name: pkg.packageName,
      totalPrice: pkg.totalPrice,
      totalSessions: pkg.totalSessions,
      sessionPrice: pkg.sessionPrice || (pkg.totalSessions > 0 ? pkg.totalPrice / pkg.totalSessions : 0),
      treatments: pkg.treatments || [],
      isUserPackage: true,
      remainingSessions: pkg.remainingSessions,
      patientPackageId: pkg.patientPackageId,
      patientPackageSubId: pkg.patientPackageSubId,
    })),
  ];

  const filteredAllPackages = allPackagesForDropdown.filter((pkg) => {
    const hasUnbilledTreatments = pkg.treatments?.some((t: any) => {
      const tName = t.treatmentName || t.name;
      return tName && !isTreatmentBilledRecently(tName);
    });
    if (!hasUnbilledTreatments) return false;

    if (!packageSearchQuery.trim()) return false;
    const query = packageSearchQuery.toLowerCase();
    return pkg.name.toLowerCase().includes(query);
  });

  // Last 3 billing invoices for Payment History section
  const last3Billings = (billingHistory || [])
    .filter((b: any) => !b.isAdvanceOnly && b.treatment !== "Advance Payment" && b.treatment !== "Historical Advance Balance")
    .slice(0, 3);

  // Use API values for pending and advance balance display at top
  const apiPendingBalance = balances.pendingBalance || 0;
  const apiAdvanceBalance = balances.advanceBalance || 0;
 


  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-1 sm:p-2 bg-black/50 backdrop-blur-md transition-all duration-300 animate-in fade-in">
        <div
          className="bg-white rounded-xl shadow-2xl w-full  max-h-[96vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 opacity-100 animate-in slide-in-from-bottom-4 zoom-in-95"
          style={{ minHeight: "600px" }}
        >
          {/* ── NEW HEADER ── */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              {/* Left: Patient Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {appointment.patientName?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 leading-tight">
                    {appointment.patientName || "-"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{appointment.emrNumber && `MRN: ${appointment.emrNumber}`}</div>
                </div>
              </div>
         
              {/* Center: Invoice + Appointment Details */}
              <div className="flex items-center gap-6 text-center flex-shrink-0">
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Invoice Number</div>
                  <div className="text-xs font-bold text-gray-800">{formData.invoiceNumber || "-"}</div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Date</div>
                  <div className="text-xs font-semibold text-gray-800">
                    {formData.invoicedDate ? new Date(formData.invoicedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Doctor</div>
                  <div className="text-xs font-semibold text-gray-800">{appointment.doctorName || "-"}</div>
                </div>
                {appointment.startDate && (
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">Apt. Date</div>
                    <div className="text-xs font-semibold text-gray-800">
                      {new Date(appointment.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </div>
                  </div>
                )}
                {(appointment.fromTime || appointment.toTime) && (
                  <div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider">Time</div>
                    <div className="text-xs font-semibold text-gray-800">
                      {appointment.fromTime}{appointment.toTime ? `–${appointment.toTime}` : ""}
                    </div>
                  </div>
                )}
               
                {/* Send Consent Form Option */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedConsentId}
                    onChange={(e) => { setSelectedConsentId(e.target.value); setConsentSent(false); }}
                    disabled={sendingConsent}
                    className="text-[10px] border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300 max-w-[120px]"
                  >
                    <option value="">Select Consent</option>
                    {consentForms.map((form) => (
                      <option key={form._id} value={form._id}>
                        {form.formName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleSendConsentMsgOnWhatsapp}
                    disabled={!selectedConsentId || sendingConsent}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {sendingConsent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {consentSent ? "Sent" : "Send"}
                  </button>
                </div>

                {/* Generate Invoice Button */}
                <button
                  type="button"
                  onClick={generateInvoicePDF}
                  disabled={isGeneratingPDF || (!selectedTreatments.length && !selectedPackage)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-sm"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  {isGeneratingPDF ? "Generating..." : "Generate Invoice"}
                </button>
              </div>
         
              {/* Right: Pending, Advance, Visits */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Pending</div>
                  <div className={`text-sm font-bold ${apiPendingBalance > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {getCurrencySymbol(currency)} {apiPendingBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Advance</div>
                  <div className={`text-sm font-bold ${apiAdvanceBalance > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                    {getCurrencySymbol(currency)} {apiAdvanceBalance.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Visits</div>
                  <div className="text-sm font-bold text-blue-600">
                    {visitCount !== null ? visitCount : <span className="text-gray-400">–</span>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded transition-all text-gray-500 hover:text-gray-800 ml-2"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 scrollbar-hide">
            <form
              id="billing-form"
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              {errors.general && (
                <div className="bg-red-50 border-l-2 border-red-500 rounded p-2 flex items-start gap-2 text-red-700 shadow-sm animate-in slide-in-from-top-2 fade-in" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-xs font-medium">{errors.general}</p>
                </div>
              )}

              {isAlreadyBilled && (
                <div className={`${canRebill ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-amber-50 border-amber-500 text-amber-700'} border-l-2 rounded p-2 flex items-start gap-2 shadow-sm animate-in slide-in-from-top-2 fade-in`} role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs font-bold">{canRebill ? "Additional Billing Available" : "Appointment Already Billed"}</p>
                    <p className="text-[10px]">
                      {canRebill 
                        ? "A billing record exists for this appointment. You can add more treatments or packages.."
                        : "A billing record already exists for this appointment. Please verify before creating another one."}
                    </p>
                  </div>
                </div>
              )}

              {/* ── TWO-COLUMN LAYOUT: Left = Service Type | Right = Membership + Active Packages ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── LEFT COLUMN: Service Type (spans 2 of 3) ── */}
                <div className="lg:col-span-2 space-y-3">

                  {/* Service Type selector */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-3">
                      Service Type <span className="text-red-500">*</span>
                    </h3>

                    {/* Radio toggle */}
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          value="Treatment"
                          checked={selectedService === "Treatment"}
                          onChange={(e) => { setSelectedService(e.target.value as "Treatment"); setFormData((prev) => ({ ...prev, service: "Treatment" })); }}
                          className="w-3.5 h-3.5 text-teal-600 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">Treatment</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="radio"
                          value="Package"
                          checked={selectedService === "Package"}
                          onChange={(e) => { setSelectedService(e.target.value as "Package"); setFormData((prev) => ({ ...prev, service: "Package" })); }}
                          className="w-3.5 h-3.5 text-teal-600 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">Package</span>
                      </label>
                    </div>

                    {/* Membership Free Consultation banner (hide if transferred out) */}
                    {loadingMembershipUsage && (
                      <div className="rounded-lg border p-2 mb-3 bg-gray-50 border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                        Loading membership usage...
                      </div>
                    )}
                    {membershipUsage?.hasMembership && !membershipUsage?.isExpired && membershipUsage?.hasFreeConsultations && !isMembershipTransferredOut() && (
                      <div className={`rounded-lg border p-2 mb-3 ${
                        membershipUsage.remainingFreeConsultations > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-900">{membershipUsage.membershipName} – Free Consultations</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            membershipUsage.remainingFreeConsultations > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {membershipUsage.remainingFreeConsultations > 0 ? `${membershipUsage.remainingFreeConsultations} Remaining` : "All Used"}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              membershipUsage.remainingFreeConsultations > 0 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min((membershipUsage.usedFreeConsultations / membershipUsage.totalFreeConsultations) * 100, 100)}%` }}
                          />
                        </div>
                        {membershipUsage.remainingFreeConsultations > 0 && (
                          <p className="mt-1 text-[10px] text-emerald-700">This session will be free. No charge applied.</p>
                        )}
                        {membershipUsage.remainingFreeConsultations === 0 && (
                          <p className="mt-1 text-[10px] text-amber-700">
                            All consultations used.{membershipUsage.discountPercentage > 0 ? ` ${membershipUsage.discountPercentage}% discount will apply.` : " Regular pricing applies."}
                          </p>
                        )}
                      </div>
                    )}
                    {membershipUsage?.hasMembership && membershipUsage?.isExpired && (
                      <div className="rounded-lg border bg-red-50 border-red-200 p-2 mb-3 text-xs text-red-700">
                        <span className="font-semibold">{membershipUsage.membershipName}</span> – Membership expired. Regular pricing applies.
                      </div>
                    )}
                    {membershipUsage?.hasMembership && !membershipUsage?.isExpired && !membershipUsage?.hasFreeConsultations && membershipUsage?.discountPercentage > 0 && (
                      <div className="rounded-lg border bg-blue-50 border-blue-200 p-2 mb-3 text-xs text-blue-700">
                        <span className="font-semibold">{membershipUsage.membershipName}</span> – {membershipUsage.discountPercentage}% discount applied automatically.
                      </div>
                    )}

                    {/* Notification for recently added service from Smart Recommendations */}
                    {justAddedServiceName && (
                      <div className="rounded-lg border bg-emerald-50 border-emerald-200 p-2 mb-3 text-xs text-emerald-700 flex items-center gap-2 animate-in slide-in-from-top-2 fade-in">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">{justAddedServiceName}</span> added to Treatment & Billing!
                      </div>
                    )}

                    {/* Treatment Selection */}
                    {selectedService === "Treatment" && (
                      <div className="relative z-20">
                        <label className="block text-[10px] font-semibold text-gray-600 mb-1">Select Treatment <span className="text-red-500">*</span></label>
                        <div className="relative" ref={treatmentDropdownRef}>
                          <button
                            type="button"
                            onClick={() => { setTreatmentDropdownOpen(!treatmentDropdownOpen); if (!treatmentDropdownOpen) setTreatmentSearchQuery(""); }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <span className="text-gray-500">
                              {selectedTreatments.length > 0 ? `${selectedTreatments.length} treatment(s) selected` : "Click to select treatments..."}
                            </span>
                            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${treatmentDropdownOpen ? "rotate-180" : ""}`} />
                          </button>
                          {treatmentDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                              <div className="p-1.5 border-b border-gray-200 sticky top-0 bg-white">
                                <input
                                  type="text" placeholder="Search treatments..."
                                  value={treatmentSearchQuery}
                                  onChange={(e) => { e.stopPropagation(); setTreatmentSearchQuery(e.target.value); }}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") setTreatmentDropdownOpen(false); }}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  autoFocus
                                />
                              </div>
                              <div className="overflow-y-auto max-h-56">
                                {filteredTreatments.length === 0 ? (
                                  <div className="p-2 text-center text-xs text-gray-500">
                                    {treatmentSearchQuery.trim() ? "No treatments found" : "No treatments available"}
                                  </div>
                                ) : (
                                  <div className="p-1">
                                    {filteredTreatments.map((treatment) => {
                                      const isSelected = selectedTreatments.some((t) => t.treatmentSlug === treatment.slug);
                                      return (
                                        <button
                                          key={treatment.slug} type="button"
                                          onClick={(e) => { e.stopPropagation(); handleTreatmentToggle(treatment); }}
                                          onMouseDown={(e) => e.preventDefault()}
                                          className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${isSelected ? "bg-teal-50 text-teal-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>
                                              {treatment.name}
                                              {treatment.mainTreatment && <span className="text-gray-400 ml-1">({treatment.mainTreatment})</span>}
                                            </span>
                                            {isSelected && <span className="text-teal-600">✓</span>}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Selected treatments with quantity & toggle */}
                        {selectedTreatments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {selectedTreatments.map((treatment) => {
                              const isJustAdded = justAddedServiceName && treatment.treatmentName === justAddedServiceName;
                              return (
                                <div
                                  key={treatment.treatmentSlug}
                                  className={`bg-white border rounded-xl p-3 shadow-sm transition-all duration-500 ${
                                    isJustAdded ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200" : "border-gray-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {/* Toggle (enable/disable treatment in invoice) */}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSelectedTreatment(treatment.treatmentSlug)}
                                        className="relative w-8 h-5 rounded-full bg-teal-500 transition-colors flex-shrink-0"
                                        title="Remove treatment"
                                      >
                                        <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                                      </button>
                                      <div className="min-w-0">
                                        <div className="text-xs font-semibold text-gray-900 truncate">
                                          {treatment.treatmentName}
                                          {treatment.isFreeSession && (
                                            <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-green-200 text-green-800 rounded-full font-bold">FREE</span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-gray-500">Dr. {appointment.doctorName}</div>
                                        {(treatment.usesFreeConsultation || treatment.usesMembershipDiscount || treatment.isFreeSession) && (
                                          <div className="flex items-center gap-1 mt-0.5">
                                            {treatment.usesFreeConsultation && (
                                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold">Free Consultation</span>
                                            )}
                                            {treatment.usesMembershipDiscount && (
                                              <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">{membershipUsage?.discountPercentage || 10}% Off</span>
                                            )}
                                            {treatment.isFreeSession && (
                                              <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-semibold flex items-center gap-0.5">
                                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Bundle Offer
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        {isJustAdded && (
                                          <div className="text-[9px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Just added from Smart Recommendations
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {/* Qty control */}
                                      <button type="button" onClick={() => handleQuantityChange(treatment.treatmentSlug, Math.max(1, treatment.quantity - 1))} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">−</button>
                                      <span className="text-xs font-semibold text-gray-900 w-5 text-center">{treatment.quantity}</span>
                                      <button type="button" onClick={() => handleQuantityChange(treatment.treatmentSlug, treatment.quantity + 1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 text-xs font-bold">+</button>
                                      <span className="text-[10px] text-gray-500 ml-1">@ {getCurrencySymbol(currency)} {treatment.price.toFixed(2)} each</span>
                                      <span className="text-xs font-bold text-gray-900 ml-2">{getCurrencySymbol(currency)} {treatment.totalPrice.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="text-xs text-gray-500 mt-1 text-center bg-gray-100 px-2 py-1 rounded-lg">
                              Qty: {selectedTreatments.reduce((s, t) => s + t.quantity, 0)} | Total: {getCurrencySymbol(currency)} {selectedTreatments.reduce((s, t) => s + t.totalPrice, 0).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Package Selection */}
                    {selectedService === "Package" && (
                      <div className="space-y-2 relative z-20">
                        <label className="block text-[10px] font-semibold text-gray-600 mb-1">Select Package <span className="text-red-500">*</span></label>
                        <div className="relative" ref={packageDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setPackageDropdownOpen(!packageDropdownOpen)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 hover:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <span className="text-gray-500 flex items-center gap-2">
                              {selectedPackage ? selectedPackage.name : "Search packages..."}
                              {selectedPackage?.paymentStatus === "Full" && (
                                <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-bold uppercase">Full Paid</span>
                              )}
                              {selectedPackage?.paymentStatus === "Partial" && (
                                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[8px] font-bold uppercase">Partial Paid (${selectedPackage.paidAmount})</span>
                              )}
                            </span>
                            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${packageDropdownOpen ? "rotate-180" : ""}`} />
                          </button>
                          {packageDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-hidden flex flex-col">
                              <div className="p-1.5 border-b border-gray-200">
                                <input type="text" placeholder="Search packages..."
                                  value={packageSearchQuery}
                                  onChange={(e) => { e.stopPropagation(); setPackageSearchQuery(e.target.value); }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500" autoFocus
                                />
                              </div>
                              <div className="overflow-y-auto max-h-40">
                                {filteredAllPackages.length === 0 ? (
                                  <div className="p-2 text-center text-xs text-gray-500">{packageSearchQuery.trim() ? "No packages found" : "Start typing..."}</div>
                                ) : (
                                  <div className="p-1">
                                    {filteredAllPackages.map((pkg) => (
                                      <button key={pkg._id} type="button"
                                        onClick={(e) => { e.stopPropagation(); handlePackageSelect(pkg); }}
                                        className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                      >
                                        <div className="font-medium">{pkg.name}</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                          Total: {getCurrencySymbol(currency)} {Number(pkg.totalPrice).toFixed(2)} | {pkg.totalSessions} sessions
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Package treatment sessions */}
                        {selectedPackage && packageTreatmentSessions.length > 0 && (
                          <div className="mt-2">
                            {loadingPackageUsage ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2" />
                                <span className="text-xs text-gray-500">Loading package usage...</span>
                              </div>
                            ) : (
                              <>
                                {packageUsageData && packageUsageData.totalSessions > 0 && (
                                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    <span className="font-semibold">Package Usage History</span> — {packageUsageData.totalSessions} sessions used from previous billings
                                  </div>
                                )}
                                <div className="space-y-2">
                                  {(() => {
                                    // Calculate prepaid status for UI
                                    const paidAmount = selectedPackage?.paidAmount || 0;
                                    const paymentStatus = selectedPackage?.paymentStatus || "Unpaid";
                                    let consumedPrepaidAmount = 0;
                                    if (packageUsageData?.billingHistory) {
                                      packageUsageData.billingHistory.forEach((bill: any) => {
                                        if (bill.selectedPackageTreatments) {
                                          bill.selectedPackageTreatments.forEach((bt: any) => {
                                            const trDef = selectedPackage.treatments.find(t => t.treatmentSlug === bt.treatmentSlug);
                                            if (trDef) {
                                              consumedPrepaidAmount += (trDef.sessionPrice || 0) * (bt.sessions || 0);
                                            }
                                          });
                                        }
                                      });
                                    }
                                    let availablePrepaid = Math.max(0, paidAmount - consumedPrepaidAmount);

                                    return packageTreatmentSessions.map((treatment) => {
                                      const remainingSessions = treatment.maxSessions - treatment.previouslyUsedSessions;
                                      const isFullyUsed = remainingSessions <= 0;
                                      const isBilledToday = treatment.isAlreadyBilledForThisAppointment;
                                      
                                      // Determine if this specific treatment session is prepaid
                                      let isPrepaid = false;
                                      if (treatment.isSelected && treatment.usedSessions > 0) {
                                        if (paymentStatus === "Full") {
                                          isPrepaid = true;
                                        } else {
                                          const cost = treatment.sessionPrice * treatment.usedSessions;
                                          if (availablePrepaid >= cost) {
                                            isPrepaid = true;
                                            availablePrepaid -= cost;
                                          } else if (availablePrepaid > 0) {
                                            // Partially prepaid - we can show a special tag or just count it as free-ish
                                            isPrepaid = true;
                                            availablePrepaid = 0;
                                          }
                                        }
                                      }

                                      return (
                                        <div key={treatment.treatmentSlug}
                                          className={`bg-white border rounded-xl p-3 shadow-sm transition-all duration-200 ${
                                            isFullyUsed || isBilledToday ? "border-red-200 opacity-80" : treatment.isSelected ? "border-teal-300" : "border-gray-200"
                                          }`}
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1">
                                              {/* Toggle */}
                                              <button
                                                type="button"
                                                disabled={isFullyUsed || isBilledToday}
                                                onClick={() => handlePackageTreatmentToggle(treatment.treatmentSlug)}
                                                className={`relative mt-0.5 w-8 h-5 rounded-full transition-colors flex-shrink-0 ${
                                                  isFullyUsed || isBilledToday ? "bg-gray-200 cursor-not-allowed" : treatment.isSelected ? "bg-teal-500" : "bg-gray-200"
                                                }`}
                                              >
                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                                                  treatment.isSelected && !isFullyUsed && !isBilledToday ? "right-0.5" : "left-0.5"
                                                }`} />
                                              </button>
                                              <div>
                                                <div className={`text-xs font-semibold ${
                                                  isFullyUsed || isBilledToday ? "text-red-600" : treatment.isSelected ? "text-gray-900" : "text-gray-700"
                                                }`}>{treatment.treatmentName}</div>
                                                <div className="text-[10px] text-teal-600 font-medium">{getCurrencySymbol(currency)} {treatment.sessionPrice.toFixed(2)}/session</div>
                                                
                                                {isBilledToday && (
                                                  <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold flex items-center gap-1">
                                                      <AlertCircle className="w-2.5 h-2.5" /> Already Billed for this Appointment
                                                    </span>
                                                  </div>
                                                )}

                                                {(isPrepaid || treatment.usesMembershipDiscount) && !isBilledToday && (
                                                  <div className="flex items-center gap-1 mt-0.5">
                                                    {isPrepaid && (
                                                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold">
                                                        {selectedPackage?.paymentStatus === "Full" ? "Prepaid (Full)" : "Prepaid (Partial)"}
                                                      </span>
                                                    )}
                                                    {treatment.usesMembershipDiscount && (
                                                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-semibold">{membershipUsage?.discountPercentage || 10}% Off</span>
                                                    )}
                                                  </div>
                                                )}
                                                {treatment.previouslyUsedSessions > 0 ? (
                                                  <div className={`text-[10px] mt-0.5 font-medium flex items-center gap-1 ${
                                                    isFullyUsed ? "text-red-600" : "text-amber-600"
                                                  }`}>
                                                    {isFullyUsed ? (
                                                      <><XCircle className="w-3 h-3" /> All sessions used</>
                                                    ) : (
                                                      <><AlertCircle className="w-3 h-3" /> {treatment.previouslyUsedSessions}/{treatment.maxSessions} used · {remainingSessions} left</>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                                  <CheckCircle className="w-3 h-3" /> All {treatment.maxSessions} sessions available
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {/* Session input */}
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <button type="button"
                                              disabled={!treatment.isSelected || isFullyUsed || isBilledToday}
                                              onClick={() => handlePackageSessionChange(treatment.treatmentSlug, Math.max(1, treatment.usedSessions - 1))}
                                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold disabled:opacity-40"
                                            >−</button>
                                            <span className="text-xs font-bold w-5 text-center">{treatment.isSelected ? treatment.usedSessions : 0}</span>
                                            <button type="button"
                                              disabled={!treatment.isSelected || isFullyUsed || isBilledToday}
                                              onClick={() => handlePackageSessionChange(treatment.treatmentSlug, Math.min(remainingSessions, treatment.usedSessions + 1))}
                                              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs font-bold disabled:opacity-40"
                                            >+</button>
                                          </div>
                                        </div>
                                        {errors[`packageSession_${treatment.treatmentSlug}`] && (
                                          <div className="mt-1.5 text-[10px] text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {errors[`packageSession_${treatment.treatmentSlug}`]}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })})()}
                                </div>
                                {errors.packageTreatments && (
                                  <div className="mt-1 text-xs text-red-600">{errors.packageTreatments}</div>
                                )}
                                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex gap-4 text-xs">
                                    <span className="text-gray-600">Selected: <span className="font-bold text-teal-600">{packageTreatmentSessions.filter(t => t.isSelected).length}/{packageTreatmentSessions.length}</span></span>
                                    <span className="text-gray-600">Sessions: <span className="font-bold text-emerald-600">{packageTreatmentSessions.filter(t => t.isSelected).reduce((s, t) => s + t.usedSessions, 0)}</span></span>
                                    <span className="text-gray-600">Total: <span className="font-bold text-teal-600">{getCurrencySymbol(currency)} {totalPrice.toFixed(2)}</span></span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Membership discount breakdown in service area */}
                    {(() => {
                      const appliedOffers = matchedOffers.filter(o => appliedOfferIds.includes(o._id));
                      const showSummary = ((isMembershipApplied && membershipUsage?.hasMembership && !membershipUsage?.isExpired && membershipUsage?.remainingFreeConsultations === 0 && membershipUsage?.discountPercentage > 0) || isDoctorDiscountApplied || isAgentDiscountApplied || appliedOfferIds.length > 0) && parseFloat(formData.originalAmount || "0") > 0;
                      if (!showSummary) return null;

                      const activeDiscounts = [];
                      if (finalMembershipDiscount > 0) {
                        activeDiscounts.push(`Membership (${membershipUsage?.discountPercentage || 0}%)`);
                      }
                      if (finalOfferDiscount > 0 && appliedOffers.length > 0) {
                        activeDiscounts.push(`Offer: ${appliedOffers.map(o => o.title).join(", ")}`);
                      }
                      if (finalReceptionistDiscount > 0) {
                        if (isDoctorDiscountApplied && doctorComplaintDiscount) {
                          activeDiscounts.push(`Dr. Disc (${doctorComplaintDiscount.discountAmount}${doctorComplaintDiscount.discountType === "percentage" ? "%" : " Fixed"})`);
                        } else if (isAgentDiscountApplied && agentDiscount) {
                          activeDiscounts.push(`Agent Disc (${agentDiscount.discountAmount}${agentDiscount.discountType === "percentage" ? "%" : " Fixed"})`);
                        }
                      }

                      const discountDesc = activeDiscounts.join(" + ");
                      const canCombine = appliedOffers.length === 0 || appliedOffers.every(o => o.allowCombiningWithOtherOffers);
                      const hasMultipleDiscounts = activeDiscounts.length > 1;

                      return (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="text-gray-500 text-[10px]">Original</div>
                              <div className="font-semibold line-through text-gray-500">{getCurrencySymbol(currency)} {parseFloat(formData.originalAmount || "0").toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-500 text-[10px] leading-tight">
                                Discount
                                {discountDesc && <div className="text-[8px] font-medium opacity-80">{discountDesc}</div>}
                              </div>
                              <div className="font-semibold text-blue-600">−{getCurrencySymbol(currency)} {(parseFloat(formData.originalAmount || "0") - totalPrice).toFixed(2)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-emerald-500 text-[10px]">Final</div>
                              <div className="font-bold text-emerald-600">{getCurrencySymbol(currency)} {totalPrice.toFixed(2)}</div>
                            </div>
                          </div>
                          {!canCombine && hasMultipleDiscounts && (
                            <div className="mt-2 text-[9px] text-blue-700 font-bold italic text-center bg-blue-100/50 py-1 rounded">
                              * Other discounts cannot be applied, only the highest one can be applied.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {isMembershipApplied && membershipUsage?.hasMembership && !membershipUsage?.isExpired && membershipUsage?.remainingFreeConsultations > 0 && totalPrice === 0 && (
                      <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                        ✓ Free consultation applied — no charge for this session.
                      </div>
                    )}
                  </div>

                  {/* ── PAYMENT DETAILS ── */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-3">Payment Details</h3>
                   
                    {/* Discount Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                      {/* Membership Discount Toggle */}
                      {showMembershipDiscount && membershipUsage?.hasMembership && !membershipUsage?.isExpired && !isMembershipTransferredOut() && (
                        <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isMembershipApplied ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-gray-50 border-gray-100"
                        }`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isMembershipApplied ? "bg-blue-100" : "bg-gray-100"}`}>
                              <Tag size={14} className={isMembershipApplied ? "text-blue-600" : "text-gray-400"} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-bold ${isMembershipApplied ? "text-blue-700" : "text-gray-500"}`}>MEMBERSHIP</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-medium">
                                  {membershipUsage.remainingFreeConsultations > 0 
                                    ? "Free Session" 
                                    : `${membershipUsage.discountPercentage}% Off`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !isMembershipApplied;
                              setIsMembershipApplied(newStatus);
                              
                              if (newStatus) {
                                // If any applied offer doesn't allow combining, deselect all offers
                                const anyRestricted = matchedOffers.some(o => appliedOfferIds.includes(o._id) && !o.allowCombiningWithOtherOffers);
                                if (anyRestricted) {
                                  setAppliedOfferIds([]);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                              isMembershipApplied
                                ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {isMembershipApplied ? "Applied" : "Apply"}
                          </button>
                        </div>
                      )}

                      {/* Offer Toggles */}
                      {matchedOffers.map((offer) => {
                        const isApplied = appliedOfferIds.includes(offer._id);
                        const isAutoApplied = offer.autoApplyBestOffer && isApplied;
                        const isBundleOffer = offer.offerType === 'bundle';
                        const isCashbackOffer = offer.offerType === 'cashback';
                        // For cashback offers, check isCashbackApplied state instead of appliedOfferIds
                        const isCashbackAppliedState = isCashbackOffer && isCashbackApplied && matchedCashbackOffer?._id === offer._id;
                        const effectiveIsApplied = isCashbackOffer ? isCashbackAppliedState : isApplied;
                        
                        return (
                          <div key={offer._id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            effectiveIsApplied ? "bg-teal-50 border-teal-200 shadow-sm" : "bg-gray-50 border-gray-100"
                          }`}>
                            <div className="flex items-start gap-2.5 flex-1">
                              <div className={`p-1.5 rounded-lg ${effectiveIsApplied ? "bg-teal-100" : "bg-gray-100"}`}>
                                <Tag size={14} className={effectiveIsApplied ? "text-teal-600" : "text-gray-400"} />
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className={`text-[10px] font-bold ${effectiveIsApplied ? "text-teal-700" : "text-gray-500"}`}>
                                  {isBundleOffer ? 'BUNDLE' : isCashbackOffer ? 'CASHBACK' : 'OFFER'}
                                </span>
                                
                                {/* Bundle Offer Display: Show "Buy X Get Y" */}
                                {isBundleOffer ? (
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[10px] text-gray-600 font-medium truncate">
                                      {offer.title}
                                    </span>
                                    <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold inline-block w-fit">
                                      Buy {offer.buyQty} Get {offer.freeQty} Free
                                    </span>
                                  </div>
                                ) : isCashbackOffer ? (
                                  /* Cashback Offer Display: Show "Get $X Cashback" */
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <span className="text-[10px] text-gray-600 font-medium truncate">
                                      {offer.title}
                                    </span>
                                    <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold inline-block w-fit">
                                      Get {getCurrencySymbol(currency)} {offer.cashbackAmount} Cashback
                                    </span>
                                    {offer.cashbackExpiryDays && offer.cashbackExpiryDays > 0 && (
                                      <span className="text-[8px] text-purple-600 font-medium">
                                        Valid for {offer.cashbackExpiryDays} days
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  /* Regular Instant Discount Offer */
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-600 font-medium truncate max-w-[120px]">
                                        {offer.title}
                                      </span>
                                      <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-bold">
                                        {offer.discountValue}{offer.discountMode === "percentage" ? "%" : " Fixed"}
                                      </span>
                                    </div>
                                    {offer.maxBenefitCap > 0 && (
                                      <span className="text-[8px] text-teal-600 font-bold italic">
                                        Up to {getCurrencySymbol(currency)} {offer.maxBenefitCap}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {isAutoApplied && (
                                  <span className="text-[8px] text-emerald-600 font-bold mt-0.5">✓ Auto-Applied (Best Offer)</span>
                                )}
                              </div>
                            </div>
                            {/* Always show Apply button for all offers */}
                            <button
                              type="button"
                              onClick={() => {
                                  // Handle cashback offers differently
                                  if (offer.offerType === 'cashback') {
                                    if (isCashbackApplied && matchedCashbackOffer?._id === offer._id) {
                                      // Remove cashback
                                      appliedCashbackRef.current = null;
                                      setMatchedCashbackOffer(null);
                                      setIsCashbackApplied(false);
                                      setAppliedCashbackAmount(0);
                                      console.log("[Cashback] Cashback removed from offer button");
                                    } else {
                                      // Apply cashback - update matchedCashbackOffer to this specific offer
                                      const cashbackAmount = offer.cashbackAmount || 0;
                                      appliedCashbackRef.current = {
                                        offerId: offer._id,
                                        amount: cashbackAmount
                                      };
                                      setMatchedCashbackOffer(offer);
                                      setAppliedCashbackAmount(cashbackAmount);
                                      setIsCashbackApplied(true);
                                      console.log("[Cashback] Applied from offer button:", { amount: cashbackAmount, offerTitle: offer.title });
                                    }
                                    return;
                                  }
                                  
                                  // Regular offer logic (instant_discount, bundle)
                                  if (isApplied) {
                                    setAppliedOfferIds(prev => prev.filter(id => id !== offer._id));
                                  } else {
                                    if (!offer.allowCombiningWithOtherOffers) {
                                      // If this offer doesn't allow combining, clear EVERYTHING else
                                      setAppliedOfferIds([offer._id]);
                                      setIsMembershipApplied(false);
                                      setIsDoctorDiscountApplied(false);
                                      setIsAgentDiscountApplied(false);
                                    } else {
                                      // If combining is allowed, but we already have a restricted offer applied, clear it
                                      const hasRestricted = matchedOffers.some(o => appliedOfferIds.includes(o._id) && !o.allowCombiningWithOtherOffers);
                                      if (hasRestricted) {
                                        setAppliedOfferIds([offer._id]);
                                      } else {
                                        setAppliedOfferIds(prev => [...prev, offer._id]);
                                      }
                                    }
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                                  effectiveIsApplied
                                    ? "bg-teal-200 text-teal-800 hover:bg-teal-300"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {effectiveIsApplied ? "Applied" : "Apply"}
                              </button>
                          </div>
                        );
                      })}
                      
                      {/* Warning for offers not matched due to minimum bill amount */}
                      {unmatchedOffersDueToMinimum.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {unmatchedOffersDueToMinimum.map(({offer, minimumAmount, currentAmount}) => (
                            <div key={offer._id} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <span className="text-amber-600 text-sm">⚠️</span>
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-amber-800">{offer.title}</p>
                                  <p className="text-[9px] text-amber-700 mt-0.5">
                                    Minimum bill amount required: <span className="font-bold">{getCurrencySymbol(currency)} {minimumAmount.toFixed(2)}</span>
                                  </p>
                                  <p className="text-[9px] text-amber-700">
                                    Current bill amount: <span className="font-bold">{getCurrencySymbol(currency)} {currentAmount.toFixed(2)}</span>
                                  </p>
                                  <p className="text-[9px] text-amber-800 font-semibold mt-1">
                                    Add {getCurrencySymbol(currency)} {(minimumAmount - currentAmount).toFixed(2)} more to apply this offer
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Doctor Discount Section (From Profile or Complaint) */}
                      {showDoctorDiscount && doctorAppliedDiscount && (appliedOfferIds.length === 0 || matchedOffers.filter(o => appliedOfferIds.includes(o._id)).every(o => o.allowReceptionistDiscount)) && (
                        <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isDoctorDiscountApplied ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-gray-50 border-gray-100"
                        }`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isDoctorDiscountApplied ? "bg-orange-100" : "bg-gray-100"}`}>
                              <TrendingUp size={14} className={isDoctorDiscountApplied ? "text-orange-600" : "text-gray-400"} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-bold ${isDoctorDiscountApplied ? "text-orange-700" : "text-gray-500"}`}>DOCTOR DISCOUNT</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-medium">
                                  {doctorComplaintDiscount?.discountAmount || 0}
                                  {doctorComplaintDiscount ? (doctorComplaintDiscount?.discountType === "percentage" ? "%" : " Fixed") : ""}
                                  {isDoctorDiscountApplied ? " (Applied)" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !isDoctorDiscountApplied;
                              setIsDoctorDiscountApplied(newStatus);
                              if (newStatus) {
                                setIsAgentDiscountApplied(false);
                                // If any applied offer doesn't allow combining, clear offers
                                const anyRestricted = matchedOffers.some(o => appliedOfferIds.includes(o._id) && !o.allowCombiningWithOtherOffers);
                                if (anyRestricted) {
                                  setAppliedOfferIds([]);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                              isDoctorDiscountApplied
                                ? "bg-orange-200 text-orange-800 hover:bg-orange-300"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {isDoctorDiscountApplied ? "Applied" : "Apply"}
                          </button>
                        </div>
                      )}

                      {/* Hide agent discount if any matched offer has allowReceptionistDiscount: false */}
                      {showAgentDiscount && agentDiscount && 
                       ((userRole === "agent") || !doctorAppliedDiscount) && 
                       (appliedOfferIds.length === 0 || matchedOffers.filter(o => appliedOfferIds.includes(o._id)).every(o => o.allowReceptionistDiscount)) &&
                       !matchedOffers.some(o => o.allowReceptionistDiscount === false) && (
                        <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isAgentDiscountApplied ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-gray-50 border-gray-100"
                        }`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`p-1.5 rounded-lg ${isAgentDiscountApplied ? "bg-blue-100" : "bg-gray-100"}`}>
                              <TrendingUp size={14} className={isAgentDiscountApplied ? "text-blue-600" : "text-gray-400"} />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-bold ${isAgentDiscountApplied ? "text-blue-700" : "text-gray-500"}`}>AGENT DISCOUNT</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 font-medium">
                                  {agentDiscount.discountAmount}{agentDiscount.discountType === "percentage" ? "%" : " Fixed"} available
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !isAgentDiscountApplied;
                              setIsAgentDiscountApplied(newStatus);
                              if (newStatus) {
                                setIsDoctorDiscountApplied(false);
                                // If any applied offer doesn't allow combining, clear offers
                                const anyRestricted = matchedOffers.some(o => appliedOfferIds.includes(o._id) && !o.allowCombiningWithOtherOffers);
                                if (anyRestricted) {
                                  setAppliedOfferIds([]);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                              isAgentDiscountApplied
                                ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {isAgentDiscountApplied ? "Applied" : "Apply"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-semibold text-gray-600">Total Amount <span className="text-red-500">*</span></label>
                        </div>
                        <input type="number" step="0.01" value={formData.amount || "0.00"} readOnly
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-100 text-gray-900 font-bold"
                        />
                        {parseFloat(formData.pendingUsed || "0") > 0 && (
                          <div className="text-[9px] text-amber-600 mt-0.5 font-bold uppercase tracking-wider">
                            + Pending Amount Added
                          </div>
                        )}
                        {balances.pendingClaim > 0 && (
                          <div className="text-[9px] text-purple-600 mt-0.5 font-bold uppercase tracking-wider">
                            + Pending Claim Added
                          </div>
                        )}
                        {(isDoctorDiscountApplied || isAgentDiscountApplied) && (
                          <div className="text-[9px] text-red-500 mt-0.5 font-medium italic">
                            Discounted from {getCurrencySymbol(currency)} {parseFloat(formData.originalAmount || "0").toFixed(2)}
                          </div>
                        )}
                        
                        {/* Cashback Deduction */}
                        {useCashback && availableCashback && availableCashback.amount > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[9px] text-green-700 font-semibold">
                              <span>💰 Cashback Used:</span>
                              <span>−{getCurrencySymbol(currency)} {Math.min(availableCashback.amount, parseFloat(formData.amount || "0")).toFixed(2)}</span>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-green-800 font-bold">Final Amount:</span>
                                <span className="text-green-700 font-bold text-xs">
                                  {getCurrencySymbol(currency)} {Math.max(0, parseFloat(formData.amount || "0") - Math.min(availableCashback.amount, parseFloat(formData.amount || "0"))).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-1">Paid <span className="text-red-500">*</span></label>
                        <input type="number" step="0.01" value={formData.paid}
                          onChange={(e) => setFormData((prev) => ({ ...prev, paid: e.target.value }))}
                          onFocus={(e) => e.target.select()}
                          className={`w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none ${
                            useMultiplePayments ? "bg-gray-100" : "bg-white"
                          }`}
                          required readOnly={useMultiplePayments}
                          style={{ MozAppearance: 'textfield' }}
                        />
                        <style dangerouslySetInnerHTML={{__html: `
                          input[type='number']::-webkit-inner-spin-button,
                          input[type='number']::-webkit-outer-spin-button {
                            -webkit-appearance: none !important;
                            margin: 0 !important;
                          }
                        `}} />
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          {/* Calculate net due based on final amount after all deductions */}
                          Net due: {getCurrencySymbol(currency)} {
                            (() => {
                              const discountedAmount = parseFloat(formData.discountedAmount || "0") || 0;
                              const cashbackDeduction = (useCashback && availableCashback) 
                                ? Math.min(availableCashback.amount, discountedAmount) 
                                : 0;
                              const finalAmountAfterCashback = Math.max(0, discountedAmount - cashbackDeduction);
                              // pendingUsed = pendingBalance, pendingClaimUsed = pendingClaim
                              const pendingUsed = balances.pendingBalance || 0;
                              const pendingClaimUsed = balances.pendingClaim || 0;
                              const pendingBeingRolledIn = pendingUsed + pendingClaimUsed;
                              const amountForCredits = finalAmountAfterCashback + pendingBeingRolledIn;
                              
                              const appliedAdvance = applyAdvance 
                                ? Math.min(balances.advanceBalance, amountForCredits) 
                                : 0;
                              const appliedPast50 = applyPastAdvance50Percent 
                                ? Math.min(balances.pastAdvance50PercentBalance, amountForCredits - appliedAdvance) 
                                : 0;
                              const appliedPast54 = applyPastAdvance54Percent 
                                ? Math.min(balances.pastAdvance54PercentBalance, amountForCredits - appliedAdvance - appliedPast50) 
                                : 0;
                              const appliedPast159 = applyPastAdvance159Flat 
                                ? Math.min(balances.pastAdvance159FlatBalance, amountForCredits - appliedAdvance - appliedPast50 - appliedPast54) 
                                : 0;
                              const appliedClaimAmt = applyClaimAmount
                                ? Math.min(balances.claimAmount || 0, amountForCredits - appliedAdvance - appliedPast50 - appliedPast54 - appliedPast159)
                                : 0;
                              
                              const netDue = Math.max(0, amountForCredits - appliedAdvance - appliedPast50 - appliedPast54 - appliedPast159 - appliedClaimAmt);
                              return netDue.toFixed(2);
                            })()
                          }
                          {isDoctorDiscountApplied && (
                            <span className="text-orange-600 font-bold ml-1">(Doctor Disc. Applied)</span>
                          )}
                          {isAgentDiscountApplied && (
                            <span className="text-blue-600 font-bold ml-1">(Agent Disc. Applied)</span>
                          )}
                          {useCashback && availableCashback && (
                            <span className="text-green-600 font-bold ml-1">(Cashback Applied)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-1">Pending</label>
                        <input type="number" step="0.01" value={formData.pending || "0.00"}
                          onChange={(e) => setFormData((prev) => ({ ...prev, pending: e.target.value }))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-1">Advance</label>
                        <input type="number" step="0.01" value={formData.advance}
                          onChange={(e) => setFormData((prev) => ({ ...prev, advance: e.target.value }))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-600 mb-1">Payment Method <span className="text-red-500">*</span></label>
                        <select value={formData.paymentMethod}
                          onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                          className={`w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none ${useMultiplePayments ? "opacity-50" : ""}`}
                          required disabled={useMultiplePayments}
                        >
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                          <option value="BT">BT</option>
                          <option value="Tabby">Tabby</option>
                          <option value="Tamara">Tamara</option>
                        </select>
                      </div>
                    </div>

                    {/* Cashback Balance Options */}
                    {availableCashback && availableCashback.amount > 0 && (
                      <div className="mt-3">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 space-y-2">
                          <h4 className="text-[10px] font-bold text-green-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Available Cashback
                          </h4>
                         
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={useCashback}
                                onChange={(e) => {
                                  setUseCashback(e.target.checked);
                                  console.log('[CashbackModal] Use cashback:', e.target.checked);
                                }}
                                className="w-3.5 h-3.5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                              />
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-gray-900">Use cashback balance now</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              {getCurrencySymbol(currency)} {availableCashback.amount.toFixed(2)}
                            </span>
                          </label>
                          
                          <div className="text-[9px] text-green-600 mt-1">
                            Expires: {new Date(availableCashback.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({availableCashback.daysRemaining} days remaining)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Advance Balance Options */}
                    <div className="mt-3">
                      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-3 space-y-2">
                        <h4 className="text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                          </svg>
                          Available Advances
                        </h4>
                       
                        {/* Regular Advance Balance */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={applyAdvance}
                              onChange={(e) => setApplyAdvance(e.target.checked)}
                              className="w-3.5 h-3.5 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                            />
                            <span className="text-[10px] font-medium text-gray-700 group-hover:text-gray-900">Use advance balance now</span>
                          </div>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                            {getCurrencySymbol(currency)} {balances.advanceBalance.toFixed(2)}
                          </span>
                        </label>

                        {/* Insurance Claim Amount */}
                        {balances.claimAmount > 0 && (
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={applyClaimAmount}
                                onChange={(e) => setApplyClaimAmount(e.target.checked)}
                                className="w-3.5 h-3.5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                              />
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-gray-900">Use Insurance Claim Amount</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              {getCurrencySymbol(currency)} {balances.claimAmount.toFixed(2)}
                            </span>
                          </label>
                        )}


                        {/* 159 Flat Past Advance (if available) */}
                        {balances.pastAdvance159FlatBalance > 0 && (
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={applyPastAdvance159Flat}
                                onChange={(e) => setApplyPastAdvance159Flat(e.target.checked)}
                                className="w-3.5 h-3.5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                              />
                              <span className="text-[10px] font-medium text-gray-700 group-hover:text-gray-900">Use 159 Flat past advance now</span>
                            </div>
                            <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                              {getCurrencySymbol(currency)} {balances.pastAdvance159FlatBalance.toFixed(2)}
                            </span>
                          </label>
                        )}

                        {/* Summary of applied advances */}
                        {(applyAdvance || applyPastAdvance50Percent || applyPastAdvance54Percent || applyPastAdvance159Flat || applyClaimAmount) && (
                          <div className="mt-2 pt-2 border-t border-teal-200">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-gray-700">Total Applied:</span>
                              <span className="font-bold text-teal-700">
                                {getCurrencySymbol(currency)} {(
                                  (applyAdvance ? Math.min(balances.advanceBalance, parseFloat(formData.amount) || 0) : 0) +
                                  (applyPastAdvance50Percent ? Math.min(balances.pastAdvance50PercentBalance, parseFloat(formData.amount) || 0) : 0) +
                                  (applyPastAdvance54Percent ? Math.min(balances.pastAdvance54PercentBalance, parseFloat(formData.amount) || 0) : 0) +
                                  (applyPastAdvance159Flat ? Math.min(balances.pastAdvance159FlatBalance, parseFloat(formData.amount) || 0) : 0) +
                                  (applyClaimAmount ? Math.min(balances.claimAmount, parseFloat(formData.amount) || 0) : 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2">
                      <button type="button"
                        onClick={() => { setUseMultiplePayments(!useMultiplePayments); if (!useMultiplePayments) setMultiplePayments([{ paymentMethod: "Cash", amount: "" }, { paymentMethod: "Card", amount: "" }]); }}
                        className="text-xs text-teal-600 hover:text-teal-800 underline font-medium"
                      >
                        {useMultiplePayments ? "← Single payment" : "+ Multiple payment methods"}
                      </button>
                    </div>

                    {useMultiplePayments && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-700 uppercase">Split Payments</span>
                          <span className="text-[10px] font-semibold text-blue-700">
                            Total: {getCurrencySymbol(currency)} {multiplePayments.reduce((s, mp) => s + (parseFloat(mp.amount) || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        {multiplePayments.map((mp, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <select value={mp.paymentMethod}
                              onChange={(e) => { const u = [...multiplePayments]; u[idx] = { ...u[idx], paymentMethod: e.target.value }; setMultiplePayments(u); }}
                              className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none min-w-[80px]"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Card">Card</option>
                              <option value="BT">BT</option>
                              <option value="Tabby">Tabby</option>
                              <option value="Tamara">Tamara</option>
                            </select>
                            <input type="number" step="0.01" min="0" placeholder="Amount"
                              value={mp.amount}
                              onChange={(e) => { const u = [...multiplePayments]; u[idx] = { ...u[idx], amount: e.target.value }; setMultiplePayments(u); }}
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                            {multiplePayments.length > 1 && (
                              <button type="button" onClick={() => setMultiplePayments(multiplePayments.filter((_, i) => i !== idx))} className="p-1 text-red-500 hover:text-red-700 rounded transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setMultiplePayments([...multiplePayments, { paymentMethod: "Cash", amount: "" }])} className="text-xs text-teal-600 hover:text-teal-800 font-medium">+ Add method</button>
                      </div>
                    )}
                  </div>

                  {/* Referred By / Notes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">Referred By</label>
                      <input type="text" value={formData.referredBy}
                        onChange={(e) => setFormData((prev) => ({ ...prev, referredBy: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                      <label className="block text-[10px] font-semibold text-gray-600 mb-1">Notes</label>
                      <textarea value={formData.notes}
                        onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Billing Summary */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-bold text-gray-900">Billing Summary</span>
                      {/* Free Consultation Tag */}
                      {isMembershipApplied && membershipUsage && membershipUsage.hasMembership && !membershipUsage.isExpired && membershipUsage.remainingFreeConsultations > 0 && parseFloat(formData.originalAmount || "0") > 0 && (
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          Free Consultation Applied
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {/* Original Amount (before discounts) */}
                      {parseFloat(formData.originalAmount || "0") > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">Original Amount</span>
                          <span className="font-semibold text-gray-900">{getCurrencySymbol(currency)} {parseFloat(formData.originalAmount || "0").toFixed(2)}</span>
                        </div>
                      )}

                      {/* Membership Discount (if applied) */}
                      {isMembershipApplied && finalMembershipDiscount > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">
                            Membership Discount ({membershipUsage?.discountPercentage || 0}%)
                          </span>
                          <span className="font-semibold text-blue-600">
                            −{getCurrencySymbol(currency)} {finalMembershipDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Offer Discount (if applied) */}
                      {appliedOfferIds.length > 0 && finalOfferDiscount > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">
                            Offer: {matchedOffers.filter(o => appliedOfferIds.includes(o._id)).map(o => o.title).join(", ")}
                          </span>
                          <span className="font-semibold text-teal-600">
                            −{getCurrencySymbol(currency)} {finalOfferDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Bundle Offer Free Sessions Indicator */}
                      {/* Only show if bundle offer is matched AND actually applied */}
                      {matchedBundleOffer && bundleFreeSessions.length > 0 && appliedOfferIds.includes(matchedBundleOffer._id) && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-green-900 uppercase tracking-wide">
                                ✅ Bundle Reward Earned: {matchedBundleOffer.title}
                              </div>
                              <div className="text-[10px] text-green-700 mt-1 font-semibold">
                                🎁 Free Session Earned: {bundleFreeSessions.join(", ")}
                              </div>
                              <div className="text-[9px] text-green-600 mt-1">
                                Buy {matchedBundleOffer.buyQty} Get {matchedBundleOffer.freeQty} Free - Redeem on your next visit!
                              </div>
                              {/* {matchedBundleOffer.discountValue && matchedBundleOffer.discountValue > 0 && (
                                <div className="text-[9px] text-green-800 mt-1 font-semibold">
                                  Additional Discount Applied: {matchedBundleOffer.discountMode === "percentage" ? `${matchedBundleOffer.discountValue}%` : `${getCurrencySymbol(currency)}${matchedBundleOffer.discountValue}`}
                                </div>
                              )} */}
                              <div className="text-[9px] text-green-700 mt-1 italic">
                                💡 This free session has been saved to your account for future use
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Cashback Offer Indicator */}
                      {/* Only show in billing summary if cashback is actually applied */}
                      {matchedCashbackOffer && isCashbackApplied && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                                ✅ Cashback Applied: {matchedCashbackOffer.title}
                              </div>
                              <div className="text-[10px] text-blue-700 mt-1 font-semibold">
                                {getCurrencySymbol(currency)}{appliedCashbackAmount.toFixed(2)} will be added to wallet
                              </div>
                              <div className="text-[9px] text-blue-600 mt-1 italic">
                                💡 Cashback expires in {matchedCashbackOffer.cashbackExpiryDays || 365} days
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Doctor/Agent Discount (if applied) */}
                      {finalReceptionistDiscount > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">
                            {isDoctorDiscountApplied ? "Doctor" : "Agent"} Discount
                          </span>
                          <span className="font-semibold text-orange-600">
                            −{getCurrencySymbol(currency)} {finalReceptionistDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Total Amount (after discounts) */}
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium">Total Amount</span>
                          {parseFloat(formData.pendingUsed || "0") > 0 && (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-200 uppercase">
                              + Pending Amount Added
                            </span>
                          )}
                          {balances.pendingClaim > 0 && (
                            <span className="px-1.5 py-0.5 text-[8px] font-bold bg-purple-100 text-purple-700 rounded border border-purple-200 uppercase">
                              + Pending Claim Added
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-gray-900">{getCurrencySymbol(currency)} {parseFloat(formData.amount || "0").toFixed(2)}</span>
                      </div>

                      {/* Cashback Deduction (if applied) */}
                      {useCashback && availableCashback && availableCashback.amount > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-700 font-semibold">Cashback Deduction</span>
                          </div>
                          <span className="font-bold text-green-600">−{getCurrencySymbol(currency)} {Math.min(availableCashback.amount, parseFloat(formData.amount || "0")).toFixed(2)}</span>
                        </div>
                      )}

                      {/* Final Amount After Cashback */}
                      {useCashback && availableCashback && availableCashback.amount > 0 && (
                        <div className="flex items-center justify-between text-[12px] bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <span className="text-green-800 font-bold">Final Amount</span>
                          <span className="font-bold text-green-700 text-base">
                            {getCurrencySymbol(currency)} {Math.max(0, parseFloat(formData.amount || "0") - Math.min(availableCashback.amount, parseFloat(formData.amount || "0"))).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* Previous Pending Rolled In */}
                      {parseFloat(formData.pendingUsed || "0") > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">Previous Pending Rolled In</span>
                          <span className="font-semibold text-amber-600">+{getCurrencySymbol(currency)} {parseFloat(formData.pendingUsed || "0").toFixed(2)}</span>
                        </div>
                      )}

                      {/* Advance Balance Used */}
                      {parseFloat(formData.advanceUsed || "0") > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">Advance Balance Used</span>
                          <span className="font-semibold text-purple-600">−{getCurrencySymbol(currency)} {parseFloat(formData.advanceUsed || "0").toFixed(2)}</span>
                        </div>
                      )}

                      {/* Past Advance Used */}
                      {parseFloat(formData.pastAdvanceUsed || "0") > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">Past Advance Used</span>
                          <span className="font-semibold text-purple-600">−{getCurrencySymbol(currency)} {parseFloat(formData.pastAdvanceUsed || "0").toFixed(2)}</span>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Paid Amount */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-700 font-medium">Paid Amount</span>
                        <span className="font-bold text-emerald-600">{getCurrencySymbol(currency)} {parseFloat(formData.paid || "0").toFixed(2)}</span>
                      </div>

                      {/* Split Payment Breakdown */}
                      {useMultiplePayments && multiplePayments.length > 0 && (
                        <div className="pl-3 space-y-1 border-l-2 border-emerald-100 mt-1 mb-2">
                          {multiplePayments.map((payment, idx) => (
                            parseFloat(payment.amount || "0") > 0 && (
                              <div key={idx} className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                                <span>{payment.paymentMethod === 'BT' ? 'Bank Transfer (BT)' : payment.paymentMethod}</span>
                                <span>{getCurrencySymbol(currency)} {parseFloat(payment.amount || "0").toFixed(2)}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}

                      {/* Pending Amount */}
                      {parseFloat(formData.pending || "0") > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">Pending Amount</span>
                          <span className="font-semibold text-amber-600">{getCurrencySymbol(currency)} {parseFloat(formData.pending || "0").toFixed(2)}</span>
                        </div>
                      )}

                      {/* Advance Given */}
                      {parseFloat(formData.advance || "0") > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-600">Advance Given</span>
                          <span className="font-semibold text-purple-600">{getCurrencySymbol(currency)} {parseFloat(formData.advance || "0").toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
               
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                    <button type="button" onClick={onClose}
                      className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading}
                      className="px-4 py-2 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Creating..." : isAlreadyBilled ? "Create Additional Billing" : "Create Billing"}
                    </button>
                  </div>
                </div>

                  {/* ── RIGHT COLUMN: Membership + Active Packages + Payment History ── */}
                  <div className="space-y-4">
                  {/* Membership Card (Financial Summary-style) */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Membership</div>
                        <div className="text-[10px] text-gray-500">Patient membership plans</div>
                      </div>
                    </div>

                    {loadingMembershipUsage ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                        <span className="text-[10px] text-gray-500">Checking membership...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Memberships list */}
                        {patientDetails && (Array.isArray(patientDetails.memberships) ? patientDetails.memberships : []).filter((m: any) => {
                          return !patientDetails.membershipTransfers?.some((t: any) => t.type === "out" && String(t.membershipId) === String(m.membershipId));
                        }).length > 0 ? (
                          patientDetails.memberships.filter((m: any) => {
                            return !patientDetails.membershipTransfers?.some((t: any) => t.type === "out" && String(t.membershipId) === String(m.membershipId));
                          }).map((m: any, idx: number) => {
                            const membershipPlan = memberships.find((mem: any) => mem._id === m.membershipId);
                            const displayName = membershipPlan?.name || m.membershipName || m.membershipId;
                            const ml = monthsUntil(m.endDate);
                            const isExpired = m.endDate && new Date(m.endDate) < new Date();
                            return (
                              <div key={`${m.membershipId}-${idx}`} className={`rounded-lg border px-3 py-2 ${isExpired ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                                <div className="flex items-center justify-between">
                                  <div className={`text-xs font-semibold ${isExpired ? "text-red-800" : "text-emerald-800"}`}>{displayName}</div>
                                  {isExpired ? (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase tracking-tighter">Expired</span>
                                  ) : (
                                    typeof ml === "number" && ml >= 0 && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">{ml}m left</span>
                                    )
                                  )}
                                </div>
                                <div className={`text-[9px] mt-0.5 ${isExpired ? "text-red-600 font-medium italic" : "text-emerald-600"}`}>
                                  {m.startDate ? new Date(m.startDate).toLocaleDateString() : "–"} → {m.endDate ? new Date(m.endDate).toLocaleDateString() : "–"}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[10px] text-gray-400 py-1">No active memberships</div>
                        )}

                        {/* Active membership usage details */}
                        {membershipUsage && membershipUsage.hasMembership && !isMembershipTransferredOut() && (
                          <div className={`pt-2 mt-1 border-t border-gray-100 space-y-1.5 ${membershipUsage.isExpired ? "opacity-75" : ""}`}>
                            <div className="flex items-center justify-between">
                              <div className={`text-[10px] font-bold ${membershipUsage.isExpired ? "text-red-700" : "text-gray-700"}`}>{membershipUsage.membershipName}</div>
                              {membershipUsage.isExpired && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold uppercase tracking-tighter shadow-sm">Expired</span>
                              )}
                            </div>
                            {!membershipUsage.isExpired ? (
                              <>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-gray-600">Free Consultations</span>
                                  <span className={`font-semibold ${membershipUsage.remainingFreeConsultations > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                                    {membershipUsage.remainingFreeConsultations || 0} remaining
                                  </span>
                                </div>
                                {membershipUsage.totalFreeConsultations > 0 && (
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        membershipUsage.remainingFreeConsultations > 0 ? "bg-emerald-400" : "bg-amber-400"
                                      }`}
                                      style={{ width: `${Math.min(((membershipUsage.usedFreeConsultations || 0) / membershipUsage.totalFreeConsultations) * 100, 100)}%` }}
                                    />
                                  </div>
                                )}
                                {membershipUsage.discountPercentage > 0 && (
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-semibold text-blue-600">{membershipUsage.discountPercentage}%</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-[9px] text-red-600 italic font-medium">This membership is no longer active.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Available Free Sessions from Bundle Offers */}
                  {(loadingFreeSessions || availableFreeSessions.length > 0) && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-green-900">🎁 Available Free Sessions</div>
                          <div className="text-[10px] text-green-700">Earned from bundle offers - Ready to redeem!</div>
                        </div>
                      </div>

                      {loadingFreeSessions ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
                          <span className="text-[10px] text-gray-500">Loading free sessions...</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                        {availableFreeSessions.map((session: any, index: number) => (
                          <div key={index} className="bg-white rounded-lg p-2.5 border border-green-200">
                            <div className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-green-900 truncate">
                                  {session.offerName}
                                </div>
                                <div className="text-[10px] text-green-800 font-semibold mt-0.5">
                                  Free: {session.offerFreeSession.join(', ')}
                                </div>
                                <div className="text-[9px] text-green-600 mt-0.5">
                                  Earned: {session.invoicedDate ? new Date(session.invoicedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </div>
                                <div className="text-[9px] text-green-500 mt-0.5">
                                  Invoice: {session.invoiceNumber}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Active Packages (Financial Profile-style) */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Active Packages</div>
                        <div className="text-[10px] text-gray-500">Package session tracking</div>
                      </div>
                    </div>

                    {loadingActivePackageUsage ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
                        <span className="text-[10px] text-gray-500">Loading packages...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Combine regular packages and userPackages */}
                        {(() => {
                          const purchasedPackages = (patientDetails?.packages || []).filter((p: any) => {
                            return !patientDetails.packageTransfers?.some((t: any) => t.type === "out" && String(t.packageId) === String(p.packageId));
                          });
                         
                          // Add userPackages (approved packages from PatientRegistration.userPackages)
                          const approvedUserPackages = (patientDetails?.userPackages || []).filter(
                            (pkg: any) => pkg.approvalStatus === 'approved'
                          );
                         
                          const allPackages = [
                            ...purchasedPackages.map((p: any) => ({ ...p, isUserPackage: false })),
                            ...approvedUserPackages.map((p: any) => ({ ...p, isUserPackage: true }))
                          ];
                         
                          if (allPackages.length === 0) {
                            return <div className="text-[10px] text-gray-400 py-1">No active packages</div>;
                          }
                         
                          const usageMap = new Map();
                          activePackageUsage.forEach(u => usageMap.set(u.packageName, u));

                          return allPackages.map((pkg: any, pkgIndex: number) => {
                            let packageName: string;
                            let packageDef: any = null;
                            let treatments: any[] = [];
                            let totalSessions = 0;
                           
                            if (pkg.isUserPackage) {
                              // Handle userPackage
                              packageName = pkg.packageName;
                              treatments = pkg.treatments || [];
                              totalSessions = pkg.totalSessions || 0;
                            } else {
                              // Handle regular package
                              packageDef = packages.find(p => p._id === pkg.packageId);
                              packageName = packageDef?.name || pkg.packageId;
                              treatments = packageDef?.treatments || [];
                              totalSessions = packageDef?.treatments?.reduce((s: number, t: any) => s + (t.sessions || 0), 0) || 0;
                            }
                           
                            const usageData = usageMap.get(packageName);
                            const isExpanded = expandedPackages[packageName] || false;
                            const displayData = usageData || {
                              packageName,
                              treatments,
                              totalSessions,
                              billingHistory: []
                            };

                            const isExpired = pkg.endDate && new Date(pkg.endDate) < new Date();
                            const paymentStatus = pkg.paymentStatus || 'Unpaid';
                            const paidAmount = pkg.paidAmount || 0;

                            return (
                              <div key={`${pkg.packageId || pkg._id}-${pkgIndex}`} className={`border ${isExpired ? 'border-red-200 bg-red-50' : 'border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50'} rounded-xl overflow-hidden relative shadow-sm`}>
                                {isExpired && (
                                  <div className="absolute top-0 right-0 px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-tighter z-10 rounded-bl-lg shadow-sm">
                                    Expired
                                  </div>
                                )}
                                <button type="button"
                                  onClick={() => togglePackageExpansion(packageName)}
                                  className={`w-full px-3 py-2 flex items-center justify-between hover:bg-teal-100/50 transition-colors ${isExpired ? 'opacity-75' : ''}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full ${isExpired ? 'bg-red-500' : 'bg-teal-500'} flex items-center justify-center`}>
                                      <span className="text-[8px] font-bold text-white">#{pkgIndex + 1}</span>
                                    </div>
                                    <div className="text-left">
                                      <div className={`text-[10px] font-bold ${isExpired ? 'text-red-900 line-through' : 'text-gray-900'} flex items-center gap-1.5`}>
                                        {packageName}
                                        {!isExpired && paymentStatus === 'Full' && (
                                          <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[7px] font-black uppercase tracking-tighter shadow-sm">Full Paid</span>
                                        )}
                                        {!isExpired && paymentStatus === 'Partial' && (
                                          <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[7px] font-black uppercase tracking-tighter shadow-sm">Partial (₹{paidAmount})</span>
                                        )}
                                      </div>
                                      <div className="text-[8px] text-gray-500 flex items-center gap-2">
                                        <span>{displayData.treatments?.length || 0} treatments · {displayData.totalSessions || 0} sessions</span>
                                        {(pkg.startDate || pkg.endDate) && (
                                          <>
                                            <span className="text-gray-300">|</span>
                                            <span className={`flex items-center gap-0.5 ${isExpired ? 'text-red-600 font-bold' : ''}`}>
                                              <Clock className="w-2 h-2" />
                                              {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString() : '–'} → {pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : '–'}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${isExpired ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>{displayData.billingHistory?.length || 0} bills</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="border-t border-teal-200 p-2.5 space-y-2">
                                    {displayData.treatments && displayData.treatments.length > 0 ? (
                                      displayData.treatments.map((treatment: any, tIndex: number) => {
                                        const treatmentUsage = usageData?.treatments?.find((t: any) => t.treatmentSlug === treatment.treatmentSlug);
                                        const maxSessions = treatment.sessions || treatment.maxSessions || 0;
                                        const totalUsedSessions = treatmentUsage?.totalUsedSessions || 0;
                                        const remainingSessions = maxSessions - totalUsedSessions;
                                        const isFullyUsed = maxSessions > 0 && totalUsedSessions >= maxSessions;
                                        const usagePercent = maxSessions > 0 ? Math.round((totalUsedSessions / maxSessions) * 100) : 0;

                                        return (
                                          <div key={treatment.treatmentSlug || tIndex}
                                            className={`rounded-lg border p-2 ${
                                              isFullyUsed ? "bg-green-50 border-green-200" : remainingSessions > 0 ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="font-medium text-gray-900 text-[10px]">{treatment.treatmentName}</span>
                                              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                                                isFullyUsed ? "bg-green-100 text-green-700" : remainingSessions > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                                              }`}>{isFullyUsed ? "Complete" : remainingSessions > 0 ? `${remainingSessions} left` : "0 left"}</span>
                                            </div>
                                            <div className="flex justify-between text-[9px] mb-0.5">
                                              <span className="text-gray-500">Progress</span>
                                              <span className="font-medium text-gray-800">{totalUsedSessions}/{maxSessions}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                              <div className={`h-full rounded-full ${
                                                isFullyUsed ? "bg-green-500" : remainingSessions > 0 ? "bg-amber-500" : "bg-gray-400"
                                              }`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="text-[10px] text-gray-400 text-center py-1">No treatments found</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Payment History - Last 3 invoices */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Payment History</div>
                        <div className="text-[10px] text-gray-500">Transaction timeline</div>
                      </div>
                    </div>

                    {loadingHistory ? (
                      <div className="flex items-center gap-2 py-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span className="text-[10px] text-gray-500">Loading history...</span>
                      </div>
                    ) : last3Billings.length === 0 ? (
                      <div className="text-[10px] text-gray-400 py-2">No payment history found</div>
                    ) : (
                      <div className="space-y-2">
                        {last3Billings.map((billing) => (
                          <div key={billing._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-900">{getCurrencySymbol(currency)} {billing.paid?.toFixed(2) || "0.00"}</div>
                                <div className="text-[10px] text-gray-500">
                                  {billing.paymentMethod || (billing.multiplePayments?.length > 0 ? billing.multiplePayments.map((mp: any) => mp.paymentMethod).join(" + ") : "–")}
                                  {billing.invoicedDate && (
                                    <span className="ml-2">{new Date(billing.invoicedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[9px] text-gray-400">{billing.invoiceNumber}</span>
                            </div>
                          </div>
                        ))}
                        {last3Billings.length > 0 && (
                          <button
                            onClick={() => {
                              const router = window.location.href.includes('/clinic/')
                                ? (window as any).router || { push: (url: string) => window.location.href = url }
                                : null;
                              if (router) {
                                router.push(`/clinic/billing-history?patientId=${appointment.patientId}`);
                              } else {
                                window.location.href = `/clinic/billing-history?patientId=${appointment.patientId}`;
                              }
                            }}
                            className="w-full mt-2 py-2 text-[10px] font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200"
                          >
                            View All Invoices →
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Communication Log - Consent Form Status */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">Communication Log</div>
                        <div className="text-[10px] text-gray-500">Consent form status</div>
                      </div>
                    </div>

                    {loadingConsentStatus ? (
                      <div className="flex items-center gap-2 py-3">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span className="text-[10px] text-gray-500">Loading status...</span>
                      </div>
                    ) : consentStatuses.length === 0 ? (
                      <div className="text-[10px] text-gray-400 py-2">No consent forms sent yet</div>
                    ) : (
                      <div className="space-y-2">
                        {consentStatuses.map((consent: any, index: number) => {
                          // Generate consent form URL
                          const patientInfo = {
                            firstName: appointment?.patientName?.split(" ")[0] || "",
                            lastName: appointment?.patientName?.split(" ").slice(1).join(" ") || "",
                            mobileNumber: appointment?.patientNumber || "",
                            email: appointment?.patientEmail || "",
                            appointmentId: appointment?._id,
                          };
                          const encodedPatientData = encodeURIComponent(JSON.stringify(patientInfo));
                          const consentUrl = `https://zeva360.com/consent-form/${consent.consentFormId}?patient=${encodedPatientData}`;
                         
                          return (
                            <div
                              key={consent._id || index}
                              className={`flex items-center justify-between p-2.5 rounded-xl border ${
                                consent.status === "signed"
                                  ? "border-green-200 bg-green-50"
                                  : "border-blue-200 bg-blue-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {consent.status === "signed" ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Send className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-gray-900 truncate">
                                    {consent.consentFormName}
                                  </div>
                                  <div className="text-[9px] text-gray-500">
                                    <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                                      consent.status === "signed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}>
                                      {consent.status === "signed" ? "SIGNED" : "SENT"}
                                    </span>
                                    <span className="ml-1">{consent.date}</span>
                                  </div>
                                </div>
                              </div>
                              <a
                                href={consentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] text-blue-600 hover:text-blue-800 underline flex-shrink-0"
                              >
                                Open
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Smart Recommendations */}
                  {(smartDepartments.length > 0 || loadingSmartRec) && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">Smart Recommendations</div>
                          <div className="text-[10px] text-gray-500">AI-powered treatment suggestions</div>
                        </div>
                      </div>

                      {loadingSmartRec ? (
                        <div className="flex items-center gap-2 py-3">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                          <span className="text-[10px] text-gray-500">Loading recommendations...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {smartDepartments.map((dept) => (
                            <div key={dept._id}>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{dept.name}</p>
                              <div className="grid grid-cols-3 gap-2">
                                {dept.services.map((svc) => {
                                  // Services use serviceSlug or _id as identifier - match both
                                  const serviceIdentifier = svc.serviceSlug || svc._id;
                                  const isAdded = selectedTreatments.some((t) =>
                                    t.treatmentSlug === serviceIdentifier ||
                                    t.treatmentSlug === svc._id ||
                                    (t.treatmentName && svc.name && t.treatmentName.toLowerCase() === svc.name.toLowerCase())
                                  );
                                  return (
                                    <div
                                      key={svc._id}
                                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 shadow-sm transition-all ${
                                        isAdded ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"
                                      }`}
                                    >
                                      <div className="text-center w-full">
                                        <span className="text-[10px] font-semibold text-gray-800 line-clamp-2 leading-tight min-h-[20px]">{svc.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-blue-600 font-medium whitespace-nowrap">
                                          {svc.clinicPrice != null ? `${getCurrencySymbol(currency)} ${svc.clinicPrice}` : `${getCurrencySymbol(currency)} ${svc.price}`}
                                        </span>
                                        {!isAdded && (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const price = svc.clinicPrice != null ? svc.clinicPrice : svc.price;
                                              // Match how services are loaded: use serviceSlug if available, otherwise _id
                                              const treatmentSlug = svc.serviceSlug || svc._id;
                                             
                                              // 1. Ensure Treatment service is selected
                                              setSelectedService("Treatment");

                                              // 2. Find matching treatment from treatments array
                                              const matchingTreatment = treatments.find(
                                                (t) => t.slug === treatmentSlug ||
                                                (t.name && t.name.toLowerCase() === svc.name.toLowerCase())
                                              );
                                             
                                              if (matchingTreatment) {
                                                // 3. Add to selected treatments with notification
                                                handleTreatmentToggle(matchingTreatment, true);
                                              } else {
                                                // Create treatment object manually if not found in treatments array
                                                const newTreatment: any = {
                                                  name: svc.name,
                                                  slug: treatmentSlug,
                                                  price: price,
                                                };
                                                handleTreatmentToggle(newTreatment, true);
                                              }
                                             
                                              // 4. Save to appointment via API
                                              if (appointment?._id && appointment?.patientId) {
                                                try {
                                                  const headers = getAuthHeaders();
                                                  await axios.patch(
                                                    `/api/clinic/appointment-services/${appointment._id}`,
                                                    { serviceIds: [svc._id] },
                                                    { headers }
                                                  );
                                                } catch (error) {
                                                  console.error("Error saving smart recommendation:", error);
                                                }
                                              }
                                            }}
                                            className="text-[8px] px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                                          >
                                            + Add
                                          </button>
                                        )}
                                        {isAdded && (
                                          <span className="text-[8px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-semibold whitespace-nowrap">
                                            ✓ Added
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentBillingModal;
