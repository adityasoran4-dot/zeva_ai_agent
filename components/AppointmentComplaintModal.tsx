"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { getCurrencySymbol } from "@/lib/currencyHelper";
import {
  X,
  Plus,
  Trash2,
  Pencil,
  Check,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Package,
  FileText,
  Hash,
  Calendar,
  Scale,
  Stethoscope,
  User,
  Clock,
  Activity,
  ClipboardList,
  Eye,
  RefreshCw,
  Upload,
  Send,
  TrendingUp,
  Pill,
   Edit2,
  NotebookPen,
  CheckCircle,
  XCircle,
  MessageCircle,
  Search,
  Loader2,
  Phone,
  Venus,
  Mars,
  AlertCircle,
  Wrench,
  Camera,
} from "lucide-react";
import { jsPDF } from "jspdf";
import useStockItems from "@/hooks/useStockItems";
import useUoms from "@/hooks/useUoms";
import { getTokenByPath, handleUpload } from "@/lib/helper";
import useAllocatedItems from "@/hooks/useAllocatedItems";
import AddStockTransferRequestModal from "@/pages/clinic/stocks/stock-transfer/stock-transfer-requests/_components/AddStockTransferRequestModal";

interface AppointmentLite {
  _id: string;
  patientName: string;
  patientId: string;
  emrNumber?: string;
  gender?: string;
  doctorName: string;
  startDate?: string;
  fromTime?: string;
  toTime?: string;
  status?: string;
}

interface AppointmentDetails {
  _id?: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  emrNumber?: string;
  gender?: string;
  email?: string;
  mobileNumber?: string;
  doctorId?: string;
  doctorName: string;
  doctorEmail?: string;
  roomId?: string;
  startDate?: string;
  fromTime?: string;
  toTime?: string;
  status?: string;
  serviceIds?: string[];
  serviceNames?: string[];
}

interface AppointmentReportSummary {
  reportId?: string;
  appointmentId: string;
  temperatureCelsius: number;
  pulseBpm: number;
  systolicBp: number;
  diastolicBp: number;
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  respiratoryRate?: number;
  spo2Percent?: number;
  hipCircumference?: number;
  headCircumference?: number;
  bmi?: number;
  sugar?: string;
  urinalysis?: string;
  otherDetails?: string;
  updatedAt: string;
  createdAt: string;
  doctorName?: string;
  doctorEmail?: string;
  startDate?: string;
  fromTime?: string;
  toTime?: string;
}

interface SingleReport {
  reportId?: string;
  temperatureCelsius: number;
  pulseBpm: number;
  systolicBp: number;
  diastolicBp: number;
  heightCm?: number;
  weightKg?: number;
  waistCm?: number;
  respiratoryRate?: number;
  spo2Percent?: number;
  hipCircumference?: number;
  headCircumference?: number;
  bmi?: number;
  sugar?: string;
  urinalysis?: string;
  otherDetails?: string;
  updatedAt?: string;
}

interface PreviousComplaint {
  _id: string;
  complaints: string;
  createdAt: string;
  doctorId:
    | {
        _id?: string;
        name?: string;
        email?: string;
      }
    | string
    | null;
  items?: Array<{
    itemId?: string;
    code?: string;
    name: string;
    description?: string;
    quantity: number;
    uom?: string;
    totalAmount?: number;
  }>;
  beforeImage?: string;
  afterImage?: string;
}

interface AppointmentComplaintModalProps {
  isOpen: boolean;
  appointment: AppointmentLite | null;
  onClose: () => void;
  getAuthHeaders: () => Record<string, string>;
  onSuccess?: () => void;
}

