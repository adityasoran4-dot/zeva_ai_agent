import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  // Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Wifi,
  CreditCard,
  Sparkles,
  Palette,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";

// --- Static Data ---
// const SALON_INFO = {
//   name: "Mood Ladies Salon",
//   rating: 4.8,
//   reviews: 1639,
//   address: "North Podium Tower 2, Dubai Creek Harbour",
//   image:
//     "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=128&h=128&fit=crop",
// };

const ROOMS = [
  { id: "room1", name: "Premium Suite", amenities: ["Private", "Shower"] },
  { id: "room2", name: "Deluxe Room", amenities: ["Shared", "Standard"] },
  { id: "room3", name: "VIP Lounge", amenities: ["Private", "Jacuzzi"] },
];

const TIME_SLOTS = [
  "12:00 am",
  "12:15 am",
  "12:30 am",
  "12:45 am",
  "1:00 am",
  "1:15 am",
  "1:30 am",
  "1:45 am",
  "2:00 am",
  "2:15 am",
  "2:30 am",
  "2:45 am",
  "3:00 am",
  "3:15 am",
  "3:30 am",
  "3:45 am",
  "4:00 am",
  "4:15 am",
  "4:30 am",
  "4:45 am",
  "5:00 am",
  "5:15 am",
  "5:30 am",
  "5:45 am",
  "6:00 am",
  "6:15 am",
  "6:30 am",
  "6:45 am",
  "7:00 am",
  "7:15 am",
  "7:30 am",
  "7:45 am",
  "8:00 am",
  "8:15 am",
  "8:30 am",
  "8:45 am",
  "9:00 am",
  "9:15 am",
  "9:30 am",
  "9:45 am",
  "10:00 am",
  "10:15 am",
  "10:30 am",
  "10:45 am",
  "11:00 am",
  "11:15 am",
  "11:30 am",
  "11:45 am",
  "12:00 pm",
  "12:15 pm",
  "12:30 pm",
  "12:45 pm",
  "1:00 pm",
  "1:15 pm",
  "1:30 pm",
  "1:45 pm",
  "2:00 pm",
  "2:15 pm",
  "2:30 pm",
  "2:45 pm",
  "3:00 pm",
  "3:15 pm",
  "3:30 pm",
  "3:45 pm",
  "4:00 pm",
  "4:15 pm",
  "4:30 pm",
  "4:45 pm",
  "5:00 pm",
  "5:15 pm",
  "5:30 pm",
  "5:45 pm",
  "6:00 pm",
  "6:15 pm",
  "6:30 pm",
  "6:45 pm",
  "7:00 pm",
  "7:15 pm",
  "7:30 pm",
  "7:45 pm",
  "8:00 pm",
  "8:15 pm",
  "8:30 pm",
  "8:45 pm",
  "9:00 pm",
  "9:15 pm",
  "9:30 pm",
  "9:45 pm",
  "10:00 pm",
  "10:15 pm",
  "10:30 pm",
  "10:45 pm",
  "11:00 pm",
  "11:15 pm",
  "11:30 pm",
  "11:45 pm",
];

// Helper to generate calendar days
const getDaysInMay2026 = () => {
  const year = 2026;
  const month = 4; // May (0-indexed)
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  for (let i = 8; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date: i,
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      isToday: i === 8,
    });
  }
  return days.slice(0, 7);
};

// Theme presets
const THEMES = {
  rose: {
    name: "Rose",
    primary: "#f43f5e",
    primaryLight: "#ffe4e6",
    primaryDark: "#e11d48",
    secondary: "#fecdd3",
    gradientFrom: "#fff0f0",
    gradientTo: "#fff5f5",
  },
  emerald: {
    name: "Emerald",
    primary: "#10b981",
    primaryLight: "#d1fae5",
    primaryDark: "#059669",
    secondary: "#a7f3d0",
    gradientFrom: "#ecfdf5",
    gradientTo: "#f0fdfa",
  },
  blue: {
    name: "Ocean",
    primary: "#3b82f6",
    primaryLight: "#dbeafe",
    primaryDark: "#2563eb",
    secondary: "#bfdbfe",
    gradientFrom: "#eff6ff",
    gradientTo: "#f5f3ff",
  },
  purple: {
    name: "Purple",
    primary: "#8b5cf6",
    primaryLight: "#ede9fe",
    primaryDark: "#7c3aed",
    secondary: "#c4b5fd",
    gradientFrom: "#faf5ff",
    gradientTo: "#f5f3ff",
  },
  amber: {
    name: "Amber",
    primary: "#f59e0b",
    primaryLight: "#fef3c7",
    primaryDark: "#d97706",
    secondary: "#fde68a",
    gradientFrom: "#fffbeb",
    gradientTo: "#fefce8",
  },
  indigo: {
    name: "Indigo",
    primary: "#6366f1",
    primaryLight: "#e0e7ff",
    primaryDark: "#4f46e5",
    secondary: "#c7d2fe",
    gradientFrom: "#eef2ff",
    gradientTo: "#f8fafc",
  },
};

type ThemeKey = keyof typeof THEMES;

// Helper to create rgba color with opacity
const rgba = (hexColor: string, opacity: number) => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Type definitions
interface DayTiming {
  day: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  breakStart: string;
  breakEnd: string;
}

