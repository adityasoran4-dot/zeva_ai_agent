"use client";
import React, { useState, useEffect,  useCallback } from "react";
import {

  Clock,

  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Settings,
 
  Search,
  X,

  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  Stethoscope,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { ModalPortal } from "../../lib/modalPortal";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientInvoiceNumber?: string | null;
  patientEmrNumber?: string | null;
  patientGender?: string | null;
  patientEmail?: string | null;
  patientMobileNumber?: string | null;
  doctorId: string;
  doctorName: string;
  roomId: string;
  roomName: string;
  status: string;
  followType: string;
  startDate: string;
  fromTime: string;
  toTime: string;
  referral: string;
  emergency: string;
  notes: string;
  serviceId?: string | { _id: string };
  serviceName?: string | null;
  serviceIds?: string[];
  serviceNames?: string[];
  bookedFrom?: "doctor" | "room";
}

interface DoctorStaff {
  _id: string;
  name: string;
  email: string;
}

interface Room {
  _id: string;
  name: string;
}

interface ClinicData {
  _id: string;
  name: string;
  timings: string;
}

interface TimeSlot {
  time: string;
  displayTime: string;
}

interface StatusColor {
  bg: string;
  text: string;
  border: string;
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const DEFAULT_STATUS_COLORS: Record<string, StatusColor> = {
  booked: { bg: "#dbeafe", text: "#1e40af", border: "#3b82f6" },
  arrived: { bg: "#d1fae5", text: "#065f46", border: "#10b981" },
  cancelled: { bg: "#fce7f3", text: "#9f1239", border: "#ec4899" },
  completed: { bg: "#e0f2fe", text: "#075985", border: "#06b6d4" },
  consultation: { bg: "#f5d0fe", text: "#86198f", border: "#d946ef" },
  waiting: { bg: "#fef3c7", text: "#92400e", border: "#f59e0b" },
  default: { bg: "#f3f4f6", text: "#374151", border: "#9ca3af" },
};

const ROW_HEIGHT_PX = 48;
const SLOT_INTERVAL_MINUTES = 30;

function timeStringToMinutes(time24: string): number {
  const [hourStr, minuteStr] = time24.split(":");
  return parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
}

function minutesToDisplay(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatTime(time24: string): string {
  const [hour, min] = time24.split(":").map(Number);
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${String(min).padStart(2, "0")} ${period}`;
}

function getLocalTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateTimeSlots(startTime: string, endTime: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = timeStringToMinutes(endTime);

  for (let current = startMinutes; current < endMinutes; current += SLOT_INTERVAL_MINUTES) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    const time24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    slots.push({ time: time24, displayTime: minutesToDisplay(current) });
  }

  return slots;
}

function getStatusColor(status: string, customColors?: Record<string, StatusColor>): StatusColor {
  const normalizedStatus = status.toLowerCase().trim();
  if (customColors && customColors[normalizedStatus]) {
    return customColors[normalizedStatus];
  }
  return DEFAULT_STATUS_COLORS[normalizedStatus] || DEFAULT_STATUS_COLORS.default;
}

// ============================================================================
// MAIN SCHEDULER COMPONENT
// ============================================================================

interface ModernSchedulerProps {
  initialDate?: string;
  viewMode?: "doctors" | "rooms" | "both";
  getAuthHeaders: () => Record<string, string>;
  onBookAppointment?: (appointment: Partial<Appointment>) => void;
  onEditAppointment?: (appointment: Appointment) => void;
  enableDragDrop?: boolean;
  showColorSettings?: boolean;
}

export const ModernScheduler: React.FC<ModernSchedulerProps> = ({
  initialDate = getLocalTodayDate(),
  viewMode = "both",
  getAuthHeaders,
  onBookAppointment,
  onEditAppointment,
  enableDragDrop = true,
  showColorSettings = false,
}) => {
  // State
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [doctors, setDoctors] = useState<DoctorStaff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>("");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  // UI State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    doctorId?: string;
    roomId?: string;
    time?: string;
    displayTime?: string;
  } | null>(null);
  
  const [customStatusColors, setCustomStatusColors] = useState<Record<string, StatusColor>>({});
  const [showColorPanel, setShowColorPanel] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, [selectedDate, viewMode]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError("");
      
      const res = await axios.get("/api/clinic/appointment-data", {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setClinic(res.data.clinic);
        setDoctors(res.data.doctorStaff || []);
        setRooms(res.data.rooms || []);
        setAppointments(res.data.appointments || []);
        
        // Parse timings and generate slots
        const parsed = parseTimings(res.data.clinic.timings);
        const slots = generateTimeSlots(parsed.startTime, parsed.endTime);
        setTimeSlots(slots);
      } else {
        setError(res.data.message || "Failed to load data. Please check your connection and try again.");
      }
    } catch (err: any) {
      console.error("Error loading appointment data:", err);
      const errorMsg = err.response?.status === 403 
        ? "You don't have permission to view appointments. Please contact your administrator."
        : err.response?.data?.message || "Failed to load appointment data. Please refresh and try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };

  function parseTimings(timings: string | null | undefined): { startTime: string; endTime: string; isCustom: boolean } {
    // Handle null, undefined, or empty string
    if (!timings || typeof timings !== 'string') {
      return { startTime: "09:00", endTime: "17:00", isCustom: false };
    }
    
    const patterns = [
      /(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
      /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*(AM|PM)\s*-\s*(\d{1,2})\s*(AM|PM)/i,
    ];

    for (const pattern of patterns) {
      const match = timings.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          const startHour = parseInt(match[1]);
          const startMin = parseInt(match[2]);
          const startPeriod = match[3].toUpperCase();
          const endHour = parseInt(match[4]);
          const endMin = parseInt(match[5]);
          const endPeriod = match[6].toUpperCase();

          let start24 = startHour === 12 ? 0 : startHour;
          if (startPeriod === "PM") start24 += 12;
          start24 = start24 * 60 + startMin;

          let end24 = endHour === 12 ? 0 : endHour;
          if (endPeriod === "PM") end24 += 12;
          end24 = end24 * 60 + endMin;

          return {
            startTime: `${String(Math.floor(start24 / 60)).padStart(2, "0")}:${String(start24 % 60).padStart(2, "0")}`,
            endTime: `${String(Math.floor(end24 / 60)).padStart(2, "0")}:${String(end24 % 60).padStart(2, "0")}`,
            isCustom: false,
          };
        }
      }
    }
    
    return { startTime: "09:00", endTime: "17:00", isCustom: false };
  }

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (selectedDate && apt.startDate !== selectedDate) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        apt.patientName.toLowerCase().includes(query) ||
        apt.patientMobileNumber?.toLowerCase().includes(query) ||
        apt.patientEmail?.toLowerCase().includes(query) ||
        apt.patientEmrNumber?.toLowerCase().includes(query)
      );
    }
    if (selectedDoctorFilter && apt.doctorId !== selectedDoctorFilter) return false;
    if (selectedRoomFilter && apt.roomId !== selectedRoomFilter) return false;
    if (statusFilter && apt.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  // Get appointments for a specific slot
  const getAppointmentsForSlot = useCallback(
    (doctorId: string, roomId: string, time: string) => {
      return filteredAppointments.filter(
        (apt) =>
          apt.doctorId === doctorId &&
          apt.roomId === roomId &&
          apt.fromTime === time &&
          apt.startDate === selectedDate
      );
    },
    [filteredAppointments, selectedDate]
  );

  // Handle slot click
  const handleSlotClick = (doctorId?: string, roomId?: string, time?: string, displayTime?: string) => {
    if (!enableDragDrop) return;
    setSelectedSlot({ doctorId, roomId, time, displayTime });
    setShowBookingModal(true);
  };

  // Navigate dates
  const navigateDate = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate);
    if (direction === "prev") {
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    setSelectedDate(getLocalTodayDate());
  };

  // Render loading state with skeleton
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-300 overflow-hidden">
        {/* Skeleton Header */}
        <div className="border-b border-gray-200 dark:border-gray-300 p-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-100 dark:via-gray-50 dark:to-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-300 animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-200 dark:bg-gray-300 rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-gray-200 dark:bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-300 rounded-lg animate-pulse"></div>
              <div className="w-32 h-8 bg-gray-200 dark:bg-gray-300 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton Filters */}
        <div className="border-b border-gray-200 dark:border-gray-300 p-3 bg-gray-50 dark:bg-gray-100">
          <div className="flex gap-3">
            <div className="flex-1 h-9 bg-gray-200 dark:bg-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-32 h-9 bg-gray-200 dark:bg-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-32 h-9 bg-gray-200 dark:bg-gray-300 rounded-lg animate-pulse"></div>
            <div className="w-32 h-9 bg-gray-200 dark:bg-gray-300 rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        {/* Skeleton Grid */}
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-24 h-12 bg-gray-200 dark:bg-gray-300 rounded"></div>
              <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-200 rounded"></div>
              <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-200 rounded"></div>
              <div className="flex-1 h-12 bg-gray-100 dark:bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 mb-2">Error Loading Schedule</h3>
          <p className="text-gray-600 dark:text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => loadData(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const columns = viewMode === "doctors" ? doctors : viewMode === "rooms" ? rooms : [...doctors, ...rooms];

  return (
    <div className="bg-white dark:bg-gray-50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-300 overflow-hidden">
      {/* Header */}
      <SchedulerHeader
        clinicName={clinic?.name || "Clinic"}
        selectedDate={selectedDate}
        onNavigate={navigateDate}
        onDateChange={setSelectedDate}
        onBook={() => setShowBookingModal(true)}
        onImport={() => {}}
        onColorSettings={() => setShowColorPanel(!showColorPanel)}
        showColorSettings={showColorSettings}
        isRefreshing={isRefreshing}
        onRefresh={() => loadData(true)}
      />

      {/* Filters */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        doctors={doctors}
        rooms={rooms}
        selectedDoctorFilter={selectedDoctorFilter}
        selectedRoomFilter={selectedRoomFilter}
        statusFilter={statusFilter}
        onDoctorFilterChange={setSelectedDoctorFilter}
        onRoomFilterChange={setSelectedRoomFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Scheduler Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Column Headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-300 sticky top-0 bg-white dark:bg-gray-50 z-10">
            {/* Time column header */}
            <div className="w-24 flex-shrink-0 border-r border-gray-200 dark:border-gray-300 bg-gray-50 dark:bg-gray-100 p-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-700 uppercase tracking-wide">
                Time
              </div>
            </div>
            
            {/* Doctor/Room columns */}
            {columns.map((column) => (
              <div
                key={`${viewMode === "rooms" ? "room" : "doctor"}-${column._id}`}
                className="flex-1 min-w-[180px] border-r border-gray-200 dark:border-gray-300 p-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-100 dark:to-white"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {column.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-900 truncate">
                      {column.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-600 truncate">
                      {viewMode === "doctors" ? "Doctor" : "Room"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="relative">
            {timeSlots.map((slot, index) => (
              <div
                key={slot.time}
                className={`flex border-b border-gray-100 dark:border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-100/50 transition-colors ${
                  index % 2 === 0 ? "bg-white dark:bg-gray-50" : "bg-gray-25 dark:bg-gray-100/30"
                }`}
                style={{ height: `${ROW_HEIGHT_PX}px` }}
              >
                {/* Time Label */}
                <div className="w-24 flex-shrink-0 border-r border-gray-200 dark:border-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-700">
                    {slot.displayTime}
                  </span>
                </div>

                {/* Appointment Cells */}
                {columns.map((column) => {
                  const isDoctor = viewMode === "doctors" || (viewMode === "both" && doctors.some(d => d._id === column._id));
                  const doctorId = isDoctor ? column._id : undefined;
                  const roomId = !isDoctor ? column._id : undefined;
                  
                  const slotAppointments = getAppointmentsForSlot(
                    doctorId || "",
                    roomId || "",
                    slot.time
                  );

                  return (
                    <div
                      key={`${column._id}-${slot.time}`}
                      className="flex-1 min-w-[180px] border-r border-gray-200 dark:border-gray-300 p-1 relative group cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-100/20 transition-all duration-150"
                      onClick={() =>
                        handleSlotClick(doctorId, roomId, slot.time, slot.displayTime)
                      }
                    >
                      {slotAppointments.length > 0 ? (
                        <div className="space-y-1 h-full overflow-y-auto">
                          {slotAppointments.map((apt) => (
                            <AppointmentCard
                              key={apt._id}
                              appointment={apt}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditAppointment?.(apt);
                              }}
                              statusColor={getStatusColor(apt.status, customStatusColors)}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <BookingModalWrapper
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
            loadData();
            onBookAppointment?.({});
          }}
          doctorId={selectedSlot.doctorId || ""}
          roomId={selectedSlot.roomId || ""}
          slotTime={selectedSlot.time || ""}
          slotDisplayTime={selectedSlot.displayTime || ""}
          defaultDate={selectedDate}
          rooms={rooms}
          doctorStaff={doctors}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* Color Settings Panel */}
      {showColorSettings && showColorPanel && (
        <ColorSettingsPanel
          customColors={customStatusColors}
          onSave={(colors) => {
            setCustomStatusColors(colors);
          }}
          onClose={() => setShowColorPanel(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface SchedulerHeaderProps {
  clinicName: string;
  selectedDate: string;
  onNavigate: (direction: "prev" | "next") => void;
  onDateChange: (date: string) => void;
  onBook: () => void;
  onImport: () => void;
  onColorSettings: () => void;
  showColorSettings: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const SchedulerHeader: React.FC<SchedulerHeaderProps> = ({
  clinicName,
  selectedDate,
  onNavigate,
  onDateChange,
  onBook,
  onImport,
  onColorSettings,
  showColorSettings,
  isRefreshing = false,
  onRefresh,
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-300 bg-gradient-to-r from-blue-50 via-white to-purple-50 dark:from-gray-100 dark:via-gray-50 dark:to-gray-100 p-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-900">
                {clinicName}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-600">
                Appointment Schedule
              </p>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2 ml-6">
            <button
              onClick={() => onNavigate("prev")}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-200 border border-gray-200 dark:border-gray-300 transition-all hover:shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-700" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 text-sm font-medium text-gray-700 dark:text-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
            />
            <button
              onClick={() => onNavigate("next")}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-200 border border-gray-200 dark:border-gray-300 transition-all hover:shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-700" />
            </button>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-lg border border-gray-200 dark:border-gray-300 transition-all hover:shadow-sm ${
                isRefreshing 
                  ? 'bg-gray-100 dark:bg-gray-200 cursor-not-allowed' 
                  : 'bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200'
              }`}
              title="Refresh data"
            >
              <Loader2 className={`w-4 h-4 text-gray-600 dark:text-gray-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <button
            onClick={onImport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 transition-all hover:shadow-sm"
          >
            <Upload className="w-4 h-4 text-gray-600 dark:text-gray-700" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-800 hidden sm:inline">
              Import
            </span>
          </button>

          {showColorSettings && (
            <button
              onClick={onColorSettings}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:shadow-sm ${
                showColorSettings
                  ? "bg-purple-100 dark:bg-purple-200 border-purple-300 dark:border-purple-400"
                  : "bg-white dark:bg-gray-100 border-gray-200 dark:border-gray-300"
              }`}
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-700" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-800 hidden sm:inline">
                Colors
              </span>
            </button>
          )}

          <button
            onClick={onBook}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Book Appointment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FILTERS BAR