const AppointmentComplaintModal: React.FC<AppointmentComplaintModalProps> = ({
  isOpen,
  appointment,
  onClose,
  getAuthHeaders,
  onSuccess,
}) => {
  type StockRow = {
    itemId?: string;
    code?: string;
    name: string;
    description?: string;
    quantity: number;
    uom?: string;
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currency, setCurrency] = useState('INR');
  const [details, setDetails] = useState<AppointmentDetails | null>(null);
  const [report, setReport] = useState<SingleReport | null>(null);
  const [_patientReports, setPatientReports] = useState<
    AppointmentReportSummary[]
  >([]);
  const [complaints, setComplaints] = useState<string>("");
  const [beforeImage, setBeforeImage] = useState<string>("");
  const [afterImage, setAfterImage] = useState<string>("");
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previousComplaints, setPreviousComplaints] = useState<
    PreviousComplaint[]
  >([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [_showPreviousReports, setShowPreviousReports] = useState(false);

  // Patient EMR stats â€” total spend from Billing, visits from Appointment
  interface PatientEMRStats {
    totalSpend: number; totalBilled: number; totalPending: number;
    totalVisits: number; billingCount: number;
    recentBillings: Array<{ service: string; label: string; amount: number; paid: number; pending: number; date: string }>;
  }
  const [patientStats, setPatientStats] = useState<PatientEMRStats | null>(null);
  const [loadingPatientStats, setLoadingPatientStats] = useState(false);
  const [patientBalance, setPatientBalance] = useState({ pendingBalance: 0, advanceBalance: 0, pendingClaim: 0 });
  // Ref to scroll to Previous Complaints when History is clicked
  const previousComplaintsRef = useRef<HTMLDivElement | null>(null);
  const [expandedComplaints, setExpandedComplaints] = useState<
    Record<string, boolean>
  >({});
  const [editingComplaint, setEditingComplaint] =
    useState<PreviousComplaint | null>(null);
  const [deletedComplaint, setDeletedComplaint] =
    useState<PreviousComplaint | null>(null);
  const [selectedComplaint, setSelectedComplaint] =
    useState<PreviousComplaint | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [items, setItems] = useState<StockRow[]>([]);
  const [currentItem, setCurrentItem] = useState<StockRow>({
    itemId: "",
    code: "",
    name: "",
    description: "",
    quantity: 1,
    uom: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<StockRow | null>(null);
  const [isOpenDeleteComplaintModal, setIsOpenDeleteComplaintModal] =
    useState<boolean>(false);
  const [isOpenViewComplaintModal, setIsOpenViewComplaintModal] =
    useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [isAllocatedDropdownOpen, setIsAllocatedDropdownOpen] =
    useState<boolean>(false);
  const [allocatedSearch, setAllocatedSearch] = useState<string>("");
  const allocatedDropdownRef = useRef<HTMLDivElement | null>(null);

  // stock transfer modal
  const [isOpenStockTransferModal, setIsOpenStockTransferModal] =
    useState<boolean>(false);

  // consent form
  interface ConsentFormOption { _id: string; formName: string; }
  const [consentForms, setConsentForms] = useState<ConsentFormOption[]>([]);
  const [selectedConsentId, setSelectedConsentId] = useState<string>("");
  const [sendingConsent, setSendingConsent] = useState<boolean>(false);
  const [consentSent, setConsentSent] = useState<boolean>(false);
 
  // Consent status tracking
  interface ConsentStatusData {
    status: "not-sent" | "sent" | "viewed" | "signed";
    sentVia?: "WhatsApp" | "SMS";
    sentAt?: string;
    viewedAt?: string;
    signedAt?: string;
  }
  const [consentStatus, setConsentStatus] = useState<ConsentStatusData | null>(null);
  const [sendingVia, setSendingVia] = useState<"WhatsApp" | "SMS" | null>(null);

  // Tab state
  type TabType = "complaint" | "progress" | "prescription";
  const [activeTab, setActiveTab] = useState<TabType>("complaint");

  // Progress tab state
  interface ProgressNoteEntry {
    _id: string;
    note: string;
    noteDate: string;
    doctorId?: { _id?: string; name?: string; email?: string } | string | null;
    createdAt: string;
  }
  const [progressNotes, setProgressNotes] = useState<ProgressNoteEntry[]>([]);
  const [loadingProgressNotes, setLoadingProgressNotes] = useState(false);
  const [addingNewEntry, setAddingNewEntry] = useState(false);
  const [newEntryText, setNewEntryText] = useState<string>("");
  const [newEntryDate, setNewEntryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [savingProgress, setSavingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string>("");

  // Prescription tab state
  type MedicineLine = { id: string; medicineName: string; dosage: string; duration: string; notes: string };
  const emptyMedicine = (): MedicineLine => ({ id: Date.now().toString() + Math.random(), medicineName: "", dosage: "", duration: "", notes: "" });
  const [medicines, setMedicines] = useState<MedicineLine[]>([emptyMedicine()]);
  const [aftercareInstructions, setAftercareInstructions] = useState<string>("");
  const [includeInPdf, setIncludeInPdf] = useState<boolean>(true);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState<string>("");
  const [prescriptionSaved, setPrescriptionSaved] = useState<boolean>(false);
  interface PrescriptionHistoryEntry {
    _id: string;
    medicines: Array<{ _id?: string; medicineName: string; dosage?: string; duration?: string; notes?: string }>;
    aftercareInstructions?: string;
    includeInPdf?: boolean;
    doctorId?: { _id?: string; name?: string; email?: string } | string | null;
    createdAt: string;
    updatedAt: string;
  }
  const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionHistoryEntry[]>([]);
  const [loadingPrescriptionHistory, setLoadingPrescriptionHistory] = useState(false);
  const [expandedPrescription, setExpandedPrescription] = useState<Record<string, boolean>>({});

  // Smart Recommendations state
  interface SmartService { _id: string; name: string; price: number; clinicPrice?: number | null; durationMinutes?: number; departmentId?: string; }
  interface SmartDepartment { _id: string; name: string; services: SmartService[]; }
  const [smartDepartments, setSmartDepartments] = useState<SmartDepartment[]>([]);
  const [loadingSmartRec, setLoadingSmartRec] = useState(false);

  // Next Session Booking state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [nextSessionDate, setNextSessionDate] = useState<string>(todayStr);
  const [nextSessionTime, setNextSessionTime] = useState<string>("09:00");
  const [bookingNextSession, setBookingNextSession] = useState(false);
  const [nextSessionBooked, setNextSessionBooked] = useState(false);
  const [nextSessionError, setNextSessionError] = useState<string>("");
  // Rooms state
  interface Room { _id: string; name: string; }
  const [rooms, setRooms] = useState<Room[]>([]);
  const [nextSessionRoom, setNextSessionRoom] = useState<string>("");
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Upcoming appointments state
  interface UpcomingAppointment { _id: string; startDate: string; fromTime: string; toTime: string; status: string; followType: string; }
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  // Filter upcoming appointments to only show future ones (date and time)
  const filteredUpcomingAppointments = useMemo(() => {
    if (!upcomingAppointments) return [];
   
    const now = new Date();
    // Current date in YYYY-MM-DD format (local time)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
   
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return upcomingAppointments
      .filter((appt) => {
        // appt.startDate might be ISO string or YYYY-MM-DD
        const d = new Date(appt.startDate);
        const apptYear = d.getFullYear();
        const apptMonth = String(d.getMonth() + 1).padStart(2, "0");
        const apptDay = String(d.getDate()).padStart(2, "0");
        const apptDateStr = `${apptYear}-${apptMonth}-${apptDay}`;
       
        if (apptDateStr > todayStr) return true;
        if (apptDateStr === todayStr) {
          // Compare fromTime (HH:mm) with currentTimeStr (HH:mm)
          return appt.fromTime >= currentTimeStr;
        }
        return false;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [upcomingAppointments]);

  // Consent Form Status state
  interface ConsentFormStatus {
    _id: string;
    consentFormId: string;
    consentFormName: string;
    description?: string;
    patientName: string;
    date: string;
    hasSignature: boolean;
    status: "pending" | "signed" | "sent";
    signedAt?: string;
  }
  const [consentStatuses, setConsentStatuses] = useState<ConsentFormStatus[]>([]);
  const [loadingConsentStatus, setLoadingConsentStatus] = useState(false);

  // Clinical Checklist state
  const CHECKLIST_ITEMS = ["Consent Signed", "Allergy Checked", "Photos Uploaded", "Notes Completed"] as const;
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    "Consent Signed": false,
    "Allergy Checked": false,
    "Photos Uploaded": false,
    "Notes Completed": false,
  });
  const [checklistError, setChecklistError] = useState<string>("");

  // Add Service state
  interface ClinicService { _id: string; name: string; price: number; clinicPrice?: number | null; durationMinutes?: number; }
  const [allServices, setAllServices] = useState<ClinicService[]>([]);
  const [showAddServiceDropdown, setShowAddServiceDropdown] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<ClinicService[]>([]);
  const [savingServices, setSavingServices] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false);
  const [servicesError, setServicesError] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);

  // Custom Service Add state
  const [showAddCustomService, setShowAddCustomService] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState("");
  const [customServiceClinicPrice, setCustomServiceClinicPrice] = useState("");
  const [customServiceDuration, setCustomServiceDuration] = useState("");
  const [customServiceDepartment, setCustomServiceDepartment] = useState("");
  const [addingCustomService, setAddingCustomService] = useState(false);

  // Create Package state
  const [showCreatePackage, setShowCreatePackage] = useState(false);
  const [createdPackage, setCreatedPackage] = useState<any>(null);
  const [pkgModalName, setPkgModalName] = useState("");
  const [pkgModalPrice, setPkgModalPrice] = useState("");
  const [pkgModalValidityInMonths, setPkgModalValidityInMonths] = useState("");
  const [pkgModalStartDate, setPkgModalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [pkgModalEndDate, setPkgModalEndDate] = useState("");
  const [pkgTreatments, setPkgTreatments] = useState<Array<{ name: string; slug: string; type?: string; mainTreatment?: string | null }>>([]);
  const [pkgSelectedTreatments, setPkgSelectedTreatments] = useState<Array<{ treatmentName: string; treatmentSlug: string; sessions: number; allocatedPrice: number }>>([]);
  const [pkgTreatmentDropdownOpen, setPkgTreatmentDropdownOpen] = useState(false);
  const [pkgTreatmentSearch, setPkgTreatmentSearch] = useState("");
  const [pkgSubmitting, setPkgSubmitting] = useState(false);
  const [pkgError, setPkgError] = useState("");
  const [pkgSuccess, setPkgSuccess] = useState("");
  const [addingPackageToPatient, setAddingPackageToPatient] = useState(false);
  const [showVitalsWarning, setShowVitalsWarning] = useState(false);
  const [addingRecService, setAddingRecService] = useState<Record<string, boolean>>({});
  // Track added services per patient (key format: "patientId_serviceId")
  const [addedRecServices, setAddedRecServices] = useState<Record<string, boolean>>({});
  // Track recently added services for visual highlighting (with timestamp for animation)
  const [recentlyAddedServices, setRecentlyAddedServices] = useState<Record<string, number>>({});

  // Auto-clear recently added status after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRecentlyAddedServices((prev) => {
        const updated: Record<string, number> = {};
        Object.keys(prev).forEach((key) => {
          // Keep only services added within the last 3 seconds
          if (now - prev[key] < 3000) {
            updated[key] = prev[key];
          }
        });
        const prevKeys = Object.keys(prev);
        const updatedKeys = Object.keys(updated);
        if (prevKeys.length === updatedKeys.length) {
          const unchanged = prevKeys.every((key) => prev[key] === updated[key]);
          if (unchanged) return prev;
        }
        return updated;
      });
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, []);

  // Auto-calculate end date for package creation
  useEffect(() => {
    if (pkgModalStartDate && pkgModalValidityInMonths && !isNaN(parseInt(pkgModalValidityInMonths))) {
      const start = new Date(pkgModalStartDate);
      const months = parseInt(pkgModalValidityInMonths);
      const end = new Date(start);
      end.setMonth(start.getMonth() + months);
      setPkgModalEndDate(end.toISOString().split('T')[0]);
    } else {
      setPkgModalEndDate("");
    }
  }, [pkgModalStartDate, pkgModalValidityInMonths]);

  // Fetch clinic currency preference
  useEffect(() => {
    const fetchClinicCurrency = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers?.Authorization) return;
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

   // SEND CONSENT FORM MSG ON WHATSAPP
  const [sendMsgLoading, setSendMsgLoading] = useState<boolean>(false);

  // Doctor discount state
  const [doctorDiscount, setDoctorDiscount] = useState<{
    discountType: string;
    discountAmount: number;
  } | null>(null);
  const [isDoctorDiscountApplied, setIsDoctorDiscountApplied] =
    useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        isAllocatedDropdownOpen &&
        allocatedDropdownRef.current &&
        target &&
        !allocatedDropdownRef.current.contains(target)
      ) {
        setIsAllocatedDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isAllocatedDropdownOpen]);

  // Fetch consent statuses function - defined outside useEffect for access throughout component
  const fetchConsentStatuses = async (patientId: string) => {
    setLoadingConsentStatus(true);
    try {
      console.log("Fetching consent statuses for patient:", patientId);
      const headers = getAuthHeaders();
     
      const [signaturesResponse, logsResponse] = await Promise.all([
        axios.get("/api/clinic/consent-status", {
          headers,
          params: { patientId },
        }),
        axios.get("/api/clinic/consent-log", {
          headers,
          params: { patientId },
        }),
      ]);
     
      if (signaturesResponse.data?.success) {
        // Update consent statuses with the results
        setConsentStatuses(signaturesResponse.data.consentStatuses || []);
      }
      if (logsResponse.data?.success) {
        // Also merge with consent logs if needed
        const signatures = signaturesResponse.data?.consentStatuses || [];
        const logs = logsResponse.data?.consentLogs || [];
       
        // Merge logs and signatures
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
       
        signatures.forEach((sig: any) => {
          logMap.set(sig.consentFormId, {
            ...sig,
            status: "signed",
          });
        });
       
        setConsentStatuses(Array.from(logMap.values()));
      }
    } catch (err) {
      console.error("Error fetching consent statuses:", err);
    } finally {
      setLoadingConsentStatus(false);
    }
  };

  // fetch allocated stock items
  const {
    allocatedItems,
    loading: fetchAllocatedItemsLoading,
    fetchAllocatedItems,
  } = useAllocatedItems({
    // @ts-ignore
    userId: details?.doctorId || "",
    search: allocatedSearch,
  });

  useEffect(() => {
    if (!isOpen || !appointment) {
      setDetails(null);
      setReport(null);
      setPatientReports([]);
      setComplaints("");
      setBeforeImage("");
      setAfterImage("");
      setUploadingBefore(false);
      setUploadingAfter(false);
      setError("");
      setLoading(false);
      setSaving(false);
      setPreviousComplaints([]);
      setLoadingComplaints(false);
      setShowPreviousReports(false);
      setExpandedComplaints({});
      setPatientStats(null);
      setLoadingPatientStats(false);
      setPatientBalance({ pendingBalance: 0, advanceBalance: 0, pendingClaim: 0 });
      setItems([]);
      setCurrentItem({
        itemId: "",
        code: "",
        name: "",
        description: "",
        quantity: 1,
        uom: "",
      });
      setEditIndex(null);
      setEditingItem(null);
      setSelectedConsentId("");
      setConsentSent(false);
      setActiveTab("complaint");
      setProgressNotes([]);
      setAddingNewEntry(false);
      setNewEntryText("");
      setNewEntryDate(new Date().toISOString().slice(0, 10));
      setProgressError("");
      setMedicines([emptyMedicine()]);
      setAftercareInstructions("");
      setIncludeInPdf(true);
      setPrescriptionError("");
      setPrescriptionSaved(false);
      setPrescriptionHistory([]);
      setLoadingPrescriptionHistory(false);
      setExpandedPrescription({});
      setSmartDepartments([]);
      setLoadingSmartRec(false);
      setNextSessionDate(new Date().toISOString().slice(0, 10));
      setNextSessionTime("09:00");
      setNextSessionBooked(false);
      setNextSessionError("");
      setRooms([]);
      setNextSessionRoom("");
      setUpcomingAppointments([]);
      setLoadingUpcoming(false);
      setConsentStatus(null);
      setConsentForms([]);
      setDoctorDiscount(null);
      setIsDoctorDiscountApplied(false);
      setSmartDepartments([]);
      setAddedRecServices({});
      setChecklist({
        "Consent Signed": false,
        "Allergy Checked": false,
        "Photos Uploaded": false,
        "Notes Completed": false,
      });
      setChecklistError("");
      setAllServices([]);
      setShowAddServiceDropdown(false);
      setServiceSearchQuery("");
      setSelectedServices([]);
      setSavingServices(false);
      setServicesSaved(false);
      setServicesError("");
      setLoadingServices(false);
      setShowAddCustomService(false);
      setDepartments([]);
      setCustomServiceName("");
      setCustomServicePrice("");
      setCustomServiceClinicPrice("");
      setCustomServiceDuration("");
      setCustomServiceDepartment("");
      setShowCreatePackage(false);
      setCreatedPackage(null);
      setPkgModalName("");
      setPkgModalPrice("");
      setPkgModalValidityInMonths("");
      setPkgModalStartDate(new Date().toISOString().split('T')[0]);
      setPkgModalEndDate("");
      setPkgTreatments([]);
      setPkgSelectedTreatments([]);
      setPkgTreatmentDropdownOpen(false);
      // Reset modal-related states
      setSelectedComplaint(null);
      setDeletedComplaint(null);
      setEditingComplaint(null);
      setIsEditModalOpen(false);
      setIsOpenDeleteComplaintModal(false);
      setIsOpenViewComplaintModal(false);
      return;
    }

    // When opening modal with a new appointment/patient, reset patient-specific data first
    setDetails(null);
    setReport(null);
    setPatientReports([]);
    setComplaints("");
    setBeforeImage("");
    setAfterImage("");
    setPreviousComplaints([]);
    setPatientStats(null);
    setPatientBalance({ pendingBalance: 0, advanceBalance: 0, pendingClaim: 0 });
    setProgressNotes([]);
    setPrescriptionHistory([]);
    setUpcomingAppointments([]);
    setConsentStatus(null);
    setItems([]);
    setMedicines([emptyMedicine()]);
    setAftercareInstructions("");
    setPrescriptionSaved(false);
    setPrescriptionError("");
    setProgressError("");
    setExpandedComplaints({});
    setExpandedPrescription({});
    setActiveTab("complaint");
    setDoctorDiscount(null);
    setIsDoctorDiscountApplied(false);
    setSmartDepartments([]);
    setAddedRecServices({});
    setChecklist({
      "Consent Signed": false,
      "Allergy Checked": false,
      "Photos Uploaded": false,
      "Notes Completed": false,
    });
    setChecklistError("");
    setAllServices([]);
    setShowAddServiceDropdown(false);
    setServiceSearchQuery("");
    setSelectedServices([]);
    setSavingServices(false);
    setServicesSaved(false);
    setServicesError("");
    setLoadingServices(false);
    setShowAddCustomService(false);
    setDepartments([]);
    setCustomServiceName("");
    setCustomServicePrice("");
    setCustomServiceClinicPrice("");
    setCustomServiceDuration("");
    setCustomServiceDepartment("");
    setShowCreatePackage(false);
    setCreatedPackage(null);
    setPkgModalName("");
    setPkgModalPrice("");
    setPkgModalValidityInMonths("");
    setPkgModalStartDate(new Date().toISOString().split('T')[0]);
    setPkgModalEndDate("");
    setPkgTreatments([]);
    setPkgSelectedTreatments([]);
    setPkgTreatmentDropdownOpen(false);
    // Reset modal-related states
    setSelectedComplaint(null);
    setDeletedComplaint(null);
    setEditingComplaint(null);
    setIsEditModalOpen(false);
    setIsOpenDeleteComplaintModal(false);
    setIsOpenViewComplaintModal(false);

    // Fetch consent forms for dropdown
    const fetchConsentForms = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get("/api/clinic/consent", { headers });
        if (res.data?.success) setConsentForms(res.data.consents || []);
      } catch {
        // silently ignore
      }
    };
    fetchConsentForms();
    fetchRooms();

    const fetchDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const headers = getAuthHeaders();
        const response = await axios.get("/api/clinic/appointment-reports", {
          headers,
          params: { appointmentId: appointment._id },
        });

        if (!response.data?.success) {
          setError(
            response.data?.message || "Failed to load appointment report",
          );
          return;
        }

        setDetails(response.data.appointment || null);

        if (response.data.report) {
          const r = response.data.report;
          setReport({
            reportId: r.reportId,
            temperatureCelsius: r.temperatureCelsius,
            pulseBpm: r.pulseBpm,
            systolicBp: r.systolicBp,
            diastolicBp: r.diastolicBp,
            heightCm: r.heightCm,
            weightKg: r.weightKg,
            waistCm: r.waistCm,
            respiratoryRate: r.respiratoryRate,
            spo2Percent: r.spo2Percent,
            hipCircumference: r.hipCircumference,
            headCircumference: r.headCircumference,
            bmi: r.bmi,
            sugar: r.sugar,
            urinalysis: r.urinalysis,
            otherDetails: r.otherDetails,
            updatedAt: r.updatedAt,
          });
          setComplaints(r.otherDetails || "");
        } else {
          setReport(null);
          setComplaints("");
          // Show vitals warning immediately when modal loads and no report exists
          setShowVitalsWarning(true);
        }

        setPatientReports(
          Array.isArray(response.data.patientReports)
            ? response.data.patientReports
            : [],
        );

        // Fetch previous complaints + billing/visit stats
        if (response.data.appointment?.patientId) {
          console.log("Appointment found, fetching related data:", response.data.appointment);
          fetchPreviousComplaints(response.data.appointment.patientId);
          fetchPatientStats(response.data.appointment.patientId);
          fetchPatientBalance(response.data.appointment.patientId);
          fetchUpcomingAppointments(response.data.appointment.patientId);
         
          // Fetch consent form statuses
          fetchConsentStatuses(response.data.appointment.patientId);
        } else {
          console.log("No patient ID in appointment data");
        }

        // Fetch smart recommendations based on doctor's departments
        if (response.data.appointment?.doctorId) {
          const docId = typeof response.data.appointment.doctorId === 'object'
            ? response.data.appointment.doctorId._id
            : response.data.appointment.doctorId;
         
          if (docId) {
            fetchSmartRecommendations(docId, headers);
            fetchDoctorDiscount(docId, headers);
          }
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Failed to load appointment report",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, appointment, getAuthHeaders]);

  // Fetch doctor departments + services for smart recommendations
  const fetchSmartRecommendations = async (doctorStaffId: string, headers: Record<string, string>) => {
    setLoadingSmartRec(true);
    try {
      const deptRes = await axios.get("/api/clinic/doctor-departments", {
        headers,
        params: { doctorStaffId },
      });
      if (!deptRes.data?.success) { setLoadingSmartRec(false); return; }
      const departments: { _id: string; name: string; clinicDepartmentId?: string }[] = deptRes.data.departments || [];
      if (departments.length === 0) { setSmartDepartments([]); setLoadingSmartRec(false); return; }

      // Fetch services for each department in parallel
      const results = await Promise.allSettled(
        departments.map((dept) =>
          axios.get("/api/clinic/services", {
            headers,
            params: { departmentId: dept.clinicDepartmentId || dept._id },
          })
        )
      );

      const enriched: SmartDepartment[] = departments.map((dept, i) => {
        const res = results[i];
        const services: SmartService[] =
          res.status === "fulfilled" && res.value.data?.success
            ? (res.value.data.services || []).map((s: any) => ({
                _id: s._id,
                name: s.name,
                price: s.price,
                clinicPrice: s.clinicPrice,
                durationMinutes: s.durationMinutes,
                departmentId: dept._id,
              }))
            : [];
        return { _id: dept._id, name: dept.name, services };
      }).filter((d) => d.services.length > 0);

      setSmartDepartments(enriched);
    } catch {
      // silently ignore
    } finally {
      setLoadingSmartRec(false);
    }
  };

  const fetchDoctorDiscount = async (
     doctorId: string,
     headers: Record<string, string>,
   ) => {
     try {
       console.log("Fetching doctor discount for ID:", doctorId);
       const res = await axios.get(`/api/lead-ms/get-agents?agentId=${doctorId}`, {
         headers,
       });
       console.log("Doctor discount response:", res.data);
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

  // Book next session for the same patient + doctor
  const bookNextSession = async () => {
    if (!details?.patientId || !details?.doctorId) {
      setNextSessionError("Missing patient or doctor information.");
      return;
    }
    setBookingNextSession(true);
    setNextSessionError("");
    setNextSessionBooked(false);
    try {
      const headers = getAuthHeaders();
      // Calculate toTime = nextSessionTime + 30 minutes
      const [hh, mm] = nextSessionTime.split(":").map(Number);
      const toDate = new Date(0, 0, 0, hh, mm + 30);
      const toTime = `${String(toDate.getHours()).padStart(2, "0")}:${String(toDate.getMinutes()).padStart(2, "0")}`;

      const appointmentData: any = {
        patientId: details.patientId,
        doctorId: details.doctorId,
        startDate: nextSessionDate,
        fromTime: nextSessionTime,
        toTime,
        status: "booked",
        followType: "follow up",
        bookedFrom: "doctor",
        referral: "direct",
        emergency: "no",
      };

      // Add roomId if selected
      if (nextSessionRoom) {
        appointmentData.roomId = nextSessionRoom;
      }

      await axios.post("/api/clinic/appointments", appointmentData, { headers });
      setNextSessionBooked(true);
      // Refresh upcoming list
      if (details?.patientId) fetchUpcomingAppointments(details.patientId);
    } catch (err: any) {
      setNextSessionError(err.response?.data?.message || "Failed to book next session.");
    } finally {
      setBookingNextSession(false);
    }
  };

  // Fetch previous complaints
  const fetchPreviousComplaints = async (patientId: string) => {
    setLoadingComplaints(true);
    try {
      const headers = getAuthHeaders();
      const complaintsResponse = await axios.get(
        "/api/clinic/patient-complaints",
        {
          headers,
          params: { patientId },
        },
      );

      if (complaintsResponse.data?.success) {
        setPreviousComplaints(complaintsResponse.data.complaints || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch previous complaints:", err);
      // Don't show error for complaints, just log it
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Fetch upcoming appointments for this patient (dates > today)
  const fetchUpcomingAppointments = async (patientId: string) => {
    setLoadingUpcoming(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/patient-upcoming-appointments", {
        headers,
        params: { patientId },
      });
      if (res.data?.success) {
        setUpcomingAppointments(res.data.appointments || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingUpcoming(false);
    }
  };

  // Fetch patient EMR stats
  const fetchPatientStats = async (patientId: string) => {
    setLoadingPatientStats(true);
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(`/api/clinic/patient-emr-stats/${patientId}`, { headers });
      if (response.data?.success) {
        const s = response.data;
        setPatientStats({
          totalSpend: s.totalSpend || 0,
          totalBilled: s.totalBilled || 0,
          totalPending: s.totalPending || 0,
          totalVisits: s.totalVisits || 0,
          billingCount: s.billingCount || 0,
          recentBillings: s.recentBillings || [],
        });
      }
    } catch (error) {
      console.error('Error fetching patient stats:', error);
    } finally {
      setLoadingPatientStats(false);
    }
  };

  // Fetch patient balance
  const fetchPatientBalance = async (patientId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`/api/clinic/patient-balance/${patientId}`, { headers });
      if (res.data?.success && res.data.balances) {
        setPatientBalance(res.data.balances);
      }
    } catch {
      // silent
    }
  };

  // Fetch all clinic services
  const fetchAllServices = async () => {
    setLoadingServices(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/services", { headers });
      if (res.data?.success) {
        setAllServices(res.data.services || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingServices(false);
    }
  };

  // Fetch departments for custom service
  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/departments", { headers });
      if (res.data?.success) {
        setDepartments(res.data.departments || []);
      }
    } catch {
      // silently ignore
    } finally {
      setDepartmentsLoading(false);
    }
  };

  // Add custom service
  const addCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customServiceName.trim()) return;
    if (!customServicePrice) return;
    if (!customServiceDepartment) return;

    setAddingCustomService(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post(
        "/api/clinic/services",
        {
          departmentId: customServiceDepartment,
          items: [
            {
              name: customServiceName.trim(),
              price: parseFloat(customServicePrice),
              durationMinutes: customServiceDuration ? parseInt(customServiceDuration) : 0,
              clinicPrice: customServiceClinicPrice ? parseFloat(customServiceClinicPrice) : null,
            },
          ],
        },
        { headers }
      );
      if (res.data?.success) {
        // Reset form
        setCustomServiceName("");
        setCustomServicePrice("");
        setCustomServiceClinicPrice("");
        setCustomServiceDuration("");
        setCustomServiceDepartment("");
        setShowAddCustomService(false);
        // Refresh services list
        await fetchAllServices();
        toast.success("Service added successfully!");
      }
    } catch (error) {
      console.error("Error adding custom service:", error);
      toast.error("Failed to add service");
    } finally {
      setAddingCustomService(false);
    }
  };

  // Fetch all clinic rooms
  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/rooms", { headers });
      if (res.data?.success) {
        setRooms(res.data.rooms || []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingRooms(false);
    }
  };

  // Save selected services to appointment
  const saveServicesToAppointment = async () => {
    if (!details?.appointmentId || selectedServices.length === 0) return;
    setSavingServices(true);
    setServicesError("");
    setServicesSaved(false);
    try {
      const headers = getAuthHeaders();
      const serviceIds = selectedServices.map((s) => s._id);
      await axios.patch(`/api/clinic/appointment-services/${details.appointmentId}`, { serviceIds }, { headers });
      setServicesSaved(true);
      setShowAddServiceDropdown(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setServicesError(err.response?.data?.message || "Failed to save services.");
    } finally {
      setSavingServices(false);
    }
  };

  // Fetch services for package creation (from /api/clinic/services only)
  const fetchPkgTreatments = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get("/api/clinic/services", { headers });
      if (res.data?.success) {
        const flat: Array<{ name: string; slug: string; type?: string; mainTreatment?: string | null }> = [];
        (res.data.services || []).forEach((svc: any) => {
          flat.push({ name: svc.name, slug: svc.serviceSlug || svc._id, type: "service", mainTreatment: null });
        });
        setPkgTreatments(flat);
      }
    } catch { /* ignore */ }
  };

  // Create package and optionally add to patient
  const handleCreatePackageModal = async (addToPatient: boolean) => {
    setPkgError("");
    setPkgSuccess("");
    if (!pkgModalName.trim()) { setPkgError("Please enter a package name"); return; }
    if (!pkgModalPrice || parseFloat(pkgModalPrice) < 0) { setPkgError("Please enter a valid price"); return; }
    if (pkgSelectedTreatments.length === 0) { setPkgError("Please select at least one treatment"); return; }
    const totalAllocated = pkgSelectedTreatments.reduce((sum, t) => sum + (parseFloat(String(t.allocatedPrice)) || 0), 0);
    const packagePrice = parseFloat(pkgModalPrice);
    if (Math.abs(totalAllocated - packagePrice) > 0.01) {
      setPkgError(`Total allocated prices (${totalAllocated.toFixed(2)}) must equal the package price (${packagePrice.toFixed(2)})`);
      return;
    }
    setPkgSubmitting(true);
    try {
      const headers = getAuthHeaders();
      const res = await axios.post("/api/clinic/packages", {
        name: pkgModalName.trim(),
        totalPrice: packagePrice,
        validityInMonths: parseInt(pkgModalValidityInMonths) || 0,
        startDate: pkgModalStartDate,
        endDate: pkgModalEndDate,
        treatments: pkgSelectedTreatments,
      }, { headers });
      if (res.data?.success) {
        const newPkgId = res.data.package?._id || res.data.packageId || null;
        const createdPkgData = res.data.package || null;
        if (addToPatient && newPkgId && details?.patientId) {
          setAddingPackageToPatient(true);
          try {
            await axios.post("/api/clinic/assign-package-to-patient", {
              patientId: details.patientId,
              packageId: newPkgId,
              validityInMonths: parseInt(pkgModalValidityInMonths) || 0,
              startDate: pkgModalStartDate,
              endDate: pkgModalEndDate,
              totalPrice: packagePrice,
              paidAmount: 0,
              paymentStatus: "Unpaid",
              paymentMethod: "Cash",
            }, { headers });

            // Create a package billing record so it gets added to the patient's pending balance
            try {
              await axios.post("/api/clinic/package-billing", {
                patientId: details.patientId,
                packageName: pkgModalName.trim(),
                packageId: newPkgId,
                totalAmount: packagePrice,
                paidAmount: 0,
                paymentMethod: "Cash",
                paymentStatus: "Unpaid",
                advanceBalanceUsed: 0,
                claimAmountUsed: 0,
                treatments: pkgSelectedTreatments,
              }, { headers });
              console.log('Package billing created for pending balance');
              
              // Refresh patient balance to show updated pending balance
              fetchPatientBalance(details.patientId);
              fetchPatientStats(details.patientId);
            } catch (billingErr: any) {
              console.error('Error creating package billing:', billingErr);
            }
            
            setPkgSuccess("Package created and added to patient profile!");
            setCreatedPackage(createdPkgData);
          } catch {
            setPkgSuccess("Package created. (Could not add to patient profile)");
            setCreatedPackage(createdPkgData);
          } finally {
            setAddingPackageToPatient(false);
          }
        } else {
          setPkgSuccess("Package created successfully!");
          setCreatedPackage(createdPkgData);
        }
        setPkgModalName("");
        setPkgModalPrice("");
        setPkgModalValidityInMonths("");
        setPkgModalStartDate(new Date().toISOString().split('T')[0]);
        setPkgModalEndDate("");
        setPkgSelectedTreatments([]);
        setPkgTreatmentSearch("");
      } else {
        setPkgError(res.data?.message || "Failed to create package");
      }
    } catch (err: any) {
      setPkgError(err.response?.data?.message || "Failed to create package");
    } finally {
      setPkgSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "progress" || !details?.patientId) return;
    const fetchProgressNotes = async () => {
      setLoadingProgressNotes(true);
      setProgressError("");
      try {
        const headers = getAuthHeaders();
        const res = await axios.get("/api/clinic/progress-notes", {
          headers,
          params: { patientId: details.patientId },
        });
        if (res.data?.success) {
          setProgressNotes(res.data.notes || []);
        }
      } catch {
        setProgressError("Failed to load progress notes");
      } finally {
        setLoadingProgressNotes(false);
      }
    };
    fetchProgressNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, details?.patientId]);
 
    // Fetch prescription history when switching to prescription tab
    useEffect(() => {
      if (activeTab !== "prescription" || !details?.patientId) return;
      const fetchPrescriptionHistory = async () => {
        setLoadingPrescriptionHistory(true);
        try {
          const headers = getAuthHeaders();
          const res = await axios.get("/api/clinic/prescriptions", {
            headers,
            params: { patientId: details.patientId },
          });
          if (res.data?.success) {
            setPrescriptionHistory(res.data.prescriptions || []);
          }
        } catch {
          // silently ignore history fetch errors
        } finally {
          setLoadingPrescriptionHistory(false);
        }
      };
      fetchPrescriptionHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, details?.patientId]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const handleSaveComplaints = async () => {
    if (!appointment || !details) return;

    if (!report || !report.reportId) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">âš  Vitals Report Required</span>
          <span className="text-xs opacity-80">Please fill the appointment report first, then add complaints.</span>
        </div>,
        {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxWidth: '500px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        }
      );
      return;
    }

    if (!complaints.trim()) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">âš  Complaint Required</span>
          <span className="text-xs opacity-80">Please enter complaint notes before saving.</span>
        </div>,
        {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxWidth: '500px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        }
      );
      return;
    }

    // Validate clinical checklist
    const unchecked = CHECKLIST_ITEMS.filter((item) => !checklist[item]);
    if (unchecked.length > 0) {
      setChecklistError(`Please tick all checklist items before saving: ${unchecked.join(", ")}`);
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">âš  Incomplete Checklist</span>
          <span className="text-xs opacity-80">Please tick all checklist items before saving: {unchecked.join(", ")}</span>
        </div>,
        {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxWidth: '600px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        }
      );
      return;
    }
    setChecklistError("");

    setSaving(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      
      // Step 1: Save the complaint FIRST
      await axios.post(
        "/api/clinic/patient-complaints",
        {
          appointmentId: details.appointmentId,
          appointmentReportId: report.reportId,
          complaints: complaints.trim(),
          items: items || [],
          beforeImage: beforeImage || null,
          afterImage: afterImage || null,
          isDoctorDiscountApplied: isDoctorDiscountApplied,
          doctorDiscountType: isDoctorDiscountApplied ? doctorDiscount?.discountType : null,
          doctorDiscountAmount: isDoctorDiscountApplied ? doctorDiscount?.discountAmount : 0,
        },
        { headers },
      );

      // Step 2: Only if complaint saved successfully, then save services to appointment
      if (selectedServices.length > 0 && details.appointmentId) {
        try {
          const serviceIds = selectedServices.map((s) => s._id);
          await axios.patch(
            `/api/clinic/appointment-services/${details.appointmentId}`,
            { serviceIds },
            { headers }
          );
        } catch (serviceErr: any) {
          console.error("Error saving services to appointment:", serviceErr);
          // Show warning but don't fail the entire operation since complaint was saved
          toast.error(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">âš  Warning</span>
              <span className="text-xs opacity-80">Complaint saved, but services may not have been saved properly. Please verify.</span>
            </div>,
            {
              duration: 4000,
              position: 'top-right',
              style: {
                background: '#f59e0b',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 9999,
                maxWidth: '500px',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#f59e0b',
              },
            }
          );
        }
      }

      // Refresh previous complaints list
      if (details.patientId) {
        const complaintsResponse = await axios.get(
          "/api/clinic/patient-complaints",
          {
            headers,
            params: { patientId: details.patientId },
          },
        );
        if (complaintsResponse.data?.success) {
          setPreviousComplaints(complaintsResponse.data.complaints || []);
        }
      }

      // Clear the input
      setComplaints("");
      setBeforeImage("");
      setAfterImage("");
      setError("");

      // set items to empty array
      setItems([]);
      fetchAllocatedItems();
     
      // Call onSuccess callback to refresh parent component
      if (onSuccess) {
        onSuccess();
      }
     
      // Show success toast
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">âœ“ Complaints Saved Successfully</span>
          <span className="text-xs opacity-80">Your complaint notes have been saved to the patient record.</span>
        </div>,
        {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#10b981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxWidth: '500px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        }
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save complaints");
    } finally {
      setSaving(false);
    }
  };

  const handleCurrentItemChange = (field: keyof StockRow, value: any) => {
    // if (field === "itemId") {
    //   const item = .find((i) => i._id === value);
    //   const selectedUOM = uoms.find((u) => u?.name === item?.level0?.uom);
    //   if (item) {
    //     setCurrentItem((prev) => ({
    //       ...prev,
    //       itemId: value,
    //       code: item.code,
    //       name: item.name,
    //       uom: selectedUOM ? selectedUOM.name : "",
    //       description: item.description || "",
    //     }));
    //     return;
    //   }
    // }
    setCurrentItem((prev) => ({
      ...prev,
      [field]: field === "quantity" ? parseFloat(value) || 0 : value,
    }));
  };

  const addCurrentItem = () => {
    if (!currentItem.name.trim() || !currentItem.quantity || !currentItem.uom) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">âš  Incomplete Item</span>
          <span className="text-xs opacity-80">Please complete item selection, quantity and UOM</span>
        </div>,
        {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxWidth: '500px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        }
      );
      return;
    }
    setItems((prev) => [...prev, { ...currentItem }]);
    setCurrentItem({
      itemId: "",
      code: "",
      name: "",
      description: "",
      quantity: 1,
      uom: "",
    });
    setError("");
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    if (editIndex === index) {
      setEditIndex(null);
      setEditingItem(null);
    }
  };

  const startEditItem = (index: number) => {
    setEditIndex(index);
    setEditingItem({ ...items[index] });
  };

  const handleEditingItemChange = (field: keyof StockRow, value: any) => {
    if (!editingItem) return;
    // if (field === "itemId") {
    //   const item = stockItems.find((i) => i._id === value);
    //   const selectedUOM = uoms.find((u) => u?.name === item?.level0?.uom);
    //   if (item) {
    //     setEditingItem({
    //       ...editingItem,
    //       itemId: value,
    //       code: item.code,
    //       name: item.name,
    //       uom: selectedUOM ? selectedUOM.name : "",
    //     });
    //     return;
    //   }
    // }
    setEditingItem({
      ...editingItem,
      [field]: field === "quantity" ? parseFloat(value) || 0 : value,
    } as any);
  };

  const handleDeleteComplaint = async (complaint: PreviousComplaint | null) => {
    if (!complaint) return;
    try {
      setDeleting(true);
      const headers = getAuthHeaders();
      await axios.delete(`/api/clinic/patient-complaints`, {
        headers,
        params: {
          complaintId: complaint._id,
        },
      });
      setPreviousComplaints((prev) =>
        prev.filter((pc) => pc._id !== complaint._id),
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete complaint");
    } finally {
      setDeleting(false);
      setIsOpenDeleteComplaintModal(false);
    }
  };

  const saveEditItem = () => {
    if (editIndex == null || editingItem == null) return;
    if (!editingItem.name.trim() || !editingItem.quantity || !editingItem.uom) {
      setError("Please complete item fields before saving");
      return;
    }
    const updated = [...items];
    updated[editIndex] = { ...editingItem };
    setItems(updated);
    setEditIndex(null);
    setEditingItem(null);
    setError("");
  };

  const cancelEditItem = () => {
    setEditIndex(null);
    setEditingItem(null);
  };

  /*---------------------------
    // SEND CONSENT FORM MESSAGE ON WHATSAPP
    //---------------------------*/
    const handleSendConsentMsgOnWhatsapp = async () => {
      if (!selectedConsentId) return;
 
      try {
        setSendMsgLoading(true);
        setSendingConsent(true);
        const token = getTokenByPath();
        console.log('Details object:', details);
 
        // Create patient data object for URL
        const patientData = {
          firstName: details?.patientName?.split(" ")[0] || "",
          lastName: details?.patientName?.split(" ").slice(1).join(" ") || "",
          mobileNumber: details?.mobileNumber || "",
          email: details?.email || "",
          appointmentId: details?._id || details?.appointmentId || "",
        };
       
        console.log('Patient data object:', patientData);
        const encodedPatientData = encodeURIComponent(JSON.stringify(patientData));
        console.log('Encoded patient data:', encodedPatientData);
        const consentUrl = `https://zeva360.com/consent-form/${selectedConsentId}?patient=${encodedPatientData}`;
        console.log('Final consent URL:', consentUrl);
 
        const { data } = await axios.post(
          "/api/messages/send-message",
          {
            patientId: details?.patientId,
            providerId: "6952256c4a46b2f1eb01be86",
            channel: "whatsapp",
            content: `Please review and sign the consent form by clicking the link below:\n\n ${consentUrl}\n\n Thank you.`,
            mediaUrl: "",
            mediaType: "",
            source: "Zeva",
            messageType: "conversational",
            templateId: "69c38b4d26b8217e1ba78f8a",
            // for whatsapp template if body variables exist
            headerParameters: [],
            bodyParameters: [
              {
                type: "text",
                text: consentUrl,
              },
            ],
            attachments: [],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
 
        if (data && data?.success) {
          setConsentSent(true);
         
          // Show success popup
          toast.success("Consent form sent successfully!", {
            duration: 4000,
            style: {
              background: "#10B981",
              color: "#fff",
              fontWeight: "600",
              padding: "14px 20px",
              borderRadius: "10px",
              fontSize: "14px",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "#10B981",
            },
          });
         
          // Log the sent consent form
          try {
            const token = getTokenByPath();
            const selectedForm = consentForms.find((f) => f._id === selectedConsentId);
            await axios.post(
              "/api/clinic/consent-log",
              {
                consentFormId: selectedConsentId,
                consentFormName: selectedForm?.formName || "",
                patientId: details?.patientId,
                patientName: details?.patientName || "",
                appointmentId: details?.appointmentId,
                sentVia: "whatsapp",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
           
            // Force re-fetch of consent statuses by clearing and setting state
            setConsentStatuses([]);
            if (details?.patientId) {
              setTimeout(() => {
                fetchConsentStatuses(details.patientId);
              }, 100);
            }
          } catch (logError) {
            console.error("Error logging consent form sent:", logError);
          }
        }
      } catch (error: any) {
        console.log(
          "Error in send consent form msg on whatsapp: ",
          error?.message,
        );
      } finally {
        setSendMsgLoading(false);
        setSendingConsent(false);
      }
    };

    /*---------------------------
    // SEND PRESCRIPTION MESSAGE ON WHATSAPP
    //---------------------------*/
    const handleSendPrescriptionWhatsapp = async (prescriptionLink: string) => {
      if (!prescriptionLink) return;
     
      try {
        const token = getTokenByPath();
       
        console.log("=== SENDING PRESCRIPTION VIA WHATSAPP ===");
        console.log("Prescription Link:", prescriptionLink);
        console.log("Patient Name:", details?.patientName);
        console.log("Patient Mobile:", details?.mobileNumber);
        console.log("==========================================");
       
        const { data } = await axios.post(
          "/api/messages/send-message",
          {
            patientId: details?.patientId,
            providerId: "6952256c4a46b2f1eb01be86",
            channel: "whatsapp",
            content: `Please check out this prescription form by clicking the link below:\n\n ${prescriptionLink}\n\n Thank you.`,
            mediaUrl: "",
            mediaType: "",
            source: "Zeva",
            messageType: "conversational",
            templateId: "69c679add3dde2931e28d893",
            headerParameters: [],
            bodyParameters: [
              {
                type: "text",
                text: prescriptionLink,
              },
            ],
            attachments: [],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
       
        if (data && data?.success) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span className="font-semibold">âœ“ Message Sent Successfully</span>
              <span className="text-xs opacity-80">Your prescription has been sent via WhatsApp.</span>
            </div>,
            {
              duration: 3000,
              position: 'top-center',
              style: {
                background: '#10b981',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                zIndex: 9999,
                maxWidth: '500px',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            }
          );
          
          // Clear the prescription form
          setMedicines([emptyMedicine()]);
          setAftercareInstructions("");
          setIncludeInPdf(true);
          setPrescriptionSaved(false);
          
          // Refresh prescription history
          if (details?.patientId) {
            try {
              const headers = getAuthHeaders();
              const histRes = await axios.get("/api/clinic/prescriptions", {
                headers,
                params: { patientId: details.patientId },
              });
              if (histRes.data?.success) {
                setPrescriptionHistory(histRes.data.prescriptions || []);
              }
            } catch (err) {
              console.error("Error refreshing prescription history:", err);
            }
          }
          
          // Call onSuccess callback to refresh parent component
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error: any) {
        console.log("Error in send prescription msg on whatsapp: ", error?.message);
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">âš  Send Failed</span>
            <span className="text-xs opacity-80">{error?.response?.data?.message || "Failed to send prescription via WhatsApp"}</span>
          </div>,
          {
            duration: 4000,
            position: 'top-center',
            style: {
              background: '#ef4444',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
              maxWidth: '500px',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          }
        );
      } finally {
        setSendMsgLoading(false);
      }
    };

  if (!isOpen || !appointment) {
    return null;
  }

  const selectedAllocatedItem: any =
    allocatedItems.find((si: any) => si._id === currentItem.itemId) || null;
  const availableForSelectedUom: number =
    selectedAllocatedItem?.quantitiesByUom?.find(
      (q: any) => q?.uom === currentItem.uom,
    )?.quantity ?? 0;
  const exceedsAvailable =
    !!currentItem.uom &&
    typeof currentItem.quantity === "number" &&
    currentItem.quantity > availableForSelectedUom &&
    availableForSelectedUom > 0;

  // Compute total bill from selected services
  const totalBill = selectedServices.reduce(
    (sum, s) => sum + (s.clinicPrice != null ? s.clinicPrice : s.price),
    0,
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-3 md:p-4">
        <div className="bg-gray-50 w-full max-w-[1500px] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[98vh] sm:max-h-[96vh]">

          {/* â”€â”€ TOP HEADER BAR â”€â”€ */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-5 py-2 sm:py-3 flex-shrink-0">
            {loading ? (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">Loading patient details...</div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
            ) : details ? (
              <div className="flex flex-col gap-2">
                {/* Patient info + stat boxes + date/time + action buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 flex-wrap">
                  {/* Left: avatar + name + gender/phone */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 w-full sm:w-auto">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-bold text-gray-900 truncate">{details.patientName}</span>
                        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                          ID: {details.emrNumber || details.patientId.slice(-8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {details.gender?.toLowerCase() === "female" ? (
                            <Venus className="w-3 h-3 text-pink-500" />
                          ) : details.gender?.toLowerCase() === "male" ? (
                            <Mars className="w-3 h-3 text-blue-500" />
                          ) : (
                            <User className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="capitalize">{details.gender || "â€”"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{details.mobileNumber || "â€”"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Centre: Total Spend + Visits stat boxes */}
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start">
                    <div className="flex flex-col items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-teal-200 bg-teal-50/40 min-w-[80px] sm:min-w-[100px]">
                      <span className="text-[9px] sm:text-[10px] text-teal-600 font-medium">Total Spend</span>
                      <span className="text-base font-bold text-teal-700 leading-tight">
                        {loadingPatientStats ? "â€¦" : patientStats != null ? `${getCurrencySymbol(currency)} ${patientStats.totalSpend.toLocaleString()}` : "â€”"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-teal-200 bg-teal-50/40 min-w-[56px] sm:min-w-[64px]">
                      <span className="text-[9px] sm:text-[10px] text-teal-600 font-medium">Visits</span>
                      <span className="text-base font-bold text-teal-700 leading-tight">
                        {loadingPatientStats ? "â€¦" : patientStats != null ? patientStats.totalVisits : "â€”"}
                      </span>
                    </div>
                  </div>

                  {/* Right: date + time + status + action buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-end">
                    <div className="flex items-center gap-1 sm:gap-1.5 border border-gray-200 rounded-md sm:rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs text-gray-500 bg-gray-50">
                      <Calendar size={10} className="sm:w-[11px] sm:h-[11px]" /> {formatDate(details.startDate)}
                    </div>
                    {details.fromTime && (
                      <div className="flex items-center gap-1 sm:gap-1.5 border border-gray-200 rounded-md sm:rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs text-gray-500 bg-gray-50">
                        <Clock size={10} className="sm:w-[11px] sm:h-[11px]" /> {details.fromTime}{details.toTime ? ` â€“ ${details.toTime}` : ""}
                      </div>
                    )}
                    <span className={`text-[10px] sm:text-xs rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 font-semibold ${
                      details.status === "Arrived" ? "bg-green-100 text-green-700 border border-green-200" :
                      details.status === "booked" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                      details.status === "Completed" ? "bg-gray-100 text-gray-700 border border-gray-200" :
                      "bg-orange-100 text-orange-700 border border-orange-200"
                    }`}>{details.status || "in-progress"}</span>

                    {/* Send Consent */}
                    <div className="flex flex-wrap items-center gap-1 w-full sm:w-auto">
                      <select value={selectedConsentId} onChange={(e) => { setSelectedConsentId(e.target.value); setConsentSent(false); setConsentStatus(null); }} className="border border-gray-200 rounded-md sm:rounded-lg px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full sm:max-w-[130px]">
                        <option value="">Select Consent</option>
                        {consentForms.map((cf) => (<option key={cf._id} value={cf._id}>{cf.formName}</option>))}
                      </select>
                      <button type="button" disabled={!selectedConsentId || sendingConsent || sendMsgLoading || consentSent}
                        onClick={handleSendConsentMsgOnWhatsapp}
                        className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${consentSent ? "bg-green-100 text-green-700 border border-green-200" : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"}`}>
                        {consentSent ? <><Check size={10} className="sm:w-[11px] sm:h-[11px]" /> Sent</> : sendingConsent ? <><RefreshCw size={10} className="sm:w-[11px] sm:h-[11px] animate-spin" /> Sending...</> : <><Send size={10} className="sm:w-[11px] sm:h-[11px]" /> Send Consent</>}
                      </button>
                    </div>

                    {/* History â€” scrolls to existing Previous Complaints section */}
                    <button type="button"
                      onClick={() => { if (activeTab !== "complaint") setActiveTab("complaint"); setTimeout(() => { previousComplaintsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60); }}
                      className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-gray-200 text-[10px] sm:text-xs font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap">
                      <Clock size={10} className="sm:w-[11px] sm:h-[11px]" /> History {previousComplaints.length > 0 && `(${previousComplaints.length})`}
                    </button>
                    <button onClick={onClose} className="ml-1 text-gray-400 hover:text-gray-600 p-1 sm:p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Vitals mini-strip */}
                {report && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                    <span className="font-semibold text-gray-700">Vitals:</span>
                    <span>ðŸŒ¡ {report.temperatureCelsius}Â°C</span>
                    <span>ðŸ’“ {report.pulseBpm} bpm</span>
                    <span>ðŸ©¸ {report.systolicBp}/{report.diastolicBp} mmHg</span>
                    {report.weightKg != null && <span>âš– {report.weightKg} kg</span>}
                    {report.heightCm != null && <span>ðŸ“ {report.heightCm} cm</span>}
                    {report.bmi != null && <span>BMI {report.bmi}</span>}
                    {report.spo2Percent != null && <span>SpOâ‚‚ {report.spo2Percent}%</span>}
                  </div>
                )}


              </div>
            ) : !loading ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">No patient data available.</span>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
            ) : null}
          </div>
{/* Vitals Warning Banner - Show at TOP of modal when no report exists */}

          {showVitalsWarning && !report && (

            <div className="mb-4 mx-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">

              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">

                  <AlertTriangle className="w-5 h-5 text-amber-600" />

                </div>

                <div className="flex-1">

                  <h4 className="text-sm font-bold text-amber-800 mb-1">Vitals Report Required</h4>

                  <p className="text-xs text-amber-700 mb-2">

                    Please fill the appointment report first, then add complaints.

                  </p>

                  <p className="text-xs text-amber-600">

                    No vitals have been recorded for this appointment yet.

                  </p>

                </div>

                <button

                  type="button"

                  onClick={() => setShowVitalsWarning(false)}

                  className="text-amber-400 hover:text-amber-600 transition-colors"

                >

                  <XIcon size={16} />

                </button>

              </div>

            </div>

          )}

          {/* â”€â”€ MAIN BODY: two-column â”€â”€ */}
          <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">

            {/* â”€â”€ LEFT MAIN PANEL â”€â”€ */}
            <div className="flex-1 min-w-0 overflow-y-auto scrollbar-hide px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading && (
                <div className="py-10 text-center text-gray-400 text-sm">
                  Loading appointment details...
                </div>
              )}

              {!loading && (
                <>
                  {/* Tab Navigation */}
                  <div className="flex items-center gap-1 bg-white rounded-lg sm:rounded-xl border border-gray-200 p-0.5 sm:p-1 shadow-sm">
                    {(
                      [
                        { key: "complaint", label: "Complaints", icon: <NotebookPen className="w-3.5 h-3.5" /> },
                        { key: "progress", label: "Progress Notes", icon: <TrendingUp className="w-3.5 h-3.5" /> },
                        { key: "prescription", label: "Prescription", icon: <Pill className="w-3.5 h-3.5" /> },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex-1 justify-center ${
                          activeTab === tab.key
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* â”€â”€ COMPLAINT TAB â”€â”€ */}
                  {activeTab === "complaint" && (
                    <div className="space-y-4">
                      {/* Chief Complaints */}
                      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 bg-gray-50/60">
                          <div className="flex items-center gap-2">
                            <NotebookPen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-semibold text-gray-800">Chief Complaints</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] sm:text-xs text-gray-400">{complaints.length}/2000</span>
                           
                          </div>
                        </div>
                        <div className="p-3 sm:p-4">
                          <textarea
                            value={complaints}
                            onChange={(e) => setComplaints(e.target.value)}
                            maxLength={2000}
                            rows={5}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none placeholder-gray-400"
                            placeholder="Document chief complaints, presenting symptoms, and patient history..."
                          />
                          {/* Image Upload */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Before Image</p>
                              <div className="relative flex items-center gap-2">
                                <div className="w-full sm:w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                  {beforeImage && (
                                    <button
                                      onClick={() => setBeforeImage("")}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                                      title="Remove image"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                  {beforeImage ? (
                                    <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                                  ) : (
                                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                                  )}
                                  {uploadingBefore && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                      <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingBefore(true);
                                      const res = await handleUpload(file);
                                      if (res?.success) setBeforeImage(res.url);
                                      setUploadingBefore(false);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">After Image</p>
                              <div className="relative flex items-center gap-2">
                                <div className="w-full sm:w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                                  {afterImage && (
                                    <button
                                      onClick={() => setAfterImage("")}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                                      title="Remove image"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                  {afterImage ? (
                                    <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                                  ) : (
                                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                                  )}
                                  {uploadingAfter && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                      <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingAfter(true);
                                      const res = await handleUpload(file);
                                      if (res?.success) setAfterImage(res.url);
                                      setUploadingAfter(false);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                     
                     

                      {/* Treatment & Billing - Enhanced Modern UI */}
                      <div id="treatment-billing-section" className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-gray-900">Treatment & Billing</h3>
                              <p className="text-xs text-gray-500">Add and manage treatment services</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddServiceDropdown(true);
                                setShowAddCustomService(false);
                                setShowCreatePackage(false);
                                setServicesSaved(false);
                                setServicesError("");
                                if (allServices.length === 0) fetchAllServices();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                            >
                              <Plus size={16} /> Add Service
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddCustomService(true);
                                setShowAddServiceDropdown(false);
                                setShowCreatePackage(false);
                                if (departments.length === 0) fetchDepartments();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg"
                            >
                              <Wrench size={16} /> Add Custom Service
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreatePackage(true);
                                setShowAddServiceDropdown(false);
                                setShowAddCustomService(false);
                                setPkgError("");
                                setPkgSuccess("");
                                if (allServices.length === 0) fetchAllServices(); // Load clinic services
                                if (pkgTreatments.length === 0) fetchPkgTreatments();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                              <Package size={16} /> Create Package
                            </button>
                          </div>
                        </div>

                        {/* Add Service Panel - Enhanced Searchable Dropdown */}
                        {showAddServiceDropdown && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Search className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-bold text-blue-800">Search & Add Services</span>
                              </div>
                              <button type="button" onClick={() => setShowAddServiceDropdown(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon size={16} /></button>
                            </div>
                           
                            {/* Search Input */}
                            <div className="relative mb-3">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search by service name..."
                                value={serviceSearchQuery}
                                onChange={(e) => setServiceSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
                              />
                            </div>
                           
                            {/* Services List */}
                            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 rounded-lg border border-gray-200 bg-white p-2">
                              {loadingServices ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                  <span className="ml-2 text-sm text-gray-500">Loading services...</span>
                                </div>
                              ) : allServices.filter((s) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <Package className="w-12 h-12 text-gray-300 mb-2" />
                                  <p className="text-sm text-gray-500 font-medium">No services found</p>
                                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                </div>
                              ) : (
                                allServices.filter((s) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((svc) => {
                                  const isSelected = selectedServices.some((s) => s._id === svc._id);
                                  return (
                                    <button key={svc._id} type="button"
                                      onClick={() => { setSelectedServices((prev) => isSelected ? prev.filter((s) => s._id !== svc._id) : [...prev, svc]); setServicesSaved(false); }}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                                        isSelected
                                          ? "bg-blue-50 border-blue-300 shadow-sm"
                                          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                                        }`}>
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? "text-blue-800" : "text-gray-700"}`}>
                                          {svc.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                                          {getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                                        </span>
                                        {isSelected && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                            Added
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                           
                            {/* Action Buttons */}
                            {/* Services save status - hidden as services are saved with complaint */}
                            {false && servicesError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700">{servicesError}</p>
                              </div>
                            )}
                            {false && servicesSaved && (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-xs text-green-700 font-medium">Services saved successfully!</p>
                              </div>
                            )}
                            {/* Save Services button - hidden as services are saved automatically with complaint */}
                            {false && (
                              <button type="button" onClick={saveServicesToAppointment}
                                disabled={savingServices || selectedServices.length === 0}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                              >
                                {savingServices ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Save Services to Appointment
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Custom Service Add Panel */}
                        {showAddCustomService && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                  <Wrench className="w-4 h-4 text-emerald-600" />
                                </div>
                                <span className="text-sm font-bold text-emerald-800">Add Custom Service</span>
                              </div>
                              <button type="button" onClick={() => {
                                setShowAddCustomService(false);
                                setCustomServiceName("");
                                setCustomServicePrice("");
                                setCustomServiceClinicPrice("");
                                setCustomServiceDuration("");
                                setCustomServiceDepartment("");
                              }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XIcon size={16} />
                              </button>
                            </div>

                            <form onSubmit={addCustomService} className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Department <span className="text-red-500">*</span></label>
                                <select
                                  value={customServiceDepartment}
                                  onChange={(e) => setCustomServiceDepartment(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
                                  disabled={departmentsLoading}
                                  required
                                >
                                  <option value="" disabled>Select department</option>
                                  {departments.map((dept) => (
                                    <option key={dept._id} value={dept._id}>
                                      {dept.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Service Name <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={customServiceName}
                                  onChange={(e) => setCustomServiceName(e.target.value)}
                                  placeholder="Enter service name"
                                  className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Price <span className="text-red-500">*</span></label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={customServicePrice}
                                      onChange={(e) => setCustomServicePrice(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full pl-10 pr-4 py-2 text-sm font-semibold border border-emerald-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
                                      required
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Clinic Price (Optional)</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={customServiceClinicPrice}
                                      onChange={(e) => setCustomServiceClinicPrice(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full pl-10 pr-4 py-2 text-sm font-semibold border border-emerald-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Duration (Minutes)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={customServiceDuration}
                                    onChange={(e) => setCustomServiceDuration(e.target.value)}
                                    placeholder="30"
                                    className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent shadow-sm"
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={addingCustomService}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                              >
                                {addingCustomService ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Add Custom Service
                                  </>
                                )}
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Create Package Panel - Enhanced Inline Form */}
                        {showCreatePackage && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-bold text-violet-800">Create New Package</span>
                              </div>
                              <button type="button" onClick={() => { setShowCreatePackage(false); setPkgError(""); setPkgSuccess(""); setPkgModalName(""); setPkgModalPrice(""); setPkgModalValidityInMonths(""); setPkgModalStartDate(new Date().toISOString().split('T')[0]); setPkgModalEndDate(""); setPkgSelectedTreatments([]); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <XIcon size={16} />
                              </button>
                            </div>

                            {/* Package Name */}
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Package Name <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                value={pkgModalName}
                                onChange={(e) => setPkgModalName(e.target.value)}
                                placeholder="e.g., Premium Skin Care Package"
                                className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                              />
                            </div>

                            {/* Package Price */}
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Total Package Price <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium"></span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={pkgModalPrice}
                                  onChange={(e) => setPkgModalPrice(e.target.value)}
                                  placeholder=""
                                  className="w-full pl-12 pr-4 py-2 text-sm font-semibold border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                            </div>

                            {/* Validity & Dates */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">Validity (Months)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={pkgModalValidityInMonths}
                                  onChange={(e) => setPkgModalValidityInMonths(e.target.value)}
                                  placeholder="e.g. 12"
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">Start Date</label>
                                <input
                                  type="date"
                                  value={pkgModalStartDate}
                                  onChange={(e) => setPkgModalStartDate(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">End Date</label>
                                <input
                                  type="date"
                                  value={pkgModalEndDate}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-violet-50 text-violet-700 cursor-not-allowed shadow-sm"
                                />
                              </div>
                            </div>

                            {/* Treatment Selector */}
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Select Treatments / Services <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <div
                                  className="w-full px-4 py-2.5 text-sm border border-violet-200 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-violet-300 transition-colors shadow-sm"
                                  onClick={() => {
                                    setPkgTreatmentDropdownOpen(!pkgTreatmentDropdownOpen);
                                    if (!pkgTreatmentDropdownOpen && allServices.length === 0) fetchAllServices();
                                  }}
                                >
                                  <span className={pkgSelectedTreatments.length > 0 ? "text-gray-800 font-medium" : "text-gray-400"}>
                                    {pkgSelectedTreatments.length > 0
                                      ? `${pkgSelectedTreatments.length} treatment${pkgSelectedTreatments.length > 1 ? 's' : ''} selected`
                                      : "Select treatments to include..."
                                    }
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${pkgTreatmentDropdownOpen ? "rotate-180" : ""}`} />
                                </div>

                                {pkgTreatmentDropdownOpen && (
                                  <div className="absolute z-20 w-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-violet-100 sticky top-0 bg-white">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                          type="text"
                                          value={pkgTreatmentSearch}
                                          onChange={(e) => setPkgTreatmentSearch(e.target.value)}
                                          placeholder="Search treatments..."
                                          autoFocus
                                          className="w-full pl-9 pr-3 py-2 text-sm border border-violet-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400"
                                        />
                                      </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-52">
                                      {loadingServices ? (
                                        <div className="flex items-center justify-center p-4">
                                          <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                                          <span className="ml-2 text-sm text-gray-500">Loading...</span>
                                        </div>
                                      ) : allServices.filter((s) => s.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase())).length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">No treatments found</div>
                                      ) : (
                                        <ul className="py-1">
                                          {allServices
                                            .filter((svc) => svc.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase()))
                                            .map((svc) => {
                                              const isSelected = pkgSelectedTreatments.some((t) => t.treatmentSlug === svc._id);
                                              return (
                                                <li key={svc._id}>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      if (isSelected) {
                                                        setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== svc._id));
                                                      } else {
                                                        setPkgSelectedTreatments((prev) => [
                                                          ...prev,
                                                          {
                                                            treatmentName: svc.name,
                                                            treatmentSlug: svc._id,
                                                            sessions: 1,
                                                            allocatedPrice: svc.clinicPrice != null ? svc.clinicPrice : svc.price,
                                                          },
                                                        ]);
                                                      }
                                                    }}
                                                    className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-violet-50 transition-colors ${
                                                      isSelected ? "bg-violet-50" : ""
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-3">
                                                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                                        isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"
                                                      }`}>
                                                        {isSelected && <Check size={12} className="text-white" />}
                                                      </div>
                                                      <div className="text-left">
                                                        <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                          {getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)} â€¢ {svc.durationMinutes} mins
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </button>
                                                </li>
                                              );
                                            })}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Selected Treatments List */}
                              {pkgSelectedTreatments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs font-semibold text-violet-700">Selected Treatments</p>
                                  {pkgSelectedTreatments.map((sel) => {
                                    const sessPrice = sel.sessions > 0 ? (sel.allocatedPrice || 0) / sel.sessions : 0;
                                    return (
                                      <div key={sel.treatmentSlug} className="bg-white border border-violet-200 rounded-lg p-2.5 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-semibold text-violet-700">{sel.treatmentName}</span>
                                          <button
                                            type="button"
                                            onClick={() => setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== sel.treatmentSlug))}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                          >
                                            <XIcon size={13} />
                                          </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <label className="block text-[9px] text-violet-600 font-medium mb-0.5">Price</label>
                                            <input
                                              type="number" min="0" step="0.01"
                                              value={sel.allocatedPrice || ""}
                                              onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, allocatedPrice: parseFloat(e.target.value) || 0 } : t))}
                                              className="w-full px-2 py-1.5 text-xs border border-violet-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400"
                                              placeholder="0.00"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[9px] text-violet-600 font-medium mb-0.5">Sessions</label>
                                            <input
                                              type="number" min="1"
                                              value={sel.sessions}
                                              onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, sessions: parseInt(e.target.value) || 1 } : t))}
                                              className="w-full px-2 py-1.5 text-xs border border-violet-200 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-violet-400"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[9px] text-violet-600 font-medium mb-0.5">/Session</label>
                                            <div className="px-2 py-1.5 text-xs font-bold text-center bg-violet-100 rounded-md text-violet-700 border border-violet-200">
                                              â‚¹{sessPrice.toFixed(2)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Price Validation Summary */}
                                  <div className="grid grid-cols-3 gap-1.5 bg-violet-100 rounded-lg px-3 py-2.5">
                                    <div className="text-center">
                                      <p className="text-[9px] text-violet-600 font-medium mb-0.5">Pkg Price</p>
                                      <p className="text-xs font-bold text-violet-800">â‚¹{parseFloat(pkgModalPrice) || 0}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[9px] text-violet-600 font-medium mb-0.5">Allocated</p>
                                      <p className="text-xs font-bold text-violet-800">â‚¹{pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0).toFixed(2)}</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[9px] text-violet-600 font-medium mb-0.5">Remaining</p>
                                      <p className={`text-xs font-bold ${
                                        Math.abs((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)) < 0.01
                                          ? "text-teal-600" : "text-amber-600"
                                      }`}>
                                        â‚¹{((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)).toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Error/Success Messages */}
                            {pkgError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700">{pkgError}</p>
                              </div>
                            )}
                            {pkgSuccess && (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-xs text-green-700 font-medium">{pkgSuccess}</p>
                              </div>
                            )}

                            {/* Created Package Details Display */}
                            {createdPackage && (
                              <div className="mb-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-violet-600" />
                                    <h4 className="text-xs font-bold text-violet-800">Package Created</h4>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setCreatedPackage(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    <XIcon size={14} />
                                  </button>
                                </div>
                               
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600">Name:</span>
                                    <span className="text-xs font-semibold text-gray-900">{createdPackage.name || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-gray-600">Price:</span>
                                    <span className="text-xs font-bold text-violet-600">{getCurrencySymbol(currency)} {parseFloat(createdPackage.totalPrice || 0).toFixed(2)}</span>
                                  </div>

                                  {/* Validity Display */}
                                  {(createdPackage.validityInMonths || createdPackage.startDate || createdPackage.endDate) && (
                                    <div className="bg-white/50 rounded p-1.5 border border-violet-100 mt-1">
                                      <div className="flex items-center justify-between text-[9px] mb-1">
                                        <span className="text-violet-600 font-semibold flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          Validity: {createdPackage.validityInMonths || 0} Months
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                                        <div>
                                          <span className="text-gray-500">Start:</span>
                                          <span className="text-gray-700 font-bold ml-1">
                                            {createdPackage.startDate ? new Date(createdPackage.startDate).toLocaleDateString() : '-'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">End:</span>
                                          <span className="text-gray-700 font-bold ml-1">
                                            {createdPackage.endDate ? new Date(createdPackage.endDate).toLocaleDateString() : '-'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                 
                                  {(createdPackage.treatments || []).length > 0 && (
                                    <div className="border-t border-violet-200 pt-2 mt-2">
                                      <p className="text-[10px] font-semibold text-gray-600 mb-1.5">Included Treatments:</p>
                                      <div className="space-y-1">
                                        {(createdPackage.treatments || []).map((treatment: any, idx: number) => (
                                          <div key={idx} className="flex items-center justify-between text-[10px]">
                                            <span className="text-gray-700 truncate flex-1">{treatment.treatmentName || "N/A"}</span>
                                            <span className="text-gray-600 ml-2">{treatment.sessions || 0} session{(treatment.sessions || 0) > 1 ? 's' : ''}</span>
                                            <span className="text-violet-600 font-semibold ml-2">{getCurrencySymbol(currency)} {(treatment.allocatedPrice || 0).toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                 
                                  <div className="flex gap-2 mt-2 pt-2 border-t border-violet-200">
                                    <button
                                      type="button"
                                      onClick={() => setCreatedPackage(null)}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-all"
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => handleCreatePackageModal(false)}
                                disabled={pkgSubmitting || addingPackageToPatient}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-violet-700 bg-white border border-violet-500 rounded-lg hover:bg-violet-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Package size={14} />
                                {pkgSubmitting ? "Creating..." : "Create Package"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreatePackageModal(true)}
                                disabled={pkgSubmitting || addingPackageToPatient}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                                {addingPackageToPatient ? "Adding..." : "Create & Add to Patient"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selected Services - Card Layout with Editable Prices */}
                        <div className="px-5 py-4">
                          {selectedServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Package className="w-10 h-10 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-600 mb-1">No services added yet</p>
                              <p className="text-xs text-gray-400 mb-4">Click "Add Service" to begin building your treatment plan</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddServiceDropdown(true);
                                  if (allServices.length === 0) fetchAllServices();
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md"
                              >
                                <Plus size={16} /> Browse Services
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Services Header */}
                              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900">Selected Treatments</span>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                    {selectedServices.length}
                                  </span>
                                </div>
                               
                              </div>

                              {/* Service Cards */}
                              {selectedServices.map((svc, i) => {
                                const isRecentlyAdded = recentlyAddedServices[svc._id] && (Date.now() - recentlyAddedServices[svc._id] < 3000);
                                return (
                                <div key={svc._id} className={`group relative rounded-xl border p-4 shadow-sm transition-all duration-500 ${isRecentlyAdded ? 'border-green-400 bg-green-50 shadow-md ring-2 ring-green-300' : 'border-gray-200 bg-white hover:shadow-md'}`}>
                                  {isRecentlyAdded && (
                                    <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-[10px] font-bold shadow-lg animate-bounce">
                                      <Check size={10} />
                                      <span>Just Added</span>
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      {/* Icon */}
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border ${isRecentlyAdded ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'}`}>
                                        <Package className={`w-6 h-6 ${isRecentlyAdded ? 'text-green-600' : 'text-blue-600'}`} />
                                      </div>
                                                                   
                                      {/* Info */}
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-bold text-gray-900">{svc.name}</h4>
                                          {isRecentlyAdded ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                              Smart Recommendation
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                              Standard
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">Service #{i + 1} â€¢ ID: {svc._id.slice(-6)}</p>
                                                                                                       
                                        {/* Price Input */}
                                        <div className="flex items-center gap-2">
                                          <label className="text-xs text-gray-600 font-medium">Price:</label>
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                                              readOnly
                                              className="w-32 pl-9 pr-3 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                                                 
                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">
                                          {getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedServices((prev) => prev.filter((s) => s._id !== svc._id))}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        title="Remove service"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                );
                              })}

                              {/* Total Bill Value - Compact */}
                              <div className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-3 shadow-md">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                                      <ClipboardList className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-blue-100">Total Bill</p>
                                      <p className="text-[10px] text-blue-200">{selectedServices.length} {selectedServices.length === 1 ? 'treatment' : 'treatments'}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-white">{getCurrencySymbol(currency)} {totalBill.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

       {(smartDepartments.length > 0 || loadingSmartRec) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-800">Smart Recommendations</h3>
                            <span className="text-[10px] text-gray-400">Based on doctor's services</span>
                          </div>
                          {loadingSmartRec ? (
                            <div className="text-xs text-gray-400 py-2">Loading recommendations...</div>
                          ) : (
                            <div className="space-y-3">
                              {smartDepartments.map((dept) => (
                                <div key={dept._id}>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">{dept.name}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {dept.services.map((svc) => (
                                      <div key={svc._id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 shadow-sm">
                                        <span className="text-xs font-semibold text-gray-800">{svc.name}</span>
                                        <span className="text-xs text-blue-600 font-medium">{svc.clinicPrice != null ? `${getCurrencySymbol(currency)} ${svc.clinicPrice}` : `${getCurrencySymbol(currency)} ${svc.price}`}</span>
                                        <button type="button" disabled={addingRecService[`${details?.patientId}_${svc._id}`] || addedRecServices[`${details?.patientId}_${svc._id}`]}
                                          onClick={async () => {
                                            if (!details?.appointmentId || !details?.patientId) return;
                                           
                                            const patientServiceKey = `${details.patientId}_${svc._id}`;
                                           
                                            // 1. Add to selectedServices (so it appears in Treatment & Billing)
                                            const serviceToAdd = {
                                              _id: svc._id,
                                              name: svc.name,
                                              price: svc.price,
                                              clinicPrice: svc.clinicPrice,
                                              durationMinutes: svc.durationMinutes,
                                            } as ClinicService;
                                           
                                            setSelectedServices((prev) => [...prev, serviceToAdd]);
                                            setServicesSaved(false);
                                           
                                            // Track recently added service with timestamp for visual feedback
                                            setRecentlyAddedServices((prev) => ({ ...prev, [svc._id]: Date.now() }));
                                           
                                            // 2. Also save to appointment via API
                                            setAddingRecService((p) => ({ ...p, [patientServiceKey]: true }));
                                            try {
                                              await axios.patch(`/api/clinic/appointment-services/${details.appointmentId}`, { serviceIds: [svc._id] }, { headers: getAuthHeaders() });
                                              setAddedRecServices((p) => ({ ...p, [patientServiceKey]: true }));
                                              if (onSuccess) onSuccess();
                                            } catch (err: any) {
                                              // If API fails, remove from selectedServices
                                              setSelectedServices((prev) => prev.filter((s) => s._id !== svc._id));
                                              setRecentlyAddedServices((prev) => {
                                                const updated = { ...prev };
                                                delete updated[svc._id];
                                                return updated;
                                              });
                                            } finally {
                                              setAddingRecService((p) => ({ ...p, [patientServiceKey]: false }));
                                            }
                                          }}
                                          className={`flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-semibold transition-colors ${addedRecServices[`${details?.patientId}_${svc._id}`] ? "bg-green-100 text-green-700 cursor-default" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                                        >
                                          {addingRecService[`${details?.patientId}_${svc._id}`] ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : addedRecServices[`${details?.patientId}_${svc._id}`] ? <><Check size={10} /> Added</> : <><Plus size={10} /> Add</>}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}


                      {/* Stock Items */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Section Header */}
                        <div className="px-4 pt-4 pb-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">STOCK ITEMS</h3>
                            <button
                              type="button"
                              onClick={() => setIsOpenStockTransferModal(true)}
                              className="flex items-center gap-1.5 text-xs text-blue-600 px-3 py-1.5 rounded-lg border border-blue-300 hover:bg-blue-50 font-medium transition-colors"
                            >
                              <RefreshCw size={12} /> Stock Transfer Request
                            </button>
                          </div>
                          <p className="text-[11px] text-blue-500 mb-3">Add items related to this appointment</p>
                        </div>

                        {/* Input Form Card */}
                        <div className="mx-4 mb-3 border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                            {/* Item selector */}
                            <div className="relative" ref={allocatedDropdownRef}>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Item <span className="text-red-500">*</span></label>
                              <div
                                className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg flex items-center justify-between cursor-pointer bg-white h-10 hover:border-gray-400 transition-colors"
                                onClick={() => setIsAllocatedDropdownOpen(!isAllocatedDropdownOpen)}
                              >
                                <span className={currentItem.itemId ? "text-gray-800" : "text-gray-400"}>
                                  {allocatedItems.find((si: any) => si._id === currentItem.itemId)?.item?.name || "Select item"}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isAllocatedDropdownOpen ? "rotate-180" : ""}`} />
                              </div>
                              {isAllocatedDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                  <div className="p-2 border-b border-gray-100">
                                    <input type="text" placeholder="Search..." value={allocatedSearch} onChange={(e) => setAllocatedSearch(e.target.value)} autoFocus className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none" />
                                  </div>
                                  {fetchAllocatedItemsLoading ? (
                                    <div className="p-3 text-xs text-center text-gray-400">Loading...</div>
                                  ) : allocatedItems.length === 0 ? (
                                    <div className="p-3 text-center text-gray-400 text-xs">No items</div>
                                  ) : (
                                    <ul className="py-1">
                                      {allocatedItems.filter((si: any) => {
                                        const n = (si.item?.name || "").toLowerCase();
                                        const c = (si.item?.code || "").toLowerCase();
                                        const q = allocatedSearch.toLowerCase();
                                        return n.includes(q) || c.includes(q);
                                      }).map((si: any) => (
                                        <li key={si._id} className="px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
                                          onClick={() => { const it = si.item || {}; setCurrentItem((prev) => ({ ...prev, code: it.code || "", itemId: si._id || "", name: it.name || "", description: it.description || "", uom: it.uom || prev.uom || "" })); setIsAllocatedDropdownOpen(false); setAllocatedSearch(""); }}
                                        >
                                          <div className="font-medium">{si.item?.name || "-"}</div>
                                          {si.item?.code && <div className="text-[10px] text-gray-400">Code: {si.item.code}</div>}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                              <input
                                type="text"
                                value={currentItem.description || ""}
                                onChange={(e) => handleCurrentItemChange("description", e.target.value)}
                                placeholder="sample desc"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg h-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors"
                              />
                            </div>

                            {/* Qty */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Qty <span className="text-red-500">*</span></label>
                              <input
                                type="number"
                                min={1}
                                value={currentItem.quantity}
                                onChange={(e) => handleCurrentItemChange("quantity", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg h-10 focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors"
                              />
                              {currentItem.uom && (
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                  Available: {availableForSelectedUom} {currentItem.uom}
                                </p>
                              )}
                            </div>

                            {/* UOM */}
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">UOM <span className="text-red-500">*</span></label>
                              <select
                                value={currentItem.uom || ""}
                                onChange={(e) => handleCurrentItemChange("uom", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg h-10 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 hover:border-gray-400 transition-colors"
                              >
                                <option value="">Select UOM</option>
                                {(allocatedItems?.find((i) => i?._id === currentItem?.itemId)?.quantitiesByUom || []).map((i: any, idx: number) => (
                                  <option key={idx} value={i.uom}>{i.uom}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {exceedsAvailable && (
                            <p className="text-xs text-red-500 mb-3">Quantity exceeds available stock</p>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setCurrentItem({ itemId: "", code: "", name: "", description: "", quantity: 1, uom: "" })}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Trash2 size={13} /> Reset
                            </button>
                            <button
                              type="button"
                              onClick={addCurrentItem}
                              disabled={!currentItem.name.trim() || !currentItem.quantity || !currentItem.uom || exceedsAvailable}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors"
                            >
                              <Plus size={14} /> Add Item
                            </button>
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="mx-4 mb-4 rounded-lg overflow-hidden border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-900 text-white">
                                <th className="px-3 py-2.5 text-left font-semibold text-xs tracking-wide">SI NO</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-xs tracking-wide">ITEM</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-xs tracking-wide">DESCRIPTION</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-xs tracking-wide">QTY</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-xs tracking-wide">UOM</th>
                                <th className="px-3 py-2.5 text-left font-semibold text-xs tracking-wide">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {items.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-sm">No Items Added</td>
                                </tr>
                              ) : (
                                items.map((item, index) => {
                                  const isEditing = editIndex === index && editingItem;
                                  return (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-3 py-2.5 text-gray-500 font-medium">{index + 1}</td>
                                      <td className="px-3 py-2.5 font-medium text-gray-800">
                                        {isEditing ? (
                                          <select value={editingItem?.itemId || ""} onChange={(e) => handleEditingItemChange("itemId", e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-200 rounded">
                                            <option value="">Select Item</option>
                                            {allocatedItems.map((si: any) => <option key={si._id} value={si.item?.itemId || ""}>{si.item?.name || "-"}</option>)}
                                          </select>
                                        ) : item.name}
                                      </td>
                                      <td className="px-3 py-2.5 text-gray-600">
                                        {isEditing ? (
                                          <input type="text" value={editingItem?.description || ""} onChange={(e) => handleEditingItemChange("description", e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-200 rounded" placeholder="Description" />
                                        ) : (item.description || "-")}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {isEditing ? (
                                          <input type="number" min={1} value={editingItem?.quantity || 1} onChange={(e) => handleEditingItemChange("quantity", e.target.value)} className="w-16 px-2 py-1 text-xs border border-gray-200 rounded" />
                                        ) : item.quantity}
                                      </td>
                                      <td className="px-3 py-2.5 text-gray-600">
                                        {isEditing ? (
                                          <select value={editingItem?.uom || ""} onChange={(e) => handleEditingItemChange("uom", e.target.value)} className="w-24 px-2 py-1 text-xs border border-gray-200 rounded">
                                            <option value="">UOM</option>
                                            {(allocatedItems?.find((i) => i?._id === editingItem?.itemId)?.quantitiesByUom || []).map((i: any, idx: number) => <option key={idx} value={i.uom}>{i.uom}</option>)}
                                          </select>
                                        ) : (item.uom || "-")}
                                      </td>
                                      <td className="px-3 py-2.5">
                                        {isEditing ? (
                                          <div className="flex gap-1.5">
                                            <button type="button" onClick={saveEditItem} className="text-green-600 hover:text-green-800"><Check className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={cancelEditItem} className="text-gray-400 hover:text-gray-600"><XIcon className="w-3.5 h-3.5" /></button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-1.5">
                                            <button type="button" onClick={() => startEditItem(index)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-3.5 h-3.5" /></button>
                                            <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Consent Form Status */}
                      {consentStatuses.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-3">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" /> Consent Forms
                          </h3>
                          <div className="space-y-2">
                            {consentStatuses.map((consent) => (
                              <div
                                key={consent._id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  consent.status === "signed"
                                    ? "border-green-200 bg-green-50"
                                    : "border-blue-200 bg-blue-50"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-800">
                                      {consent.consentFormName}
                                    </p>
                                    {consent.status === "signed" && (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    )}
                                    {consent.status === "sent" && (
                                      <Send className="w-3.5 h-3.5 text-blue-600" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {consent.description || "Consent form"}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-gray-400">
                                      Patient: {consent.patientName}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      Date: {consent.date}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                      consent.status === "signed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {consent.status === "signed" ? "SIGNED" : "SENT"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clinical Checklist */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-600" /> Clinical Checklist</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {CHECKLIST_ITEMS.map((item) => (
                            <label key={item} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${checklist[item] ? "border-green-300 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                              <input type="checkbox" checked={checklist[item]} onChange={() => setChecklist((prev) => ({ ...prev, [item]: !prev[item] }))} className="w-3.5 h-3.5 rounded accent-green-500 cursor-pointer" />
                              <span className={`text-xs font-medium ${checklist[item] ? "text-green-700" : "text-gray-700"}`}>{item}</span>
                              {checklist[item] && <Check size={12} className="ml-auto text-green-500" />}
                            </label>
                          ))}
                        </div>
                        {checklistError && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                            <p className="text-xs text-red-700">{checklistError}</p>
                          </div>
                        )}
                      </div>

                 

                      {/* Previous Complaints */}
                      <div ref={previousComplaintsRef} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-blue-600" />
                            Previous Complaints
                            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">{previousComplaints.length}</span>
                          </h3>
                        </div>
                        {loadingComplaints ? (
                          <div className="py-6 text-center text-gray-400 text-sm">Loading...</div>
                        ) : previousComplaints.length === 0 ? (
                          <div className="py-6 text-center text-gray-400 text-sm">No previous complaints found.</div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {previousComplaints.map((complaint) => {
                              const hasItems = Array.isArray(complaint.items) && complaint.items.length > 0;
                              const isOpenC = !!expandedComplaints[complaint._id];
                              return (
                                <React.Fragment key={complaint._id}>
                                  <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words line-clamp-3">{complaint.complaints}</p>
                                        {(complaint.beforeImage || complaint.afterImage) && (
                                          <div className="flex gap-2 mt-2">
                                            {complaint.beforeImage && (() => {
                                              const cleanUrl = complaint.beforeImage.trim().replace(/^`|`$/g, "");
                                              return <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded border border-gray-200 overflow-hidden hover:opacity-80"><img src={cleanUrl} alt="Before" className="w-full h-full object-cover" /></a>
                                            })()}
                                            {complaint.afterImage && (() => {
                                              const cleanUrl = complaint.afterImage.trim().replace(/^`|`$/g, "");
                                              return <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded border border-gray-200 overflow-hidden hover:opacity-80"><img src={cleanUrl} alt="After" className="w-full h-full object-cover" /></a>
                                            })()}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                                          <span>{formatDateTime(complaint.createdAt)}</span>
                                          <span>Â·</span>
                                          <span>{typeof complaint.doctorId === "object" && complaint.doctorId?.name ? `Dr. ${complaint.doctorId.name}` : "Unknown Doctor"}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {hasItems && (
                                          <button type="button" onClick={() => setExpandedComplaints((prev) => ({ ...prev, [complaint._id]: !prev[complaint._id] }))} className="flex items-center gap-1 px-2 py-1 text-[11px] border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
                                            {isOpenC ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                            Items
                                          </button>
                                        )}
                                        {/* Always visible: View and Delete buttons */}
                                        <button type="button" onClick={() => { setSelectedComplaint(complaint); setIsOpenViewComplaintModal(true); }} className="p-1 text-blue-400 hover:text-blue-600"><Eye size={13} /></button>
                                        <button type="button" onClick={() => { setDeletedComplaint(complaint); setIsOpenDeleteComplaintModal(true); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                                        {/* Only within 24 hours: Edit button */}
                                        {new Date(complaint.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                                          <button type="button" onClick={() => { setEditingComplaint(complaint); setIsEditModalOpen(true); }} className="p-1 text-amber-400 hover:text-amber-600"><Edit2 size={13} /></button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {hasItems && isOpenC && (
                                    <div className="bg-gray-50 px-4 py-3">
                                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-600">Code</th>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-600">Item</th>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-600">Qty</th>
                                              <th className="px-3 py-2 text-left font-semibold text-gray-600">UOM</th>
                                              <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {complaint.items!.map((it, idx) => (
                                              <tr key={`${complaint._id}-${idx}`}>
                                                <td className="px-3 py-2 text-gray-500">{it.code || "-"}</td>
                                                <td className="px-3 py-2 font-medium text-gray-800">{it.name}</td>
                                                <td className="px-3 py-2 text-gray-700">{it.quantity}</td>
                                                <td className="px-3 py-2 text-gray-500">{it.uom || "-"}</td>
                                                <td className="px-3 py-2 text-right font-semibold text-gray-800">{it?.totalAmount || "0"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Stock Used */}
                      {previousComplaints.some((c) => Array.isArray(c.items) && c.items.length > 0) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-gray-500" /> Stock Used (All Sessions)</h3>
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50"><tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">UOM</th>
                              </tr></thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {previousComplaints.filter((c) => Array.isArray(c.items) && c.items.length > 0).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).flatMap((c) => (c.items as NonNullable<typeof c.items>).map((item, idx) => ({ date: c.createdAt, item, key: `${c._id}-${idx}` }))).map(({ date, item, key }) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-500">{new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                    <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-700">{item.quantity}</td>
                                    <td className="px-3 py-2 text-gray-500">{item.uom || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Appointments - Upcoming */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                          <ClipboardList className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Appointments</h3>
                        </div>
                        <div className="px-5 py-3">
                          {loadingUpcoming ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading appointments...
                            </div>
                          ) : filteredUpcomingAppointments.length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 text-center">No upcoming appointments</p>
                          ) : (
                            <div>
                              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-2">Upcoming</p>
                              <div className="space-y-2">
                                {filteredUpcomingAppointments.map((appt) => {
                                  const d = new Date(appt.startDate);
                                  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                  const [fh, fm] = appt.fromTime.split(":").map(Number);
                                  const ampm = fh < 12 ? "AM" : "PM";
                                  const h12 = fh % 12 || 12;
                                  const timeStr = `${h12}:${String(fm).padStart(2, "0")} ${ampm}`;
                                  const statusColor = appt.status === "booked" || appt.status === "Approved" ? "bg-blue-600 text-white" : appt.status === "Completed" ? "bg-green-100 text-green-700" : appt.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600";
                                  return (
                                    <div key={appt._id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-800">{appt.followType === "follow up" ? "Follow-up Session" : appt.followType === "first time" ? "First Visit" : appt.followType}</p>
                                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateStr}</span>
                                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
                                        </div>
                                      </div>
                                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md capitalize ${statusColor}`}>{appt.status}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Session Booking - Added to Complaints Section */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Next Session Booking</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Select Date</label>
                            <input
                              type="date"
                              value={nextSessionDate}
                              min={new Date().toISOString().slice(0, 10)}
                              onChange={(e) => { setNextSessionDate(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Select Time</label>
                            <select
                              value={nextSessionTime}
                              onChange={(e) => { setNextSessionTime(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            >
                              {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"].map((t) => {
                                const [h, m] = t.split(":").map(Number);
                                const ampm = h < 12 ? "AM" : "PM";
                                const h12 = h % 12 || 12;
                                return <option key={t} value={t}>{`${h12}:${String(m).padStart(2, "0")} ${ampm}`}</option>;
                              })}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1.5">Select Room</label>
                            <select
                              value={nextSessionRoom}
                              onChange={(e) => { setNextSessionRoom(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            >
                              <option value="">Select a room...</option>
                              {loadingRooms ? (
                                <option disabled>Loading rooms...</option>
                              ) : (
                                rooms.map((room) => (
                                  <option key={room._id} value={room._id}>{room.name}</option>
                                ))
                              )}
                            </select>
                          </div>
                        </div>
                        {nextSessionError && (
                          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-red-600 text-xs">{nextSessionError}</p>
                          </div>
                        )}
                        {nextSessionBooked && (
                          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <p className="text-green-700 text-xs font-medium">Session booked successfully!</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={bookNextSession}
                          disabled={bookingNextSession || nextSessionBooked}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors shadow-sm"
                        >
                          <Calendar size={15} />
                          {bookingNextSession ? "Booking..." : nextSessionBooked ? "Session Booked!" : "Book Next Session"}
                        </button>
                      </div>
                    </div>
                  )}


                      {/* â”€â”€ APPOINTMENTS CARD â”€â”€ */}
                 

                  {/* â”€â”€ PROGRESS TAB â”€â”€ */}
                  {activeTab === "progress" && (
                    <div className="space-y-4">
                      {progressError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{progressError}</div>
                      )}
                      {loadingProgressNotes ? (
                        <div className="py-8 text-center text-gray-400 text-sm">Loading progress notes...</div>
                      ) : (
                        <div className="relative">
                          {progressNotes.length > 0 && (
                            <div className="absolute left-[18px] top-5 bottom-5 w-px bg-gradient-to-b from-blue-400 to-blue-100" />
                          )}
                          <div className="space-y-4">
                            {progressNotes.map((entry) => {
                              const dateStr = entry.noteDate ? new Date(entry.noteDate).toISOString().slice(0, 10) : new Date(entry.createdAt).toISOString().slice(0, 10);
                              const doctorName = typeof entry.doctorId === "object" && entry.doctorId?.name ? entry.doctorId.name : null;
                              return (
                                <div key={entry._id} className="flex gap-4 items-start">
                                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500 border-4 border-white shadow-md flex items-center justify-center z-10">
                                    <TrendingUp size={14} className="text-white" />
                                  </div>
                                  <div className="flex-1 rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3 space-y-1">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-blue-600">{dateStr}</span>
                                      <div className="flex items-center gap-3">
                                        {doctorName && <span className="text-xs text-gray-400">{doctorName}</span>}
                                        <button type="button" onClick={async () => {
                                          try {
                                            const headers = getAuthHeaders();
                                            await axios.delete("/api/clinic/progress-notes", { headers, params: { noteId: entry._id } });
                                            setProgressNotes((prev) => prev.filter((n) => n._id !== entry._id));
                                          } catch { setProgressError("Failed to delete progress note"); }
                                        }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.note}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {addingNewEntry ? (
                        <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/60 px-4 py-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-blue-700 flex items-center gap-1"><Plus size={12} /> New Progress Entry</span>
                            <span className="text-xs text-blue-600">{newEntryDate}</span>
                          </div>
                          <textarea autoFocus value={newEntryText} onChange={(e) => setNewEntryText(e.target.value)} rows={4} placeholder="Describe patient's progress, treatment response, observations..." className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-blue-700 font-medium">Date:</label>
                              <input type="date" value={newEntryDate} onChange={(e) => setNewEntryDate(e.target.value)} className="border border-blue-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300" />
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => { setAddingNewEntry(false); setNewEntryText(""); setProgressError(""); }} className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                              <button type="button" disabled={savingProgress || !newEntryText.trim()}
                                onClick={async () => {
                                  if (!newEntryText.trim() || !details) return;
                                  setSavingProgress(true); setProgressError("");
                                  try {
                                    const headers = getAuthHeaders();
                                    const res = await axios.post("/api/clinic/progress-notes", { appointmentId: details.appointmentId, patientId: details.patientId, note: newEntryText.trim(), noteDate: newEntryDate }, { headers });
                                    if (res.data?.success && res.data.note) setProgressNotes((prev) => [res.data.note, ...prev]);
                                    setNewEntryText(""); setNewEntryDate(new Date().toISOString().slice(0, 10)); setAddingNewEntry(false);
                                  } catch (err: any) { setProgressError(err.response?.data?.message || "Failed to save progress note"); }
                                  finally { setSavingProgress(false); }
                                }}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                              >
                                {savingProgress ? <><RefreshCw size={12} className="animate-spin" /> Saving...</> : <><Check size={12} /> Save Entry</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setAddingNewEntry(true); setNewEntryDate(new Date().toISOString().slice(0, 10)); }}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors bg-white"
                        >
                          <Plus size={16} /> Add New Progress Note
                        </button>
                      )}

                      {/* Smart Recommendations in progress tab */}
                      {(smartDepartments.length > 0 || loadingSmartRec) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-800">Smart Recommendations</h3>
                          </div>
                          {loadingSmartRec ? (
                            <div className="text-xs text-gray-400 py-2">Loading...</div>
                          ) : (
                            <div className="space-y-2">
                              {smartDepartments.map((dept) => (
                                <div key={dept._id}>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{dept.name}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dept.services.map((svc) => (
                                      <div key={svc._id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                                        <span className="text-xs font-medium text-gray-700">{svc.name}</span>
                                        <span className="text-[10px] text-blue-600">{svc.clinicPrice != null ? `${getCurrencySymbol(currency)} ${svc.clinicPrice}` : `${getCurrencySymbol(currency)} ${svc.price}`}</span>
                                        <button type="button" disabled={addingRecService[`${details?.patientId}_${svc._id}`] || addedRecServices[`${details?.patientId}_${svc._id}`]}
                                          onClick={async () => {
                                            if (!details?.appointmentId || !details?.patientId) return;
                                           
                                            const patientServiceKey = `${details.patientId}_${svc._id}`;
                                           
                                            // 1. Add to selectedServices (so it appears in Treatment & Billing)
                                            const serviceToAdd = {
                                              _id: svc._id,
                                              name: svc.name,
                                              price: svc.price,
                                              clinicPrice: svc.clinicPrice,
                                              durationMinutes: svc.durationMinutes,
                                            } as ClinicService;
                                           
                                            setSelectedServices((prev) => [...prev, serviceToAdd]);
                                            setServicesSaved(false);
                                           
                                            // Track recently added service with timestamp for visual feedback
                                            setRecentlyAddedServices((prev) => ({ ...prev, [svc._id]: Date.now() }));
                                           
                                            // 2. Also save to appointment via API
                                            setAddingRecService((p) => ({ ...p, [patientServiceKey]: true }));
                                            try {
                                              await axios.patch(`/api/clinic/appointment-services/${details.appointmentId}`, { serviceIds: [svc._id] }, { headers: getAuthHeaders() });
                                              setAddedRecServices((p) => ({ ...p, [patientServiceKey]: true }));
                                              if (onSuccess) onSuccess();
                                            } catch (err: any) {
                                              // If API fails, remove from selectedServices
                                              setSelectedServices((prev) => prev.filter((s) => s._id !== svc._id));
                                              setRecentlyAddedServices((prev) => {
                                                const updated = { ...prev };
                                                delete updated[svc._id];
                                                return updated;
                                              });
                                            } finally {
                                              setAddingRecService((p) => ({ ...p, [patientServiceKey]: false }));
                                            }
                                          }}
                                          className={`flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-semibold transition-colors ${addedRecServices[`${details?.patientId}_${svc._id}`] ? "bg-green-100 text-green-700 cursor-default" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                                        >
                                          {addingRecService[`${details?.patientId}_${svc._id}`] ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : addedRecServices[`${details?.patientId}_${svc._id}`] ? <><Check size={10} /> Added</> : <><Plus size={10} /> Add</>}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Appointments - Upcoming */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                          <ClipboardList className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Appointments</h3>
                        </div>
                        <div className="px-5 py-3">
                          {loadingUpcoming ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading appointments...
                            </div>
                          ) : filteredUpcomingAppointments.length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 text-center">No upcoming appointments</p>
                          ) : (
                            <div>
                              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-2">Upcoming</p>
                              <div className="space-y-2">
                                {filteredUpcomingAppointments.map((appt) => {
                                  const d = new Date(appt.startDate);
                                  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                  const [fh, fm] = appt.fromTime.split(":").map(Number);
                                  const ampm = fh < 12 ? "AM" : "PM";
                                  const h12 = fh % 12 || 12;
                                  const timeStr = `${h12}:${String(fm).padStart(2, "0")} ${ampm}`;
                                  const statusColor = appt.status === "booked" || appt.status === "Approved" ? "bg-blue-600 text-white" : appt.status === "Completed" ? "bg-green-100 text-green-700" : appt.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600";
                                  return (
                                    <div key={appt._id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-800">{appt.followType === "follow up" ? "Follow-up Session" : appt.followType === "first time" ? "First Visit" : appt.followType}</p>
                                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateStr}</span>
                                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
                                        </div>
                                      </div>
                                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md capitalize ${statusColor}`}>{appt.status}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Session Booking */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Next Session Booking</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Select Date</label>
                            <input
                              type="date"
                              value={nextSessionDate}
                              min={new Date().toISOString().slice(0, 10)}
                              onChange={(e) => { setNextSessionDate(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Select Time</label>
                            <select
                              value={nextSessionTime}
                              onChange={(e) => { setNextSessionTime(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            >
                              {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"].map((t) => {
                                const [h, m] = t.split(":").map(Number);
                                const ampm = h < 12 ? "AM" : "PM";
                                const h12 = h % 12 || 12;
                                return <option key={t} value={t}>{`${h12}:${String(m).padStart(2, "0")} ${ampm}`}</option>;
                              })}
                            </select>
                          </div>
                        </div>
                        {nextSessionError && (
                          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200">
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <p className="text-red-600 text-xs">{nextSessionError}</p>
                          </div>
                        )}
                        {nextSessionBooked && (
                          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <p className="text-green-700 text-xs font-medium">Session booked successfully!</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={bookNextSession}
                          disabled={bookingNextSession || nextSessionBooked}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors shadow-sm"
                        >
                          <Calendar size={15} />
                          {bookingNextSession ? "Booking..." : nextSessionBooked ? "Session Booked!" : "Book Next Session"}
                        </button>
                      </div>

                      {/* â”€â”€ DIVIDER â”€â”€ */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Summary</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      {/* Treatment & Billing - Full Interactive (Progress Notes) */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-gray-900">Treatment & Billing</h3>
                              <p className="text-xs text-gray-500">Add and manage treatment services</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddServiceDropdown(true);
                                setShowCreatePackage(false);
                                setServicesSaved(false);
                                setServicesError("");
                                if (allServices.length === 0) fetchAllServices();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                            >
                              <Plus size={16} /> Add Service
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreatePackage(true);
                                setShowAddServiceDropdown(false);
                                setPkgError("");
                                setPkgSuccess("");
                                if (allServices.length === 0) fetchAllServices();
                                if (pkgTreatments.length === 0) fetchPkgTreatments();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                              <Package size={16} /> Create Package
                            </button>
                          </div>
                        </div>

                        {/* Add Service Panel */}
                        {showAddServiceDropdown && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Search className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-bold text-blue-800">Search & Add Services</span>
                              </div>
                              <button type="button" onClick={() => setShowAddServiceDropdown(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon size={16} /></button>
                            </div>
                            <div className="relative mb-3">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search by service name..."
                                value={serviceSearchQuery}
                                onChange={(e) => setServiceSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 rounded-lg border border-gray-200 bg-white p-2">
                              {loadingServices ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                  <span className="ml-2 text-sm text-gray-500">Loading services...</span>
                                </div>
                              ) : allServices.filter((s) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <Package className="w-12 h-12 text-gray-300 mb-2" />
                                  <p className="text-sm text-gray-500 font-medium">No services found</p>
                                </div>
                              ) : (
                                allServices.filter((s) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((svc) => {
                                  const isSelected = selectedServices.some((s) => s._id === svc._id);
                                  return (
                                    <button key={svc._id} type="button"
                                      onClick={() => { setSelectedServices((prev) => isSelected ? prev.filter((s) => s._id !== svc._id) : [...prev, svc]); setServicesSaved(false); }}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                                        isSelected ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                                        }`}>
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? "text-blue-800" : "text-gray-700"}`}>{svc.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}</span>
                                        {isSelected && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Added</span>}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                            {/* Services save status - hidden as services are saved with complaint */}
                            {false && servicesError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700">{servicesError}</p>
                              </div>
                            )}
                            {false && servicesSaved && (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-xs text-green-700 font-medium">Services saved successfully!</p>
                              </div>
                            )}
                            {/* Save Services button - hidden as services are saved automatically with complaint */}
                            {false && (
                              <button type="button" onClick={saveServicesToAppointment}
                                disabled={savingServices || selectedServices.length === 0}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                              >
                                {savingServices ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><CheckCircle className="w-4 h-4" />Save Services to Appointment</>)}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Create Package Panel */}
                        {showCreatePackage && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-bold text-violet-800">Create New Package</span>
                              </div>
                              <button type="button" onClick={() => { setShowCreatePackage(false); setPkgError(""); setPkgSuccess(""); setPkgModalName(""); setPkgModalPrice(""); setPkgModalValidityInMonths(""); setPkgModalStartDate(new Date().toISOString().split('T')[0]); setPkgModalEndDate(""); setPkgSelectedTreatments([]); }} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon size={16} /></button>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Package Name <span className="text-red-500">*</span></label>
                              <input type="text" value={pkgModalName} onChange={(e) => setPkgModalName(e.target.value)} placeholder="e.g., Premium Skin Care Package" className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm" />
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Total Package Price <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                <input type="number" min="0" step="0.01" value={pkgModalPrice} onChange={(e) => setPkgModalPrice(e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-2 text-sm font-semibold border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm" />
                              </div>
                            </div>

                            {/* Validity & Dates */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">Validity (Months)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={pkgModalValidityInMonths}
                                  onChange={(e) => setPkgModalValidityInMonths(e.target.value)}
                                  placeholder="e.g. 12"
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">Start Date</label>
                                <input
                                  type="date"
                                  value={pkgModalStartDate}
                                  onChange={(e) => setPkgModalStartDate(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">End Date</label>
                                <input
                                  type="date"
                                  value={pkgModalEndDate}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-violet-50 text-violet-700 cursor-not-allowed shadow-sm"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Select Treatments / Services <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <div className="w-full px-4 py-2.5 text-sm border border-violet-200 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-violet-300 transition-colors shadow-sm"
                                  onClick={() => { setPkgTreatmentDropdownOpen(!pkgTreatmentDropdownOpen); if (!pkgTreatmentDropdownOpen && allServices.length === 0) fetchAllServices(); }}>
                                  <span className={pkgSelectedTreatments.length > 0 ? "text-gray-800 font-medium" : "text-gray-400"}>
                                    {pkgSelectedTreatments.length > 0 ? `${pkgSelectedTreatments.length} treatment${pkgSelectedTreatments.length > 1 ? "s" : ""} selected` : "Select treatments to include..."}
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${pkgTreatmentDropdownOpen ? "rotate-180" : ""}`} />
                                </div>
                                {pkgTreatmentDropdownOpen && (
                                  <div className="absolute z-20 w-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-violet-100 sticky top-0 bg-white">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" value={pkgTreatmentSearch} onChange={(e) => setPkgTreatmentSearch(e.target.value)} placeholder="Search treatments..." autoFocus className="w-full pl-9 pr-3 py-2 text-sm border border-violet-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                      </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-52">
                                      {loadingServices ? (
                                        <div className="flex items-center justify-center p-4"><Loader2 className="w-5 h-5 text-violet-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
                                      ) : allServices.filter((s) => s.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase())).length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">No treatments found</div>
                                      ) : (
                                        <ul className="py-1">
                                          {allServices.filter((svc) => svc.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase())).map((svc) => {
                                            const isSelected = pkgSelectedTreatments.some((t) => t.treatmentSlug === svc._id);
                                            return (
                                              <li key={svc._id}>
                                                <button type="button"
                                                  onClick={() => {
                                                    if (isSelected) { setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== svc._id)); }
                                                    else { setPkgSelectedTreatments((prev) => [...prev, { treatmentName: svc.name, treatmentSlug: svc._id, sessions: 1, allocatedPrice: svc.clinicPrice != null ? svc.clinicPrice : svc.price }]); }
                                                  }}
                                                  className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-violet-50 transition-colors ${isSelected ? "bg-violet-50" : ""}`}
                                                >
                                                  <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"}`}>
                                                      {isSelected && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <div className="text-left">
                                                      <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                                                      <p className="text-xs text-gray-500">{getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)} â€¢ {svc.durationMinutes} mins</p>
                                                    </div>
                                                  </div>
                                                </button>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {pkgSelectedTreatments.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold text-violet-700">Selected Treatments</p>
                                    {pkgSelectedTreatments.map((sel) => {
                                      const sessPrice = sel.sessions > 0 ? (sel.allocatedPrice || 0) / sel.sessions : 0;
                                      return (
                                        <div key={sel.treatmentSlug} className="bg-white border border-violet-200 rounded-lg p-2.5 shadow-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-violet-700">{sel.treatmentName}</span>
                                            <button type="button" onClick={() => setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== sel.treatmentSlug))} className="text-red-400 hover:text-red-600 transition-colors"><XIcon size={13} /></button>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <div>
                                              <label className="block text-[9px] text-violet-600 font-medium mb-0.5">Price</label>
                                              <input type="number" min="0" step="0.01" value={sel.allocatedPrice || ""} onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, allocatedPrice: parseFloat(e.target.value) || 0 } : t))} className="w-full px-2 py-1.5 text-xs border border-violet-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400" placeholder="0.00" />
                                            </div>
                                            <div>
                                              <label className="block text-[9px] text-violet-600 font-medium mb-0.5">Sessions</label>
                                              <input type="number" min="1" value={sel.sessions} onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, sessions: parseInt(e.target.value) || 1 } : t))} className="w-full px-2 py-1.5 text-xs border border-violet-200 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-violet-400" />
                                            </div>
                                            <div>
                                              <label className="block text-[9px] text-violet-600 font-medium mb-0.5">/Session</label>
                                              <div className="px-2 py-1.5 text-xs font-bold text-center bg-violet-100 rounded-md text-violet-700 border border-violet-200">â‚¹{sessPrice.toFixed(2)}</div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-violet-100 rounded-lg px-3 py-2.5">
                                      <div className="text-center">
                                        <p className="text-[9px] text-violet-600 font-medium mb-0.5">Pkg Price</p>
                                        <p className="text-xs font-bold text-violet-800">â‚¹{parseFloat(pkgModalPrice) || 0}</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[9px] text-violet-600 font-medium mb-0.5">Allocated</p>
                                        <p className="text-xs font-bold text-violet-800">â‚¹{pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0).toFixed(2)}</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[9px] text-violet-600 font-medium mb-0.5">Remaining</p>
                                        <p className={`text-xs font-bold ${Math.abs((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)) < 0.01 ? "text-teal-600" : "text-amber-600"}`}>
                                          â‚¹{((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {pkgError && (<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-red-700">{pkgError}</p></div>)}
                            {pkgSuccess && (<div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><p className="text-xs text-green-700 font-medium">{pkgSuccess}</p></div>)}
                            <div className="flex gap-3">
                              <button type="button" onClick={() => handleCreatePackageModal(false)} disabled={pkgSubmitting || addingPackageToPatient} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-violet-700 bg-white border border-violet-500 rounded-lg hover:bg-violet-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <Package size={14} />{pkgSubmitting ? "Creating..." : "Create Package"}
                              </button>
                              <button type="button" onClick={() => handleCreatePackageModal(true)} disabled={pkgSubmitting || addingPackageToPatient} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={14} />{addingPackageToPatient ? "Adding..." : "Create & Add to Patient"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selected Services */}
                        <div className="px-5 py-4">
                          {selectedServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Package className="w-10 h-10 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-600 mb-1">No services added yet</p>
                              <p className="text-xs text-gray-400 mb-4">Click "Add Service" to begin building your treatment plan</p>
                              <button type="button" onClick={() => { setShowAddServiceDropdown(true); if (allServices.length === 0) fetchAllServices(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md">
                                <Plus size={16} /> Browse Services
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900">Selected Treatments</span>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{selectedServices.length}</span>
                                </div>
                              </div>
                              {selectedServices.map((svc, i) => (
                                <div key={svc._id} className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                                        <Package className="w-6 h-6 text-blue-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-bold text-gray-900">{svc.name}</h4>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Standard</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">Service #{i + 1} â€¢ ID: {svc._id.slice(-6)}</p>
                                        <div className="flex items-center gap-2">
                                          <label className="text-xs text-gray-600 font-medium">Price:</label>
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                            <input type="number" min="0" step="0.01" value={(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                                              readOnly
                                              className="w-32 pl-9 pr-3 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}</p>
                                      </div>
                                      <button type="button" onClick={() => setSelectedServices((prev) => prev.filter((s) => s._id !== svc._id))} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Remove service"><Trash2 size={16} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-3 shadow-md">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-white" /></div>
                                    <div>
                                      <p className="text-xs font-medium text-blue-100">Total Bill</p>
                                      <p className="text-[10px] text-blue-200">{selectedServices.length} {selectedServices.length === 1 ? "treatment" : "treatments"}</p>
                                    </div>
                                  </div>
                                  <p className="text-lg font-bold text-white">{getCurrencySymbol(currency)} {totalBill.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clinical Checklist (read-only) */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-blue-600" /> Clinical Checklist
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {CHECKLIST_ITEMS.map((item) => (
                            <label key={item} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${checklist[item] ? "border-green-300 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                              <input type="checkbox" checked={checklist[item]} onChange={() => setChecklist((prev) => ({ ...prev, [item]: !prev[item] }))} className="w-3.5 h-3.5 rounded accent-green-500 cursor-pointer" />
                              <span className={`text-xs font-medium ${checklist[item] ? "text-green-700" : "text-gray-700"}`}>{item}</span>
                              {checklist[item] && <Check size={12} className="ml-auto text-green-500" />}
                            </label>
                          ))}
                        </div>
                        {checklistError && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                            <p className="text-xs text-red-700">{checklistError}</p>
                          </div>
                        )}
                      </div>

                      {/* Stock Used (All Sessions) */}
                      {previousComplaints.some((c) => Array.isArray(c.items) && c.items.length > 0) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-gray-500" /> Stock Used (All Sessions)</h3>
                          <div className="rounded-lg border border-gray-100 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50"><tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">UOM</th>
                              </tr></thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {previousComplaints.filter((c) => Array.isArray(c.items) && c.items.length > 0).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).flatMap((c) => (c.items as NonNullable<typeof c.items>).map((item, idx) => ({ date: c.createdAt, item, key: `progress-${c._id}-${idx}` }))).map(({ date, item, key }) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-gray-500">{new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                    <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-700">{item.quantity}</td>
                                    <td className="px-3 py-2 text-gray-500">{item.uom || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* â”€â”€ PRESCRIPTION TAB â”€â”€ */}
                  {activeTab === "prescription" && (
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-800">Prescribed Medicines <span className="text-red-500">*</span></h3>
                          <button type="button" onClick={() => setMedicines((prev) => [...prev, emptyMedicine()])}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                          >
                            <Plus size={13} /> Add Medicine
                          </button>
                        </div>
                        <div className="space-y-2">
                          {medicines.map((med) => (
                            <div key={med.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-sm">
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Medicine <span className="text-red-500">*</span></label>
                                <input type="text" value={med.medicineName} onChange={(e) => setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, medicineName: e.target.value } : m))} placeholder="Medicine name (required)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-400" />
                              </div>
                              <div className="flex flex-col gap-0.5 w-full sm:w-28">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Dosage</label>
                                <input type="text" value={med.dosage} onChange={(e) => setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, dosage: e.target.value } : m))} placeholder="2x/day" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                              </div>
                              <div className="flex flex-col gap-0.5 w-full sm:w-24">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Duration</label>
                                <input type="text" value={med.duration} onChange={(e) => setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, duration: e.target.value } : m))} placeholder="7 days" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                              </div>
                              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase">Notes</label>
                                <input type="text" value={med.notes} onChange={(e) => setMedicines((prev) => prev.map((m) => m.id === med.id ? { ...m, notes: e.target.value } : m))} placeholder="After meals" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                              </div>
                              <button type="button" onClick={() => { if (medicines.length === 1) { setMedicines([emptyMedicine()]); } else { setMedicines((prev) => prev.filter((m) => m.id !== med.id)); } }} className="mt-4 sm:mt-0 text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 size={15} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Aftercare Instructions</h3>
                        <textarea value={aftercareInstructions} onChange={(e) => setAftercareInstructions(e.target.value)} rows={4} placeholder="Enter aftercare instructions..." className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
                      </div>

                      <div className="flex items-center gap-3">
                        <button type="button" role="switch" aria-checked={includeInPdf} onClick={() => setIncludeInPdf((v) => !v)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${includeInPdf ? "bg-blue-500" : "bg-gray-300"}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${includeInPdf ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                        <span className="text-sm text-gray-700 font-medium">Include in patient PDF</span>
                      </div>

                      {prescriptionError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{prescriptionError}</div>}
                      {prescriptionSaved && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2"><Check size={14} /> Prescription saved.</div>}
                      {medicines.some((m) => !m.medicineName.trim()) && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
                          <AlertCircle size={14} />
                          Please fill in all medicine names (marked with *) before saving.
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        <button type="button" disabled={savingPrescription || medicines.every((m) => !m.medicineName.trim())}
                          onClick={async () => {
                            const validMeds = medicines.filter((m) => m.medicineName.trim());
                            if (!validMeds.length || !details) return;
                            setSavingPrescription(true); setPrescriptionError(""); setPrescriptionSaved(false);
                            try {
                              const headers = getAuthHeaders();
                              await axios.post("/api/clinic/prescriptions", { appointmentId: details.appointmentId, patientId: details.patientId, medicines: validMeds, aftercareInstructions, includeInPdf }, { headers });
                              setPrescriptionSaved(true);
                              const histRes = await axios.get("/api/clinic/prescriptions", { headers, params: { patientId: details.patientId } });
                              if (histRes.data?.success) setPrescriptionHistory(histRes.data.prescriptions || []);
                            } catch (err: any) { setPrescriptionError(err.response?.data?.message || "Failed to save prescription"); }
                            finally { setSavingPrescription(false); }
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                        >
                          {savingPrescription ? <><RefreshCw size={13} className="animate-spin" /> Saving...</> : <><Check size={13} /> Save Prescription</>}
                        </button>
                        <button type="button" disabled={medicines.every((m) => !m.medicineName.trim())} onClick={() => {
                          const validMeds = medicines.filter((m) => m.medicineName.trim());
                          if (!validMeds.length || !details) return;
                         
                          const doc = new jsPDF();
                          const pageWidth = doc.internal.pageSize.getWidth();
                         
                          // Header - Clinic Name
                          doc.setFontSize(18);
                          doc.setFont("helvetica", "bold");
                          doc.text("PRESCRIPTION", pageWidth / 2, 20, { align: "center" });
                         
                          // Patient Information
                          doc.setFontSize(12);
                          doc.setFont("helvetica", "normal");
                          doc.text(`Patient Name: ${details.patientName || "N/A"}`, 20, 35);
                          doc.text(`Doctor: Dr. ${details.doctorName || "N/A"}`, 20, 43);
                          const appointmentDate = details.startDate ? new Date(details.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
                          const appointmentTime = details.fromTime || "N/A";
                          doc.text(`Date: ${appointmentDate} at ${appointmentTime}`, 20, 51);
                         
                          // Divider line
                          doc.setLineWidth(0.5);
                          doc.line(20, 58, pageWidth - 20, 58);
                         
                          // Prescribed Medicines Section
                          doc.setFontSize(14);
                          doc.setFont("helvetica", "bold");
                          doc.text("Prescribed Medicines", 20, 68);
                         
                          // Medicines table header
                          doc.setFontSize(10);
                          doc.setFont("helvetica", "bold");
                          doc.setFillColor(240, 240, 240);
                          doc.rect(20, 73, pageWidth - 40, 8, "F");
                          doc.text("#", 22, 78);
                          doc.text("Medicine", 30, 78);
                          doc.text("Dosage", 90, 78);
                          doc.text("Duration", 120, 78);
                          doc.text("Notes", 150, 78);
                         
                          // Medicines table rows
                          doc.setFont("helvetica", "normal");
                          let yPos = 83;
                          validMeds.forEach((med, index) => {
                            doc.text(String(index + 1), 22, yPos);
                            doc.text(med.medicineName || "-", 30, yPos);
                            doc.text(med.dosage || "-", 90, yPos);
                            doc.text(med.duration || "-", 120, yPos);
                            doc.text(med.notes || "-", 150, yPos);
                            yPos += 8;
                          });
                         
                          // Aftercare Instructions Section
                          if (aftercareInstructions.trim()) {
                            yPos += 10;
                            doc.setFontSize(14);
                            doc.setFont("helvetica", "bold");
                            doc.text("Aftercare Instructions", 20, yPos);
                            yPos += 8;
                           
                            doc.setFontSize(10);
                            doc.setFont("helvetica", "normal");
                            const aftercareLines = doc.splitTextToSize(aftercareInstructions, pageWidth - 40);
                            doc.text(aftercareLines, 20, yPos);
                          }
                         
                          // Footer
                          doc.setFontSize(8);
                          doc.setTextColor(128, 128, 128);
                          doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: "center" });
                         
                          // Save the PDF
                          doc.save(`Prescription_${details.patientName?.replace(/\s+/g, "_") || "Patient"}_${new Date().toISOString().split("T")[0]}.pdf`);
                        }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900 disabled:opacity-40 shadow-sm"><FileText size={13} /> Generate PDF</button>
                        <button 
                          type="button" 
                          disabled={medicines.every((m) => !m.medicineName.trim()) || sendMsgLoading} 
                          onClick={async () => {
                            const validMeds = medicines.filter((m) => m.medicineName.trim());
                            if (!validMeds.length || !details) return;
                           
                            // Show loader immediately on click
                            setSendMsgLoading(true);
                           
                            try {
                              const headers = getAuthHeaders();
                             
                              // Generate PDF
                              const doc = new jsPDF();
                              const pageWidth = doc.internal.pageSize.getWidth();
                             
                              doc.setFontSize(18);
                              doc.setFont("helvetica", "bold");
                              doc.text("PRESCRIPTION", pageWidth / 2, 20, { align: "center" });
                             
                              doc.setFontSize(12);
                              doc.setFont("helvetica", "normal");
                              doc.text(`Patient Name: ${details.patientName || "N/A"}`, 20, 35);
                              doc.text(`Doctor: Dr. ${details.doctorName || "N/A"}`, 20, 43);
                              const appointmentDate = details.startDate ? new Date(details.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";
                              const appointmentTime = details.fromTime || "N/A";
                              doc.text(`Date: ${appointmentDate} at ${appointmentTime}`, 20, 51);
                             
                              doc.setLineWidth(0.5);
                              doc.line(20, 58, pageWidth - 20, 58);
                             
                              doc.setFontSize(14);
                              doc.setFont("helvetica", "bold");
                              doc.text("Prescribed Medicines", 20, 68);
                             
                              doc.setFontSize(10);
                              doc.setFont("helvetica", "bold");
                              doc.setFillColor(240, 240, 240);
                              doc.rect(20, 73, pageWidth - 40, 8, "F");
                              doc.text("#", 22, 78);
                              doc.text("Medicine", 30, 78);
                              doc.text("Dosage", 90, 78);
                              doc.text("Duration", 120, 78);
                              doc.text("Notes", 150, 78);
                             
                              doc.setFont("helvetica", "normal");
                              let yPos = 83;
                              validMeds.forEach((med, index) => {
                                doc.text(String(index + 1), 22, yPos);
                                doc.text(med.medicineName || "-", 30, yPos);
                                doc.text(med.dosage || "-", 90, yPos);
                                doc.text(med.duration || "-", 120, yPos);
                                doc.text(med.notes || "-", 150, yPos);
                                yPos += 8;
                              });
                             
                              if (aftercareInstructions.trim()) {
                                yPos += 10;
                                doc.setFontSize(14);
                                doc.setFont("helvetica", "bold");
                                doc.text("Aftercare Instructions", 20, yPos);
                                yPos += 8;
                               
                                doc.setFontSize(10);
                                doc.setFont("helvetica", "normal");
                                const aftercareLines = doc.splitTextToSize(aftercareInstructions, pageWidth - 40);
                                doc.text(aftercareLines, 20, yPos);
                              }
                             
                              doc.setFontSize(8);
                              doc.setTextColor(128, 128, 128);
                              doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: "center" });
                             
                              // Convert PDF to base64
                              const pdfBase64 = doc.output("datauristring");
                             
                              // Upload PDF to server using FormData
                              const pdfFileName = `Prescription_${details.patientName?.replace(/\s+/g, "_") || "Patient"}_${Date.now()}.pdf`;
                              const formData = new FormData();
                             
                              // Convert base64 to blob
                              const base64Response = await fetch(pdfBase64);
                              const pdfBlob = await base64Response.blob();
                              formData.append("file", pdfBlob, pdfFileName);
                             
                              const uploadRes = await axios.post("/api/upload", formData, {
                                headers: {
                                  ...headers,
                                  "Content-Type": "multipart/form-data",
                                },
                              });
                             
                              let pdfUrl = "";
                              if (uploadRes.data?.url) {
                                pdfUrl = uploadRes.data.url;
                              } else if (uploadRes.data?.success && uploadRes.data?.fileUrl) {
                                pdfUrl = uploadRes.data.fileUrl;
                              }
                             
                              // Save prescription with PDF URL
                              const saveRes = await axios.post("/api/clinic/prescriptions", {
                                appointmentId: details.appointmentId,
                                patientId: details.patientId,
                                medicines: validMeds,
                                aftercareInstructions,
                                includeInPdf: true,
                                pdfUrl,
                              }, { headers });
                             
                              if (pdfUrl) {
                                // Generate public prescription link
                                const baseUrl = window.location.origin;
                                const prescriptionId = saveRes.data?.prescription?._id;
                                const prescriptionLink = prescriptionId ? `${baseUrl}/prescription/${prescriptionId}` : pdfUrl;
                               
                                // Log the prescription link to console
                                console.log("=== PRESCRIPTION LINK GENERATED ===");
                                console.log("Prescription Link:", prescriptionLink);
                                console.log("Prescription ID:", prescriptionId);
                                console.log("Base URL:", baseUrl);
                                console.log("PDF URL:", pdfUrl);
                                console.log("===================================");
                               
                                // Send WhatsApp message using the dedicated function
                                await handleSendPrescriptionWhatsapp(prescriptionLink);
                              } else {
                                toast.error(
                                  <div className="flex flex-col gap-1">
                                    <span className="font-semibold">âš  Upload Failed</span>
                                    <span className="text-xs opacity-80">Prescription saved but failed to send WhatsApp message.</span>
                                  </div>,
                                  {
                                    duration: 4000,
                                    position: 'top-center',
                                    style: {
                                      background: '#ef4444',
                                      color: '#fff',
                                      padding: '16px',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                      zIndex: 9999,
                                      maxWidth: '500px',
                                    },
                                    iconTheme: {
                                      primary: '#fff',
                                      secondary: '#ef4444',
                                    },
                                  }
                                );
                              }
                            } catch (err: any) {
                              console.error("Error sending prescription:", err);
                              toast.error(
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold">âš  Send Failed</span>
                                  <span className="text-xs opacity-80">{err.response?.data?.message || "Failed to send prescription via WhatsApp"}</span>
                                </div>,
                                {
                                  duration: 4000,
                                  position: 'top-center',
                                  style: {
                                    background: '#ef4444',
                                    color: '#fff',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                    zIndex: 9999,
                                    maxWidth: '500px',
                                  },
                                  iconTheme: {
                                    primary: '#fff',
                                    secondary: '#ef4444',
                                  },
                                }
                              );
                            }
                          }} 
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40"
                        >
                          {sendMsgLoading ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" /> Sending...
                            </>
                          ) : (
                            <>
                              <Send size={13} /> Send via WhatsApp
                            </>
                          )}
                        </button>
                      </div>

                      {/* Prescription History */}
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Pill size={14} className="text-blue-500" />
                          Prescription History
                          {prescriptionHistory.length > 0 && <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">{prescriptionHistory.length}</span>}
                        </h3>
                        {loadingPrescriptionHistory ? (
                          <div className="py-6 text-center text-gray-400 text-sm">Loading...</div>
                        ) : prescriptionHistory.length === 0 ? (
                          <div className="py-6 text-center text-gray-400 text-sm">No prescription history found.</div>
                        ) : (
                          <div className="space-y-2">
                            {prescriptionHistory.map((entry) => {
                              const isExpanded = !!expandedPrescription[entry._id];
                              const doctorName = typeof entry.doctorId === "object" && entry.doctorId?.name ? entry.doctorId.name : null;
                              return (
                                <div key={entry._id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                  <button type="button" onClick={() => setExpandedPrescription((prev) => ({ ...prev, [entry._id]: !prev[entry._id] }))} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200"><Pill size={10} />{entry.medicines.length} medicine{entry.medicines.length !== 1 ? "s" : ""}</span>
                                      <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} />{new Date(entry.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                                      {doctorName && <span className="text-xs text-gray-400">Dr. {doctorName}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button type="button" onClick={async (e) => { e.stopPropagation(); try { const headers = getAuthHeaders(); await axios.delete("/api/clinic/prescriptions", { headers, params: { prescriptionId: entry._id } }); setPrescriptionHistory((prev) => prev.filter((p) => p._id !== entry._id)); } catch { setPrescriptionError("Failed to delete prescription"); } }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                    </div>
                                  </button>
                                  {isExpanded && (
                                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
                                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="w-full text-xs">
                                          <thead className="bg-gray-100"><tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">#</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">Medicine</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">Dosage</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">Duration</th>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-500">Notes</th>
                                          </tr></thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {entry.medicines.map((med, mIdx) => (
                                              <tr key={med._id || mIdx}>
                                                <td className="px-3 py-2 text-gray-400">{mIdx + 1}</td>
                                                <td className="px-3 py-2 font-medium text-gray-800">{med.medicineName}</td>
                                                <td className="px-3 py-2 text-gray-500">{med.dosage || "â€”"}</td>
                                                <td className="px-3 py-2 text-gray-500">{med.duration || "â€”"}</td>
                                                <td className="px-3 py-2 text-gray-500">{med.notes || "â€”"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {entry.aftercareInstructions && (
                                        <div>
                                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Aftercare Instructions</p>
                                          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-lg border border-gray-200 px-3 py-2">{entry.aftercareInstructions}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Smart Recommendations in prescription tab */}
                      {(smartDepartments.length > 0 || loadingSmartRec) && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                            <h3 className="text-sm font-semibold text-gray-800">Smart Recommendations</h3>
                          </div>
                          {loadingSmartRec ? (
                            <div className="text-xs text-gray-400 py-2">Loading...</div>
                          ) : (
                            <div className="space-y-2">
                              {smartDepartments.map((dept) => (
                                <div key={dept._id}>
                                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{dept.name}</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dept.services.map((svc) => (
                                      <div key={svc._id} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                                        <span className="text-xs font-medium text-gray-700">{svc.name}</span>
                                        <span className="text-[10px] text-blue-600">{svc.clinicPrice != null ? `${getCurrencySymbol(currency)} ${svc.clinicPrice}` : `${getCurrencySymbol(currency)} ${svc.price}`}</span>
                                        <button type="button" disabled={addingRecService[`${details?.patientId}_${svc._id}`] || addedRecServices[`${details?.patientId}_${svc._id}`]}
                                          onClick={async () => {
                                            if (!details?.appointmentId || !details?.patientId) return;
                                           
                                            const patientServiceKey = `${details.patientId}_${svc._id}`;
                                           
                                            // 1. Add to selectedServices (so it appears in Treatment & Billing)
                                            const serviceToAdd = {
                                              _id: svc._id,
                                              name: svc.name,
                                              price: svc.price,
                                              clinicPrice: svc.clinicPrice,
                                              durationMinutes: svc.durationMinutes,
                                            } as ClinicService;
                                           
                                            setSelectedServices((prev) => [...prev, serviceToAdd]);
                                            setServicesSaved(false);
                                           
                                            // Track recently added service with timestamp for visual feedback
                                            setRecentlyAddedServices((prev) => ({ ...prev, [svc._id]: Date.now() }));
                                           
                                            // 2. Also save to appointment via API
                                            setAddingRecService((p) => ({ ...p, [patientServiceKey]: true }));
                                            try {
                                              await axios.patch(`/api/clinic/appointment-services/${details.appointmentId}`, { serviceIds: [svc._id] }, { headers: getAuthHeaders() });
                                              setAddedRecServices((p) => ({ ...p, [patientServiceKey]: true }));
                                              if (onSuccess) onSuccess();
                                            } catch (err: any) {
                                              // If API fails, remove from selectedServices
                                              setSelectedServices((prev) => prev.filter((s) => s._id !== svc._id));
                                              setRecentlyAddedServices((prev) => {
                                                const updated = { ...prev };
                                                delete updated[svc._id];
                                                return updated;
                                              });
                                            } finally {
                                              setAddingRecService((p) => ({ ...p, [patientServiceKey]: false }));
                                            }
                                          }}
                                          className={`flex items-center gap-0.5 rounded px-2 py-1 text-[10px] font-semibold transition-colors ${addedRecServices[`${details?.patientId}_${svc._id}`] ? "bg-green-100 text-green-700 cursor-default" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                                        >
                                          {addingRecService[`${details?.patientId}_${svc._id}`] ? <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> : addedRecServices[`${details?.patientId}_${svc._id}`] ? <><Check size={10} /> Added</> : <><Plus size={10} /> Add</>}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Appointments - Upcoming */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                          <ClipboardList className="w-4 h-4 text-blue-600" />
                          <h3 className="text-sm font-semibold text-gray-800">Appointments</h3>
                        </div>
                        <div className="px-5 py-3">
                          {loadingUpcoming ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading appointments...
                            </div>
                          ) : filteredUpcomingAppointments.length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 text-center">No upcoming appointments</p>
                          ) : (
                            <div>
                              <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-2">Upcoming</p>
                              <div className="space-y-2">
                                {filteredUpcomingAppointments.map((appt) => {
                                  const d = new Date(appt.startDate);
                                  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                  const [fh, fm] = appt.fromTime.split(":").map(Number);
                                  const ampm = fh < 12 ? "AM" : "PM";
                                  const h12 = fh % 12 || 12;
                                  const timeStr = `${h12}:${String(fm).padStart(2, "0")} ${ampm}`;
                                  const statusColor = appt.status === "booked" || appt.status === "Approved" ? "bg-blue-600 text-white" : appt.status === "Completed" ? "bg-green-100 text-green-700" : appt.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600";
                                  return (
                                    <div key={appt._id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 flex items-center justify-between">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-800">{appt.followType === "follow up" ? "Follow-up Session" : appt.followType === "first time" ? "First Visit" : appt.followType}</p>
                                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500">
                                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dateStr}</span>
                                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
                                        </div>
                                      </div>
                                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md capitalize ${statusColor}`}>{appt.status}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Session Booking in prescription tab */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
                        <div className="flex items-center gap-2 mb-4"><Calendar className="w-4 h-4 text-blue-600" /><h3 className="text-sm font-semibold text-gray-800">Next Session Booking</h3></div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Date</label>
                            <input type="date" value={nextSessionDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setNextSessionDate(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Time</label>
                            <select value={nextSessionTime} onChange={(e) => { setNextSessionTime(e.target.value); setNextSessionBooked(false); setNextSessionError(""); }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300">
                              {["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"].map((t) => { const [h, m] = t.split(":").map(Number); const ampm = h < 12 ? "AM" : "PM"; const h12 = h % 12 || 12; return <option key={t} value={t}>{`${h12}:${String(m).padStart(2, "0")} ${ampm}`}</option>; })}
                            </select>
                          </div>
                        </div>
                        {nextSessionError && <p className="text-red-500 text-xs mb-2">{nextSessionError}</p>}
                        {nextSessionBooked && <p className="text-green-600 text-xs mb-2 flex items-center gap-1"><Check size={11} /> Session booked!</p>}
                        <button type="button" onClick={bookNextSession} disabled={bookingNextSession || nextSessionBooked} className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                          <Calendar size={14} />{bookingNextSession ? "Booking..." : nextSessionBooked ? "Session Booked!" : "Book Next Session"}
                        </button>
                      </div>

                      {/* â”€â”€ DIVIDER â”€â”€ */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Summary</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      {/* Treatment & Billing - Full Interactive (Prescription) */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-gray-900">Treatment & Billing</h3>
                              <p className="text-xs text-gray-500">Add and manage treatment services</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddServiceDropdown(true);
                                setShowCreatePackage(false);
                                setServicesSaved(false);
                                setServicesError("");
                                if (allServices.length === 0) fetchAllServices();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                            >
                              <Plus size={16} /> Add Service
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreatePackage(true);
                                setShowAddServiceDropdown(false);
                                setPkgError("");
                                setPkgSuccess("");
                                if (allServices.length === 0) fetchAllServices();
                                if (pkgTreatments.length === 0) fetchPkgTreatments();
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                              <Package size={16} /> Create Package
                            </button>
                          </div>
                        </div>

                        {/* Add Service Panel */}
                        {showAddServiceDropdown && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <Search className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-bold text-blue-800">Search & Add Services</span>
                              </div>
                              <button type="button" onClick={() => setShowAddServiceDropdown(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon size={16} /></button>
                            </div>
                            <div className="relative mb-3">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                placeholder="Search by service name..."
                                value={serviceSearchQuery}
                                onChange={(e) => setServiceSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm transition-all"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2 mb-3 rounded-lg border border-gray-200 bg-white p-2">
                              {loadingServices ? (
                                <div className="flex items-center justify-center py-8">
                                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                  <span className="ml-2 text-sm text-gray-500">Loading services...</span>
                                </div>
                              ) : allServices.filter((s) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                  <Package className="w-12 h-12 text-gray-300 mb-2" />
                                  <p className="text-sm text-gray-500 font-medium">No services found</p>
                                </div>
                              ) : (
                                allServices.filter((s) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((svc) => {
                                  const isSelected = selectedServices.some((s) => s._id === svc._id);
                                  return (
                                    <button key={svc._id} type="button"
                                      onClick={() => { setSelectedServices((prev) => isSelected ? prev.filter((s) => s._id !== svc._id) : [...prev, svc]); setServicesSaved(false); }}
                                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                                        isSelected ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                          isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                                        }`}>
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className={`text-sm font-medium ${isSelected ? "text-blue-800" : "text-gray-700"}`}>{svc.name}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}</span>
                                        {isSelected && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Added</span>}
                                      </div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                            {/* Services save status - hidden as services are saved with complaint */}
                            {false && servicesError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-red-700">{servicesError}</p>
                              </div>
                            )}
                            {false && servicesSaved && (
                              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <p className="text-xs text-green-700 font-medium">Services saved successfully!</p>
                              </div>
                            )}
                            {/* Save Services button - hidden as services are saved automatically with complaint */}
                            {false && (
                              <button type="button" onClick={saveServicesToAppointment}
                                disabled={savingServices || selectedServices.length === 0}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                              >
                                {savingServices ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving...</>) : (<><CheckCircle className="w-4 h-4" />Save Services to Appointment</>)}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Create Package Panel */}
                        {showCreatePackage && (
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-violet-50/50 to-purple-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-violet-600" />
                                </div>
                                <span className="text-sm font-bold text-violet-800">Create New Package</span>
                              </div>
                              <button type="button" onClick={() => { setShowCreatePackage(false); setPkgError(""); setPkgSuccess(""); setPkgModalName(""); setPkgModalPrice(""); setPkgModalValidityInMonths(""); setPkgModalStartDate(new Date().toISOString().split('T')[0]); setPkgModalEndDate(""); setPkgSelectedTreatments([]); }} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon size={16} /></button>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Package Name <span className="text-red-500">*</span></label>
                              <input type="text" value={pkgModalName} onChange={(e) => setPkgModalName(e.target.value)} placeholder="e.g., Premium Skin Care Package" className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm" />
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Total Package Price <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                <input type="number" min="0" step="0.01" value={pkgModalPrice} onChange={(e) => setPkgModalPrice(e.target.value)} placeholder="0.00" className="w-full pl-12 pr-4 py-2 text-sm font-semibold border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm" />
                              </div>
                            </div>

                            {/* Validity & Dates */}
                            <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">Validity (Months)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={pkgModalValidityInMonths}
                                  onChange={(e) => setPkgModalValidityInMonths(e.target.value)}
                                  placeholder="e.g. 12"
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">Start Date</label>
                                <input
                                  type="date"
                                  value={pkgModalStartDate}
                                  onChange={(e) => setPkgModalStartDate(e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-violet-700 mb-1.5">End Date</label>
                                <input
                                  type="date"
                                  value={pkgModalEndDate}
                                  readOnly
                                  className="w-full px-3 py-2 text-sm border border-violet-200 rounded-lg bg-violet-50 text-violet-700 cursor-not-allowed shadow-sm"
                                />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-violet-700 mb-1.5">Select Treatments / Services <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <div className="w-full px-4 py-2.5 text-sm border border-violet-200 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-violet-300 transition-colors shadow-sm"
                                  onClick={() => { setPkgTreatmentDropdownOpen(!pkgTreatmentDropdownOpen); if (!pkgTreatmentDropdownOpen && allServices.length === 0) fetchAllServices(); }}>
                                  <span className={pkgSelectedTreatments.length > 0 ? "text-gray-800 font-medium" : "text-gray-400"}>
                                    {pkgSelectedTreatments.length > 0 ? `${pkgSelectedTreatments.length} treatment${pkgSelectedTreatments.length > 1 ? "s" : ""} selected` : "Select treatments to include..."}
                                  </span>
                                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${pkgTreatmentDropdownOpen ? "rotate-180" : ""}`} />
                                </div>
                                {pkgTreatmentDropdownOpen && (
                                  <div className="absolute z-20 w-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-violet-100 sticky top-0 bg-white">
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input type="text" value={pkgTreatmentSearch} onChange={(e) => setPkgTreatmentSearch(e.target.value)} placeholder="Search treatments..." autoFocus className="w-full pl-9 pr-3 py-2 text-sm border border-violet-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-400" />
                                      </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-52">
                                      {loadingServices ? (
                                        <div className="flex items-center justify-center p-4"><Loader2 className="w-5 h-5 text-violet-600 animate-spin" /><span className="ml-2 text-sm text-gray-500">Loading...</span></div>
                                      ) : allServices.filter((s) => s.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase())).length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">No treatments found</div>
                                      ) : (
                                        <ul className="py-1">
                                          {allServices.filter((svc) => svc.name.toLowerCase().includes(pkgTreatmentSearch.toLowerCase())).map((svc) => {
                                            const isSelected = pkgSelectedTreatments.some((t) => t.treatmentSlug === svc._id);
                                            return (
                                              <li key={svc._id}>
                                                <button type="button"
                                                  onClick={() => {
                                                    if (isSelected) { setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== svc._id)); }
                                                    else { setPkgSelectedTreatments((prev) => [...prev, { treatmentName: svc.name, treatmentSlug: svc._id, sessions: 1, allocatedPrice: svc.clinicPrice != null ? svc.clinicPrice : svc.price }]); }
                                                  }}
                                                  className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-violet-50 transition-colors ${isSelected ? "bg-violet-50" : ""}`}
                                                >
                                                  <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? "bg-violet-600 border-violet-600" : "border-gray-300"}`}>
                                                      {isSelected && <Check size={12} className="text-white" />}
                                                    </div>
                                                    <div className="text-left">
                                                      <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                                                      <p className="text-xs text-gray-500">{getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)} â€¢ {svc.durationMinutes} mins</p>
                                                    </div>
                                                  </div>
                                                </button>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                )}
                                {pkgSelectedTreatments.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold text-violet-700">Selected Treatments</p>
                                    {pkgSelectedTreatments.map((sel) => {
                                      const sessPrice = sel.sessions > 0 ? (sel.allocatedPrice || 0) / sel.sessions : 0;
                                      return (
                                        <div key={sel.treatmentSlug} className="bg-white border border-violet-200 rounded-lg p-2.5 shadow-sm">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-violet-700">{sel.treatmentName}</span>
                                            <button type="button" onClick={() => setPkgSelectedTreatments((prev) => prev.filter((t) => t.treatmentSlug !== sel.treatmentSlug))} className="text-red-400 hover:text-red-600 transition-colors"><XIcon size={13} /></button>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <div>
                                              <label className="block text-[9px] text-violet-600 font-medium mb-0.5">Price</label>
                                              <input type="number" min="0" step="0.01" value={sel.allocatedPrice || ""} onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, allocatedPrice: parseFloat(e.target.value) || 0 } : t))} className="w-full px-2 py-1.5 text-xs border border-violet-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400" placeholder="0.00" />
                                            </div>
                                            <div>
                                              <label className="block text-[9px] text-violet-600 font-medium mb-0.5">Sessions</label>
                                              <input type="number" min="1" value={sel.sessions} onChange={(e) => setPkgSelectedTreatments((prev) => prev.map((t) => t.treatmentSlug === sel.treatmentSlug ? { ...t, sessions: parseInt(e.target.value) || 1 } : t))} className="w-full px-2 py-1.5 text-xs border border-violet-200 rounded-md text-center focus:outline-none focus:ring-1 focus:ring-violet-400" />
                                            </div>
                                            <div>
                                              <label className="block text-[9px] text-violet-600 font-medium mb-0.5">/Session</label>
                                              <div className="px-2 py-1.5 text-xs font-bold text-center bg-violet-100 rounded-md text-violet-700 border border-violet-200">â‚¹{sessPrice.toFixed(2)}</div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-violet-100 rounded-lg px-3 py-2.5">
                                      <div className="text-center">
                                        <p className="text-[9px] text-violet-600 font-medium mb-0.5">Pkg Price</p>
                                        <p className="text-xs font-bold text-violet-800">â‚¹{parseFloat(pkgModalPrice) || 0}</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[9px] text-violet-600 font-medium mb-0.5">Allocated</p>
                                        <p className="text-xs font-bold text-violet-800">â‚¹{pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0).toFixed(2)}</p>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-[9px] text-violet-600 font-medium mb-0.5">Remaining</p>
                                        <p className={`text-xs font-bold ${Math.abs((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)) < 0.01 ? "text-teal-600" : "text-amber-600"}`}>
                                          â‚¹{((parseFloat(pkgModalPrice) || 0) - pkgSelectedTreatments.reduce((sum, t) => sum + (t.allocatedPrice || 0), 0)).toFixed(2)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {pkgError && (<div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-xs text-red-700">{pkgError}</p></div>)}
                            {pkgSuccess && (<div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><p className="text-xs text-green-700 font-medium">{pkgSuccess}</p></div>)}
                            <div className="flex gap-3">
                              <button type="button" onClick={() => handleCreatePackageModal(false)} disabled={pkgSubmitting || addingPackageToPatient} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-violet-700 bg-white border border-violet-500 rounded-lg hover:bg-violet-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <Package size={14} />{pkgSubmitting ? "Creating..." : "Create Package"}
                              </button>
                              <button type="button" onClick={() => handleCreatePackageModal(true)} disabled={pkgSubmitting || addingPackageToPatient} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                                <Plus size={14} />{addingPackageToPatient ? "Adding..." : "Create & Add to Patient"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selected Services */}
                        <div className="px-5 py-4">
                          {selectedServices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Package className="w-10 h-10 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-600 mb-1">No services added yet</p>
                              <p className="text-xs text-gray-400 mb-4">Click "Add Service" to begin building your treatment plan</p>
                              <button type="button" onClick={() => { setShowAddServiceDropdown(true); if (allServices.length === 0) fetchAllServices(); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md">
                                <Plus size={16} /> Browse Services
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900">Selected Treatments</span>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{selectedServices.length}</span>
                                </div>
                              </div>
                              {selectedServices.map((svc, i) => (
                                <div key={svc._id} className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                                        <Package className="w-6 h-6 text-blue-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-bold text-gray-900">{svc.name}</h4>
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">Standard</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">Service #{i + 1} â€¢ ID: {svc._id.slice(-6)}</p>
                                        <div className="flex items-center gap-2">
                                          <label className="text-xs text-gray-600 font-medium">Price:</label>
                                          <div className="relative">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">{getCurrencySymbol(currency)}</span>
                                            <input type="number" min="0" step="0.01" value={(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                                              readOnly
                                              className="w-32 pl-9 pr-3 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 transition-all"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}</p>
                                      </div>
                                      <button type="button" onClick={() => setSelectedServices((prev) => prev.filter((s) => s._id !== svc._id))} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50" title="Remove service"><Trash2 size={16} /></button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-3 shadow-md">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-white" /></div>
                                    <div>
                                      <p className="text-xs font-medium text-blue-100">Total Bill</p>
                                      <p className="text-[10px] text-blue-200">{selectedServices.length} {selectedServices.length === 1 ? "treatment" : "treatments"}</p>
                                    </div>
                                  </div>
                                  <p className="text-lg font-bold text-white">{getCurrencySymbol(currency)} {totalBill.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Clinical Checklist */}
                      <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm px-3 sm:px-4 py-3">
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> Clinical Checklist
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {CHECKLIST_ITEMS.map((item) => (
                            <label key={item} className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${checklist[item] ? "border-green-300 bg-green-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                              <input type="checkbox" checked={checklist[item]} onChange={() => setChecklist((prev) => ({ ...prev, [item]: !prev[item] }))} className="w-3.5 h-3.5 rounded accent-green-500 cursor-pointer" />
                              <span className={`text-xs font-medium ${checklist[item] ? "text-green-700" : "text-gray-700"}`}>{item}</span>
                              {checklist[item] && <Check size={12} className="ml-auto text-green-500" />}
                            </label>
                          ))}
                        </div>
                        {checklistError && (
                          <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5" />
                            <p className="text-xs text-red-700">{checklistError}</p>
                          </div>
                        )}
                      </div>

                      {/* Consent Form Status */}
                      {consentStatuses.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-3">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" /> Consent Forms
                          </h3>
                          <div className="space-y-2">
                            {consentStatuses.map((consent) => (
                              <div
                                key={consent._id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${
                                  consent.status === "signed"
                                    ? "border-green-200 bg-green-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-gray-800">
                                      {consent.consentFormName}
                                    </p>
                                    {consent.status === "signed" && (
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                    )}
                                    {consent.status === "sent" && (
                                      <Send className="w-3.5 h-3.5 text-blue-600" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {consent.description || "Consent form"}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-gray-400">
                                      Patient: {consent.patientName}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      Date: {consent.date}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                                      consent.status === "signed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {consent.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stock Used (All Sessions) */}
                      {previousComplaints.some((c) => Array.isArray(c.items) && c.items.length > 0) && (
                        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm px-3 sm:px-4 py-3">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"><Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" /> Stock Used (All Sessions)</h3>
                          <div className="rounded-lg border border-gray-100 overflow-x-auto">
                            <table className="w-full text-[10px] sm:text-xs min-w-[400px]">
                              <thead className="bg-gray-50"><tr>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">UOM</th>
                              </tr></thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {previousComplaints.filter((c) => Array.isArray(c.items) && c.items.length > 0).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).flatMap((c) => (c.items as NonNullable<typeof c.items>).map((item, idx) => ({ date: c.createdAt, item, key: `rx-${c._id}-${idx}` }))).map(({ date, item, key }) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500 whitespace-nowrap">{new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-medium text-gray-800">{item.name}</td>
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right font-semibold text-gray-700">{item.quantity}</td>
                                    <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-gray-500">{item.uom || "-"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* â”€â”€ RIGHT SIDEBAR â”€â”€ */}
            <div className="w-full lg:w-72 flex-shrink-0 border-l border-gray-200 overflow-y-auto scrollbar-hide bg-white lg:border-t-0 border-t max-h-[40vh] lg:max-h-none">
              <div className="p-3 sm:p-4 space-y-3">

                {/* Revenue Insights */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Revenue Insights</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {loadingPatientStats ? (
                      <div className="py-3 text-center text-xs text-gray-400">Loading billing dataâ€¦</div>
                    ) : patientStats ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total Paid (All-Time)</span>
                          <span className="text-base font-bold text-gray-900">{getCurrencySymbol(currency)} {patientStats.totalSpend.toLocaleString()}</span>
                        </div>
                        {/* <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total Billed</span>
                          <span className="text-xs font-semibold text-gray-700">{getCurrencySymbol(currency)} {patientStats.totalBilled.toLocaleString()}</span>
                        </div> */}
                        {(patientBalance.pendingBalance > 0 || patientBalance.pendingClaim > 0) && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Outstanding</span>
                            <span className="text-xs font-semibold text-red-500">{getCurrencySymbol(currency)} {(patientBalance.pendingBalance + patientBalance.pendingClaim).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                          <span className="text-xs text-gray-500">Total Invoices</span>
                          <span className="text-xs font-semibold text-gray-700">{patientStats.billingCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">This Session</span>
                          <span className="text-xs font-semibold text-blue-600">{getCurrencySymbol(currency)} {totalBill.toFixed(2)}</span>
                        </div>
                        {patientStats.recentBillings.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Recent Billing</p>
                            {patientStats.recentBillings.map((b, i) => (
                              <div key={i} className="flex items-center justify-between py-0.5 text-xs">
                                <span className="text-gray-600 truncate flex-1 mr-2">{b.label}</span>
                                <span className="text-gray-800 font-medium whitespace-nowrap">{getCurrencySymbol(currency)} {(b.paid||0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {smartDepartments.flatMap((d) => d.services).slice(0, 2).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Upsell Potential</p>
                            {smartDepartments.flatMap((d) => d.services).slice(0, 2).map((svc) => (
                              <div key={svc._id} className="flex items-center justify-between py-1 text-xs">
                                <span className="text-gray-600 truncate flex-1 mr-2">{svc.name}</span>
                                <span className="text-blue-600 font-medium whitespace-nowrap">+{getCurrencySymbol(currency)} {svc.clinicPrice != null ? svc.clinicPrice : svc.price}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">This Session Bill</span>
                          <span className="text-base font-bold text-gray-900">{getCurrencySymbol(currency)}
                             {totalBill.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Services Added</span>
                          <span className="text-xs font-semibold text-gray-700">{selectedServices.length}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Treatment Journey */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Treatment History</span>
                    </div>
                    {doctorDiscount && (
                      <button
                        type="button"
                        onClick={() => setIsDoctorDiscountApplied(!isDoctorDiscountApplied)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          isDoctorDiscountApplied
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                        }`}
                      >
                        <TrendingUp size={10} />
                        {isDoctorDiscountApplied ? "Discount Applied" : "Apply Discount"}
                      </button>
                    )}
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <div>
                      {/* <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Sessions Completed</span>
                        <span className="text-xs font-bold text-gray-800">{previousComplaints.length}</span>
                      </div> */}
                      {/* <div className="w-full bg-gray-100 rounded-full h-2"> */}
                        {/* <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((previousComplaints.length / Math.max(previousComplaints.length + 2, 5)) * 100, 100)}%` }}
                        /> */}
                      {/* </div> */}
                    </div>
                    {details?.serviceNames && details.serviceNames.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Active Treatments</p>
                        {details.serviceNames.map((name, i) => (
                          <div key={i} className="flex items-center gap-2 py-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="text-xs text-gray-700 truncate">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                   
                    {/* Last 5 Selected Treatments */}
                    {selectedServices.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">
                          Selected Treatments {selectedServices.length > 5 ? `(Last 5 of ${selectedServices.length})` : ''}
                        </p>
                        <div className="space-y-1.5">
                          {selectedServices.slice(-5).map((svc) => (
                            <div key={svc._id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-50 border border-gray-100">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                                <span className="text-xs text-gray-700 truncate flex-1">{svc.name}</span>
                              </div>
                              <span className="text-xs font-bold text-blue-600 ml-2 flex-shrink-0">
                                {getCurrencySymbol(currency)} {(svc.clinicPrice != null ? svc.clinicPrice : svc.price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                   
                    <div className="pt-1 border-t border-gray-100">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Next Session Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-semibold text-gray-700">
                          {(() => {
                            const nextFollowUp = filteredUpcomingAppointments?.find(appt => appt.followType === "follow up");
                            return nextFollowUp
                              ? new Date(nextFollowUp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "Not scheduled";
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Best Action */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Next Best Action</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {!report && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700">Record patient vitals for this appointment</p>
                      </div>
                    )}
                    {!complaints.trim() && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-blue-600">Document chief complaints</p>
                      </div>
                    )}
                    {!selectedConsentId && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-blue-600">Send consent form to patient</p>
                      </div>
                    )}
                    {selectedServices.length === 0 && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-blue-600">Add services to the appointment</p>
                      </div>
                    )}
                    {!nextSessionBooked && (
                      <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-blue-600">Schedule the next session</p>
                      </div>
                    )}
                    {report && complaints.trim() && selectedServices.length > 0 && nextSessionBooked && selectedConsentId && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <p className="text-xs text-blue-700 font-medium">All recommended actions completed!</p>
                      </div>
                    )}
                  </div>
                </div>

             

                {/* Previous History Accordion */}
                {/* <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPreviousReports(!showPreviousReports)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Previous History</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">{patientReports.length}</span>
                    </div>
                    {showPreviousReports ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>
                  {showPreviousReports && patientReports.length > 0 && (
                    <div className="border-t border-gray-100">
                      {patientReports.slice(0, 5).map((r) => (
                        <div key={r.reportId || `${r.appointmentId}-${r.createdAt}`} className="px-4 py-2.5 border-b border-gray-50 last:border-0">
                          <p className="text-[11px] font-semibold text-gray-700 mb-0.5">{formatDateTime(r.updatedAt)}</p>
                          {r.doctorName && <p className="text-[11px] text-gray-400 mb-0.5">Dr. {r.doctorName}</p>}
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                            <span>T: {r.temperatureCelsius}Â°C</span>
                            <span>P: {r.pulseBpm} bpm</span>
                            <span>BP: {r.systolicBp}/{r.diastolicBp}</span>
                            {r.weightKg != null && <span>W: {r.weightKg}kg</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showPreviousReports && patientReports.length === 0 && (
                    <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">No previous reports.</div>
                  )}
                </div> */}

                {/* Communication Log */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Communication Log</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {loadingConsentStatus ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-[10px] font-medium text-gray-500 italic">Syncing communication log...</span>
                      </div>
                    ) : consentStatuses.length > 0 ? (
                      <div className="space-y-2">
                        {consentStatuses.map((consent) => (
                          <div
                            key={consent._id}
                            className={`flex items-start gap-2 p-2 rounded-lg border ${
                              consent.status === "signed"
                                ? "border-green-200 bg-green-50"
                                : "border-blue-200 bg-blue-50"
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                              consent.status === "signed"
                                ? "bg-green-100"
                                : "bg-blue-100"
                            }`}>
                              {consent.status === "signed" ? (
                                <CheckCircle className="w-3 h-3 text-green-600" />
                              ) : (
                                <Send className="w-3 h-3 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700 truncate">
                                {consent.consentFormName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                  consent.status === "signed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}>
                                  {consent.status === "signed" ? "SIGNED" : "SENT"}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {consent.date}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                Patient: {consent.patientName}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : consentSent ? (
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Consent Form Sent</p>
                          <p className="text-[10px] text-gray-400">{new Date().toLocaleString()}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No communication logged yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* â”€â”€ FOOTER â”€â”€ */}
          <div className="flex items-center justify-between border-t border-gray-200 px-3 sm:px-4 md:px-5 py-2 sm:py-3 bg-white flex-shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveComplaints}
              disabled={saving || loading}
              className="rounded-lg bg-blue-600 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors flex-1 sm:flex-none"
            >
              {saving ? "Saving..." : "Save Complaints"}
            </button>
          </div>

          {isEditModalOpen && editingComplaint && (
            <EditComplaintModal
              complaint={editingComplaint}
              onClose={() => { setIsEditModalOpen(false); setEditingComplaint(null); }}
              onSaved={(updated) => {
                setPreviousComplaints((prev) => prev.map((pc) => pc._id === updated._id ? { 
                  ...pc, 
                  complaints: updated.complaints, 
                  items: updated.items || [], 
                  createdAt: (updated as any).createdAt || pc.createdAt,
                  beforeImage: (updated.beforeImage || "").trim().replace(/^`|`$/g, ""), // Trim and remove backticks
                  afterImage: (updated.afterImage || "").trim().replace(/^`|`$/g, "") // Trim and remove backticks
                } : pc));
                setIsEditModalOpen(false); setEditingComplaint(null);
              }}
              getAuthHeaders={getAuthHeaders}
            />
          )}
        </div>
      </div>
      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={isOpenDeleteComplaintModal}
        onClose={() => setIsOpenDeleteComplaintModal(false)}
        onConfirm={() => handleDeleteComplaint(deletedComplaint)}
        isDeleting={deleting}
        title="Delete Complaint"
        message="Are you sure you want to delete this complaint? All associated items will also be removed. This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Keep"
      />
      {isOpenViewComplaintModal && (
        <ComplaintDetailModal onClose={() => setIsOpenViewComplaintModal(false)} complaint={selectedComplaint} />
      )}
      <AddStockTransferRequestModal
        isOpen={isOpenStockTransferModal}
        onClose={() => setIsOpenStockTransferModal(false)}
        onSuccess={() => { fetchAllocatedItems(); setIsOpenStockTransferModal(false); }}
      />
    </>
  );
};

const EditComplaintModal: React.FC<{
  complaint: PreviousComplaint;
  onClose: () => void;
  onSaved: (updated: PreviousComplaint) => void;
  getAuthHeaders: () => Record<string, string>;
}> = ({ complaint, onClose, onSaved, getAuthHeaders }) => {
  const token = getTokenByPath() || "";
  const { stockItems } = useStockItems();
  const { uoms, loading: uomsLoading } = useUoms({ token });
  type StockRow = {
    itemId?: string;
    code?: string;
    name: string;
    description?: string;
    quantity: number;
    uom?: string;
  };
  const [note, setNote] = useState<string>(complaint.complaints || "");
  const [items, setItems] = useState<StockRow[]>(
    Array.isArray(complaint.items) ? (complaint.items as any) : [],
  );
  const [beforeImage, setBeforeImage] = useState<string>(complaint.beforeImage || "");
  const [afterImage, setAfterImage] = useState<string>(complaint.afterImage || "");
  const [uploadingBefore, setUploadingBefore] = useState<boolean>(false);
  const [uploadingAfter, setUploadingAfter] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<StockRow>({
    itemId: "",
    code: "",
    name: "",
    description: "",
    quantity: 1,
    uom: "",
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<StockRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const handleCurrentItemChange = (field: keyof StockRow, value: any) => {
    if (field === "itemId") {
      const item = stockItems.find((i) => i._id === value);
      const selectedUOM = uoms.find((u) => u?.name === item?.level0?.uom);
      if (item) {
        setCurrentItem((prev) => ({
          ...prev,
          itemId: value,
          code: item.code,
          name: item.name,
          uom: selectedUOM ? selectedUOM.name : "",
          description: item.description || "",
        }));
        return;
      }
    }
    setCurrentItem((prev) => ({
      ...prev,
      [field]: field === "quantity" ? parseFloat(value) || 0 : value,
    }));
  };

  const addCurrentItem = () => {
    if (!currentItem.name.trim() || !currentItem.quantity || !currentItem.uom) {
      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">âš  Incomplete Item</span>
          <span className="text-xs opacity-80">Please complete item selection, quantity and UOM</span>
        </div>,
        {
          duration: 3000,
          position: 'top-right',
          style: {
            background: '#ef4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            maxWidth: '500px',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        }
      );
      return;
    }
    setItems((prev) => [...prev, { ...currentItem }]);
    setCurrentItem({
      itemId: "",
      code: "",
      name: "",
      description: "",
      quantity: 1,
      uom: "",
    });
    setError("");
  };

  const removeItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    if (editIndex === index) {
      setEditIndex(null);
      setEditingItem(null);
    }
  };

  const startEditItem = (index: number) => {
    setEditIndex(index);
    setEditingItem({ ...items[index] });
  };

  const handleEditingItemChange = (field: keyof StockRow, value: any) => {
    if (!editingItem) return;
    if (field === "itemId") {
      const item = stockItems.find((i) => i._id === value);
      const selectedUOM = uoms.find((u) => u?.name === item?.level0?.uom);
      if (item) {
        setEditingItem({
          ...editingItem,
          itemId: value,
          code: item.code,
          name: item.name,
          uom: selectedUOM ? selectedUOM.name : "",
        });
        return;
      }
    }
    setEditingItem({
      ...editingItem,
      [field]: field === "quantity" ? parseFloat(value) || 0 : value,
    } as any);
  };

  const saveEditItem = () => {
    if (editIndex == null || editingItem == null) return;
    if (!editingItem.name.trim() || !editingItem.quantity || !editingItem.uom) {
      setError("Please complete item fields before saving");
      return;
    }
    const updated = [...items];
    updated[editIndex] = { ...editingItem };
    setItems(updated);
    setEditIndex(null);
    setEditingItem(null);
    setError("");
  };

  const cancelEditItem = () => {
    setEditIndex(null);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!note.trim()) {
      setError("Complaint note is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const headers = getAuthHeaders();
      const res = await axios.patch(
        "/api/clinic/patient-complaints",
        {
          complaintId: complaint._id,
          complaints: note.trim(),
          items,
          beforeImage,
          afterImage,
        },
        { headers },
      );
      const updated = res.data?.complaint;
      if (res.data?.success && updated) {
        onSaved(updated);
      } else {
        setError(res.data?.message || "Failed to update complaint");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update complaint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div className="bg-white w-full max-w-6xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Complaint
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-900">
              Complaint Note <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800/20 focus:border-gray-800"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-900">
              Before/After Images
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Before Image</p>
                <div className="relative flex items-center gap-2">
                  <div className="w-full sm:w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {beforeImage && (
                      <button
                        onClick={() => setBeforeImage("")}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {beforeImage ? (
                      <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                    )}
                    {uploadingBefore && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingBefore(true);
                        const res = await handleUpload(file);
                        if (res?.success) setBeforeImage(res.url);
                        setUploadingBefore(false);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">After Image</p>
                <div className="relative flex items-center gap-2">
                  <div className="w-full sm:w-32 h-32 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {afterImage && (
                      <button
                        onClick={() => setAfterImage("")}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {afterImage ? (
                      <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                    )}
                    {uploadingAfter && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                      </div>
                    )}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingAfter(true);
                        const res = await handleUpload(file);
                        if (res?.success) setAfterImage(res.url);
                        setUploadingAfter(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Items</h4>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-900">
                    Item
                  </label>
                  <select
                    value={currentItem.itemId || ""}
                    onChange={(e) =>
                      handleCurrentItemChange("itemId", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg h-10"
                  >
                    <option value="">Select Item</option>
                    {stockItems.map((si: any) => (
                      <option key={si._id} value={si._id}>
                        {si.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-900">
                    Description
                  </label>
                  <input
                    value={currentItem.description || ""}
                    onChange={(e) =>
                      handleCurrentItemChange("description", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg h-10"
                    placeholder="Description"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-gray-900">
                    Qty
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={currentItem.quantity}
                    onChange={(e) =>
                      handleCurrentItemChange("quantity", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg h-10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-900">
                    UOM
                  </label>
                  <select
                    value={currentItem.uom || ""}
                    onChange={(e) =>
                      handleCurrentItemChange("uom", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg h-10"
                  >
                    <option value="">Select UOM</option>
                    {uomsLoading ? (
                      <option value="">Loading UOMs...</option>
                    ) : uoms.length > 0 ? (
                      uoms.map((u: any) => (
                        <option key={u._id} value={u.name}>
                          {u.name}
                        </option>
                      ))
                    ) : (
                      <option value="">No UOMs available</option>
                    )}
                  </select>
                </div>
                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={addCurrentItem}
                    disabled={
                      !currentItem.name.trim() ||
                      !currentItem.quantity ||
                      !currentItem.uom
                    }
                    className="inline-flex items-center px-3 py-2.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-900"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                      SI
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                      UOM
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-sm text-center text-gray-500"
                      >
                        No Items
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => {
                      const isEditing = editIndex === idx && editingItem;
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {isEditing ? (
                              <select
                                value={editingItem?.itemId || ""}
                                onChange={(e) =>
                                  handleEditingItemChange(
                                    "itemId",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                              >
                                <option value="">Select Item</option>
                                {stockItems.map((si: any) => (
                                  <option key={si._id} value={si._id}>
                                    {si.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              it.name
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                value={editingItem?.description || ""}
                                onChange={(e) =>
                                  handleEditingItemChange(
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                              />
                            ) : (
                              it.description || "-"
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={editingItem?.quantity || 1}
                                onChange={(e) =>
                                  handleEditingItemChange(
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-24 px-2 py-1.5 text-sm border border-gray-300 rounded text-right"
                              />
                            ) : (
                              it.quantity
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {isEditing ? (
                              <select
                                value={editingItem?.uom || ""}
                                onChange={(e) =>
                                  handleEditingItemChange("uom", e.target.value)
                                }
                                className="w-32 px-2 py-1.5 text-sm border border-gray-300 rounded"
                              >
                                <option value="">Select UOM</option>
                                {uoms.map((u: any) => (
                                  <option key={u._id} value={u.name}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              it.uom || "-"
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveEditItem}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditItem}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditItem(idx)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !note.trim()}
            className="rounded-lg bg-gray-800 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Complaint",
  message = "Are you sure you want to delete this complaint? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ComplaintDetailModal: React.FC<{
  complaint: any;
  onClose: () => void;
}> = ({ complaint, onClose }) => {
  if (!complaint) return null;
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Complaint Details
                </h2>
                <p className="text-sm text-gray-300 mt-0.5">
                  ID: {complaint._id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          {/* Status Banner */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium">Active</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {getTimeAgo(complaint.createdAt)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {formatDate(complaint.updatedAt)}
            </div>
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Patient Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Patient Information
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-blue-600 w-24">
                    EMR No:
                  </span>
                  <span className="text-sm text-gray-900 font-mono">
                    {complaint.patientId?.emrNumber || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-blue-600 w-24">
                    Name:
                  </span>
                  <span className="text-sm text-gray-900">
                    {`${complaint.patientId?.firstName} ${complaint.patientId?.lastName}` ||
                      "N/A"}
                  </span>
                </div>
                {complaint.patientId?.phone && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-blue-600 w-24">
                      Contact:
                    </span>
                    <span className="text-sm text-gray-900">
                      {complaint.patientId.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Doctor & Appointment Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Consultation Details
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-purple-600 w-24">
                    Doctor:
                  </span>
                  <span className="text-sm text-gray-900">
                    {complaint.doctorId?.name || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-purple-600 w-24">
                    Appointment:
                  </span>
                  <span className="text-sm text-gray-900 font-mono">
                    {complaint.appointmentId?._id?.slice(-8).toUpperCase() ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-purple-600 w-24">
                    Report ID:
                  </span>
                  <span className="text-sm text-gray-900 font-mono">
                    {complaint.appointmentReportId?._id
                      ?.slice(-8)
                      .toUpperCase() || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Complaint Note Card */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Complaint Note</h3>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {complaint.complaints}
                </p>
              </div>
            </div>
          </div>

          {/* Before/After Images */}
          {(complaint.beforeImage || complaint.afterImage) && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Before/After Images</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complaint.beforeImage && (() => {
                  const cleanUrl = complaint.beforeImage.trim().replace(/^`|`$/g, "");
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Before</p>
                      <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={cleanUrl} alt="Before" className="w-full h-64 object-cover rounded-lg" />
                      </a>
                    </div>
                  );
                })()}
                {complaint.afterImage && (() => {
                  const cleanUrl = complaint.afterImage.trim().replace(/^`|`$/g, "");
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">After</p>
                      <a href={cleanUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={cleanUrl} alt="After" className="w-full h-64 object-cover rounded-lg" />
                      </a>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Items Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Items ({complaint.items?.length || 0})
              </h3>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        <span>SI</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">
                      <div className="flex items-center justify-end gap-1">
                        <Scale className="w-3 h-3" />
                        <span>Quantity</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                      UOM
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complaint.items && complaint.items.length > 0 ? (
                    complaint.items.map((item: any, index: number) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {(index + 1).toString().padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {item.name}
                          </div>
                          {item.itemId && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              ID: {item.itemId.slice(-6).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.code || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {item.uom || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-8 h-8 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            No items added
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-xs text-gray-600">
                  Created: {formatDate(complaint.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentComplaintModal;