interface Service {
  _id: string;
  clinicId: string;
  departmentId: string;
  name: string;
  serviceSlug: string;
  price: number;
  clinicPrice: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AppointmentBookingPage = (): React.ReactNode => {
  const router = useRouter();
  const { clinicId = "" } = router.query || {};
  const [step, setStep] = useState<
    "doctor" | "service" | "datetime" | "confirm"
  >("doctor");
  const [services, setServices] = useState<Service[]>([]);
  const [doctor, setDoctor] = useState<{
    _id: string;
    name: string;
    email: string;
    phone: string;
    gender: string;
    age: number;
    dateOfBirth: string;
    role: string;
  } | null>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string | null>("");
  const [selectedDate, setSelectedDate] = useState<number>(
    new Date().getDate(),
  );
  const [selectedDay, setSelectedDay] = useState<string>(
    new Date().toLocaleDateString("en-US", { weekday: "long" }),
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    email: "",
    phone: "",
  });
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("rose");
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    success: boolean;
    message: string;
    appointment?: any;
  } | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const [totalServicePages, setTotalServicePages] = useState(0);
  const [totalServices, setTotalServices] = useState(0);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorPage, setDoctorPage] = useState(1);
  const [totalDoctorPages, setTotalDoctorPages] = useState(0);
  const [totalDoctors, setTotalDoctors] = useState(0);

  const days = useMemo(() => getDaysInMay2026(), []);

  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() =>
    new Date().getFullYear(),
  );
  const [startDay, setStartDay] = useState(() => new Date().getDate()); // Today's date

  const fetchServices = useCallback(async () => {
    if (!selectedDoctor) return;
    try {
      const { data } = await axios.get(
        `/api/appointment-booking/get-services/${selectedDoctor}?search=${serviceSearch}&page=${servicePage}&limit=10`,
      );
      if (data && data?.success) {
        setServices(data?.data?.services);
        setTotalServicePages(data?.data?.pagination?.totalPages || 0);
        setTotalServices(data?.data?.pagination?.totalServices || 0);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  }, [selectedDoctor, serviceSearch, servicePage]);

  const fetchDoctors = useCallback(async () => {
    if (!clinicId) return;
    try {
      const { data } = await axios.get(
        `/api/appointment-booking/get-doctors-by-clinic?clinicId=${clinicId}&search=${doctorSearch}&page=${doctorPage}&limit=10`,
      );
      if (data && data?.success) {
        setDoctors(data?.data?.doctors || []);
        setTotalDoctorPages(data?.data?.pagination?.totalPages || 0);
        setTotalDoctors(data?.data?.pagination?.totalDoctors || 0);
      } else {
        setError("No doctors found for this clinic");
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError("Failed to fetch doctors");
    }
  }, [clinicId, doctorSearch, doctorPage]);

  const fetchClinic = useCallback(async () => {
    try {
      if (!clinicId) return;
      const { data } = await axios.get(
        `/api/appointment-booking/get-clinic/${clinicId}`,
      );
      if (data && data?.success) {
        setClinic(data?.data || null);
      } else {
        setError("Clinic not found");
      }
    } catch (error) {
      console.error("Error fetching clinic:", error);
      setError("Clinic not found");
    }
  }, [clinicId]);

  // Convert 12-hour format to 24-hour format (e.g., "06:30 pm" -> "18:30")
  const convertTo24Hour = (time12h: string): string => {
    const timeMatch = time12h.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!timeMatch) return time12h;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toLowerCase();

    // Convert to 24-hour format
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    // Format as HH:MM
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  // Convert 24-hour format to 12-hour format (e.g., "18:30" -> "06:30 pm")
  const convertTo12Hour = (time24h: string): string => {
    const [hoursStr, minutesStr] = time24h.split(":");
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    const period = hours >= 12 ? "pm" : "am";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const fetchBookedSlots = useCallback(async () => {
    if (!selectedDoctor || !clinicId || !selectedDate) return;

    try {
      // Format date as YYYY-MM-DD to avoid timezone issues
      const appointmentDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
      const { data } = await axios.get(
        `/api/appointment-booking/get-booked-slots?doctorId=${selectedDoctor}&clinicId=${clinicId}&date=${appointmentDate}`,
      );
      if (data && data?.success) {
        // Convert 24-hour format booked slots to 12-hour format for comparison with TIME_SLOTS
        const bookedSlots12Hour = (data?.data?.bookedSlots || []).map(
          (slot: string) => {
            // Check if slot is in 24-hour format (HH:MM)
            if (/^\d{2}:\d{2}$/.test(slot)) {
              return convertTo12Hour(slot);
            }
            return slot; // Already in 12-hour format
          },
        );
        setBookedSlots(bookedSlots12Hour);
      }
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      setBookedSlots([]);
    }
  }, [selectedDoctor, clinicId, selectedDate, currentYear, currentMonth]);

  useEffect(() => {
    fetchDoctors();
    fetchClinic();
  }, [fetchDoctors, fetchClinic]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchServices();
    }
  }, [fetchServices, selectedDoctor]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  // Update doctor object when selectedDoctor changes
  useEffect(() => {
    if (selectedDoctor) {
      const selectedDoc = doctors.find((d) => d._id === selectedDoctor);
      if (selectedDoc) {
        setDoctor(selectedDoc);
      }
    }
  }, [selectedDoctor, doctors]);

  // Set loading state when data is fetched
  useEffect(() => {
    if (doctor !== null || clinic !== null || error) {
      setIsLoading(false);
    }
  }, [doctor, clinic, error]);

  // Auto-scroll clinic photos
  useEffect(() => {
    if (!clinic?.photos || clinic.photos.length <= 1) return;

    if (isAutoScrolling) {
      const interval = setInterval(() => {
        setCurrentPhotoIndex((prev) =>
          prev >= clinic.photos.length - 1 ? 0 : prev + 1,
        );
      }, 3000); // Change photo every 3 seconds

      return () => clearInterval(interval);
    }
  }, [clinic?.photos, isAutoScrolling]);

  const goToNextPhoto = () => {
    setIsAutoScrolling(false);
    setCurrentPhotoIndex((prev) =>
      prev >= (clinic?.photos?.length || 1) - 1 ? 0 : prev + 1,
    );
  };

  const goToPrevPhoto = () => {
    setIsAutoScrolling(false);
    setCurrentPhotoIndex((prev) =>
      prev <= 0 ? (clinic?.photos?.length || 1) - 1 : prev - 1,
    );
  };

  //   ------------------------------- GET TIME SLOTS START ----------------------------//
  // Helper function to convert time string to minutes for comparison
  const convertTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return null;

    // Handle formats like "09:00 AM", "10:00 pm", "12:05 PM"
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) {
      hours += 12;
    }
    if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  // Check if a slot falls within break time
  const isSlotInBreakTime = (
    slotMinutes: number,
    breakStartMinutes: number | null,
    breakEndMinutes: number | null,
  ): boolean => {
    if (breakStartMinutes === null || breakEndMinutes === null) return false;
    // Slot is in break if it's >= break start AND < break end
    return slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes;
  };

  const checkIsToday = (
    currentDate: number,
    currentMonth: number,
    currentYear: number,
  ): boolean => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    return (
      currentDate === todayDate &&
      currentMonth === todayMonth &&
      currentYear === todayYear
    );
  };

  // Main function - automatically detects current day and returns valid slots
  const getValidSlotsForDay = (
    timingsArray: DayTiming[],
    allTimeSlots: string[],
    day: string,
  ): string[] => {
    if (!day) return [];

    // Find timing for the selected day
    const dayTiming = timingsArray.find((timing) => timing.day === day);

    // If no timing found or day is closed, return empty array
    if (!dayTiming || !dayTiming.isOpen) {
      return [];
    }

    const openingMinutes = convertTimeToMinutes(dayTiming.openingTime);
    const closingMinutes = convertTimeToMinutes(dayTiming.closingTime);
    const breakStartMinutes = convertTimeToMinutes(dayTiming.breakStart);
    const breakEndMinutes = convertTimeToMinutes(dayTiming.breakEnd);

    // If opening or closing time is invalid, return empty array
    if (openingMinutes === null || closingMinutes === null) {
      return [];
    }

    // Check if the selected date is today
    const isToday = checkIsToday(selectedDate, currentMonth, currentYear);

    // Get current time in minutes only if checking today
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Filter slots based on timing
    const validSlots = allTimeSlots.filter((slot) => {
      const slotMinutes = convertTimeToMinutes(slot);

      if (slotMinutes === null) return false;

      // Check if slot is within opening and closing hours
      const isWithinHours =
        slotMinutes >= openingMinutes && slotMinutes <= closingMinutes;

      // For today: only show future slots (not past)
      // For future dates: show all slots within hours (including past times of that day)
      const isValidTime = isToday
        ? slotMinutes > currentMinutes // Future slots only for today
        : true; // All slots for future dates

      // Check if slot is within break time - EXCLUDE these slots
      const isInBreak = isSlotInBreakTime(
        slotMinutes,
        breakStartMinutes,
        breakEndMinutes,
      );

      // Return true only if within hours, valid time, and NOT in break
      return isWithinHours && isValidTime && !isInBreak;
    });

    // Filter out booked slots
    const filteredSlots = validSlots.filter(
      (slot) => !bookedSlots.includes(slot),
    );

    return filteredSlots;
  };

  //   ------------------------------- GET TIME SLOTS END ----------------------------//

  // Get current date for comparison
  const getCurrentDate = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    };
  };

  // Check if a date is in the past
  const isPastDate = (year: number, month: number, day: number) => {
    const current = getCurrentDate();
    if (year < current.year) return true;
    if (year > current.year) return false;
    if (month < current.month) return true;
    if (month > current.month) return false;
    return day < current.day;
  };

  // Check if current view has any future dates
  const hasFutureDates = () => {
    const days = getCalendarDays();
    return days.some((day) => {
      return !isPastDate(currentYear, currentMonth, day.date);
    });
  };

  // Helper to get days for current view
  const getCalendarDays = () => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const days = [];

    for (
      let i = startDay;
      i <= Math.min(startDay + 6, lastDay.getDate());
      i++
    ) {
      const date = new Date(currentYear, currentMonth, i);
      days.push({
        date: i,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        longDay: date.toLocaleDateString("en-US", { weekday: "long" }),
        isToday: i === 8 && currentMonth === 4 && currentYear === 2026,
      });
    }
    return days;
  };

  // Check if can go to previous week (avoid going into past-only weeks)
  const canGoPrevious = () => {
    const newStartDay = startDay - 7;
    let checkYear = currentYear;
    let checkMonth = currentMonth;
    let checkStartDay = newStartDay;

    if (newStartDay < 1) {
      let newMonth = currentMonth - 1;
      let newYear = currentYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      }
      const prevMonthLastDay = new Date(newYear, newMonth + 1, 0).getDate();
      checkStartDay = prevMonthLastDay + newStartDay;
      checkMonth = newMonth;
      checkYear = newYear;
    }

    // Check if the proposed week has any future dates
    for (let i = 0; i < 7; i++) {
      const dayNum = checkStartDay + i;
      let year = checkYear;
      let month = checkMonth;
      let day = dayNum;

      if (dayNum > new Date(year, month + 1, 0).getDate()) {
        day = dayNum - new Date(year, month + 1, 0).getDate();
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }

      if (!isPastDate(year, month, day)) {
        return true; // Found a future date
      }
    }
    return false; // All dates in that week are past
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStartDay = startDay - 7;
    // const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (newStartDay >= 1) {
      setStartDay(newStartDay);
    } else {
      // Go to previous month
      let newMonth = currentMonth - 1;
      let newYear = currentYear;

      if (newMonth < 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      }

      const prevMonthLastDay = new Date(newYear, newMonth + 1, 0).getDate();
      const newStart = prevMonthLastDay + newStartDay;
      setStartDay(newStart);
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    }
    setSelectedDate(new Date().getDate()); // Reset selected date when navigating
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newStartDay = startDay + 7;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (newStartDay <= lastDay) {
      setStartDay(newStartDay);
    } else {
      // Go to next month
      let newMonth = currentMonth + 1;
      let newYear = currentYear;

      if (newMonth > 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      }

      const newStart = newStartDay - lastDay;
      setStartDay(newStart);
      setCurrentMonth(newMonth);
      setCurrentYear(newYear);
    }
    setSelectedDate(new Date().getDate()); // Reset selected date when navigating
  };

  // Get month name
  const getMonthName = () => {
    return new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
      month: "long",
    });
  };

  // Get current primary color
  const getCurrentPrimaryColor = () => {
    if (customColor) return customColor;
    return THEMES[currentTheme].primary;
  };

  const getCurrentPrimaryLight = () => {
    if (customColor) return rgba(customColor, 0.1);
    return rgba(THEMES[currentTheme].primary, 0.1);
  };

  const selectedServiceData = services.find((s) => s?._id === selectedService);
  const totalPrice = selectedServiceData?.price || 0;

  const handleContinue = async () => {
    if (step === "doctor" && selectedDoctor) {
      setStep("service");
    } else if (step === "service" && selectedService) {
      setStep("datetime");
    } else if (step === "datetime" && selectedTime && selectedDate) {
      setStep("confirm");
    } else if (step === "confirm") {
      await handleBooking();
    }
  };

  // Calculate toTime by adding service duration to selectedTime
  const calculateToTime = (fromTime: string, durationMinutes: number) => {
    // Parse the time string (e.g., "4:30 pm")
    const timeMatch = fromTime.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!timeMatch) return fromTime;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toLowerCase();

    // Convert to 24-hour format
    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    // Add duration
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const toHours = Math.floor(totalMinutes / 60) % 24;
    const toMinutes = totalMinutes % 60;

    // Convert back to 12-hour format
    const toPeriod = toHours >= 12 ? "pm" : "am";
    const displayHours = toHours % 12 || 12;
    const displayMinutes = toMinutes.toString().padStart(2, "0");

    return `${displayHours}:${displayMinutes} ${toPeriod}`;
  };

  const handleBooking = async () => {
    if (!selectedServiceData || !selectedTime || !selectedDoctor || !clinicId) {
      setBookingResult({
        success: false,
        message: "Missing required information",
      });
      return;
    }

    setIsBooking(true);
    setBookingResult(null);

    try {
      // Construct the appointment date in YYYY-MM-DD format to avoid timezone issues
      const appointmentDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;

      // Convert times to 24-hour format for API
      const fromTime24 = convertTo24Hour(selectedTime);

      // Calculate toTime in 24-hour format
      const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(am|pm)/i);
      let fromHours = parseInt(timeMatch![1]);
      const fromMinutes = parseInt(timeMatch![2]);
      const period = timeMatch![3].toLowerCase();

      // Convert to 24-hour format
      if (period === "pm" && fromHours !== 12) fromHours += 12;
      if (period === "am" && fromHours === 12) fromHours = 0;

      // Add duration to get toTime in 24-hour format
      const durationMinutes = selectedServiceData.durationMinutes || 0;
      const totalMinutes = fromHours * 60 + fromMinutes + durationMinutes;
      const toHours24 = Math.floor(totalMinutes / 60) % 24;
      const toMinutes24 = totalMinutes % 60;
      const toTime24 = `${String(toHours24).padStart(2, "0")}:${String(toMinutes24).padStart(2, "0")}`;

      const response = await axios.post(
        `/api/appointment-booking?doctorId=${selectedDoctor}&clinicId=${clinicId}`,
        {
          startDate: appointmentDate,
          fromTime: fromTime24,
          toTime: toTime24,
          serviceId: selectedService,
          patientDetails: {
            firstName: customerInfo.firstName,
            lastName: customerInfo.lastName,
            gender: customerInfo.gender,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      );

      if (response.data.success) {
        setBookingResult({
          success: true,
          message: "Appointment booked successfully!",
          appointment: response.data.data,
        });
      } else {
        setBookingResult({
          success: false,
          message: response.data.message || "Booking failed",
        });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      setBookingResult({
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to book appointment. Please try again.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleResetBooking = () => {
    fetchBookedSlots();
    setBookingResult(null);
    setStep("doctor");
    setSelectedDoctor(null);
    setDoctor(null);
    setSelectedService("");
    setSelectedTime(null);
    setSelectedRoom(null);
    setCustomerInfo({
      firstName: "",
      lastName: "",
      gender: "",
      email: "",
      phone: "",
    });
  };

  const handleBack = () => {
    if (step === "service") setStep("doctor");
    else if (step === "datetime") setStep("service");
    else if (step === "confirm") setStep("datetime");
  };

  const canContinue = () => {
    if (step === "doctor") return !!selectedDoctor;
    if (step === "service") return !!selectedService;
    if (step === "datetime") return !!selectedTime && !!selectedDate;
    if (step === "confirm") {
      return (
        customerInfo.firstName.trim() !== "" &&
        customerInfo.lastName.trim() !== "" &&
        customerInfo.gender.trim() !== "" &&
        customerInfo.phone.trim() !== ""
      );
    }
    return true;
  };

  const handleCustomColor = () => {
    const color = prompt(
      "Enter a hex color code (e.g., #ff6b6b or #f43f5e):",
      "#f43f5e",
    );
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      setCustomColor(color);
      //   if (onThemeChange) onThemeChange(currentTheme);
    } else if (color) {
      alert("Please enter a valid hex color code (e.g., #ff6b6b)");
    }
    setShowThemePicker(false);
  };

  const handleThemeChange = (themeKey: ThemeKey) => {
    setCurrentTheme(themeKey);
    setCustomColor(null);

    setShowThemePicker(false);
  };

  const primaryColor = getCurrentPrimaryColor();
  const primaryLight = getCurrentPrimaryLight();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-rose-500 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{error}</h2>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              {error === "Doctor not found"
                ? "The doctor you're looking for doesn't exist or may have been removed."
                : "The clinic you're looking for doesn't exist or may have been removed."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.back()}
                className="w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: primaryColor,
                  color: "white",
                }}
              >
                Go Back
              </button>
              <button
                onClick={() => router.push("/")}
                className="w-full px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans transition-all duration-300"
      style={{
        background: customColor
          ? `linear-gradient(135deg, ${rgba(customColor, 0.05)} 0%, #ffffff 50%, ${rgba(customColor, 0.03)} 100%)`
          : `linear-gradient(135deg, ${THEMES[currentTheme].gradientFrom} 0%, #ffffff 50%, ${THEMES[currentTheme].gradientTo} 100%)`,
      }}
    >
      {/* Theme Picker Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2 group"
            style={{ color: primaryColor }}
          >
            <Palette className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              Customize
            </span>
          </button>

          {showThemePicker && (
            <div className="absolute bottom-14 right-0 bg-white rounded-xl shadow-xl border border-gray-100 p-3 w-48 animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
              <p className="text-xs font-medium text-gray-500 mb-2 px-2">
                Select Theme
              </p>
              <div className="space-y-1">
                {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-3 ${
                      currentTheme === key && !customColor
                        ? "bg-gray-100 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                    style={
                      currentTheme === key && !customColor
                        ? { color: THEMES[key].primary }
                        : { color: "gray" }
                    }
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: THEMES[key].primary }}
                    />
                    {THEMES[key].name}
                    {currentTheme === key && !customColor && (
                      <CheckCircle className="w-3.5 h-3.5 ml-auto" />
                    )}
                  </button>
                ))}
                <div className="border-t my-2"></div>
                <button
                  onClick={handleCustomColor}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-3"
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-400 to-blue-500" />
                  Custom Color
                  {customColor && (
                    <CheckCircle
                      className="w-3.5 h-3.5 ml-auto"
                      style={{ color: customColor }}
                    />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-16">
        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span
              className={step === "doctor" ? "font-semibold" : ""}
              style={step === "doctor" ? { color: primaryColor } : {}}
            >
              Doctor
            </span>
            <ChevronRight className="w-3 h-3" />
            <span
              className={step === "service" ? "font-semibold" : ""}
              style={step === "service" ? { color: primaryColor } : {}}
            >
              Services
            </span>
            <ChevronRight className="w-3 h-3" />
            <span
              className={step === "datetime" ? "font-semibold" : ""}
              style={step === "datetime" ? { color: primaryColor } : {}}
            >
              Date & Time
            </span>
            <ChevronRight className="w-3 h-3" />
            <span
              className={step === "confirm" ? "font-semibold" : ""}
              style={step === "confirm" ? { color: primaryColor } : {}}
            >
              Confirm
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Book Appointment
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Step 1: Doctor Selection */}
              {step === "doctor" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                    <User className="w-5 h-5" style={{ color: primaryColor }} />
                    Choose your doctor
                  </h2>

                  {/* Search Bar */}
                  <div className="mb-5">
                    <div className="relative">
                      <input
                        type="text"
                        value={doctorSearch}
                        onChange={(e) => {
                          setDoctorSearch(e.target.value);
                          setDoctorPage(1); // Reset to page 1 on search
                        }}
                        placeholder="Search doctors..."
                        className="w-full px-4 py-3 pl-10 text-gray-700 rounded-xl border border-gray-200 focus:outline-none transition"
                        style={{ borderColor: primaryColor }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = primaryColor)
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Doctors Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {doctors.length > 0 ? (
                      doctors.map((doc) => (
                        <button
                          key={doc._id}
                          onClick={() => setSelectedDoctor(doc._id)}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                            selectedDoctor === doc._id
                              ? "shadow-md"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          style={
                            selectedDoctor === doc._id
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: primaryLight,
                                }
                              : {}
                          }
                        >
                          {/* Doctor Avatar */}
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: primaryLight }}
                          >
                            <User
                              className="w-8 h-8"
                              style={{ color: primaryColor }}
                            />
                          </div>

                          {/* Doctor Info */}
                          <div className="text-left flex-1">
                            <p className="font-medium text-gray-800">
                              {doc.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="capitalize">{doc.gender}</span>
                              {doc.age && (
                                <>
                                  <span>•</span>
                                  <span>{doc.age} years</span>
                                </>
                              )}
                            </div>
                            {selectedDoctor === doc._id && (
                              <CheckCircle
                                className="w-4 h-4 mt-1"
                                style={{ color: primaryColor }}
                              />
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">
                          {doctorSearch
                            ? "No doctors found"
                            : "No doctors available"}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {doctorSearch
                            ? "Try a different search term"
                            : "Please contact the clinic for more information"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalDoctorPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {doctors.length} of {totalDoctors} doctors
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDoctorPage((prev) => prev - 1)}
                          disabled={doctorPage === 1}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor:
                              doctorPage === 1 ? "#f3f4f6" : primaryLight,
                            color: doctorPage === 1 ? "#9ca3af" : primaryColor,
                          }}
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, totalDoctorPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalDoctorPages <= 5) {
                                pageNum = i + 1;
                              } else if (doctorPage <= 3) {
                                pageNum = i + 1;
                              } else if (doctorPage >= totalDoctorPages - 2) {
                                pageNum = totalDoctorPages - 4 + i;
                              } else {
                                pageNum = doctorPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setDoctorPage(pageNum)}
                                  className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                                  style={{
                                    backgroundColor:
                                      doctorPage === pageNum
                                        ? primaryColor
                                        : "#f3f4f6",
                                    color:
                                      doctorPage === pageNum
                                        ? "white"
                                        : "#374151",
                                  }}
                                >
                                  {pageNum}
                                </button>
                              );
                            },
                          )}
                        </div>
                        <button
                          onClick={() => setDoctorPage((prev) => prev + 1)}
                          disabled={doctorPage === totalDoctorPages}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor:
                              doctorPage === totalDoctorPages
                                ? "#f3f4f6"
                                : primaryLight,
                            color:
                              doctorPage === totalDoctorPages
                                ? "#9ca3af"
                                : primaryColor,
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Service Selection */}
              {step === "service" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                    <Scissors
                      className="w-5 h-5"
                      style={{ color: primaryColor }}
                    />
                    Choose your service
                  </h2>

                  {/* Search Bar */}
                  <div className="mb-5">
                    <div className="relative">
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => {
                          setServiceSearch(e.target.value);
                          setServicePage(1); // Reset to page 1 on search
                        }}
                        placeholder="Search services..."
                        className="w-full px-4 py-3 pl-10 text-gray-700 rounded-xl border border-gray-200 focus:outline-none transition"
                        style={{ borderColor: primaryColor }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = primaryColor)
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.length > 0 ? (
                      services.map((service) => (
                        <button
                          key={service._id}
                          onClick={() => setSelectedService(service._id)}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            selectedService === service._id
                              ? "shadow-md"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          style={
                            selectedService === service._id
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: primaryLight,
                                }
                              : {}
                          }
                        >
                          <div className="text-left">
                            <p className="font-medium text-gray-800">
                              {service.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{service?.durationMinutes || 0} mins</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              {clinic?.currency || "AED"}{" "}
                              {service?.price || 0.0}
                            </p>
                            {selectedService === service?._id && (
                              <CheckCircle
                                className="w-4 h-4"
                                style={{ color: primaryColor }}
                              />
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500">
                        <Scissors className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="font-medium">
                          {serviceSearch
                            ? "No services found"
                            : "No services available"}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {serviceSearch
                            ? "Try a different search term"
                            : "Please contact the clinic for more information"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalServicePages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Showing {services.length} of {totalServices} services
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setServicePage((prev) => prev - 1)}
                          disabled={servicePage === 1}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor:
                              servicePage === 1 ? "#f3f4f6" : primaryLight,
                            color: servicePage === 1 ? "#9ca3af" : primaryColor,
                          }}
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, totalServicePages) },
                            (_, i) => {
                              let pageNum;
                              if (totalServicePages <= 5) {
                                pageNum = i + 1;
                              } else if (servicePage <= 3) {
                                pageNum = i + 1;
                              } else if (servicePage >= totalServicePages - 2) {
                                pageNum = totalServicePages - 4 + i;
                              } else {
                                pageNum = servicePage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setServicePage(pageNum)}
                                  className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                                  style={{
                                    backgroundColor:
                                      servicePage === pageNum
                                        ? primaryColor
                                        : "#f3f4f6",
                                    color:
                                      servicePage === pageNum
                                        ? "white"
                                        : "#374151",
                                  }}
                                >
                                  {pageNum}
                                </button>
                              );
                            },
                          )}
                        </div>
                        <button
                          onClick={() => setServicePage((prev) => prev + 1)}
                          disabled={servicePage === totalServicePages}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor:
                              servicePage === totalServicePages
                                ? "#f3f4f6"
                                : primaryLight,
                            color:
                              servicePage === totalServicePages
                                ? "#9ca3af"
                                : primaryColor,
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Date, Time & Room Selection */}
              {step === "datetime" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                    <Calendar
                      className="w-5 h-5"
                      style={{ color: primaryColor }}
                    />
                    Select Date & Time
                  </h2>

                  {/* Calendar Row */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        {getMonthName()} {currentYear}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={goToPreviousWeek}
                          disabled={!canGoPrevious()}
                          className={`p-1 rounded-full transition-colors ${
                            canGoPrevious()
                              ? "text-gray-500 hover:bg-gray-100 cursor-pointer"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={goToNextWeek}
                          disabled={!hasFutureDates()}
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    ;
                    <div className="grid grid-cols-7 gap-2">
                      {getCalendarDays().map((day) => (
                        <button
                          key={day.date}
                          onClick={() => {
                            setSelectedDate(day.date);
                            setSelectedDay(day.longDay);
                          }}
                          className="text-center py-2 rounded-xl transition-all"
                          style={
                            selectedDate === day.date
                              ? {
                                  backgroundColor: primaryColor,
                                  color: "white",
                                }
                              : { backgroundColor: "#f9fafb", color: "#374151" }
                          }
                        >
                          <div className="text-xs font-medium">{day.day}</div>
                          <div className="text-lg font-bold">{day.date}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock
                        className="w-4 h-4"
                        style={{ color: primaryColor }}
                      />
                      <span className="text-sm font-medium text-gray-600">
                        Available time slots
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {getValidSlotsForDay(
                        clinic?.timings || [],
                        TIME_SLOTS,
                        selectedDay,
                      ).length > 0 ? (
                        getValidSlotsForDay(
                          clinic?.timings || [],
                          TIME_SLOTS,
                          selectedDay,
                        ).map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className="py-2.5 rounded-xl text-sm font-medium transition-all"
                            style={
                              selectedTime === slot
                                ? {
                                    backgroundColor: primaryColor,
                                    color: "white",
                                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                                  }
                                : {
                                    backgroundColor: "#f9fafb",
                                    color: "#374151",
                                    border: "1px solid #f3f4f6",
                                  }
                            }
                          >
                            {slot}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium">No available time slots</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {bookedSlots.length > 0
                              ? "All slots are booked for this day"
                              : "The clinic is closed on this day"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Result Card */}
              {bookingResult && (
                <div className="p-6">
                  <div
                    className={`rounded-2xl border-2 p-8 ${
                      bookingResult.success
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="text-center">
                      {/* Icon */}
                      <div
                        className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                          bookingResult.success ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {bookingResult.success ? (
                          <CheckCircle
                            className="w-12 h-12"
                            style={{ color: "#10b981" }}
                          />
                        ) : (
                          <svg
                            className="w-12 h-12"
                            style={{ color: "#ef4444" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-2xl font-bold mb-2 ${
                          bookingResult.success
                            ? "text-green-800"
                            : "text-red-800"
                        }`}
                      >
                        {bookingResult.success
                          ? "Booking Confirmed!"
                          : "Booking Failed"}
                      </h3>

                      {/* Message */}
                      <p
                        className={`text-sm mb-6 ${
                          bookingResult.success
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {bookingResult.message}
                      </p>

                      {/* Success Details */}
                      {bookingResult.success && bookingResult.appointment && (
                        <div className="bg-white rounded-xl p-4 mb-6 text-left">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">
                                Service
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                {selectedServiceData?.name}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">
                                Date & Time
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                {selectedDay}, {selectedDate} {getMonthName()}{" "}
                                {currentYear} at {selectedTime} -{" "}
                                {calculateToTime(
                                  selectedTime || "",
                                  selectedServiceData?.durationMinutes || 0,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">
                                Doctor
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                {doctor?.name}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-sm text-gray-600">
                                Patient
                              </span>
                              <span className="text-sm font-semibold text-gray-800">
                                {customerInfo.firstName} {customerInfo.lastName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                Amount
                              </span>
                              <span
                                className="text-lg font-bold"
                                style={{ color: primaryColor }}
                              >
                                {clinic?.currency || "AED"}{" "}
                                {selectedServiceData?.price || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={handleResetBooking}
                        className="px-8 py-3 rounded-xl font-semibold shadow-md transition-all hover:shadow-lg"
                        style={{
                          backgroundColor: primaryColor,
                          color: "white",
                        }}
                      >
                        {bookingResult.success
                          ? "Book Another Appointment"
                          : "Try Again"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Patient Info & Confirm */}
              {step === "confirm" && !bookingResult && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                    <User className="w-5 h-5" style={{ color: primaryColor }} />
                    Patient Details
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.firstName}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="Enter first name"
                          className="w-full px-4 py-3 text-gray-500 rounded-xl border border-gray-200 focus:outline-none transition"
                          style={{ borderColor: primaryColor }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = primaryColor)
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = "#e5e7eb")
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={customerInfo.lastName}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Enter last name"
                          className="w-full px-4 py-3 text-gray-500 rounded-xl border border-gray-200 focus:outline-none transition"
                          style={{ borderColor: primaryColor }}
                          onFocus={(e) =>
                            (e.target.style.borderColor = primaryColor)
                          }
                          onBlur={(e) =>
                            (e.target.style.borderColor = "#e5e7eb")
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={customerInfo.gender}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            gender: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 text-gray-500 rounded-xl border border-gray-200 focus:outline-none transition"
                        style={{ borderColor: primaryColor }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = primaryColor)
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+971 XX XXX XXXX"
                        className="w-full px-4 py-3 text-gray-500 rounded-xl border border-gray-200 focus:outline-none transition"
                        style={{ borderColor: primaryColor }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = primaryColor)
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            email: e.target.value,
                          })
                        }
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 text-gray-500 rounded-xl border border-gray-200 focus:outline-none transition"
                        style={{ borderColor: primaryColor }}
                        onFocus={(e) =>
                          (e.target.style.borderColor = primaryColor)
                        }
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    <div
                      className="mt-6 rounded-xl p-4"
                      style={{ backgroundColor: primaryLight }}
                    >
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Booking notes
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        • A confirmation will be sent via SMS/Email
                        <br />
                        • Please arrive 5 minutes before your appointment
                        <br />• Free cancellation up to 2 hours before
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {step !== "doctor" && !bookingResult ? (
                <button
                  onClick={handleBack}
                  disabled={isBooking}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              {!bookingResult && (
                <button
                  onClick={handleContinue}
                  disabled={!canContinue() || isBooking}
                  className="px-8 py-3 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{
                    backgroundColor:
                      canContinue() && !isBooking ? primaryColor : "#d1d5db",
                    color: "white",
                  }}
                >
                  {isBooking ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
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
                      Booking...
                    </>
                  ) : step === "confirm" ? (
                    "Confirm Booking"
                  ) : (
                    "Continue"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar - Summary & Salon Info */}
          <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
            {/* Modern Salon/Clinic Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
              {/* Full Width Image Carousel */}
              <div className="relative h-40 w-full overflow-hidden">
                {clinic?.photos && clinic.photos.length > 0 ? (
                  <>
                    {/* Photo Container */}
                    <div
                      className="flex transition-transform duration-500 ease-in-out h-full"
                      style={{
                        transform: `translateX(-${currentPhotoIndex * 100}%)`,
                      }}
                    >
                      {clinic.photos.map((photo: string, index: number) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`${clinic?.name || "Clinic"} - Photo ${index + 1}`}
                          className="w-full h-full object-cover flex-shrink-0"
                        />
                      ))}
                    </div>

                    {/* Navigation Arrows */}
                    {clinic.photos.length > 1 && (
                      <>
                        <button
                          onClick={goToPrevPhoto}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                          style={{ opacity: 0.8 }}
                          onMouseEnter={() => setIsAutoScrolling(false)}
                          onMouseLeave={() => setIsAutoScrolling(true)}
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={goToNextPhoto}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-all opacity-0 group-hover:opacity-100"
                          style={{ opacity: 0.8 }}
                          onMouseEnter={() => setIsAutoScrolling(false)}
                          onMouseLeave={() => setIsAutoScrolling(true)}
                        >
                          <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>
                      </>
                    )}

                    {/* Photo Indicators */}
                    {clinic.photos.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {clinic.photos?.map((_: any, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              setIsAutoScrolling(false);
                              setCurrentPhotoIndex(index);
                            }}
                            className={`rounded-full transition-all duration-300 ${
                              index === currentPhotoIndex
                                ? "w-6 h-2 bg-white"
                                : "w-2 h-2 bg-white/60 hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=400&fit=crop"
                    alt={clinic?.name || "Salon"}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Rating Badge */}
                {/* <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-md">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-gray-800">
                    {SALON_INFO.rating}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({SALON_INFO.reviews})
                  </span>
                </div> */}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title & Category */}
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-800">
                    {clinic?.name || "YARD Barber and Shop"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {clinic?.tagline || "No tagline provided"}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {clinic?.address || "No address provided"}
                  </p>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  {clinic?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <a
                        href={`tel:${clinic.phone}`}
                        className="text-xs text-gray-600 hover:text-gray-900 transition"
                      >
                        {clinic.phone}
                      </a>
                    </div>
                  )}
                  {clinic?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <a
                        href={`mailto:${clinic.email}`}
                        className="text-xs text-gray-600 hover:text-gray-900 transition truncate"
                      >
                        {clinic.email}
                      </a>
                    </div>
                  )}
                  {clinic?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-600 hover:text-gray-900 transition truncate"
                      >
                        {clinic.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Free WiFi
                  </span>
                  <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Card Payment
                  </span>
                  <span className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />{" "}
                    {clinic?.timings?.length > 0 &&
                    clinic?.timings?.find((t: any) => t?.day === selectedDay)
                      ? `${clinic?.timings?.find((t: any) => t?.day === selectedDay)?.openingTime} - ${clinic?.timings?.find((t: any) => t?.day === selectedDay)?.closingTime}`
                      : ""}
                  </span>
                </div>

                {/* Action Button */}
                <button
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                  style={{
                    backgroundColor: primaryColor,
                    color: "white",
                  }}
                  onClick={() => window.open(`tel:${clinic?.phone}`, "_blank")}
                >
                  Call Now
                </button>
              </div>
            </div>
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle
                  className="w-5 h-5"
                  style={{ color: primaryColor }}
                />
                Your Selection
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800">
                      {selectedServiceData?.name}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />{" "}
                      {selectedServiceData?.durationMinutes || 0} mins with{" "}
                      {(doctor && doctor.name) || ""}
                    </p>
                  </div>
                  <p className="font-bold" style={{ color: primaryColor }}>
                    {clinic?.currency || "AED"} {selectedServiceData?.price}
                  </p>
                </div>

                {selectedTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="font-medium text-gray-800">
                      {days.find((d) => d.date === selectedDate)?.day}, May{" "}
                      {selectedDate} • {selectedTime} -{" "}
                      {calculateToTime(
                        selectedTime,
                        selectedServiceData?.durationMinutes || 0,
                      )}
                    </span>
                  </div>
                )}

                {selectedRoom && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Room</span>
                    <span className="font-medium text-gray-800">
                      {ROOMS.find((r) => r.id === selectedRoom)?.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stylist</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: primaryLight }}
                    >
                      <User
                        className="w-3 h-3"
                        style={{ color: primaryColor }}
                      />
                    </div>
                    <span className="font-medium text-gray-800">
                      {(doctor && doctor.name) || ""}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t-2 border-dashed border-gray-200">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-400">Total</span>
                    <span className="text-xl" style={{ color: primaryColor }}>
                      {clinic?.currency || "AED"} {totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 text-center">
                    Taxes & fees included
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingPage;

AppointmentBookingPage.getLayout = function PageLayout(page: React.ReactNode) {
  return page;
};