// ============================================================================

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  doctors: DoctorStaff[];
  rooms: Room[];
  selectedDoctorFilter: string;
  selectedRoomFilter: string;
  statusFilter: string;
  onDoctorFilterChange: (value: string) => void;
  onRoomFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  doctors,
  rooms,
  selectedDoctorFilter,
  selectedRoomFilter,
  statusFilter,
  onDoctorFilterChange,
  onRoomFilterChange,
  onStatusFilterChange,
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-300 p-3 bg-gray-50/50 dark:bg-gray-100/50">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 text-sm text-gray-700 dark:text-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-700" />
            </button>
          )}
        </div>

        {/* Doctor Filter */}
        <select
          value={selectedDoctorFilter}
          onChange={(e) => onDoctorFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 text-sm text-gray-700 dark:text-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
        >
          <option value="">All Doctors</option>
          {doctors.map((doc) => (
            <option key={doc._id} value={doc._id}>
              {doc.name}
            </option>
          ))}
        </select>

        {/* Room Filter */}
        <select
          value={selectedRoomFilter}
          onChange={(e) => onRoomFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 text-sm text-gray-700 dark:text-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
        >
          <option value="">All Rooms</option>
          {rooms.map((room) => (
            <option key={room._id} value={room._id}>
              {room.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 text-sm text-gray-700 dark:text-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
        >
          <option value="">All Statuses</option>
          {Object.keys(DEFAULT_STATUS_COLORS).map((status) => (
            <option key={status} value={status} className="capitalize">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {(searchQuery || selectedDoctorFilter || selectedRoomFilter || statusFilter) && (
          <button
            onClick={() => {
              onSearchChange("");
              onDoctorFilterChange("");
              onRoomFilterChange("");
              onStatusFilterChange("");
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-700 hover:bg-red-50 dark:hover:bg-red-100 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// APPOINTMENT CARD COMPONENT
// ============================================================================

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: (e: React.MouseEvent) => void;
  statusColor: StatusColor;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
  statusColor,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative p-2 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
      style={{
        backgroundColor: statusColor.bg,
        borderColor: statusColor.border,
        color: statusColor.text,
      }}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start gap-2">
        {/* Patient Initial Avatar */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm"
          style={{
            backgroundColor: `${statusColor.border}20`,
            color: statusColor.text,
          }}
        >
          {appointment.patientName.charAt(0).toUpperCase()}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs truncate">
            {appointment.patientName}
          </div>
          <div className="text-[10px] opacity-80 space-y-0.5">
            {appointment.patientEmrNumber && (
              <div className="truncate">EMR: {appointment.patientEmrNumber}</div>
            )}
            <div className="truncate">{appointment.followType}</div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <AppointmentTooltip appointment={appointment} statusColor={statusColor} />
      )}
    </div>
  );
};

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface AppointmentTooltipProps {
  appointment: Appointment;
  statusColor: StatusColor;
}

const AppointmentTooltip: React.FC<AppointmentTooltipProps> = ({
  appointment,
  statusColor,
}) => {
  return (
    <div
      className="fixed z-50 w-80 bg-white dark:bg-gray-50 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2"
      style={{
        pointerEvents: "none",
      }}
    >
      {/* Header with status color */}
      <div
        className="px-4 py-3 text-white"
        style={{ backgroundColor: statusColor.border }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">{appointment.patientName}</h3>
          <span className="text-[10px] uppercase tracking-wide opacity-90">
            {appointment.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Patient Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
            <User className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>{appointment.patientGender || "N/A"}</span>
          </div>
          {appointment.patientMobileNumber && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
              <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span>{appointment.patientMobileNumber}</span>
            </div>
          )}
          {appointment.patientEmail && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
              <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span className="truncate">{appointment.patientEmail}</span>
            </div>
          )}
          {appointment.patientEmrNumber && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
              <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span>EMR: {appointment.patientEmrNumber}</span>
            </div>
          )}
        </div>

        {/* Appointment Details */}
        <div className="border-t border-gray-200 dark:border-gray-300 pt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
            <Stethoscope className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>Dr. {appointment.doctorName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
            <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>{appointment.roomName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
            <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>
              {formatTime(appointment.fromTime)} - {formatTime(appointment.toTime)}
            </span>
          </div>
          {appointment.patientInvoiceNumber && (
            <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-800">
              <CreditCard className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <span>Invoice: {appointment.patientInvoiceNumber}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="border-t border-gray-200 dark:border-gray-300 pt-3">
            <p className="text-[10px] text-gray-600 dark:text-gray-700 italic">
              {appointment.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// BOOKING MODAL WRAPPER
// ============================================================================

interface BookingModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctorId: string;
  roomId: string;
  slotTime: string;
  slotDisplayTime: string;
  defaultDate: string;
  rooms: Room[];
  doctorStaff: DoctorStaff[];
  getAuthHeaders: () => Record<string, string>;
}

const BookingModalWrapper: React.FC<BookingModalWrapperProps> = ({
 
  onClose,
  onSuccess,
  doctorId,
  roomId,

  slotDisplayTime,
  defaultDate,
  rooms,
  doctorStaff,
  
}) => {
  // This would integrate with your existing AppointmentBookingModal
  // For now, showing a placeholder
  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-50 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-4">
              Book Appointment
            </h2>
            <p className="text-gray-600 dark:text-gray-700 mb-4">
              Integration with existing AppointmentBookingModal component
            </p>
            <div className="space-y-2 text-sm">
              <div><strong>Date:</strong> {defaultDate}</div>
              <div><strong>Time:</strong> {slotDisplayTime}</div>
              <div><strong>Doctor:</strong> {doctorStaff.find(d => d._id === doctorId)?.name || "N/A"}</div>
              <div><strong>Room:</strong> {rooms.find(r => r._id === roomId)?.name || "N/A"}</div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSuccess}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// ============================================================================
// COLOR SETTINGS PANEL
// ============================================================================

interface ColorSettingsPanelProps {
  customColors: Record<string, StatusColor>;
  onSave: (colors: Record<string, StatusColor>) => void;
  onClose: () => void;
}

const ColorSettingsPanel: React.FC<ColorSettingsPanelProps> = ({
  customColors,
  onSave,
  onClose,
}) => {
  const [localColors, setLocalColors] = useState(customColors);

  const handleColorChange = (status: string, colorType: keyof StatusColor, value: string) => {
    setLocalColors((prev) => ({
      ...prev,
      [status]: {
        ...prev[status] || DEFAULT_STATUS_COLORS[status] || DEFAULT_STATUS_COLORS.default,
        [colorType]: value,
      },
    }));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white dark:bg-gray-50 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-300 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Status Colors</h3>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(DEFAULT_STATUS_COLORS).map(([status, defaultColor]) => (
          <div key={status} className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-800 capitalize">
              {status}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["bg", "text", "border"] as const).map((type) => (
                <div key={type} className="space-y-1">
                  <div className="text-[10px] text-gray-500 dark:text-gray-600 capitalize">
                    {type}
                  </div>
                  <input
                    type="color"
                    value={
                      (localColors[status]?.[type as keyof StatusColor] as string) ||
                      defaultColor[type as keyof StatusColor]
                    }
                    onChange={(e) =>
                      handleColorChange(status, type, e.target.value)
                    }
                    className="w-full h-8 rounded border border-gray-200 dark:border-gray-300 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-300 flex gap-2">
        <button
          onClick={() => setLocalColors({})}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-300 bg-white dark:bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 text-sm font-medium transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => {
            onSave(localColors);
            onClose();
          }}
          className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default ModernScheduler;
